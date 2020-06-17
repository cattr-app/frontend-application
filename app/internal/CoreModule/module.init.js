import env from '_app/etc/env';
import * as screenshot from '@/components/Screenshot';
import * as screenshotModal from '@/components/ScreenshotModal';

/**
 * ModuleConfig - used as module configuration section to manipulate module loading settings
 * @type {{routerPrefix: string, loadOrder: number, enabled: boolean}}
 */
export const ModuleConfig = {
    routerPrefix: 'settings',
    loadOrder: 10,
    moduleName: 'Core',
};

/**
 * Module init function.
 * Read all sections from ./sections folder
 * Note: new sections suppose to be described in the same way as old ones
 * Used inside moduleLoader.js to initialize all sections
 *
 * @param context
 * @param router
 * @returns {context}
 */
export function init(context, router) {
    context.addRoute({
        path: '/company/users/view/:id',
        name: 'company.users.view',
        component: () => import(/* webpackChunkName: "dashboard" */ './components/Users.vue'),
        meta: {
            auth: true,
        },
    });

    const requireSection = require.context('.', true, /^(?!.*(service|module)).*\.js$/);
    const sections = requireSection
        .keys()
        .map(fn => requireSection(fn).default)
        .map(section => {
            console.log(section);
            if (typeof section === 'function') {
                return section(context, router);
            }
            return section;
        });

    sections.forEach(section => {
        if (section.hasOwnProperty('scope') && section.scope === 'company') {
            context.addCompanySection(section);
        } else {
            context.addSettingsSection(section);
        }
    });

    if (env.GET_SCREENSHOTS_BY_ID) {
        // Modify screenshot paths
        screenshot.config.thumbnailPathProvider = screenshot => `uploads/screenshots/thumbs/${screenshot.id}`;
        screenshotModal.config.screenshotPathProvider = screenshot => `uploads/screenshots/${screenshot.id}`;
    }

    return context;
}
