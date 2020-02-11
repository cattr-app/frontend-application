<template>
    <div id="app">
        <component :is="layout">
            <router-view :key="$route.path"></router-view>
        </component>
    </div>
</template>

<script>
    import axios, { Cancel } from 'axios';
    import router from './router';

    const cancelExcept = [
        'auth.login',
        'settings',
        'company',
    ];

    let CancelTokenSource = axios.CancelToken.source();
    router.beforeEach((to, from, next) => {
        if (from.name !== null && cancelExcept.indexOf(from.name) === -1) {
            CancelTokenSource.cancel();
            CancelTokenSource = axios.CancelToken.source();
        }

        next();
    });

    export default {
        name: 'App',

        data() {
            return {
                refCount: 0,
                isLoading: false
            };
        },

        async beforeMount() {
            const userApi = this.$store.getters['user/apiService'];

            if (userApi.token()) {
                try {
                    this.$loading.show();
                    await userApi.checkApiAuth();
                    await userApi.getAllowedRules();
                    await userApi.getCompanyData();
                    this.$Loading.finish();
                } catch (e) {
                    // Whoops
                } finally {
                    this.$loading.hide();
                }
            }
        },

        created() {
            axios.interceptors.request.use((config) => {
                if (typeof config.cancelToken === 'undefined') {
                    config.cancelToken = CancelTokenSource.token;
                }
                this.setLoading(true);
                return Promise.resolve(config);
            }, (error) => {
                this.$Loading.error();
                return Promise.reject(error);
            });

            axios.interceptors.response.use((response) => {
                this.setLoading(false);
                return Promise.resolve(response);
            }, (error) => {
                this.setLoading(false);
                if (!axios.isCancel(error) && error.response.status !== 401) {
                    this.$Notify({
                        title: 'Error',
                        message: 'There was an error while processing the request #' + this.refCount + '. ' +
                            'Error message: ' + error.response.data.message + '. See console log for more information',
                        type: 'error',
                        duration: 5000
                    });
                }
                return Promise.reject(error);
            });
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
                // Set user locale after auth
                if (user.user_language) {
                    this.$i18n.locale = user.user_language;
                    localStorage.setItem('language', user.user_language);
                } else if (localStorage.getItem('language')) {
                    this.$i18n.locale = localStorage.getItem('language');
                }
            }
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
            }
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
                    this.$router.push({ name: 'dashboard.timeline' });
                } else {
                    const reason = this.$store.getters['user/lastLogoutReason'];
                    const message = reason === null ?
                        'You has been logged out' :
                        `You has been logged out. Reason: ${reason}`;

                    this.$Notify({
                        title: 'Warning',
                        message,
                        type: 'warning'
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
            }
        }
    };
</script>

<style lang="scss">
    @import "sass/app";

    .at-loading-bar {
        &__inner {
            transition: width .5s linear;
        }
    }
</style>
