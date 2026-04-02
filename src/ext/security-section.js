/**
 * Security property panel section.
 *
 * Provides extension-wide security settings, such as the URI allowlist
 * for iframe/video sources in tour step descriptions.
 *
 * @returns {object} Property panel section definition.
 */
export function securitySection() {
    return {
        type: 'items',
        label: 'Security',
        items: {
            allowedUriPatternsHeader: {
                component: 'text',
                label: 'Restrict which URLs can be loaded in embedded videos and iframes within tour step descriptions. When empty, all URLs are allowed (platform CSP still applies).',
            },
            allowedUriPatterns: {
                ref: 'security.allowedUriPatterns',
                type: 'string',
                label: 'Allowed URI prefixes',
                defaultValue: '',
                component: 'textarea',
                rows: 3,
                placeholder:
                    'https://www.youtube.com/embed/, https://player.vimeo.com/, /content/Default/',
            },
        },
    };
}
