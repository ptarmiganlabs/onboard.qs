/**
 * Tests for the property panel's buttons in src/ext/tours-section.js:
 * "Edit in Markdown editor" on a step and "Open tour editor" on the Tours
 * section.
 *
 * Sense calls a panel button's action with the item it belongs to and the
 * panel's handler, whose `properties` is the panel's own copy of the
 * object's properties and whose `app` is the Enigma app. In that copy,
 * array items have cIds the panel made up, which the stored properties
 * often lack. The tests build the same situation with fake models.
 */
import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sectionPath = path.join(root, 'src', 'ext', 'tours-section.js');
const statePath = path.join(root, 'src', 'util', 'extension-state.js');
const stubsPath = path.join(here, 'support', 'stubs.js');
const panelStubsPath = path.join(here, 'support', 'panel-stubs.js');
const panelStubbedImports = ['../ui/markdown-editor-dialog', '../ui/tour-editor'];

let section;
let editDescription;
let openEditor;
const alerts = [];

before(async () => {
    const outfile = path.join(
        await mkdtemp(path.join(os.tmpdir(), 'onboard-qs-test-')),
        'tours-section.mjs'
    );
    await esbuild.build({
        stdin: {
            contents: [
                `export { toursSection } from ${JSON.stringify(sectionPath)};`,
                `export { extensionState } from ${JSON.stringify(statePath)};`,
                `export * from ${JSON.stringify(panelStubsPath)};`,
                `export { default as logger } from ${JSON.stringify(stubsPath)};`,
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
                    build.onResolve({ filter: /^\.\.?\// }, (args) => {
                        if (args.importer !== sectionPath) return undefined;
                        if (panelStubbedImports.includes(args.path))
                            return { path: panelStubsPath };
                        if (args.path === '../util/logger') return { path: stubsPath };
                        return undefined;
                    });
                },
            },
        ],
    });
    section = await import(pathToFileURL(outfile).href);
    globalThis.alert = (message) => alerts.push(message);

    const definition = section.toursSection();
    editDescription = find(definition, 'editDescriptionBtn').action;
    openEditor = find(definition, 'openTourEditorBtn').action;
});

beforeEach(() => {
    section.markdownDialogs.length = 0;
    section.tourEditors.length = 0;
    section.logger.warnings.length = 0;
    section.extensionState.model = null;
    section.extensionState.app = null;
    alerts.length = 0;
});

/**
 * Find a property panel item by its key, anywhere in a definition.
 *
 * @param {object} node - Panel definition, or part of one.
 * @param {string} key - Item key.
 * @returns {object|null} The item, or null.
 */
function find(node, key) {
    if (!node || typeof node !== 'object') return null;
    if (node[key]) return node[key];
    for (const value of Object.values(node)) {
        const hit = find(value, key);
        if (hit) return hit;
    }
    return null;
}

/**
 * Copy a JSON value.
 *
 * @param {any} value - Value to copy.
 * @returns {any} The copy.
 */
const clone = (value) => JSON.parse(JSON.stringify(value));

/**
 * An Onboard.qs object with one tour, as the engine stores it, and a fake
 * model that records what is saved.
 *
 * @param {string} id - Object ID.
 * @param {Array<object>} [steps] - Stored steps; two plain ones by default.
 * @returns {{stored: object, model: object, saves: Array<object>}} The object.
 */
function makeObject(id, steps) {
    const stored = {
        qInfo: { qId: id },
        tours: [
            {
                tourId: `${id}-tour`,
                steps: steps ?? [
                    {
                        selectorType: 'none',
                        popoverTitle: `${id} first`,
                        popoverDescription: 'one',
                    },
                    {
                        selectorType: 'object',
                        targetObjectId: 'chart1',
                        popoverTitle: `${id} second`,
                        popoverDescription: 'two',
                    },
                ],
            },
        ],
    };
    const saves = [];
    const model = {
        id,
        getProperties: async () => clone(stored),
        getLayout: async () => clone(stored),
        setProperties: async (props) => {
            saves.push(props);
            stored.tours = clone(props.tours);
        },
    };
    return { stored, model, saves };
}

/**
 * The property panel's handler for an object: a copy of its properties in
 * which every step has a cId, made up where the stored step has none.
 *
 * @param {object} object - Object from makeObject().
 * @param {Array<object>} objects - Every object the app can return.
 * @returns {{properties: object, app: object}} Handler.
 */
function handlerFor(object, objects) {
    const properties = clone(object.stored);
    let n = 0;
    for (const tour of properties.tours) {
        for (const step of tour.steps) step.cId = step.cId || `panel${(n += 1)}`;
    }
    const app = {
        getObject: async (id) => objects.find((o) => o.model.id === id)?.model,
    };
    return { properties, app };
}

/**
 * Open the Markdown editor on a step and save new text, as the user would.
 *
 * @param {object} item - The step, from the handler's copy.
 * @param {object} [handler] - The panel's handler.
 * @param {string} text - Text to save.
 * @returns {Promise<{value: string, saved: boolean}>} Text the editor opened with, and the save result.
 */
async function editAndSave(item, handler, text) {
    editDescription(item, handler);
    const dialog = section.markdownDialogs.at(-1);
    return { value: dialog.value, saved: await dialog.onSave(text) };
}

