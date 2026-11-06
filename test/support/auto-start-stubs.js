/**
 * Stand-ins for the modules tour-helpers.js imports, for the auto-start
 * tests: tour/tour-runner, tour/tour-storage and util/logger. Tours are
 * recorded instead of run, and which tours count as seen is set by the test.
 */

/** @type {string[]} The tour IDs runTour() was called with, oldest first. */
export const started = [];

/** @type {Set<string>} Tours that count as seen, as `<tourId>:v<tourVersion>`. */
export const seenTours = new Set();

/**
 * Record that a tour was started, instead of running it.
 *
 * @param {object} tour - Tour configuration.
 * @returns {Promise<object>} A stand-in for the driver.
 */
export const runTour = async (tour) => {
    started.push(tour.tourId);
    return {};
};

/**
 * Report whether a tour version counts as seen.
 *
 * @param {string} _appId - App ID.
 * @param {string} _sheetId - Sheet ID.
 * @param {string} tourId - Tour ID.
 * @param {number} tourVersion - Tour version.
 * @returns {boolean} True if the test marked it as seen.
 */
export const hasSeenTour = (_appId, _sheetId, tourId, tourVersion) =>
    seenTours.has(`${tourId}:v${tourVersion}`);

/** A logger that says nothing. */
export default { debug() {}, info() {}, warn() {}, error() {} };
