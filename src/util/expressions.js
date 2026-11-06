/**
 * Helpers for property values that can be Qlik expressions.
 *
 * Text properties with `expression: 'optional'` hold either a plain string
 * or a `qStringExpression` object. The tour editor and the property panel's
 * Markdown editor show an expression as `=expr` and store text that starts
 * with `=` as an expression.
 *
 * @module util/expressions
 */

/**
 * Wrap a string value starting with '=' in qStringExpression format
 * so that Qlik Sense evaluates it as a Dollar Sign Expansion expression.
 *
 * Non-string or non-expression values are returned unchanged.
 *
 * @param {string|number|boolean|object|null|undefined} value - Property value to check.
 *
 * @returns {object|string|number|boolean|null|undefined} Wrapped expression object, or the original value.
 */
export function wrapIfExpression(value) {
    if (typeof value === 'string' && value.startsWith('=')) {
        return { qStringExpression: value };
    }
    return value;
}

/**
 * Extract the raw expression string from a qStringExpression object.
 *
 * Handles both `{ qStringExpression: "=expr" }` and
 * `{ qStringExpression: { qExpr: "=expr" } }` formats.
 * Non-expression values are returned unchanged.
 *
 * @param {string|object|null|undefined} value - Property value that may be a qStringExpression object.
 *
 * @returns {string|object|null|undefined} The expression string, or the original value.
 */
export function unwrapExpression(value) {
    if (value && typeof value === 'object') {
        if (typeof value.qStringExpression === 'string') {
            return value.qStringExpression;
        }
        if (value.qStringExpression && typeof value.qStringExpression.qExpr === 'string') {
            return value.qStringExpression.qExpr;
        }
    }
    return value;
}

/**
 * Check whether a property value is a qStringExpression object and, if so,
 * return the expression string with a leading '=' (the form the user typed
 * in the property panel).  Returns null for non-expression values.
 *
 * Qlik strips the leading '=' when it stores the expression internally as
 * `{ qStringExpression: { qExpr: "$(var)" } }`, so we re-add it here.
 *
 * @param {string|object|null|undefined} value - Raw property value.
 * @returns {string|null} Expression string prefixed with '=', or null.
 */
export function extractExpression(value) {
    if (value && typeof value === 'object' && value.qStringExpression != null) {
        const raw = unwrapExpression(value);
        if (typeof raw === 'string') {
            return raw.startsWith('=') ? raw : '=' + raw;
        }
    }
    return null;
}
