import logger from '../util/logger';
import { runTour } from '../tour/tour-runner';
import { hasSeenTour } from '../tour/tour-storage';
import { resolveTheme, applyThemeToElement } from '../theme/resolve';

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
 * @param {string} [context.codePath] - Code-path name for selector lookup.
 */
export function renderWidget(element, layout, context) {
    const tours = layout.tours || [];
    const widgetConfig = layout.widget || {};

    // Resolve and apply theme CSS variables to the widget container
    const cssVars = resolveTheme(layout);

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
    const hAlign = widgetConfig.horizontalAlign || 'center';
    const vAlign = widgetConfig.verticalAlign || 'center';
    const alignClasses = `onboard-qs-widget--h-${hAlign} onboard-qs-widget--v-${vAlign}`;

    if (tours.length === 1) {
        // Single tour — simple button
        element.innerHTML = `
            <div class="onboard-qs-widget ${alignClasses}">
                <button class="onboard-qs-btn onboard-qs-btn--${buttonStyle} onboard-qs-start-btn">
                    ${escapeHtml(buttonText)}
                </button>
            </div>
        `;
    } else {
        // Multiple tours — button that opens a floating menu
        element.innerHTML = `
            <div class="onboard-qs-widget ${alignClasses}">
                <button class="onboard-qs-btn onboard-qs-btn--${buttonStyle} onboard-qs-dropdown-trigger">
                    ${escapeHtml(buttonText)} &#9662;
                </button>
            </div>
        `;
    }

    // Apply theme CSS variables to the widget container
    const widgetEl = element.querySelector('.onboard-qs-widget');
    if (widgetEl) {
        applyThemeToElement(widgetEl, cssVars);
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

    const statsText = `${tourCount} tour${tourCount !== 1 ? 's' : ''} \u00b7 ${stepCount} step${stepCount !== 1 ? 's' : ''}`;

    element.innerHTML = `
        <div class="onboard-qs-widget onboard-qs-widget--edit"
             title="Onboard.qs \u2014 ${statsText}">
            <div class="onboard-qs-widget__edit-info">
                <div class="onboard-qs-widget__icon">&#127891;</div>
                <div class="onboard-qs-widget__title">Onboard.qs</div>
                <div class="onboard-qs-widget__stats">
                    ${tourCount} tour${tourCount !== 1 ? 's' : ''} &middot; ${stepCount} step${stepCount !== 1 ? 's' : ''}
                </div>
                <div class="onboard-qs-widget__edit-actions">
                    <button class="onboard-qs-btn onboard-qs-btn--secondary onboard-qs-edit-tours-btn">
                        Edit Tours
                    </button>
                    <button class="onboard-qs-btn onboard-qs-btn--ghost onboard-qs-about-btn"
                            title="About Onboard.qs">
                        &#9432; About
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Open a modal "About" dialog with extension info, version, and links.
 *
 * @param {string} version - Extension version string.
 */
export function openAboutModal(version) {
    // Remove any existing about modal
    const existing = document.querySelector('.onboard-qs-about-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'onboard-qs-about-overlay';
    overlay.innerHTML = `
        <div class="onboard-qs-about-modal">
            <div class="onboard-qs-about-modal__header">
                <span class="onboard-qs-about-modal__icon">&#127891;</span>
                <span class="onboard-qs-about-modal__title">Onboard.qs</span>
                <span class="onboard-qs-about-modal__version">v${escapeHtml(version)}</span>
            </div>
            <p class="onboard-qs-about-modal__tagline">
                Interactive onboarding tours for Qlik Sense apps.
            </p>
            <div class="onboard-qs-about-modal__links">
                <a href="https://github.com/ptarmiganlabs/onboard.qs" target="_blank" rel="noopener noreferrer">
                    <strong>Documentation &amp; Source Code</strong>
                    <span>README, architecture docs, and full source on GitHub.</span>
                </a>
                <a href="https://github.com/ptarmiganlabs/onboard.qs/issues/new/choose" target="_blank" rel="noopener noreferrer">
                    <strong>Report a Bug / Request a Feature</strong>
                    <span>Open an issue on GitHub to report problems or suggest improvements.</span>
                </a>
                <a href="https://ptarmiganlabs.com" target="_blank" rel="noopener noreferrer">
                    <strong>Ptarmigan Labs</strong>
                    <span>Qlik Sense tools, blog posts, extensions &amp; consulting.</span>
                </a>
            </div>
            <div class="onboard-qs-about-modal__footer">
                <button class="onboard-qs-btn onboard-qs-btn--secondary onboard-qs-about-close-btn">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    /** Close handler for the about modal. */
    const close = () => {
        document.removeEventListener('keydown', onKey);
        overlay.remove();
    };
    /** @param {KeyboardEvent} e */
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    overlay.querySelector('.onboard-qs-about-close-btn').addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });
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
