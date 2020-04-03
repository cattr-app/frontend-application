export const ModuleConfig = {
    enabled: true,
    routerPrefix: 'screenshots',
    loadOrder: 5,
};

export function init(context, router) {
    context.addRoute({
        path: '/screenshots',
        name: 'screenshots',
        component: () => import(/* webpackChunkName: "screenshots" */ './views/Screenshots.vue'),
        meta: {
            auth: true,
        },
    });

    context.addNavbarEntry({
        label: 'navigation.screenshots',
        to: {
            name: 'screenshots',
        },
    });

    context.addLocalizationData({
        en: require('./locales/en'),
        ru: require('./locales/ru'),
    });

    return context;
}
