import './config/app';

import { localModuleLoader } from './moduleLoader';
import './settings';

import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import AtComponents from '@amazingcat/at-ui';
import Dialog from 'vue-dialog-loading';
import DatePicker from 'vue2-datepicker';
import moment from 'vue-moment';
import VueAuthImage from 'vue-auth-image';
import * as Sentry from '@sentry/browser';
import * as Integrations from '@sentry/integrations';
import i18n from './i18n';
import VueLazyload from 'vue-lazyload';
import * as screenshot from '@/components/Screenshot';
import * as screenshotModal from '@/components/ScreenshotModal';
import env from '_app/etc/env';
import './plugins/vee-validate';
import './plugins/sentry';
import './policies';
import Gate from './plugins/gate';

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
Vue.use(Gate);

installGlobalComponents(Vue);

if (process.env.NODE_ENV === 'development') {
    window.system = {};
}

localModuleLoader(router);

if (process.env.VUE_APP_GET_SCREENSHOTS_BY_ID) {
    // Modify screenshot paths
    screenshot.config.thumbnailPathProvider = screenshot => `uploads/screenshots/thumbs/${screenshot.id}`;
    screenshotModal.config.screenshotPathProvider = screenshot => `uploads/screenshots/${screenshot.id}`;
}

const app = new Vue({
    router,
    store,
    i18n,
    render: h => h(App),
}).$mount('#app');

export default app;
