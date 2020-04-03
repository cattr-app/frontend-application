import Vue from 'vue';
import Vuex from 'vuex';
import modules from './modules';

Vue.use(Vuex);

const store = new Vuex.Store({
    modules,
    strict: true,
});

for (const moduleName of Object.keys(modules)) {
    if (modules[moduleName].actions.hasOwnProperty('init')) {
        store.dispatch(`${moduleName}/init`);
    }
}

export default store;
