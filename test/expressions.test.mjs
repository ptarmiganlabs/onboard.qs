/**
 * Tests for src/util/expressions.js: how the tour editor reads expressions
 * from an Onboard.qs object's stored properties, and writes them back when it
 * saves.
 *
 * The editor starts from the object's evaluated layout, where every
 * expression has become its value. overlayExpressions() puts the stored
 * expressions back as `=expr` text, and wrapExpressions() turns `=expr` text
 * into expressions again before the tours are saved.
 *
 * Run with `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    extractValueExpression,
    overlayExpressions,
    readNumberOrFormula,
    wrapExpressions,
    wrapIfValueExpression,
} from '../src/util/expressions.js';

/**
 * Copy a JSON value.
 *
 * @param {any} value - Value to copy.
 * @returns {any} The copy.
 */
const clone = (value) => JSON.parse(JSON.stringify(value));

/**
 * A tour as the property panel stores it, with expressions in its number
 * fields (as `qValueExpression`, without the '=') and in two text fields.
 */
const storedTour = {
    tourId: 't1',
    tourName: 'Formula tour',
    tourVersion: { qValueExpression: { qExpr: 'Year(Today())' } },
    overlayColor: { qStringExpression: { qExpr: "'#0C3256'" } },
    overlayOpacity: { qValueExpression: { qExpr: 'If(GetSelectedCount(Region) > 0, 80, 60)' } },
    stagePadding: { qValueExpression: { qExpr: '4 * 2' } },
    stageRadius: 5,
    steps: [
        {
            selectorType: 'none',
            popoverTitle: { qStringExpression: { qExpr: "'Sales: ' & Num(Sum(Sales), '#,##0')" } },
            popoverDescription: 'Static text',
            dialogSize: 'custom',
            customDialogWidth: {
                qValueExpression: { qExpr: 'If(Count(DISTINCT Region) > 3, 800, 600)' },
            },
            customDialogHeight: 400,
        },
    ],
};

/** The same tour as the engine evaluates it into the layout. */
const layoutTour = {
    ...clone(storedTour),
    tourVersion: 2026,
    overlayColor: '#0C3256',
    overlayOpacity: 60,
    stagePadding: 8,
    steps: [
        {
            ...clone(storedTour.steps[0]),
            popoverTitle: 'Sales: 111,949,023',
            customDialogWidth: 800,
        },
    ],
};

/**
 * Open the tour in the editor and save it, as openTourEditor() and
 * saveToModel() do, with an optional edit in between.
 *
 * @param {(tour: object) => void} [edit] - Changes made in the editor.
 * @returns {{editor: object, saved: object}} The tour as the editor showed it, and as it was saved.
 */
function openAndSave(edit) {
    const editorTours = clone([layoutTour]);
    overlayExpressions(editorTours, clone([storedTour]));
    const editor = clone(editorTours[0]);
    if (edit) edit(editorTours[0]);
    const toSave = clone(editorTours);
    wrapExpressions(toSave);
    return { editor, saved: toSave[0] };
}

test('a number formula is stored the way the property panel stores it', () => {
    assert.deepEqual(wrapIfValueExpression('=20+10'), { qValueExpression: { qExpr: '20+10' } });
    assert.equal(wrapIfValueExpression(30), 30);
    assert.equal(wrapIfValueExpression(''), '');
    assert.equal(wrapIfValueExpression(undefined), undefined);
});

test('a stored number formula is read back as =expr', () => {
    assert.equal(extractValueExpression({ qValueExpression: { qExpr: '20+10' } }), '=20+10');
    assert.equal(extractValueExpression({ qValueExpression: { qExpr: '=20+10' } }), '=20+10');
    assert.equal(extractValueExpression({ qValueExpression: '20+10' }), '=20+10');
    assert.equal(extractValueExpression(30), null);
    assert.equal(extractValueExpression({ qStringExpression: { qExpr: "'a'" } }), null);
    assert.equal(extractValueExpression(null), null);
});

test('the editor shows number formulas as =expr, as it does text formulas', () => {
    const { editor } = openAndSave();
    assert.equal(editor.tourVersion, '=Year(Today())');
    assert.equal(editor.overlayOpacity, '=If(GetSelectedCount(Region) > 0, 80, 60)');
    assert.equal(editor.stagePadding, '=4 * 2');
    assert.equal(editor.stageRadius, 5);
    assert.equal(editor.overlayColor, "='#0C3256'");
    assert.equal(editor.steps[0].customDialogWidth, '=If(Count(DISTINCT Region) > 3, 800, 600)');
    assert.equal(editor.steps[0].customDialogHeight, 400);
});

test('saving without changes keeps every formula, and plain numbers stay numbers', () => {
    const { saved } = openAndSave();
    assert.deepEqual(saved.tourVersion, storedTour.tourVersion);
    assert.deepEqual(saved.overlayOpacity, storedTour.overlayOpacity);
    assert.deepEqual(saved.stagePadding, storedTour.stagePadding);
    assert.equal(saved.stageRadius, 5);
    assert.deepEqual(saved.steps[0].customDialogWidth, storedTour.steps[0].customDialogWidth);
    assert.equal(saved.steps[0].customDialogHeight, 400);
    // Text formulas are saved in the editor's own form, which the engine evaluates the same way
    assert.deepEqual(saved.overlayColor, { qStringExpression: "='#0C3256'" });
    assert.deepEqual(saved.steps[0].popoverTitle, {
        qStringExpression: "='Sales: ' & Num(Sum(Sales), '#,##0')",
    });
});

test('a formula typed in the editor is saved as a formula, and a number replaces one', () => {
    const { saved } = openAndSave((tour) => {
        tour.stageRadius = '=2 + 3';
        tour.overlayOpacity = 75;
        tour.steps[0].customDialogHeight = '=300 + 100';
    });
    assert.deepEqual(saved.stageRadius, { qValueExpression: { qExpr: '2 + 3' } });
    assert.equal(saved.overlayOpacity, 75);
    assert.deepEqual(saved.steps[0].customDialogHeight, {
        qValueExpression: { qExpr: '300 + 100' },
    });
});

/** The tour editor's Overlay opacity field: default 60, from 0 to 100. */
const opacity = { fallback: 60, min: 0, max: 100 };

test('a number typed into an editor field is kept within its range', () => {
    assert.equal(readNumberOrFormula('75', opacity), 75);
    assert.equal(readNumberOrFormula('  75 ', opacity), 75);
    assert.equal(readNumberOrFormula('0', opacity), 0);
    assert.equal(readNumberOrFormula('500', opacity), 100);
    assert.equal(readNumberOrFormula('-20', { fallback: 8, min: 0 }), 0);
    assert.equal(readNumberOrFormula('5000', { fallback: 500, min: 200, max: 1200 }), 1200);
});

test('an empty field, or text that is not a number, gives the default', () => {
    assert.equal(readNumberOrFormula('', opacity), 60);
    assert.equal(readNumberOrFormula('dark', opacity), 60);
});

test('a formula is kept as typed, but a lone "=" is not saved as an empty formula', () => {
    assert.equal(readNumberOrFormula('=20+10', opacity), '=20+10');
    assert.equal(readNumberOrFormula(' =20+10 ', opacity), '=20+10');
    assert.equal(readNumberOrFormula('=', opacity), 60);
    assert.equal(readNumberOrFormula('=   ', opacity), 60);
    // So wrapExpressions() never stores { qValueExpression: { qExpr: '' } }
    assert.equal(wrapIfValueExpression(readNumberOrFormula('=', opacity)), 60);
});
