import { runTour } from './tour-runner';
import { hasSeenTour } from './tour-storage';
import logger from '../util/logger';

/**
 * Start a specific tour.
 *
 * @param {object} tourConfig - Tour configuration.
 * @param {object} context - Context with platformType, senseVersion, codePath, appId, sheetId.
 */
export function startTour(tourConfig, context) {
    runTour(tourConfig, {
        platformType: context.platformType,
        senseVersion: context.senseVersion,
        codePath: context.codePath,
        appId: context.appId,
        sheetId: context.sheetId,
        allowedUriPatterns: context.allowedUriPatterns,
    });
}

/**
 * Handle auto-starting tours that should trigger on sheet load.
 *
 * Called on every render, and the object renders again whenever its
 * layout changes (on every selection if any of its properties is an
 * expression). Each tour is therefore auto-started at most once per
 * sheet visit: tours listed in `context.autoStarted` are skipped, and
 * a tour is added to it when its delayed start fires.
 *
 * @param {Array} tours - Visible tour configurations.
 * @param {object} layout - Extension layout.
 * @param {object} context - Context with appId, sheetId, etc.
 * @param {Set<string>} [context.autoStarted] - IDs of tours already auto-started during this sheet visit.
 *
 * @returns {function(): void} Cancels the auto-starts that have not fired yet.
 */
export function handleAutoStart(tours, layout, context) {
    const timers = [];

    tours.forEach((tour) => {
        if (!tour.autoStart) return;

        if (context.autoStarted?.has(tour.tourId)) {
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
                context.autoStarted?.add(tour.tourId);
                logger.info(`Auto-starting tour "${tour.tourName}"`);
                startTour(tour, context);
            }, 500)
        );
    });

    return () => timers.forEach((timer) => clearTimeout(timer));
}
