/**
 * Helpers for property values that can be Qlik expressions.
 *
 * Text properties with `expression: 'optional'` hold either a plain string
 * or a `qStringExpression` object. Number properties with it hold either a
 * number or a `qValueExpression` object, which the property panel stores as
 * `{ qValueExpression: { qExpr: "20+10" } }`, without the '='. The tour
 * editor and the property panel's Markdown editor show an expression as
 * `=expr` and store text that starts with `=` as an expression.
 *
 * @module util/expressions
 */

/**
 * Tour properties that hold text and can be expressions.
 *
 * @type {string[]}
 */
const TOUR_EXPR_FIELDS = [
    'tourName',
    'showCondition',
    'overlayColor',
    'nextBtnText',
    'prevBtnText',
    'doneBtnText',
    'progressText',
];

/**
 * Step properties that hold text and can be expressions.
 *
 * @type {string[]}
 */
const STEP_EXPR_FIELDS = [
    'popoverTitle',
    'popoverDescription',
    'customCssSelector',
    'showCondition',
];

/**
 * Tour properties that hold numbers and can be expressions.
 *
 * @type {string[]}
 */
const TOUR_NUMBER_EXPR_FIELDS = ['tourVersion', 'overlayOpacity', 'stagePadding', 'stageRadius'];

/**
 * Step properties that hold numbers and can be expressions.
 *
 * @type {string[]}
 */
const STEP_NUMBER_EXPR_FIELDS = ['customDialogWidth', 'customDialogHeight'];

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

/**
 * Wrap a number property's value starting with '=' as an expression, the
 * way the property panel stores one: `{ qValueExpression: { qExpr } }`, with
 * the '=' left out. Numbers and other values are returned unchanged.
 *
 * @param {string|number|boolean|object|null|undefined} value - Property value to check.
 *
 * @returns {object|string|number|boolean|null|undefined} Wrapped expression object, or the original value.
 */
export function wrapIfValueExpression(value) {
    if (typeof value === 'string' && value.startsWith('=')) {
        return { qValueExpression: { qExpr: value.slice(1) } };
    }
    return value;
}

/**
 * Check whether a number property's value is an expression and, if so,
 * return it as the property panel shows it, with a leading '='. Returns
 * null for a number or any other value.
 *
 * Handles both `{ qValueExpression: { qExpr: "expr" } }`, the form the
 * property panel stores, and `{ qValueExpression: "expr" }`.
 *
 * @param {string|number|object|null|undefined} value - Raw property value.
 * @returns {string|null} Expression string prefixed with '=', or null.
 */
export function extractValueExpression(value) {
    if (!value || typeof value !== 'object' || value.qValueExpression == null) return null;
    const expr = value.qValueExpression;
    const raw = typeof expr === 'string' ? expr : expr.qExpr;
    if (typeof raw !== 'string') return null;
    return raw.startsWith('=') ? raw : '=' + raw;
}

/**
 * Wrap '='-prefixed values as expressions across all expression-capable
 * fields in a tours array, before the tours are saved: text fields as
 * `qStringExpression`, number fields as `qValueExpression`.
 *
 * Mutates the tours in place.
 *
 * @param {Array} tours - Array of tour configuration objects.
 */
export function wrapExpressions(tours) {
    for (const tour of tours) {
        for (const key of TOUR_EXPR_FIELDS) {
            tour[key] = wrapIfExpression(tour[key]);
        }
        for (const key of TOUR_NUMBER_EXPR_FIELDS) {
            tour[key] = wrapIfValueExpression(tour[key]);
        }
        if (tour.steps) {
            for (const step of tour.steps) {
                for (const key of STEP_EXPR_FIELDS) {
                    step[key] = wrapIfExpression(step[key]);
                }
                for (const key of STEP_NUMBER_EXPR_FIELDS) {
                    step[key] = wrapIfValueExpression(step[key]);
                }
            }
        }
    }
}

/**
 * Overlay raw expression strings from model properties onto the tour
 * editor's tour data, which was cloned from the evaluated layout.
 *
 * This makes expressions appear as '=...' text in the editor fields instead
 * of their evaluated values, and lets them be saved again as expressions.
 * Without it, saving in the editor would replace each expression with the
 * value it evaluated to when the editor was opened.
 *
 * @param {Array} editorTours - The editor's in-memory tours (cloned from layout).
 * @param {Array} propTours - The raw tours from model.getProperties().
 */
export function overlayExpressions(editorTours, propTours) {
    for (let i = 0; i < editorTours.length && i < propTours.length; i++) {
        const editorTour = editorTours[i];
        const propTour = propTours[i];

        overlayFields(editorTour, propTour, TOUR_EXPR_FIELDS, extractExpression);
        overlayFields(editorTour, propTour, TOUR_NUMBER_EXPR_FIELDS, extractValueExpression);

        if (editorTour.steps && propTour.steps) {
            for (let j = 0; j < editorTour.steps.length && j < propTour.steps.length; j++) {
                const editorStep = editorTour.steps[j];
                const propStep = propTour.steps[j];
                overlayFields(editorStep, propStep, STEP_EXPR_FIELDS, extractExpression);
                overlayFields(
                    editorStep,
                    propStep,
                    STEP_NUMBER_EXPR_FIELDS,
                    extractValueExpression
                );
            }
        }
    }
}

/**
 * Copy the expressions stored in some fields of a tour or step onto the
 * editor's copy of it.
 *
 * @param {object} target - The editor's tour or step.
 * @param {object} source - The stored tour or step.
 * @param {string[]} keys - Fields to copy.
 * @param {(value: unknown) => string|null} extract - Reads a field's expression, or null for none.
 */
function overlayFields(target, source, keys, extract) {
    for (const key of keys) {
        const expr = extract(source[key]);
        if (expr !== null) {
            target[key] = expr;
        }
    }
}
