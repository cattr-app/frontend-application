import { havePermission } from '@/utils/user';

export const ModuleConfig = {
    enabled: true,
    routerPrefix: 'project-report',
    loadOrder: 2
};

export function init(context, router) {
    context.addRoute({
        path: '/report/projects',
        name: 'report.projects',
        component: () => import(/* webpackChunkName: "report.projects" */ './views/ProjectReport.vue'),
        meta: {
            auth: true,
        }
    });

    context.addNavbarEntryDropDown({
        label: 'navigation.project-report',
        section: 'navigation.dropdown.reports',
        to: {
            name: 'report.projects'
        },
    });

    context.addLocalizationData({
        en: require('./locales/en'),
        ru: require('./locales/ru')
    });

    return context;
}
