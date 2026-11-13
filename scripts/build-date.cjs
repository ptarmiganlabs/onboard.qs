/**
 * Build-date utility for the `__BUILD_DATE__` build token, which
 * scripts/build-tokens.cjs works out. CommonJS, because nebula.config.cjs
 * requires that file.
 */

/**
 * Generate a human-readable build date string.
 *
 * @returns {string} Build date formatted as "17 March 2026, 07:21".
 */
function buildDateString() {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString('en-GB', { month: 'long' });
    const year = now.getFullYear();
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hour}:${minute}`;
}

module.exports = { buildDateString };
