import { widgetSection } from './widget-section';
import { themeSection } from './theme-section';
import { toursSection } from './tours-section';
import { aboutSection } from './about-section';

/**
 * Extension property panel definition for Onboard.qs.
 *
 * Provides a hybrid editing approach:
 *   - Basic tour/step configuration via the Qlik property panel
 *   - Rich editing via the in-extension modal editor (see tour-editor.js)
 *
 * @param {object} _galaxy - Nebula galaxy object.
 * @returns {object} Property panel definition.
 */
export default function ext(_galaxy) {
    return {
        support: {
            snapshot: false,
            export: false,
            sharing: false,
            viewData: false,
        },
        definition: {
            type: 'items',
            component: 'accordion',
            items: {
                widgetSection: widgetSection(),
                themeSection: themeSection(),
                toursSection: toursSection(),
                supportSection: aboutSection(),
            },
        },
    };
}
