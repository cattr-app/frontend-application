import RedminePriorities from './../../components/RedminePriorities';
import CompanyService from '../../services/companyServices/companyService';
import Store from '@/store';
import i18n from '@/i18n';

export default {
    // Check if this section can be rendered and accessed, this param IS OPTIONAL (true by default)
    // NOTICE: this route will not be added to VueRouter AT ALL if this check fails
    // MUST be a function that returns a boolean
    accessCheck: async () => {
        let companyData = Store.getters['user/companyData'];
        let user = Store.getters['user/user'];

        return user.is_admin === 1 && companyData.redmine_enabled === 1;
    },
    scope: 'company',

    route: {
        // After processing this route will be named as 'settings.exampleSection'
        name: 'redmine',

        // After processing this route can be accessed via URL 'settings/example'
        path: 'redmine',

        meta: {
            // After render, this section will be labeled as 'Example Section'
            label: 'settings.redmine.label',

            // Service class to gather the data from API, should be an instance of Resource class
            service: new CompanyService(),

            // Renderable fields array
            fields: [
                {
                    label: 'settings.redmine.url',
                    key: 'redmine_url',
                    fieldOptions: {
                        placeholder: 'https://redmine.example.com',
                        type: 'input',
                    },
                },
                {
                    label: 'settings.redmine.api_key',
                    key: 'redmine_api_key',
                    fieldOptions: {
                        type: 'input',
                        placeholder: 'settings.redmine.api_key',
                        frontendType: 'password',
                    },
                },
                {
                    label: 'settings.redmine.statuses',
                    key: 'redmine_statuses',
                    fieldOptions: {
                        type: 'listbox',
                        keyField: 'id',
                        labelField: 'name',
                        valueField: 'is_active',
                    },
                    displayable: $store => {
                        const redmineSection = $store.getters['settings/sections'].find(
                            section => section.pathName === 'company.redmine',
                        );

                        return (
                            redmineSection.data.hasOwnProperty('redmine_api_key') &&
                            redmineSection.data.redmine_api_key &&
                            redmineSection.data.redmine_statuses
                        );
                    },
                },
                {
                    label: 'settings.redmine.priorities',
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
                    displayable: $store => {
                        const redmineSection = $store.getters['settings/sections'].find(
                            section => section.pathName === 'company.redmine',
                        );

                        return (
                            redmineSection.data.hasOwnProperty('redmine_api_key') &&
                            redmineSection.data.redmine_api_key &&
                            redmineSection.data.redmine_priorities
                        );
                    },
                },
                {
                    label: 'settings.redmine.sync_time',
                    key: 'redmine_sync',
                    fieldOptions: {
                        type: 'checkbox',
                    },
                    displayable: $store => {
                        const redmineSection = $store.getters['settings/sections'].find(
                            section => section.pathName === 'company.redmine',
                        );
                        return (
                            redmineSection.data.hasOwnProperty('redmine_api_key') && redmineSection.data.redmine_api_key
                        );
                    },
                },
                {
                    label: 'field.notice',
                    displayable: $store => {
                        const redmineSection = $store.getters['settings/sections'].find(
                            section => section.pathName === 'company.redmine',
                        );

                        return (
                            redmineSection.data.redmine_url &&
                            redmineSection.data.redmine_api_key &&
                            (!redmineSection.data.redmine_priorities || !redmineSection.data.redmine_statuses)
                        );
                    },
                    render: h => {
                        return h(
                            'p',
                            {
                                style: {
                                    color: 'red',
                                },
                            },
                            i18n.t('settings.redmine.notice'),
                        );
                    },
                },
            ],
        },
    },
};
