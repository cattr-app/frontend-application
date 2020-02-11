import EmailReportService from './services/EmailReportService';
import ProjectService from '@/service/resource/projectService';
import MultiSelect from '@/components/MultiSelect';
import Dinput from './components/Dinput';
import Calendar from '@/components/Calendar';
import { havePermission } from '@/utils/user';
import i18n from '@/i18n';

import './styles/email-reports.scss';

export const ModuleConfig = {
    enabled: true,
    routerPrefix: 'email-reports',
};

export function init(context, router) {

    const crud = context.createCrud('email-reports.create-title', 'email-reports', EmailReportService);

    const crudViewRoute = crud.view.getViewRouteName();
    const crudEditRoute = crud.edit.getEditRouteName();
    const crudNewRoute = crud.new.getNewRouteName();

    crud.new.addToMetaProperties('permissions', 'email-reports/create', crud.new.getRouterConfig());
    crud.edit.addToMetaProperties('permissions', 'email-reports/edit', crud.edit.getRouterConfig());
    crud.view.addToMetaProperties('permissions', 'email-reports/show', crud.view.getRouterConfig());

    const grid = context.createGrid('email-reports.title', 'email-reports', EmailReportService);
    grid.addToMetaProperties('permissions', 'email-reports/list', grid.getRouterConfig());

    const fieldsToShow = [
        {
            key: 'name',
            label: 'field.name',
        },
        {
            key: 'emails',
            label: 'field.email',
            render: (h, props) => {
                props.currentValue = props.currentValue.toString();

                return h('span', props.currentValue);
            }
        },
        {
            key: 'frequency',
            label: 'field.frequency.label',
            render: (h, props) => {
                const frequency = {
                    0: 'field.frequency.daily',
                    1: 'field.frequency.weekly',
                    2: 'field.frequency.monthly',
                };
                return h('span', i18n.t(frequency[props.currentValue]));
            }
        },
        {
            key: 'sending_day',
            label: 'field.value',
        },
        {
            key: 'document_type',
            label: 'field.document_type'
        },
        {
            key: 'statistic_type',
            label: 'field.statistic_type.label',
            render: (h, props) => {
                const statistic = {
                    0: 'field.statistic_type.invoices_statistic',
                    1: 'field.statistic_type.project_report',
                };
                return h('span', i18n.t(statistic[props.currentValue]));
            }
        },
        {
            label: 'field.projects',
            key: 'project_names'
        },
    ];

    const fieldsToFill = [
        {
            key: 'id',
            displayable: false
        },
        {
            key: 'name',
            label: 'field.name',
            type: 'text',
            required: true
        },
        {
            key: 'statistic_type',
            label: 'field.statistic_type.label',
            type: 'select',
            required: true,
            options: [
                {
                    value: 0,
                    label: 'field.statistic_type.invoices_statistic'
                },
                {
                    value: 1,
                    label: 'field.statistic_type.project_report'
                }
            ]
        },
        {
            label: 'field.projects',
            key: 'project_ids',
            required: true,
            render: (h, props) => {
                return h(MultiSelect, {
                    props: {
                        service: new ProjectService(),
                        inputHandler: props.inputHandler,
                        selected: props.currentValue
                    }
                })
            }
        },
        {
            key: 'frequency',
            label: 'field.frequency.label',
            type: 'select',
            options: [
                {
                    value: 0,
                    label: 'field.frequency.daily'
                },
                {
                    value: 1,
                    label: 'field.frequency.weekly'
                },
                {
                    value: 2,
                    label: 'field.frequency.monthly'
                }
            ],
            required: true
        },
        {
            key: 'document_type',
            label: 'field.document_type',
            type: 'select',
            options: [
                {
                    value: 'pdf',
                    label: 'field.pdf'
                },
                {
                    value: 'xlsx',
                    label: 'field.xlsx'
                },
                {
                    value: 'csv',
                    label: 'field.csv'
                }
            ],
            required: true
        },
        {
            key: 'sending_day',
            label: 'field.value',
            render: (h, data) => {
                const date = (new Date()).toISOString();
                data.inputHandler(date);

                return h(Calendar, {
                    class: 'email-reports__calendar',
                    props: {
                        week: false,
                        month: false,
                        range: false,
                        start: data.currentValue.length ? data.currentValue : date,
                        end: data.currentValue.length ? data.currentValue : date,
                    },
                    on: {
                        change(item) {
                            data.inputHandler((new Date(item.start)).toISOString());
                        },
                    }
                });
            },
            required: true
        },
        {
            key: 'emails',
            label: 'field.email',
            required: true,
            render: function (h, data) {
                data.currentValue = data.currentValue.hasOwnProperty('length')
                    ? data.currentValue
                    : [''];

                return h(Dinput, {
                    props: {
                        emails: data.currentValue,
                    },
                    on: {
                        updateProps(emails, index) {
                            data.currentValue[index] = emails;
                            data.inputHandler(data.currentValue);
                        },
                        addInput(input) {
                            data.inputHandler([...data.currentValue, ...input])
                        },
                        removeInput(index) {
                            data.currentValue.splice(index, 1);
                            data.inputHandler(data.currentValue);
                        }
                    }
                })
            }
        },
    ];

    crud.view.addField(fieldsToShow);
    crud.edit.addField(fieldsToFill);
    crud.new.addField(fieldsToFill);

    context.addRoute(crud.getRouterConfig());
    context.addRoute(grid.getRouterConfig());

    grid.addColumn([
        {
            title: 'field.email-reports.name',
            key: 'name',
        },
        {
            title: 'field.email',
            key: 'emails',
            render: (h, { item }) => h('span', item.emails.map(({email}) => email).toString())
        }
    ]);

    grid.addFilter([
        {
            filterName: 'field.email-reports.name',
            referenceKey: 'name'
        },
        {
            filterName: 'field.email',
            referenceKey: 'emails.email'
        }
    ]);

    grid.addAction([
        {
            title: 'control.view',
            icon: 'icon-eye',
            onClick: (router, { item }) => {
                router.push({ name: crudViewRoute, params: { id: item.id } });
            },
            renderCondition({ $store }) {
                return havePermission($store.getters['user/allowedRules'], 'email-reports/show');
            }
        },
        {
            title: 'control.edit',
            icon: 'icon-edit',
            onClick: (router, params) => {
                router.push({ name: crudEditRoute, params: { id: params.item.id } });
            },
            renderCondition: ({ $store }) => {
                return havePermission($store.getters['user/allowedRules'], 'email-reports/edit');
            }
        },
        {
            title: 'control.delete',
            actionType: 'error',
            icon: 'icon-trash-2',
            onClick: async (router, params, context) => {
                const emailReportService = new EmailReportService();
                await emailReportService.deleteItem(params.item.id);
                context.tableData = context.tableData.filter(item => item.id !== params.item.id);
                context.$Notify({
                    type: 'success',
                    title: 'Success',
                    message: 'Email Report deleted successfully'
                });
            },
            renderCondition: ({ $store }) => {
                return havePermission($store.getters['user/allowedRules'], 'email-reports/remove');
            }
        }
    ]);

    grid.addPageControls([
        {
            label: 'control.create',
            type: 'primary',
            icon: 'icon-edit',
            onClick: ({ $router }) => {
                $router.push({ name: crudNewRoute });
            },
            renderCondition: ({ $store }) => {
                return havePermission($store.getters['user/allowedRules'], 'email-reports/create');
            }
        }
    ]);

    context.addNavbarEntryDropDown({
        label: 'navigation.email-reports',
        section: 'navigation.dropdown.invoices',
        to: {
            name: 'AmazingCat_EmailReportsModule.crud.email-reports'
        },
        displayCondition: ($store) => {
            return havePermission($store.getters['user/allowedRules'], 'email-reports/list')
        }
    });

    context.addLocalizationData({
        en: require('./locales/en'),
        ru: require('./locales/ru')
    });

    return context;
}
