import {
    useElement,
    useLayout,
    useEffect,
    useApp,
    useModel,
    useRef,
    useOptions,
} from '@nebula.js/stardust';
import ext from './ext';
import definition from './object-properties';
import { renderWidget, renderEditPlaceholder } from './ui/widget-renderer';
import { openTourEditor } from './ui/tour-editor';
import { detectPlatform } from './platform/index';
import { getCurrentSheetId, getSheetObjects, injectCSS } from './platform/client-managed';
import { generateUUID } from './util/uuid';
import logger from './util/logger';
import './style.css';

// Import driver.js CSS as a string — injected at runtime to avoid
// shadow DOM / iframe scoping issues in Qlik Sense
import driverCSS from 'driver.js/dist/driver.css';

/**
 * Onboard QS — Supernova entry point.
 *
 * Provides interactive onboarding tours for Qlik Sense apps
 * using driver.js as the tour engine.
 *
 * @param {Object} galaxy - Nebula galaxy object.
 * @returns {Object} Supernova definition.
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

            // Detect platform once
            const platformRef = useRef(null);
            if (!platformRef.current) {
                platformRef.current = detectPlatform();
            }

            // Detect edit vs analysis mode
            const isEditMode = options.readOnly !== undefined
                ? !options.readOnly
                : window.location.href.includes('/state/edit');

            // Keep layout ref current
            useEffect(() => {
                layoutRef.current = layout;
            }, [layout]);

            // Inject driver.js CSS into the document head (once)
            useEffect(() => {
                if (typeof driverCSS === 'string' && driverCSS.length > 0) {
                    injectCSS(driverCSS, 'onboard-qs-driver-css');
                }
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

                const sheetId = getCurrentSheetId();
                const appId = app?.id || 'unknown';

                if (isEditMode) {
                    // Edit mode: show placeholder with "Edit Tours" button
                    renderEditPlaceholder(element, layout);

                    // Attach "Edit Tours" button handler
                    const editBtn = element.querySelector('.onboard-qs-edit-tours-btn');
                    if (editBtn) {
                        editBtn.addEventListener('click', async () => {
                            const sheetObjects = await getSheetObjects(app);
                            openTourEditor({
                                layout: layoutRef.current,
                                model,
                                app,
                                sheetObjects,
                                onClose: () => {
                                    logger.debug('Tour editor closed');
                                },
                            });
                        });
                    }
                } else {
                    // Analysis mode: render the tour widget
                    renderWidget(element, layout, {
                        appId,
                        sheetId,
                        platformType: platformRef.current.type,
                        senseVersion: platformRef.current.version,
                    });
                }

                initRef.current = true;
            }, [element, layout, isEditMode]);
        },

        ext: ext(galaxy),
    };
}
