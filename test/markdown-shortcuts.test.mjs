/**
 * Tests for the Markdown editor's formatting buttons and shortcuts in
 * src/util/markdown-shortcuts.js, on a stand-in textarea.
 *
 * Run with `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    applyBold,
    applyCode,
    applyHeading3,
    applyItalic,
} from '../src/util/markdown-shortcuts.js';

/**
 * A textarea with part of its text selected.
 *
 * @param {string} value - The text.
 * @param {number} start - Where the selection starts.
 * @param {number} end - Where the selection ends.
 * @returns {object} The stand-in textarea.
 */
const textarea = (value, start, end) => ({
    value,
    selectionStart: start,
    selectionEnd: end,
    focus() {},
    dispatchEvent() {},
});

/**
 * The selected text.
 *
 * @param {object} ta - The stand-in textarea.
 * @returns {string} The selection.
 */
const selection = (ta) => ta.value.slice(ta.selectionStart, ta.selectionEnd);

test('bold keeps the spaces around a selection outside its markers', () => {
    // Double-clicking a word selects the space after it in some browsers,
    // and CommonMark doesn't treat `**word **` as bold
    const ta = textarea('Click word here', 6, 11);
    applyBold(ta);
    assert.equal(ta.value, 'Click **word** here');
    assert.equal(selection(ta), 'word');
});

test('italic and code do the same, with spaces on both sides', () => {
    const italic = textarea('a  word  b', 1, 8);
    applyItalic(italic);
    assert.equal(italic.value, 'a  *word*  b');
    assert.equal(selection(italic), 'word');

    const code = textarea('run npm test now', 3, 13);
    applyCode(code);
    assert.equal(code.value, 'run `npm test` now');
});

test('with nothing selected, bold inserts a placeholder and selects it', () => {
    const ta = textarea('Text ', 5, 5);
    applyBold(ta);
    assert.equal(ta.value, 'Text **bold**');
    assert.equal(selection(ta), 'bold');
});

test('a heading prefix leaves the selection as it is', () => {
    const ta = textarea('Title', 0, 5);
    applyHeading3(ta);
    assert.equal(ta.value, '### Title');
});
