import logger from '../util/logger';
import { openMarkdownEditorDialog } from '../ui/markdown-editor-dialog';
import { extensionState } from '../util/extension-state';

/**
 * Get the list of objects on the current sheet for dropdown population.
 *
 * @param {object} _data - Current data row.
 * @param {object} handler - Property handler (contains app, properties).
 * @returns {Promise<Array<{value: string, label: string}>>} List of sheet objects for dropdown population.
 */
const getObjectList = async (_data, handler) => {
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

                // Add children of objects (e.g. layout containers)
                for (const id of [...sheetObjectIds]) {
                    try {
                        const obj = await app.getObject(id);
                        const layout = await obj.getLayout();
                        if (layout.qChildList?.qItems) {
                            layout.qChildList.qItems.forEach((item) => {
                                sheetObjectIds.push(item.qInfo.qId);
                            });
                        }
                    } catch (e) {
                        logger.warn(`Could not get layout for object ${id}:`, e);
                    }
                }

                if (sheetLayout.qChildList?.qItems) {
                    const childIds = sheetLayout.qChildList.qItems.map((item) => item.qInfo.qId);
                    sheetObjectIds = [...new Set([...sheetObjectIds, ...childIds])];
                }

                const filtered = infos.filter((info) => sheetObjectIds.includes(info.qId));
                if (filtered.length > 0) infos = filtered;
            } catch (e) {
                logger.warn('Could not filter by sheet:', e);
            }
        }

        const items = infos
            .filter((info) => !excludeTypes.includes(info.qType) && !info.qType.includes('system'))
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

/**
 * Tours Configuration property panel section.
 *
 * Defines the tour list array (name, settings, auto-start, behavior,
 * overlay/stage, button labels) and nested step definitions
 * (target, content, positioning).
 *
 * @returns {object} Property panel section definition.
 */
