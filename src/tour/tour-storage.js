import logger from '../util/logger';

/**
 * Tour storage using localStorage.
 *
 * Tracks whether a user has seen a specific tour version.
 * Key format: onboard-qs:<appId>:<sheetId>:<tourId>:v<tourVersion>
 */

const PREFIX = 'onboard-qs';

/**
 * Build the localStorage key for a tour.
 *
 * @param {string} appId
 * @param {string} sheetId
 * @param {string} tourId
 * @param {number} tourVersion
 * @returns {string}
 */
function buildKey(appId, sheetId, tourId, tourVersion) {
    return `${PREFIX}:${appId}:${sheetId}:${tourId}:v${tourVersion}`;
}

/**
 * Check if the user has already seen a specific tour version.
 *
 * @param {string} appId
 * @param {string} sheetId
 * @param {string} tourId
 * @param {number} tourVersion
 * @returns {boolean}
 */
export function hasSeenTour(appId, sheetId, tourId, tourVersion) {
    try {
        const key = buildKey(appId, sheetId, tourId, tourVersion);
        const value = localStorage.getItem(key);
        const seen = value !== null;
        logger.debug(`hasSeenTour(${key}): ${seen}`);
        return seen;
    } catch (e) {
        logger.warn('Could not read localStorage:', e);
        return false;
    }
}

/**
 * Mark a tour as seen by the current user.
 *
 * @param {string} appId
 * @param {string} sheetId
 * @param {string} tourId
 * @param {number} tourVersion
 */
export function markTourSeen(appId, sheetId, tourId, tourVersion) {
    try {
        const key = buildKey(appId, sheetId, tourId, tourVersion);
        localStorage.setItem(key, JSON.stringify({
            timestamp: new Date().toISOString(),
            version: tourVersion,
        }));
        logger.debug(`markTourSeen(${key})`);
    } catch (e) {
        logger.warn('Could not write to localStorage:', e);
    }
}

/**
 * Reset the "seen" flag for a tour (e.g., from property panel button).
 *
 * @param {string} appId
 * @param {string} sheetId
 * @param {string} tourId
 * @param {number} tourVersion
 */
export function resetTourSeen(appId, sheetId, tourId, tourVersion) {
    try {
        const key = buildKey(appId, sheetId, tourId, tourVersion);
        localStorage.removeItem(key);
        logger.debug(`resetTourSeen(${key})`);
    } catch (e) {
        logger.warn('Could not remove from localStorage:', e);
    }
}

/**
 * Clear all onboard-qs entries from localStorage.
 * Useful for debugging/testing.
 */
export function clearAllTourData() {
    try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(PREFIX + ':')) {
                keys.push(key);
            }
        }
        keys.forEach((key) => localStorage.removeItem(key));
        logger.info(`Cleared ${keys.length} onboard-qs entries from localStorage`);
    } catch (e) {
        logger.warn('Could not clear localStorage:', e);
    }
}
