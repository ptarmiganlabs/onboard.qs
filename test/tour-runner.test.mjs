/**
 * Tests for how src/tour/tour-runner.js moves between steps, with and
 * without a tour's "Update expressions at each step" setting.
 *
 * The real tour-runner.js is bundled with esbuild. driver.js is replaced by
 * test/support/fake-driver.js, which follows driver.js 1.4.0 where the runner
 * depends on it, and the modules that need a browser or Qlik Sense by
 * test/support/stubs.js.
 *
 * Run with `npm test`.
 */
import { test, before, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';
import { installFakeDocument } from './support/fake-document.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const runnerPath = path.join(root, 'src', 'tour', 'tour-runner.js');
const helpersPath = path.join(root, 'src', 'tour', 'tour-helpers.js');
const statePath = path.join(root, 'src', 'util', 'extension-state.js');
const stubsPath = path.join(here, 'support', 'stubs.js');
const fakeDriverPath = path.join(here, 'support', 'fake-driver.js');
const stubbedImports = [
    '../util/logger',
    '../util/markdown',
    '../platform/index',
    './tour-storage',
    '../util/tab-switcher',
];

let runner;

before(async () => {
    const outfile = path.join(
        await mkdtemp(path.join(os.tmpdir(), 'onboard-qs-test-')),
        'tour-runner.mjs'
    );
    await esbuild.build({
        stdin: {
            contents: [
                `export { runTour, refreshRunningTour, highlightStep } from ${JSON.stringify(runnerPath)};`,
                `export { startTour } from ${JSON.stringify(helpersPath)};`,
                `export { extensionState } from ${JSON.stringify(statePath)};`,
                `export * from ${JSON.stringify(fakeDriverPath)};`,
                `export { default as logger, seen } from ${JSON.stringify(stubsPath)};`,
            ].join('\n'),
            resolveDir: root,
        },
        bundle: true,
        format: 'esm',
        platform: 'node',
        outfile,
        logLevel: 'silent',
        plugins: [
            {
                name: 'stubs',
                setup(build) {
                    build.onResolve({ filter: /^driver\.js$/ }, () => ({ path: fakeDriverPath }));
                    build.onResolve({ filter: /^\.\.?\// }, (args) =>
                        [runnerPath, helpersPath].includes(args.importer) &&
                        stubbedImports.includes(args.path)
                            ? { path: stubsPath }
                            : undefined
                    );
                },
            },
        ],
    });
    runner = await import(pathToFileURL(outfile).href);
});

beforeEach(() => {
    runner.reset();
    runner.logger.warnings.length = 0;
    runner.logger.errors.length = 0;
    runner.seen.length = 0;
});

/**
 * The demo tour as the engine evaluates it for a selection. With nothing
 * selected it shows steps 1, 2 and 4: step 3 needs a selection of months,
 * and step 5 the `extra` flag.
 *
 * @param {object} sel - What is selected, and flags that hide or show steps.
 * @param {boolean} reevaluateEachStep - The tour's setting.
 * @returns {object} The tour, as it is in the object's layout.
 */
function tourFor(sel, reevaluateEachStep) {
    const swedish = sel.lang === 'sv';
    return {
        tourId: 't1',
        tourName: 'Demo',
        reevaluateEachStep,
        progressText: swedish ? '{{current}} av {{total}}' : '{{current}} of {{total}}',
        nextBtnText: swedish ? 'Nästa' : 'Next',
        prevBtnText: swedish ? 'Föregående' : 'Previous',
        doneBtnText: 'Done',
        stagePadding: 0,
        stageRadius: 0,
        steps: [
            {
                selectorType: 'none',
                popoverTitle: 'Welcome',
                popoverDescription: `Selected: ${sel.months ? 13 : 0} months`,
                showCondition: sel.hideEarly ? '0' : '',
            },
            {
                selectorType: 'none',
                popoverTitle: 'Select months',
                showCondition: sel.hideEarly ? '0' : '',
            },
            {
                selectorType: 'none',
                popoverTitle: 'You selected months',
                showCondition: sel.months ? '1' : '0',
            },
            {
                selectorType: 'none',
                popoverTitle: 'Sales',
                popoverDescription: `Sales: ${sel.months ? '43.7' : '111.9'} MSEK`,
                showCondition: sel.hideSales ? '0' : '1',
            },
            { selectorType: 'none', popoverTitle: 'Extra', showCondition: sel.extra ? '1' : '0' },
        ],
    };
}

/**
 * The layout of the Onboard.qs object holding the demo tour.
 *
 * @param {object} sel - What is selected.
 * @param {boolean} [reevaluateEachStep] - The tour's setting.
 * @returns {object} The object's layout.
 */
function layoutFor(sel, reevaluateEachStep = true) {
    return { qInfo: { qId: 'obj1' }, tours: [tourFor(sel, reevaluateEachStep)] };
}

/**
 * Start the demo tour.
 *
 * @param {object} sel - What is selected. Changing it later is a selection made during the tour.
 * @param {object} [options] - Options.
 * @param {boolean} [options.reevaluate] - The tour's setting.
 * @param {(() => Promise<object>)|null} [options.getLayout] - Gets the object's layout; null for none.
 * @param {string} [options.objectId] - ID of the object the tour belongs to.
 * @returns {Promise<object|null>} The driver instance.
 */
function start(sel, { reevaluate = true, getLayout, objectId = 'obj1' } = {}) {
    return runner.runTour(tourFor(sel, reevaluate), {
        sheetId: 'sheet1',
        objectId,
        getLayout:
            getLayout === null
                ? undefined
                : (getLayout ?? (async () => layoutFor(sel, reevaluate))),
    });
}

/**
 * A getLayout() that waits until release() is called.
 *
 * @param {object} sel - What is selected.
 * @returns {{getLayout: () => Promise<object>, release: () => void}} The function and its release.
 */
function slowLayout(sel) {
    const waiting = [];
    return {
        getLayout: () => new Promise((resolve) => waiting.push(() => resolve(layoutFor(sel)))),
        release: () => waiting.splice(0).forEach((resolve) => resolve()),
    };
}

/**
 * The last thing the tour showed.
 *
 * @returns {object|string} A popover, or 'destroyed'.
 */
function last() {
    return runner.shown.at(-1);
}

test('with the setting off, steps keep the values from when the tour started', async () => {
    const sel = { months: false };
    await start(sel, { reevaluate: false });
    assert.equal(last().progress, '1 of 3');
    await runner.clickNext();
    sel.months = true;
    await runner.clickNext();
    assert.equal(last().title, 'Sales');
    assert.equal(last().description, 'Sales: 111.9 MSEK');
    assert.equal(last().progress, '3 of 3');
    assert.equal(last().nextButton, 'Done');
    await runner.clickNext();
    assert.equal(last(), 'destroyed');
});

test('with the setting off, the layout of the object is never read', async () => {
    let reads = 0;
    await start({ months: false }, { reevaluate: false, getLayout: async () => reads++ });
    await runner.clickNext();
    runner.refreshRunningTour(layoutFor({ months: true }));
    await runner.clickPrevious();
    assert.equal(reads, 0);
});

test('with the setting on, later steps follow a selection, in both directions', async () => {
    const sel = { months: false };
    await start(sel);
    await runner.clickNext();
    assert.equal(last().title, 'Select months');
    sel.months = true;
    await runner.clickNext();
    assert.equal(last().title, 'You selected months');
    assert.equal(last().progress, '3 of 4');
    await runner.clickNext();
    assert.equal(last().description, 'Sales: 43.7 MSEK');
    assert.equal(last().nextButton, 'Done');

    await runner.clickPrevious();
    assert.equal(last().title, 'You selected months');
    sel.months = false;
    await runner.clickPrevious();
    assert.equal(last().title, 'Select months');
    assert.equal(last().progress, '2 of 3');
    await runner.clickNext();
    assert.equal(last().description, 'Sales: 111.9 MSEK');
    assert.equal(last().progress, '3 of 3');
});

test('button and progress texts follow too', async () => {
    const sel = { months: false, lang: 'en' };
    await start(sel);
    sel.lang = 'sv';
    await runner.clickNext();
    assert.equal(last().progress, '2 av 3');
    assert.equal(last().nextButton, 'Nästa');
});

test('Done ends the tour, even if a later step has become visible since', async () => {
    const sel = { months: true };
    await start(sel);
    await runner.clickNext();
    await runner.clickNext();
    await runner.clickNext();
    assert.equal(last().nextButton, 'Done');
    sel.extra = true;
    await runner.clickNext();
    assert.equal(last(), 'destroyed');
});

test('Next ends the tour when every later step has been hidden', async () => {
    const sel = { months: true };
    await start(sel);
    await runner.clickNext();
    await runner.clickNext();
    assert.equal(last().title, 'You selected months');
    sel.hideSales = true;
    await runner.clickNext();
    assert.equal(last(), 'destroyed');
});

test('Previous with every earlier step hidden shows the step again, with Previous disabled', async () => {
    const sel = { months: false };
    await start(sel);
    await runner.clickNext();
    await runner.clickNext();
    assert.equal(last().title, 'Sales');
    assert.equal(last().previousDisabled, false);
    sel.hideEarly = true;
    await runner.clickPrevious();
    assert.equal(last().title, 'Sales');
    assert.equal(last().progress, '1 of 1');
    assert.equal(last().previousDisabled, true);
});

test('Previous stays put when the step shown has been hidden too', async () => {
    const sel = { months: false };
    await start(sel);
    await runner.clickNext();
    await runner.clickNext();
    const count = runner.shown.length;
    sel.hideEarly = true;
    sel.hideSales = true;
    await runner.clickPrevious();
    assert.equal(runner.shown.length, count);
    assert.equal(last().title, 'Sales');
});

test('Previous on the first step closes the tour, with the setting on or off', async () => {
    for (const reevaluate of [false, true]) {
        runner.reset();
        await start({ months: false }, { reevaluate });
        await runner.clickPrevious();
        assert.equal(last(), 'destroyed');
    }
});

test('a second Next while the first waits for the engine moves only once', async () => {
    const sel = { months: false };
    const slow = slowLayout(sel);
    await start(sel, { getLayout: slow.getLayout });
    const first = runner.clickNext();
    const second = runner.clickNext();
    slow.release();
    await Promise.all([first, second]);
    assert.equal(last().title, 'Select months');
    assert.equal(last().progress, '2 of 3');
});

test('a tour closed while Next waits stays closed', async () => {
    const sel = { months: false };
    const slow = slowLayout(sel);
    const tour = await start(sel, { getLayout: slow.getLayout });
    const pending = runner.clickNext();
    tour.destroy();
    slow.release();
    await pending;
    assert.equal(last(), 'destroyed');
    assert.equal(tour.isActive(), false);
});

test('a click on a closed tour does not move the tour started after it', async () => {
    const sel = { months: false };
    const slow = slowLayout(sel);
    const first = await start(sel, { getLayout: slow.getLayout });
    const pending = runner.clickNext();
    first.destroy();
    await runner.runTour(
        {
            tourId: 't2',
            tourName: 'Second',
            steps: [
                { selectorType: 'none', popoverTitle: 'Second 1' },
                { selectorType: 'none', popoverTitle: 'Second 2' },
            ],
        },
        { sheetId: 'sheet1' }
    );
    slow.release();
    await pending;
    assert.equal(last().title, 'Second 1');
    assert.deepEqual(
        runner.currentConfig().steps.map((step) => step.popover.title),
        ['Second 1', 'Second 2']
    );
});

test('a failing getLayout keeps the steps the tour has', async () => {
    const sel = { months: false };
    await start(sel, {
        getLayout: async () => {
            throw new Error('engine gone');
        },
    });
    sel.months = true;
    await runner.clickNext();
    await runner.clickNext();
    assert.equal(last().description, 'Sales: 111.9 MSEK');
    assert.equal(last().progress, '3 of 3');
    assert.match(runner.logger.warnings.join('\n'), /engine gone/);
});

test('a getLayout with no answer gives up after the timeout and moves anyway', async () => {
    const sel = { months: false };
    await start(sel, { getLayout: () => new Promise(() => {}) });
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
        const pending = runner.clickNext();
        mock.timers.tick(5000);
        await pending;
    } finally {
        mock.timers.reset();
    }
    assert.equal(last().title, 'Select months');
    assert.match(runner.logger.warnings.join('\n'), /no answer within 5000 ms/);
});

test('an error while preparing a move still moves, with the steps the tour has', async () => {
    await start(
        { months: false },
        { getLayout: async () => ({ tours: [{ tourId: 't1', steps: [null] }] }) }
    );
    await runner.clickNext();
    assert.equal(last().title, 'Select months');
    assert.equal(last().progress, '2 of 3');
    assert.match(runner.logger.warnings.join('\n'), /could not prepare the step/);
});

test('without getLayout, the setting changes nothing', async () => {
    const sel = { months: false };
    await start(sel, { getLayout: null });
    await runner.clickNext();
    sel.months = true;
    await runner.clickNext();
    assert.equal(last().description, 'Sales: 111.9 MSEK');
});

test('a stage padding and radius of 0 are kept', async () => {
    await start({ months: false });
    assert.equal(runner.currentConfig().stagePadding, 0);
    assert.equal(runner.currentConfig().stageRadius, 0);
});

test('the step shown follows a new layout of its object', async () => {
    const sel = { months: false };
    await start(sel);
    assert.equal(last().description, 'Selected: 0 months');
    sel.months = true;
    runner.refreshRunningTour(layoutFor(sel));
    assert.equal(last().title, 'Welcome');
    assert.equal(last().description, 'Selected: 13 months');
    assert.equal(last().progress, '1 of 4');
});

test('a new layout that changes nothing on screen does not show the step again', async () => {
    const sel = { months: false };
    await start(sel);
    await runner.clickNext();
    const count = runner.shown.length;
    runner.refreshRunningTour(layoutFor(sel));
    assert.equal(runner.shown.length, count);
});

test('Done turns into Next when a selection shows a later step', async () => {
    const sel = { months: false };
    await start(sel);
    await runner.clickNext();
    await runner.clickNext();
    assert.equal(last().nextButton, 'Done');
    sel.extra = true;
    runner.refreshRunningTour(layoutFor(sel));
    assert.equal(last().title, 'Sales');
    assert.equal(last().nextButton, 'Next');
    await runner.clickNext();
    assert.equal(last().title, 'Extra');
});

test('a step hidden while it is shown stays until the user moves on', async () => {
    const sel = { months: false };
    await start(sel);
    await runner.clickNext();
    await runner.clickNext();
    const count = runner.shown.length;
    sel.hideSales = true;
    runner.refreshRunningTour(layoutFor(sel));
    assert.equal(runner.shown.length, count);
    assert.equal(last().title, 'Sales');
});

test('layouts of other objects, or with the setting off, are ignored', async () => {
    const sel = { months: false };
    await start(sel);
    const count = runner.shown.length;
    runner.refreshRunningTour({ ...layoutFor({ months: true }), qInfo: { qId: 'other' } });
    assert.equal(runner.shown.length, count);

    runner.reset();
    await start(sel, { reevaluate: false });
    runner.refreshRunningTour(layoutFor({ months: true }));
    assert.equal(last().description, 'Selected: 0 months');
});

test('a new layout that arrives during a move is left to the move', async () => {
    const sel = { months: false };
    const slow = slowLayout(sel);
    await start(sel, { getLayout: slow.getLayout });
    const pending = runner.clickNext();
    const count = runner.shown.length;
    sel.months = true;
    runner.refreshRunningTour(layoutFor(sel));
    assert.equal(runner.shown.length, count);
    slow.release();
    await pending;
    assert.equal(last().title, 'Select months');
    assert.equal(last().progress, '2 of 4');
});

/**
 * Run a step's onPopoverRender on a stand-in for its popover element.
 *
 * @param {object} step - A driver.js step of the running tour.
 * @returns {object} The inline style the hook set.
 */
function renderedStyle(step) {
    const wrapper = { style: {} };
    step.popover.onPopoverRender({ wrapper });
    return wrapper.style;
}

test('every step popover is laid out as a column, whatever its target', async () => {
    await runner.runTour(
        {
            tourId: 't2',
            tourName: 'Targets',
            steps: [
                { selectorType: 'none', popoverTitle: 'Standalone', dialogSize: 'x-large' },
                { selectorType: 'css', customCssSelector: '#x', popoverTitle: 'Selector' },
                { selectorType: 'object', targetObjectId: 'obj9', popoverTitle: 'Object' },
            ],
        },
        { sheetId: 'sheet1' }
    );
    const { steps } = runner.currentConfig();
    assert.equal(steps.length, 3);
    for (const step of steps) assert.deepEqual(renderedStyle(step), { display: 'flex' });
});

test('a custom dialog size is capped at the window', async () => {
    await runner.runTour(
        {
            tourId: 't3',
            tourName: 'Custom',
            steps: [
                {
                    selectorType: 'none',
                    popoverTitle: 'Big',
                    dialogSize: 'custom',
                    customDialogWidth: 1000,
                    customDialogHeight: 900,
                },
                {
                    selectorType: 'none',
                    popoverTitle: 'Too big',
                    dialogSize: 'custom',
                    customDialogWidth: 5000,
                    customDialogHeight: 5000,
                },
            ],
        },
        { sheetId: 'sheet1' }
    );
    const [big, tooBig] = runner.currentConfig().steps.map(renderedStyle);
    assert.deepEqual(big, {
        display: 'flex',
        width: '1000px',
        maxWidth: 'min(1000px, var(--oqs-popover-max-width))',
        minHeight: 'min(900px, var(--oqs-popover-max-height))',
    });
    assert.equal(tooBig.width, '1200px');
    assert.equal(tooBig.minHeight, 'min(900px, var(--oqs-popover-max-height))');
});

test('a step whose CSS selector is invalid has no target, and the tour goes on to it', async () => {
    const fake = installFakeDocument();
    try {
        await runner.runTour(
            {
                tourId: 't4',
                tourName: 'Selectors',
                steps: [
                    { selectorType: 'none', popoverTitle: 'First' },
                    { selectorType: 'css', customCssSelector: '#t4 >', popoverTitle: 'Invalid' },
                    { selectorType: 'css', customCssSelector: '#target', popoverTitle: 'Valid' },
                ],
            },
            { sheetId: 'sheet1' }
        );
        const [, invalid, valid] = runner.currentConfig().steps;
        // driver.js shows a step whose element() is null as a dialog without a target
        assert.equal(invalid.element(), null);
        assert.equal(invalid.element(), null);
        assert.equal(valid.element(), fake.target);
        await runner.clickNext();
        assert.equal(last().title, 'Invalid');
        await runner.clickNext();
        assert.equal(last().title, 'Valid');
        const reports = runner.logger.warnings.filter((w) => w.includes('"#t4 >"'));
        assert.equal(reports.length, 1);
    } finally {
        fake.uninstall();
    }
});

test('a formula that builds an invalid selector does not stop the tour from starting', async () => {
    const fake = installFakeDocument();
    try {
        // `='#' & Only(Year)` gives #2024 with 2024 selected: an ID can't start with a digit
        const tour = {
            tourId: 't5',
            tourName: 'Formula selector',
            steps: [{ selectorType: 'css', customCssSelector: '#2024', popoverTitle: 'Year' }],
        };
        const started = await runner.runTour(tour, { sheetId: 'sheet1' });
        assert.ok(started, 'the tour starts');
        assert.equal(runner.currentConfig().steps[0].element(), null);
        assert.equal(last().title, 'Year');
    } finally {
        fake.uninstall();
    }
});

test('a tour that driver.js fails to show leaves the page usable and is not marked as seen', async () => {
    const fake = installFakeDocument();
    try {
        runner.failNextDrive(new Error('could not render the first step'));
        const result = await runner.runTour(
            {
                tourId: 't6',
                tourName: 'Broken',
                steps: [{ selectorType: 'none', popoverTitle: 'Never' }],
            },
            { appId: 'app1', sheetId: 'sheet1' }
        );
        assert.equal(result, null);
        // Without this, driver.js's `.driver-active *` rule keeps every click from the sheet
        assert.ok(fake.removedClasses.includes('driver-active'));
        assert.deepEqual(runner.seen, []);

        // The failed tour doesn't count as running, so another one can start
        await runner.runTour(
            {
                tourId: 't7',
                tourName: 'Next one',
                steps: [{ selectorType: 'none', popoverTitle: 'Shown' }],
            },
            { appId: 'app1', sheetId: 'sheet1' }
        );
        assert.equal(last().title, 'Shown');
    } finally {
        fake.uninstall();
    }
});

test('an invalid selector is reported once per tour run, and again when the tour runs again', async () => {
    const fake = installFakeDocument();
    try {
        const tour = (sel) => ({
            tourId: 't8',
            tourName: 'Twice',
            reevaluateEachStep: true,
            steps: [
                { selectorType: 'none', popoverTitle: 'First' },
                { selectorType: 'css', customCssSelector: '#t8 >', popoverTitle: 'Invalid' },
                { selectorType: 'none', popoverTitle: `Last ${sel}` },
            ],
        });
        const options = {
            sheetId: 'sheet1',
            objectId: 'obj8',
            getLayout: async () => ({ qInfo: { qId: 'obj8' }, tours: [tour(2)] }),
        };
        const reports = () => runner.logger.warnings.filter((w) => w.includes('"#t8 >"')).length;

        await runner.runTour(tour(1), options);
        // Each move builds the steps again from a new layout
        await runner.clickNext();
        await runner.clickNext();
        assert.equal(reports(), 1);
        runner.reset();

        await runner.runTour(tour(1), options);
        assert.equal(reports(), 2);
    } finally {
        fake.uninstall();
    }
});

test('a formula that gives no number, or one out of range, falls back or is capped', async () => {
    const start = (values) =>
        runner.runTour(
            {
                tourId: 't9',
                tourName: 'Overlay',
                ...values,
                steps: [{ selectorType: 'none', popoverTitle: 'x' }],
            },
            { sheetId: 'sheet1' }
        );
    const overlay = () => {
        const { overlayOpacity, stagePadding, stageRadius } = runner.currentConfig();
        return { overlayOpacity, stagePadding, stageRadius };
    };

    // A formula that evaluates to text puts that text in the layout
    await start({ overlayOpacity: 'Nordics', stagePadding: '', stageRadius: null });
    assert.deepEqual(overlay(), { overlayOpacity: 0.6, stagePadding: 8, stageRadius: 5 });
    runner.reset();

    await start({ overlayOpacity: 500, stagePadding: -20, stageRadius: -1 });
    assert.deepEqual(overlay(), { overlayOpacity: 1, stagePadding: 0, stageRadius: 0 });
    runner.reset();

    await start({ overlayOpacity: 0 });
    assert.equal(overlay().overlayOpacity, 0);
});

test('a step that driver.js fails to show closes the tour instead of leaving it stuck', async () => {
    const fake = installFakeDocument();
    try {
        await runner.runTour(
            {
                tourId: 't10',
                tourName: 'Breaks on step 2',
                steps: [
                    { selectorType: 'none', popoverTitle: 'First' },
                    { selectorType: 'none', popoverTitle: 'Second' },
                ],
            },
            { appId: 'app1', sheetId: 'sheet1' }
        );
        runner.failNextMove(new Error('could not render step 2'));
        // Resolves rather than rejecting, so the click handler leaves no unhandled rejection
        await runner.clickNext();

        assert.equal(last(), 'destroyed');
        assert.ok(fake.removedClasses.includes('driver-active'));
        assert.ok(runner.logger.errors.some((e) => e.includes('could not show step 2')));

        // The closed tour no longer blocks another one
        await runner.runTour(
            {
                tourId: 't11',
                tourName: 'After',
                steps: [{ selectorType: 'none', popoverTitle: 'Shown' }],
            },
            { sheetId: 'sheet1' }
        );
        assert.equal(last().title, 'Shown');
    } finally {
        fake.uninstall();
    }
});

test("the editor's step preview returns nothing for an invalid selector, and warns each time", () => {
    const fake = installFakeDocument();
    try {
        const step = {
            selectorType: 'css',
            customCssSelector: '#preview >',
            popoverTitle: 'Preview',
        };
        // Before the fix this threw, after the editor had hidden itself for the preview
        assert.equal(runner.highlightStep(step, 'client-managed'), null);
        assert.equal(runner.highlightStep(step, 'client-managed'), null);
        const reports = runner.logger.warnings.filter((w) => w.includes('"#preview >"'));
        assert.equal(reports.length, 2);
    } finally {
        fake.uninstall();
    }
});

test('startTour logs a tour that fails to start, instead of leaving an unhandled rejection', async () => {
    const failure = Promise.reject(new Error('the tab containers could not be read'));
    // runTour() awaits this promise; only its own rejection is under test
    failure.catch(() => {});
    runner.extensionState.tabContainerMapReady = failure;
    try {
        runner.startTour(
            {
                tourId: 't12',
                tourName: 'Cannot start',
                steps: [{ selectorType: 'none', popoverTitle: 'x' }],
            },
            { sheetId: 'sheet1' }
        );
        await new Promise((resolve) => setTimeout(resolve, 10));
        assert.ok(
            runner.logger.errors.some((e) => e.includes('"Cannot start" could not be started'))
        );
    } finally {
        runner.extensionState.tabContainerMapReady = null;
    }
});
