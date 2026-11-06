/**
 * Stand-ins for the modules tour-runner.js imports that need a browser,
 * Qlik Sense or localStorage. Each export replaces the same name in one of
 * util/logger, util/markdown, platform/index, tour/tour-storage and
 * util/tab-switcher.
 */

/**
 * Return Markdown unchanged.
 *
 * @param {string} text - Markdown.
 * @returns {string} The same text.
 */
export const markdownToHtml = (text) => text;

/**
 * Return text unchanged.
 *
 * @param {string} text - Text.
 * @returns {string} The same text.
 */
export const stripHtml = (text) => text;

/**
 * Build a selector for a Qlik object.
 *
 * @param {string} _platformType - Platform type.
 * @param {string} objectId - Qlik object ID.
 * @returns {string} CSS selector.
 */
export const getObjectSelectorSync = (_platformType, objectId) => `.qv-object-${objectId}`;

/**
 * Report the platform.
 *
 * @returns {string} Platform type.
 */
export const detectPlatformType = () => 'client-managed';

/**
 * Return a platform adapter whose current sheet is always the test sheet.
 *
 * @returns {{getCurrentSheetId: () => string}} Platform adapter.
 */
export const getPlatformAdapter = () => ({ getCurrentSheetId: () => 'sheet1' });

/** @type {Array<Array<any>>} The arguments of each markTourSeen() call, oldest first. */
export const seen = [];

/**
 * Record that a tour was marked as seen, instead of writing to localStorage.
 *
 * @param {...any} args - App ID, sheet ID, tour ID and tour version.
 */
export const markTourSeen = (...args) => {
    seen.push(args);
};

/**
 * Report that no object is inside a tab container.
 *
 * @returns {null} No tab container.
 */
export const getTabInfo = () => null;

/** Do nothing instead of switching tabs. */
export const ensureTabVisibleSync = () => {};

/**
 * Do nothing instead of switching tabs.
 *
 * @returns {Promise<null>} No element.
 */
export const ensureTabVisible = async () => null;

/** Logger that keeps warnings, so tests can check them. */
const logger = {
    warnings: [],
    info() {},
    debug() {},
    error() {},
    /**
     * Keep a warning.
     *
     * @param {...any} args - Warning message and details.
     */
    warn(...args) {
        logger.warnings.push(args.join(' '));
    },
};

export default logger;
