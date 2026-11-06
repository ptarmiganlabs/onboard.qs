import { driver } from 'driver.js';
import logger from '../util/logger';
import { markdownToHtml, stripHtml } from '../util/markdown';
import { getObjectSelectorSync, detectPlatformType, getPlatformAdapter } from '../platform/index';
import { markTourSeen } from './tour-storage';
import { isVisible } from '../util/visibility';
import { getTabInfo, ensureTabVisibleSync, ensureTabVisible } from '../util/tab-switcher';
import { extensionState } from '../util/extension-state';
import { getDialogSize } from '../util/dialog-size';

/**
 * Tour runner — builds driver.js step configurations from the extension
 * layout and manages tour execution.
 */

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
    const size = getDialogSize(step);
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
                // The step's position in the tour, which stays the same when
                // steps around it are shown or hidden. Steps have no ID.
                const configIndex = tourConfig.steps.indexOf(step);
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
                    return { popover: popoverConfig, _configIndex: configIndex };
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
                    // pre-switch tabs before the step transition, and to find
                    // the step to move to when the steps are built again.
                    _targetObjectId: objectId,
                    _cssSelector: cssSelector,
                    _configIndex: configIndex,
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
 * Build the driver.js button labels and progress text for a tour.
 *
 * @param {object} tourConfig - Tour configuration from layout.
 *
 * @returns {{progressText: string, nextBtnText: string, prevBtnText: string, doneBtnText: string}} driver.js text settings.
 */
function getTourTexts(tourConfig) {
    return {
        progressText: stripHtml(tourConfig.progressText || '{{current}} of {{total}}'),
        nextBtnText: stripHtml(tourConfig.nextBtnText || 'Next'),
        prevBtnText: stripHtml(tourConfig.prevBtnText || 'Previous'),
        doneBtnText: stripHtml(tourConfig.doneBtnText || 'Done'),
    };
}

/**
 * Read a running tour again from the current layout of the object it
 * belongs to. The engine evaluates the layout's expressions with the
 * selections in place now.
 *
 * @param {() => Promise<object>} getLayout - Gets the layout of the tour's object.
 * @param {object} tourConfig - The tour as it was when it started.
 *
 * @returns {Promise<object|null>} The tour as it evaluates now, or null if it can't be read.
 */
async function readCurrentTour(getLayout, tourConfig) {
    try {
        const layout = await getLayout();
        const tour = (layout?.tours || []).find((t) => t.tourId === tourConfig.tourId);
        if (tour) return tour;
        logger.debug(`Tour "${tourConfig.tourName}" is no longer in its object's layout`);
    } catch (err) {
        logger.warn(`Could not read the layout of tour "${tourConfig.tourName}":`, err);
    }
    return null;
}

/**
 * The driver.js instance of the last tour started by runTour().
 * driver.js keeps its configuration and state at module level, so starting
 * a second tour replaces the running one instead of running alongside it.
 *
 * @type {object|null}
 */
let activeTour = null;

/**
 * The sheet that activeTour was started on.
 *
 * @type {string|null}
 */
let activeTourSheetId = null;

/**
 * Whether a tour started by runTour() is still running.
 *
 * @param {object} tourConfig - The tour about to be started, for the log message.
 *
 * @returns {boolean} True, after logging that the tour is not started, if another tour is running.
 */
function anotherTourRunning(tourConfig) {
    if (!activeTour?.isActive()) return false;
    logger.info(`Not starting tour "${tourConfig.tourName}": another tour is running`);
    return true;
}

