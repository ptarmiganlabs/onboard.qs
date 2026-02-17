import logger from '../util/logger';
import { getSelectors } from './selectors';

/**
 * Client-managed Qlik Sense platform adapter.
 *
 * Encapsulates all DOM interaction and Sense API calls specific to
 * Qlik Sense Enterprise on Windows (client-managed).
 */

/**
 * Get the current sheet ID from URL, Qlik API, or DOM.
 *
 * @returns {string|null} The sheet ID or null.
 */
export function getCurrentSheetId() {
    const url = window.location.href;

    // Pattern 1: /sheet/ID
    const match1 = url.match(/\/sheet\/([a-zA-Z0-9-]+)/);
    if (match1) {
        logger.debug('Sheet ID via URL pattern:', match1[1]);
        return match1[1];
    }

    // Pattern 2: Qlik global API
    try {
        if (window.qlik?.navigation?.getCurrentSheetId) {
            const qlikSheetId = window.qlik.navigation.getCurrentSheetId();
            const id = typeof qlikSheetId === 'string' ? qlikSheetId : qlikSheetId?.id;
            if (id) {
                logger.debug('Sheet ID via Qlik API:', id);
                return id;
            }
        }
    } catch (_) {}

    // Pattern 3: DOM fallback
    try {
        const selectors = getSelectors('client-managed');
        const sheetEl = document.querySelector(selectors.sheetContainer);
        if (sheetEl) {
            const domId =
                sheetEl.getAttribute('data-id') ||
                sheetEl.getAttribute('data-qid') ||
                sheetEl.getAttribute('id')?.replace('qv-sheet-', '');
            if (domId && domId.length > 5) {
                logger.debug('Sheet ID via DOM:', domId);
                return domId;
            }
        }
    } catch (_) {}

    logger.debug('Could not detect sheet ID');
    return null;
}

/**
 * Get the list of objects on the current sheet.
 *
 * @param {object} app - Enigma app object from useApp().
 * @returns {Promise<Array<{id: string, title: string, type: string}>>} Sheet objects.
 */
export async function getSheetObjects(app) {
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

    try {
        let infos = await app.getAllInfos();
        const sheetId = getCurrentSheetId();

        if (sheetId) {
            try {
                const sheetObj = await app.getObject(sheetId);
                const sheetLayout = await sheetObj.getLayout();
                let sheetObjectIds = (sheetLayout.cells || []).map((c) => c.name);

                if (sheetLayout.qChildList?.qItems) {
                    const childIds = sheetLayout.qChildList.qItems.map((item) => item.qInfo.qId);
                    sheetObjectIds = [...new Set([...sheetObjectIds, ...childIds])];
                }

                const filtered = infos.filter((info) => sheetObjectIds.includes(info.qId));
                if (filtered.length > 0) {
                    infos = filtered;
                }
            } catch (e) {
                logger.warn('Could not filter by sheet:', e);
            }
        }

        const objects = infos
            .filter((info) => !excludeTypes.includes(info.qType) && !info.qType.includes('system'))
            .map((info) => ({
                id: info.qId,
                title: info.qTitle || info.qId,
                type: info.qType,
            }));

        // Enrich titles for objects without a proper title
        if (objects.length < 100) {
            const enriched = await Promise.all(
                objects.map(async (obj) => {
                    if (obj.title === obj.id) {
                        try {
                            const objHandle = await app.getObject(obj.id);
                            const layout = await objHandle.getLayout();
                            return {
                                ...obj,
                                title: layout.title || layout.qMeta?.title || obj.id,
                                type: layout.qInfo?.qType || obj.type,
                            };
                        } catch (_) {}
                    }
                    return obj;
                })
            );
            return enriched.sort((a, b) => a.title.localeCompare(b.title));
        }

        return objects.sort((a, b) => a.title.localeCompare(b.title));
    } catch (err) {
        logger.error('Failed to get sheet objects:', err);
        return [];
    }
}

/**
 * Get the CSS selector for a specific Qlik object by ID.
 * In client-managed Sense, object IDs are embedded in CSS class names
 * on .qv-object elements (e.g., .qv-object-APdJrgp), NOT in data-id attributes.
 *
 * @param {string} objectId - The Qlik object ID.
 * @param {string} [version] - Sense version for version-specific selectors.
 * @returns {string} CSS selector string.
 */
export function getObjectSelector(objectId, version) {
    const sels = getSelectors('client-managed', version);
    return sels.objectById(objectId);
}

/**
 * Detect whether we are in edit mode or analysis mode.
 *
 * @param {object} options - Options from useOptions().
 * @returns {boolean} True if in edit mode.
 */
export function isEditMode(options) {
    if (options.readOnly !== undefined) {
        return !options.readOnly;
    }
    return window.location.href.includes('/state/edit');
}

/**
 * Inject a <style> element into the document head.
 *
 * @param {string} css - CSS string to inject.
 * @param {string} id - Unique ID for the style element (prevents duplicates).
 */
export function injectCSS(css, id) {
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
}
