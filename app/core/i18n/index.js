import Vue from 'vue';
import VueI18n from 'vue-i18n';
import { getModuleList, ModuleLoaderInterceptor } from '../moduleLoader';
import _ from 'lodash';
import veeValidateEn from 'vee-validate/dist/locale/en.json';
import veeValidateRu from 'vee-validate/dist/locale/ru.json';

Vue.use(VueI18n);

let messages = {
    en: require('./locales/en'),
    ru: require('./locales/ru')
};

ModuleLoaderInterceptor.on('loaded', () => {
    const modules = Object.values(getModuleList()).map(i => {
        return i.moduleInstance;
    });

    modules.forEach(m => {
        const moduleMessages = m.getLocalizationData();
        _.merge(messages, moduleMessages);
    });
});

_.merge(messages, {
    en: {
        validation: veeValidateEn.messages
    },
    ru: {
        validation: veeValidateRu.messages
    }
});

const i18n = new VueI18n({
    locale: localStorage.getItem('language'),
    fallbackLocale: 'en',
    silentFallbackWarn: true,
    messages
});

export default i18n;
