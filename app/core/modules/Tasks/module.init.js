import TasksService from '@/services/resource/task.service';
import PriorityService from '@/services/resource/priority.service';
import ProjectsService from '@/services/resource/project.service';
import UsersService from '@/services/resource/user.service';
import { ModuleLoaderInterceptor } from '@/moduleLoader';
import UserAvatar from '@/components/UserAvatar';
import i18n from '@/i18n';
import { formatDate, formatDurationString } from '@/utils/time';
import { VueEditor } from 'vue2-editor';
import ResourceSelect from '@/components/ResourceSelect';

export const ModuleConfig = {
    routerPrefix: 'tasks',
    loadOrder: 20,
    moduleName: 'Tasks',
};

export function init(context, router) {
    let routes = {};

    ModuleLoaderInterceptor.on('Core', m => {
        m.routes.forEach(route => {
            if (route.name.search('users.view') > 0) {
                routes.usersView = route.name;
            }
        });
    });

    ModuleLoaderInterceptor.on('Projects', m => {
        m.routes.forEach(route => {
            if (route.name.search('view') > 0) {
                routes.projectsView = route.name;
            }
        });
    });

    const crud = context.createCrud('tasks.crud-title', 'tasks', TasksService, {
        with: 'priority, project, users',
    });

    const crudViewRoute = crud.view.getViewRouteName();
    const crudEditRoute = crud.edit.getEditRouteName();
    const crudNewRoute = crud.new.getNewRouteName();

    const navigation = { view: crudViewRoute, edit: crudEditRoute, new: crudNewRoute };

    crud.view.addToMetaProperties('titleCallback', ({ values }) => values.task_name, crud.view.getRouterConfig());
    crud.view.addToMetaProperties('navigation', navigation, crud.view.getRouterConfig());

    crud.new.addToMetaProperties('permissions', 'tasks/create', crud.new.getRouterConfig());
    crud.new.addToMetaProperties('navigation', navigation, crud.new.getRouterConfig());

    crud.edit.addToMetaProperties('permissions', 'tasks/edit', crud.edit.getRouterConfig());

    const grid = context.createGrid('tasks.grid-title', 'tasks', TasksService, {
        with: 'priority, project, users',
        is_active: true,
    });
    grid.addToMetaProperties('navigation', navigation, grid.getRouterConfig());

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

                return h('span', i18n.t(`tasks.priority.${currentValue.name.toLowerCase()}`));
            },
        },
        {
            key: 'user',
            label: 'field.user',
            render: (h, data) => {
                if (!router.app.$store.getters['user/user'].is_admin) {
                    return h('span', data.currentValue.full_name);
                }

                if (data.currentValue && data.currentValue.id) {
                    return h(
                        'router-link',
                        {
                            props: {
                                to: {
                                    name: routes.usersView,
                                    params: { id: data.currentValue.id },
                                },
                            },
                        },
                        data.currentValue.full_name,
                    );
                }

                return h('span', i18n.t('tasks.unassigned'));
            },
        },
        {
            key: 'description',
            label: 'field.description',
            render: (h, props) => {
                if (!props.currentValue) {
                    return;
                }

                return h('div', {
                    class: { 'ql-editor': true },
                    domProps: {
                        innerHTML: props.currentValue,
                    },
                    style: {
                        padding: 0,
                        'overflow-y': 'hidden',
                    },
                });
            },
        },
        {
            key: 'url',
            label: 'field.source',
            render: (h, props) => {
                if (props.currentValue && props.currentValue.length && props.currentValue.toLowerCase() !== 'url') {
                    return h(
                        'a',
                        {
                            attrs: {
                                href: props.currentValue,
                                target: '_blank',
                            },
                        },
                        props.currentValue,
                    );
                } else {
                    return h('span', {}, i18n.t('tasks.source.internal'));
                }
            },
        },
        {
            key: 'created_at',
            label: 'field.created_at',
            render: (h, props) => h('span', formatDate(props.currentValue)),
        },
        {
            key: 'total_spent_time',
            label: 'field.total_spent',
            render: (h, props) => h('span', formatDurationString(props.currentValue)),
        },
        {
            key: 'workers',
            label: 'field.users',
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
                                title: i18n.t('field.user'),
                                render: (h, { item }) => {
                                    if (!router.app.$store.getters['user/user'].is_admin) {
                                        return h('span', item.full_name);
                                    }

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
                                title: i18n.t('field.time'),
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
            render: (h, props) => {
                return h(VueEditor, {
                    props: {
                        useMarkdownShortcuts: true,
                        editorToolbar: [
                            [
                                {
                                    header: [false, 1, 2, 3, 4, 5, 6],
                                },
                            ],
                            ['bold', 'italic', 'underline', 'strike'],
                            [
                                {
                                    list: 'ordered',
                                },
                                {
                                    list: 'bullet',
                                },
                                {
                                    list: 'check',
                                },
                            ],
                            [
                                {
                                    indent: '-1',
                                },
                                {
                                    indent: '+1',
                                },
                            ],
                            [
                                {
                                    color: [],
                                },
                                {
                                    background: [],
                                },
                            ],
                            ['link'],
                            ['clean'],
                        ],
                        value: props.values.description,
                        placeholder: i18n.t('field.description'),
                    },
                    on: {
                        input: function(text) {
                            props.inputHandler(text);
                        },
                    },
                });
            },
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
            render: (h, data) => {
                let value = '';
                if (typeof data.currentValue === 'number' || typeof data.currentValue === 'string') {
                    value = data.currentValue;
                }

                return h(ResourceSelect, {
                    props: {
                        service: new UsersService(),
                        value,
                        clearable: true,
                    },
                    on: {
                        input(value) {
                            data.inputHandler(value);
                        },
                    },
                });
            },
        },
        {
            label: 'field.priority',
            key: 'priority_id',
            render: (h, data) => {
                let value = '';
                if (typeof data.currentValue === 'number' || typeof data.currentValue === 'string') {
                    value = data.currentValue;
                }

                return h(ResourceSelect, {
                    props: {
                        service: new PriorityService(),
                        value,
                        clearable: false,
                    },
                    on: {
                        input(value) {
                            data.inputHandler(value);
                        },
                    },
                });
            },
            required: true,
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

    const makeCellBg = (h, cell, item) => {
        if (typeof item.priority !== 'undefined' && item.priority !== null && item.priority.color !== null) {
            return h('span', {}, [
                cell,
                h(
                    'span',
                    {
                        class: ['at-table__cell-bg'],
                        style: { background: item.priority.color },
                    },
                    [],
                ),
            ]);
        }

        return cell;
    };

    grid.addColumn([
        {
            title: 'field.task',
            key: 'task_name',
            render: (h, { item }) => {
                const classes = ['tasks-grid__task'];
                if (!item.active) {
                    classes.push('tasks-grid__task--inactive');
                }

                const cell = h(
                    'span',
                    {
                        class: classes,
                        attrs: { title: item.task_name },
                    },
                    item.task_name,
                );

                return makeCellBg(h, cell, item);
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

                const cell = h(
                    'span',
                    {
                        class: 'tasks-grid__project',
                        attrs: { title: projectName },
                    },
                    projectName,
                );

                return makeCellBg(h, cell, item);
            },
        },
        {
            title: 'field.user',
            key: 'user',
            render: (h, { item }) => {
                const user = item.user;
                if (!user) {
                    return makeCellBg(h, null, item);
                }

                const cell = h('div', { class: 'flex' }, [
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

                return makeCellBg(h, cell, item);
            },
        },
    ]);

    grid.addToMetaProperties(
        'gridData.actionsFilter',
        (h, cell, { item }) => makeCellBg(h, cell, item),
        grid.getRouterConfig(),
    );

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

    grid.addFilterField([
        {
            key: 'project_id',
            label: 'tasks.projects',
            fieldOptions: { type: 'project-select' },
        },
        {
            key: 'user_id',
            label: 'tasks.users',
            fieldOptions: { type: 'user-select' },
        },
        {
            key: 'active',
            label: 'tasks.status',
            placeholder: 'tasks.statuses.any',
            saveToQuery: true,
            fieldOptions: {
                type: 'select',
                options: [
                    {
                        value: '',
                        label: 'tasks.statuses.any',
                    },
                    {
                        value: '1',
                        label: 'tasks.statuses.open',
                    },
                    {
                        value: '0',
                        label: 'tasks.statuses.closed',
                    },
                ],
            },
        },
    ]);

    grid.addAction([
        {
            title: 'control.view',
            icon: 'icon-eye',
            onClick: (router, { item }, context) => {
                context.onView(item);
            },
            renderCondition({ $store }) {
                // User always can view assigned tasks
                return true;
            },
        },
        {
            title: 'control.edit',
            icon: 'icon-edit',
            onClick: (router, { item }, context) => {
                context.onEdit(item);
            },
            renderCondition: ({ $can }, item) => {
                return $can('update', 'task', item);
            },
        },
        {
            title: 'control.delete',
            actionType: 'error',
            icon: 'icon-trash-2',
            onClick: async (router, { item }, context) => {
                context.onDelete(item);
            },
            renderCondition: ({ $can }, item) => {
                return $can('delete', 'task', item);
            },
        },
    ]);

    grid.addPageControls([
        {
            label: 'control.create',
            type: 'primary',
            icon: 'icon-edit',
            onClick: ({ $router }) => {
                $router.push({ name: crudNewRoute });
            },
            renderCondition: ({ $can }) => {
                return $can('create', 'task');
            },
        },
    ]);

    context.addNavbarEntry({
        label: 'navigation.tasks',
        to: {
            name: 'Tasks.crud.tasks',
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
