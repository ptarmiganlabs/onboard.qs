import { PACKAGE_VERSION } from '../util/logger';

/**
 * About / Support property panel section.
 *
 * Displays version info, project description, and links to
 * documentation, issue tracker, and Ptarmigan Labs website.
 *
 * @returns {object} Property panel section definition.
 */
export function aboutSection() {
    return {
        type: 'items',
        label: 'About',
        items: {
            versionInfo: {
                component: 'text',
                label: `Onboard.qs v${PACKAGE_VERSION}`,
            },
            description: {
                component: 'text',
                label: 'Interactive onboarding tours for Qlik Sense apps. Brought to you by Ptarmigan Labs.',
            },
            homepageGit: {
                component: 'link',
                label: 'Documentation & Source Code',
                url: 'https://github.com/ptarmiganlabs/onboard.qs',
            },
            reportBug: {
                component: 'link',
                label: 'Report a Bug / Request a Feature',
                url: 'https://github.com/ptarmiganlabs/onboard.qs/issues/new/choose',
            },
            homepagePlabs: {
                component: 'link',
                label: 'Ptarmigan Labs — Qlik Sense tools & consulting',
                url: 'https://ptarmiganlabs.com/',
            },
        },
    };
}
