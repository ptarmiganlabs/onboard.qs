/**
 * Tour import/export utilities for Onboard.qs.
 *
 * Supports exporting tours + theme/widget configuration to a JSON file,
 * and importing from a JSON file with validation.
 */

import { generateUUID } from '../util/uuid';
import logger from '../util/logger';

/** Current schema version for export files. */
const EXPORT_VERSION = 1;

/**
 * Export tours and theme configuration to a downloadable JSON file.
 *
 * @param {object} layout - Extension layout (contains tours, theme, widget).
 * @param {string} [filename] - Download filename (defaults to 'onboard-qs-tours.json').
 */
export function exportToursAndTheme(layout, filename = 'onboard-qs-tours.json') {
    const payload = {
        version: EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        tours: layout.tours || [],
        theme: layout.theme || {},
        widget: layout.widget || {},
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);

    logger.info(`Exported ${payload.tours.length} tour(s) to ${filename}`);
}

/**
 * Open a file picker and read a JSON tour export file.
 *
 * @returns {Promise<object>} Parsed and validated import data.
 * @throws {Error} If file is invalid or user cancels.
 */
export function importFromFile() {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.style.display = 'none';
        document.body.appendChild(input);

        input.addEventListener('change', () => {
            const file = input.files?.[0];
            document.body.removeChild(input);

            if (!file) {
                reject(new Error('No file selected'));
                return;
            }

            const reader = new FileReader();
            /** Handle successful file read and parse the JSON content. */
            reader.onload = () => {
                try {
                    const data = JSON.parse(reader.result);
                    const validated = validateImportData(data);
                    logger.info(`Import file parsed: ${validated.tours.length} tour(s)`);
                    resolve(validated);
                } catch (err) {
                    reject(new Error(`Invalid import file: ${err.message}`));
                }
            };
            /**
             * Handle file read errors.
             *
             * @returns {void}
             */
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });

        // Handle cancel (input element is removed when dialog closes without selection)
        input.addEventListener('cancel', () => {
            document.body.removeChild(input);
            reject(new Error('Import cancelled'));
        });

        input.click();
    });
}

/**
 * Validate the structure of imported data.
 *
 * @param {object} data - Parsed JSON data.
 * @returns {object} Validated data with { tours, theme, widget }.
 * @throws {Error} If data is structurally invalid.
 */
function validateImportData(data) {
    if (!data || typeof data !== 'object') {
        throw new Error('Import data must be a JSON object');
    }

    if (!Array.isArray(data.tours)) {
        throw new Error('Import data must contain a "tours" array');
    }

    for (let i = 0; i < data.tours.length; i++) {
        const tour = data.tours[i];
        if (!tour || typeof tour !== 'object') {
            throw new Error(`Tour at index ${i} is not an object`);
        }
        if (!tour.tourName || typeof tour.tourName !== 'string') {
            throw new Error(`Tour at index ${i} is missing a valid "tourName"`);
        }
        if (!tour.tourId || typeof tour.tourId !== 'string') {
            throw new Error(`Tour at index ${i} is missing a valid "tourId"`);
        }
        if (!Array.isArray(tour.steps)) {
            throw new Error(`Tour "${tour.tourName}" is missing a "steps" array`);
        }
    }

    return {
        tours: data.tours,
        theme: data.theme && typeof data.theme === 'object' ? data.theme : null,
        widget: data.widget && typeof data.widget === 'object' ? data.widget : null,
    };
}

/**
 * Merge imported tours into an existing tours array based on the chosen mode.
 *
 * @param {Array} existingTours - Current tours array (will be mutated or replaced).
 * @param {Array} importedTours - Tours from the import file.
 * @param {'replaceMatching' | 'replaceAll' | 'addToExisting'} mode - Import merge mode.
 * @returns {Array} The resulting tours array.
 */
export function mergeTours(existingTours, importedTours, mode) {
    switch (mode) {
        case 'replaceAll':
            // Replace everything with imported tours (assign new IDs)
            return importedTours.map((tour) => ({
                ...tour,
                tourId: generateUUID(),
            }));

        case 'replaceMatching': {
            // Replace tours with same tourName, keep the rest
            const result = [...existingTours];
            for (const imported of importedTours) {
                const existingIdx = result.findIndex(
                    (t) => t.tourName === imported.tourName
                );
                if (existingIdx >= 0) {
                    result[existingIdx] = {
                        ...imported,
                        tourId: result[existingIdx].tourId, // Keep existing ID
                    };
                } else {
                    result.push({
                        ...imported,
                        tourId: generateUUID(),
                    });
                }
            }
            return result;
        }

        case 'addToExisting':
            // Append all imported tours with new IDs
            return [
                ...existingTours,
                ...importedTours.map((tour) => ({
                    ...tour,
                    tourId: generateUUID(),
                })),
            ];

        default:
            logger.warn(`Unknown import mode "${mode}", defaulting to addToExisting`);
            return [
                ...existingTours,
                ...importedTours.map((tour) => ({
                    ...tour,
                    tourId: generateUUID(),
                })),
            ];
    }
}
