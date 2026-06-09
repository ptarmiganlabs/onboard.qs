import { driver } from 'driver.js';
import logger from '../util/logger';
import { markdownToHtml, stripHtml } from '../util/markdown';
import { getObjectSelectorSync, detectPlatformType } from '../platform/index';
import { markTourSeen } from './tour-storage';
import { isVisible } from '../util/visibility';
import { getTabInfo, ensureTabVisibleSync, ensureTabVisible } from '../util/tab-switcher';
import { extensionState } from '../util/extension-state';

const DIALOG_SIZES = new Set(['dynamic', 'small', 'medium', 'large', 'x-large', 'custom']);

/**
 * Tour runner — builds driver.js step configurations from the extension
 * layout and manages tour execution.
 */

/**
 * Return the configured dialog size for a step.
 *
 * Steps without a saved dialog size are treated as "dynamic" so older
 * extension instances keep their previous behavior until migrated.
 *
 * @param {object} step - Step configuration from tour config.
 * @returns {string} Safe dialog size name.
 */
function getStepDialogSize(step) {
    const size = typeof step?.dialogSize === 'string' ? step.dialogSize : '';
    if (DIALOG_SIZES.has(size)) return size;
    return 'dynamic';
}

/**
 * Clamp a custom dialog dimension to a safe integer pixel value.
 *
 * @param {number|string} value - Candidate pixel value.
 * @param {number} fallback - Default if value is invalid.
 * @param {number} min - Minimum allowed value.
 * @param {number} max - Maximum allowed value.
 * @returns {number} Sanitized pixel value.
 */
function clampDialogDimension(value, fallback, min, max) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.min(max, Math.max(min, Math.round(numeric)));
}

/**
 * Build dialog size settings for a step popover.
 *
 * @param {object} step - Step configuration from tour config.
 * @returns {{popoverClass: string, onPopoverRender?: (popover: {wrapper?: HTMLElement}) => void}} Popover size settings.
 */
function getStepDialogSettings(step) {
    const size = getStepDialogSize(step);
    const settings = {
        popoverClass: `onboard-qs-popover onboard-qs-dialog-${size}`,
    };
    if (size === 'custom') {
        const width = clampDialogDimension(step.customDialogWidth, 500, 200, 1200);
        const height = clampDialogDimension(step.customDialogHeight, 350, 100, 900);
        /**
         * Apply custom size to the rendered driver.js popover.
         *
         * @param {{wrapper?: HTMLElement}} popover - The rendered popover object.
         */
        settings.onPopoverRender = (popover) => {
            if (popover?.wrapper) {
                popover.wrapper.style.width = `${width}px`;
                popover.wrapper.style.maxWidth = `${width}px`;
                popover.wrapper.style.minHeight = `${height}px`;
            }
        };
    }
    return settings;
}

/**
 * Build driver.js steps from a tour configuration.
 *
 * @param {object} tourConfig - A single tour from the layout's tours array.
 * @param {string} platformType - 'client-managed' or 'cloud'
 * @param {string} [codePath] - Code-path name for selector lookup (e.g. 'default').
 * @param {object} [options] - Additional options.
 * @param {string} [options.allowedUriPatterns] - Comma-separated URL prefixes for media sources.
 * @returns {Array<object>} Array of driver.js DriveStep objects.
 */
