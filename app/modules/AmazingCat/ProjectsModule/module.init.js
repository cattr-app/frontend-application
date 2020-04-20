import moment from 'moment';
import 'moment-timezone';
import ProjectService from '@/service/resource/projectService';
import i18n from '@/i18n';
import UserAvatar from '@/components/UserAvatar';
import { formatDurationString } from '@/utils/time';
import { ModuleLoaderInterceptor } from '@/moduleLoader';

export const ModuleConfig = {
    enabled: true,
    routerPrefix: 'projects',
};

function formatDateTime(value, timezone) {
    const date = moment.tz(value, timezone || moment.tz.guess());
    return date.locale(i18n.locale).format('MMMM D, YYYY — HH:mm:ss ([GMT]Z)');
}

export function init(context, router) {
    let routes = {};

    ModuleLoaderInterceptor.on('AmazingCat_CoreModule', m => {
        m.routes.forEach(route => {
            if (route.name.search('users.view') > 0) {
                routes.usersView = route.name;
            }
        });
    });

    ModuleLoaderInterceptor.on('AmazingCat_TasksModule', m => {
        m.routes.forEach(route => {
            if (route.name.search('view') > 0) {
                routes.tasksView = route.name;
            }
        });
    });

    const crud = context.createCrud('projects.crud-title', 'projects', ProjectService);

    const crudViewRoute = crud.view.getViewRouteName();
    const crudEditRoute = crud.edit.getEditRouteName();
    const crudNewRoute = crud.new.getNewRouteName();

    const navigation = { view: crudViewRoute, edit: crudEditRoute, new: crudNewRoute };

    crud.view.addToMetaProperties('titleCallback', ({ values }) => values.name, crud.view.getRouterConfig());
    crud.view.addToMetaProperties('navigation', navigation, crud.view.getRouterConfig());

    crud.new.addToMetaProperties('permissions', 'projects/create', crud.new.getRouterConfig());
    crud.new.addToMetaProperties('navigation', navigation, crud.new.getRouterConfig());

    crud.edit.addToMetaProperties('permissions', 'projects/edit', crud.edit.getRouterConfig());

    const grid = context.createGrid('projects.grid-title', 'projects', ProjectService, {
        with: ['users'],
        withCount: ['tasks'],
    });

    const fieldsToShow = [
        {
            label: 'field.name',
            key: 'name',
        },
        {
            label: 'field.created_at',
            key: 'created_at',
            render: (h, { currentValue, companyData }) => {
                return h('span', formatDateTime(currentValue, companyData.timezone));
            },
        },
        {
            label: 'field.updated_at',
            key: 'updated_at',
            render: (h, { currentValue, companyData }) => {
                return h('span', formatDateTime(currentValue, companyData.timezone));
            },
        },
        {
            label: 'field.description',
            key: 'description',
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
                                title: 'Task Name',
                                render: (h, { item }) => {
                                    return h(
                                        'router-link',
                                        {
                                            props: {
                                                to: {
                                                    name: routes.tasksView,
                                                    params: { id: item.task_id },
                                                },
                                            },
                                        },
                                        item.task_name,
                                    );
                                },
                            },
                            {
                                key: 'time',
                                title: 'Time',
                                render(h, { item }) {
                                    return h('div', {
                                        domProps: {
                                            textContent: !item ? '0h 0m' : item.time,
                                        },
                                        styles: {
                                            'white-space': 'nowrap',
                                        },
                                    });
                                },
                            },
                        ],
                        data,
                        pagination: true,
                        'page-size': 100,
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
            label: 'field.name',
            key: 'name',
            type: 'text',
            placeholder: 'field.name',
            required: true,
        },
        {
            label: 'field.description',
            key: 'description',
            type: 'textarea',
            required: true,
            placeholder: 'field.description',
        },
        {
            label: 'field.important',
            tooltipValue: 'tooltip.task_important',
            key: 'important',
            type: 'checkbox',
            default: 0,
        },
    ];

    crud.view.addField(fieldsToShow);
    crud.new.addField(fieldsToFill);
    crud.edit.addField(fieldsToFill);

    grid.addColumn([
        {
            title: 'field.project',
            key: 'name',
        },
        {
            title: 'field.team',
            key: 'users',
            render: (h, { item }) => {
                const users = item.users || [];

                return h(
                    'div',
                    { class: 'projects-grid__initials-row' },
                    users.map(user => {
                        return h(
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
                        );
                    }),
                );
            },
        },
        {
            title: 'field.amount_of_tasks',
            key: 'tasks',
            render: (h, { item }) => {
                const amountOfTasks = item.tasks_count || 0;

                return h(
                    'span',
                    i18n.tc('projects.amount_of_tasks', amountOfTasks, {
                        count: amountOfTasks,
                    }),
                );
            },
        },
    ]);

    grid.addFilter([
        {
            referenceKey: 'name',
            filterName: 'filter.fields.project_name',
        },
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
            },
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
            },
        },
        {
            title: 'control.edit',
            icon: 'icon-edit',
            onClick: (router, params) => {
                router.push({ name: crudEditRoute, params: { id: params.item.id } });
            },
            renderCondition: ({ $store }, item) => {
                return $store.getters['user/can']('projects/edit', item.id);
            },
        },
        {
            title: 'control.delete',
            actionType: 'error', // AT-UI action type,
            icon: 'icon-trash-2',
            onClick: async (router, params, context) => {
                const res = await context.$CustomModal({
                    title: 'Delete this Project?',
                    content: 'After deletion this project cannot be restored',
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
                    const projectService = new ProjectService();
                    await projectService.deleteItem(params.item.id);
                    context.tableData = context.tableData.filter(item => item.id !== params.item.id);
                    context.$Notify({
                        type: 'success',
                        title: 'Success',
                        message: 'Project deleted successfully',
                    });
                }
            },
            renderCondition: ({ $store }, item) => {
                return $store.getters['user/can']('projects/remove', item.id);
            },
        },
    ]);

    grid.addPageControls([
        {
            label: 'control.create',
            renderCondition: ({ $store }) => {
                return $store.getters['user/can']('projects/create');
            },
            type: 'primary',
            icon: 'icon-edit',
            onClick: ({ $router }) => {
                $router.push({ name: crudNewRoute });
            },
        },
    ]);

    context.addRoute(crud.getRouterConfig());
    context.addRoute(grid.getRouterConfig());

    context.addNavbarEntry({
        label: 'navigation.projects',
        to: {
            name: 'AmazingCat_ProjectsModule.crud.projects',
        },
    });

    context.addLocalizationData({
        en: require('./locales/en'),
        ru: require('./locales/ru'),
    });

    return context;
}
