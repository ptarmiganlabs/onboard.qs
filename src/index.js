import {
    useElement,
    useLayout,
    useEffect,
    useApp,
    useModel,
    useRef,
    useState,
    useOptions,
} from '@nebula.js/stardust';
import ext from './ext/index';
import definition from './object-properties';
import { renderWidget, renderEditPlaceholder, openAboutModal } from './ui/widget-renderer';
import { openTourEditor } from './ui/tour-editor';
import { injectToolbarButton, destroyToolbarButton } from './ui/toolbar-injector';
import { detectPlatform, detectPlatformType, getPlatformAdapter } from './platform/index';
import { generateUUID } from './util/uuid';
import { resolveTheme, buildPopoverThemeCSS, injectThemeStyle } from './theme/resolve';
import logger, { PACKAGE_VERSION, BUILD_DATE } from './util/logger';
import './style.css';

// Import driver.js CSS as a string — injected at runtime to avoid
// shadow DOM / iframe scoping issues in Qlik Sense
import driverCSS from 'driver.js/dist/driver.css';

// ── Shared context-menu MutationObserver ──────────────────────────────
// A single MutationObserver on `document.body` is shared across all
// extension instances that have `hideContextMenu` enabled.  Each
// instance registers a callback; the observer starts when the first
// subscriber is added and stops when the last one is removed.
// This avoids the cost of N observers when a sheet contains N objects.

/** @type {MutationObserver | null} */
let sharedObserver = null;

/** @type {Set<(mutations: MutationRecord[]) => void>} */
const observerSubscribers = new Set();

/**
 * Subscribe a callback to the shared body MutationObserver.
 * Starts the observer lazily on the first subscriber.
 *
 * @param {(mutations: MutationRecord[]) => void} callback - Called with each batch of mutations.
 *
 * @returns {function(): void} Unsubscribe function that removes the callback
 *   and disconnects the observer when no subscribers remain.
 */
function subscribeContextMenuObserver(callback) {
    observerSubscribers.add(callback);

    if (!sharedObserver) {
        sharedObserver = new MutationObserver((mutations) => {
            for (const cb of observerSubscribers) {
                try {
                    cb(mutations);
                } catch {
                    // Isolate subscriber failures so one broken callback
                    // does not prevent the remaining subscribers from
                    // processing the mutations.
                }
            }
        });
        sharedObserver.observe(document.body, { childList: true });
    }

    return () => {
        observerSubscribers.delete(callback);
        if (observerSubscribers.size === 0 && sharedObserver) {
            sharedObserver.disconnect();
            sharedObserver = null;
        }
    };
}

/**
 * Onboard.qs — Supernova entry point.
 *
 * Provides interactive onboarding tours for Qlik Sense apps
 * using driver.js as the tour engine.
 *
 * @param {object} galaxy - Nebula galaxy object.
 * @returns {object} Supernova definition.
 */
