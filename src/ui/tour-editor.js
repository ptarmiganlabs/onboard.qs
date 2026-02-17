import logger from '../util/logger';
import { generateUUID } from '../util/uuid';
import { highlightStep, destroyTour } from '../tour/tour-runner';
import { detectPlatform } from '../platform/index';

/**
 * Modal tour editor for edit mode.
 *
 * Provides a rich editing experience for configuring tours and steps
 * inside a full-screen overlay. Tour/step changes are saved back to
 * the extension's properties via the Enigma model.
 */

let currentHighlight = null;

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

    const platform = detectPlatform();

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
                if (currentHighlight) {
                    destroyTour(currentHighlight);
                    currentHighlight = null;
                }
                currentHighlight = highlightStep(step, platform.type);
                // Auto-dismiss after 3 seconds
                setTimeout(() => {
                    if (currentHighlight) {
                        destroyTour(currentHighlight);
                        currentHighlight = null;
                    }
                }, 3000);
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
                <h2 class="onboard-qs-editor__header-title">Onboard QS — Tour Editor</h2>
                <div class="onboard-qs-editor__header-actions">
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
                        <span>Tour Name</span>
                        <input type="text" class="onboard-qs-editor__input onboard-qs-editor__tour-name-input"
                               value="${escapeAttr(tour.tourName || '')}" />
                    </label>
                    <label class="onboard-qs-editor__field onboard-qs-editor__field--inline">
                        <input type="checkbox" class="onboard-qs-editor__tour-autostart" ${tour.autoStart ? 'checked' : ''} />
                        <span>Auto-start on sheet load</span>
                    </label>
                    <label class="onboard-qs-editor__field onboard-qs-editor__field--inline">
                        <input type="checkbox" class="onboard-qs-editor__tour-showonce" ${tour.showOnce !== false ? 'checked' : ''} />
                        <span>Show only once per user</span>
                    </label>
                    <label class="onboard-qs-editor__field onboard-qs-editor__field--inline">
                        <input type="checkbox" class="onboard-qs-editor__tour-progress" ${tour.showProgress !== false ? 'checked' : ''} />
                        <span>Show progress indicator</span>
                    </label>
                    <label class="onboard-qs-editor__field onboard-qs-editor__field--inline">
                        <input type="checkbox" class="onboard-qs-editor__tour-keyboard" ${tour.allowKeyboard !== false ? 'checked' : ''} />
                        <span>Allow keyboard navigation</span>
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
                        <span>Target Type</span>
                        <select class="onboard-qs-editor__select onboard-qs-editor__step-selector-type">
                            <option value="object" ${selectorType === 'object' ? 'selected' : ''}>Sheet Object</option>
                            <option value="css" ${selectorType === 'css' ? 'selected' : ''}>Custom CSS Selector</option>
                            <option value="none" ${selectorType === 'none' ? 'selected' : ''}>Standalone Dialog (no target)</option>
                        </select>
                    </label>
                    <label class="onboard-qs-editor__field" style="${selectorType !== 'object' ? 'display:none' : ''}">
                        <span>Target Object</span>
                        <select class="onboard-qs-editor__select onboard-qs-editor__step-object">
                            <option value="">-- Select an object --</option>
                            ${objectOptions}
                        </select>
                    </label>
                    <label class="onboard-qs-editor__field" style="${selectorType !== 'css' ? 'display:none' : ''}">
                        <span>CSS Selector</span>
                        <input type="text" class="onboard-qs-editor__input onboard-qs-editor__step-css-selector"
                               value="${escapeAttr(step.customCssSelector || '')}"
                               placeholder="e.g., .qlik-help-button, #my-element" />
                    </label>
                    <label class="onboard-qs-editor__field">
                        <span>Popover Title</span>
                        <input type="text" class="onboard-qs-editor__input onboard-qs-editor__step-title"
                               value="${escapeAttr(step.popoverTitle || '')}"
                               placeholder="e.g., Sales Overview" />
                    </label>
                    <label class="onboard-qs-editor__field">
                        <span>Popover Description
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
                            <span>Popover Side</span>
                            <select class="onboard-qs-editor__select onboard-qs-editor__step-side">
                                <option value="top" ${step.popoverSide === 'top' ? 'selected' : ''}>Top</option>
                                <option value="bottom" ${step.popoverSide === 'bottom' || !step.popoverSide ? 'selected' : ''}>Bottom</option>
                                <option value="left" ${step.popoverSide === 'left' ? 'selected' : ''}>Left</option>
                                <option value="right" ${step.popoverSide === 'right' ? 'selected' : ''}>Right</option>
                            </select>
                        </label>
                        <label class="onboard-qs-editor__field">
                            <span>Popover Align</span>
                            <select class="onboard-qs-editor__select onboard-qs-editor__step-align">
                                <option value="start" ${step.popoverAlign === 'start' ? 'selected' : ''}>Start</option>
                                <option value="center" ${step.popoverAlign === 'center' || !step.popoverAlign ? 'selected' : ''}>Center</option>
                                <option value="end" ${step.popoverAlign === 'end' ? 'selected' : ''}>End</option>
                            </select>
                        </label>
                    </div>
                    <label class="onboard-qs-editor__field onboard-qs-editor__field--inline">
                        <input type="checkbox" class="onboard-qs-editor__step-interaction"
                               ${step.disableInteraction !== false ? 'checked' : ''} />
                        <span>Disable interaction with target during this step</span>
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
