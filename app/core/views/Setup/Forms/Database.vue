<template>
    <validation-observer ref="validate" class="database" v-on:keyup.enter="checkConnection">
        <validation-provider v-slot="{ errors }" rules="required" :name="$t(`setup.header.database.host`)">
            <h6>{{ $t(`setup.header.database.host`) }}</h6>
            <at-input
                v-model="databaseForm.host_name"
                :status="errors.length > 0 ? 'error' : ''"
                :placeholder="$t(`setup.header.database.host`)"
                type="text"
                :disabled="isDisabledInputs"
            />
            <p>{{ errors[0] }}</p>
        </validation-provider>

        <validation-provider v-slot="{ errors }" rules="required" :name="$t(`setup.header.database.database`)">
            <h6>{{ $t(`setup.header.database.database`) }}</h6>
            <at-input
                v-model="databaseForm.database_name"
                :status="errors.length > 0 ? 'error' : ''"
                :placeholder="$t(`setup.header.database.database`)"
                type="text"
                :disabled="isDisabledInputs"
            />
            <p>{{ errors[0] }}</p>
        </validation-provider>

        <validation-provider v-slot="{ errors }" rules="required" :name="$t(`setup.header.database.username`)">
            <h6>{{ $t(`setup.header.database.username`) }}</h6>
            <at-input
                v-model="databaseForm.user_name"
                :status="errors.length > 0 ? 'error' : ''"
                :placeholder="$t(`setup.header.database.username`)"
                type="text"
                :disabled="isDisabledInputs"
            />
            <p>{{ errors[0] }}</p>
        </validation-provider>

        <validation-provider v-slot="{ errors }" rules="required" :name="$t(`setup.header.database.password`)">
            <h6>{{ $t(`setup.header.database.password`) }}</h6>
            <at-input
                v-model="databaseForm.password"
                :status="errors.length > 0 ? 'error' : ''"
                :placeholder="$t(`setup.header.database.password`)"
                type="text"
                :disabled="isDisabledInputs"
            />
            <p>{{ errors[0] }}</p>
        </validation-provider>

        <div class="status">
            <at-alert v-if="message" class="status__alert" :type="typeStatus" :message="message" show-icon />
            <at-button :disabled="isDisabled" type="info" @click="checkConnection">{{
                $t('setup.buttons.connect')
            }}</at-button>
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
                typeStatus: 'info',
                message: '',
                isDisabled: true,
                apiService: new ApiService(),
                isDisabledInputs: false,
            };
        },
        created() {
            if (this.storage['database'].hasOwnProperty('databaseParams')) {
                this.databaseForm = this.storage['database'].databaseParams;
                this.$emit('setState', { database: { status: this.status, databaseParams: this.databaseForm } });
            } else {
                this.$emit('setState', { database: { status: this.status } });
            }
        },
        methods: {
            async checkConnection() {
                if (this.isDisabled) {
                    return;
                }

                this.message = this.$t(`setup.header.database.process`);
                try {
                    const { data } = await this.apiService.checkConnectionDatabase(this.databaseForm);
                    this.status = 'finish';
                    this.typeStatus = 'success';
                    this.message = this.$t(`setup.header.database.success`);
                    this.isDisabledInputs = true;
                } catch ({ response }) {
                    this.status = 'error';
                    this.typeStatus = this.status;
                    this.message = this.$t(`setup.header.database.error`);
                }

                this.$emit('setState', { database: { status: this.status, databaseParams: this.databaseForm } });
            },
            getStatus() {
                return this.status === 'finish' ? 'success' : this.status;
            },
        },
        watch: {
            databaseForm: {
                handler(val) {
                    if ('validate' in this.$refs) {
                        this.$refs.validate.validate().then(el => {
                            this.isDisabled = !el;
                        });
                    }
                },
                deep: true,
            },
        },
    };
</script>

<style lang="scss" scoped>
    .database {
        display: flex;
        flex-direction: column;
        width: 50%;
    }
    .status {
        display: flex;
        justify-content: flex-end;
        margin-top: 16px;
        &__alert {
            margin-right: 10px;
            min-width: 150px;
        }
    }
</style>