test('a Markdown edit is saved to the step the panel shows, though no cId is stored', async () => {
    const a = makeObject('objA');
    const b = makeObject('objB');
    // The object rendered last is the other one
    section.extensionState.model = b.model;
    const handler = handlerFor(a, [a, b]);

    const result = await editAndSave(handler.properties.tours[0].steps[1], handler, 'new two');

    assert.deepEqual(result, { value: 'two', saved: true });
    assert.equal(a.stored.tours[0].steps[1].popoverDescription, 'new two');
    assert.equal(a.stored.tours[0].steps[0].popoverDescription, 'one');
    assert.equal(b.saves.length, 0);
});

test('a step that moved after the panel read the tours is found by its stored cId', async () => {
    const a = makeObject('objA', [
        { cId: 'c1', selectorType: 'none', popoverTitle: 'First', popoverDescription: 'one' },
        { cId: 'c2', selectorType: 'none', popoverTitle: 'Second', popoverDescription: 'two' },
    ]);
    const handler = handlerFor(a, [a]);
    a.stored.tours[0].steps.unshift({ cId: 'c0', selectorType: 'none', popoverTitle: 'New' });

    const result = await editAndSave(handler.properties.tours[0].steps[1], handler, 'new two');

    assert.equal(result.saved, true);
    assert.deepEqual(
        a.stored.tours[0].steps.map((s) => s.popoverDescription),
        [undefined, 'one', 'new two']
    );
});

test('a step that changed after the panel read the tours is not overwritten', async () => {
    const a = makeObject('objA');
    const handler = handlerFor(a, [a]);
    a.stored.tours[0].steps.unshift({ selectorType: 'none', popoverTitle: 'Inserted' });

    const result = await editAndSave(handler.properties.tours[0].steps[1], handler, 'stale');

    assert.equal(result.saved, false);
    assert.equal(a.saves.length, 0);
    assert.match(section.logger.warnings[0], /no longer in the tours/);
});

test('a stored step without a target type matches the panel default', async () => {
    const a = makeObject('objA', [
        { targetObjectId: 'chart1', popoverTitle: 'Old', popoverDescription: 'x' },
    ]);
    const handler = handlerFor(a, [a]);
    const item = handler.properties.tours[0].steps[0];
    item.selectorType = 'object';

    const result = await editAndSave(item, handler, 'y');

    assert.equal(result.saved, true);
    assert.equal(a.stored.tours[0].steps[0].popoverDescription, 'y');
});

test('a description set to a formula is edited as =expr and stays a formula', async () => {
    const a = makeObject('objA', [
        {
            selectorType: 'none',
            popoverTitle: 'Sales',
            popoverDescription: { qStringExpression: { qExpr: "'Sales: ' & Sum(Sales)" } },
        },
        { selectorType: 'none', popoverTitle: 'Plain', popoverDescription: 'text' },
    ]);
    const handler = handlerFor(a, [a]);
    const [formula, plain] = handler.properties.tours[0].steps;

    const first = await editAndSave(formula, handler, "='Total: ' & Sum(Sales)");
    const second = await editAndSave(plain, handler, 'still text');

    assert.equal(first.value, "='Sales: ' & Sum(Sales)");
    assert.deepEqual(a.stored.tours[0].steps[0].popoverDescription, {
        qStringExpression: "='Total: ' & Sum(Sales)",
    });
    assert.equal(second.value, 'text');
    assert.equal(a.stored.tours[0].steps[1].popoverDescription, 'still text');
});

test('without a handler, the step is looked for by cId in the object rendered last', async () => {
    const a = makeObject('objA', [
        { cId: 'c1', selectorType: 'none', popoverTitle: 'First', popoverDescription: 'one' },
    ]);
    section.extensionState.model = a.model;

    const found = await editAndSave(clone(a.stored.tours[0].steps[0]), undefined, 'new one');
    const missing = await editAndSave({ cId: 'nope' }, undefined, 'lost');

    assert.equal(found.saved, true);
    assert.equal(a.stored.tours[0].steps[0].popoverDescription, 'new one');
    assert.equal(missing.saved, false);
});

test('a failing save reports that nothing was saved', async () => {
    const a = makeObject('objA');
    a.model.setProperties = async () => {
        throw new Error('engine gone');
    };
    const handler = handlerFor(a, [a]);

    const result = await editAndSave(handler.properties.tours[0].steps[0], handler, 'x');

    assert.equal(result.saved, false);
    assert.match(section.logger.warnings[0], /engine gone/);
});

test('Open tour editor opens the editor for the panel object, rendered or not', async () => {
    const a = makeObject('objA');
    const b = makeObject('objB');
    section.extensionState.model = a.model;

    await openEditor(clone(b.stored), handlerFor(b, [a, b]));

    assert.equal(section.tourEditors.length, 1);
    assert.equal(section.tourEditors[0].model, b.model);
});

test('without a handler, Open tour editor uses the object rendered last only if it is the panel object', async () => {
    const a = makeObject('objA');
    const b = makeObject('objB');
    section.extensionState.model = a.model;
    section.extensionState.app = { name: 'app' };

    await openEditor(clone(a.stored), undefined);
    await openEditor(clone(b.stored), undefined);

    assert.equal(section.tourEditors.length, 1);
    assert.equal(section.tourEditors[0].model, a.model);
    assert.equal(alerts.length, 1);
});
