import logger from '../util/logger';
import { generateUUID } from '../util/uuid';
import { highlightStep, destroyTour } from '../tour/tour-runner';
import { detectPlatformType } from '../platform/index';
import { exportToursAndTheme, importFromFile, mergeTours } from '../tour/tour-io';

/**
 * Modal tour editor for edit mode.
 *
 * Provides a rich editing experience for configuring tours and steps
 * inside a full-screen overlay. Tour/step changes are saved back to
 * the extension's properties via the Enigma model.
 */

let currentHighlight = null;
let activePreviewCleanup = null;

/**
 * Open the tour editor modal.
 *
 * @param {object} params - Configuration parameters for the tour editor.
 * @param {object} params.layout - Current extension layout.
 * @param {object} params.model - Enigma model from useModel().
 * @param {object} params.app - Enigma app from useApp().
 * @param {Array<{id: string, title: string, type: string}>} params.sheetObjects - Available objects.
 * @param {() => void} [params.onClose] - Called when modal is closed.
 */
export function openTourEditor({ layout, model, app: _app, sheetObjects, onClose }) {
    // Prevent multiple modals
    if (document.getElementById('onboard-qs-editor-overlay')) {
        return;
    }

    // Deep clone tours to work with
    let tours = JSON.parse(JSON.stringify(layout.tours || []));
    let selectedTourIndex = tours.length > 0 ? 0 : -1;
    let selectedStepIndex = -1;

    const platformType = detectPlatformType();

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'onboard-qs-editor-overlay';
    overlay.className = 'onboard-qs-editor-overlay';
    overlay.innerHTML = buildEditorHTML(tours, sheetObjects, selectedTourIndex, selectedStepIndex);
    document.body.appendChild(overlay);

    // Prevent Qlik from capturing keyboard events in the modal
    overlay.addEventListener('keydown', (e) => e.stopPropagation());

    /**
     * Re-render the editor body panels (preserves header with Save/Cancel).
     */
    function render() {
        const body = overlay.querySelector('.onboard-qs-editor__body');
        if (body) {
            body.outerHTML = buildEditorInnerHTML(
                tours,
                sheetObjects,
                selectedTourIndex,
                selectedStepIndex
            );
            attachInnerListeners();
        }
    }

    /**
     * Attach event listeners to inner elements after render.
     */
    function attachInnerListeners() {
        // Tour list clicks
        overlay.querySelectorAll('.onboard-qs-editor__tour-item').forEach((item) => {
            item.addEventListener('click', () => {
                selectedTourIndex = parseInt(item.dataset.tourIndex, 10);
                selectedStepIndex = -1;
                render();
            });
        });

        // Add tour button
        const addTourBtn = overlay.querySelector('.onboard-qs-editor__add-tour');
        if (addTourBtn) {
            addTourBtn.addEventListener('click', () => {
                tours.push({
                    tourId: generateUUID(),
                    tourName: `Tour ${tours.length + 1}`,
                    tourVersion: 1,
                    autoStart: false,
                    showOnce: true,
                    showProgress: true,
                    allowKeyboard: true,
                    overlayColor: 'rgba(0, 0, 0, 0.6)',
                    overlayOpacity: 60,
                    stagePadding: 8,
                    stageRadius: 5,
                    nextBtnText: 'Next',
                    prevBtnText: 'Previous',
                    doneBtnText: 'Done',
                    steps: [],
                });
                selectedTourIndex = tours.length - 1;
                selectedStepIndex = -1;
                render();
            });
        }

        // Delete tour button
        overlay.querySelectorAll('.onboard-qs-editor__delete-tour').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.tourIndex, 10);
                tours.splice(idx, 1);
                if (selectedTourIndex >= tours.length) {
                    selectedTourIndex = tours.length - 1;
                }
                selectedStepIndex = -1;
                render();
            });
        });

        // Step list clicks
        overlay.querySelectorAll('.onboard-qs-editor__step-item').forEach((item) => {
            item.addEventListener('click', () => {
                selectedStepIndex = parseInt(item.dataset.stepIndex, 10);
                render();
            });
        });

        // Add step button
        const addStepBtn = overlay.querySelector('.onboard-qs-editor__add-step');
        if (addStepBtn) {
            addStepBtn.addEventListener('click', () => {
                if (selectedTourIndex < 0) return;
                const tour = tours[selectedTourIndex];
                tour.steps.push({
                    selectorType: 'object',
                    targetObjectId: '',
                    customCssSelector: '',
                    popoverTitle: '',
                    popoverDescription: '',
                    popoverSide: 'bottom',
                    popoverAlign: 'center',
                    dialogSize: 'medium',
                    customDialogWidth: 500,
                    customDialogHeight: 350,
                    disableInteraction: true,
                });
                selectedStepIndex = tour.steps.length - 1;
                render();
            });
        }

        // Delete step buttons
        overlay.querySelectorAll('.onboard-qs-editor__delete-step').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.stepIndex, 10);
                if (selectedTourIndex >= 0) {
                    tours[selectedTourIndex].steps.splice(idx, 1);
                    if (selectedStepIndex >= tours[selectedTourIndex].steps.length) {
                        selectedStepIndex = tours[selectedTourIndex].steps.length - 1;
                    }
                    render();
                }
            });
        });

        // Move step up/down
        overlay.querySelectorAll('.onboard-qs-editor__move-step').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.stepIndex, 10);
                const dir = btn.dataset.direction;
                if (selectedTourIndex < 0) return;
                const steps = tours[selectedTourIndex].steps;
                const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
                if (targetIdx < 0 || targetIdx >= steps.length) return;
                [steps[idx], steps[targetIdx]] = [steps[targetIdx], steps[idx]];
                selectedStepIndex = targetIdx;
                render();
            });
        });

        // Step detail form inputs
        attachStepDetailListeners();

        // Tour detail form inputs
        attachTourDetailListeners();

        // Preview step button
        const previewBtn = overlay.querySelector('.onboard-qs-editor__preview-step');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                if (selectedTourIndex < 0 || selectedStepIndex < 0) return;
                const step = tours[selectedTourIndex].steps[selectedStepIndex];

                // Clean up any previous preview before starting a new one
                if (activePreviewCleanup) {
                    activePreviewCleanup();
                }
                if (currentHighlight) {
                    destroyTour(currentHighlight);
                    currentHighlight = null;
                }

                // Hide editor overlay so the preview is visible
                overlay.style.display = 'none';
                currentHighlight = highlightStep(step, platformType);

                let autoTimer = null;

                /**
                 * Dismiss preview when the Escape key is pressed.
                 *
                 * @param {KeyboardEvent} e - The keyboard event.
                 */
                const dismissOnKey = (e) => {
                    if (e.key === 'Escape') {
                        restoreEditor();
                    }
                };

                /**
                 * Dismiss preview on any mouse click.
                 */
                const dismissOnClick = () => {
                    restoreEditor();
                };

                /**
                 * Restore the editor overlay and clean up the preview.
                 */
                function restoreEditor() {
                    clearTimeout(autoTimer);
                    document.removeEventListener('keydown', dismissOnKey);
                    document.removeEventListener('click', dismissOnClick);
                    activePreviewCleanup = null;
                    if (currentHighlight) {
                        destroyTour(currentHighlight);
                        currentHighlight = null;
                    }
                    overlay.style.display = '';
                }

                activePreviewCleanup = restoreEditor;

                // Auto-dismiss after 5 seconds
                autoTimer = setTimeout(restoreEditor, 5000);

                // Use setTimeout(0) so the current click event doesn't
                // immediately trigger the dismiss listener
                setTimeout(() => {
                    document.addEventListener('keydown', dismissOnKey);
                    document.addEventListener('click', dismissOnClick);
                }, 0);
            });
        }
    }

    /**
     * Attach listeners to step detail form fields.
     */
    function attachStepDetailListeners() {
        if (selectedTourIndex < 0 || selectedStepIndex < 0) return;
        const step = tours[selectedTourIndex].steps[selectedStepIndex];
        if (!step) return;

        // Selector type toggle
        const selectorTypeSelect = overlay.querySelector('.onboard-qs-editor__step-selector-type');
        if (selectorTypeSelect) {
            selectorTypeSelect.addEventListener('change', (e) => {
                step.selectorType = e.target.value;
                render();
            });
        }

        const objectSelect = overlay.querySelector('.onboard-qs-editor__step-object');
        if (objectSelect) {
            objectSelect.addEventListener('change', (e) => {
                step.targetObjectId = e.target.value;
                // Update step list to show new target name
                const stepItem = overlay.querySelector(
                    `.onboard-qs-editor__step-item[data-step-index="${selectedStepIndex}"]`
                );
                if (stepItem) {
                    const obj = sheetObjects.find((o) => o.id === step.targetObjectId);
                    const nameEl = stepItem.querySelector('.onboard-qs-editor__step-name');
                    if (nameEl) nameEl.textContent = obj ? obj.title : step.targetObjectId;
                }
            });
        }

        // Custom CSS selector input
        const cssSelectorInput = overlay.querySelector('.onboard-qs-editor__step-css-selector');
        if (cssSelectorInput) {
            cssSelectorInput.addEventListener('input', (e) => {
                step.customCssSelector = e.target.value;
            });
        }

        const titleInput = overlay.querySelector('.onboard-qs-editor__step-title');
        if (titleInput) {
            titleInput.addEventListener('input', (e) => {
                step.popoverTitle = e.target.value;
            });
        }

        const descInput = overlay.querySelector('.onboard-qs-editor__step-desc');
        if (descInput) {
            descInput.addEventListener('input', (e) => {
                step.popoverDescription = e.target.value;
            });
        }

        const sideSelect = overlay.querySelector('.onboard-qs-editor__step-side');
        if (sideSelect) {
            sideSelect.addEventListener('change', (e) => {
                step.popoverSide = e.target.value;
            });
        }

        const alignSelect = overlay.querySelector('.onboard-qs-editor__step-align');
        if (alignSelect) {
            alignSelect.addEventListener('change', (e) => {
                step.popoverAlign = e.target.value;
            });
        }

        const dialogSizeSelect = overlay.querySelector('.onboard-qs-editor__step-dialog-size');
        if (dialogSizeSelect) {
            dialogSizeSelect.addEventListener('change', (e) => {
                step.dialogSize = e.target.value;
                render(); // show/hide custom dimension fields
            });
        }

        const customWidthInput = overlay.querySelector('.onboard-qs-editor__step-custom-width');
        if (customWidthInput) {
            customWidthInput.addEventListener('input', (e) => {
                step.customDialogWidth = parseInt(e.target.value, 10) || 500;
            });
        }

        const customHeightInput = overlay.querySelector('.onboard-qs-editor__step-custom-height');
        if (customHeightInput) {
            customHeightInput.addEventListener('input', (e) => {
                step.customDialogHeight = parseInt(e.target.value, 10) || 350;
            });
        }

        const interactionCheck = overlay.querySelector('.onboard-qs-editor__step-interaction');
        if (interactionCheck) {
            interactionCheck.addEventListener('change', (e) => {
                step.disableInteraction = e.target.checked;
            });
        }
    }

    /**
     * Attach listeners to tour-level settings fields.
     */
    function attachTourDetailListeners() {
        if (selectedTourIndex < 0) return;
        const tour = tours[selectedTourIndex];
        if (!tour) return;

        const nameInput = overlay.querySelector('.onboard-qs-editor__tour-name-input');
        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                tour.tourName = e.target.value;
                // Update tour list name
                const tourItem = overlay.querySelector(
                    `.onboard-qs-editor__tour-item[data-tour-index="${selectedTourIndex}"]`
                );
                if (tourItem) {
                    const nameEl = tourItem.querySelector('.onboard-qs-editor__tour-item-name');
                    if (nameEl)
                        nameEl.textContent = e.target.value || `Tour ${selectedTourIndex + 1}`;
                }
            });
        }

        const autoStartCheck = overlay.querySelector('.onboard-qs-editor__tour-autostart');
        if (autoStartCheck) {
            autoStartCheck.addEventListener('change', (e) => {
                tour.autoStart = e.target.checked;
            });
        }

        const showOnceCheck = overlay.querySelector('.onboard-qs-editor__tour-showonce');
        if (showOnceCheck) {
            showOnceCheck.addEventListener('change', (e) => {
                tour.showOnce = e.target.checked;
            });
        }

        const progressCheck = overlay.querySelector('.onboard-qs-editor__tour-progress');
        if (progressCheck) {
            progressCheck.addEventListener('change', (e) => {
                tour.showProgress = e.target.checked;
            });
        }

        const keyboardCheck = overlay.querySelector('.onboard-qs-editor__tour-keyboard');
        if (keyboardCheck) {
            keyboardCheck.addEventListener('change', (e) => {
                tour.allowKeyboard = e.target.checked;
            });
        }

        // Overlay & stage settings
        const overlayColorInput = overlay.querySelector('.onboard-qs-editor__tour-overlay-color');
        if (overlayColorInput) {
            overlayColorInput.addEventListener('input', (e) => {
                tour.overlayColor = e.target.value;
            });
        }

        const overlayOpacityInput = overlay.querySelector('.onboard-qs-editor__tour-overlay-opacity');
        if (overlayOpacityInput) {
            overlayOpacityInput.addEventListener('input', (e) => {
                tour.overlayOpacity = parseInt(e.target.value, 10) || 0;
            });
        }

        const stagePaddingInput = overlay.querySelector('.onboard-qs-editor__tour-stage-padding');
        if (stagePaddingInput) {
            stagePaddingInput.addEventListener('input', (e) => {
                tour.stagePadding = parseInt(e.target.value, 10) || 0;
            });
        }

        const stageRadiusInput = overlay.querySelector('.onboard-qs-editor__tour-stage-radius');
        if (stageRadiusInput) {
            stageRadiusInput.addEventListener('input', (e) => {
                tour.stageRadius = parseInt(e.target.value, 10) || 0;
            });
        }

        // Navigation button text
        const nextBtnInput = overlay.querySelector('.onboard-qs-editor__tour-next-btn');
        if (nextBtnInput) {
            nextBtnInput.addEventListener('input', (e) => {
                tour.nextBtnText = e.target.value;
            });
        }

        const prevBtnInput = overlay.querySelector('.onboard-qs-editor__tour-prev-btn');
        if (prevBtnInput) {
            prevBtnInput.addEventListener('input', (e) => {
                tour.prevBtnText = e.target.value;
            });
        }

        const doneBtnInput = overlay.querySelector('.onboard-qs-editor__tour-done-btn');
        if (doneBtnInput) {
            doneBtnInput.addEventListener('input', (e) => {
                tour.doneBtnText = e.target.value;
            });
        }
    }

    // Attach top-level listeners
    // Save button
    overlay.querySelector('.onboard-qs-editor__save')?.addEventListener('click', async () => {
        await saveToModel(model, layout, tours);
        closeEditor();
    });

    // Cancel button
    overlay.querySelector('.onboard-qs-editor__cancel')?.addEventListener('click', () => {
        closeEditor();
    });

    // Export button
    overlay.querySelector('.onboard-qs-editor__export')?.addEventListener('click', () => {
        // Build a synthetic layout from the in-memory tours clone + current layout
        const exportLayout = {
            tours,
            theme: layout.theme || {},
            widget: layout.widget || {},
        };
        exportToursAndTheme(exportLayout);
    });

    // Import button
    overlay.querySelector('.onboard-qs-editor__import')?.addEventListener('click', async () => {
        try {
            const importData = await importFromFile();
            showImportDialog(overlay, importData, tours, layout, (mergedTours, mergedTheme) => {
                tours.length = 0;
                tours.push(...mergedTours);
                if (mergedTheme) {
                    // Store theme to apply on save
                    layout._importedTheme = mergedTheme;
                }
                selectedTourIndex = tours.length > 0 ? 0 : -1;
                selectedStepIndex = -1;
                render();
            });
        } catch (err) {
            if (err.message !== 'Import cancelled') {
                logger.error('Import failed:', err);
                alert(`Import failed: ${err.message}`);
            }
        }
    });

    // Close on ESC
    /**
     * Handle ESC key to close the editor.
     *
     * @param {KeyboardEvent} e - The keyboard event.
     */
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeEditor();
        }
    };
    document.addEventListener('keydown', escHandler);

    // Attach initial inner listeners
    attachInnerListeners();

    /**
     * Close the editor modal and clean up resources.
     */
    function closeEditor() {
        if (activePreviewCleanup) {
            activePreviewCleanup();
        }
        if (currentHighlight) {
            destroyTour(currentHighlight);
            currentHighlight = null;
        }
        document.removeEventListener('keydown', escHandler);
        overlay.remove();
        if (onClose) onClose();
    }
}

