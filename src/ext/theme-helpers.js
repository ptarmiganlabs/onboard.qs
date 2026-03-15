import { PRESETS } from '../theme/presets';

/**
 * Color property keys that use the color-picker component.
 */
export const COLOR_KEYS = [
    'buttonBgColor',
    'buttonTextColor',
    'buttonHoverBgColor',
    'buttonBorderColor',
    'popoverBgColor',
    'popoverTextColor',
    'popoverTitleColor',
    'popoverButtonBgColor',
    'popoverButtonTextColor',
    'popoverButtonHoverBgColor',
    'progressBarColor',
    'menuBgColor',
    'menuTextColor',
    'menuHoverBgColor',
];

/**
 * Convert a preset hex color string to a color-picker object.
 *
 * The Qlik color-picker component sets `background: <color>` directly,
 * so the value MUST include the '#' prefix to be valid CSS.
 *
 * @param {string} hex - Hex color string, e.g. '#009845'.
 * @returns {object} Color-picker value, e.g. { color: '#009845', index: '-1' }.
 */
export function toPickerObj(hex) {
    const c = (hex || '').replace(/^#/, '');
    return { color: c ? `#${c}` : '', index: '-1' };
}

/**
 * Get the current preset value for a theme property.
 *
 * @param {object} data - Property data from the property panel.
 * @param {string} key - Theme property key (e.g. 'buttonBgColor').
 * @returns {string|number|null} The preset default value.
 */
export function presetVal(data, key) {
    const presetName = data.theme?.preset || 'leanGreen';
    const preset = PRESETS[presetName] || PRESETS.leanGreen;
    return preset[key];
}

/**
 * Build a label string showing "Label (preset: value)" when no override is set.
 *
 * @param {object} data - Property data from the property panel.
 * @param {string} label - Base label text.
 * @param {string} _key - Theme property key to look up.
 * @returns {string} Label with preset hint.
 */
export function themeLabel(data, label, _key) {
    return label;
}

/**
 * Build a placeholder string from the preset value.
 *
 * @param {object} data - Property data from the property panel.
 * @param {string} key - Theme property key to look up.
 * @returns {string} Placeholder text.
 */
export function themePlaceholder(data, key) {
    const val = presetVal(data, key);
    return val != null ? `Preset: ${val}` : '';
}
