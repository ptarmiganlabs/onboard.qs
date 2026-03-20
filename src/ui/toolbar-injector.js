/**
 * Toolbar injection module for Onboard.qs.
 *
 * Handles finding the toolbar anchor, creating the tour trigger button,
 * injecting it, and watching for SPA navigation/removal so the button
 * persists across sheet changes.
 *
 * Awareness of HelpButton.qs: if a `#hbqs-container` element is already
 * present in the toolbar, the Onboard.qs button is inserted *after* it
 * to avoid visual overlap.
 */

import { runTour } from '../tour/tour-runner';
import { hasSeenTour } from '../tour/tour-storage';
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
 * @type {{ layout: object, adapter: object, platform: object } | null}
 */
let lastConfig = null;

/**
 * Inject the "Start Tour" button into the Qlik Sense app toolbar.
 *
 * If a toolbar button already exists it is replaced so layout changes
 * (button text, tours, theme) are reflected immediately.
 *
 * @param {object} layout - Extension layout from useLayout().
 * @param {object} adapter - Platform adapter module (cloud or client-managed).
 * @param {{ type: string, codePath: string, version: string | null }} platform - Platform detection result.
 * @param {string} [appId] - Application ID from the app context.
 */
export function injectToolbarButton(layout, adapter, platform, appId) {
    const allTours = layout.tours || [];
    const tours = allTours.filter((t) => isVisible(t.showCondition));

    if (tours.length === 0) {
        destroyToolbarButton();
        return;
    }

    // Persist config for watchForRemoval re-injection
    lastConfig = { layout, adapter, platform, appId };

    // Remove stale button before (re-)injecting
    const existing = document.getElementById(CONTAINER_ID);
    if (existing) existing.remove();

    const anchor = adapter.getToolbarAnchor(platform.codePath);
    if (!anchor) {
        logger.debug('Toolbar anchor not found, will retry via observer');
        waitAndInject(layout, adapter, platform, appId);
        return;
    }

    logger.debug('Toolbar anchor found. Injecting Onboard.qs toolbar button…');

    const widgetConfig = layout.widget || {};
    const buttonText = widgetConfig.toolbarButtonText || 'Start Tour';
    const cssVars = resolveTheme(layout);

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
        anchor.style.width = 'auto';
        anchor.style.minWidth = '300px';
    }

    // -- Watch for removal (SPA navigation) --
    watchForRemoval();

    // -- Handle auto-start tours --
    handleAutoStart(tours, layout, context);

    logger.info('Onboard.qs toolbar button injected');
}

/**
 * Remove the toolbar button and clean up observers.
 *
 * @param {{ clearConfig?: boolean }} [options] - When clearConfig is true,
 *   also wipe stored config so watchForRemoval will NOT re-inject.
 */
export function destroyToolbarButton({ clearConfig = false } = {}) {
    if (clearConfig) {
        lastConfig = null;
    }

    if (removalObserver) {
        removalObserver.disconnect();
        removalObserver = null;
    }

    const container = document.getElementById(CONTAINER_ID);
    if (container) container.remove();

    // Also remove any floating menu
    const menu = document.getElementById('oqs-toolbar-menu');
    if (menu) menu.remove();

    logger.debug('Toolbar button destroyed', clearConfig ? '(config cleared)' : '(config kept)');
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Wait for the toolbar to appear, then inject.
 * Uses a MutationObserver + polling fallback.
 *
 * @param {object} layout - Extension layout.
 * @param {object} adapter - Platform adapter module.
 * @param {object} platform - Platform detection result.
 * @param {string} [appId] - Application ID.
 */
function waitAndInject(layout, adapter, platform, appId) {
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
            injectToolbarButton(layout, adapter, platform, appId);
            return true;
        }
        return false;
    }

    /** Remove observer and timer. */
    function cleanup() {
        cancelled = true;
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
    }

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

    if (typeof MutationObserver === 'undefined') return;

    removalObserver = new MutationObserver(() => {
        if (!document.getElementById(CONTAINER_ID) && lastConfig) {
            logger.debug('Toolbar button removed from DOM (SPA navigation?). Re-injecting…');
            setTimeout(() => {
                if (lastConfig) {
                    injectToolbarButton(
                        lastConfig.layout,
                        lastConfig.adapter,
                        lastConfig.platform,
                        lastConfig.appId
                    );
                }
            }, 300);
        }
    });

    removalObserver.observe(document.documentElement, { childList: true, subtree: true });
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
        if (!menu.contains(e.target) && e.target !== trigger) {
            menu.remove();
            trigger.setAttribute('aria-expanded', 'false');
            document.removeEventListener('click', closeHandler, true);
        }
    };
    setTimeout(() => {
        document.addEventListener('click', closeHandler, true);
    }, 0);
}

/**
 * Start a specific tour.
 *
 * @param {object} tourConfig - Tour configuration.
 * @param {object} context - Context with platformType, senseVersion, codePath, appId, sheetId.
 */
function startTour(tourConfig, context) {
    runTour(tourConfig, {
        platformType: context.platformType,
        senseVersion: context.senseVersion,
        codePath: context.codePath,
        appId: context.appId,
        sheetId: context.sheetId,
    });
}

/**
 * Handle auto-starting tours that should trigger on sheet load.
 *
 * @param {Array} tours - Visible tour configurations.
 * @param {object} layout - Extension layout.
 * @param {object} context - Context with appId, sheetId, etc.
 */
function handleAutoStart(tours, layout, context) {
    tours.forEach((tour) => {
        if (!tour.autoStart) return;

        if (tour.showOnce) {
            const seen = hasSeenTour(
                context.appId,
                context.sheetId,
                tour.tourId,
                tour.tourVersion || 1
            );
            if (seen) {
                logger.debug(`Tour "${tour.tourName}" already seen, skipping auto-start`);
                return;
            }
        }

        setTimeout(() => {
            logger.info(`Auto-starting tour "${tour.tourName}"`);
            startTour(tour, context);
        }, 500);
    });
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
