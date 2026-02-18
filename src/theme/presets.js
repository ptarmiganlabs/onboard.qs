/**
 * Theme presets for Onboard.qs.
 *
 * Each preset defines a complete set of CSS custom-property values
 * covering the widget button, floating menu, and driver.js popover.
 *
 * Keys follow the pattern expected by resolveTheme():
 *   buttonBgColor, buttonTextColor, buttonHoverBgColor, buttonBorderColor,
 *   buttonFontSize, buttonBorderRadius, buttonFontWeight,
 *   menuBgColor, menuTextColor, menuHoverBgColor,
 *   popoverBgColor, popoverTextColor, popoverTitleColor,
 *   popoverButtonBgColor, popoverButtonTextColor, popoverButtonHoverBgColor,
 *   popoverFontSize, popoverBorderRadius,
 *   progressBarColor, fontFamily
 */

/**
 * Default — neutral, minimal palette. A blank canvas for overrides.
 */
export const defaultPreset = {
    buttonBgColor: '#595959',
    buttonTextColor: '#ffffff',
    buttonHoverBgColor: '#404040',
    buttonBorderColor: '#595959',
    buttonFontSize: 13,
    buttonBorderRadius: 4,
    buttonFontWeight: 500,
    menuBgColor: '#ffffff',
    menuTextColor: '#333333',
    menuHoverBgColor: '#f0f0f0',
    popoverBgColor: '#ffffff',
    popoverTextColor: '#555555',
    popoverTitleColor: '#333333',
    popoverButtonBgColor: '#595959',
    popoverButtonTextColor: '#ffffff',
    popoverButtonHoverBgColor: '#404040',
    popoverPrevBgColor: '#e8e8e8',
    popoverPrevTextColor: '#333333',
    popoverPrevHoverBgColor: '#d0d0d0',
    popoverFontSize: 13,
    popoverBorderRadius: 4,
    progressBarColor: '#595959',
    fontFamily: "'QlikView Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
};

/**
 * The Lean Green Machine — full-spectrum Qlik-green theme.
 */
export const leanGreenPreset = {
    buttonBgColor: '#009845',
    buttonTextColor: '#ffffff',
    buttonHoverBgColor: '#007a38',
    buttonBorderColor: '#009845',
    buttonFontSize: 13,
    buttonBorderRadius: 4,
    buttonFontWeight: 500,
    menuBgColor: '#ffffff',
    menuTextColor: '#333333',
    menuHoverBgColor: '#e8f5ee',
    popoverBgColor: '#ffffff',
    popoverTextColor: '#555555',
    popoverTitleColor: '#006b30',
    popoverButtonBgColor: '#009845',
    popoverButtonTextColor: '#ffffff',
    popoverButtonHoverBgColor: '#007a38',
    popoverPrevBgColor: '#e8f5ee',
    popoverPrevTextColor: '#006b30',
    popoverPrevHoverBgColor: '#c8ebd5',
    popoverFontSize: 13,
    popoverBorderRadius: 4,
    progressBarColor: '#00b856',
    fontFamily: "'QlikView Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
};

/**
 * Corporate Blue — authoritative blue palette with gold accents.
 */
export const corporateBluePreset = {
    buttonBgColor: '#165A9B',
    buttonTextColor: '#ffffff',
    buttonHoverBgColor: '#0C3256',
    buttonBorderColor: '#165A9B',
    buttonFontSize: 14,
    buttonBorderRadius: 3,
    buttonFontWeight: 600,
    menuBgColor: '#ffffff',
    menuTextColor: '#222222',
    menuHoverBgColor: '#e6eef6',
    popoverBgColor: '#ffffff',
    popoverTextColor: '#404041',
    popoverTitleColor: '#0C3256',
    popoverButtonBgColor: '#165A9B',
    popoverButtonTextColor: '#ffffff',
    popoverButtonHoverBgColor: '#0C3256',
    popoverPrevBgColor: '#EFEFEF',
    popoverPrevTextColor: '#222222',
    popoverPrevHoverBgColor: '#D0D2D3',
    popoverFontSize: 14,
    popoverBorderRadius: 3,
    progressBarColor: '#FFCC33',
    fontFamily: "'Open Sans', Arial, sans-serif",
};

/**
 * Corporate Gold — warm gold palette with blue accents.
 */
export const corporateGoldPreset = {
    buttonBgColor: '#FFCC33',
    buttonTextColor: '#222222',
    buttonHoverBgColor: '#FFE494',
    buttonBorderColor: '#222222',
    buttonFontSize: 14,
    buttonBorderRadius: 3,
    buttonFontWeight: 600,
    menuBgColor: '#ffffff',
    menuTextColor: '#222222',
    menuHoverBgColor: '#FFFAE6',
    popoverBgColor: '#ffffff',
    popoverTextColor: '#404041',
    popoverTitleColor: '#0C3256',
    popoverButtonBgColor: '#165A9B',
    popoverButtonTextColor: '#ffffff',
    popoverButtonHoverBgColor: '#0C3256',
    popoverPrevBgColor: '#EFEFEF',
    popoverPrevTextColor: '#222222',
    popoverPrevHoverBgColor: '#D0D2D3',
    popoverFontSize: 14,
    popoverBorderRadius: 3,
    progressBarColor: '#165A9B',
    fontFamily: "'Open Sans', Arial, sans-serif",
};

/**
 * Map of preset name to preset object.
 */
export const PRESETS = {
    default: defaultPreset,
    leanGreen: leanGreenPreset,
    corporateBlue: corporateBluePreset,
    corporateGold: corporateGoldPreset,
};

/**
 * Human-readable labels for each preset (used in property panel dropdown).
 */
export const PRESET_LABELS = {
    default: 'Default',
    leanGreen: 'The Lean Green Machine',
    corporateBlue: 'Corporate Blue',
    corporateGold: 'Corporate Gold',
};