export function buildDriverSteps(tourConfig, platformType, codePath, options) {
    if (!tourConfig.steps || !Array.isArray(tourConfig.steps)) {
        return [];
    }

    return (
        tourConfig.steps
            .filter((step) => isVisible(step.showCondition))
            .filter((step) => {
                if (step.selectorType === 'none') return true;
                if (step.selectorType === 'css' && step.customCssSelector) return true;
                if (step.targetObjectId) return true;
                return false;
            })
            /**
             * Transform a step configuration into a driver.js DriveStep object.
             *
             * @param {object} step - Step configuration from tour config.
             * @returns {object} A driver.js DriveStep object.
             */
            .map((step) => {
                const { popoverClass, onPopoverRender } = getStepDialogSettings(step);
                // Standalone dialog — no element, driver.js shows a centered modal
                if (step.selectorType === 'none') {
                    const popoverConfig = {
                        title: stripHtml(step.popoverTitle || ''),
                        description: markdownToHtml(step.popoverDescription || '', options),
                        side: step.popoverSide || 'bottom',
                        align: step.popoverAlign || 'center',
                        popoverClass,
                    };
                    if (onPopoverRender) popoverConfig.onPopoverRender = onPopoverRender;
                    return { popover: popoverConfig };
                }

                const cssSelector =
                    step.selectorType === 'css' && step.customCssSelector
                        ? step.customCssSelector
                        : getObjectSelectorSync(platformType, step.targetObjectId, codePath);

                // For objects inside tab containers, we need to switch to
                // the correct tab before the element can be found in the DOM.
                // The sync variant clicks the tab immediately; if Qlik renders
                // the child synchronously, querySelector will find it.
                const objectId = step.selectorType !== 'css' ? step.targetObjectId : null;

                return {
                    // Use a function for lazy evaluation — the Qlik object DOM
                    // element may not exist yet when steps are configured
                    /**
                     * Lazily resolve the DOM element for this step.
                     * If the object is inside a tab container, switch to the
                     * correct tab first (synchronous click).
                     *
                     * Tab info is checked at call time (not when steps are
                     * built) so that late-arriving tabContainerMap data is
                     * still picked up.
                     *
                     * @returns {Element|null} The matching DOM element, or null.
                     */
                    element: () => {
                        if (objectId && getTabInfo(objectId)) {
                            ensureTabVisibleSync(objectId, platformType, codePath);
                        }
                        return document.querySelector(cssSelector);
                    },
                    popover: {
                        title: stripHtml(step.popoverTitle || ''),
                        description: markdownToHtml(step.popoverDescription || '', options),
                        side: step.popoverSide || 'bottom',
                        align: step.popoverAlign || 'center',
                        popoverClass,
                        ...(onPopoverRender ? { onPopoverRender } : {}),
                    },
                    disableActiveInteraction: step.disableInteraction !== false,
                    // Custom metadata — used by onNextClick/onPrevClick to
                    // pre-switch tabs before the step transition.
                    _targetObjectId: objectId,
                    _cssSelector: cssSelector,
                };
            })
    );
}

/**
 * Validate a CSS color string. Returns the value if it matches a known
 * pattern (hex, rgb/rgba, hsl/hsla, named colors), otherwise returns the
 * default.
 *
 * @param {string} value - Candidate color value.
 * @param {string} fallback - Default color.
 * @returns {string} Safe color string.
 */
function safeCssColor(value, fallback) {
    if (!value || typeof value !== 'string') return fallback;
    // Accept hex, rgb(), rgba(), hsl(), hsla(), and simple named colors
    const cleaned = value.trim();
    if (
        /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(cleaned) ||
        /^(?:rgb|rgba|hsl|hsla)\([^)]+\)$/i.test(cleaned) ||
        /^[a-z]{3,20}$/i.test(cleaned)
    ) {
        return cleaned;
    }
    return fallback;
}

/**
 * Create and run a tour.
 *
 * @param {object} tourConfig - Tour configuration from layout.
 * @param {object} [options] - Additional options.
 * @param {string} [options.platformType] - Platform type.
 * @param {string} [options.senseVersion] - Sense version (informational, unused).
 * @param {string} [options.codePath] - Code-path name for selector lookup.
 * @param {string} [options.appId] - App ID for localStorage tracking.
 * @param {string} [options.sheetId] - Sheet ID for localStorage tracking.
 * @param {string} [options.allowedUriPatterns] - Comma-separated URL prefixes for media sources.
 * @param {(tourConfig: object) => void} [options.onComplete] - Callback when tour finishes.
 * @returns {Promise<object|null>} Promise resolving to the driver.js instance, or null if no tour is shown.
 */
