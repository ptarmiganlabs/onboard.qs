/**
 * Visibility helper for conditional show/hide of tours and steps.
 *
 * Used by both widget-renderer.js (tour-level filtering) and
 * tour-runner.js (step-level filtering) to evaluate the resolved
 * showCondition property value.
 */

/**
 * Determine whether a tour or step should be shown based on its showCondition value.
 *
 * Returns true (visible) when the value is undefined, null, or any truthy value
 * except the string '0'. Returns false (hidden) when the value is '0', 0, or
 * an empty string — following Qlik expression conventions.
 *
 * @param {string|number|undefined|null} condition - Resolved showCondition value.
 * @returns {boolean} True if the item should be visible.
 */
export function isVisible(condition) {
    if (condition === undefined || condition === null) return true;
    if (typeof condition === 'number') return condition !== 0;
    if (typeof condition === 'string') return condition !== '0' && condition !== '';
    return Boolean(condition);
}
