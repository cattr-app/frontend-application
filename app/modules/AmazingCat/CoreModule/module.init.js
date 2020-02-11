/**
 * ModuleConfig - used as module configuration section to manipulate module loading settings
 * @type {{routerPrefix: string, loadOrder: number, enabled: boolean}}
 */
export const ModuleConfig = {
    enabled: true,
    routerPrefix: 'settings',
    loadOrder: 10
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
    const requireSection = require.context('.', true, /^(?!.*(service|module)).*\.js$/);
    const sections = requireSection.keys()
        .map(fn => requireSection(fn).default)
        .map(section => {
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

    return context;
}
