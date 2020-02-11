import RedmineService from "../services/redmineService";
import axios from "@/config/app";
import Store from "@/store";

export default {

    // Check if this section can be rendered and accessed, this param IS OPTIONAL (true by default)
    // NOTICE: this route will not be added to VueRouter AT ALL if this check fails
    // MUST be a function that returns a boolean
    accessCheck:  async () => {
        let companyData = Store.getters['user/companyData'];

        if (Object.keys(companyData).length && companyData.hasOwnProperty('redmine_enabled')) {
            return companyData.redmine_enabled === 1;
        }

        return (await axios.get(`companymanagement/getData`)).data.redmine_enabled === 1;
    },

    route: {
        // After processing this route will be named as 'settings.exampleSection'
        name: 'redmine',

        // After processing this route can be accessed via URL 'settings/example'
        path: 'redmine',

        meta: {
            // After render, this section will be labeled as 'Example Section'
            label: 'Redmine Integration',

            // Service class to gather the data from API, should be an instance of Resource class
            service: new RedmineService(),

            // Renderable fields array
            fields: [
                {
                    label: 'Redmine API Key',
                    key: 'redmine_api_key',
                    fieldOptions: {
                        type: 'input',
                        fckAutocomplete: true
                    }
                },
            ]
        },
    }
};
