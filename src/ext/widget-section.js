/**
 * Widget Appearance property panel section.
 *
 * Contains properties for the extension's start-tour button:
 * visibility, text, style, alignment, sizing, and host UI toggles.
 *
 * @returns {object} Property panel section definition.
 */
export function widgetSection() {
    return {
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
                show: (data) =>
                    data.widget?.showButton !== false && data.widget?.fillWidget !== true,
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
                show: (data) =>
                    data.widget?.showButton !== false && data.widget?.fillWidget !== true,
            },
            buttonWidth: {
                ref: 'widget.buttonWidth',
                type: 'string',
                label: 'Button width (%)',
                description:
                    'Width of the button as a percentage (1–100) of the extension object. Leave empty for auto (content-based) sizing.',
                defaultValue: '',
                expression: 'optional',
                placeholder: 'Auto',
                /**
                 * Determine visibility of this property panel item.
                 *
                 * @param {object} data - Current property data row.
                 * @returns {boolean} True if item should be shown.
                 */
                show: (data) =>
                    data.widget?.showButton !== false && data.widget?.fillWidget !== true,
            },
            buttonHeight: {
                ref: 'widget.buttonHeight',
                type: 'string',
                label: 'Button height (%)',
                description:
                    'Height of the button as a percentage (1–100) of the extension object. Leave empty for auto (content-based) sizing.',
                defaultValue: '',
                expression: 'optional',
                placeholder: 'Auto',
                /**
                 * Determine visibility of this property panel item.
                 *
                 * @param {object} data - Current property data row.
                 * @returns {boolean} True if item should be shown.
                 */
                show: (data) =>
                    data.widget?.showButton !== false && data.widget?.fillWidget !== true,
            },
            fillWidget: {
                ref: 'widget.fillWidget',
                type: 'boolean',
                label: 'Fill entire widget',
                description:
                    'Expand the button to cover the entire extension object area, removing all internal spacing and border radius.',
                defaultValue: false,
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
                show: (data) => data.widget?.showButton !== false,
            },
            hideHoverMenu: {
                ref: 'widget.hideHoverMenu',
                type: 'boolean',
                label: 'Hide hover menu',
                description:
                    'Hide the object hover menu (three-dot menu and expand button) that appears when hovering over this extension. Overrides the app-level setting.',
                defaultValue: false,
                component: 'switch',
                options: [
                    { value: true, label: 'On' },
                    { value: false, label: 'Off' },
                ],
            },
            hideContextMenu: {
                ref: 'widget.hideContextMenu',
                type: 'boolean',
                label: 'Hide context menu',
                description:
                    'Hide the right-click context menu on this extension object. Overrides the app-level setting.',
                defaultValue: false,
                component: 'switch',
                options: [
                    { value: true, label: 'On' },
                    { value: false, label: 'Off' },
                ],
            },
            toolbarHeader: {
                component: 'text',
                label: '── Toolbar Button ──',
            },
            showToolbarButton: {
                ref: 'widget.showToolbarButton',
                type: 'boolean',
                label: 'Show toolbar button',
                description:
                    'Inject a "Start Tour" button into the Qlik Sense app toolbar (top-right area), next to HelpButton.qs if present.',
                defaultValue: false,
                component: 'switch',
                options: [
                    { value: true, label: 'On' },
                    { value: false, label: 'Off' },
                ],
            },
            toolbarButtonText: {
                ref: 'widget.toolbarButtonText',
                type: 'string',
                label: 'Toolbar button text',
                defaultValue: 'Start Tour',
                expression: 'optional',
                /**
                 * Determine visibility of this property panel item.
                 *
                 * @param {object} data - Current property data row.
                 * @returns {boolean} True if item should be shown.
                 */
                show: (data) => data.widget?.showToolbarButton === true,
            },
            hideWidget: {
                ref: 'widget.hideWidget',
                type: 'boolean',
                label: 'Hide sheet widget',
                description:
                    'Completely hide the extension object on the sheet in analysis mode. Useful when the toolbar button is the only trigger.',
                defaultValue: false,
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
                show: (data) => data.widget?.showToolbarButton === true,
            },
        },
    };
}
