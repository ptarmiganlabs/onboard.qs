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
};