export async function runTour(tourConfig, options = {}) {
    const {
        platformType = detectPlatformType(),
        senseVersion: _senseVersion,
        codePath = 'default',
        appId,
        sheetId,
        allowedUriPatterns,
        onComplete,
    } = options;

    // Ensure tab-container metadata is fully built before we create
    // driver.js steps — auto-start tours may fire before the async
    // Engine calls in buildTabContainerMap() have finished.
    if (extensionState.tabContainerMapReady) {
        await extensionState.tabContainerMapReady;
    }

    const steps = buildDriverSteps(tourConfig, platformType, codePath, {
        allowedUriPatterns,
    });

    if (steps.length === 0) {
        logger.warn('Tour has no valid steps, nothing to show');
        return null;
    }

    logger.info(`Starting tour "${tourConfig.tourName}" with ${steps.length} steps`);

    const driverConfig = {
        steps,
        animate: true,
        smoothScroll: true,
        allowClose: true,
        allowKeyboardControl: tourConfig.allowKeyboard !== false,
        showProgress: tourConfig.showProgress !== false,
        progressText: '{{current}} of {{total}}',
        showButtons: ['next', 'previous', 'close'],
        overlayColor: safeCssColor(tourConfig.overlayColor, 'rgba(0, 0, 0, 0.6)'),
        overlayOpacity: tourConfig.overlayOpacity != null ? tourConfig.overlayOpacity / 100 : 0.6,
        stagePadding: tourConfig.stagePadding || 8,
        stageRadius: tourConfig.stageRadius || 5,
        popoverClass: 'onboard-qs-popover',
        nextBtnText: stripHtml(tourConfig.nextBtnText || 'Next'),
        prevBtnText: stripHtml(tourConfig.prevBtnText || 'Previous'),
        doneBtnText: stripHtml(tourConfig.doneBtnText || 'Done'),
        /**
         * Pre-switch tab containers when navigating forward.
         * This fires INSTEAD of the default next behavior, so we must
         * call driverObj.moveNext() ourselves after the tab switch.
         *
         * @param {Element|undefined} _element - Current highlighted element.
         * @param {object} _step - Current step config.
         * @param {{ driver: object }} opts - Driver options containing the driver instance.
         */
        onNextClick: async (_element, _step, { driver: driverInstance }) => {
            const activeIdx = driverInstance.getActiveIndex();
            const nextIdx = activeIdx + 1;
            if (nextIdx < steps.length) {
                const nextStep = steps[nextIdx];
                if (nextStep._targetObjectId && getTabInfo(nextStep._targetObjectId)) {
                    await ensureTabVisible(nextStep._targetObjectId, platformType, codePath);
                }
            }
            driverInstance.moveNext();
        },
        /**
         * Pre-switch tab containers when navigating backward.
         *
         * @param {Element|undefined} _element - Current highlighted element.
         * @param {object} _step - Current step config.
         * @param {{ driver: object }} opts - Driver options containing the driver instance.
         */
        onPrevClick: async (_element, _step, { driver: driverInstance }) => {
            const activeIdx = driverInstance.getActiveIndex();
            const prevIdx = activeIdx - 1;
            if (prevIdx >= 0) {
                const prevStep = steps[prevIdx];
                if (prevStep._targetObjectId && getTabInfo(prevStep._targetObjectId)) {
                    await ensureTabVisible(prevStep._targetObjectId, platformType, codePath);
                }
            }
            driverInstance.movePrevious();
        },
        /**
         * Callback invoked when the driver.js tour is destroyed.
         */
        onDestroyed: () => {
            logger.info(`Tour "${tourConfig.tourName}" completed/closed`);
            // Mark as seen in localStorage
            if (appId && sheetId && tourConfig.tourId) {
                markTourSeen(appId, sheetId, tourConfig.tourId, tourConfig.tourVersion || 1);
            }
            if (onComplete) {
                onComplete(tourConfig);
            }
        },
    };

    // Pre-switch tab for the first step if it targets a tab container child.
    // This must happen before drive() so the element exists when resolved.
    if (steps.length > 0 && steps[0]._targetObjectId) {
        const firstTabInfo = getTabInfo(steps[0]._targetObjectId);
        if (firstTabInfo) {
            await ensureTabVisible(steps[0]._targetObjectId, platformType, codePath);
        }
    }

    const driverObj = driver(driverConfig);
    driverObj.drive();
    return driverObj;
}

