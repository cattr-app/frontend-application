import path from 'path';
import Module from './arch/module';
import EventEmitter from 'events';
import kebabCase from 'lodash/kebabCase';
import isObject from 'lodash/isObject';
import sortBy from 'lodash/sortBy';
import moduleRequire from '_app/generated/module.require';

export const moduleFilter = moduleName => true;
export const config = { moduleFilter };

let moduleCfg;
if (process.env.NODE_ENV === 'development') {
    moduleCfg = require('_app/etc/modules.dev.json');
} else {
    moduleCfg = require('_app/etc/modules.config.json');
}

export const ModuleLoaderInterceptor = new EventEmitter();

const modules = {};

export function localModuleLoader(router) {
    const requireModule = require.context('_modules', true, /module.init.js$/);
    let moduleInitQueue = [];

    requireModule.keys().forEach(fn => {
        const pathData = fn.split('/');
        const moduleVendor = pathData[1];
        const moduleName = pathData[2];
        const fullModuleName = `${moduleVendor}_${moduleName}`;

        const md = requireModule(fn);
        const moduleInitData = md.ModuleConfig || { enabled: true };

        const moduleEnabled =
            (typeof moduleInitData.enabled !== 'undefined' ? moduleInitData.enabled : true) &&
            (moduleCfg.hasOwnProperty(fullModuleName)
                ? isObject(moduleCfg[fullModuleName])
                    ? (moduleCfg[fullModuleName].hasOwnProperty('type')
                          ? moduleCfg[fullModuleName].type === 'local'
                          : true) &&
                      (moduleCfg[fullModuleName].hasOwnProperty('enabled')
                          ? moduleCfg[fullModuleName].enabled
                          : true) &&
                      (moduleCfg[fullModuleName].hasOwnProperty('ref')
                          ? moduleCfg[fullModuleName].ref === fullModuleName
                          : true)
                    : true
                : true);

        if (moduleEnabled) {
            moduleInitQueue.push({
                module: md,
                order: moduleInitData.hasOwnProperty('loadOrder') ? moduleInitData.loadOrder : 999,
                moduleInitData,
                fullModuleName,
                fn,
            });
        }
    });

    // Require package modules
    if (moduleRequire.length > 0) {
        moduleRequire.forEach(requireFn => {
            const md = requireFn();

            if (!md.hasOwnProperty('ModuleConfig')) {
                throw new Error(
                    `Vendor module can not be initialized. All vendor modules must export ModuleConfig object property.`,
                );
            }

            if (!md.hasOwnProperty('init')) {
                throw new Error(
                    `Vendor module can not be initialized. All vendor modules must export init function property`,
                );
            }

            const moduleConfig = md.ModuleConfig;
            if (!moduleConfig.hasOwnProperty('moduleName')) {
                throw new Error(
                    `Vendor module can not be initialized. All vendor modules must have a name matching the pattern Vendor_ModuleName`,
                );
            }

            moduleInitQueue.push({
                module: md,
                order: moduleConfig.hasOwnProperty('loadOrder') ? moduleConfig.loadOrder : 999,
                moduleInitData: moduleConfig,
                fullModuleName: moduleConfig.moduleName,
            });
        });
    }

    // Sort modules load order
    moduleInitQueue = sortBy(moduleInitQueue, 'order');

    // Initializing modules sync
    moduleInitQueue.forEach(({ module, moduleInitData, fullModuleName, fn = undefined }) => {
        if (!config.moduleFilter(fullModuleName)) {
            return;
        }

        if (process.env.NODE_ENV === 'development') {
            console.log(`Initializing module ${fullModuleName}...`);
        }

        const moduleInstance = module.init(
            new Module(moduleInitData.routerPrefix || kebabCase(fullModuleName), fullModuleName),
            router,
        );

        if (typeof moduleInstance === 'undefined') {
            throw new Error(
                `Error while initializing module ${fullModuleName}: the context must be returned from init() method`,
            );
        }

        modules[fullModuleName] = {
            path: typeof fn !== 'undefined' ? path.resolve(__dirname, '..', 'modules', fn) : 'NODE_PACKAGE',
            moduleInstance: moduleInstance,
        };

        if (process.env.NODE_ENV === 'development') {
            console.info(`${fullModuleName} has been initialized`);
        }
    });

    if (process.env.NODE_ENV === 'development') {
        console.log("All modules has been initialized successfully. You can run 'system.getModuleList()'");

        window.system.getModuleList = getModuleList;
    }

    Object.keys(modules).forEach(m => {
        const mdInstance = modules[m].moduleInstance;
        ModuleLoaderInterceptor.emit(m, mdInstance);
        modules[m].moduleInstance = mdInstance;
        router.addRoutes([...modules[m].moduleInstance.getRoutes()]);
    });

    // All modules loaded successfully
    ModuleLoaderInterceptor.emit('loaded', router);

    return modules;
}

export function getModuleList() {
    return modules;
}
