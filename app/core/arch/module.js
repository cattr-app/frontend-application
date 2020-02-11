import Grid from './builder/grid';
import Crud from './builder/crud';
import NavbarEntry from './builder/navbar';
import SettingsSection from "./builder/sections";
import isObject from 'lodash/isObject';
import Store from '@/store';

/**
 * Module class. This class represents the context of a module in module.init.js -> init() function.
 */
export default class Module {
    routes = [];
    navEntries = [];
    settingsSections = [];
    companySections = [];
    navEntriesDropdown = {};
    locales = {};

    constructor(routerPrefix, moduleName) {
        this.routerPrefix = routerPrefix;
        this.moduleName = moduleName;
    }

    /**
     * Add locale code to allow custom locale select
     *
     * @param {String} code
     * @param {String} label
     *
     * @returns {Module}
     */
    addLocaleCode(code, label) {
        Store.dispatch('lang/setLang', { code, label });

        return this;
    }

    /**
     * Add module to Vuex store
     *
     * @param {Object} vuexModule
     * @returns {Module}
     */
    registerVuexModule(vuexModule) {
        if (!isObject(vuexModule)) {
            throw new Error("Vuex Module must be an object.");
        }

        Store.registerModule(this.moduleName, vuexModule);
        return this;
    }

    /**
     * Create GRID instance, which can be exported to RouterConfig
     * @param label
     * @param id
     * @param serviceClass
     * @param gridData
     * @param gridRouterPath
     * @returns {Grid}
     */
    createGrid(label, id, serviceClass, gridData = undefined, gridRouterPath = '') {
        const grid = new Grid(label, id, serviceClass, this, gridData, gridRouterPath);
        return grid;
    }

    /**
     * Create CRUD instance, which can be exported to RouterConfig
     *
     * @param label
     * @param id
     * @param serviceClass
     * @param defaultPrefix
     * @param pages
     * @returns {Crud}
     */
    createCrud(label, id, serviceClass, filters, defaultPrefix = '', pages = { edit: true, view: true, new: true }) {
        const crud = new Crud(label, id, serviceClass, filters, this, defaultPrefix, pages);
        return crud;
    }

    /**
     * Add route to module-scoped routerConfig
     *
     * @param routerConfig
     * @returns {Module}
     */
    addRoute(routerConfig) {
        if (Array.isArray(routerConfig)) {
            routerConfig.forEach(p => {
                this.routes.push(p);
            });
        } else {
            this.routes.push(routerConfig);
        }
        return this;
    }

    /**
     * Add navbar entry
     */
    addNavbarEntry() {
        Array.from(arguments).forEach(p => {
            this.navEntries.push(new NavbarEntry(p.label, p.to,
                p.hasOwnProperty('displayCondition') ? p.displayCondition : () => true)
            );
        });
    }

    /**
     * Add navbar Dropdown Entry
     */
    addNavbarEntryDropDown() {
        Array.from(arguments).forEach(p => {
            if (!this.navEntriesDropdown.hasOwnProperty(p.section)) {
                this.navEntriesDropdown[p.section] = [];
            }
            this.navEntriesDropdown[p.section].push(new NavbarEntry(p.label, p.to,
                p.hasOwnProperty('displayCondition') ? p.displayCondition : () => true, p.section)
            );
        });
    }

    /**
     * Create new section with provided params
     */
    addSettingsSection() {
        Array.from(arguments).forEach(({ route, accessCheck, scope, component }) => {
            const { path, name, meta, children } = route;
            const section = new SettingsSection(path, name, meta, accessCheck, scope, component, children);
            this.settingsSections.push(section);
        })
    }

    /**
     * Create new section with provided params
     */
    addCompanySection() {
        Array.from(arguments).forEach(({ route, accessCheck, scope, component }) => {
            const { path, name, meta, children } = route;
            const section = new SettingsSection(path, name, meta, accessCheck, scope, component, children);
            this.companySections.push(section);
        })
    }

    /**
     * Add locales
     */
    addLocalizationData(locales) {
        this.locales = locales;
    }

    /**
     * Init all available sections
     * @returns {Promise<void>[]}
     */
    initSettingsSections() {
        return this.settingsSections.map(s => s.initSection());
    }

    /**
     * Init all available sections
     * @returns {Promise<void>[]}
     */
    initCompanySections() {
        return this.companySections.map(s => s.initSection());
    }

    /**
     * Get all available to fill /settings route children
     * @returns {{path: string, component: null, meta, name: string}[]}
     */
    getSettingSectionsRoutes() {
        return this.settingsSections.map(s => s.getRoute());
    }

    /**
     * Get all available to fill /settings route children
     * @returns {{path: string, component: null, meta, name: string}[]}
     */
    getCompanySectionsRoutes() {
        return this.companySections.map(s => s.getRoute());
    }

    /**
     * Get Navigation bar entries array
     *
     * @returns {Array<Object>}
     */
    getNavbarEntries() {
        return this.navEntries;
    }

    /**
     * Get Navigation Dropdown bar entries array
     *
     * @returns {Array<Object>}
     */
    getNavbarEntriesDropdown() {
        return this.navEntriesDropdown;
    }


    /**
     * Get module-scoped routes for Vue Router
     *
     * @returns {Array<Object>}
     */
    getRoutes() {
        return this.routes;
    }


    /**
     * Get locales
     *
     * @returns {Array}
     */
    getLocalizationData() {
        return this.locales;
    }

    /**
     * Get module name
     *
     * @returns {string}
     */
    getModuleName() {
        return this.moduleName;
    }

    /**
     * Get module route name
     *
     * @returns {string}
     */
    getModuleRouteName() {
        return this.moduleName;
    }

    /**
     * Get router prefix for module-scoped routes
     *
     * @returns {string}
     */
    getRouterPrefix() {
        return this.routerPrefix;
    }
}
