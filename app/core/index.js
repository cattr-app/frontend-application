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
import moment from 'vue-moment';
import VueAuthImage from 'vue-auth-image';
import * as Sentry from '@sentry/browser';
import * as Integrations from '@sentry/integrations';
import i18n from './i18n';
import './vee-validate';
import VueLazyload from 'vue-lazyload';

if (
    process.env.NODE_ENV !== 'development' &&
    'VUE_APP_SENTRY_DSN' in process.env &&
    process.env.VUE_APP_SENTRY_DSN !== 'undefined'
) {
    Sentry.init({
        release: process.env.VUE_APP_VERSION,
        environment: process.env.NODE_ENV,
        dsn: process.env.VUE_APP_SENTRY_DSN,
        integrations: [
            new Integrations.Vue({
                Vue,
                attachProps: true,
            }),
        ],
    });
}

//Global components
import installGlobalComponents from './global-extension';

Vue.config.productionTip = false;

Vue.use(AtComponents);
Vue.use(moment);
Vue.use(Dialog);
Vue.use(DatePicker);
Vue.use(VueAuthImage);
Vue.use(VueLazyload, {
    lazyComponent: true,
});

installGlobalComponents(Vue);

if (process.env.NODE_ENV === 'development') {
    window.system = {};
}

localModuleLoader(router);

const app = new Vue({
    router,
    store,
    i18n,
    render: h => h(App),
}).$mount('#app');

export default app;
