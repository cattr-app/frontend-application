import { cloneDeep } from 'lodash';
import axios from "@/config/app";
import TimezonePicker from '@/components/TimezonePicker';
import CoreUsersService from '@/service/resource/usersService';
import RoleSelect from '../../components/RoleSelect';
import ProjectRoles from '../../components/ProjectRoles';
import Users from '../../components/Users';
import UsersService from "../../services/usersService";
import Store from "@/store";
import {havePermission} from "@/utils/user";
import LanguageSelector from '../../components/LanguageSelector';

export default (context, router) => {
    const usersContext = cloneDeep(context);
    usersContext.routerPrefix = 'company/users';

    const crud = usersContext.createCrud('users.crud-title', 'users', CoreUsersService);
    const crudViewRoute = crud.view.getViewRouteName();
    const crudEditRoute = crud.edit.getEditRouteName();
    const crudNewRoute = crud.new.getNewRouteName();

    crud.new.addToMetaProperties('permissions', 'users/create', crud.new.getRouterConfig());
    crud.edit.addToMetaProperties('permissions', 'users/edit', crud.edit.getRouterConfig());
    crud.view.addToMetaProperties('permissions', 'users/show', crud.view.getRouterConfig());

    const grid = usersContext.createGrid('users.grid-title', 'users', CoreUsersService);
    grid.addToMetaProperties('permissions', () => Store.getters['user/user'].is_admin === 1, grid.getRouterConfig());

    const fieldsToShow = [
        {
            label: 'ID',
            key: 'id'
        },
        {
            label: 'field.full_name',
            key: 'full_name'
        },
        {
            label: 'field.email',
            key: 'email'
        },
        {
            label: 'field.active',
            key: 'active'
        },
        {
            label: 'field.role',
            key: 'role',
            render: (h, params) => {
                return h('span', params.currentValue.name);
            }
        }
    ];

    const fieldsToFill = [
        {
            key: 'id',
            displayable: false
        },
        {
            label: 'field.full_name',
            key: 'full_name',
            type: 'input',
            placeholder: 'field.full_name',
            required: true
        },
        {
            label: 'field.email',
            key: 'email',
            type: 'input',
            frontendType: 'email',
            required: true
        },
        {
            label: 'field.active',
            key: 'active',
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
            ],
            required: true
        },
        {
            label: 'field.change_password', // TODO Wtf is this field ?!@#
            key: 'change-password',
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
        },
        {
            label: 'field.screenshots_active',
            key: 'screenshots-active',
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
        },
        {
            label: 'field.password',
            key: 'password',
            type: 'input',
            frontendType: 'password',
        },
        {
            label: 'field.manual_time',
            key: 'manual_time',
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
        },
        {
            label: 'field.user_language',
            key: 'user_language',
            render: (h, props) => {
                if (typeof props.currentValue === 'object') {
                    props.currentValue = 'en';
                }

                return h(LanguageSelector, {
                    props: {
                        value: props.currentValue,
                        inputHandler: props.inputHandler
                    }
                })
            }
        },
        {
            label: 'field.screenshots_interval',
            key: 'screenshots_interval',
            type: 'input'
        },
        {
            label: 'field.computer_time_popup',
            key: 'computer_time_popup',
            type: 'input'
        },
        {
            label: 'field.timezone',
            key: 'timezone',
            render: (h, props) => {
                if (typeof props.currentValue === 'object') {
                    props.currentValue = '';
                }
                return h(TimezonePicker, {
                    props: {
                        value: props.currentValue,
                        inputHandler: props.inputHandler
                    }
                });
            }
        },
        {
            label: 'field.send_invite',
            key: 'send_invite',
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
        },
        {
            label: 'field.default_role',
            key: 'role_id',
            render: (h, props) => h(RoleSelect, {
                props: {
                    value: typeof props.currentValue === 'object' ? 0 : props.currentValue,
                    inputHandler: props.inputHandler,
                },
            }),
        },
        {
            label: 'field.project_roles',
            key: '',
            render: h => h(ProjectRoles),
        },
    ];

    crud.view.addField(fieldsToShow);
    crud.edit.addField(fieldsToFill);
    crud.new.addField(fieldsToFill);

    grid.addColumn([
        {
            title: 'field.full_name',
            key: 'full_name'
        },
        {
            title: 'field.email',
            key: 'email'
        }
    ]);

    grid.addFilter([
        {
            referenceKey: 'full_name',
            filterName: 'filter.full_name'
        },
        {
            referenceKey: 'email',
            filterName: 'filter.email'
        }
    ]);

    grid.addAction([
        {
            title: 'control.view',
            icon: 'icon-eye',
            onClick: (router, params) => {
                router.push({ name: crudViewRoute, params: { id: params.item.id } });
            },
            renderCondition({ $store }) {
                return havePermission($store.getters['user/allowedRules'], 'users/show');
            }
        },
        {
            title: 'control.edit',
            icon: 'icon-edit',
            onClick: (router, params) => {
                router.push({ name: crudEditRoute, params: { id: params.item.id } });
            },
            renderCondition({ $store }) {
                return havePermission($store.getters['user/allowedRules'], 'users/edit')
            }
        },
        {
            title: 'control.delete',
            actionType: 'error',
            icon: 'icon-trash-2',
            onClick: async (router, params, context) => {
                const usersService = new UsersService();
                await usersService.deleteItem(params.item.id);
                context.tableData = context.tableData.filter(item => item.id !== params.item.id);
                context.$Notify({
                    type: 'success',
                    title: 'Success',
                    message: 'Task deleted successfully'
                });
            },
            renderCondition({ $store }) {
                return havePermission($store.getters['user/allowedRules'], 'users/remove');
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
            renderCondition({ $store }) {
                return havePermission($store.getters['user/allowedRules'], 'users/edit');
            }
        }
    ]);

    context.addLocalizationData({
        en: require('./locales/en'),
        ru: require('./locales/ru')
    });

    return {
        // Check if this section can be rendered and accessed, this param IS OPTIONAL (true by default)
        // NOTICE: this route will not be added to VueRouter AT ALL if this check fails
        // MUST be a function that returns a boolean
        accessCheck: async () => {
            let user = Store.getters['user/user'];
            if (Object.keys(user).length) {
                return user.is_admin === 1;
            }

            return (await axios.get('/auth/me')).data.user.is_admin === 1;
        },

        scope: 'company',

        component: Users,

        route: {

            // After processing this route will be named as 'settings.exampleSection'
            name: 'users',

            // After processing this route can be accessed via URL 'settings/example'
            path: 'users',

            meta: {
                // After render, this section will be labeled as 'Example Section'
                label: 'navigation.users',

                // Service class to gather the data from API, should be an instance of Resource class
                service: new UsersService(),
            },

            children: [
                {
                    ...grid.getRouterConfig(),
                    path: ''
                },
                ...crud.getRouterConfig(),
            ],
        }
    }
};
