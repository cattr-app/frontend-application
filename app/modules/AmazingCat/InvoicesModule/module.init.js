import { havePermission } from "@/utils/user";

export const ModuleConfig = {
    enabled: true,
    routerPrefix: 'invoices',
};

export function init(context, router) {

    context.addRoute({
        path: '/user-rates',
        name: 'report.user-rates',
        component: () => import('./views/Invoices.vue'),
        meta: {
            auth: true,
            permissions: ['invoices/list'],
        }
    });

    context.addNavbarEntryDropDown({
        label: 'navigation.invoices',
        section: 'navigation.dropdown.invoices',
        to: {
            name: 'report.user-rates'
        },
        displayCondition: ($store) => {
            return havePermission($store.getters['user/allowedRules'], 'invoices/list');
        }
    });

    context.addLocalizationData({
        en: require('./locales/en'),
        ru: require('./locales/ru')
    });

    return context;
}