/**
 * Save tour configuration back to the Qlik model.
 *
 * @param {object} model - Enigma model.
 * @param {object} layout - Current layout.
 * @param {Array} tours - Modified tours array.
 */
async function saveToModel(model, layout, tours) {
    try {
        const props = await model.getProperties();
        props.tours = tours;
        // Apply imported theme if present
        if (layout._importedTheme) {
            props.theme = { ...props.theme, ...layout._importedTheme };
            delete layout._importedTheme;
        }
        await model.setProperties(props);
        logger.info('Tours saved to model');
    } catch (e) {
        logger.error('Failed to save tours:', e);
    }
}

/**
 * Build the complete editor HTML.
 *
 * @param {Array} tours - Array of tour configuration objects.
 * @param {Array<{id: string, title: string, type: string}>} sheetObjects - Available sheet objects.
 * @param {number} selectedTourIndex - Index of the currently selected tour.
 * @param {number} selectedStepIndex - Index of the currently selected step.
 * @returns {string} HTML string for the editor.
 */
function buildEditorHTML(tours, sheetObjects, selectedTourIndex, selectedStepIndex) {
    return `
        <div class="onboard-qs-editor">
            <div class="onboard-qs-editor__header">
                <h2 class="onboard-qs-editor__header-title">Onboard.qs — Tour Editor</h2>
                <div class="onboard-qs-editor__header-actions">
                    <button class="onboard-qs-btn onboard-qs-btn--secondary onboard-qs-btn--small onboard-qs-editor__export" title="Export tours to JSON file">&#128229; Export</button>
                    <button class="onboard-qs-btn onboard-qs-btn--secondary onboard-qs-btn--small onboard-qs-editor__import" title="Import tours from JSON file">&#128228; Import</button>
                    <button class="onboard-qs-btn onboard-qs-btn--primary onboard-qs-editor__save">Save</button>
                    <button class="onboard-qs-btn onboard-qs-btn--secondary onboard-qs-editor__cancel">Cancel</button>
                </div>
            </div>
            ${buildEditorInnerHTML(tours, sheetObjects, selectedTourIndex, selectedStepIndex)}
        </div>
    `;
}

