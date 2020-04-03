import GitlabService from '../services/gitlabService';
import Store from '@/store';

export default {
    // Check if this section can be rendered and accessed, this param IS OPTIONAL (true by default)
    // NOTICE: this route will not be added to VueRouter AT ALL if this check fails
    // MUST be a function that returns a boolean
    accessCheck: async () => Store.getters['user/companyData'].gitlab_enabled === 1,

    route: {
        // After processing this route will be named as 'settings.exampleSection'
        name: 'gitlab',

        // After processing this route can be accessed via URL 'settings/example'
        path: 'gitlab',

        meta: {
            // After render, this section will be labeled as 'Example Section'
            label: 'settings.gitlab.label',

            // Service class to gather the data from API, should be an instance of Resource class
            service: new GitlabService(),

            // Renderable fields array
            fields: [
                {
                    label: 'settings.gitlab.api_key',
                    key: 'apikey',
                    fieldOptions: {
                        type: 'text',
                        disableAutocomplete: false,
                    },
                },
            ],
        },
    },
};