/**
 * Create and run a tour, unless another tour is running.
 *
 * @param {object} tourConfig - Tour configuration from layout.
 * @param {object} [options] - Additional options.
 * @param {string} [options.platformType] - Platform type.
 * @param {string} [options.senseVersion] - Sense version (informational, unused).
 * @param {string} [options.codePath] - Code-path name for selector lookup.
 * @param {string} [options.appId] - App ID for localStorage tracking.
 * @param {string} [options.sheetId] - Sheet the tour belongs to. Also used for localStorage tracking.
 * @param {string} [options.allowedUriPatterns] - Comma-separated URL prefixes for media sources.
 * @param {() => Promise<object>} [options.getLayout] - Gets the current layout of the object the
 *   tour belongs to. Needed for the tour's "Update expressions at each step" setting.
 * @param {(tourConfig: object) => void} [options.onComplete] - Callback when tour finishes.
 *
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
        getLayout,
        onComplete,
    } = options;

    if (anotherTourRunning(tourConfig)) return null;

    // Ensure tab-container metadata is fully built before we create
    // driver.js steps — auto-start tours may fire before the async
    // Engine calls in buildTabContainerMap() have finished.
    if (extensionState.tabContainerMapReady) {
        await extensionState.tabContainerMapReady;
    }

    // Replaced at each move when the tour's expressions are evaluated again
    let steps = buildDriverSteps(tourConfig, platformType, codePath, {
        allowedUriPatterns,
    });

    if (steps.length === 0) {
        logger.warn('Tour has no valid steps, nothing to show');
        return null;
    }

    const reevaluateEachStep =
        tourConfig.reevaluateEachStep === true &&
        typeof getLayout === 'function' &&
        Boolean(tourConfig.tourId);

    /**
     * Find the step to move to. When the tour's "Update expressions at each
     * step" setting is on, read the tour again first and give driver.js the
     * steps built from it, so that the step moved to has text, and is shown
     * or skipped, according to the selections made since the tour started.
     * driver.js reads its steps array each time it shows a step, so the step
     * count and progress text follow too.
     *
     * @param {object} driverInstance - The running driver.js instance.
     * @param {number} activeIdx - Index of the step being left.
     * @param {number} direction - 1 to move forward, -1 to move back.
     *
     * @returns {Promise<number>} Index of the step to move to; out of range when the tour ends.
     */
    const findTargetIndex = async (driverInstance, activeIdx, direction) => {
        const targetIdx = activeIdx + direction;
        // Moving past either end does what it did when the step was shown:
        // "Done" ends the tour even if a selection made during the last step
        // has made a later step visible
        if (!reevaluateEachStep || targetIdx < 0 || targetIdx >= steps.length) return targetIdx;

        const currentTour = await readCurrentTour(getLayout, tourConfig);
        if (!currentTour) return targetIdx;

        const currentSteps = buildDriverSteps(currentTour, platformType, codePath, {
            allowedUriPatterns,
        });
        const leaving = steps[activeIdx]._configIndex;
        // Steps are in tour order, so the last step before the one being
        // left is at the number of steps before it, minus one
        const currentIdx =
            direction > 0
                ? currentSteps.findIndex((step) => step._configIndex > leaving)
                : currentSteps.filter((step) => step._configIndex < leaving).length - 1;

        if (currentIdx === -1) {
            // No later step is visible now, so Next ends the tour. Previous
            // stays on the step being left.
            return direction > 0 ? steps.length : activeIdx;
        }

        steps = currentSteps;
        driverInstance.setConfig({
            ...driverInstance.getConfig(),
            ...getTourTexts(currentTour),
            steps,
        });
        return currentIdx;
    };

    // Next and Previous wait for the engine, and a second click meanwhile
    // must not move a second time
    let moving = false;

    const driverConfig = {
        steps,
        animate: true,
        smoothScroll: true,
        allowClose: true,
        allowKeyboardControl: tourConfig.allowKeyboard !== false,
        showProgress: tourConfig.showProgress !== false,
        showButtons: ['next', 'previous', 'close'],
        overlayColor: safeCssColor(tourConfig.overlayColor, 'rgba(0, 0, 0, 0.6)'),
        overlayOpacity: tourConfig.overlayOpacity != null ? tourConfig.overlayOpacity / 100 : 0.6,
        stagePadding: tourConfig.stagePadding || 8,
        stageRadius: tourConfig.stageRadius || 5,
        popoverClass: 'onboard-qs-popover',
        ...getTourTexts(tourConfig),
        /**
         * Pre-switch tab containers when navigating forward.
         * This fires INSTEAD of the default next behavior, so we must
         * move to the next step ourselves after the tab switch.
         *
         * @param {Element|undefined} _element - Current highlighted element.
         * @param {object} _step - Current step config.
         * @param {{ driver: object }} opts - Driver options containing the driver instance.
         */
        onNextClick: async (_element, _step, { driver: driverInstance }) => {
            if (moving) return;
            moving = true;
            try {
                const activeIdx = driverInstance.getActiveIndex();
                const nextIdx = await findTargetIndex(driverInstance, activeIdx, 1);
                if (nextIdx < steps.length) {
                    const nextStep = steps[nextIdx];
                    if (nextStep._targetObjectId && getTabInfo(nextStep._targetObjectId)) {
                        await ensureTabVisible(nextStep._targetObjectId, platformType, codePath);
                    }
                }
                // The user can close the tour while the awaits above run
                if (!driverInstance.isActive()) return;
                // Past the last step, driver.js ends the tour
                driverInstance.moveTo(nextIdx);
            } finally {
                moving = false;
            }
        },
        /**
         * Pre-switch tab containers when navigating backward.
         *
         * @param {Element|undefined} _element - Current highlighted element.
         * @param {object} _step - Current step config.
         * @param {{ driver: object }} opts - Driver options containing the driver instance.
         */
        onPrevClick: async (_element, _step, { driver: driverInstance }) => {
            if (moving) return;
            moving = true;
            try {
                const activeIdx = driverInstance.getActiveIndex();
                const prevIdx = await findTargetIndex(driverInstance, activeIdx, -1);
                if (prevIdx >= 0) {
                    const prevStep = steps[prevIdx];
                    if (prevStep._targetObjectId && getTabInfo(prevStep._targetObjectId)) {
                        await ensureTabVisible(prevStep._targetObjectId, platformType, codePath);
                    }
                }
                if (!driverInstance.isActive()) return;
                // Before the first step, driver.js ends the tour
                driverInstance.moveTo(prevIdx);
            } finally {
                moving = false;
            }
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

    // The awaits above can take a while on a large sheet. Check again with
    // no await between here and drive(), so two tours started at the same
    // moment can't both run, and a tour isn't shown on a sheet the user
    // moved to in the meantime.
    if (anotherTourRunning(tourConfig)) return null;
    if (sheetId && getPlatformAdapter().getCurrentSheetId() !== sheetId) {
        logger.info(`Not starting tour "${tourConfig.tourName}": its sheet is no longer open`);
        return null;
    }

    logger.info(`Starting tour "${tourConfig.tourName}" with ${steps.length} steps`);

    const driverObj = driver(driverConfig);
    activeTour = driverObj;
    activeTourSheetId = sheetId || null;
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

/**
 * Close the running tour if it was started on the given sheet.
 *
 * Called once the user has left that sheet. The tour overlay blocks most
 * clicks, but a step can leave a button or link that goes to another sheet
 * clickable, so a tour can still be running when its sheet goes away.
 * Closing it this way counts as closing the tour, for "Show only once" too.
 *
 * @param {string} sheetId - The sheet the user has left.
 */
export function closeTourForSheet(sheetId) {
    if (!sheetId || activeTourSheetId !== sheetId || !activeTour?.isActive()) return;
    logger.info(`Closing the running tour: its sheet ${sheetId} is no longer open`);
    destroyTour(activeTour);
}
