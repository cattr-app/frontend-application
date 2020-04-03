<template>
    <div id="app">
        <component :is="config.beforeLayout" />
        <component :is="layout">
            <router-view :key="$route.path"></router-view>
        </component>
    </div>
</template>

<script>
    import axios, { Cancel } from 'axios';
    import router from './router';
    import has from 'lodash/has';
    import * as Sentry from '@sentry/browser';
    import { getLangCookie, setLangCookie } from './i18n';

    export const config = { beforeLayout: null };

    const cancelExcept = ['auth.login', 'settings', 'company', 'dashboard'];

    let CancelTokenSource = axios.CancelToken.source();
    router.beforeEach((to, from, next) => {
        if (from.name !== null && cancelExcept.indexOf(from.name) === -1) {
            CancelTokenSource.cancel('Page switch');
            CancelTokenSource = axios.CancelToken.source();
        }

        next();
    });

    export default {
        name: 'App',

        data() {
            return {
                refCount: 0,
                isLoading: false,
            };
        },

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
                    this.$Loading.finish();
                } catch (e) {
                    // Whoops
                } finally {
                    this.$loading.hide();
                }
            }
        },

        created() {
            axios.interceptors.request.use(
                config => {
                    if (typeof config.cancelToken === 'undefined') {
                        config.cancelToken = CancelTokenSource.token;
                    }
                    this.setLoading(true);
                    return Promise.resolve(config);
                },
                error => {
                    this.$Loading.error();
                    return Promise.reject(error);
                },
            );

            axios.interceptors.response.use(
                response => {
                    this.setLoading(false);
                    return Promise.resolve(response);
                },
                error => {
                    this.setLoading(false);

                    if (
                        !axios.isCancel(error) &&
                        (!has(error, 'response.status') || error.response.status !== 401) &&
                        (!has(error, 'response.status') || error.response.status !== 503)
                    ) {
                        this.$Notify({
                            title: 'Error',
                            message: has(error, 'response.data.message')
                                ? error.response.data.message
                                : 'Internal server error',
                            type: 'error',
                            duration: 5000,
                        });
                    } else if (error.response.status === 503) {
                        this.$store.dispatch('forceUserExit', 'Data reset');
                    }
                    return Promise.reject(error);
                },
            );
        },

        mounted() {
            if (sessionStorage.getItem('logout')) {
                this.$store.dispatch('user/setLoggedInStatus', null);
                sessionStorage.removeItem('logout');
            }
        },

        methods: {
            setLoading(isLoading) {
                if (isLoading) {
                    this.refCount++;
                } else if (this.refCount > 0) {
                    this.refCount--;
                }
            },
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
            refCount(val) {
                if (val > 0) {
                    this.$set(this, 'isLoading', true);
                } else {
                    setTimeout(() => {
                        if (this.refCount <= 0) {
                            this.$set(this, 'isLoading', false);
                        }
                    }, 500);
                }
            },

            isLoggedIn(status) {
                if (status) {
                    this.$router.push({ name: 'dashboard' });
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

            isLoading(status, oldStatus) {
                if (status) {
                    this.$nextTick(() => {
                        this.$Loading.start();
                    });
                } else {
                    this.$nextTick(() => {
                        this.$Loading.finish();
                    });
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
