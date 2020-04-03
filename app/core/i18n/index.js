import Vue from 'vue';
import VueI18n from 'vue-i18n';
import { getModuleList, ModuleLoaderInterceptor } from '../moduleLoader';
import merge from 'lodash/merge';
import veeValidateEn from 'vee-validate/dist/locale/en.json';
import veeValidateRu from 'vee-validate/dist/locale/ru.json';

export function getLangCookie() {
    const v = document.cookie.match('(^|;) ?lang=([^;]*)(;|$)');
    return v ? v[2] : null;
}

// Set root domain cookie, ex: *.cattr.app
export function setLangCookie(lang) {
    const rootDomain = location.hostname
        .split('.')
        .reverse()
        .splice(0, 2)
        .reverse()
        .join('.');
    document.cookie = 'lang=' + lang + '; domain=' + rootDomain;
}

// Get the browser language
export function getUserLang() {
    return typeof navigator.language !== 'undefined' && navigator.language.length
        ? navigator.language.substring(0, 2).toLowerCase()
        : 'en';
}

Vue.use(VueI18n);

let messages = {
    en: require('./locales/en'),
    ru: require('./locales/ru'),
};

ModuleLoaderInterceptor.on('loaded', () => {
    const modules = Object.values(getModuleList()).map(i => {
        return i.moduleInstance;
    });

    modules.forEach(m => {
        const moduleMessages = m.getLocalizationData();
        merge(messages, moduleMessages);
    });
});

merge(messages, {
    en: {
        validation: veeValidateEn.messages,
    },
    ru: {
        validation: veeValidateRu.messages,
    },
});

const i18n = new VueI18n({
    locale: getLangCookie() || getUserLang(),
    fallbackLocale: 'en',
    silentFallbackWarn: true,
    messages,
});

export default i18n;
