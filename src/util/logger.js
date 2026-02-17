/**
 * Logger utility for Onboard QS extension.
 * Controls logging based on build type.
 */

export const BUILD_TYPE = __BUILD_TYPE__;
export const PACKAGE_VERSION = __PACKAGE_VERSION__;

const IS_PRODUCTION = BUILD_TYPE === 'production';

let muteAll = false;

const logger = {
    /**
     * Sets whether all logging should be suppressed.
     * @param {boolean} value - True to suppress all logs.
     */
    setMuteAll: (value) => {
        muteAll = !!value;
    },

    /**
     * Debug level logging - only shown in development builds.
     * @param {...*} args - Arguments to log.
     */
    debug: (...args) => {
        if (!muteAll && !IS_PRODUCTION) {
            console.log('Onboard QS [DEBUG]:', ...args);
        }
    },

    /**
     * Info level logging - shown in all builds.
     * @param {...*} args - Arguments to log.
     */
    info: (...args) => {
        if (!muteAll) {
            console.log('Onboard QS [INFO]:', ...args);
        }
    },

    /**
     * Warning level logging - always shown.
     * @param {...*} args - Arguments to log.
     */
    warn: (...args) => {
        if (!muteAll) {
            console.warn('Onboard QS [WARN]:', ...args);
        }
    },

    /**
     * Error level logging - always shown.
     * @param {...*} args - Arguments to log.
     */
    error: (...args) => {
        if (!muteAll) {
            console.error('Onboard QS [ERROR]:', ...args);
        }
    },
};

export default logger;
