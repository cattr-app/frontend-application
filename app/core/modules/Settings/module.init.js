export const ModuleConfig = {
    routerPrefix: 'settings',
    loadOrder: 10,
    moduleName: 'Settings',
};

export function init(context, router) {
    context.addCompanySection(require('./sections/general').default);

    context.addLocalizationData({
        en: require('./locales/en'),
        ru: require('./locales/ru'),
    });

    return context;
}
