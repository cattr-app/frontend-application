import axios from "@/config/app";
import RedminePriorities from '../../components/RedminePriorities';
import RedmineStatuses from '../../components/RedmineStatuses';
import CompanyService from "../../services/companyService";
import Store from "@/store";

export default {

    // Check if this section can be rendered and accessed, this param IS OPTIONAL (true by default)
    // NOTICE: this route will not be added to VueRouter AT ALL if this check fails
    // MUST be a function that returns a boolean
    accessCheck:  async () => {
        let companyData = Store.getters['user/companyData'];
        let user = Store.getters['user/user'];

        if (Object.keys(companyData).length && companyData.hasOwnProperty('redmine_enabled') && Object.keys(user).length) {
            return user.is_admin === 1 && companyData.redmine_enabled === 1;
        }

        return (await axios.get('/auth/me')).data.user.is_admin === 1
            && (await axios.get(`companymanagement/getData`)).data.redmine_enabled === 1;
    },

    scope: 'company',

    route: {
        // After processing this route will be named as 'settings.exampleSection'
        name: 'redmine',

        // After processing this route can be accessed via URL 'settings/example'
        path: 'redmine',

        meta: {
            // After render, this section will be labeled as 'Example Section'
            label: 'Redmine',

            // Service class to gather the data from API, should be an instance of Resource class
            service: new CompanyService(),

            // Renderable fields array
            fields: [
                {
                    label: 'Redmine URL',
                    key: 'redmine_url',
                    fieldOptions: {
                        type: 'input',
                    }
                },
                {
                    label: 'Redmine API Key',
                    key: 'redmine_api_key',
                    fieldOptions: {
                        type: 'input',
                        frontendType: 'password',
                    }
                },
                {
                    label: 'Redmine Active Statuses',
                    key: 'redmine_statuses',
                    fieldOptions: {
                        type: 'listbox',
                        keyField: 'id',
                        labelField: 'name',
                        valueField: 'is_active',
                    },
                },
                {
                    label: 'Redmine Priorities',
                    key: 'redmine_priorities',
                    render: (h, props) => {
                        return h(RedminePriorities, {
                            props: {
                                redminePriorities: Array.isArray(props.currentValue) ? props.currentValue : [],
                                internalPriorities: props.values.internal_priorities,
                                changeHandler: props.inputHandler,
                            },
                        });
                    },
                },
                {
                    label: 'Set Status On Active Task',
                    key: 'redmine_active_status',
                    fieldOptions: {
                        type: 'select',
                        options: ({ values }) => (values.redmine_statuses || [])
                            .map(status => ({ value: status.id, label: status.name })),
                    }
                },
                {
                    label: 'On Items',
                    key: 'redmine_activate_on_statuses',
                    render: (h, props) => {
                        return h(RedmineStatuses, {
                            props: {
                                statuses: props.values.redmine_statuses || [],
                                selected: Array.isArray(props.currentValue) ? props.currentValue : [],
                                changeHandler: props.inputHandler,
                            },
                        });
                    },
                },
                {
                    label: 'Set Status On Inactive Task',
                    key: 'redmine_inactive_status',
                    fieldOptions: {
                        type: 'select',
                        options: ({ values }) => (values.redmine_statuses || [])
                            .map(status => ({ value: status.id, label: status.name })),
                    }
                },
                {
                    label: 'On Items',
                    key: 'redmine_deactivate_on_statuses',
                    render: (h, props) => {
                        return h(RedmineStatuses, {
                            props: {
                                statuses: props.values.redmine_statuses || [],
                                selected: Array.isArray(props.currentValue) ? props.currentValue : [],
                                changeHandler: props.inputHandler,
                            },
                        });
                    },
                },
                {
                    label: 'Enable Redmine Time Sync',
                    key: 'redmine_sync',
                    fieldOptions: {
                        type: 'select',
                        options: [
                            {
                                value: 0,
                                label: 'No'
                            },
                            {
                                value: 1,
                                label: 'Yes'
                            }
                        ],
                    }
                },
                {
                    label: 'Redmine Task Inactivity Timeout (seconds)',
                    key: 'redmine_online_timeout',
                    fieldOptions: {
                        type: 'input',
                        frontendType: 'number',
                    }
                },
            ]
        },
    }
};
