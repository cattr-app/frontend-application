<template>
    <validation-observer>
        <validation-provider v-slot="{ errors }" rules="required">
            <small>Email</small>
            <at-input
                v-model="email"
                name="Password"
                :status="errors.length > 0 ? 'error' : ''"
                placeholder="Email"
                icon=""
                type="text"
            />
        </validation-provider>

        <validation-provider v-slot="{ errors }" rules="required">
            <small>Password</small>
            <at-input
                v-model="password"
                name="Password"
                :status="errors.length > 0 ? 'error' : ''"
                placeholder="Password"
                icon=""
                type="text"
            />
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
        data() {
            return {
                email: '',
                password: '',
                status: 'process',
            };
        },
        computed: {},
        methods: {},
    };
</script>

<style></style>
