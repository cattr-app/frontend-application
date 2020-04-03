import Module from '@/arch/module';

/**
 * Module configuration
 *
 * @type {{routerPrefix: string, enabled: boolean, initOrder: number}}
 */
export const ModuleConfig = {
    // Is this module should be enabled or not (Only affect on local module instance)
    enabled: true,

    // Default router prefix. Notice: this parameter will be ignored in context.addRoutes().
    // Grid and Crud entities will be automatically prefixed with this string
    routerPrefix: 'sample-module',

    // Load order for this module.
    // Notice: this will only take effect on init() function execution order.
    // module.init.js will be required in module name alphabetical order
    initOrder: 0,

    // Node module name
    moduleName: 'AmazingCat_SampleModule',
};

/**
 * Default module init function, will be executed on module initialization.
 * The context is a current module instance
 * Router - current Vue Router state
 *
 * This function MUST return the context at any way
 *
 * @param context: Module
 * @param router: Router
 * @returns {Module}
 */
export function init(context, router) {
    context.addLocaleCode('dk', 'Danish');
    return context;
}
