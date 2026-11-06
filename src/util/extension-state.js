/**
 * Shared extension state for Onboard.qs.
 *
 * Stores references to the Enigma model and app so that utility modules
 * (e.g. the Markdown editor dialog) can persist property changes
 * without requiring a direct parameter chain from the Supernova
 * component hook. They are those of the Onboard.qs object rendered last.
 *
 * @module util/extension-state
 */

/**
 * @type {{ model: object|null, app: object|null }}
 */
export const extensionState = {
    /** @type {object|null} Enigma model reference */
    model: null,

    /** @type {object|null} Enigma app reference */
    app: null,

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

    /**
     * Promise that resolves when tabContainerMap is fully built.
     * Set by the main render effect; awaited by runTour() so that
     * auto-start tours never race the map-building Engine calls.
     *
     * @type {Promise<void>|null}
     */
    tabContainerMapReady: null,
};
