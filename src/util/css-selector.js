/**
 * Checks for the CSS selectors that tour steps target.
 *
 * A step's selector is typed by hand or built by a formula from data, so it
 * can be one the browser can't parse: `#target >`, or `#2024`, because an ID
 * selector can't start with a digit. document.querySelector() throws on
 * those, and an uncaught throw stops the tour.
 *
 * @module util/css-selector
 */

/**
 * Check whether the browser can parse a string as a CSS selector.
 *
 * Outside a browser there is nothing to check against, so every non-empty
 * string counts as valid there.
 *
 * @param {unknown} selector - Candidate selector.
 * @returns {boolean} True when the selector can be passed to querySelector().
 */
export function isValidCssSelector(selector) {
    if (typeof selector !== 'string' || selector.trim() === '') return false;
    if (typeof document === 'undefined') return true;
    try {
        // A fragment parses the selector without searching the page
        document.createDocumentFragment().querySelector(selector);
        return true;
    } catch {
        return false;
    }
}

/**
 * Check whether a selector entered in the property panel or the tour editor
 * should be flagged: plain text that the browser can't parse. A formula
 * (text starting with '=') is evaluated by the engine, so it can only be
 * checked when the tour runs.
 *
 * @param {unknown} value - The selector field's value.
 * @returns {boolean} True when the value is plain text but not a valid selector.
 */
export function isInvalidSelectorText(value) {
    if (typeof value !== 'string') return false;
    const text = value.trim();
    if (text === '' || text.startsWith('=')) return false;
    return !isValidCssSelector(text);
}
