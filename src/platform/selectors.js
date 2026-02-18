/**
 * Versioned CSS selector registry for Qlik Sense objects.
 *
 * When the Qlik client DOM changes (new Sense version, Cloud updates),
 * update THIS FILE ONLY — all other code uses these selectors indirectly.
 *
 * Each platform has a `codePaths` map keyed by code-path name.
 * The `default` code path is the fallback.
 *
 * Client-managed: code paths are resolved via version-range mapping
 * (see client-managed.js `resolveCodePath()`).
 *
 * Cloud: code paths are resolved by the cloud adapter; currently only
 * `default` exists.
 */

const selectors = {
    'client-managed': {
        /**
         * Default / current code-path selectors.
         * Covers Sense versions that use the standard .qv-object-{id} class-based DOM.
         */
        default: {
            /**
             * Selector for a Qlik object by its object ID.
             * The object ID is embedded in a CSS class on the article.qv-object
             * element, e.g. `.qv-object-APdJrgp`.
             *
             * @param {string} objectId - The Qlik object ID.
             * @returns {string} CSS selector string.
             */
            objectById: (objectId) => `.qv-object-${objectId}`,

            /** Selector for all Qlik objects on the sheet. */
            allObjects: '.qv-object',

            /** Selector for the sheet container. */
            sheetContainer: '.qv-sheet, .qv-panel-sheet, .qv-panel-content',

            /** Selector for the sheet title area. */
            sheetTitle: '.sheet-title-container, .qs-sheet-title',

            /** Selector for the Qlik toolbar / navigation bar. */
            toolbar: '.qv-toolbar-container, .qs-toolbar',

            /** Selector for grid cells (each cell wraps one object). */
            gridCell: '.qv-gridcell',
        },

        // Add future code-path overrides here. Only the selectors that
        // differ from `default` need to be specified — they are merged at
        // lookup time.
        //
        // Example:
        // future: {
        //     objectById: (objectId) => `[data-qv-id="${objectId}"]`,
        // },
    },

    cloud: {
        /**
         * Default Cloud selectors.
         * Playwright investigation (Feb 2026) confirmed:
         *   - Visualization objects use `.qv-object-{id}` classes (same as client-managed).
         *   - `data-testid` attributes exist only on toolbar / chrome elements,
         *     NOT on visualization objects.
         *   - Grid cells use `.qv-gridcell[tid="{id}"]`.
         *   - Sheet container uses `.qvt-sheet.qv-panel-sheet`.
         *
         * Cloud can change its DOM at any time — keep these separate from
         * client-managed even when they look identical today.
         */
        default: {
            /**
             * Selector for a Qlik object by its object ID.
             *
             * @param {string} objectId - The Qlik object ID.
             * @returns {string} CSS selector string.
             */
            objectById: (objectId) => `.qv-object-${objectId}`,

            /** Selector for all Qlik objects on the sheet. */
            allObjects: '.qv-object',

            /** Selector for the sheet container. */
            sheetContainer: '.qvt-sheet.qv-panel-sheet',

            /** Selector for the sheet title area. */
            sheetTitle: '.sheet-title-container',

            /** Selector for the Qlik toolbar (Cloud MUI toolbar). */
            toolbar: '[data-testid="top-bar-root"]',

            /** Selector for the Cloud sub-toolbar (selections bar, edit button). */
            subToolbar: '[data-testid="qs-sub-toolbar"]',

            /** Selector for the edit button in Cloud. */
            editButton: '[data-testid="toolbar-edit-button"]',

            /** Selector for the main analysis content area. */
            analysisContent: '[data-testid="sense-analysis-content"]',

            /** Selector for grid cells. */
            gridCell: '.qv-gridcell',
        },
    },
};

/**
 * Get the selector set for a given platform and code-path name.
 *
 * @param {string} platform - 'client-managed' or 'cloud'.
 * @param {string} [codePath] - Code-path name (e.g. 'default', 'legacy'). Falls back to 'default'.
 * @returns {object} Selector functions/strings for the given platform and code path.
 */
export function getSelectors(platform, codePath) {
    const platformSelectors = selectors[platform];
    if (!platformSelectors) {
        return selectors['client-managed'].default;
    }

    const base = platformSelectors.default;

    // If a specific code-path override exists, merge it onto the defaults
    if (codePath && codePath !== 'default' && platformSelectors[codePath]) {
        return { ...base, ...platformSelectors[codePath] };
    }

    return base;
}

export default selectors;