/**
 * Build the inner content (panels) — called on re-render.
 *
 * @param {Array} tours - Array of tour configuration objects.
 * @param {Array<{id: string, title: string, type: string}>} sheetObjects - Available sheet objects.
 * @param {number} selectedTourIndex - Index of the currently selected tour.
 * @param {number} selectedStepIndex - Index of the currently selected step.
 * @returns {string} HTML string for the inner panels.
 */
function buildEditorInnerHTML(tours, sheetObjects, selectedTourIndex, selectedStepIndex) {
    const selectedTour = selectedTourIndex >= 0 ? tours[selectedTourIndex] : null;
    const selectedStep =
        selectedTour && selectedStepIndex >= 0 ? selectedTour.steps[selectedStepIndex] : null;

    return `
        <div class="onboard-qs-editor__body">
            ${buildTourListPanel(tours, selectedTourIndex)}
            ${buildStepListPanel(selectedTour, selectedTourIndex, selectedStepIndex, sheetObjects)}
            ${buildDetailPanel(selectedTour, selectedStep, selectedStepIndex, sheetObjects)}
        </div>
    `;
}

/**
 * Build the tour list panel (left).
 *
 * @param {Array} tours - Array of tour configuration objects.
 * @param {number} selectedTourIndex - Index of the currently selected tour.
 * @returns {string} HTML string for the tour list panel.
 */