/**
 * Highlight a single step for live preview in the editor.
 *
 * @param {object} step - A single step configuration.
 * @param {string} platformType - Platform type.
 * @param {string} [codePath] - Code-path name for selector lookup.
 * @returns {object | null} The driver.js instance, or null if element not found.
 */
export function highlightStep(step, platformType, codePath) {
    const { popoverClass, onPopoverRender } = getStepDialogSettings(step);
    // Standalone dialog — no element to highlight
    if (step.selectorType === 'none') {
        const driverConfig = {
            popoverClass,
        };
        if (onPopoverRender) driverConfig.onPopoverRender = onPopoverRender;
        const driverObj = driver(driverConfig);
        driverObj.highlight({
            popover: {
                title: stripHtml(step.popoverTitle || '(No title)'),
                description: markdownToHtml(step.popoverDescription || '(No description)'),
            },
        });
        return driverObj;
    }

    if (!step.targetObjectId && !(step.selectorType === 'css' && step.customCssSelector))
        return null;

    const cssSelector =
        step.selectorType === 'css' && step.customCssSelector
            ? step.customCssSelector
            : getObjectSelectorSync(platformType, step.targetObjectId, codePath);

    // For objects inside tab containers, switch to the correct tab first
    const objectId = step.selectorType !== 'css' ? step.targetObjectId : null;
    if (objectId && getTabInfo(objectId)) {
        ensureTabVisibleSync(objectId, platformType, codePath);
    }

    const element = document.querySelector(cssSelector);

    if (!element) {
        // If the element is still not found (async tab rendering), try
        // again after a short delay. This handles the case where Qlik
        // renders tab content asynchronously.
        if (objectId && getTabInfo(objectId)) {
            logger.debug(
                `highlightStep: element not found after sync tab switch, ` +
                    `retrying with async wait for ${cssSelector}`
            );
            const driverObj = driver({
                popoverClass,
                stagePadding: 8,
                stageRadius: 5,
                ...(onPopoverRender ? { onPopoverRender } : {}),
            });

            // Fire-and-forget: wait for element, then highlight
            ensureTabVisible(objectId, platformType, codePath).then((el) => {
                if (el) {
                    driverObj.highlight({
                        element: el,
                        popover: {
                            title: stripHtml(step.popoverTitle || '(No title)'),
                            description: markdownToHtml(
                                step.popoverDescription || '(No description)'
                            ),
                            side: step.popoverSide || 'bottom',
                            align: step.popoverAlign || 'center',
                        },
                    });
                } else {
                    logger.warn(
                        `highlightStep: element still not found after async tab switch: ${cssSelector}`
                    );
                }
            });
            return driverObj;
        }

        logger.warn(`Cannot highlight: element not found for selector ${cssSelector}`);
        return null;
    }

    const driverObj = driver({
        popoverClass,
        stagePadding: 8,
        stageRadius: 5,
        ...(onPopoverRender ? { onPopoverRender } : {}),
    });

    driverObj.highlight({
        element,
        popover: {
            title: stripHtml(step.popoverTitle || '(No title)'),
            description: markdownToHtml(step.popoverDescription || '(No description)'),
            side: step.popoverSide || 'bottom',
            align: step.popoverAlign || 'center',
        },
    });

    return driverObj;
}

/**
 * Destroy any active driver.js instance.
 *
 * @param {object} driverObj - A driver.js instance.
 */
export function destroyTour(driverObj) {
    if (driverObj && driverObj.isActive()) {
        driverObj.destroy();
    }
}
