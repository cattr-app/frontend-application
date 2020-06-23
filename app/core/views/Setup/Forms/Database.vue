<template>
    <validation-observer ref="validate">
        <validation-provider v-slot="{ errors }" rules="required" name="Host name">
            <small>Host</small>
            <at-input
                v-model="databaseForm.host_name"
                :status="errors.length > 0 ? 'error' : ''"
                placeholder="Host name"
                type="text"
                :disabled="disabledForm"
            />
            <p>{{ errors[0] }}</p>
        </validation-provider>

        <validation-provider v-slot="{ errors }" rules="required" name="Database Name">
            <small>Database</small>
            <at-input
                v-model="databaseForm.database_name"
                :status="errors.length > 0 ? 'error' : ''"
                placeholder="Database Name"
                type="text"
                :disabled="disabledForm"
            />
            <p>{{ errors[0] }}</p>
        </validation-provider>

        <validation-provider v-slot="{ errors }" rules="required" name="User Name">
            <small>User</small>
            <at-input
                v-model="databaseForm.user_name"
                :status="errors.length > 0 ? 'error' : ''"
                placeholder="User Name"
                type="text"
            />
            <p>{{ errors[0] }}</p>
        </validation-provider>

        <validation-provider v-slot="{ errors }" rules="required" name="Password">
            <small>Password</small>
            <at-input
                v-model="databaseForm.password"
                :status="errors.length > 0 ? 'error' : ''"
                placeholder="Password"
                type="text"
            />
            <p>{{ errors[0] }}</p>
        </validation-provider>
        <div class="status">
            <at-alert v-if="message" class="status__alert" :type="typeStatus" :message="message" show-icon />
            <at-button :disabled="isDisabled" type="info" @click="checkConnection">Connect to database</at-button>
        </div>
    </validation-observer>
</template>

<script>
    import { ValidationObserver, ValidationProvider } from 'vee-validate';
    import ApiService from '@/service/api';
    export default {
        name: 'database',
        components: {
            ValidationProvider,
            ValidationObserver,
        },
        props: {
            storage: {},
        },
        data() {
            return {
                databaseForm: {
                    host_name: '',
                    database_name: '',
                    user_name: '',
                    password: '',
                },
                disabledForm: false,
                status: 'process',
                typeStatus: '',
                message: '',
                isDisabled: true,
                apiService: new ApiService(),
            };
        },
        mounted() {
            console.log(this.storage['database'].databaseParams);
            if (this.storage['database'].hasOwnProperty('databaseParams')) {
                this.databaseForm = this.storage['database'].databaseParams;
                this.$emit('setState', { database: { status: this.status, databaseParams: this.databaseForm } });
            } else {
                this.$emit('setState', { database: { status: this.status } });
            }
        },
        methods: {
            async checkConnection() {
                this.message = this.$t(`setup.header.database.process`);
                this.typeStatus = 'info';
                try {
                    const { data } = await this.apiService.chechConnectionDatabase(this.databaseForm);
                    this.status = 'finish';
                    this.typeStatus = 'success';
                    this.message = this.$t(`setup.header.database.success`);
                } catch ({ response }) {
                    this.status = 'error';
                    this.typeStatus = this.status;
                    this.message = this.$t(`setup.header.database.error`);
                }

                this.$emit('setState', { database: { status: this.status, databaseParams: this.databaseForm } });
            },
        },
        watch: {
            databaseForm: {
                handler() {
                    this.$refs.validate.validate().then(el => {
                        this.isDisabled = !el;
                    });
                },
                deep: true,
            },
        },
    };
</script>

<style lang="scss" scoped>
    .status {
        display: flex;
        justify-content: flex-end;
        margin-top: 16px;
        &__alert {
            margin-right: 10px;
        }
    }
</style>
