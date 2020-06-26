export const ModuleConfig = {
    routerPrefix: 'settings',
    loadOrder: 10,
    moduleName: 'Users',
};

export function init(context, router) {
    context.addCompanySection(require('./sections/users').default(context, router));
    context.addSettingsSection(require('./sections/account').default);

    context.addLocalizationData({
        en: require('./locales/en'),
        ru: require('./locales/ru'),
    });

    return context;
}
