import { runTour } from './tour-runner';
import { hasSeenTour } from './tour-storage';
import logger from '../util/logger';

/**
 * Start a specific tour. A tour that fails to start is logged, not left as
 * an unhandled rejection.
 *
 * @param {object} tourConfig - Tour configuration.
 * @param {object} context - Context with platformType, senseVersion, codePath, appId, sheetId,
 *   and objectId and getLayout for the object the tour belongs to.
 */
export function startTour(tourConfig, context) {
    runTour(tourConfig, {
        platformType: context.platformType,
        senseVersion: context.senseVersion,
        codePath: context.codePath,
        appId: context.appId,
        sheetId: context.sheetId,
        allowedUriPatterns: context.allowedUriPatterns,
        objectId: context.objectId,
        getLayout: context.getLayout,
    }).catch((err) => {
        logger.error(`Tour "${tourConfig.tourName}" could not be started:`, err);
    });
}

/**
 * The sheet visit that auto-start is tracking, and the IDs of the tours
 * auto-started during it. Kept here rather than in each object, because
 * Qlik can destroy and re-create an object while the user stays on the
 * sheet (a tab container switching tabs, for example), and that must not
 * count as a new visit.
 *
 * @type {{ key: string, autoStarted: Set<string> } | null}
 */
let visit = null;

/**
 * Get the IDs of the tours auto-started during the current visit to a
 * sheet, starting a new visit when the sheet differs from the last one.
 *
 * @param {string} appId - App ID.
 * @param {string} sheetId - Sheet ID.
 *
 * @returns {Set<string>} IDs of the tours auto-started during this visit.
 */
function visitAutoStarted(appId, sheetId) {
    const key = `${appId}:${sheetId}`;
    if (visit?.key !== key) {
        visit = { key, autoStarted: new Set() };
    }
    return visit.autoStarted;
}

/**
 * End the current visit to a sheet, so its auto-start tours start again
 * the next time it renders. Does nothing if another sheet's visit has
 * started since.
 *
 * @param {string} appId - App ID.
 * @param {string} sheetId - Sheet ID.
 */
export function endAutoStartVisit(appId, sheetId) {
    if (visit?.key === `${appId}:${sheetId}`) {
        logger.debug(`Auto-start visit to sheet ${sheetId} ended`);
        visit = null;
    }
}

/**
 * Handle auto-starting tours that should trigger on sheet load.
 *
 * Called on every render, and the object renders again whenever its
 * layout changes (on every selection if any of its properties is an
 * expression). Each tour is therefore auto-started at most once per
 * sheet visit: a tour is recorded for the visit when its delayed start
 * fires, and skipped after that.
 *
 * @param {Array} tours - Visible tour configurations.
 * @param {object} layout - Extension layout.
 * @param {object} context - Context with appId, sheetId, etc.
 *
 * @returns {function(): void} Cancels the auto-starts that have not fired yet.
 */
export function handleAutoStart(tours, layout, context) {
    const autoStarted = visitAutoStarted(context.appId, context.sheetId);
    const timers = [];

    tours.forEach((tour) => {
        if (!tour.autoStart) return;

        if (autoStarted.has(tour.tourId)) {
            logger.debug(`Tour "${tour.tourName}" already auto-started on this sheet visit`);
            return;
        }

        if (tour.showOnce) {
            const seen = hasSeenTour(
                context.appId,
                context.sheetId,
                tour.tourId,
                tour.tourVersion || 1
            );
            if (seen) {
                logger.debug(`Tour "${tour.tourName}" already seen, skipping auto-start`);
                return;
            }
        }

        // Delay slightly to let Qlik objects finish rendering
        timers.push(
            setTimeout(() => {
                autoStarted.add(tour.tourId);
                logger.info(`Auto-starting tour "${tour.tourName}"`);
                startTour(tour, context);
            }, 500)
        );
    });

    return () => timers.forEach((timer) => clearTimeout(timer));
}
