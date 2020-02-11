import axios from "@/config/app";
import CompanyService from "../../services/companyService";
import Store from "@/store";

export default {

    // Check if this section can be rendered and accessed, this param IS OPTIONAL (true by default)
    // NOTICE: this route will not be added to VueRouter AT ALL if this check fails
    // MUST be a function that returns a boolean
    accessCheck: async () => {
        let companyData = Store.getters['user/companyData'];
        let user = Store.getters['user/user'];

        if (Object.keys(companyData).length && companyData.hasOwnProperty('gitlab_enabled') && Object.keys(user).length) {
            return user.is_admin === 1 && companyData.gitlab_enabled === 1;
        }

        return (await axios.get('/auth/me')).data.user.is_admin === 1
            && (await axios.get(`companymanagement/getData`)).data.gitlab_enabled === 1;
    },

    scope: 'company',

    route: {
        // After processing this route will be named as 'settings.exampleSection'
        name: 'gitlab',

        // After processing this route can be accessed via URL 'settings/example'
        path: 'gitlab',

        meta: {
            // After render, this section will be labeled as 'Example Section'
            label: 'Gitlab',

            // Service class to gather the data from API, should be an instance of Resource class
            service: new CompanyService(),

            // Renderable fields array
            fields: [
                {
                    label: 'Gitlab URL',
                    key: 'gitlab_url',
                    fieldOptions: {
                        type: 'input',
                    }
                },
            ]
        },
    }
};