function buildTourListPanel(tours, selectedTourIndex) {
    const tourItems = tours
        .map(
            (tour, i) => `
        <div class="onboard-qs-editor__tour-item ${i === selectedTourIndex ? 'onboard-qs-editor__tour-item--selected' : ''}"
             data-tour-index="${i}">
            <span class="onboard-qs-editor__tour-item-name">${escapeHtml(tour.tourName || `Tour ${i + 1}`)}</span>
            <span class="onboard-qs-editor__tour-item-badge">${tour.steps?.length || 0} steps</span>
            <button class="onboard-qs-editor__delete-tour" data-tour-index="${i}" title="Delete tour">&times;</button>
        </div>
    `
        )
        .join('');

    return `
        <div class="onboard-qs-editor__panel onboard-qs-editor__panel--tours">
            <div class="onboard-qs-editor__panel-header">
                <h3>Tours</h3>
                <button class="onboard-qs-btn onboard-qs-btn--small onboard-qs-editor__add-tour">+ Add Tour</button>
            </div>
            <div class="onboard-qs-editor__panel-content">
                ${tourItems || '<div class="onboard-qs-editor__empty">No tours yet. Click "+ Add Tour" to begin.</div>'}
            </div>
        </div>
    `;
}

/**
 * Build the step list panel (center).
 *
 * @param {object|null} tour - The selected tour object or null.
 * @param {number} tourIndex - Index of the selected tour.
 * @param {number} selectedStepIndex - Index of the currently selected step.
 * @param {Array<{id: string, title: string, type: string}>} sheetObjects - Available sheet objects.
 * @returns {string} HTML string for the step list panel.
 */
