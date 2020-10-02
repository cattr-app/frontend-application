<template>
    <div id="app">
        <component :is="config.beforeLayout" />
        <component :is="layout">
            <router-view :key="$route.path"></router-view>
        </component>
    </div>
</template>

<script>
    import * as Sentry from '@sentry/browser';
    import { getLangCookie, setLangCookie } from './i18n';

    export const config = { beforeLayout: null };

    export default {
        name: 'App',
        async beforeMount() {
            const userApi = this.$store.getters['user/apiService'];
            if (userApi.token()) {
                try {
                    this.$loading.show();

                    await userApi.checkApiAuth();
                    await userApi.getAllowedRules();
                    await userApi.getProjectRules();
                    await userApi.getCompanyData();
                    Sentry.setUser({
                        email: this.$store.state.user.user.data.email,
                        full_name: this.$store.state.user.user.data.full_name,
                        id: this.$store.state.user.user.data.id,
                        role: this.$store.state.user.user.data.role.name,
                    });
                } catch (e) {
                    // Whoops
                } finally {
                    this.$loading.hide();
                }
            }
        },
        mounted() {
            if (sessionStorage.getItem('logout')) {
                this.$store.dispatch('user/setLoggedInStatus', null);
                sessionStorage.removeItem('logout');
            }
        },
        methods: {
            setUserLocale() {
                const user = this.$store.getters['user/user'];
                const cookieLang = getLangCookie();
                // Set user locale after auth
                if (user.user_language) {
                    this.$i18n.locale = user.user_language;
                    setLangCookie(user.user_language);
                } else if (cookieLang) {
                    this.$i18n.locale = cookieLang;
                }
            },
        },
        computed: {
            isLoggedIn() {
                // Somehow this is the only place in vue lifecycle which is working as it should be
                // All the other places brake locale in different places
                this.setUserLocale();
                return this.$store.getters['user/loggedIn'];
            },
            layout() {
                return this.$route.meta.layout || 'default-layout';
            },
            config() {
                return config;
            },
        },
        watch: {
            isLoggedIn(status) {
                if (status) {
                    this.$router.push({ path: '/' });
                } else {
                    const reason = this.$store.getters['user/lastLogoutReason'];
                    const message =
                        reason === null ? 'You has been logged out' : `You has been logged out. Reason: ${reason}`;

                    this.$Notify({
                        title: 'Warning',
                        message,
                        type: 'warning',
                    });
                    this.$router.push({ name: 'auth.login' });
                }
            },
        },
    };
</script>

<style lang="scss">
    @import 'sass/app';

    .at-loading-bar {
        &__inner {
            transition: width 0.5s linear;
        }
    }
</style>
