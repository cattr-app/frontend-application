import moment from 'moment';
import 'moment-timezone';
import ProjectService from '../../../core/service/resource/projectService';
import i18n from '../../../core/i18n';
import UserAvatar from '../../../core/components/UserAvatar';
import { havePermission } from '@/utils/user';

export const ModuleConfig = {
    enabled: true,
    routerPrefix: 'projects',
    initOrder: 4
};

function formatDateTime(value, timezone) {
    const date = moment.tz(value, timezone || moment.tz.guess());
    return date.locale(i18n.locale).format('MMMM D, YYYY — HH:mm:ss ([GMT]Z)');
}

export function init(context, router) {
    const crud = context.createCrud('projects.crud-title', 'projects', ProjectService);
    crud.view.addToMetaProperties('titleCallback', ({ values }) => values.name, crud.view.getRouterConfig());

    const crudViewRoute = crud.view.getViewRouteName();
    const crudEditRoute = crud.edit.getEditRouteName();
    const crudNewRoute = crud.new.getNewRouteName();

    crud.new.addToMetaProperties('permissions', 'projects/create', crud.new.getRouterConfig());
    crud.edit.addToMetaProperties('permissions', 'projects/edit', crud.edit.getRouterConfig());

    const grid = context.createGrid('projects.grid-title', 'projects', ProjectService, {
        with: ['users'],
        withCount: ['tasks']
    });

    const fieldsToShow = [
        {
            label: 'field.name',
            key: 'name'
        },
        {
            label: 'field.created_at',
            key: 'created_at',
            render: (h, { currentValue, companyData }) => {
                return h('span', formatDateTime(currentValue, companyData.timezone));
            }
        },
        {
            label: 'field.updated_at',
            key: 'updated_at',
            render: (h, { currentValue, companyData }) => {
                return h('span', formatDateTime(currentValue, companyData.timezone));
            }
        },
        {
            label: 'field.description',
            key: 'description'
        }
    ];

    const fieldsToFill = [
        {
            key: 'id',
            displayable: false
        },
        {
            label: 'field.name',
            key: 'name',
            type: 'text',
            placeholder: 'field.name',
            required: true
        },
        {
            label: 'field.description',
            key: 'description',
            type: 'textarea',
            required: true
        },
        {
            label: 'field.important',
            key: 'important',
            type: 'select',
            options: [
                {
                    value: 0,
                    label: 'control.no'
                },
                {
                    value: 1,
                    label: 'control.yes'
                }
            ]
        }
    ];

    crud.view.addField(fieldsToShow);
    crud.new.addField(fieldsToFill);
    crud.edit.addField(fieldsToFill);

    grid.addColumn([
        {
            title: 'field.project',
            key: 'name'
        },
        {
            title: 'field.team',
            key: 'users',
            render: (h, { item }) => {
                const users = item.users || [];

                return h('div', { class: 'projects-grid__initials-row' }, users.map(user => {
                    return h('AtTooltip', {
                        props: {
                            placement: 'top',
                            content: user.full_name
                        }
                    }, [
                        h(UserAvatar, {
                            props: {
                                user,
                                showTooltip: true
                            }
                        })
                    ])
                }));
            }
        },
        {
            title: 'field.amount_of_tasks',
            key: 'tasks',
            render: (h, { item }) => {
                const amountOfTasks = item.tasks_count || 0;

                return h('span', i18n.tc(
                    'projects.amount_of_tasks',
                    amountOfTasks,
                    {
                        count: amountOfTasks
                    }
                ));
            }
        }
    ]);

    grid.addFilter([
        {
            referenceKey: 'name',
            filterName: 'filter.project'
        }
    ]);


    // TODO when assign users will be ready -- uncomment it
    // const assignRouteName = context.getModuleRouteName() + '.assign';
    // console.log(context);
    // context.addRoute([{
    //     path:  `/${context.routerPrefix}/assign/:id`,
    //     name: assignRouteName,
    //     component: () => import('./views/UsersAssign.vue'),
    //     meta: {
    //         auth: true,
    //     },
    // }]);

    grid.addAction([
        {
            title: 'Assign Users',
            icon: 'icon-user',
            onClick: (router, params) => {
                // TODO uncomment this as well
                // router.push({ name: assignRouteName, params: { id: params.item.id } });
            },
            renderCondition: () => {
                return false; // TODO
            }
        },
        {
            title: 'control.view',
            icon: 'icon-eye',
            onClick: (router, params) => {
                router.push({ name: crudViewRoute, params: { id: params.item.id } });
            },
            renderCondition({ $store }) {
                // User always can view assigned projects
                return true;
            }
        },
        {
            title: 'control.edit',
            icon: 'icon-edit',
            onClick: (router, params) => {
                router.push({ name: crudEditRoute, params: { id: params.item.id } });
            },
            renderCondition: ({ $store }) => {
                return havePermission($store.getters['user/allowedRules'], 'projects/edit');
            }
        },
        {
            title: 'control.delete',
            actionType: 'error', // AT-UI action type,
            icon: 'icon-trash-2',
            onClick: async (router, params, context) => {
                const projectService = new ProjectService();
                await projectService.deleteItem(params.item.id);
                context.tableData = context.tableData.filter(item => item.id !== params.item.id);
                context.$Notify({
                    type: 'success',
                    title: 'Success',
                    message: 'Project deleted successfully'
                });
            },
            renderCondition: ({ $store }) => {
                return havePermission($store.getters['user/allowedRules'], 'projects/remove');
            }
        }
    ]);

    grid.addPageControls([
        {
            label: 'control.create',
            renderCondition: ({ $store }) => {
                return havePermission($store.getters['user/allowedRules'], 'projects/create');
            },
            type: 'primary',
            icon: 'icon-edit',
            onClick: ({ $router }) => {
                $router.push({ name: crudNewRoute });
            }
        }
    ]);

    context.addRoute(crud.getRouterConfig());
    context.addRoute(grid.getRouterConfig());

    context.addNavbarEntry({
        label: 'navigation.projects',
        to: {
            name: 'AmazingCat_ProjectsModule.crud.projects'
        }
    });

    context.addLocalizationData({
        en: require('./locales/en'),
        ru: require('./locales/ru')
    });

    return context;
}
