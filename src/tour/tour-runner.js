import { driver } from 'driver.js';
import logger from '../util/logger';
import { markdownToHtml } from '../util/markdown';
import { getObjectSelectorSync, detectPlatformType } from '../platform/index';
import { markTourSeen } from './tour-storage';

/**
 * Tour runner — builds driver.js step configurations from the extension
 * layout and manages tour execution.
 */

/**
 * Build driver.js steps from a tour configuration.
 *
 * @param {object} tourConfig - A single tour from the layout's tours array.
 * @param {string} platformType - 'client-managed' or 'cloud'
 * @param {string} [codePath] - Code-path name for selector lookup (e.g. 'default').
 * @returns {Array<object>} Array of driver.js DriveStep objects.
 */
export function buildDriverSteps(tourConfig, platformType, codePath) {
    if (!tourConfig.steps || !Array.isArray(tourConfig.steps)) {
        return [];
    }

    return (
        tourConfig.steps
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
                // Standalone dialog — no element, driver.js shows a centered modal
                if (step.selectorType === 'none') {
                    const size = step.dialogSize || 'medium';
                    const sizeClass = `onboard-qs-dialog-${size}`;
                    const popoverConfig = {
                        title: step.popoverTitle || '',
                        description: markdownToHtml(step.popoverDescription || ''),
                        side: step.popoverSide || 'bottom',
                        align: step.popoverAlign || 'center',
                        popoverClass: `onboard-qs-popover ${sizeClass}`,
                    };
                    // For custom size, apply inline dimensions via onPopoverRender
                    if (size === 'custom') {
                        const w = step.customDialogWidth || 500;
                        const h = step.customDialogHeight || 350;
                        /**
                         *
                         * @param popover
                         */
                        popoverConfig.onPopoverRender = (popover) => {
                            if (popover?.wrapper) {
                                popover.wrapper.style.width = `${w}px`;
                                popover.wrapper.style.maxWidth = `${w}px`;
                                popover.wrapper.style.minHeight = `${h}px`;
                            }
                        };
                    }
                    return { popover: popoverConfig };
                }

                const cssSelector =
                    step.selectorType === 'css' && step.customCssSelector
                        ? step.customCssSelector
                        : getObjectSelectorSync(platformType, step.targetObjectId, codePath);

                return {
                    // Use a function for lazy evaluation — the Qlik object DOM
                    // element may not exist yet when steps are configured
                    /**
                     * Lazily resolve the DOM element for this step.
                     *
                     * @returns {Element|null} The matching DOM element, or null.
                     */
                    element: () => document.querySelector(cssSelector),
                    popover: {
                        title: step.popoverTitle || '',
                        description: markdownToHtml(step.popoverDescription || ''),
                        side: step.popoverSide || 'bottom',
                        align: step.popoverAlign || 'center',
                    },
                    disableActiveInteraction: step.disableInteraction !== false,
                };
            })
    );
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
 * @param {(tourConfig: object) => void} [options.onComplete] - Callback when tour finishes.
 * @returns {object} The driver.js instance.
 */
export function runTour(tourConfig, options = {}) {
    const {
        platformType = detectPlatformType(),
        senseVersion: _senseVersion,
        codePath = 'default',
        appId,
        sheetId,
        onComplete,
    } = options;

    const steps = buildDriverSteps(tourConfig, platformType, codePath);

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
        overlayColor: tourConfig.overlayColor || 'rgba(0, 0, 0, 0.6)',
        overlayOpacity: tourConfig.overlayOpacity != null ? tourConfig.overlayOpacity / 100 : 0.6,
        stagePadding: tourConfig.stagePadding || 8,
        stageRadius: tourConfig.stageRadius || 5,
        popoverClass: 'onboard-qs-popover',
        nextBtnText: tourConfig.nextBtnText || 'Next',
        prevBtnText: tourConfig.prevBtnText || 'Previous',
        doneBtnText: tourConfig.doneBtnText || 'Done',
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
    // Standalone dialog — no element to highlight
    if (step.selectorType === 'none') {
        const size = step.dialogSize || 'medium';
        const sizeClass = `onboard-qs-dialog-${size}`;
        const driverConfig = {
            popoverClass: `onboard-qs-popover ${sizeClass}`,
        };
        if (size === 'custom') {
            const w = step.customDialogWidth || 500;
            const h = step.customDialogHeight || 350;
            /**
             *
             * @param popover
             */
            driverConfig.onPopoverRender = (popover) => {
                if (popover?.wrapper) {
                    popover.wrapper.style.width = `${w}px`;
                    popover.wrapper.style.maxWidth = `${w}px`;
                    popover.wrapper.style.minHeight = `${h}px`;
                }
            };
        }
        const driverObj = driver(driverConfig);
        driverObj.highlight({
            popover: {
                title: step.popoverTitle || '(No title)',
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
    const element = document.querySelector(cssSelector);

    if (!element) {
        logger.warn(`Cannot highlight: element not found for selector ${cssSelector}`);
        return null;
    }

    const driverObj = driver({
        popoverClass: 'onboard-qs-popover',
        stagePadding: 8,
        stageRadius: 5,
    });

    driverObj.highlight({
        element,
        popover: {
            title: step.popoverTitle || '(No title)',
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
