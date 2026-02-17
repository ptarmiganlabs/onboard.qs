import logger from './util/logger';
import { PACKAGE_VERSION } from './util/logger';

/**
 * Extension property panel definition for Onboard QS.
 *
 * Provides a hybrid editing approach:
 *   - Basic tour/step configuration via the Qlik property panel
 *   - Rich editing via the in-extension modal editor (see tour-editor.js)
 *
 * @param {Object} _galaxy - Nebula galaxy object.
 * @returns {Object} Property panel definition.
 */
export default function ext(_galaxy) {
    /**
     * Get the list of objects on the current sheet for dropdown population.
     *
     * @param {Object} data - Current data row.
     * @param {Object} handler - Property handler (contains app, properties).
     * @returns {Promise<Array<{value: string, label: string}>>}
     */
    const getObjectList = async (data, handler) => {
        const { app } = handler;
        logger.debug('Fetching object list for property panel...');

        const excludeTypes = [
            'sheet', 'story', 'appprops', 'loadmodel',
            'dimension', 'measure', 'masterobject',
            'qix-system-dimension', 'onboard-qs',
        ];

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
                    (info) =>
                        !excludeTypes.includes(info.qType) &&
                        !info.qType.includes('system')
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
                            show: (data) => data.widget?.showButton !== false,
                        },
                        buttonStyle: {
                            ref: 'widget.buttonStyle',
                            type: 'string',
                            label: 'Button style',
                            component: 'dropdown',
                            defaultValue: 'primary',
                            options: [
                                { value: 'primary', label: 'Primary (green)' },
                                { value: 'secondary', label: 'Secondary (gray)' },
                                { value: 'minimal', label: 'Minimal (outline)' },
                            ],
                            show: (data) => data.widget?.showButton !== false,
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
                                    defaultValue: 'New Tour',
                                },
                                autoStart: {
                                    ref: 'autoStart',
                                    type: 'boolean',
                                    label: 'Auto-start on sheet load',
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
                                    defaultValue: true,
                                    component: 'switch',
                                    options: [
                                        { value: true, label: 'On' },
                                        { value: false, label: 'Off' },
                                    ],
                                    show: (data) => data.autoStart === true,
                                },
                                tourVersion: {
                                    ref: 'tourVersion',
                                    type: 'integer',
                                    label: 'Tour version (increment to reset "seen" flag)',
                                    defaultValue: 1,
                                    min: 1,
                                },
                                showProgress: {
                                    ref: 'showProgress',
                                    type: 'boolean',
                                    label: 'Show progress indicator',
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
                                    defaultValue: true,
                                    component: 'switch',
                                    options: [
                                        { value: true, label: 'On' },
                                        { value: false, label: 'Off' },
                                    ],
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
                                            component: 'dropdown',
                                            defaultValue: 'object',
                                            options: [
                                                { value: 'object', label: 'Sheet Object' },
                                                { value: 'css', label: 'Custom CSS Selector' },
                                            ],
                                        },
                                        targetObjectId: {
                                            ref: 'targetObjectId',
                                            type: 'string',
                                            label: 'Target object',
                                            component: 'dropdown',
                                            options: getObjectList,
                                            show: (data) => data.selectorType !== 'css',
                                        },
                                        customCssSelector: {
                                            ref: 'customCssSelector',
                                            type: 'string',
                                            label: 'CSS selector',
                                            defaultValue: '',
                                            expression: 'optional',
                                            show: (data) => data.selectorType === 'css',
                                        },
                                        popoverTitle: {
                                            ref: 'popoverTitle',
                                            type: 'string',
                                            label: 'Popover title',
                                            defaultValue: '',
                                            expression: 'optional',
                                        },
                                        popoverDescription: {
                                            ref: 'popoverDescription',
                                            type: 'string',
                                            label: 'Popover description',
                                            defaultValue: '',
                                            expression: 'optional',
                                        },
                                        popoverSide: {
                                            ref: 'popoverSide',
                                            type: 'string',
                                            label: 'Popover position',
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
                                            component: 'dropdown',
                                            defaultValue: 'center',
                                            options: [
                                                { value: 'start', label: 'Start' },
                                                { value: 'center', label: 'Center' },
                                                { value: 'end', label: 'End' },
                                            ],
                                        },
                                        disableInteraction: {
                                            ref: 'disableInteraction',
                                            type: 'boolean',
                                            label: 'Disable interaction during step',
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
                            label: `Onboard QS v${PACKAGE_VERSION}`,
                        },
                        description: {
                            component: 'text',
                            label: 'Interactive onboarding tours for Qlik Sense apps. Powered by driver.js.',
                        },
                        homepage: {
                            component: 'link',
                            label: 'Documentation',
                            url: 'https://github.com/ptarmiganlabs/onboard.qs',
                        },
                        driverjsLink: {
                            component: 'link',
                            label: 'driver.js documentation',
                            url: 'https://driverjs.com/',
                        },
                    },
                },
            },
        },
    };
}
