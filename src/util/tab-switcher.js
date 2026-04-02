/**
 * Tab-switcher utility for Onboard.qs.
 *
 * When a tour step targets a Qlik object that lives inside a tab container,
 * the object's DOM element only exists when its tab is active (inactive tab
 * panels are lazy-rendered — completely empty).
 *
 * This module provides helpers to:
 *  1. Check whether an object lives inside a tab container.
 *  2. Programmatically switch to the correct tab.
 *  3. Wait for the child element to appear in the DOM.
 *
 * The metadata map (childObjectId → container/tab info) is maintained in
 * `extensionState.tabContainerMap` and populated during object discovery
 * in getSheetObjects() / getObjectList().
 *
 * @module util/tab-switcher
 */

import logger from './logger';
import { extensionState } from './extension-state';
import { getSelectors } from '../platform/selectors';

/**
 * Scan sheet objects for tab containers and populate
 * `extensionState.tabContainerMap`.
 *
 * This must be called once during analysis-mode initialization so that
 * the metadata is available before any tour runs (auto-start or manual).
 *
 * @param {object} app - The Enigma app handle.
 * @param {{ getCurrentSheetId: () => string|null }} adapter - Platform adapter.
 * @returns {Promise<void>}
 */
export async function buildTabContainerMap(app, adapter) {
    if (!app || !adapter) return;

    const sheetId = adapter.getCurrentSheetId();
    if (!sheetId) return;

    try {
        const sheetObj = await app.getObject(sheetId);
        const sheetLayout = await sheetObj.getLayout();
        const sheetObjectIds = (sheetLayout.cells || []).map((c) => c.name);

        // Also include direct children from qChildList (e.g. objects
        // that are not in cells but appear in the sheet child list).
        if (sheetLayout.qChildList?.qItems) {
            for (const item of sheetLayout.qChildList.qItems) {
                if (item.qInfo?.qId && !sheetObjectIds.includes(item.qInfo.qId)) {
                    sheetObjectIds.push(item.qInfo.qId);
                }
            }
        }

        const tabMap = {};

        /**
         * Recursively inspect an object and its children for tab containers.
         *
         * @param {string} id - Qlik object ID to inspect.
         */
        async function inspectObject(id) {
            try {
                const objHandle = await app.getObject(id);
                const layout = await objHandle.getLayout();
                if (layout.qInfo?.qType === 'sn-tabbed-container' && layout.qChildList?.qItems) {
                    layout.qChildList.qItems.forEach((item) => {
                        if (item.qData?.childRefId) {
                            tabMap[item.qInfo.qId] = {
                                containerId: id,
                                tabCId: item.qData.childRefId,
                                tabLabel:
                                    item.qData.title || item.qData.visualization || item.qInfo.qId,
                            };
                        }
                    });
                } else if (layout.qChildList?.qItems) {
                    // Not a tab container but has children (e.g. layout
                    // container) — walk children to find nested tab
                    // containers.
                    for (const child of layout.qChildList.qItems) {
                        if (child.qInfo?.qId) {
                            await inspectObject(child.qInfo.qId);
                        }
                    }
                }
            } catch (_) {
                // Skip objects we can't inspect (e.g. missing permissions)
            }
        }

        for (const id of sheetObjectIds) {
            await inspectObject(id);
        }

        extensionState.tabContainerMap = tabMap;
        if (Object.keys(tabMap).length > 0) {
            logger.debug(
                'Tab container metadata built for',
                Object.keys(tabMap).length,
                'children'
            );
        }
    } catch (e) {
        logger.warn('buildTabContainerMap: could not scan sheet objects:', e);
    }
}

/**
 * Look up whether an object is inside a tab container.
 *
 * @param {string} objectId - The Qlik object ID.
 * @returns {{ containerId: string, tabCId: string, tabLabel: string } | null}
 *     Tab metadata, or null if the object is not inside a tab container.
 */
export function getTabInfo(objectId) {
    return extensionState.tabContainerMap[objectId] || null;
}

