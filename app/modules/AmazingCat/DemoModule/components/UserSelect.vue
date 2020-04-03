<template>
    <div class="input-group">
        <p v-t="'demo.auth_message'"></p>

        <at-select v-model="userIndex">
            <at-option
                v-for="(credential, index) in credentials"
                :key="credential.user"
                :value="index"
                v-html="credential.user"
            />
        </at-select>
    </div>
</template>

<script>
    import { DEMO_CREDENTIALS } from '_app/etc/demo.credentials';

    export default {
        name: 'UserSelect',

        data() {
            return {
                credentials: DEMO_CREDENTIALS,
                userIndex: null,
            };
        },

        computed: {
            user() {
                return this.credentials[this.userIndex];
            },
        },

        mounted() {
            this.userIndex = 0;
        },

        watch: {
            userIndex(value) {
                this.$emit('change', this.user);
            },
        },
    };
</script>

<style lang="scss" scoped>
    .input-group p {
        text-align: center;
    }
</style>
