/**
 * Unsaved-changes confirmation dialog for Onboard.qs.
 *
 * Shows an inline modal asking the user whether to discard pending edits.
 * Used by the tour editor and the Markdown editor dialog to prevent
 * accidental data loss when closing with unsaved changes.
 *
 * @module ui/confirm-discard
 */

// ---------------------------------------------------------------------------
// CSS class prefix — keeps selectors consistent and easy to grep
// ---------------------------------------------------------------------------
const CLS = 'oqs-confirm-discard';

/**
 * Show an inline confirmation dialog asking whether to discard unsaved changes.
 *
 * Returns a Promise that resolves to `true` (discard) or `false` (stay).
 *
 * @returns {Promise<boolean>} Whether the user chose to discard changes.
 */
export function confirmDiscardChanges() {
    return new Promise((resolve) => {
        // Prevent stacking – keep focus inside the existing confirmation
        const existing = document.querySelector(`.${CLS}-backdrop`);
        if (existing) {
            const existingKeepBtn = existing.querySelector(`.${CLS}-btn--keep`);
            if (existingKeepBtn) existingKeepBtn.focus();
            resolve(false);
            return;
        }

        // Remember the previously focused element so we can restore it later
        const previouslyFocused = /** @type {HTMLElement|null} */ (document.activeElement);

        const backdrop = document.createElement('div');
        backdrop.className = `${CLS}-backdrop`;

        const box = document.createElement('div');
        box.className = `${CLS}-dialog`;
        box.setAttribute('role', 'alertdialog');
        box.setAttribute('aria-modal', 'true');
        box.setAttribute('aria-label', 'Unsaved changes');
        box.addEventListener('click', (e) => e.stopPropagation());

        const msg = document.createElement('p');
        msg.className = `${CLS}-msg`;
        msg.textContent = 'You have unsaved changes. Are you sure you want to discard them?';
        box.appendChild(msg);

        const actions = document.createElement('div');
        actions.className = `${CLS}-actions`;

        const keepBtn = document.createElement('button');
        keepBtn.className = `oqs-md-editor-btn oqs-md-editor-btn--cancel ${CLS}-btn--keep`;
        keepBtn.type = 'button';
        keepBtn.textContent = 'Keep editing';

        const discardBtn = document.createElement('button');
        discardBtn.className = `oqs-md-editor-btn oqs-md-editor-btn--discard ${CLS}-btn--discard`;
        discardBtn.type = 'button';
        discardBtn.textContent = 'Discard changes';

        actions.appendChild(keepBtn);
        actions.appendChild(discardBtn);
        box.appendChild(actions);
        backdrop.appendChild(box);
        document.body.appendChild(backdrop);

        /**
         * Remove the dialog and resolve the Promise.
         *
         * @param {boolean} result - Whether to discard (true) or stay (false).
         */
        const cleanup = (result) => {
            document.removeEventListener('keydown', onKey, true);
            backdrop.remove();
            if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
                previouslyFocused.focus();
            }
            resolve(result);
        };

        keepBtn.addEventListener('click', () => cleanup(false));
        discardBtn.addEventListener('click', () => cleanup(true));
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) cleanup(false);
        });

        // Capture-phase handler so the confirmation Escape is consumed
        // before the parent editor's own keydown listener fires.
        /**
         * Handle keyboard events inside the confirmation dialog.
         *
         * @param {KeyboardEvent} e - The keyboard event.
         */
        const onKey = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                cleanup(false);
            }
        };
        document.addEventListener('keydown', onKey, true);

        // Focus the safe option to prevent accidental data loss
        keepBtn.focus();
    });
}