/**
 * Wait for a DOM element matching a CSS selector to appear.
 *
 * @param {string} selector - CSS selector to wait for.
 * @param {number} [timeout] - Maximum wait time in ms (default: 2000).
 * @param {number} [interval] - Polling interval in ms (default: 50).
 * @returns {Promise<Element|null>} The element, or null on timeout.
 */
export function waitForElement(selector, timeout = 2000, interval = 50) {
    return new Promise((resolve) => {
        const el = document.querySelector(selector);
        if (el) {
            resolve(el);
            return;
        }

        const start = Date.now();
        const timer = setInterval(() => {
            const found = document.querySelector(selector);
            if (found) {
                clearInterval(timer);
                resolve(found);
            } else if (Date.now() - start >= timeout) {
                clearInterval(timer);
                logger.warn(`waitForElement: timeout waiting for "${selector}"`);
                resolve(null);
            }
        }, interval);
    });
}

/**
 * Ensure that the tab containing a child object is active so the
 * object's DOM element exists and is visible.
 *
 * If the object is not inside a tab container, this is a no-op.
 * If the correct tab is already active, this is a no-op.
 *
 * @param {string} objectId - The Qlik child object ID.
 * @param {string} platformType - 'client-managed' or 'cloud'.
 * @param {string} [codePath] - Code-path name for selector lookup (default: 'default').
 * @returns {Promise<Element|null>} The child object's DOM element after
 *     the tab switch (or null if not found / not in a tab container).
 */
export async function ensureTabVisible(objectId, platformType, codePath = 'default') {
    const tabInfo = getTabInfo(objectId);
    if (!tabInfo) {
        // Not inside a tab container — nothing to do
        return null;
    }

    const selectors = getSelectors(platformType, codePath);

    // Check whether the child element already exists in the DOM
    // (its tab may already be active)
    const objectSelector = selectors.objectById(objectId);
    const existing = document.querySelector(objectSelector);
    if (existing) {
        return existing;
    }

    // Find and click the tab button
    // TODO: Cloud — if Cloud uses a different tab switching mechanism, add platform branch here
    const tabButtonSelector = selectors.tabButton(tabInfo.tabCId);
    const tabButton = document.querySelector(tabButtonSelector);

    if (!tabButton) {
        logger.warn(
            `ensureTabVisible: tab button not found for "${tabInfo.tabCId}" ` +
                `(container ${tabInfo.containerId}). Selector: ${tabButtonSelector}`
        );
        return null;
    }

    logger.debug(
        `ensureTabVisible: switching to tab "${tabInfo.tabLabel}" ` +
            `(cId=${tabInfo.tabCId}) for object ${objectId}`
    );

    tabButton.click();

    // Wait for the child element to appear after the tab switch.
    // Qlik's Angular digest cycle typically renders synchronously, but
    // the nebula/supernova rendering inside the tab panel may be async.
    const element = await waitForElement(objectSelector);

    if (!element) {
        logger.warn(
            `ensureTabVisible: object ${objectId} not found in DOM after ` +
                `switching to tab "${tabInfo.tabLabel}"`
        );
    }

    return element;
}

/**
 * Synchronous variant — clicks the tab and returns immediately.
 * Useful when a synchronous return is required (e.g. inside a
 * driver.js element() function that doesn't support async).
 *
 * @param {string} objectId - The Qlik child object ID.
 * @param {string} platformType - 'client-managed' or 'cloud'.
 * @param {string} [codePath] - Code-path name for selector lookup (default: 'default').
 * @returns {Element|null} The child object's DOM element if already
 *     present, or null (caller should re-query after a short delay).
 */
export function ensureTabVisibleSync(objectId, platformType, codePath = 'default') {
    const tabInfo = getTabInfo(objectId);
    if (!tabInfo) return null;

    const selectors = getSelectors(platformType, codePath);
    const objectSelector = selectors.objectById(objectId);

    // Already visible?
    const existing = document.querySelector(objectSelector);
    if (existing) return existing;

    // Click the tab
    const tabButtonSelector = selectors.tabButton(tabInfo.tabCId);
    const tabButton = document.querySelector(tabButtonSelector);
    if (tabButton) {
        tabButton.click();
    }

    // Re-query — may or may not be there yet (sync render)
    return document.querySelector(objectSelector);
}
