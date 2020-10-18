import store from '@/store';

export const ModuleConfig = {
    routerPrefix: 'dashboard',
    loadOrder: 20,
    moduleName: 'Dashboard',
};

export function init(context) {
    context.addRoute({
        path: '/dashboard',
        alias: '/',
        name: 'dashboard',
        component: () => import(/* webpackChunkName: "dashboard" */ './views/Dashboard.vue'),
        meta: {
            auth: true,
        },
        children: [
            {
                path: '',
                beforeEnter: (to, from, next) => {
                    if (
                        store.getters['user/canInAnyProject']('dashboard/manager_access') &&
                        (!localStorage.getItem('dashboard.tab') || localStorage.getItem('dashboard.tab') === 'team')
                    ) {
                        return next({ name: 'dashboard.team' });
                    }

                    return next({ name: 'dashboard.timeline' });
                },
            },
            {
                path: 'timeline',
                alias: '/timeline',
                name: 'dashboard.timeline',
                component: () => import(/* webpackChunkName: "dashboard" */ './views/Dashboard/Timeline.vue'),
                meta: {
                    auth: true,
                },
            },
            {
                path: 'team',
                alias: '/team',
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
            path: '/dashboard',
        },
    });

    context.addLocalizationData({
        en: require('./locales/en'),
        ru: require('./locales/ru'),
    });

    return context;
}
