import * as app from '@/App';
import * as screenshot from '@/components/Screenshot';
import * as screenshotModal from '@/components/ScreenshotModal';
import * as login from '@/views/Auth/Login';
import * as account from '../CoreModule/sections/account';
import * as users from '../CoreModule/sections/company/users';
import Timer from './components/Timer';
import UserSelect from './components/UserSelect';

/**
 * ModuleConfig - used as module configuration section to manipulate module loading settings
 * @type {{routerPrefix: string, loadOrder: number, enabled: boolean}}
 */
export const ModuleConfig = {
    enabled: true,
    routerPrefix: 'demo',
    loadOrder: 1,
};

/**
 * Module init function.
 *
 * @param context
 * @param router
 * @returns {context}
 */
export function init(context, router) {
    app.config.beforeLayout = Timer;

    // Replace form on the login page with a demo user select
    login.config.authInput = UserSelect;

    // Remove email and password fields in the account section
    const accountFieldsToDelete = ['email', 'password'];
    account.config.fieldsProvider = () =>
        account.fieldsProvider().filter(field => accountFieldsToDelete.indexOf(field.key) === -1);

    // Remove email and password fields on the user edit page
    const usersFieldsToDelete = ['email', 'change-password', 'password'];
    users.config.fieldsToFillProvider = () =>
        users.fieldsToFillProvider().filter(field => usersFieldsToDelete.indexOf(field.key) === -1);

    // Modify screenshot paths
    screenshot.config.thumbnailPathProvider = screenshot => `uploads/screenshots/thumbs/${screenshot.id}`;
    screenshotModal.config.screenshotPathProvider = screenshot => `uploads/screenshots/${screenshot.id}`;

    context.addLocalizationData({
        en: require('./locales/en'),
        ru: require('./locales/ru'),
    });

    return context;
}
