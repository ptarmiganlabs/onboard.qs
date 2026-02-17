import logger from '../util/logger';

/**
 * Platform detection and adapter routing.
 *
 * Detects whether running in client-managed Qlik Sense or Qlik Cloud,
 * and returns the appropriate platform adapter module.
 */

/**
 * Detect the current platform.
 *
 * @returns {{ type: 'client-managed' | 'cloud', version: string | null }}
 */
export function detectPlatform() {
    const url = window.location.href;

    // Cloud URLs typically contain *.qlikcloud.com or *.eu.qlikcloud.com etc.
    const isCloud = /qlikcloud\.com/i.test(url) || /\.qlik\.com\/sense/i.test(url);

    if (isCloud) {
        logger.info('Platform detected: Qlik Cloud');
        return { type: 'cloud', version: null };
    }

    logger.info('Platform detected: Client-managed Qlik Sense');
    return { type: 'client-managed', version: null };
}

/**
 * Get the platform adapter module.
 *
 * @returns {Promise<Object>} The platform adapter with: getCurrentSheetId, getSheetObjects,
 *   getObjectSelector, isEditMode, injectCSS
 */
export async function getPlatformAdapter() {
    const platform = detectPlatform();

    if (platform.type === 'cloud') {
        return import('./cloud.js');
    }

    return import('./client-managed.js');
}

/**
 * Synchronous platform adapter getter using pre-detected platform.
 * Used during initial setup where async import isn't practical.
 * Falls back to client-managed if detection fails.
 *
 * @param {string} platformType - 'client-managed' or 'cloud'
 * @returns {Object} Adapter with getObjectSelector function.
 */
export function getObjectSelectorSync(platformType, objectId, _version) {
    // Use class-based selectors — Qlik objects have .qv-object-{objectId} class
    const selector = platformType === 'cloud'
        ? `[data-testid="object-${objectId}"], .qv-object-${objectId}`
        : `.qv-object-${objectId}`;
    return selector;
}