function buildStepListPanel(tour, tourIndex, selectedStepIndex, sheetObjects) {
    if (!tour) {
        return `
            <div class="onboard-qs-editor__panel onboard-qs-editor__panel--steps">
                <div class="onboard-qs-editor__panel-header"><h3>Steps</h3></div>
                <div class="onboard-qs-editor__panel-content">
                    <div class="onboard-qs-editor__empty">Select a tour to see its steps.</div>
                </div>
            </div>
        `;
    }

    const steps = tour.steps || [];
    const stepItems = steps
        .map((step, i) => {
            let name;
            if (step.selectorType === 'none') {
                name = 'Standalone dialog';
            } else if (step.selectorType === 'css') {
                name = step.customCssSelector ? `CSS: ${step.customCssSelector}` : '(no selector)';
            } else {
                const obj = sheetObjects.find((o) => o.id === step.targetObjectId);
                name = obj ? obj.title : step.targetObjectId || '(no target)';
            }
            const title = step.popoverTitle ? ` — ${step.popoverTitle}` : '';

            return `
            <div class="onboard-qs-editor__step-item ${i === selectedStepIndex ? 'onboard-qs-editor__step-item--selected' : ''}"
                 data-step-index="${i}">
                <span class="onboard-qs-editor__step-number">${i + 1}</span>
                <span class="onboard-qs-editor__step-name">${escapeHtml(name)}</span>
                <span class="onboard-qs-editor__step-title-preview">${escapeHtml(title)}</span>
                <div class="onboard-qs-editor__step-actions">
                    <button class="onboard-qs-editor__move-step" data-step-index="${i}" data-direction="up"
                            title="Move up" ${i === 0 ? 'disabled' : ''}>&#9650;</button>
                    <button class="onboard-qs-editor__move-step" data-step-index="${i}" data-direction="down"
                            title="Move down" ${i === steps.length - 1 ? 'disabled' : ''}>&#9660;</button>
                    <button class="onboard-qs-editor__delete-step" data-step-index="${i}" title="Delete step">&times;</button>
                </div>
            </div>
        `;
        })
        .join('');

    return `
        <div class="onboard-qs-editor__panel onboard-qs-editor__panel--steps">
            <div class="onboard-qs-editor__panel-header">
                <h3>Steps</h3>
                <button class="onboard-qs-btn onboard-qs-btn--small onboard-qs-editor__add-step">+ Add Step</button>
            </div>
            <div class="onboard-qs-editor__panel-content">
                ${stepItems || '<div class="onboard-qs-editor__empty">No steps. Click "+ Add Step".</div>'}
            </div>
        </div>
    `;
}

/**
 * Build a small info-icon span with a CSS tooltip.
 *
 * @param {string} text - The tooltip text to display.
 * @returns {string} HTML snippet for the info icon.
 */
function infoIcon(text) {
    return `<span class="onboard-qs-editor__info" data-tooltip="${escapeAttr(text)}">&#9432;</span>`;
}

/**
 * Build the detail/editing panel (right).
 *
 * @param {object|null} tour - The selected tour object or null.
 * @param {object|null} step - The selected step object or null.
 * @param {number} stepIndex - Index of the selected step.
 * @param {Array<{id: string, title: string, type: string}>} sheetObjects - Available sheet objects.
 * @returns {string} HTML string for the detail panel.
 */
