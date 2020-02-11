import TasksService from '@/service/resource/tasksService';
import ProjectsService from '../../../core/service/resource/projectService';
import UsersService from '../../../core/service/resource/usersService';
import { ModuleLoaderInterceptor } from '@/moduleLoader';
import UserAvatar from '../../../core/components/UserAvatar';
import i18n from '@/i18n';
import { havePermission } from '@/utils/user';

export const ModuleConfig = {
    enabled: true,
    routerPrefix: 'tasks'
};

export function init(context, router) {

    let routes = {};

    ModuleLoaderInterceptor.on('AmazingCat_UsersModule', m => {
        m.routes.forEach(route => {
            if (route.name.search('view') > 0) {
                routes.usersView = route.name;
            }
        });
    });

    ModuleLoaderInterceptor.on('AmazingCat_ProjectsModule', m => {
        m.routes.forEach(route => {
            if (route.name.search('view') > 0) {
                routes.projectsView = route.name;
            }
        });
    });

    const crud = context.createCrud('tasks.crud-title', 'tasks', TasksService, { with: 'priority, project, user' });
    crud.view.addToMetaProperties('titleCallback', ({ values }) => values.task_name, crud.view.getRouterConfig());

    const crudViewRoute = crud.view.getViewRouteName();
    const crudEditRoute = crud.edit.getEditRouteName();
    const crudNewRoute = crud.new.getNewRouteName();

    crud.new.addToMetaProperties('permissions', 'tasks/create', crud.new.getRouterConfig());
    crud.edit.addToMetaProperties('permissions', 'tasks/edit', crud.edit.getRouterConfig());

    const grid = context.createGrid('tasks.grid-title', 'tasks', TasksService, { with: 'priority, project, user' });

    const fieldsToShow = [
        {
            key: 'active',
            label: 'field.active',
            render: (h, { currentValue }) => {
                return h('span', currentValue ? i18n.t('control.yes') : i18n.t('control.no'));
            }
        },
        {
            key: 'project',
            label: 'field.project',
            render: (h, { currentValue }) => {
                return h('router-link', {
                    props: {
                        to: { name: routes.projectsView, params: { id: currentValue.id } }
                    }
                }, currentValue.name);
            }
        },
        {
            key: 'priority',
            label: 'field.priority',
            render: (h, { currentValue }) => {
                if (!currentValue) {
                    return null;
                }

                return h('span', currentValue.name);
            }
        },
        {
            key: 'user',
            label: 'field.user',
            render: (h, { currentValue }) => {
                return h('router-link', {
                    props: {
                        to: {
                            name: routes.usersView, params: { id: currentValue.id }
                        }
                    }
                }, currentValue.full_name);
            }
        },
        {
            key: 'description',
            label: 'field.description'
        },
    ];

    const fieldsToFill = [
        {
            key: 'id',
            displayable: false
        },
        {
            label: 'field.project',
            key: 'project_id',
            type: 'resource-select',
            service: new ProjectsService(),
            required: true
        },
        {
            label: 'field.task_name',
            key: 'task_name',
            type: 'input',
            required: true
        },
        {
            label: 'field.description',
            key: 'description',
            type: 'textarea'
        },
        {
            label: 'field.important',
            key: 'important',
            type: 'checkbox',
            initialValue: false,
        },
        {
            label: 'field.user',
            key: 'user_id',
            type: 'resource-select',
            service: new UsersService(),
            required: true
        },
        {
            label: 'field.priority',
            key: 'priority_id',
            type: 'select',
            options: [
                {
                    value: 1,
                    label: 'Low'
                },
                {
                    value: 2,
                    label: 'Normal'
                },
                {
                    value: 3,
                    label: 'High'
                }
            ],
            initialValue: 2,
            required: true
        },
        {
            label: 'field.active',
            key: 'active',
            type: 'checkbox',
            initialValue: true,
        }
    ];

    crud.view.addField(fieldsToShow);
    crud.edit.addField(fieldsToFill);
    crud.new.addField(fieldsToFill);

    grid.addColumn([
        {
            title: 'field.task',
            key: 'task_name',
            render: (h, { item }) => {
                const classes = ['tasks-grid__task'];
                if (!item.active) {
                    classes.push('tasks-grid__task--inactive');
                }

                return h('span', {
                    class: classes,
                    attrs: { title: item.task_name },
                }, item.task_name);
            },
        },
        {
            title: 'field.project',
            key: 'project',
            render: (h, { item }) => {
                let projectName = '';

                if (typeof item.project !== 'undefined' && item.project !== null) {
                    projectName = item.project.name;
                }

                return h('span', {
                    class: 'tasks-grid__project',
                    attrs: { title: projectName },
                }, projectName);
            }
        },
        {
            title: 'field.user',
            key: 'user',
            render: (h, { item }) => {
                const user = item.user;
                if (!user) {
                    return null;
                }

                return h('div', {class: 'flex'}, [
                    h('AtTooltip', {
                        props: {
                            placement: 'top',
                            content: user.full_name
                        }
                    }, 
                    [
                        h(UserAvatar, {
                            props: {
                                user,
                                showTooltip: true
                            }
                        })
                    ])
                ]);
            }
        },
    ]);

    grid.addFilter([
        {
            filterName: 'filter.tasks.name',
            referenceKey: 'task_name'
        },
        {
            filterName: 'filter.tasks.project_name',
            referenceKey: 'project.name'
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
                // User always can view assigned tasks
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
                return havePermission($store.getters['user/allowedRules'], 'tasks/edit');
            }
        },
        {
            title: 'control.delete',
            actionType: 'error',
            icon: 'icon-trash-2',
            onClick: async (router, params, context) => {
                const taskService = new TasksService();
                await taskService.deleteItem(params.item.id);
                context.tableData = context.tableData.filter(item => item.id !== params.item.id);
                context.$Notify({
                    type: 'success',
                    title: 'Success',
                    message: 'Task deleted successfully'
                });
            },
            renderCondition: ({ $store }) => {
                return havePermission($store.getters['user/allowedRules'], 'tasks/remove');
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
                return havePermission($store.getters['user/allowedRules'], 'tasks/create');
            }
        }
    ]);

    context.addNavbarEntry({
        label: 'navigation.tasks',
        to: {
            name: 'AmazingCat_TasksModule.crud.tasks'
        }
    });

    context.addLocalizationData({
        en: require('./locales/en'),
        ru: require('./locales/ru')
    });

    context.addRoute(crud.getRouterConfig());
    context.addRoute(grid.getRouterConfig());
    return context;
}
