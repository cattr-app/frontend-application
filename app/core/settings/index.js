import Store from '../store';
import { getModuleList, ModuleLoaderInterceptor } from '../moduleLoader';

/**
 * Initialising setting parent route
 * beforeEnter route we are check if any sections uploaded
 * If not - initialize them and provide to store
 */

ModuleLoaderInterceptor.on('loaded', (router) => {
    const modules = Object.values(getModuleList());
    const coreModule = modules.find(m => m.moduleInstance.routerPrefix === 'settings');

    function initSettingsSections(to, from, next) {
        if (!Store.getters['settings/sections'].length || !Store.getters['settings/sections'].find(section => section.scope === 'settings')) {
            coreModule.moduleInstance.initSettingsSections();
        }
        next();
    }

    function initCompanySections(to, from, next) {
        if (!Store.getters['settings/sections'].length || !Store.getters['settings/sections'].find(section => section.scope === 'company')) {
            coreModule.moduleInstance.initCompanySections();
        }

        if (!Object.keys(Store.getters['user/user']).length) {
            Store.watch(() => Store.getters['user/user'], user => {
                return user.is_admin === 1 ? next() : next({name: 'forbidden'});
            });
        } else {
            return Store.getters['user/user'].is_admin === 1 ? next() : next({name: 'forbidden'});
        }
    }

    const settings = [
        {
            path: '/company',
            name: 'company',
            component: () => import(/* webpackChunkName: "company" */ '../views/Settings/CompanySettings.vue'),
            meta: {
                auth: true
            },
            beforeEnter: initCompanySections,
            children: coreModule.moduleInstance.getCompanySectionsRoutes(),
        },
        {
            path: '/settings',
            name: 'settings',
            component: () => import(/* webpackChunkName: "settings" */ '../views/Settings/Settings.vue'),
            meta: {
                auth: true
            },
            beforeEnter: initSettingsSections,
            children: coreModule.moduleInstance.getSettingSectionsRoutes(),
        },
    ];

    router.addRoutes(settings);
});
