/**
 * Stand-in for driver.js 1.4.0, for testing tour-runner.js without a DOM.
 *
 * It follows dist/driver.js.mjs where tour-runner.js depends on it:
 * - Configuration and state are kept at module level and shared by every
 *   instance, so a second driver() replaces the tour the first one runs.
 * - setConfig() replaces the configuration without touching the state, and
 *   moveTo() reads the steps array when it is called. Past either end of
 *   the array it ends the tour.
 * - The progress text fills in the first {{current}} and {{total}}, the next
 *   button reads doneBtnText on the last step, and Previous is disabled on
 *   the first.
 *
 * Instead of drawing a popover, each step shown is pushed onto `shown`.
 */

/** @type {Array<object|string>} What the tour showed, oldest first: popovers, and 'destroyed'. */
export const shown = [];

let config = {};
let state = {};
let current = null;
/** @type {Error|null} Thrown by the next drive(), set by failNextDrive(). */
let driveFailure = null;

/**
 * End the running tour, as driver.js's destroy() does.
 */
function destroy() {
    const wasActive = state.active === true;
    state = {};
    shown.push('destroyed');
    if (wasActive && config.onDestroyed) config.onDestroyed();
}

/**
 * Show a step, as driver.js's drive(index) does.
 *
 * @param {number} index - Index of the step in config.steps.
 */
function show(index) {
    const steps = config.steps || [];
    if (!steps[index]) {
        destroy();
        return;
    }
    state.activeIndex = index;
    const { popover } = steps[index];
    shown.push({
        title: popover.title,
        description: popover.description,
        progress: (config.progressText || '{{current}} of {{total}}')
            .replace('{{current}}', `${index + 1}`)
            .replace('{{total}}', `${steps.length}`),
        nextButton: steps[index + 1] ? config.nextBtnText : config.doneBtnText,
        previousDisabled: !steps[index - 1],
    });
}

/**
 * Create a driver instance, as driver.js's driver() does.
 *
 * @param {object} initialConfig - driver.js configuration.
 * @returns {object} The instance.
 */
export function driver(initialConfig) {
    config = { ...initialConfig };
    const instance = {
        isActive: () => state.active === true,
        getActiveIndex: () => state.activeIndex,
        getConfig: () => config,
        setConfig: (next) => {
            config = { ...next };
        },
        moveTo: show,
        drive: (index = 0) => {
            state.active = true;
            if (driveFailure) {
                const error = driveFailure;
                driveFailure = null;
                throw error;
            }
            show(index);
        },
        destroy,
    };
    current = instance;
    return instance;
}

/**
 * Make the next drive() throw, after it has marked the tour active, as
 * driver.js does when showing the first step fails after it has set up the
 * page for the tour.
 *
 * @param {Error} error - What drive() throws.
 */
export function failNextDrive(error) {
    driveFailure = error;
}

/**
 * Click Next in the running tour, as driver.js routes a click or the right
 * arrow key to onNextClick.
 *
 * @returns {Promise<void>|undefined} What the handler returns.
 */
export function clickNext() {
    return config.onNextClick(undefined, undefined, { config, state, driver: current });
}

/**
 * Click Previous in the running tour, or press the left arrow key.
 *
 * @returns {Promise<void>|undefined} What the handler returns.
 */
export function clickPrevious() {
    return config.onPrevClick(undefined, undefined, { config, state, driver: current });
}

/**
 * The configuration driver.js holds now.
 *
 * @returns {object} driver.js configuration.
 */
export function currentConfig() {
    return config;
}

/**
 * Close any tour still running, and forget what was shown.
 */
export function reset() {
    if (state.active) destroy();
    shown.length = 0;
}
