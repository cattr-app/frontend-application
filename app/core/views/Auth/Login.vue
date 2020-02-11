<template>
    <div class="login row at-row no-gutter">
        <div class="col-8">
            <validation-observer class="box" v-slot="{ invalid }" tag="div" @submit.prevent="submit" ref="observer">
                <div class="top">
                    <div class="static-message">
                        <div class="logo"></div>
                    </div>
                    <h1 class="login__title">Cattr</h1>
                </div>
                <div>
                    <at-alert v-if="error" type="error" class="login__error" closable :message="error" @on-close="error = null" />

                    <validation-provider rules="required|email" mode="passive" v-slot="{ errors }" name="E-mail">
                        <div class="input-group">
                            <small>E-Mail</small>
                            <at-input name="login" v-model="user.email" :status="errors.length > 0 ? 'error' : ''"
                                      placeholder="E-Mail" icon="mail" type="text" required
                                      @keydown.native.enter.prevent="submit"></at-input>
                            <small>{{ errors[0] }}</small>
                        </div>
                        <!-- /.input-group -->
                    </validation-provider>
                    <validation-provider rules="required" mode="passive" v-slot="{ errors }" :name="$t('field.password')">
                        <div class="input-group">
                            <small>{{ $t('field.password') }}</small>
                            <at-input name="password" v-model="user.password" :status="errors.length > 0 ? 'error' : ''"
                                      :placeholder="$t('field.password')" type="password" icon="lock"
                                      required @keydown.native.enter.prevent="submit"></at-input>
                            <small>{{ errors[0] }}</small>
                        </div>
                        <!-- /.input-group -->
                    </validation-provider>
                </div>
                <vue-recaptcha :loadRecaptchaScript="true" :sitekey="recaptchaKey" ref="recaptcha"
                               v-if="recaptchaKey" @verify="onCaptchaVerify" @expired="onCaptchaExpired" class="recaptcha"></vue-recaptcha>
                <at-button class="login__btn" native-type="submit" type="primary" @click="submit">{{ $t('auth.submit') }}</at-button>
                <router-link class="link" to="/auth/password/reset">{{ $t('auth.forgot_password') }}</router-link>
            </validation-observer>
        </div>
        <div class="hero col-16"></div>
    </div>
</template>

<script>
    import axios from 'axios';
    import { ValidationObserver, ValidationProvider } from 'vee-validate';
    import VueRecaptcha from 'vue-recaptcha';

    export default {
        name: 'Login',
        components: {
            ValidationProvider,
            ValidationObserver,
            VueRecaptcha
        },

        data() {
            return {
                user: {
                    email: null,
                    password: null,
                    recaptcha: null
                },
                recaptchaKey: null,
                error: null,
            };
        },

        mounted() {
            if (this.$store.getters['user/isLoggedIn']) {
                this.$router.push({ name: 'index' });
            }
        },

        methods: {
            onCaptchaVerify(response) {
                this.user.recaptcha = response;
            },

            onCaptchaExpired(){
                this.$refs.recaptcha.reset();
            },

            async submit() {
                const valid = await this.$refs.observer.validate();
                if (!valid) {
                    return;
                }

                this.$Loading.start();
                const apiService = this.$store.getters['user/apiService'];

                try {
                    if ('grecaptcha' in window) {
                        this.$refs.recaptcha.reset();
                    }

                    await apiService.attemptLogin(this.user);
                    await apiService.getAllowedRules();
                    await apiService.getCompanyData();

                    this.error = null;
                    this.$Loading.finish();
                } catch (e) {
                    this.$Loading.error();

                    if(e.response.status === 429 && this.recaptchaKey === null){
                        this.recaptchaKey = e.response.data.info.site_key;
                    }

                    let message;

                    if( e.response.status === 401 ) {
                        message = this.$t('auth.message.user_not_found');
                    } else if(e.response.status === 429) {
                        message = this.$t('auth.message.resolve_captcha');
                    } else {
                        message = this.$t('auth.message.auth_error');
                    }

                    this.error = message;
                }
            }
        }
    };
</script>



<style lang="scss" scoped>
    .login {
        width: 100%;
        height: 100vh;
        max-height: 100vh;
        position: relative;
        margin: 0;
        flex-wrap: nowrap;

        &__title {
            text-align: center;
            font-size: 1.8rem;
            color: $black-900;
        }

        &__btn {
            margin-bottom: 1rem;
        }

        &__error {
            overflow: initial;
            margin-bottom: 1rem;
        }

        .box {
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 0 $spacing-08;
            height: 100%;

            .top {
                display: flex;
                flex-flow: column nowrap;
                margin-bottom: $layout-01;

                .static-message {
                    display: flex;
                    flex-flow: column nowrap;
                    align-items: center;

                    .logo {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        width: 60px;
                        height: 60px;
                        text-transform: uppercase;
                        font-weight: bold;
                        font-size: 1.8rem;
                        border-radius: 10px;
                        background: url('../../assets/logo.svg');
                        background-size: cover;
                        color: #ffffff;
                    }
                }
            }

            .recaptcha {
                margin-bottom: 10px;
            }
        }

        .link {
            font-weight: 600;
            color: $blue-1;
            text-align: center;
        }

        .input-group {
            margin-bottom: 0.75rem;
        }

        .hero {
            background: url('../../assets/login.svg');
            background-size: cover;
        }
    }
</style>
