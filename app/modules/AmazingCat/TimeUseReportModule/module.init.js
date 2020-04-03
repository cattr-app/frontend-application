export const ModuleConfig = {
    enabled: true,
    routerPrefix: 'time-use-report',
    loadOrder: 3,
};

export function init(context, router) {
    context.addRoute({
        path: '/report/time-use',
        name: 'report.time-use',
        component: () => import(/* webpackChunkName: "report.timeuse" */ './views/TimeuseReport.vue'),
        meta: {
            auth: true,
        },
    });

    context.addNavbarEntryDropDown({
        label: 'navigation.time-use-report',
        section: 'navigation.dropdown.reports',
        to: {
            name: 'report.time-use',
        },
    });

    context.addLocalizationData({
        en: require('./locales/en'),
        ru: require('./locales/ru'),
    });

    return context;
}
