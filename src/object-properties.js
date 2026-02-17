/**
 * Default properties for the Onboard.qs extension.
 */
export default {
    showTitles: false,
    title: 'Onboard.qs',
    subtitle: '',
    footnote: '',
    widget: {
        showButton: true,
        buttonText: 'Start Tour',
        buttonStyle: 'primary',
        horizontalAlign: 'center',
        verticalAlign: 'center',
    },
    theme: {
        preset: 'leanGreen',
        buttonFontSize: null,
        buttonBorderRadius: null,
        buttonFontWeight: null,
        popoverFontSize: null,
        popoverBorderRadius: null,
        fontFamily: null,
    },
    // Color overrides — flat refs for color-picker component compatibility.
    // Populated from default preset (leanGreen).
    buttonBgColor: { color: '#009845', index: '-1' },
    buttonTextColor: { color: '#ffffff', index: '-1' },
    buttonHoverBgColor: { color: '#007a38', index: '-1' },
    buttonBorderColor: { color: '#009845', index: '-1' },
    menuBgColor: { color: '#ffffff', index: '-1' },
    menuTextColor: { color: '#333333', index: '-1' },
    menuHoverBgColor: { color: '#e8f5ee', index: '-1' },
    popoverBgColor: { color: '#ffffff', index: '-1' },
    popoverTextColor: { color: '#555555', index: '-1' },
    popoverTitleColor: { color: '#006b30', index: '-1' },
    popoverButtonBgColor: { color: '#009845', index: '-1' },
    popoverButtonTextColor: { color: '#ffffff', index: '-1' },
    popoverButtonHoverBgColor: { color: '#007a38', index: '-1' },
    progressBarColor: { color: '#00b856', index: '-1' },
    tours: [],
};