export default function supernova(galaxy) {
    return {
        qae: {
            properties: definition,
            data: {
                targets: [],
            },
        },

        /**
         * Main component logic.
         */
        component() {
            const layout = useLayout();
            const element = useElement();
            const app = useApp();
            const model = useModel();
            const options = useOptions();
            const layoutRef = useRef(layout);
            const initRef = useRef(false);

            // Platform detection: async, resolved once then cached in state.
            // useState (not useRef) ensures a re-render when detection completes.
            const [platform, setPlatform] = useState(null);
            const [adapter, setAdapter] = useState(null);

            // Detect edit vs analysis mode.
            // options.readOnly is preferred (set by Qlik after first toggle) but may
            // be undefined on the very first render when navigating directly to an
            // edit URL.  Fallback: check for Client Managed (/state/edit) *and*
            // Qlik Cloud (/sheet/<id>/edit) URL patterns.
            const isEditMode =
                options.readOnly !== undefined
                    ? !options.readOnly
                    : /\/edit(?:\b|$)/.test(window.location.pathname);

            // Keep layout ref current
            useEffect(() => {
                layoutRef.current = layout;
            }, [layout]);

            // One-time async platform detection + adapter loading.
            // Using useState (above) ensures the component re-renders once
            // detection finishes, so the main render effect picks up the values.
            useEffect(() => {
                let cancelled = false;

                (async () => {
                    if (platform && adapter) return;

                    try {
                        const detectedAdapter = getPlatformAdapter();
                        const detectedPlatform = await detectPlatform();

                        if (cancelled) return;

                        setPlatform(detectedPlatform);
                        setAdapter(detectedAdapter);

                        // Inject driver.js CSS via the adapter's injectCSS
                        if (typeof driverCSS === 'string' && driverCSS.length > 0) {
                            detectedAdapter.injectCSS(driverCSS, 'onboard-qs-driver-css');
                        }

                        logger.info(
                            `Platform ready: ${detectedPlatform.type} v${detectedPlatform.version ?? '?'} (${detectedPlatform.codePath})`
                        );
                    } catch (err) {
                        logger.error('Platform detection failed:', err);
                        // Fallback: use synchronous type detection
                        const type = detectPlatformType();
                        setPlatform({ type, version: null, codePath: 'default' });
                        setAdapter(getPlatformAdapter());
                    }
                })();

                return () => {
                    cancelled = true;
                };
            }, []);

            // Ensure each tour has an ID (for tours created via property panel without the modal editor)
            useEffect(() => {
                if (!layout.tours) return;
                let needsUpdate = false;
                const tours = layout.tours.map((tour) => {
                    if (!tour.tourId) {
                        needsUpdate = true;
                        return { ...tour, tourId: generateUUID() };
                    }
                    return tour;
                });
                if (needsUpdate) {
                    model.getProperties().then((props) => {
                        props.tours = tours;
                        model.setProperties(props);
                    });
                }
            }, [layout.tours]);

            // Main render effect
            useEffect(() => {
                if (!element) return;

                // Inject/update popover theme CSS (popovers are appended to document.body)
                const cssVars = resolveTheme(layout);
                const popoverCSS = buildPopoverThemeCSS(cssVars);
                injectThemeStyle(popoverCSS, 'onboard-qs-popover-theme');

                if (isEditMode) {
                    // Edit mode: show placeholder with "Edit Tours" button.
                    // No platform detection needed — render immediately.
                    renderEditPlaceholder(element, layout);

                    // Keep toolbar button visible while editing (if enabled)
                    if (layout.widget?.showToolbarButton && platform && adapter) {
                        injectToolbarButton(layout, adapter, platform, app?.id);
                    }

                    // --- Responsive size tiers via ResizeObserver ---
                    const widgetEl = element.querySelector('.onboard-qs-widget--edit');
                    let resizeObserver;
                    if (widgetEl && typeof ResizeObserver !== 'undefined') {
                        /**
                         * Classify the available height into xs / sm / md tiers
                         * and stamp a data-size attribute so CSS can adapt.
                         */
                        const classify = () => {
                            const h = widgetEl.clientHeight;
                            const w = widgetEl.clientWidth;
                            let size = 'md';
                            if (h < 80) size = 'xs';
                            else if (h < 160) size = 'sm';
                            widgetEl.setAttribute('data-size', size);
                            // Narrow flag for xs row→column fallback
                            widgetEl.setAttribute('data-narrow', w < 160 ? 'true' : 'false');
                        };
                        resizeObserver = new ResizeObserver(classify);
                        resizeObserver.observe(widgetEl);
                        classify(); // initial classification
                    }

                    // Attach "About" button handler
                    const aboutBtn = element.querySelector('.onboard-qs-about-btn');
                    if (aboutBtn) {
                        aboutBtn.addEventListener('click', () =>
                            openAboutModal(PACKAGE_VERSION, BUILD_DATE)
                        );
                    }

                    // Attach "Edit Tours" button handler
                    const editBtn = element.querySelector('.onboard-qs-edit-tours-btn');
                    if (editBtn) {
                        /**
                         * Handle click on "Edit Tours" button to open the tour editor.
                         */
                        editBtn.addEventListener('click', async () => {
                            // Ensure adapter is available before opening editor
                            const currentAdapter = adapter || getPlatformAdapter();
                            const sheetObjects = await currentAdapter.getSheetObjects(app);
                            openTourEditor({
                                layout: layoutRef.current,
                                model,
                                app,
                                sheetObjects,
                                /**
                                 * Callback when the tour editor is closed.
                                 */
                                onClose: () => {
                                    logger.debug('Tour editor closed');
                                },
                            });
                        });
                    }
                    initRef.current = true;

                    // Cleanup: disconnect observer when effect re-runs or unmounts
                    return () => {
                        if (resizeObserver) resizeObserver.disconnect();
                    };
                }

                // Analysis mode: needs platform for tour selector resolution
                if (!platform || !adapter) return;

                const sheetId = adapter.getCurrentSheetId();
                const appId = app?.id || 'unknown';

                // Clean up previous render's event listeners
                if (element._onboardCleanup) {
                    element._onboardCleanup();
                }
                // Strip Qlik Sense host padding on the visualization
                // content area so our widget truly fills 100% of the object.
                element.style.padding = '0';
                element.style.overflow = 'hidden';

                // When "Fill entire widget" is active, also strip padding,
                // borders and the title header from Qlik Sense host wrappers
                // so the button truly covers the entire grid cell area.
                const fillWidget = layout.widget?.fillWidget === true;
                const innerObj = element.closest('.qv-inner-object');
                const articleEl = element.closest('article.qv-object');
                const headerEl = innerObj?.querySelector(':scope > header.qv-object-header');

                if (fillWidget) {
                    if (innerObj) innerObj.style.padding = '0';
                    if (articleEl) articleEl.style.border = 'none';
                    if (headerEl) headerEl.style.display = 'none';
                } else {
                    // Restore defaults when fill is toggled off
                    if (innerObj) innerObj.style.padding = '';
                    if (articleEl) articleEl.style.border = '';
                    if (headerEl) headerEl.style.display = '';
                }

                renderWidget(element, layout, {
                    appId,
                    sheetId,
                    platformType: platform.type,
                    senseVersion: platform.version,
                    codePath: platform.codePath,
                });

                // --- Toolbar button injection ---
                const showToolbarButton = layout.widget?.showToolbarButton === true;
                if (showToolbarButton) {
                    injectToolbarButton(layout, adapter, platform, appId);
                } else {
                    destroyToolbarButton({ clearConfig: true });
                }

                // --- Hide widget (grid cell) in analysis mode ---
                // hideWidget is only effective when toolbar button is also enabled
                // (the property panel enforces this with a show() condition)
                const hideWidget = layout.widget?.hideWidget === true && showToolbarButton;

                // Resolve the outermost Qlik wrapper for this object.
                // Client-managed: the hover nav (.qv-object-nav) is rendered
                // inside a detached sibling of .qv-object, both under the same
                // .qv-gridcell.  We must target .qv-gridcell so CSS descendant
                // selectors can reach the detached nav.
                // Cloud: objects also sit inside .qv-gridcell.
                // Falls back to `element` itself when no Qlik wrapper is found
                // (e.g. during detach/re-render).
                const qlikWrapper =
                    element.closest('.qv-gridcell') ||
                    element.closest('.qv-object') ||
                    element.parentElement ||
                    element;

                if (hideWidget) {
                    qlikWrapper.classList.add('oqs-hidden-widget');
                    qlikWrapper.setAttribute('aria-hidden', 'true');
                }

                // --- Context menu & hover menu visibility overrides ---
                const hideContextMenu = layout.widget?.hideContextMenu === true;
                const hideHoverMenu = layout.widget?.hideHoverMenu === true;

                // Context menu: Qlik Sense renders its context menu
                // (.qv-contextmenu) at document-body level via an AngularJS
                // digest cycle — not directly from the DOM contextmenu event.
                // Capture-phase stopPropagation cannot prevent it.  Instead we
                // use a two-pronged approach:
                //  1. Prevent the native browser context menu via the event.
                //  2. Use a MutationObserver to immediately remove the
                //     .qv-contextmenu node that Qlik appends to the body
                //     right after our right-click.
                let contextMenuHandler;
                let unsubscribeObserver;
                let rightClickTimer;
                if (hideContextMenu) {
                    // Track whether a right-click just happened inside our
                    // extension so the shared observer only acts on our
                    // object's context menu, not other objects on the sheet.
                    let recentRightClick = false;

                    /**
                     * Flag that a right-click originated from this extension
                     * and suppress the native browser context menu.
                     *
                     * @param {Event} e - The contextmenu event.
                     */
                    contextMenuHandler = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        recentRightClick = true;
                        clearTimeout(rightClickTimer);
                        // Reset after a short window — Qlik appends the menu
                        // synchronously in the same or next digest cycle.
                        rightClickTimer = setTimeout(() => {
                            recentRightClick = false;
                        }, 500);
                    };
                    qlikWrapper.addEventListener('contextmenu', contextMenuHandler, true);

                    /**
                     * Callback registered with the shared body MutationObserver.
                     * Removes Qlik's context-menu popover as soon as it is
                     * inserted into the DOM, but only when the right-click
                     * originated from this extension.
                     *
                     * Client-managed uses `.qv-contextmenu` (wraps `.lui-popover`).
                     * Cloud uses a React overlay with `[data-testid="qmfe-menu"]`
                     * (role="menu") appended to a portal container near body.
                     *
                     * @param {MutationRecord[]} mutations - Batch of DOM mutations.
                     */
                    const onBodyMutation = (mutations) => {
                        if (!recentRightClick) return;
                        for (const mutation of mutations) {
                            for (const node of mutation.addedNodes) {
                                if (node.nodeType !== 1) continue;
                                // Client-managed context menu: match only
                                // .qv-contextmenu nodes (not generic .lui-popover)
                                const qvContextMenu = node.classList?.contains('qv-contextmenu')
                                    ? node
                                    : node.querySelector?.('.qv-contextmenu');
                                if (qvContextMenu) {
                                    qvContextMenu.remove();
                                    recentRightClick = false;
                                    return;
                                }
                                // Cloud context menu (React portal with data-testid="qmfe-menu")
                                const cloudMenu =
                                    node.getAttribute?.('data-testid') === 'qmfe-menu'
                                        ? node
                                        : node.querySelector?.('[data-testid="qmfe-menu"]');
                                if (cloudMenu) {
                                    cloudMenu.remove();
                                    recentRightClick = false;
                                    return;
                                }
                            }
                        }
                    };
                    unsubscribeObserver = subscribeContextMenuObserver(onBodyMutation);
                }

                // Hover menu: apply a hiding class to the grid-cell wrapper so
                // the CSS rule `.onboard-qs-no-hover-menu .qv-object-nav`
                // matches the detached nav that Qlik renders as a sibling of
                // .qv-object inside .qv-gridcell.
                let hoverMenuTarget;
                if (hideHoverMenu) {
                    hoverMenuTarget = qlikWrapper;
                    hoverMenuTarget.classList.add('onboard-qs-no-hover-menu');
                }

                initRef.current = true;

                /**
                 * Cleanup: remove context menu handler, shared observer
                 * subscription, pending timer, hover menu hiding class,
                 * and hidden-widget class when the effect re-runs or
                 * the component unmounts.
                 */
                return () => {
                    if (contextMenuHandler) {
                        qlikWrapper.removeEventListener('contextmenu', contextMenuHandler, true);
                        clearTimeout(rightClickTimer);
                    }
                    if (unsubscribeObserver) {
                        unsubscribeObserver();
                    }
                    if (hoverMenuTarget) {
                        hoverMenuTarget.classList.remove('onboard-qs-no-hover-menu');
                    }
                    qlikWrapper.classList.remove('oqs-hidden-widget');
                    qlikWrapper.removeAttribute('aria-hidden');
                };
            }, [element, layout, isEditMode, platform, adapter]);
        },

        ext: ext(galaxy),
    };
}
