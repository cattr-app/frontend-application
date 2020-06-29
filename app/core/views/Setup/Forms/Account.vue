<template>
    <validation-observer class="account">
        <validation-provider v-slot="{ errors }" rules="required|email" :name="$t('setup.header.account.email')">
            <h6>{{ $t('setup.header.account.email') }}</h6>
            <at-input
                v-model="accountParams.email"
                name="Password"
                :status="errors.length > 0 ? 'error' : ''"
                :placeholder="$t('setup.header.account.email')"
                icon=""
                type="text"
            />
            <p>{{ errors[0] }}</p>
        </validation-provider>

        <validation-provider v-slot="{ errors }" rules="required" :name="$t('setup.header.account.password')">
            <h6>{{ $t('setup.header.account.password') }}</h6>
            <at-input
                v-model="accountParams.password"
                name="Password"
                :status="errors.length > 0 ? 'error' : ''"
                :placeholder="$t('setup.header.account.password')"
                icon=""
                type="text"
            />
            <p>{{ errors[0] }}</p>
        </validation-provider>
    </validation-observer>
</template>

<script>
    import { ValidationObserver, ValidationProvider } from 'vee-validate';

    export default {
        name: 'account',
        components: {
            ValidationProvider,
            ValidationObserver,
        },
        props: {
            storage: {},
        },
        data() {
            return {
                accountParams: {
                    email: '',
                    password: '',
                },
                status: 'process',
            };
        },
        created() {
            if (this.storage['account'].hasOwnProperty('accountParams')) {
                this.accountParams = this.storage['account'].accountParams;
                this.$emit('setState', { account: { status: this.status, accountParams: this.accountParams } });
            } else {
                this.$emit('setState', { account: { status: this.status } });
            }
        },
        watch: {
            accountParams: {
                handler(val) {
                    if (val.email && val.password) {
                        this.$emit('setState', { account: { status: 'finish', accountParams: val } });

                        return;
                    }

                    this.$emit('setState', { account: { status: 'process' } });
                },
                deep: true,
            },
        },
    };
</script>
<style lang="scss" scoped>
    .account {
        width: 50%;
    }
</style>
