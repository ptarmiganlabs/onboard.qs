import { PRESET_LABELS, PRESETS, leanGreenPreset } from '../theme/presets';
import { COLOR_KEYS, toPickerObj, themeLabel, themePlaceholder } from './theme-helpers';

/**
 * Theme & Styling property panel section.
 *
 * Uses expandable-items to group preset selection, button overrides,
 * popover overrides, progress bar, and menu overrides.
 *
 * @returns {object} Property panel section definition.
 */
export function themeSection() {
    return {
        // not necessary to define the type, component "expandable-items" will automatically
        // default to "items"
        // type: "items"
        component: 'expandable-items',
        label: 'Theme & Styling',
        items: {
            // --- Theme Preset subsection ---
            themePresetGroup: {
                type: 'items',
                label: 'Theme Preset',
                items: {
                    preset: {
                        ref: 'theme.preset',
                        type: 'string',
                        label: 'Theme preset',
                        component: 'dropdown',
                        defaultValue: 'leanGreen',
                        options: Object.entries(PRESET_LABELS).map(([value, label]) => ({
                            value,
                            label,
                        })),
                        /**
                         * When the preset changes, populate all color pickers
                         * with the new preset's colors.
                         *
                         * @param {object} data - Property data (mutable).
                         */
                        change: (data) => {
                            const preset = PRESETS[data.theme?.preset];
                            if (!preset) return;
                            for (const key of COLOR_KEYS) {
                                if (preset[key]) {
                                    data[key] = toPickerObj(preset[key]);
                                }
                            }
                        },
                    },
                    fontFamily: {
                        ref: 'theme.fontFamily',
                        type: 'string',
                        /**
                         * Dynamic label showing preset default font family.
                         *
                         * @param {object} data - Property data.
                         * @returns {string} Label text.
                         */
                        label: (data) => themeLabel(data, 'Font family', 'fontFamily'),
                        defaultValue: '',
                        expression: 'optional',
                        /**
                         * Dynamic placeholder showing preset default.
                         *
                         * @param {object} data - Property data.
                         * @returns {string} Placeholder text.
                         */
                        placeholder: (data) => themePlaceholder(data, 'fontFamily'),
                    },
                },
            },

            // --- Button Overrides subsection ---
            buttonOverridesGroup: {
                type: 'items',
                label: 'Button Overrides',
                items: {
                    buttonBgColor: {
                        ref: 'buttonBgColor',
                        type: 'object',
                        component: 'color-picker',
                        /**
                         * Dynamic label showing preset default.
                         *
                         * @param {object} data - Property data.
                         * @returns {string} Label text.
                         */
                        label: (data) => themeLabel(data, 'Background color', 'buttonBgColor'),
                        defaultValue: toPickerObj(leanGreenPreset.buttonBgColor),
                    },
                    buttonTextColor: {
                        ref: 'buttonTextColor',
                        type: 'object',
                        component: 'color-picker',
                        /**
                         * Dynamic label showing preset default.
                         *
                         * @param {object} data - Property data.
                         * @returns {string} Label text.
                         */
                        label: (data) => themeLabel(data, 'Text color', 'buttonTextColor'),
                        defaultValue: toPickerObj(leanGreenPreset.buttonTextColor),
                    },
                    buttonHoverBgColor: {
                        ref: 'buttonHoverBgColor',
                        type: 'object',
                        component: 'color-picker',
                        /**
                         * Dynamic label showing preset default.
                         *
                         * @param {object} data - Property data.
                         * @returns {string} Label text.
                         */
                        label: (data) => themeLabel(data, 'Hover bg', 'buttonHoverBgColor'),
                        defaultValue: toPickerObj(leanGreenPreset.buttonHoverBgColor),
                    },
                    buttonBorderColor: {
                        ref: 'buttonBorderColor',
                        type: 'object',
                        component: 'color-picker',
                        /**
                         * Dynamic label showing preset default.
                         *
                         * @param {object} data - Property data.
                         * @returns {string} Label text.
                         */
                        label: (data) => themeLabel(data, 'Border color', 'buttonBorderColor'),
                        defaultValue: toPickerObj(leanGreenPreset.buttonBorderColor),
                    },
                    buttonFontSize: {
                        ref: 'theme.buttonFontSize',
                        type: 'string',
                        /**
                         * Dynamic label showing preset default.
                         *
                         * @param {object} data - Property data.
                         * @returns {string} Label text.
                         */
                        label: (data) => themeLabel(data, 'Font size (px)', 'buttonFontSize'),
                        defaultValue: '',
                        expression: 'optional',
                        /**
                         * Dynamic placeholder showing preset default.
                         *
                         * @param {object} data - Property data.
                         * @returns {string} Placeholder text.
                         */
                        placeholder: (data) => themePlaceholder(data, 'buttonFontSize'),
                    },
                    buttonBorderRadius: {
                        ref: 'theme.buttonBorderRadius',
                        type: 'string',
                        /**
                         * Dynamic label showing preset default.
                         *
                         * @param {object} data - Property data.
                         * @returns {string} Label text.
                         */
                        label: (data) =>
                            themeLabel(data, 'Border radius (px)', 'buttonBorderRadius'),
                        defaultValue: '',
                        expression: 'optional',
                        /**
                         * Dynamic placeholder showing preset default.
                         *
                         * @param {object} data - Property data.
                         * @returns {string} Placeholder text.
                         */
                        placeholder: (data) => themePlaceholder(data, 'buttonBorderRadius'),
                    },
                    buttonFontWeight: {
                        ref: 'theme.buttonFontWeight',
                        type: 'string',
                        /**
                         * Dynamic label showing preset default.
                         *
                         * @param {object} data - Property data.
                         * @returns {string} Label text.
                         */
                        label: (data) => themeLabel(data, 'Font weight', 'buttonFontWeight'),
                        component: 'dropdown',
                        defaultValue: '',
                        options: [
                            { value: '', label: 'Preset default' },
                            { value: '400', label: '400 (Normal)' },
                            { value: '500', label: '500 (Medium)' },
                            { value: '600', label: '600 (Semibold)' },
                            { value: '700', label: '700 (Bold)' },
                        ],
                    },
                },
            },

            // --- Popover Overrides subsection ---
            popoverOverridesGroup: {
                type: 'items',
                label: 'Popover Overrides',
                items: {
                    popoverBgColor: {
                        ref: 'popoverBgColor',
                        type: 'object',
                        component: 'color-picker',
                        /**
                         * Dynamic label showing preset default.
                         *
                         * @param {object} data - Property data.
                         * @returns {string} Label text.
                         */
                        label: (data) => themeLabel(data, 'Background color', 'popoverBgColor'),
                        defaultValue: toPickerObj(leanGreenPreset.popoverBgColor),
                    },
                    popoverTextColor: {
                        ref: 'popoverTextColor',
                        type: 'object',
                        component: 'color-picker',
                        /**
                         * Dynamic label showing preset default.
                         *
                         * @param {object} data - Property data.
                         * @returns {string} Label text.
                         */
                        label: (data) => themeLabel(data, 'Text color', 'popoverTextColor'),
                        defaultValue: toPickerObj(leanGreenPreset.popoverTextColor),
                    },
                    popoverTitleColor: {
                        ref: 'popoverTitleColor',
                        type: 'object',
                        component: 'color-picker',
                        /**
                         * Dynamic label showing preset default.
                         *
                         * @param {object} data - Property data.
                         * @returns {string} Label text.
                         */
                        label: (data) => themeLabel(data, 'Title color', 'popoverTitleColor'),
                        defaultValue: toPickerObj(leanGreenPreset.popoverTitleColor),
                    },
                    popoverButtonBgColor: {
                        ref: 'popoverButtonBgColor',
                        type: 'object',
                        component: 'color-picker',
                        /**
                         * Dynamic label showing preset default.
                         *
                         * @param {object} data - Property data.
                         * @returns {string} Label text.
                         */
                        label: (data) => themeLabel(data, 'Button bg', 'popoverButtonBgColor'),
                        defaultValue: toPickerObj(leanGreenPreset.popoverButtonBgColor),
                    },
                    popoverButtonTextColor: {
                        ref: 'popoverButtonTextColor',
                        type: 'object',
                        component: 'color-picker',
                        /**
                         * Dynamic label showing preset default.
                         *
                         * @param {object} data - Property data.
                         * @returns {string} Label text.
                         */
                        label: (data) =>
                            themeLabel(data, 'Button text color', 'popoverButtonTextColor'),
                        defaultValue: toPickerObj(leanGreenPreset.popoverButtonTextColor),
                    },
                    popoverButtonHoverBgColor: {
                        ref: 'popoverButtonHoverBgColor',
                        type: 'object',
                        component: 'color-picker',
                        /**
                         * Dynamic label showing preset default.
                         *
                         * @param {object} data - Property data.
                         * @returns {string} Label text.
                         */
                        label: (data) =>
                            themeLabel(data, 'Button hover bg', 'popoverButtonHoverBgColor'),
                        defaultValue: toPickerObj(leanGreenPreset.popoverButtonHoverBgColor),
                    },
                    popoverFontSize: {
                        ref: 'theme.popoverFontSize',
                        type: 'string',
                        /**
                         * Dynamic label showing preset default.
                         *
                         * @param {object} data - Property data.
                         * @returns {string} Label text.
                         */
                        label: (data) => themeLabel(data, 'Font size (px)', 'popoverFontSize'),
                        defaultValue: '',
                        expression: 'optional',
                        /**
                         * Dynamic placeholder showing preset default.
                         *
                         * @param {object} data - Property data.
                         * @returns {string} Placeholder text.
                         */
                        placeholder: (data) => themePlaceholder(data, 'popoverFontSize'),
                    },
                    popoverBorderRadius: {
                        ref: 'theme.popoverBorderRadius',
                        type: 'string',
                        /**
                         * Dynamic label showing preset default.
                         *
                         * @param {object} data - Property data.
                         * @returns {string} Label text.
                         */
                        label: (data) =>
                            themeLabel(data, 'Border radius (px)', 'popoverBorderRadius'),
                        defaultValue: '',
                        expression: 'optional',
                        /**
                         * Dynamic placeholder showing preset default.
                         *
                         * @param {object} data - Property data.
                         * @returns {string} Placeholder text.
                         */
                        placeholder: (data) => themePlaceholder(data, 'popoverBorderRadius'),
                    },
                },
            },

            // --- Progress Bar subsection ---
            progressBarGroup: {
                type: 'items',
                label: 'Progress Bar',
                items: {
                    progressBarColor: {
                        ref: 'progressBarColor',
                        type: 'object',
                        component: 'color-picker',
                        /**
                         * Dynamic label showing preset default.
                         *
                         * @param {object} data - Property data.
                         * @returns {string} Label text.
                         */
                        label: (data) => themeLabel(data, 'Progress bar color', 'progressBarColor'),
                        defaultValue: toPickerObj(leanGreenPreset.progressBarColor),
                    },
                },
            },

            // --- Menu Overrides subsection ---
            menuOverridesGroup: {
                type: 'items',
                label: 'Menu Overrides',
                items: {
                    menuBgColor: {
                        ref: 'menuBgColor',
                        type: 'object',
                        component: 'color-picker',
                        /**
                         * Dynamic label showing preset default.
                         *
                         * @param {object} data - Property data.
                         * @returns {string} Label text.
                         */
                        label: (data) => themeLabel(data, 'Background color', 'menuBgColor'),
                        defaultValue: toPickerObj(leanGreenPreset.menuBgColor),
                    },
                    menuTextColor: {
                        ref: 'menuTextColor',
                        type: 'object',
                        component: 'color-picker',
                        /**
                         * Dynamic label showing preset default.
                         *
                         * @param {object} data - Property data.
                         * @returns {string} Label text.
                         */
                        label: (data) => themeLabel(data, 'Text color', 'menuTextColor'),
                        defaultValue: toPickerObj(leanGreenPreset.menuTextColor),
                    },
                    menuHoverBgColor: {
                        ref: 'menuHoverBgColor',
                        type: 'object',
                        component: 'color-picker',
                        /**
                         * Dynamic label showing preset default.
                         *
                         * @param {object} data - Property data.
                         * @returns {string} Label text.
                         */
                        label: (data) => themeLabel(data, 'Item hover bg', 'menuHoverBgColor'),
                        defaultValue: toPickerObj(leanGreenPreset.menuHoverBgColor),
                    },
                },
            },
        },
    };
}
