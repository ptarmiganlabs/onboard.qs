/**
 * Toolbar injection module for Onboard.qs.
 *
 * Handles finding the toolbar anchor, creating the tour trigger button,
 * injecting it, and watching for SPA navigation/removal so the button
 * persists across sheet changes.
 *
 * Multi-instance support: when several Onboard.qs extension objects live
 * on the same sheet, each registers its visible tours via
 * `registerToolbarTours()`.  The module merges all registered tours into
 * a single toolbar button (or dropdown) so end-users see one unified
 * entry point regardless of the number of extension objects.
 *
 * Awareness of HelpButton.qs: if a `#hbqs-container` element is already
 * present in the toolbar, the Onboard.qs button is inserted *after* it
 * to avoid visual overlap.
 */

import { startTour } from '../tour/tour-helpers';
import { resolveTheme } from '../theme/resolve';
import { isVisible } from '../util/visibility';
import logger from '../util/logger';

/**
 * Unique ID for the injected toolbar button container.
 *
 * @type {string}
 */
const CONTAINER_ID = 'oqs-toolbar-container';

/**
 * Active removal-watcher MutationObserver.
 *
 * @type {MutationObserver | null}
 */
let removalObserver = null;

/**
 * Last-known injection config — stored so watchForRemoval can
 * re-inject the button after SPA navigation even when the
 * Supernova component is no longer mounted.
 *
 * @type {{ adapter: object, platform: object, appId?: string } | null}
 */
let lastConfig = null;

/**
 * Cancellation function for an in-progress waitAndInject call.
 * Ensures only one pending retry is active at a time.
 *
 * @type {(() => void) | null}
 */
let pendingWaitCancel = null;

/**
 * Original inline styles of the toolbar anchor before we mutated them.
 * Stored so destroyToolbarButton() can restore the toolbar's original width.
 *
 * @type {{ width: string, minWidth: string } | null}
 */
let savedAnchorStyles = null;

/**
 * Interval timer that checks whether the toolbar anchor is still in the DOM.
 * Acts as a lightweight fallback for SPA navigation where the entire anchor
 * element is removed (the narrow MutationObserver on the anchor would not
 * fire in that case).
 *
 * @type {ReturnType<typeof setInterval> | null}
 */
let anchorCheckTimer = null;

/**
 * Reference to the active outside-click handler for the toolbar dropdown menu.
 * Stored at module scope so it can be removed from all close paths.
 *
 * @type {((e: Event) => void) | null}
 */
let activeMenuCloseHandler = null;

// ---------------------------------------------------------------------------
// Multi-instance tour registry
// ---------------------------------------------------------------------------

/**
 * Registry of tours contributed by each Onboard.qs extension object.
 * Key = object ID (layout.qInfo.qId), value = { tours, layout }.
 *
 * @type {Map<string, { tours: Array, layout: object }>}
 */
const tourRegistry = new Map();

/**
 * Register tours from one Onboard.qs extension object and rebuild the
 * toolbar button with the merged tour list.
 *
 * @param {string} objectId - Unique object ID (layout.qInfo.qId).
 * @param {object} layout - Extension layout from useLayout().
 * @param {object} adapter - Platform adapter module.
 * @param {{ type: string, codePath: string, version: string | null }} platform - Platform detection result.
 * @param {string} [appId] - Application ID from the app context.
 */
export function registerToolbarTours(objectId, layout, adapter, platform, appId) {
    const allTours = layout.tours || [];
    const tours = allTours.filter((t) => isVisible(t.showCondition));

    if (tours.length === 0) {
        // This object has no visible tours — unregister it
        unregisterToolbarTours(objectId);
        return;
    }

    tourRegistry.set(objectId, { tours, layout });

    // Store adapter/platform/appId so we can rebuild without
    // needing every instance to call again
    lastConfig = { adapter, platform, appId };

    rebuildToolbarButton();
}

/**
 * Unregister tours for a specific Onboard.qs object and rebuild (or
 * remove) the toolbar button.
 *
 * @param {string} objectId - Unique object ID.
 * @param {{ clearConfig?: boolean }} [options] - When clearConfig is true,
 *   also wipe stored config so watchForRemoval will NOT re-inject.
 */
export function unregisterToolbarTours(objectId, { clearConfig = false } = {}) {
    tourRegistry.delete(objectId);

    if (clearConfig && tourRegistry.size === 0) {
        lastConfig = null;
    }

    if (tourRegistry.size === 0) {
        destroyToolbarButton({ clearConfig });
    } else {
        rebuildToolbarButton();
    }
}

