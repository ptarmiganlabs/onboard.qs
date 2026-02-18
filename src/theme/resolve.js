/**
 * Theme resolver for Onboard.qs.
 *
 * Merges a preset's defaults with any per-property overrides from the
 * extension layout, then produces a flat map of CSS custom-property
 * name → value that can be applied to the widget container and the
 * driver.js popover.
 */

import { PRESETS, defaultPreset } from './presets';

/**
 * Set of property keys that use the color-picker component.
 * These are stored at the root of the layout (flat refs) for
 * compatibility with the Qlik color-picker component.
 */
const COLOR_PICKER_KEYS = new Set([
    'buttonBgColor', 'buttonTextColor', 'buttonHoverBgColor', 'buttonBorderColor',
    'popoverBgColor', 'popoverTextColor', 'popoverTitleColor',
    'popoverButtonBgColor', 'popoverButtonTextColor', 'popoverButtonHoverBgColor',
    'progressBarColor',
    'menuBgColor', 'menuTextColor', 'menuHoverBgColor',
]);

/**
 * Mapping from theme-property keys to CSS custom-property names.
 */
const CSS_VAR_MAP = {
    buttonBgColor: '--oqs-btn-bg',
    buttonTextColor: '--oqs-btn-text',
    buttonHoverBgColor: '--oqs-btn-hover-bg',
    buttonBorderColor: '--oqs-btn-border',
    buttonFontSize: '--oqs-btn-font-size',
    buttonBorderRadius: '--oqs-btn-border-radius',
    buttonFontWeight: '--oqs-btn-font-weight',
    menuBgColor: '--oqs-menu-bg',
    menuTextColor: '--oqs-menu-text',
    menuHoverBgColor: '--oqs-menu-hover-bg',
    popoverBgColor: '--oqs-popover-bg',
    popoverTextColor: '--oqs-popover-text',
    popoverTitleColor: '--oqs-popover-title',
    popoverButtonBgColor: '--oqs-popover-btn-bg',
    popoverButtonTextColor: '--oqs-popover-btn-text',
    popoverButtonHoverBgColor: '--oqs-popover-btn-hover-bg',
    popoverPrevBgColor: '--oqs-popover-prev-bg',
    popoverPrevTextColor: '--oqs-popover-prev-text',
    popoverPrevHoverBgColor: '--oqs-popover-prev-hover-bg',
    popoverFontSize: '--oqs-popover-font-size',
    popoverBorderRadius: '--oqs-popover-border-radius',
    progressBarColor: '--oqs-progress-color',
    fontFamily: '--oqs-font-family',
};

/**
 * Properties whose values are numeric pixel values.
 * When converting to CSS, these get a 'px' suffix.
 */
const PX_PROPERTIES = new Set([
    'buttonFontSize',
    'buttonBorderRadius',
    'popoverFontSize',
    'popoverBorderRadius',
]);

/**
 * Resolve the theme for a given layout, merging preset defaults
 * with per-property overrides.
 *
 * @param {object} layout - The extension layout containing `theme`.
 * @returns {object} Map of CSS custom-property name → value string.
 */
export function resolveTheme(layout) {
    const themeConfig = layout.theme || {};
    const presetName = themeConfig.preset || 'default';
    const preset = PRESETS[presetName] || defaultPreset;

    const cssVars = {};

    for (const [key, cssVar] of Object.entries(CSS_VAR_MAP)) {
        // Color-picker properties are stored at root layout level (flat refs),
        // other theme properties remain under layout.theme.
        const raw = COLOR_PICKER_KEYS.has(key) ? layout[key] : themeConfig[key];
        let value;

        // Handle color-picker object format: { color: 'hexval', index: N }
        if (raw != null && typeof raw === 'object' && typeof raw.color === 'string') {
            // Color-picker values now include '#' prefix. Normalise in case
            // older persisted objects still lack it.
            value = raw.color
                ? (raw.color.startsWith('#') ? raw.color : `#${raw.color}`)
                : preset[key];
        } else if (raw != null && raw !== '') {
            value = raw;
        } else {
            value = preset[key];
        }

        // Add 'px' suffix for pixel properties.
        // Values may arrive as numbers (from presets) or strings (from
        // the property panel which now uses type:'string' inputs).
        if (PX_PROPERTIES.has(key)) {
            const num = typeof value === 'number' ? value : Number(value);
            if (!Number.isNaN(num)) {
                value = `${num}px`;
            }
        }

        cssVars[cssVar] = String(value);
    }

    return cssVars;
}

/**
 * Apply resolved CSS variables to an HTML element (sets inline custom properties).
 *
 * @param {HTMLElement} element - Target element.
 * @param {object} cssVars - Map of CSS variable name → value from resolveTheme().
 */
export function applyThemeToElement(element, cssVars) {
    for (const [prop, value] of Object.entries(cssVars)) {
        element.style.setProperty(prop, value);
    }
}

/**
 * Generate a <style> block string scoping CSS variables to a given selector.
 * Used for popover theming (popovers are appended to document.body).
 *
 * @param {object} cssVars - Map of CSS variable name → value from resolveTheme().
 * @param {string} [selector] - CSS selector scope (defaults to '.onboard-qs-popover').
 * @returns {string} CSS text content.
 */
export function buildPopoverThemeCSS(cssVars, selector = '.onboard-qs-popover') {
    const declarations = Object.entries(cssVars)
        .map(([prop, value]) => `  ${prop}: ${value};`)
        .join('\n');
    return `${selector} {\n${declarations}\n}`;
}

/**
 * Inject or update a <style> element in the document head.
 *
 * @param {string} cssText - The CSS text content.
 * @param {string} id - Unique ID for the style element.
 */
export function injectThemeStyle(cssText, id) {
    let styleEl = document.getElementById(id);
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = id;
        document.head.appendChild(styleEl);
    }
    styleEl.textContent = cssText;
}
