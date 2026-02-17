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
 * @param {Object} layout - The extension layout from useLayout().
 * @param {Object} context - Additional context.
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
                <button class="onboard-qs-btn onboard-qs-btn--${buttonStyle}" data-tour-index="0">
                    ${escapeHtml(buttonText)}
                </button>
            </div>
        `;
    } else {
        // Multiple tours — button with dropdown
        const tourOptions = tours.map((tour, i) => `
            <button class="onboard-qs-dropdown__item" data-tour-index="${i}">
                ${escapeHtml(tour.tourName || `Tour ${i + 1}`)}
            </button>
        `).join('');

        element.innerHTML = `
            <div class="onboard-qs-widget">
                <div class="onboard-qs-dropdown">
                    <button class="onboard-qs-btn onboard-qs-btn--${buttonStyle} onboard-qs-dropdown__trigger">
                        ${escapeHtml(buttonText)} &#9662;
                    </button>
                    <div class="onboard-qs-dropdown__menu onboard-qs-dropdown__menu--hidden">
                        ${tourOptions}
                    </div>
                </div>
            </div>
        `;
    }

    // Attach event listeners via delegation
    element.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-tour-index]');
        if (btn) {
            const index = parseInt(btn.getAttribute('data-tour-index'), 10);
            const tour = tours[index];
            if (tour) {
                startTour(tour, context);
            }
            // Close dropdown if open
            const menu = element.querySelector('.onboard-qs-dropdown__menu');
            if (menu) menu.classList.add('onboard-qs-dropdown__menu--hidden');
            return;
        }

        // Toggle dropdown
        const trigger = e.target.closest('.onboard-qs-dropdown__trigger');
        if (trigger) {
            const menu = element.querySelector('.onboard-qs-dropdown__menu');
            if (menu) menu.classList.toggle('onboard-qs-dropdown__menu--hidden');
        }
    });

    // Handle auto-start tours
    handleAutoStart(tours, layout, context);
}

/**
 * Handle auto-starting tours that should trigger on sheet load.
 *
 * @param {Array} tours - Tour configurations.
 * @param {Object} layout - Extension layout.
 * @param {Object} context - Context with appId, sheetId, etc.
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
 * @param {Object} tourConfig - Tour configuration.
 * @param {Object} context - Context with platformType, senseVersion, appId, sheetId.
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
 * Render a minimal edit-mode placeholder.
 *
 * @param {HTMLElement} element - Container element.
 * @param {Object} layout - Extension layout.
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
