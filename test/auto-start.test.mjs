/**
 * Tests for which tours src/tour/tour-helpers.js starts by itself on sheet
 * load, and how "Show only once per user" and the seen flag decide it.
 *
 * The real tour-helpers.js is bundled with esbuild. tour-runner.js,
 * tour-storage.js and the logger are replaced by
 * test/support/auto-start-stubs.js, so a tour is recorded instead of run, and
 * each test says which tours count as seen.
 *
 * Run with `npm test`.
 */
import { test, before, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const helpersPath = path.join(root, 'src', 'tour', 'tour-helpers.js');
const stubsPath = path.join(here, 'support', 'auto-start-stubs.js');
const stubbedImports = ['./tour-runner', './tour-storage', '../util/logger'];

const context = { appId: 'app1', sheetId: 'sheet1' };

let helpers;

before(async () => {
    const outfile = path.join(
        await mkdtemp(path.join(os.tmpdir(), 'onboard-qs-test-')),
        'auto-start.mjs'
    );
    await esbuild.build({
        stdin: {
            contents: [
                `export { handleAutoStart, endAutoStartVisit } from ${JSON.stringify(helpersPath)};`,
                `export { started, seenTours } from ${JSON.stringify(stubsPath)};`,
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
                    build.onResolve({ filter: /^\.\.?\// }, (args) =>
                        args.importer === helpersPath && stubbedImports.includes(args.path)
                            ? { path: stubsPath }
                            : undefined
                    );
                },
            },
        ],
    });
    helpers = await import(pathToFileURL(outfile).href);
});

beforeEach(() => {
    mock.timers.enable({ apis: ['setTimeout'] });
    helpers.started.length = 0;
    helpers.seenTours.clear();
    helpers.endAutoStartVisit(context.appId, context.sheetId);
});

afterEach(() => {
    mock.timers.reset();
});

/**
 * A tour with Auto-start on and no steps.
 *
 * @param {string} tourId - Tour ID.
 * @param {object} [settings] - Settings to add, such as showOnce.
 * @returns {object} Tour configuration.
 */
const tour = (tourId, settings = {}) => ({
    tourId,
    tourName: tourId,
    autoStart: true,
    tourVersion: 1,
    steps: [],
    ...settings,
});

/**
 * Run auto-start for the tours on a sheet load, and let its delay pass.
 *
 * @param {object[]} tours - Tour configurations.
 * @returns {string[]} The IDs of the tours that started.
 */
function load(tours) {
    helpers.handleAutoStart(tours, {}, context);
    mock.timers.tick(500);
    return [...helpers.started];
}

test('a seen tour with Show only once on does not start by itself', () => {
    helpers.seenTours.add('on:v1');
    assert.deepEqual(load([tour('on', { showOnce: true })]), []);
});

test('a seen tour saved without Show only once does not start either: the editors show it on', () => {
    helpers.seenTours.add('missing:v1');
    assert.deepEqual(load([tour('missing')]), []);
});

test('an unseen tour saved without Show only once starts by itself', () => {
    assert.deepEqual(load([tour('missing')]), ['missing']);
});

test('a tour with Show only once off starts by itself, seen or not', () => {
    helpers.seenTours.add('off:v1');
    assert.deepEqual(load([tour('off', { showOnce: false })]), ['off']);
});

test('a new tour version starts by itself again', () => {
    helpers.seenTours.add('missing:v1');
    assert.deepEqual(load([tour('missing', { tourVersion: 2 })]), ['missing']);
});
