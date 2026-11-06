/**
 * Stand-in for the parts of `document` that the selector checks and the
 * tour runner's clean-up use, for tests that run without a DOM.
 *
 * Like a browser, it rejects selectors it can't parse with a SyntaxError.
 * Here those are selectors that end in a combinator, such as `#target >`,
 * and ID selectors that start with a digit, such as `#2024`. Every other
 * selector parses, and `#target` matches an element.
 */

/**
 * Install the fake as `globalThis.document`.
 *
 * @returns {{removedClasses: string[], target: object, uninstall: () => void}} Classes removed from
 *   `<body>`, the element `#target` matches, and a function that removes the fake again.
 */
export function installFakeDocument() {
    const removedClasses = [];
    const target = { id: 'target' };
    /**
     * Throw as a browser does for a selector it can't parse.
     *
     * @param {string} selector - Selector to check.
     */
    const parse = (selector) => {
        if (/[>+~]\s*$/.test(selector) || /#\d/.test(selector)) {
            throw new SyntaxError(`'${selector}' is not a valid selector.`);
        }
    };
    globalThis.document = {
        createDocumentFragment: () => ({
            querySelector: (selector) => {
                parse(selector);
                return null;
            },
        }),
        querySelector: (selector) => {
            parse(selector);
            return selector === '#target' ? target : null;
        },
        body: { classList: { remove: (...names) => removedClasses.push(...names) } },
    };
    return {
        removedClasses,
        target,
        uninstall: () => {
            delete globalThis.document;
        },
    };
}