export function toursSection() {
    return {
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
                        expression: 'optional',
                    },
                    tourGroups: {
                        component: 'expandable-items',
                        items: {
                            // --- Tour Settings subsection ---
                            tourSettingsGroup: {
                                type: 'items',
                                label: 'Tour Settings',
                                items: {
                                    // Note: This showCondition is for the entire tour, while each step also has its own showCondition for finer-grained control.
                                    showCondition: {
                                        ref: 'showCondition',
                                        type: 'string',
                                        label: 'Show condition',
                                        description:
                                            'Controls visibility of this tour. Use an expression that evaluates to 1 (show) or 0 (hide). When hidden, all steps of this tour are also hidden.',
                                        defaultValue: '',
                                        expression: 'optional',
                                    },
                                },
                            },

                            // --- Auto-start subsection ---
                            autoStartGroup: {
                                type: 'items',
                                label: 'Auto-start',
                                items: {
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
                                        label: 'Version (increment to reset)',
                                        description:
                                            'Incrementing this number clears the per-user "already seen" flag, so the auto-start tour will be shown again.',
                                        defaultValue: 1,
                                        min: 1,
                                        expression: 'optional',
                                    },
                                },
                            },

                            // --- Behavior subsection ---
                            behaviorGroup: {
                                type: 'items',
                                label: 'Behavior',
                                items: {
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
                                },
                            },

                            // --- Overlay & Stage subsection ---
                            overlayStageGroup: {
                                type: 'items',
                                label: 'Overlay & Stage',
                                items: {
                                    overlayColor: {
                                        ref: 'overlayColor',
                                        type: 'string',
                                        label: 'Overlay color',
                                        description:
                                            'CSS color for the backdrop behind the highlighted element, e.g. rgba(0,0,0,0.6) or #000.',
                                        defaultValue: 'rgba(0, 0, 0, 0.6)',
                                        expression: 'optional',
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
                                        expression: 'optional',
                                    },
                                    stagePadding: {
                                        ref: 'stagePadding',
                                        type: 'integer',
                                        label: 'Stage padding (px)',
                                        description:
                                            'Extra space (in pixels) between the highlighted element and the cutout edge.',
                                        defaultValue: 8,
                                        min: 0,
                                        expression: 'optional',
                                    },
                                    stageRadius: {
                                        ref: 'stageRadius',
                                        type: 'integer',
                                        label: 'Stage border radius (px)',
                                        description:
                                            'Corner rounding (in pixels) of the highlight cutout around the target element.',
                                        defaultValue: 5,
                                        min: 0,
                                        expression: 'optional',
                                    },
                                },
                            },

                            // --- Button Labels subsection ---
                            buttonLabelsGroup: {
                                type: 'items',
                                label: 'Button Labels',
                                items: {
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
                                },
                            },

                            // --- Tour Steps subsection ---
                            tourStepsGroup: {
                                type: 'items',
                                label: 'Tour Steps',
                                items: {
                                    stepsList: {
                                        type: 'array',
                                        ref: 'steps',
                                        label: 'Steps',
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
                                                    {
                                                        value: 'object',
                                                        label: 'Sheet Object',
                                                    },
                                                    {
                                                        value: 'css',
                                                        label: 'Custom CSS Selector',
                                                    },
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
                                            editDescriptionBtn: {
                                                label: 'Edit in Markdown editor',
                                                component: 'button',
                                                /**
                                                 * Open the Markdown editor dialog for this step.
                                                 *
                                                 * @param {object} item - The step data item.
                                                 */
                                                action(item) {
                                                    const cId = item.cId;
                                                    openMarkdownEditorDialog({
                                                        title: 'Edit Popover Description',
                                                        value: item.popoverDescription || '',
                                                        /**
                                                         * Persist the edited text.
                                                         *
                                                         * @param {string} text - Updated Markdown text.
                                                         */
                                                        onSave(text) {
                                                            persistStepProperty(
                                                                cId,
                                                                'popoverDescription',
                                                                text
                                                            );
                                                        },
                                                    });
                                                },
                                            },
                                            stepGroups: {
                                                component: 'expandable-items',
                                                items: {
                                                    stepSettingsGroup: {
                                                        type: 'items',
                                                        label: 'Step Settings',
                                                        items: {
                                                            showCondition: {
                                                                ref: 'showCondition',
                                                                type: 'string',
                                                                label: 'Show condition',
                                                                description:
                                                                    'Controls visibility of this step. Use an expression that evaluates to 1 (show) or 0 (hide).',
                                                                defaultValue: '',
                                                                expression: 'optional',
                                                            },
                                                        },
                                                    },
                                                    stepPositioningGroup: {
                                                        type: 'items',
                                                        label: 'Step Positioning',
                                                        items: {
                                                            popoverSide: {
                                                                ref: 'popoverSide',
                                                                type: 'string',
                                                                label: 'Popover position',
                                                                description:
                                                                    'Which side of the highlighted element the popover appears on.',
                                                                component: 'dropdown',
                                                                defaultValue: 'bottom',
                                                                options: [
                                                                    {
                                                                        value: 'top',
                                                                        label: 'Top',
                                                                    },
                                                                    {
                                                                        value: 'bottom',
                                                                        label: 'Bottom',
                                                                    },
                                                                    {
                                                                        value: 'left',
                                                                        label: 'Left',
                                                                    },
                                                                    {
                                                                        value: 'right',
                                                                        label: 'Right',
                                                                    },
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
                                                                    {
                                                                        value: 'start',
                                                                        label: 'Start',
                                                                    },
                                                                    {
                                                                        value: 'center',
                                                                        label: 'Center',
                                                                    },
                                                                    {
                                                                        value: 'end',
                                                                        label: 'End',
                                                                    },
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
                                                                    {
                                                                        value: 'dynamic',
                                                                        label: 'Dynamic (fit content)',
                                                                    },
                                                                    {
                                                                        value: 'small',
                                                                        label: 'Small (320 × 220)',
                                                                    },
                                                                    {
                                                                        value: 'medium',
                                                                        label: 'Medium (480 × 320)',
                                                                    },
                                                                    {
                                                                        value: 'large',
                                                                        label: 'Large (640 × 420)',
                                                                    },
                                                                    {
                                                                        value: 'x-large',
                                                                        label: 'Extra large (800 × 520)',
                                                                    },
                                                                    {
                                                                        value: 'custom',
                                                                        label: 'Custom…',
                                                                    },
                                                                ],
                                                                /**
                                                                 * Determine visibility of this property panel item.
                                                                 *
                                                                 * Returns true if the dialog size should be shown (selectorType is 'none').
                                                                 *
                                                                 * @param {object} data - Current property data row.
                                                                 * @returns {boolean} True if item should be shown.
                                                                 */
                                                                show: (data) =>
                                                                    data.selectorType === 'none',
                                                            },
                                                            customDialogWidth: {
                                                                ref: 'customDialogWidth',
                                                                type: 'integer',
                                                                label: 'Custom width (px)',
                                                                defaultValue: 500,
                                                                expression: 'optional',
                                                                /**
                                                                 * Determine visibility of this property panel item.
                                                                 *
                                                                 * Returns true if custom width should be shown.
                                                                 *
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
                                                                expression: 'optional',
                                                                /**
                                                                 * Determine visibility of this property panel item.
                                                                 *
                                                                 * Returns true if custom height should be shown.
                                                                 *
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
                                                                    {
                                                                        value: true,
                                                                        label: 'On',
                                                                    },
                                                                    {
                                                                        value: false,
                                                                        label: 'Off',
                                                                    },
                                                                ],
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    };
}

// ---------------------------------------------------------------------------
// Helper — persist a single step property via the Enigma API
// ---------------------------------------------------------------------------

/**
 * Persist a single step-level property change via the Enigma model.
 *
 * Finds the step by its `cId` across all tours and updates the given
 * property, then calls `setProperties` to save.
 *
 * @param {string} cId - The unique cId of the step.
 * @param {string} property - Property name to update.
 * @param {string} value - New value for the property.
 */
async function persistStepProperty(cId, property, value) {
    const { model } = extensionState;
    if (!model) {
        logger.warn('Cannot persist property change — model not available');
        return;
    }

    try {
        const props = await model.getProperties();
        const tours = props.tours || [];
        for (const tour of tours) {
            const step = (tour.steps || []).find((s) => s.cId === cId);
            if (step) {
                step[property] = value;
                await model.setProperties(props);
                return;
            }
        }
        logger.warn('Step not found for cId:', cId);
    } catch (err) {
        logger.warn('Failed to persist Markdown editor change:', err);
    }
}
