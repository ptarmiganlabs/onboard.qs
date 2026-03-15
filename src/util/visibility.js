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
 * Returns true (visible) when the value is undefined, null, any non-zero number,
 * or any string that does not trim (case-insensitively) to '0' or 'false'. This
 * means that empty or whitespace-only strings are treated as visible. Returns
 * false (hidden) when the value is '0', 'false', or 0.
 *
 * @param {string|number|undefined|null} condition - Resolved showCondition value.
 * @returns {boolean} True if the item should be visible.
 */
export function isVisible(condition) {
    if (condition === undefined || condition === null) return true;
    if (typeof condition === 'number') return condition !== 0;
    if (typeof condition === 'string') {
        const trimmed = condition.trim().toLowerCase();
        return trimmed !== '0' && trimmed !== 'false';
    }
    return Boolean(condition);
}
