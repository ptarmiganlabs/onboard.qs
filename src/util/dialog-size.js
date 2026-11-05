/**
 * Dialog-size presets for tour steps.
 *
 * Single source for the preset list shown in the property panel and the
 * tour editor, and for the size the tour runner applies to a step.
 */

/** @type {Array<{value: string, label: string}>} */
export const DIALOG_SIZE_OPTIONS = [
    { value: 'dynamic', label: 'Dynamic (fit content)' },
    { value: 'small', label: 'Small (320 × 220)' },
    { value: 'medium', label: 'Medium (480 × 320)' },
    { value: 'large', label: 'Large (640 × 420)' },
    { value: 'x-large', label: 'Extra large (800 × 520)' },
    { value: 'custom', label: 'Custom…' },
];

const DIALOG_SIZES = new Set(DIALOG_SIZE_OPTIONS.map(({ value }) => value));

/**
 * Check whether a value names one of the dialog-size presets.
 *
 * @param {unknown} size - Candidate dialog size.
 * @returns {boolean} True when the size is a supported preset.
 */
export function isValidDialogSize(size) {
    return typeof size === 'string' && DIALOG_SIZES.has(size);
}

/**
 * Return the dialog size a step renders with.
 *
 * A step without a valid saved size keeps the historical default:
 * "medium" for a standalone dialog, "dynamic" for a popover attached
 * to a target.
 *
 * @param {object} step - Step configuration from tour config.
 * @returns {string} Supported dialog size name.
 */
export function getDialogSize(step) {
    if (isValidDialogSize(step?.dialogSize)) return step.dialogSize;
    return step?.selectorType === 'none' ? 'medium' : 'dynamic';
}