/**
 * Rebuild the toolbar button from all registered tours.
 * Called internally after register/unregister operations.
 */
function rebuildToolbarButton() {
    if (!lastConfig) return;
    const { adapter, platform, appId } = lastConfig;
    injectToolbarButton(adapter, platform, appId);
}

/**
 * Inject (or re-inject) the "Start Tour" button into the Qlik Sense
 * app toolbar using the merged tour list from the registry.
 *
 * If a toolbar button already exists it is replaced so layout changes
 * (button text, tours, theme) are reflected immediately.
 *
 * @param {object} adapter - Platform adapter module (cloud or client-managed).
 * @param {{ type: string, codePath: string, version: string | null }} platform - Platform detection result.
 * @param {string} [appId] - Application ID from the app context.
 */
function injectToolbarButton(adapter, platform, appId) {
    // Merge tours from all registered objects
    const mergedTours = [];
    const seenNames = new Set();
    for (const { tours } of tourRegistry.values()) {
        for (const tour of tours) {
            const key = tour.tourId || tour.tourName || JSON.stringify(tour);
            if (!seenNames.has(key)) {
                seenNames.add(key);
                mergedTours.push(tour);
            }
        }
    }

    if (mergedTours.length === 0) {
        destroyToolbarButton();
        return;
    }

    // Remove stale button before (re-)injecting
    const existing = document.getElementById(CONTAINER_ID);
    if (existing) existing.remove();

    const anchor = adapter.getToolbarAnchor(platform.codePath);
    if (!anchor) {
        logger.debug('Toolbar anchor not found, will retry via observer');
        waitAndInject(adapter, platform, appId);
        return;
    }

    logger.debug('Toolbar anchor found. Injecting Onboard.qs toolbar button…');

    // Use the first registered object's layout for button text and theme
    const firstEntry = tourRegistry.values().next().value;
    const layout = firstEntry ? firstEntry.layout : {};
    const widgetConfig = layout.widget || {};
    const buttonText = widgetConfig.toolbarButtonText || 'Start Tour';
    const cssVars = resolveTheme(layout);

    // Use merged tours
    const tours = mergedTours;

    // -- Container --
    const container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.className = 'oqs-toolbar-container';

    // -- Button --
    const btn = document.createElement('button');
    btn.className = 'oqs-toolbar-btn';
    btn.type = 'button';
    btn.title = buttonText;
    btn.setAttribute('aria-label', buttonText);

    // Apply theme colours via CSS custom properties
    if (cssVars['--oqs-btn-bg']) btn.style.setProperty('--oqs-tb-bg', cssVars['--oqs-btn-bg']);
    if (cssVars['--oqs-btn-hover-bg'])
        btn.style.setProperty('--oqs-tb-bg-hover', cssVars['--oqs-btn-hover-bg']);
    if (cssVars['--oqs-btn-text'])
        btn.style.setProperty('--oqs-tb-text', cssVars['--oqs-btn-text']);
    if (cssVars['--oqs-btn-border'])
        btn.style.setProperty('--oqs-tb-border', cssVars['--oqs-btn-border']);

    // Graduation cap icon (SVG) + label
    btn.innerHTML =
        `<span class="oqs-toolbar-btn__icon">${graduationCapSvg(16)}</span>` +
        `<span class="oqs-toolbar-btn__label">${escapeHtml(buttonText)}</span>` +
        (tours.length > 1 ? ' <span class="oqs-toolbar-btn__caret">&#9662;</span>' : '');

    container.appendChild(btn);

    // Build context for starting tours
    const sheetId = adapter.getCurrentSheetId();
    const resolvedAppId = appId || 'unknown';
    const context = {
        platformType: platform.type,
        senseVersion: platform.version,
        codePath: platform.codePath,
        appId: resolvedAppId,
        sheetId,
    };

    // -- Click handler --
    if (tours.length === 1) {
        btn.addEventListener('click', () => {
            startTour(tours[0], context);
        });
    } else {
        btn.setAttribute('aria-haspopup', 'true');
        btn.setAttribute('aria-expanded', 'false');
        btn.addEventListener('click', () => {
            showToolbarMenu(btn, tours, context, cssVars);
        });
    }

    // -- Insert into toolbar --
    // If HelpButton.qs is present, insert immediately after it
    const hbqsContainer = anchor.querySelector('#hbqs-container');
    if (hbqsContainer && hbqsContainer.nextSibling) {
        anchor.insertBefore(container, hbqsContainer.nextSibling);
    } else if (hbqsContainer) {
        anchor.appendChild(container);
    } else {
        // No HelpButton.qs — insert as first child
        anchor.insertBefore(container, anchor.firstChild);
    }

    // Client-managed: ensure the anchor has enough width
    if (platform.type === 'client-managed') {
        if (!savedAnchorStyles) {
            savedAnchorStyles = {
                width: anchor.style.width,
                minWidth: anchor.style.minWidth,
            };
        }
        anchor.style.width = 'auto';
        anchor.style.minWidth = '300px';
    }

    // -- Watch for removal (SPA navigation) --
    watchForRemoval();

    logger.info('Onboard.qs toolbar button injected');
}

