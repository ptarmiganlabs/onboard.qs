/**
 * Markdown editor dialog for Onboard.qs.
 *
 * Opens a modal with the shared tabbed Write/Preview Markdown editor.
 * Used by the property-panel "Edit in Markdown editor" button so that
 * tour authors get a proper editing experience instead of the small
 * native textarea.
 *
 * @module ui/markdown-editor-dialog
 */

import { createTabbedMarkdownEditor } from './markdown-toolbar';
import { confirmDiscardChanges } from './confirm-discard';
import logger from '../util/logger';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** @type {HTMLElement|null} */
let activeBackdrop = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Open the Markdown editor dialog.
 *
 * @param {object} options - Dialog configuration.
 * @param {string} options.title - Dialog heading.
 * @param {string} options.value - Current Markdown text.
 * @param {number} [options.maxLength] - Max chars (0 = unlimited).
 * @param {function(string): void} options.onSave - Called with the new text on save.
 */
export function openMarkdownEditorDialog({ title, value, maxLength, onSave }) {
    closeMarkdownEditorDialog();

    // -- Backdrop --
    const backdrop = document.createElement('div');
    backdrop.className = 'oqs-md-editor-backdrop';
    activeBackdrop = backdrop;

    // -- Dialog --
    const dialog = document.createElement('div');
    dialog.className = 'oqs-md-editor-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', title || 'Markdown Editor');
    dialog.addEventListener('click', (e) => e.stopPropagation());

    // -- Header --
    const header = document.createElement('div');
    header.className = 'oqs-md-editor-header';

    const titleEl = document.createElement('h3');
    titleEl.className = 'oqs-md-editor-title';
    titleEl.textContent = title || 'Edit Markdown';
    header.appendChild(titleEl);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'oqs-md-editor-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '✕';
    header.appendChild(closeBtn);

    dialog.appendChild(header);

    // -- Tabbed Markdown editor --
    const { container: editorContainer, textarea } = createTabbedMarkdownEditor({
        value: value || '',
        maxLength: maxLength || 0,
        rows: 16,
    });

    // Capture baseline from the actual textarea after creation so that any
    // normalisation performed by createTabbedMarkdownEditor is accounted for.
    const initialValue = textarea.value;

    // Give the tabbed editor flex growth inside the dialog
    editorContainer.style.flex = '1';
    editorContainer.style.minHeight = '0';
    editorContainer.style.display = 'flex';
    editorContainer.style.flexDirection = 'column';

    dialog.appendChild(editorContainer);

    // -- Character counter --
    if (maxLength > 0) {
        const counter = document.createElement('div');
        counter.className = 'oqs-md-editor-counter';

        /** Update counter text and styling. */
        const updateCounter = () => {
            const remaining = maxLength - textarea.value.length;
            counter.textContent = remaining + ' / ' + maxLength + ' characters remaining';
            counter.classList.toggle('oqs-md-editor-counter--exceeded', remaining < 0);
        };
        updateCounter();
        textarea.addEventListener('input', updateCounter);
        dialog.appendChild(counter);
    }

    // -- Dirty check helper --
    /**
     * Check whether the textarea content has been modified.
     *
     * @returns {boolean} Whether the textarea differs from its initial value.
     */
    const hasPendingChanges = () => textarea.value !== initialValue;

    /**
     * Attempt to close the editor dialog.
     * If there are unsaved changes, show a confirmation dialog first.
     */
    const guardedClose = async () => {
        if (hasPendingChanges()) {
            const discard = await confirmDiscardChanges();
            if (!discard) {
                // Only refocus the textarea when no confirmation overlay is
                // still visible (it keeps focus on its own "Keep editing" btn).
                if (!document.querySelector('.oqs-confirm-discard-backdrop')) {
                    textarea.focus();
                }
                return;
            }
        }
        closeMarkdownEditorDialog();
    };

    // -- Wire up close button to guarded close --
    closeBtn.addEventListener('click', guardedClose);

    // -- Footer --
    const footer = document.createElement('div');
    footer.className = 'oqs-md-editor-footer';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'oqs-md-editor-btn oqs-md-editor-btn--cancel';
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', guardedClose);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'oqs-md-editor-btn oqs-md-editor-btn--save';
    saveBtn.type = 'button';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => {
        if (typeof onSave === 'function') {
            onSave(textarea.value);
        }
        closeMarkdownEditorDialog();
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);
    dialog.appendChild(footer);

    // -- Keyboard handler --
    /**
     * Guard close on Escape key.
     *
     * @param {KeyboardEvent} e - Keyboard event.
     */
    const onKeyDown = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            guardedClose();
        }
    };
    document.addEventListener('keydown', onKeyDown);
    backdrop._oqsKeyHandler = onKeyDown;

    // -- Mount --
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);
    textarea.focus();

    logger.debug('Markdown editor dialog opened:', title);
}

/**
 * Close the Markdown editor dialog if open.
 */
export function closeMarkdownEditorDialog() {
    if (activeBackdrop) {
        if (activeBackdrop._oqsKeyHandler) {
            document.removeEventListener('keydown', activeBackdrop._oqsKeyHandler);
        }
        activeBackdrop.remove();
        activeBackdrop = null;
    }
}
