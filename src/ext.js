import logger from './util/logger';
import { PACKAGE_VERSION } from './util/logger';
import { PRESET_LABELS, PRESETS, leanGreenPreset } from './theme/presets';

/**
 * Color property keys that use the color-picker component.
 */
const COLOR_KEYS = [
    'buttonBgColor', 'buttonTextColor', 'buttonHoverBgColor', 'buttonBorderColor',
    'popoverBgColor', 'popoverTextColor', 'popoverTitleColor',
    'popoverButtonBgColor', 'popoverButtonTextColor', 'popoverButtonHoverBgColor',
    'progressBarColor',
    'menuBgColor', 'menuTextColor', 'menuHoverBgColor',
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
function toPickerObj(hex) {
    const c = (hex || '').replace(/^#/, '');
    return { color: c ? `#${c}` : '', index: '-1' };
}

/**
 * Get the current preset value for a theme property.
 *
 * @param {object} data - Property data from the property panel.
 * @param {string} key - Theme property key (e.g. 'buttonBgColor').
 * @returns {*} The preset default value.
 */
function presetVal(data, key) {
    const presetName = data.theme?.preset || 'leanGreen';
    const preset = PRESETS[presetName] || PRESETS.leanGreen;
    return preset[key];
}

/**
 * Build a label string showing "Label (preset: value)" when no override is set.
 *
 * @param {object} data - Property data from the property panel.
 * @param {string} label - Base label text.
 * @param {string} key - Theme property key to look up.
 * @returns {string} Label with preset hint.
 */
function themeLabel(data, label, key) {
    const val = presetVal(data, key);
    if (val != null) {
        return `${label}  ·  preset: ${val}`;
    }
    return label;
}

/**
 * Build a placeholder string from the preset value.
 *
 * @param {object} data - Property data from the property panel.
 * @param {string} key - Theme property key to look up.
 * @returns {string} Placeholder text.
 */
function themePlaceholder(data, key) {
    const val = presetVal(data, key);
    return val != null ? `Preset: ${val}` : '';
}

/**
 * Extension property panel definition for Onboard.qs.
 *
 * Provides a hybrid editing approach:
 *   - Basic tour/step configuration via the Qlik property panel
 *   - Rich editing via the in-extension modal editor (see tour-editor.js)
 *
 * @param {object} _galaxy - Nebula galaxy object.
 * @returns {object} Property panel definition.
 */
export default function ext(_galaxy) {
    /**
     * Get the list of objects on the current sheet for dropdown population.
     *
     * @param {object} data - Current data row.
     * @param {object} handler - Property handler (contains app, properties).
     * @returns {Promise<Array<{value: string, label: string}>>} List of sheet objects for dropdown population.
     */
    const getObjectList = async (data, handler) => {
        const { app } = handler;
        logger.debug('Fetching object list for property panel...');

        const excludeTypes = [
            'sheet',
            'story',
            'appprops',
            'loadmodel',
            'dimension',
            'measure',
            'masterobject',
            'qix-system-dimension',
            'onboard-qs',
        ];

        /**
         * Get the current sheet ID from the URL or Qlik navigation API.
         *
         * @returns {string|null} The sheet ID or null if not found.
         */
        const getCurrentSheetId = () => {
            const url = window.location.href;
            const match = url.match(/\/sheet\/([a-zA-Z0-9-]+)/);
            if (match) return match[1];

            try {
                if (window.qlik?.navigation?.getCurrentSheetId) {
                    const id = window.qlik.navigation.getCurrentSheetId();
                    return typeof id === 'string' ? id : id?.id || null;
                }
            } catch (_) {}

            return null;
        };

        try {
            let infos = await app.getAllInfos();
            const sheetId = getCurrentSheetId();

            if (sheetId) {
                try {
                    const sheetObj = await app.getObject(sheetId);
                    const sheetLayout = await sheetObj.getLayout();
                    let sheetObjectIds = (sheetLayout.cells || []).map((c) => c.name);
                    if (sheetLayout.qChildList?.qItems) {
                        const childIds = sheetLayout.qChildList.qItems.map(
                            (item) => item.qInfo.qId
                        );
                        sheetObjectIds = [...new Set([...sheetObjectIds, ...childIds])];
                    }

                    const filtered = infos.filter((info) => sheetObjectIds.includes(info.qId));
                    if (filtered.length > 0) infos = filtered;
                } catch (e) {
                    logger.warn('Could not filter by sheet:', e);
                }
            }

            const items = infos
                .filter(
                    (info) => !excludeTypes.includes(info.qType) && !info.qType.includes('system')
                )
                .map((info) => ({
                    value: info.qId,
                    label: `${info.qTitle || info.qId} (${info.qType})`,
                }))
                .sort((a, b) => a.label.localeCompare(b.label));

            // Enrich titles
            if (items.length < 100) {
                const enriched = await Promise.all(
                    items.map(async (item) => {
                        if (item.label.startsWith(item.value)) {
                            try {
                                const obj = await app.getObject(item.value);
                                const layout = await obj.getLayout();
                                const title = layout.title || layout.qMeta?.title || item.value;
                                const type = layout.qInfo?.qType || 'unknown';
                                return { value: item.value, label: `${title} (${type})` };
                            } catch (_) {}
                        }
                        return item;
                    })
                );
                return enriched.sort((a, b) => a.label.localeCompare(b.label));
            }
            return items;
        } catch (err) {
            logger.error('Failed to get object list:', err);
            return [];
        }
    };

    return {
        support: {
            snapshot: false,
            export: false,
            sharing: false,
            viewData: false,
        },
        definition: {
            type: 'items',
            component: 'accordion',
            items: {
                // ---- Widget Appearance ----
                widgetSection: {
                    type: 'items',
                    label: 'Widget Appearance',
                    items: {
                        showButton: {
                            ref: 'widget.showButton',
                            type: 'boolean',
                            label: 'Show start button',
                            defaultValue: true,
                            component: 'switch',
                            options: [
                                { value: true, label: 'On' },
                                { value: false, label: 'Off' },
                            ],
                        },
                        buttonText: {
                            ref: 'widget.buttonText',
                            type: 'string',
                            label: 'Button text',
                            defaultValue: 'Start Tour',
                            expression: 'optional',
                            /**
                             * Determine visibility of this property panel item.
                             *
                             * @param {object} data - Current property data row.
                             * @returns {boolean} True if item should be shown.
                             */
                            show: (data) => data.widget?.showButton !== false,
                        },
                        buttonStyle: {
                            ref: 'widget.buttonStyle',
                            type: 'string',
                            label: 'Button style',
                            component: 'dropdown',
                            defaultValue: 'primary',
                            options: [
                                { value: 'primary', label: 'Primary (filled)' },
                                { value: 'secondary', label: 'Secondary (gray)' },
                                { value: 'minimal', label: 'Minimal (outline)' },
                                { value: 'outlined', label: 'Outlined (transparent)' },
                                { value: 'pill', label: 'Pill (rounded)' },
                            ],
                            /**
                             * Determine visibility of this property panel item.
                             *
                             * @param {object} data - Current property data row.
                             * @returns {boolean} True if item should be shown.
                             */
                            show: (data) => data.widget?.showButton !== false,
                        },
                        horizontalAlign: {
                            ref: 'widget.horizontalAlign',
                            type: 'string',
                            label: 'Horizontal alignment',
                            component: 'dropdown',
                            defaultValue: 'center',
                            options: [
                                { value: 'left', label: 'Left' },
                                { value: 'center', label: 'Center' },
                                { value: 'right', label: 'Right' },
                            ],
                            /**
                             * Determine visibility of this property panel item.
                             *
                             * @param {object} data - Current property data row.
                             * @returns {boolean} True if item should be shown.
                             */
                            show: (data) => data.widget?.showButton !== false,
                        },
                        verticalAlign: {
                            ref: 'widget.verticalAlign',
                            type: 'string',
                            label: 'Vertical alignment',
                            component: 'dropdown',
                            defaultValue: 'center',
                            options: [
                                { value: 'top', label: 'Top' },
                                { value: 'center', label: 'Center' },
                                { value: 'bottom', label: 'Bottom' },
                            ],
                            /**
                             * Determine visibility of this property panel item.
                             *
                             * @param {object} data - Current property data row.
                             * @returns {boolean} True if item should be shown.
                             */
                            show: (data) => data.widget?.showButton !== false,
                        },
                    },
                },

                // ---- Theme & Styling ----
                themeSection: {
                    type: 'items',
                    label: 'Theme & Styling',
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

                        // --- Button color overrides ---
                        buttonOverridesHeader: {
                            component: 'text',
                            label: 'Button overrides (leave blank for preset defaults)',
                        },
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
                            label: (data) => themeLabel(data, 'Hover background', 'buttonHoverBgColor'),
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
                            label: (data) => themeLabel(data, 'Border radius (px)', 'buttonBorderRadius'),
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

                        // --- Popover color overrides ---
                        popoverOverridesHeader: {
                            component: 'text',
                            label: 'Popover overrides (leave blank for preset defaults)',
                        },
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
                            label: (data) => themeLabel(data, 'Button background', 'popoverButtonBgColor'),
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
                            label: (data) => themeLabel(data, 'Button text color', 'popoverButtonTextColor'),
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
                            label: (data) => themeLabel(data, 'Button hover background', 'popoverButtonHoverBgColor'),
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
                            label: (data) => themeLabel(data, 'Border radius (px)', 'popoverBorderRadius'),
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

                        // --- Menu color overrides ---
                        menuOverridesHeader: {
                            component: 'text',
                            label: 'Dropdown menu overrides (leave blank for preset defaults)',
                        },
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
                            label: (data) => themeLabel(data, 'Item hover background', 'menuHoverBgColor'),
                            defaultValue: toPickerObj(leanGreenPreset.menuHoverBgColor),
                        },
                    },
                },

                // ---- Tours Configuration ----
                toursSection: {
                    type: 'items',
                    label: 'Tours',
                    items: {
                        toursList: {
                            type: 'array',
                            ref: 'tours',
                            label: 'Tours',
                            allowAdd: true,
                            allowRemove: true,
                            addTranslation: 'Add Tour',
                            itemTitleRef: 'tourName',
                            items: {
                                tourName: {
                                    ref: 'tourName',
                                    type: 'string',
                                    label: 'Tour name',
                                    description:
                                        'A descriptive name for this tour. Shown in the tour launch menu.',
                                    defaultValue: 'New Tour',
                                },
                                autoStart: {
                                    ref: 'autoStart',
                                    type: 'boolean',
                                    label: 'Auto-start on sheet load',
                                    description:
                                        'Automatically launch this tour when the sheet is opened, instead of requiring the user to click.',
                                    defaultValue: false,
                                    component: 'switch',
                                    options: [
                                        { value: true, label: 'On' },
                                        { value: false, label: 'Off' },
                                    ],
                                },
                                showOnce: {
                                    ref: 'showOnce',
                                    type: 'boolean',
                                    label: 'Show only once per user',
                                    description:
                                        'When enabled, the auto-started tour is only shown once per user (tracked in localStorage). Increment Tour version to reset.',
                                    defaultValue: true,
                                    component: 'switch',
                                    options: [
                                        { value: true, label: 'On' },
                                        { value: false, label: 'Off' },
                                    ],
                                    /**
                                     * Determine visibility of this property panel item.
                                     *
                                     * @param {object} data - Current property data row.
                                     * @returns {boolean} True if item should be shown.
                                     */
                                    show: (data) => data.autoStart === true,
                                },
                                tourVersion: {
                                    ref: 'tourVersion',
                                    type: 'integer',
                                    label: 'Tour version (increment to reset "seen" flag)',
                                    description:
                                        'Incrementing this number clears the per-user "already seen" flag, so the auto-start tour will be shown again.',
                                    defaultValue: 1,
                                    min: 1,
                                },
                                showProgress: {
                                    ref: 'showProgress',
                                    type: 'boolean',
                                    label: 'Show progress indicator',
                                    description:
                                        'Display a "Step X of Y" progress text inside each popover.',
                                    defaultValue: true,
                                    component: 'switch',
                                    options: [
                                        { value: true, label: 'On' },
                                        { value: false, label: 'Off' },
                                    ],
                                },
                                allowKeyboard: {
                                    ref: 'allowKeyboard',
                                    type: 'boolean',
                                    label: 'Allow keyboard navigation',
                                    description:
                                        'Let users navigate steps with arrow keys and close the tour with Escape.',
                                    defaultValue: true,
                                    component: 'switch',
                                    options: [
                                        { value: true, label: 'On' },
                                        { value: false, label: 'Off' },
                                    ],
                                },

                                // --- Overlay & navigation button text ---
                                overlayColor: {
                                    ref: 'overlayColor',
                                    type: 'string',
                                    label: 'Overlay color',
                                    description:
                                        'CSS color for the backdrop behind the highlighted element, e.g. rgba(0,0,0,0.6) or #000.',
                                    defaultValue: 'rgba(0, 0, 0, 0.6)',
                                },
                                overlayOpacity: {
                                    ref: 'overlayOpacity',
                                    type: 'integer',
                                    label: 'Overlay opacity (0–100)',
                                    description:
                                        'How opaque the backdrop overlay is. 0 = fully transparent, 100 = fully opaque.',
                                    defaultValue: 60,
                                    min: 0,
                                    max: 100,
                                },
                                stagePadding: {
                                    ref: 'stagePadding',
                                    type: 'integer',
                                    label: 'Stage padding (px)',
                                    description:
                                        'Extra space (in pixels) between the highlighted element and the cutout edge.',
                                    defaultValue: 8,
                                    min: 0,
                                },
                                stageRadius: {
                                    ref: 'stageRadius',
                                    type: 'integer',
                                    label: 'Stage border radius (px)',
                                    description:
                                        'Corner rounding (in pixels) of the highlight cutout around the target element.',
                                    defaultValue: 5,
                                    min: 0,
                                },
                                nextBtnText: {
                                    ref: 'nextBtnText',
                                    type: 'string',
                                    label: 'Next button text',
                                    description:
                                        'Label shown on the Next button in the popover. Supports expressions for localization.',
                                    defaultValue: 'Next',
                                    expression: 'optional',
                                },
                                prevBtnText: {
                                    ref: 'prevBtnText',
                                    type: 'string',
                                    label: 'Previous button text',
                                    description:
                                        'Label shown on the Previous button. Supports expressions for localization.',
                                    defaultValue: 'Previous',
                                    expression: 'optional',
                                },
                                doneBtnText: {
                                    ref: 'doneBtnText',
                                    type: 'string',
                                    label: 'Done button text',
                                    description:
                                        'Label shown on the final step button. Supports expressions for localization.',
                                    defaultValue: 'Done',
                                    expression: 'optional',
                                },

                                // Steps sub-array
                                stepsList: {
                                    type: 'array',
                                    ref: 'steps',
                                    label: 'Tour Steps',
                                    allowAdd: true,
                                    allowRemove: true,
                                    addTranslation: 'Add Step',
                                    itemTitleRef: 'popoverTitle',
                                    items: {
                                        selectorType: {
                                            ref: 'selectorType',
                                            type: 'string',
                                            label: 'Target type',
                                            description:
                                                'How the step finds its target: a Qlik object, a CSS selector, or no target (standalone dialog).',
                                            component: 'dropdown',
                                            defaultValue: 'object',
                                            options: [
                                                { value: 'object', label: 'Sheet Object' },
                                                { value: 'css', label: 'Custom CSS Selector' },
                                                {
                                                    value: 'none',
                                                    label: 'Standalone Dialog (no target)',
                                                },
                                            ],
                                        },
                                        targetObjectId: {
                                            ref: 'targetObjectId',
                                            type: 'string',
                                            label: 'Target object',
                                            component: 'dropdown',
                                            options: getObjectList,
                                            /**
                                             * Determine visibility of this property panel item.
                                             *
                                             * @param {object} data - Current property data row.
                                             * @returns {boolean} True if item should be shown.
                                             */
                                            show: (data) =>
                                                !data.selectorType ||
                                                data.selectorType === 'object',
                                        },
                                        customCssSelector: {
                                            ref: 'customCssSelector',
                                            type: 'string',
                                            label: 'CSS selector',
                                            description:
                                                'A CSS selector (e.g. .my-class or #my-id) that identifies the DOM element to highlight.',
                                            defaultValue: '',
                                            expression: 'optional',
                                            /**
                                             * Determine visibility of this property panel item.
                                             *
                                             * @param {object} data - Current property data row.
                                             * @returns {boolean} True if item should be shown.
                                             */
                                            show: (data) => data.selectorType === 'css',
                                        },
                                        popoverTitle: {
                                            ref: 'popoverTitle',
                                            type: 'string',
                                            label: 'Popover title',
                                            description:
                                                'Bold heading displayed at the top of the tour step popover.',
                                            defaultValue: '',
                                            expression: 'optional',
                                        },
                                        popoverDescription: {
                                            ref: 'popoverDescription',
                                            type: 'string',
                                            label: 'Popover description',
                                            description:
                                                'Body text of the popover. Supports Markdown and raw HTML.',
                                            defaultValue: '',
                                            expression: 'optional',
                                        },
                                        popoverSide: {
                                            ref: 'popoverSide',
                                            type: 'string',
                                            label: 'Popover position',
                                            description:
                                                'Which side of the highlighted element the popover appears on.',
                                            component: 'dropdown',
                                            defaultValue: 'bottom',
                                            options: [
                                                { value: 'top', label: 'Top' },
                                                { value: 'bottom', label: 'Bottom' },
                                                { value: 'left', label: 'Left' },
                                                { value: 'right', label: 'Right' },
                                            ],
                                        },
                                        popoverAlign: {
                                            ref: 'popoverAlign',
                                            type: 'string',
                                            label: 'Popover alignment',
                                            description:
                                                'How the popover is aligned along its chosen side (start, center, or end).',
                                            component: 'dropdown',
                                            defaultValue: 'center',
                                            options: [
                                                { value: 'start', label: 'Start' },
                                                { value: 'center', label: 'Center' },
                                                { value: 'end', label: 'End' },
                                            ],
                                        },
                                        dialogSize: {
                                            ref: 'dialogSize',
                                            type: 'string',
                                            label: 'Dialog size',
                                            description:
                                                'Fixed dimensions for the standalone dialog. Only applies when Target type is "Standalone Dialog".',
                                            component: 'dropdown',
                                            defaultValue: 'medium',
                                            options: [
                                                { value: 'dynamic', label: 'Dynamic (fit content)' },
                                                { value: 'small', label: 'Small (320 × 220)' },
                                                { value: 'medium', label: 'Medium (480 × 320)' },
                                                { value: 'large', label: 'Large (640 × 420)' },
                                                { value: 'x-large', label: 'Extra large (800 × 520)' },
                                                { value: 'custom', label: 'Custom…' },
                                            ],
                                            /**
                                             * Determine visibility of this property panel item.
                                             *
                                             * @param {object} data - Current property data row.
                                             * @returns {boolean} True if item should be shown.
                                             */
                                            show: (data) => data.selectorType === 'none',
                                        },
                                        customDialogWidth: {
                                            ref: 'customDialogWidth',
                                            type: 'integer',
                                            label: 'Custom width (px)',
                                            defaultValue: 500,
                                            /**
                                             * @param {object} data - Current property data row.
                                             * @returns {boolean} True if item should be shown.
                                             */
                                            show: (data) =>
                                                data.selectorType === 'none' &&
                                                data.dialogSize === 'custom',
                                        },
                                        customDialogHeight: {
                                            ref: 'customDialogHeight',
                                            type: 'integer',
                                            label: 'Custom height (px)',
                                            defaultValue: 350,
                                            /**
                                             * @param {object} data - Current property data row.
                                             * @returns {boolean} True if item should be shown.
                                             */
                                            show: (data) =>
                                                data.selectorType === 'none' &&
                                                data.dialogSize === 'custom',
                                        },
                                        disableInteraction: {
                                            ref: 'disableInteraction',
                                            type: 'boolean',
                                            label: 'Disable interaction during step',
                                            description:
                                                'When on, the user cannot click the highlighted element while the step is active.',
                                            defaultValue: true,
                                            component: 'switch',
                                            options: [
                                                { value: true, label: 'On' },
                                                { value: false, label: 'Off' },
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                    },
                },

                // ---- About / Support ----
                supportSection: {
                    type: 'items',
                    label: 'About',
                    items: {
                        versionInfo: {
                            component: 'text',
                            label: `Onboard.qs v${PACKAGE_VERSION}`,
                        },
                        description: {
                            component: 'text',
                            label: 'Interactive onboarding tours for Qlik Sense apps. Brought to you by Ptarmigan Labs.',
                        },
                        homepageGit: {
                            component: 'link',
                            label: 'Documentation & Source Code',
                            url: 'https://github.com/ptarmiganlabs/onboard.qs',
                        },
                        reportBug: {
                            component: 'link',
                            label: 'Report a Bug / Request a Feature',
                            url: 'https://github.com/ptarmiganlabs/onboard.qs/issues/new/choose',
                        },
                        homepagePlabs: {
                            component: 'link',
                            label: 'Ptarmigan Labs — Qlik Sense tools & consulting',
                            url: 'https://ptarmiganlabs.com/',
                        },
                    },
                },
            },
        },
    };
}
