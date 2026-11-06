/**
 * Stand-ins for the dialogs tours-section.js opens from the property panel.
 * Each export replaces the same name in ui/markdown-editor-dialog or
 * ui/tour-editor, and records what it was called with.
 */

/** @type {Array<object>} Options of each Markdown editor opened, oldest first. */
export const markdownDialogs = [];

/** @type {Array<object>} Parameters of each tour editor opened, oldest first. */
export const tourEditors = [];

/**
 * Record a Markdown editor opening.
 *
 * @param {object} options - Dialog options, including onSave.
 */
export function openMarkdownEditorDialog(options) {
    markdownDialogs.push(options);
}

/**
 * Record a tour editor opening.
 *
 * @param {object} params - The app and model the editor is opened for.
 * @returns {Promise<void>} Resolves at once.
 */
export async function openTourEditorFor(params) {
    tourEditors.push(params);
}