/**
 * Remove the toolbar button and clean up observers.
 *
 * @param {{ clearConfig?: boolean }} [options] - When clearConfig is true,
 *   also wipe stored config and the tour registry so watchForRemoval
 *   will NOT re-inject.
 */
export function destroyToolbarButton({ clearConfig = false } = {}) {
    if (clearConfig) {
        lastConfig = null;
        tourRegistry.clear();
    }

    if (removalObserver) {
        removalObserver.disconnect();
        removalObserver = null;
    }
    if (anchorCheckTimer) {
        clearInterval(anchorCheckTimer);
        anchorCheckTimer = null;
    }

    const container = document.getElementById(CONTAINER_ID);
    if (container) {
        // Restore original anchor styles before removing the button
        if (savedAnchorStyles) {
            const anchor = container.parentElement;
            if (anchor) {
                anchor.style.width = savedAnchorStyles.width;
                anchor.style.minWidth = savedAnchorStyles.minWidth;
            }
            savedAnchorStyles = null;
        }
        container.remove();
    }

    // Also remove any floating menu and its close handler
    const menu = document.getElementById('oqs-toolbar-menu');
    if (menu) menu.remove();
    removeMenuCloseHandler();

    logger.debug('Toolbar button destroyed', clearConfig ? '(config cleared)' : '(config kept)');
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Wait for the toolbar to appear, then inject.
 * Uses a MutationObserver + polling fallback.
 *
 * @param {object} adapter - Platform adapter module.
 * @param {object} platform - Platform detection result.
 * @param {string} [appId] - Application ID.
 */
function waitAndInject(adapter, platform, appId) {
    // Cancel any previous pending wait so only one is active at a time
    if (pendingWaitCancel) {
        pendingWaitCancel();
        pendingWaitCancel = null;
    }

    const startTime = Date.now();
    const timeout = 30000;
    const pollInterval = 500;
    let observer = null;
    let pollTimer = null;
    let cancelled = false;

    /**
     * Attempt injection and clean up watchers on success.
     *
     * @returns {boolean} True if injection succeeded, false otherwise.
     */
    function tryInject() {
        if (cancelled) return false;
        const anchor = adapter.getToolbarAnchor(platform.codePath);
        if (anchor) {
            cleanup();
            injectToolbarButton(adapter, platform, appId);
            return true;
        }
        return false;
    }

    /** Remove observer and timer. */
    function cleanup() {
        cancelled = true;
        pendingWaitCancel = null;
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
    }

    // Register this wait as the active singleton
    pendingWaitCancel = cleanup;

    if (typeof MutationObserver !== 'undefined') {
        observer = new MutationObserver(() => {
            tryInject();
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    pollTimer = setInterval(() => {
        if (tryInject()) return;
        if (Date.now() - startTime > timeout) {
            logger.warn('Timeout: toolbar anchor did not appear within', timeout, 'ms');
            cleanup();
        }
    }, pollInterval);
}

/**
 * Watch for removal of the toolbar button (SPA navigation).
 * Re-injects after a short delay when the button disappears from the DOM.
 */
function watchForRemoval() {
    if (removalObserver) {
        removalObserver.disconnect();
        removalObserver = null;
    }
    if (anchorCheckTimer) {
        clearInterval(anchorCheckTimer);
        anchorCheckTimer = null;
    }

    if (typeof MutationObserver === 'undefined') return;

    const container = document.getElementById(CONTAINER_ID);
    if (!container || !container.parentElement) return;

    const anchor = container.parentElement;

    // Observe the toolbar anchor only — fires when its direct children
    // are added/removed.  Much narrower than document.documentElement.
    removalObserver = new MutationObserver(() => {
        if (!document.getElementById(CONTAINER_ID) && lastConfig) {
            logger.debug('Toolbar button removed from DOM. Re-injecting…');
            setTimeout(() => {
                if (lastConfig) {
                    injectToolbarButton(lastConfig.adapter, lastConfig.platform, lastConfig.appId);
                }
            }, 300);
        }
    });
    removalObserver.observe(anchor, { childList: true });

    // Fallback: periodically check if the anchor itself was removed from
    // the DOM (e.g. full SPA navigation that replaces the toolbar).  A
    // 2 s interval is far cheaper than a document-wide subtree observer.
    anchorCheckTimer = setInterval(() => {
        if (!document.contains(anchor)) {
            clearInterval(anchorCheckTimer);
            anchorCheckTimer = null;
            if (removalObserver) {
                removalObserver.disconnect();
                removalObserver = null;
            }
            if (lastConfig) {
                logger.debug('Toolbar anchor removed from DOM (SPA navigation?). Re-injecting…');
                setTimeout(() => {
                    if (lastConfig) {
                        injectToolbarButton(
                            lastConfig.adapter,
                            lastConfig.platform,
                            lastConfig.appId
                        );
                    }
                }, 300);
            }
        }
    }, 2000);
}

/**
 * Show a floating dropdown menu anchored to the toolbar button.
 *
 * @param {HTMLElement} trigger - The toolbar button element.
 * @param {Array} tours - Visible tour configurations.
 * @param {object} context - Tour start context.
 * @param {object} cssVars - Resolved theme CSS variables.
 */
function showToolbarMenu(trigger, tours, context, cssVars) {
    // Toggle off if already open
    const existing = document.getElementById('oqs-toolbar-menu');
    if (existing) {
        existing.remove();
        trigger.setAttribute('aria-expanded', 'false');
        removeMenuCloseHandler();
        return;
    }

    const rect = trigger.getBoundingClientRect();

    const menu = document.createElement('div');
    menu.id = 'oqs-toolbar-menu';
    menu.className = 'oqs-toolbar-menu';
    menu.style.top = `${rect.bottom + 4}px`;
    menu.style.right = `${window.innerWidth - rect.right}px`;

    // Apply theme colours
    if (cssVars['--oqs-menu-bg']) menu.style.setProperty('--oqs-menu-bg', cssVars['--oqs-menu-bg']);
    if (cssVars['--oqs-menu-text'])
        menu.style.setProperty('--oqs-menu-text', cssVars['--oqs-menu-text']);
    if (cssVars['--oqs-menu-hover-bg'])
        menu.style.setProperty('--oqs-menu-hover-bg', cssVars['--oqs-menu-hover-bg']);

    tours.forEach((tour, i) => {
        const item = document.createElement('button');
        item.className = 'oqs-toolbar-menu__item';
        item.textContent = tour.tourName || `Tour ${i + 1}`;
        item.addEventListener('click', () => {
            menu.remove();
            trigger.setAttribute('aria-expanded', 'false');
            removeMenuCloseHandler();
            startTour(tour, context);
        });
        menu.appendChild(item);
    });

    document.body.appendChild(menu);
    trigger.setAttribute('aria-expanded', 'true');

    // Close on outside click
    /**
     * Handle clicks outside the toolbar menu to close it.
     *
     * @param {Event} e - Click event.
     */
    const closeHandler = (e) => {
        if (!menu.contains(e.target) && !trigger.contains(e.target)) {
            menu.remove();
            trigger.setAttribute('aria-expanded', 'false');
            removeMenuCloseHandler();
        }
    };

    // Remove any stale handler before registering a new one
    removeMenuCloseHandler();
    activeMenuCloseHandler = closeHandler;
    setTimeout(() => {
        document.addEventListener('click', closeHandler, true);
    }, 0);
}

/**
 * Remove the active outside-click handler for the toolbar menu, if any.
 */
function removeMenuCloseHandler() {
    if (activeMenuCloseHandler) {
        document.removeEventListener('click', activeMenuCloseHandler, true);
        activeMenuCloseHandler = null;
    }
}

/**
 * Inline SVG for a graduation-cap icon (tour / onboarding).
 *
 * @param {number} size - Icon size in pixels.
 * @returns {string} SVG markup string.
 */
function graduationCapSvg(size) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5"/></svg>`;
}

/**
 * Escape HTML to prevent XSS in user-provided text.
 *
 * @param {string} str - Raw string.
 * @returns {string} Escaped string.
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
