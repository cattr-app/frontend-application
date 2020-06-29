<template>
    <div class="recaptcha">
        <at-switch size="large" class="switch-custom" :value="isEnabledRecaptcha" @change="handlStatusRecaptcha">
            <span slot="checkedText">{{ $t('setup.buttons.checked') }}</span>
            <span slot="unCheckedText">{{ $t('setup.buttons.unchecked') }}</span>
        </at-switch>
        <validation-observer v-if="isEnabledRecaptcha">
            <validation-provider v-slot="{ errors }" rules="required" name="Site key">
                <h6>Site Key</h6>
                <at-input
                    v-model="recaptchaParams.site_key"
                    :status="errors.length > 0 ? 'error' : ''"
                    placeholder="Site key"
                    type="text"
                />
                <p>{{ errors[0] }}</p>
            </validation-provider>

            <validation-provider v-slot="{ errors }" rules="required" name="Secret key">
                <h6>Secret Key</h6>
                <at-input
                    v-model="recaptchaParams.secret_key"
                    :status="errors.length > 0 ? 'error' : ''"
                    placeholder="Secret key"
                    type="text"
                />
                <p>{{ errors[0] }}</p>
            </validation-provider>
        </validation-observer>
    </div>
</template>

<script>
    import { ValidationObserver, ValidationProvider } from 'vee-validate';

    export default {
        name: 'recaptcha',
        components: { ValidationObserver, ValidationProvider },
        props: {
            storage: {},
        },
        data() {
            return {
                status: 'process',
                isEnabledRecaptcha: false,
                recaptchaParams: {
                    site_key: '',
                    secret_key: '',
                },
            };
        },
        created() {
            if (this.storage['recaptcha'].hasOwnProperty('recaptchaParams')) {
                this.recaptchaParams = this.storage['recaptcha'].recaptchaParams;
                this.isEnabledRecaptcha = true;
                this.$emit('setState', {
                    recaptcha: {
                        status: this.status,
                        recaptchaParams: this.recaptchaParams,
                        enabled_recaptcha: this.isEnabledRecaptcha,
                    },
                });
            } else if (
                this.storage['recaptcha'].hasOwnProperty('enabled_recaptcha') &&
                this.storage['recaptcha'].enabled_recaptcha
            ) {
                this.$emit('setState', {
                    recaptcha: {
                        status: this.status,
                        enabled_recaptcha: this.storage['recaptcha'].enabled_recaptcha,
                    },
                });
            } else {
                this.$emit('setState', { recaptcha: { status: this.isEnabledRecaptcha ? this.status : 'finish' } });
            }
        },
        methods: {
            handlStatusRecaptcha(val) {
                this.isEnabledRecaptcha = val;
            },
        },
        watch: {
            isEnabledRecaptcha(val) {
                if (!val) {
                    this.status = 'finish';
                }

                this.$emit('setState', {
                    recaptcha: { status: val ? 'process' : this.status },
                });
            },
            recaptchaParams: {
                handler(val) {
                    if (val.site_key && val.secret_key) {
                        this.$emit('setState', {
                            recaptcha: {
                                status: 'finish',
                                recaptchaParams: val,
                                enabled_recaptcha: this.isEnabledRecaptcha,
                            },
                        });
                        return;
                    }

                    this.$emit('setState', { recaptcha: { status: 'process' } });
                },
                deep: true,
            },
        },
    };
</script>

<style lang="scss" scodep>
    .recaptcha {
        display: flex;
        flex-direction: column;
        width: 50%;
    }
    .switch-custom {
        display: flex;
        max-width: 120px;
        margin-bottom: 16px;
        align-self: center;
    }
</style>
