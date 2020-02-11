import './config/app';

import { localModuleLoader } from './moduleLoader';
import './settings';

import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import AtComponents from 'at-ui';
import Dialog from 'vue-dialog-loading';
import DatePicker from 'vue2-datepicker';
import i18n from './i18n';
import './vee-validate';

import axios from 'axios';
import moment from 'vue-moment';

// Layouts
import DefaultLayout from './layouts/DefaultLayout';
import AuthLayout from './layouts/AuthLayout';

Vue.component('default-layout', DefaultLayout);
Vue.component('auth-layout', AuthLayout);

Vue.config.productionTip = false;

Vue.use(AtComponents);
Vue.use(moment);
Vue.use(Dialog);
Vue.use(DatePicker);

Vue.prototype.$http = axios;

if (process.env.NODE_ENV === 'development') {
    window.system = {};
}

localModuleLoader(router);

const app = new Vue({
    router,
    store,
    i18n,
    render: h => h(App)
}).$mount('#app');

export default app;

