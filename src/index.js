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
import ext from './ext';
import definition from './object-properties';
import { renderWidget, renderEditPlaceholder, openAboutModal } from './ui/widget-renderer';
import { openTourEditor } from './ui/tour-editor';
import { detectPlatform, detectPlatformType, getPlatformAdapter } from './platform/index';
import { generateUUID } from './util/uuid';
import { resolveTheme, buildPopoverThemeCSS, injectThemeStyle } from './theme/resolve';
import logger, { PACKAGE_VERSION } from './util/logger';
import './style.css';

// Import driver.js CSS as a string — injected at runtime to avoid
// shadow DOM / iframe scoping issues in Qlik Sense
import driverCSS from 'driver.js/dist/driver.css';

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
                        aboutBtn.addEventListener('click', () => openAboutModal(PACKAGE_VERSION));
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
                renderWidget(element, layout, {
                    appId,
                    sheetId,
                    platformType: platform.type,
                    senseVersion: platform.version,
                    codePath: platform.codePath,
                });

                initRef.current = true;
            }, [element, layout, isEditMode, platform, adapter]);
        },

        ext: ext(galaxy),
    };
}
