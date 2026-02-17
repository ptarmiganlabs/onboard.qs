import logger from '../util/logger';
import { runTour } from '../tour/tour-runner';
import { hasSeenTour } from '../tour/tour-storage';

/**
 * Widget renderer for analysis mode.
 *
 * Renders the tour trigger UI: a "Start Tour" button that launches
 * driver.js tours. Supports multiple tours with a dropdown selector,
 * and auto-start with "show once" gating.
 */

/**
 * Render the widget into the extension's DOM element.
 *
 * @param {HTMLElement} element - The extension's container element.
 * @param {object} layout - The extension layout from useLayout().
 * @param {object} context - Additional context.
 * @param {string} context.appId - App ID.
 * @param {string} context.sheetId - Sheet ID.
 * @param {string} context.platformType - 'client-managed' or 'cloud'.
 * @param {string} [context.senseVersion] - Sense version.
 */
export function renderWidget(element, layout, context) {
    const tours = layout.tours || [];
    const widgetConfig = layout.widget || {};

    if (tours.length === 0) {
        element.innerHTML = `
            <div class="onboard-qs-widget onboard-qs-widget--empty">
                <span class="onboard-qs-widget__hint">No tours configured. Switch to edit mode to add tours.</span>
            </div>
        `;
        return;
    }

    const showButton = widgetConfig.showButton !== false;

    if (!showButton) {
        // Invisible mode — only auto-start tours will run
        element.innerHTML = '<div class="onboard-qs-widget onboard-qs-widget--hidden"></div>';
        handleAutoStart(tours, layout, context);
        return;
    }

    // Build button UI
    const buttonText = widgetConfig.buttonText || 'Start Tour';
    const buttonStyle = widgetConfig.buttonStyle || 'primary';

    if (tours.length === 1) {
        // Single tour — simple button
        element.innerHTML = `
            <div class="onboard-qs-widget">
                <button class="onboard-qs-btn onboard-qs-btn--${buttonStyle} onboard-qs-start-btn">
                    ${escapeHtml(buttonText)}
                </button>
            </div>
        `;
    } else {
        // Multiple tours — button that opens a floating menu
        element.innerHTML = `
            <div class="onboard-qs-widget">
                <button class="onboard-qs-btn onboard-qs-btn--${buttonStyle} onboard-qs-dropdown-trigger">
                    ${escapeHtml(buttonText)} &#9662;
                </button>
            </div>
        `;
    }

    // Remove any stale floating dropdown from previous renders
    const staleMenu = document.getElementById('onboard-qs-floating-menu');
    if (staleMenu) staleMenu.remove();

    // Click handler
    /**
     * Handle click events on tour trigger buttons.
     *
     * @param {Event} e - The click event.
     */
    const clickHandler = (e) => {
        // Single-tour button
        const startBtn = e.target.closest('.onboard-qs-start-btn');
        if (startBtn) {
            startTour(tours[0], context);
            return;
        }

        // Multi-tour trigger — open floating menu
        const trigger = e.target.closest('.onboard-qs-dropdown-trigger');
        if (trigger) {
            showFloatingMenu(trigger, tours, context);
            return;
        }
    };

    element.addEventListener('click', clickHandler);

    // Store cleanup reference so index.js can remove it on re-render
    /**
     * Remove event listeners and floating menu from previous render.
     */
    element._onboardCleanup = () => {
        element.removeEventListener('click', clickHandler);
        const menu = document.getElementById('onboard-qs-floating-menu');
        if (menu) menu.remove();
    };

    // Handle auto-start tours
    handleAutoStart(tours, layout, context);
}

/**
 * Handle auto-starting tours that should trigger on sheet load.
 *
 * @param {Array} tours - Tour configurations.
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

        // Delay slightly to let Qlik objects finish rendering
        setTimeout(() => {
            logger.info(`Auto-starting tour "${tour.tourName}"`);
            startTour(tour, context);
        }, 500);
    });
}

/**
 * Start a specific tour.
 *
 * @param {object} tourConfig - Tour configuration.
 * @param {object} context - Context with platformType, senseVersion, appId, sheetId.
 */
function startTour(tourConfig, context) {
    runTour(tourConfig, {
        platformType: context.platformType,
        senseVersion: context.senseVersion,
        appId: context.appId,
        sheetId: context.sheetId,
    });
}

/**
 * Show a floating dropdown menu positioned near the trigger button.
 * Appended to document.body to escape overflow:hidden on Qlik containers.
 *
 * @param {HTMLElement} trigger - The trigger button element.
 * @param {Array} tours - Tour configurations.
 * @param {object} context - Context for starting tours.
 */
function showFloatingMenu(trigger, tours, context) {
    // If already open, close it
    const existing = document.getElementById('onboard-qs-floating-menu');
    if (existing) {
        existing.remove();
        return;
    }

    const rect = trigger.getBoundingClientRect();

    const menu = document.createElement('div');
    menu.id = 'onboard-qs-floating-menu';
    menu.className = 'onboard-qs-floating-menu';
    menu.style.top = `${rect.bottom + 4}px`;
    menu.style.left = `${rect.left}px`;

    /**
     * Create a menu item button for a tour.
     *
     * @param {object} tour - Tour configuration object.
     * @param {number} i - Tour index.
     */
    tours.forEach((tour, i) => {
        const btn = document.createElement('button');
        btn.className = 'onboard-qs-floating-menu__item';
        btn.textContent = tour.tourName || `Tour ${i + 1}`;
        btn.addEventListener('click', () => {
            menu.remove();
            startTour(tour, context);
        });
        menu.appendChild(btn);
    });

    document.body.appendChild(menu);

    // Close on click outside
    /**
     * Handle clicks outside the floating menu to close it.
     *
     * @param {Event} e - The click event.
     */
    const closeHandler = (e) => {
        if (!menu.contains(e.target) && e.target !== trigger) {
            menu.remove();
            document.removeEventListener('click', closeHandler, true);
        }
    };
    // Use capture so we get the event before it's swallowed
    setTimeout(() => {
        document.addEventListener('click', closeHandler, true);
    }, 0);
}

/**
 * Render a minimal edit-mode placeholder.
 *
 * @param {HTMLElement} element - Container element.
 * @param {object} layout - Extension layout.
 */
export function renderEditPlaceholder(element, layout) {
    const tours = layout.tours || [];
    const tourCount = tours.length;
    const stepCount = tours.reduce((sum, t) => sum + (t.steps?.length || 0), 0);

    element.innerHTML = `
        <div class="onboard-qs-widget onboard-qs-widget--edit">
            <div class="onboard-qs-widget__edit-info">
                <div class="onboard-qs-widget__icon">&#127891;</div>
                <div class="onboard-qs-widget__title">Onboard QS</div>
                <div class="onboard-qs-widget__stats">
                    ${tourCount} tour${tourCount !== 1 ? 's' : ''} &middot; ${stepCount} step${stepCount !== 1 ? 's' : ''}
                </div>
                <button class="onboard-qs-btn onboard-qs-btn--secondary onboard-qs-edit-tours-btn">
                    Edit Tours
                </button>
            </div>
        </div>
    `;
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