function buildDetailPanel(tour, step, stepIndex, sheetObjects) {
    if (!tour) {
        return `
            <div class="onboard-qs-editor__panel onboard-qs-editor__panel--detail">
                <div class="onboard-qs-editor__panel-header"><h3>Details</h3></div>
                <div class="onboard-qs-editor__panel-content">
                    <div class="onboard-qs-editor__empty">Select a tour to edit its settings.</div>
                </div>
            </div>
        `;
    }

    // Tour settings are always shown; step detail is shown below when a step is selected
    let html = `
        <div class="onboard-qs-editor__panel onboard-qs-editor__panel--detail">
            <div class="onboard-qs-editor__panel-header"><h3>Details</h3></div>
            <div class="onboard-qs-editor__panel-content">
                <div class="onboard-qs-editor__section">
                    <h4>Tour Settings</h4>
                    <label class="onboard-qs-editor__field">
                        <span>Tour Name ${infoIcon('A descriptive name for this tour. Shown in the tour launch menu.')}</span>
                        <input type="text" class="onboard-qs-editor__input onboard-qs-editor__tour-name-input"
                               value="${escapeAttr(tour.tourName || '')}" />
                    </label>
                    <label class="onboard-qs-editor__field onboard-qs-editor__field--inline">
                        <input type="checkbox" class="onboard-qs-editor__tour-autostart" ${tour.autoStart ? 'checked' : ''} />
                        <span>Auto-start on sheet load ${infoIcon('Automatically launch this tour when the sheet is opened, instead of requiring the user to click.')}</span>
                    </label>
                    <label class="onboard-qs-editor__field onboard-qs-editor__field--inline">
                        <input type="checkbox" class="onboard-qs-editor__tour-showonce" ${tour.showOnce !== false ? 'checked' : ''} />
                        <span>Show only once per user ${infoIcon('When enabled, the auto-started tour is only shown once per user (tracked in localStorage). Increment Tour version to reset.')}</span>
                    </label>
                    <label class="onboard-qs-editor__field onboard-qs-editor__field--inline">
                        <input type="checkbox" class="onboard-qs-editor__tour-progress" ${tour.showProgress !== false ? 'checked' : ''} />
                        <span>Show progress indicator ${infoIcon('Display a "Step X of Y" progress text inside each popover.')}</span>
                    </label>
                    <label class="onboard-qs-editor__field onboard-qs-editor__field--inline">
                        <input type="checkbox" class="onboard-qs-editor__tour-keyboard" ${tour.allowKeyboard !== false ? 'checked' : ''} />
                        <span>Allow keyboard navigation ${infoIcon('Let users navigate steps with arrow keys and close the tour with Escape.')}</span>
                    </label>
                </div>
                <div class="onboard-qs-editor__section">
                    <h4>Overlay &amp; Stage</h4>
                    <label class="onboard-qs-editor__field">
                        <span>Overlay color ${infoIcon('CSS color for the backdrop behind the highlighted element, e.g. rgba(0,0,0,0.6) or #000.')}</span>
                        <input type="text" class="onboard-qs-editor__input onboard-qs-editor__tour-overlay-color"
                               value="${escapeAttr(tour.overlayColor || 'rgba(0, 0, 0, 0.6)')}" />
                    </label>
                    <label class="onboard-qs-editor__field">
                        <span>Overlay opacity (0\u2013100) ${infoIcon('How opaque the backdrop overlay is. 0 = fully transparent, 100 = fully opaque.')}</span>
                        <input type="number" class="onboard-qs-editor__input onboard-qs-editor__tour-overlay-opacity"
                               value="${tour.overlayOpacity != null ? tour.overlayOpacity : 60}" min="0" max="100" />
                    </label>
                    <label class="onboard-qs-editor__field">
                        <span>Stage padding (px) ${infoIcon('Extra space (in pixels) between the highlighted element and the cutout edge.')}</span>
                        <input type="number" class="onboard-qs-editor__input onboard-qs-editor__tour-stage-padding"
                               value="${tour.stagePadding != null ? tour.stagePadding : 8}" min="0" />
                    </label>
                    <label class="onboard-qs-editor__field">
                        <span>Stage border radius (px) ${infoIcon('Corner rounding (in pixels) of the highlight cutout around the target element.')}</span>
                        <input type="number" class="onboard-qs-editor__input onboard-qs-editor__tour-stage-radius"
                               value="${tour.stageRadius != null ? tour.stageRadius : 5}" min="0" />
                    </label>
                </div>
                <div class="onboard-qs-editor__section">
                    <h4>Navigation Buttons</h4>
                    <label class="onboard-qs-editor__field">
                        <span>Next button text ${infoIcon('Label shown on the Next button in the popover.')}</span>
                        <input type="text" class="onboard-qs-editor__input onboard-qs-editor__tour-next-btn"
                               value="${escapeAttr(tour.nextBtnText || 'Next')}" />
                    </label>
                    <label class="onboard-qs-editor__field">
                        <span>Previous button text ${infoIcon('Label shown on the Previous button in the popover.')}</span>
                        <input type="text" class="onboard-qs-editor__input onboard-qs-editor__tour-prev-btn"
                               value="${escapeAttr(tour.prevBtnText || 'Previous')}" />
                    </label>
                    <label class="onboard-qs-editor__field">
                        <span>Done button text ${infoIcon('Label shown on the final step button to finish the tour.')}</span>
                        <input type="text" class="onboard-qs-editor__input onboard-qs-editor__tour-done-btn"
                               value="${escapeAttr(tour.doneBtnText || 'Done')}" />
                    </label>
                </div>
    `;

    if (step && stepIndex >= 0) {
        const selectorType = step.selectorType || 'object';
        const objectOptions = sheetObjects
            .map(
                (obj) => `
            <option value="${escapeAttr(obj.id)}" ${obj.id === step.targetObjectId ? 'selected' : ''}>
                ${escapeHtml(obj.title)} (${escapeHtml(obj.type)})
            </option>
        `
            )
            .join('');

        html += `
                <div class="onboard-qs-editor__section">
                    <h4>Step ${stepIndex + 1} Details</h4>
                    <label class="onboard-qs-editor__field">
                        <span>Target Type ${infoIcon('How the step finds its target: a Qlik object, a CSS selector, or no target (standalone dialog).')}</span>
                        <select class="onboard-qs-editor__select onboard-qs-editor__step-selector-type">
                            <option value="object" ${selectorType === 'object' ? 'selected' : ''}>Sheet Object</option>
                            <option value="css" ${selectorType === 'css' ? 'selected' : ''}>Custom CSS Selector</option>
                            <option value="none" ${selectorType === 'none' ? 'selected' : ''}>Standalone Dialog (no target)</option>
                        </select>
                    </label>
                    <label class="onboard-qs-editor__field" style="${selectorType !== 'object' ? 'display:none' : ''}">
                        <span>Target Object ${infoIcon('The Qlik Sense sheet object to highlight during this step.')}</span>
                        <select class="onboard-qs-editor__select onboard-qs-editor__step-object">
                            <option value="">-- Select an object --</option>
                            ${objectOptions}
                        </select>
                    </label>
                    <label class="onboard-qs-editor__field" style="${selectorType !== 'css' ? 'display:none' : ''}">
                        <span>CSS Selector ${infoIcon('A CSS selector (e.g. .my-class or #my-id) that identifies the DOM element to highlight.')}</span>
                        <input type="text" class="onboard-qs-editor__input onboard-qs-editor__step-css-selector"
                               value="${escapeAttr(step.customCssSelector || '')}"
                               placeholder="e.g., .qlik-help-button, #my-element" />
                    </label>
                    <label class="onboard-qs-editor__field">
                        <span>Popover Title ${infoIcon('Bold heading displayed at the top of the tour step popover.')}</span>
                        <input type="text" class="onboard-qs-editor__input onboard-qs-editor__step-title"
                               value="${escapeAttr(step.popoverTitle || '')}"
                               placeholder="e.g., Sales Overview" />
                    </label>
                    <label class="onboard-qs-editor__field">
                        <span>Popover Description ${infoIcon('Body text of the popover. Supports Markdown and raw HTML.')}
                            <small class="onboard-qs-editor__hint">
                                (Markdown supported)
                            </small>
                        </span>
                        <textarea class="onboard-qs-editor__textarea onboard-qs-editor__step-desc"
                                  rows="5"
                                  placeholder="Markdown: **bold** *italic* [link](url) ![img](url)"
                        >${escapeHtml(step.popoverDescription || '')}</textarea>
                    </label>
                    <div class="onboard-qs-editor__field-row">
                        <label class="onboard-qs-editor__field">
                            <span>Popover Side ${infoIcon('Which side of the highlighted element the popover appears on.')}</span>
                            <select class="onboard-qs-editor__select onboard-qs-editor__step-side">
                                <option value="top" ${step.popoverSide === 'top' ? 'selected' : ''}>Top</option>
                                <option value="bottom" ${step.popoverSide === 'bottom' || !step.popoverSide ? 'selected' : ''}>Bottom</option>
                                <option value="left" ${step.popoverSide === 'left' ? 'selected' : ''}>Left</option>
                                <option value="right" ${step.popoverSide === 'right' ? 'selected' : ''}>Right</option>
                            </select>
                        </label>
                        <label class="onboard-qs-editor__field">
                            <span>Popover Align ${infoIcon('How the popover is aligned along its chosen side (start, center, or end).')}</span>
                            <select class="onboard-qs-editor__select onboard-qs-editor__step-align">
                                <option value="start" ${step.popoverAlign === 'start' ? 'selected' : ''}>Start</option>
                                <option value="center" ${step.popoverAlign === 'center' || !step.popoverAlign ? 'selected' : ''}>Center</option>
                                <option value="end" ${step.popoverAlign === 'end' ? 'selected' : ''}>End</option>
                            </select>
                        </label>
                    </div>
                    <label class="onboard-qs-editor__field" style="${selectorType !== 'none' ? 'display:none' : ''}">
                        <span>Dialog Size ${infoIcon('Fixed dimensions for the standalone dialog. Only applies when Target type is "Standalone Dialog".')}</span>
                        <select class="onboard-qs-editor__select onboard-qs-editor__step-dialog-size">
                            <option value="dynamic" ${step.dialogSize === 'dynamic' ? 'selected' : ''}>Dynamic (fit content)</option>
                            <option value="small" ${step.dialogSize === 'small' ? 'selected' : ''}>Small (320 × 220)</option>
                            <option value="medium" ${step.dialogSize === 'medium' || !step.dialogSize ? 'selected' : ''}>Medium (480 × 320)</option>
                            <option value="large" ${step.dialogSize === 'large' ? 'selected' : ''}>Large (640 × 420)</option>
                            <option value="x-large" ${step.dialogSize === 'x-large' ? 'selected' : ''}>Extra large (800 × 520)</option>
                            <option value="custom" ${step.dialogSize === 'custom' ? 'selected' : ''}>Custom…</option>
                        </select>
                    </label>
                    <div class="onboard-qs-editor__field-row" style="${selectorType !== 'none' || step.dialogSize !== 'custom' ? 'display:none' : ''}">
                        <label class="onboard-qs-editor__field">
                            <span>Width (px)</span>
                            <input type="number" class="onboard-qs-editor__input onboard-qs-editor__step-custom-width"
                                   value="${step.customDialogWidth || 500}" min="200" max="1200" />
                        </label>
                        <label class="onboard-qs-editor__field">
                            <span>Height (px)</span>
                            <input type="number" class="onboard-qs-editor__input onboard-qs-editor__step-custom-height"
                                   value="${step.customDialogHeight || 350}" min="100" max="900" />
                        </label>
                    </div>
                    <label class="onboard-qs-editor__field onboard-qs-editor__field--inline">
                        <input type="checkbox" class="onboard-qs-editor__step-interaction"
                               ${step.disableInteraction !== false ? 'checked' : ''} />
                        <span>Disable interaction with target during this step ${infoIcon('When enabled, the user cannot click the highlighted element while this step is active.')}</span>
                    </label>
                    <button class="onboard-qs-btn onboard-qs-btn--secondary onboard-qs-editor__preview-step">
                        &#128065; Preview This Step
                    </button>
                </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    return html;
}

/**
 * Show an import confirmation dialog as a sub-overlay.
 *
 * @param {HTMLElement} parentOverlay - The editor overlay element.
 * @param {object} importData - Validated import data { tours, theme, widget }.
 * @param {Array} existingTours - Current in-memory tours array.
 * @param {object} layout - Current layout (for theme reference).
 * @param {(mergedTours: Array, mergedTheme: object|null) => void} onConfirm - Callback with merged result.
 */
function showImportDialog(parentOverlay, importData, existingTours, layout, onConfirm) {
    const hasTheme = importData.theme && Object.keys(importData.theme).length > 0;
    const tourCount = importData.tours.length;
    const tourNames = importData.tours.map((t) => t.tourName).join(', ');

    const dialog = document.createElement('div');
    dialog.className = 'onboard-qs-import-dialog-overlay';
    dialog.innerHTML = `
        <div class="onboard-qs-import-dialog">
            <h3 class="onboard-qs-import-dialog__title">Import Tours</h3>
            <div class="onboard-qs-import-dialog__summary">
                <p>Found <strong>${tourCount}</strong> tour${tourCount !== 1 ? 's' : ''}: ${escapeHtml(tourNames)}</p>
                ${hasTheme ? '<p>Theme configuration included.</p>' : ''}
            </div>
            <div class="onboard-qs-import-dialog__options">
                <label class="onboard-qs-import-dialog__option">
                    <input type="radio" name="oqs-import-mode" value="replaceMatching" checked />
                    <span><strong>Replace matching</strong> — Overwrite tours with the same name, keep the rest</span>
                </label>
                <label class="onboard-qs-import-dialog__option">
                    <input type="radio" name="oqs-import-mode" value="replaceAll" />
                    <span><strong>Replace all</strong> — Clear existing tours, load imported ones</span>
                </label>
                <label class="onboard-qs-import-dialog__option">
                    <input type="radio" name="oqs-import-mode" value="addToExisting" />
                    <span><strong>Add to existing</strong> — Append imported tours alongside existing ones</span>
                </label>
            </div>
            ${
                hasTheme
                    ? `<label class="onboard-qs-import-dialog__theme-toggle">
                    <input type="checkbox" class="oqs-import-theme-check" checked />
                    <span>Also import theme settings</span>
                </label>`
                    : ''
            }
            <div class="onboard-qs-import-dialog__actions">
                <button class="onboard-qs-btn onboard-qs-btn--primary onboard-qs-import-dialog__confirm">Import</button>
                <button class="onboard-qs-btn onboard-qs-btn--secondary onboard-qs-import-dialog__cancel">Cancel</button>
            </div>
        </div>
    `;

    parentOverlay.appendChild(dialog);

    // Prevent clicks from propagating to the editor
    dialog.addEventListener('click', (e) => e.stopPropagation());
    dialog.addEventListener('keydown', (e) => e.stopPropagation());

    dialog.querySelector('.onboard-qs-import-dialog__confirm')?.addEventListener('click', () => {
        const mode = dialog.querySelector('input[name="oqs-import-mode"]:checked')?.value || 'replaceMatching';
        const importTheme = dialog.querySelector('.oqs-import-theme-check')?.checked ?? false;

        const mergedTours = mergeTours(existingTours, importData.tours, mode);
        const mergedTheme = importTheme && importData.theme ? importData.theme : null;

        dialog.remove();
        onConfirm(mergedTours, mergedTheme);
    });

    dialog.querySelector('.onboard-qs-import-dialog__cancel')?.addEventListener('click', () => {
        dialog.remove();
    });
}

/**
 * Escape HTML entities for safe rendering.
 *
 * @param {string} str - Raw string to escape.
 * @returns {string} HTML-escaped string.
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Escape string for use in HTML attributes.
 *
 * @param {string} str - Raw string to escape.
 * @returns {string} Attribute-safe escaped string.
 */
function escapeAttr(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
