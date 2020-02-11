export const ModuleConfig = {
    enabled: true,
    routerPrefix: 'dashboard',
    loadOrder: 1
};

export function init(context, router) {
    context.addRoute({
        path: '/',
        name: 'dashboard',
        component: () => import(/* webpackChunkName: "dashboard" */ './views/Dashboard.vue'),
        meta: {
            auth: true
        },
        children: [
            {
                path: 'timeline',
                name: 'dashboard.timeline',
                component: () => import(/* webpackChunkName: "dashboard" */ './views/Dashboard/Timeline.vue'),
                meta: {
                    auth: true
                }
            },
            {
                path: 'team',
                name: 'dashboard.team',
                component: () => import(/* webpackChunkName: "dashboard" */ './views/Dashboard/Team.vue'),
                meta: {
                    permissions: ['dashboard/manager_access'],
                },
            },
        ],
    });

    context.addNavbarEntry({
        label: 'navigation.dashboard',
        to: {
            name: 'dashboard.timeline'
        }
    });

    context.addLocalizationData({
        en: require('./locales/en'),
        ru: require('./locales/ru')
    });

    return context;
}
