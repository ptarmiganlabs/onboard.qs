/**
 * Versioned CSS selector registry for Qlik Sense objects.
 *
 * When the Qlik client DOM changes (new Sense version, Cloud updates),
 * update THIS FILE ONLY — all other code uses these selectors indirectly.
 *
 * Each entry maps: (platform, senseVersion) → selector patterns.
 * The `default` key is used when no version-specific override exists.
 */

const selectors = {
    'client-managed': {
        default: {
            /**
             * Selector for a Qlik object by its object ID.
             * In client-managed Sense, the object ID is embedded in a CSS class
             * on the .qv-object element, e.g. `.qv-object-APdJrgp`.
             * NOTE: There is NO `data-id` attribute on .qv-object elements.
             */
            objectById: (objectId) => `.qv-object-${objectId}`,

            /** Selector for all Qlik objects on the sheet */
            allObjects: '.qv-object',

            /** Selector for the sheet container */
            sheetContainer: '.qv-sheet, .qv-panel-sheet, .qv-panel-content',

            /** Selector for the sheet title area */
            sheetTitle: '.sheet-title-container, .qs-sheet-title',

            /** Selector for the Qlik toolbar / navigation bar */
            toolbar: '.qv-toolbar-container, .qs-toolbar',
        },
        // Version-specific overrides (example structure for future use)
        // '14.254.6': {
        //     objectById: (objectId) => `.qv-object-${objectId}`,
        // },
    },

    cloud: {
        default: {
            /**
             * Cloud uses data-testid attributes more extensively.
             * Falls back to class-based selector if data-testid is absent.
             */
            objectById: (objectId) => `[data-testid="object-${objectId}"], .qv-object-${objectId}`,

            allObjects: '[data-testid^="object-"], .qv-object',

            objectIdAttr: 'data-testid',

            sheetContainer: '[data-testid="sheet-container"], .qv-sheet',

            sheetTitle: '[data-testid="sheet-title"]',

            toolbar: '[data-testid="toolbar"]',
        },
    },
};

/**
 * Get the selector set for a given platform and version.
 *
 * @param {string} platform - 'client-managed' or 'cloud'
 * @param {string} [version] - Specific Sense version string (e.g. '14.254.6')
 * @returns {Object} Selector functions/strings for the given platform.
 */
export function getSelectors(platform, version) {
    const platformSelectors = selectors[platform];
    if (!platformSelectors) {
        return selectors['client-managed'].default;
    }

    // Check for version-specific overrides first, then fall back to default
    if (version && platformSelectors[version]) {
        return { ...platformSelectors.default, ...platformSelectors[version] };
    }

    return platformSelectors.default;
}

export default selectors;
