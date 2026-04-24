/**
 * Sanitize a Lui icon name to prevent CSS class injection.
 *
 * Lui icon names consist only of lowercase letters, digits, and hyphens
 * (e.g. "play", "arrow-right"). Any value containing other characters is
 * rejected and an empty string is returned.
 *
 * @param {string} name - Raw icon name from user configuration.
 * @returns {string} The sanitized name, or an empty string if invalid.
 */
export function sanitizeIconName(name) {
    return typeof name === 'string' && /^[a-z0-9-]+$/.test(name.trim()) ? name.trim() : '';
}
