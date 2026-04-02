/**
 * Shared extension state for Onboard.qs.
 *
 * Stores a reference to the Enigma model so that utility modules
 * (e.g. the Markdown editor dialog) can persist property changes
 * without requiring a direct parameter chain from the Supernova
 * component hook.
 *
 * @module util/extension-state
 */

/**
 * @type {{ model: object|null }}
 */
export const extensionState = {
    /** @type {object|null} Enigma model reference */
    model: null,

    /**
     * Map of child object IDs to their parent tab container metadata.
     * Populated by getSheetObjects() / getObjectList() during object discovery.
     * Consumed by tour-runner.js to auto-switch tabs before highlighting.
     *
     * Shape: { [childObjectId: string]: { containerId: string, tabCId: string, tabLabel: string } }
     *
     * @type {{[key: string]: {containerId: string, tabCId: string, tabLabel: string}}}
     */
    tabContainerMap: {},
};
