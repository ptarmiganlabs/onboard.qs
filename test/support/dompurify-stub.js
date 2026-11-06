/**
 * Stand-in for DOMPurify in Node, where it has no DOM to work with. It
 * returns the HTML unchanged, so the tests see what markdownToHtml() builds
 * before it is sanitised.
 */
export default {
    /**
     * Return the HTML unchanged.
     *
     * @param {string} html - HTML.
     * @returns {string} The same HTML.
     */
    sanitize: (html) => html,
};
