import logger from '../util/logger';
import { getSelectors } from './selectors';

/**
 * Qlik Cloud platform adapter (stub).
 *
 * Same interface as client-managed.js but with Cloud-specific
 * DOM selectors and API patterns. This is a placeholder for
 * future Cloud support — the selectors will need updating as
 * the Cloud client evolves.
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
 * Get sheet objects — same Engine API, different fallback selectors.
 *
 * @param {object} app - Enigma app object.
 * @returns {Promise<Array<{id: string, title: string, type: string}>>} Array of sheet objects with id, title and type.
 */
export async function getSheetObjects(app) {
    // Cloud uses the same Engine API as client-managed.
    // Import and delegate to avoid code duplication for now.
    // When Cloud-specific behavior diverges, implement here.
    const { getSheetObjects: cmGetSheetObjects } = await import('./client-managed.js');
    return cmGetSheetObjects(app);
}

/**
 * Get the CSS selector for a Qlik object by ID (Cloud variant).
 *
 * @param {string} objectId - The Qlik object ID.
 * @param {string} [version] - Cloud version (if known).
 * @returns {string} CSS selector string.
 */
export function getObjectSelector(objectId, version) {
    const sels = getSelectors('cloud', version);
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
