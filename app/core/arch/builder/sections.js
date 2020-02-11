import Store from '../../store';

/**
 * Section class - create new section with provided params
 *
 * @param path string - section route path
 * @param name string - section route name
 * @param meta - section route meta with described fields, service etc
 * @param accessCheck - function to check if user has access to work with section content
 */
export default class SettingsSection {

    path = '';
    name = '';
    meta = {};
    component = null;
    children = [];
    accessCheck = null;
    section = {};
    scope = 'settings';

    nameDelimiter = '.';
    pathDelimiter = '/';

    constructor(path, name, meta, accessCheck = () => true, scope = 'settings', component = null, children = []) {
        this.path = this.pathDelimiter + scope + this.pathDelimiter + path;
        this.name = scope + this.nameDelimiter + name;
        this.meta = meta;
        this.component = component || (() => import( /* webpackChunkName: "settings" */ '@/views/Settings/DynamicSettings.vue'));
        this.children = children;
        this.accessCheck = accessCheck;
        this.scope = scope;

        this.section = {
            path: this.path,
            name: this.name,
            meta: this.meta,
            component: this.component,
            children: this.children,
            accessCheck: this.accessCheck,
            scope: this.scope,
        }
    }

    /**
     * Init new section in store
     * @returns {Promise<void>}
     */
    async initSection() {
        await Store.dispatch('settings/setSettingSection', this.section);
    }

    /**
     * Get section route, used to create settings child route
     * @returns {{path: string, component: null, meta, name: string}}
     */
    getRoute() {
        return {
            path: this.path,
            name: this.name,
            meta: this.meta,
            component: this.component,
            children: this.children,
        };
    }
}
