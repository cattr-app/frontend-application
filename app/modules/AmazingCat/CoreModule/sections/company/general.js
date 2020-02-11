import axios from "@/config/app";
import TimezonePicker from "@/components/TimezonePicker";
import CompanyService from "../../services/companyService";
import Store from "@/store";
import i18n from '@/i18n';

export default {

    // Check if this section can be rendered and accessed, this param IS OPTIONAL (true by default)
    // NOTICE: this route will not be added to VueRouter AT ALL if this check fails
    // MUST be a function that returns a boolean
    accessCheck: async () => {
        let user = Store.getters['user/user'];
        if (Object.keys(user).length) {
            return user.is_admin == 1;
        }

        return (await axios.get('/auth/me')).data.user.is_admin == 1;
    },

    scope: 'company',

    route: {

        // After processing this route will be named as 'settings.exampleSection'
        name: 'general',

        // After processing this route can be accessed via URL 'settings/example'
        path: 'general',

        meta: {
            // After render, this section will be labeled as 'Example Section'
            label: 'settings.general',

            // Service class to gather the data from API, should be an instance of Resource class
            service: new CompanyService(),

            // Renderable fields array
            fields: [
                {
                    label: 'settings.company_timezone',
                    key: 'timezone',
                    render: (h, props) => {
                        if (typeof props.currentValue === 'object') {
                            props.currentValue = "";
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
                    label: 'settings.redmine_synchronization',
                    key: 'redmine_enabled',
                    fieldOptions: {
                        type: 'select',
                        options: [
                            {
                                value: 0,
                                label: i18n.t('control.disable')
                            },
                            {
                                value: 1,
                                label: i18n.t('control.enable')
                            }
                        ],
                    }
                },
                {
                    label: 'settings.gitlab_synchronization',
                    key: 'gitlab_enabled',
                    fieldOptions: {
                        type: 'select',
                        options: [
                            {
                                value: 0,
                                label: i18n.t('control.disable')
                            },
                            {
                                value: 1,
                                label: i18n.t('control.enable')
                            }
                        ],
                    }
                },
            ]
        },
    }
};
