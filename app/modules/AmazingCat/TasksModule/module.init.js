import TasksService from '@/service/resource/tasksService';
import ProjectsService from '@/service/resource/projectService';
import UsersService from '@/service/resource/usersService';
import { ModuleLoaderInterceptor } from '@/moduleLoader';
import UserAvatar from '@/components/UserAvatar';
import i18n from '@/i18n';
import { formatDurationString } from '@/utils/time';

export const ModuleConfig = {
    enabled: true,
    routerPrefix: 'tasks',
};

export function init(context, router) {
    let routes = {};

    ModuleLoaderInterceptor.on('AmazingCat_CoreModule', m => {
        m.routes.forEach(route => {
            if (route.name.search('users.view') > 0) {
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

    const crud = context.createCrud('tasks.crud-title', 'tasks', TasksService, {
        with: 'priority, project, user',
    });

    crud.view.addToMetaProperties('titleCallback', ({ values }) => values.task_name, crud.view.getRouterConfig());

    const crudViewRoute = crud.view.getViewRouteName();
    const crudEditRoute = crud.edit.getEditRouteName();
    const crudNewRoute = crud.new.getNewRouteName();

    crud.new.addToMetaProperties('permissions', 'tasks/create', crud.new.getRouterConfig());
    crud.edit.addToMetaProperties('permissions', 'tasks/edit', crud.edit.getRouterConfig());

    const grid = context.createGrid('tasks.grid-title', 'tasks', TasksService, {
        with: 'priority, project, user',
        is_active: true,
    });

    const fieldsToShow = [
        {
            key: 'active',
            label: 'field.active',
            render: (h, { currentValue }) => {
                return h('span', currentValue ? i18n.t('control.yes') : i18n.t('control.no'));
            },
        },
        {
            key: 'project',
            label: 'field.project',
            render: (h, { currentValue }) => {
                return h(
                    'router-link',
                    {
                        props: {
                            to: {
                                name: routes.projectsView,
                                params: { id: currentValue.id },
                            },
                        },
                    },
                    currentValue.name,
                );
            },
        },
        {
            key: 'priority',
            label: 'field.priority',
            render: (h, { currentValue }) => {
                if (!currentValue) {
                    return null;
                }

                return h('span', currentValue.name);
            },
        },
        {
            key: 'user',
            label: 'field.user',
            render: (h, { currentValue }) => {
                return h(
                    'router-link',
                    {
                        props: {
                            to: {
                                name: routes.usersView,
                                params: { id: currentValue.id },
                            },
                        },
                    },
                    currentValue.full_name,
                );
            },
        },
        {
            key: 'description',
            label: 'field.description',
        },
        {
            key: 'total_spent_time',
            label: 'field.total_spent',
            render: (h, props) => h('span', formatDurationString(props.currentValue)),
        },
        {
            key: 'workers',
            label: 'field.workers',
            render: (h, props) => {
                const data = [];
                Object.keys(props.currentValue).forEach(k => {
                    props.currentValue[k].time = formatDurationString(+props.currentValue[k].duration);
                    data.push(props.currentValue[k]);
                });
                return h('AtTable', {
                    props: {
                        columns: [
                            {
                                title: 'User',
                                render: (h, { item }) => {
                                    return h(
                                        'router-link',
                                        {
                                            props: {
                                                to: {
                                                    name: routes.usersView,
                                                    params: { id: item.user_id },
                                                },
                                            },
                                        },
                                        item.full_name,
                                    );
                                },
                            },
                            {
                                key: 'time',
                                title: 'Time',
                            },
                        ],
                        data,
                    },
                });
            },
        },
    ];

    const fieldsToFill = [
        {
            key: 'id',
            displayable: false,
        },
        {
            label: 'field.project',
            key: 'project_id',
            type: 'resource-select',
            service: new ProjectsService(),
            required: true,
        },
        {
            label: 'field.task_name',
            key: 'task_name',
            type: 'input',
            required: true,
            placeholder: 'field.name',
        },
        {
            label: 'field.description',
            key: 'description',
            type: 'textarea',
            placeholder: 'field.description',
        },
        {
            label: 'field.important',
            tooltipValue: 'tooltip.task_important',
            key: 'important',
            type: 'checkbox',
            initialValue: false,
        },
        {
            label: 'field.user',
            key: 'user_id',
            type: 'resource-select',
            service: new UsersService(),
            required: true,
            default: ({ getters }) => getters['user/user'].id,
        },
        {
            label: 'field.priority',
            key: 'priority_id',
            type: 'select',
            options: [
                {
                    value: 1,
                    label: 'Low',
                },
                {
                    value: 2,
                    label: 'Normal',
                },
                {
                    value: 3,
                    label: 'High',
                },
            ],
            initialValue: 2,
            required: true,
            default: 2,
        },
        {
            label: 'field.active',
            key: 'active',
            type: 'checkbox',
            initialValue: true,
            default: 1,
        },
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

                return h(
                    'span',
                    {
                        class: classes,
                        attrs: { title: item.task_name },
                    },
                    item.task_name,
                );
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

                return h(
                    'span',
                    {
                        class: 'tasks-grid__project',
                        attrs: { title: projectName },
                    },
                    projectName,
                );
            },
        },
        {
            title: 'field.user',
            key: 'user',
            render: (h, { item }) => {
                const user = item.user;
                if (!user) {
                    return null;
                }

                return h('div', { class: 'flex' }, [
                    h(
                        'AtTooltip',
                        {
                            props: {
                                placement: 'top',
                                content: user.full_name,
                            },
                        },
                        [
                            h(UserAvatar, {
                                props: {
                                    user,
                                    showTooltip: true,
                                },
                            }),
                        ],
                    ),
                ]);
            },
        },
    ]);

    grid.addFilter([
        {
            filterName: 'filter.fields.task_name',
            referenceKey: 'task_name',
        },
        {
            filterName: 'filter.fields.project_name',
            referenceKey: 'project.name',
        },
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
            },
        },
        {
            title: 'control.edit',
            icon: 'icon-edit',
            onClick: (router, params) => {
                router.push({ name: crudEditRoute, params: { id: params.item.id } });
            },
            renderCondition: ({ $store }, item) => {
                const userCan = $store.getters['user/can']('tasks/edit', item.project_id);
                const fromIntegration = typeof item.integration !== 'undefined';

                return userCan && !fromIntegration;
            },
        },
        {
            title: 'control.delete',
            actionType: 'error',
            icon: 'icon-trash-2',
            onClick: async (router, params, context) => {
                const res = await context.$CustomModal({
                    title: 'Delete this Task?',
                    content: 'After deletion this task cannot be restored',
                    okText: 'Delete',
                    cancelText: 'Cancel',
                    showClose: false,
                    styles: {
                        'border-radius': '10px',
                        'text-align': 'center',
                        footer: {
                            'text-align': 'center',
                        },
                        header: {
                            padding: '16px 35px 4px 35px',
                            color: 'red',
                        },
                        body: {
                            padding: '16px 35px 4px 35px',
                        },
                    },
                    width: 320,
                    type: 'trash',
                    typeButton: 'error',
                });

                if (res === 'confirm') {
                    const taskService = new TasksService();
                    await taskService.deleteItem(params.item.id);
                    context.tableData = context.tableData.filter(item => item.id !== params.item.id);
                    context.$Notify({
                        type: 'success',
                        title: 'Success',
                        message: 'Task deleted successfully',
                    });
                }
            },
            renderCondition: ({ $store }, item) => {
                const userCan = $store.getters['user/can']('tasks/remove', item.project_id);
                const fromIntegration = typeof item.integration !== 'undefined';

                return userCan && !fromIntegration;
            },
        },
    ]);

    grid.addPageControls([
        {
            key: 'isActive',
            frontedType: 'checkbox',
            label: 'control.show_active',
            onChange: data => {
                if (data.values.isActive) {
                    data.$set(data.queryParams, 'active', ['=', data.values.isActive]);
                } else {
                    data.$delete(data.queryParams, 'active');
                }

                data.fetchData();
            },
            renderCondition: ({ $store }) => {
                return $store.getters['user/canInAnyProject']('tasks/create');
            },
        },
        {
            label: 'control.create',
            type: 'primary',
            icon: 'icon-edit',
            onClick: ({ $router }) => {
                $router.push({ name: crudNewRoute });
            },
            renderCondition: ({ $store }) => {
                return $store.getters['user/canInAnyProject']('tasks/create');
            },
        },
    ]);

    context.addNavbarEntry({
        label: 'navigation.tasks',
        to: {
            name: 'AmazingCat_TasksModule.crud.tasks',
        },
    });

    context.addLocalizationData({
        en: require('./locales/en'),
        ru: require('./locales/ru'),
    });

    context.addRoute(crud.getRouterConfig());
    context.addRoute(grid.getRouterConfig());
    return context;
}
