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
 * Check whether a dialog size name matches a supported preset.
 *
 * @param {string} size - Candidate dialog size.
 * @returns {boolean} True when the size is supported.
 */
export function isValidDialogSize(size) {
    return typeof size === 'string' && DIALOG_SIZES.has(size);
}

/**
 * Get a safe dialog size for a tour step.
 *
 * @param {object} step - Step configuration from tour config.
 * @returns {string} Supported dialog size name.
 */
export function getDialogSize(step) {
    return isValidDialogSize(step?.dialogSize) ? step.dialogSize : 'dynamic';
}
