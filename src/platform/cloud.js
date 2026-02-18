import logger from '../util/logger';
import { getSelectors } from './selectors';

/**
 * Qlik Cloud platform adapter.
 *
 * Same interface as client-managed.js but with Cloud-specific
 * DOM selectors and API patterns. This is a STANDALONE module —
 * it does NOT delegate to client-managed.js so that Cloud-specific
 * changes can be made independently.
 */

/**
 * Get the current sheet ID from the Cloud URL.
 *
 * @returns {string|null} The sheet ID or null if not found.
 */
export function getCurrentSheetId() {
    const url = window.location.href;

    // Cloud pattern: /state/analysis/sheet/ID or /sheet/ID
    const match = url.match(/\/sheet\/([a-zA-Z0-9-]+)/);
    if (match) {
        logger.debug('Cloud sheet ID via URL:', match[1]);
        return match[1];
    }

    logger.debug('Could not detect Cloud sheet ID');
    return null;
}

/**
 * Object types to exclude from the sheet objects list.
 *
 * @type {string[]}
 */
const EXCLUDE_TYPES = [
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
 * Get sheet objects using the Engine API.
 *
 * This is a standalone Cloud implementation — identical Engine API calls
 * as client-managed today, but maintained separately so Cloud-specific
 * divergences can be handled without affecting client-managed code.
 *
 * @param {object} app - Enigma app object.
 * @returns {Promise<Array<{id: string, title: string, type: string}>>} Array of sheet objects.
 */
export async function getSheetObjects(app) {
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
                logger.warn('Cloud: could not filter by sheet:', e);
            }
        }

        const objects = infos
            .filter((info) => !EXCLUDE_TYPES.includes(info.qType) && !info.qType.includes('system'))
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
                        } catch (_) {
                            // Object may not be accessible — keep original
                        }
                    }
                    return obj;
                })
            );
            return enriched.sort((a, b) => a.title.localeCompare(b.title));
        }

        return objects.sort((a, b) => a.title.localeCompare(b.title));
    } catch (err) {
        logger.error('Cloud: failed to get sheet objects:', err);
        return [];
    }
}

/**
 * Get the CSS selector for a Qlik object by ID (Cloud variant).
 *
 * @param {string} objectId - The Qlik object ID.
 * @param {string} [codePath] - Cloud code path (currently only 'default').
 * @returns {string} CSS selector string.
 */
export function getObjectSelector(objectId, codePath) {
    const sels = getSelectors('cloud', codePath);
    return sels.objectById(objectId);
}

/**
 * Detect edit mode in Cloud.
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
 * Inject CSS into Cloud document.
 *
 * @param {string} css - CSS text.
 * @param {string} id - Style element ID.
 */
export function injectCSS(css, id) {
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
}
