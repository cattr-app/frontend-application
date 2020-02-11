import AccountService from "../services/accountService";
import Store from '@/store';
import LanguageSelector from '../components/LanguageSelector';

export default {

    // Check if this section can be rendered and accessed, this param IS OPTIONAL (true by default)
    // NOTICE: this route will not be added to VueRouter AT ALL if this check fails
    // MUST be a function that returns a boolean
    accessCheck: () => {
        // if something return something
        return true;
    },

    route: {
        // After processing this route will be named as 'settings.exampleSection'
        name: 'account',

        // After processing this route can be accessed via URL 'settings/example'
        path: 'account',

        meta: {
            // After render, this section will be labeled as 'Example Section'
            label: 'settings.account',

            // Service class to gather the data from API, should be an instance of Resource class
            service: new AccountService(),

            // Renderable fields array
            fields: [
                {
                    key: 'id',
                    displayable: false
                },
                {
                    key: 'active',
                    displayable: false
                },
                {
                    label: 'field.full_name',
                    key: 'full_name',
                    fieldOptions: {
                        placeholder: 'John Snow',
                        type: 'input',
                    }
                },
                {
                    label: 'E-Mail',
                    key: 'email',
                    fieldOptions: {
                        fckAutocomplete: true,
                        type: 'input',
                        placeholder: 'user@email.com',
                        frontendType: 'email'
                    }
                },
                {
                    label: 'field.password',
                    key: 'password',
                    fieldOptions: {
                        type: 'input',
                        fckAutocomplete: true,
                        placeholder: '******',
                        frontendType: 'password'
                    }
                },
                // Please use ISO locales for values ISO 639-1
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
            ]
        },
    }
};
