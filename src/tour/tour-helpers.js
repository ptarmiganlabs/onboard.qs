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
    });
}

/**
 * Handle auto-starting tours that should trigger on sheet load.
 *
 * @param {Array} tours - Visible tour configurations.
 * @param {object} layout - Extension layout.
 * @param {object} context - Context with appId, sheetId, etc.
 */
export function handleAutoStart(tours, layout, context) {
    tours.forEach((tour) => {
        if (!tour.autoStart) return;

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
        setTimeout(() => {
            logger.info(`Auto-starting tour "${tour.tourName}"`);
            startTour(tour, context);
        }, 500);
    });
}
