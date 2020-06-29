<template>
    <div class="congratulation">
        <div class="congratulation__process">
            <at-timeline v-if="isShowProcess" :pending="isProcess">
                <at-timeline-item v-for="(step, index) in installSteps" :key="index" :color="step.color">
                    <h6>{{ $t(`setup.process.${step.name}`) + ' | ' + step.status }}</h6>
                </at-timeline-item>
            </at-timeline>
        </div>
        <div v-if="!isProcess && !isHideControls" class="congratulation__footer">
            <div class="congratulation__statistic">
                <at-checkbox v-model="permission" @on-change="handlPermission">
                    <small>{{ checkBoxLabel }}</small>
                </at-checkbox>
            </div>
            <at-button type="success" @click="onInstall">{{ $t('setup.buttons.complete') }}</at-button>
        </div>

        <div v-if="isDocker && !isProcess" class="congratulation__information">
            <at-alert
                class="congratulation__title"
                :message="$t('setup.process.important_information')"
                :description="$t('setup.process.info_without_docker')"
                type="warning"
            />
            <div class="congratulation__docker-supervisor">
                <h4>{{ $t('setup.process.title_supervisor') }}</h4>
                <ol>
                    <li>[program:cattr-worker]</li>
                    <li>process_name=%(program_name)s_%(process_num)02d</li>
                    <li>command=php /app/backend/artisan queue:work --sleep=3 --tries=3</li>
                    <li>autostart=true</li>
                    <li>autorestart=true</li>
                    <li>user=www-data</li>
                    <li>numprocs=2</li>
                    <li>redirect_stderr=true</li>
                    <li>stdout_logfile=/app/backend/storage/logs/worker.log</li>
                </ol>
            </div>
            <div class="congratulation__docker-cron">
                <h4>{{ $t('setup.process.title_cron') }}</h4>
                <ol>
                    <li>
                        * * * * * su www-data -c "php /app/backend/artisan schedule:run" -s /bin/sh >> /dev/null 2>&1
                    </li>
                </ol>
            </div>
        </div>

        <div v-if="isHideControls" class="congratulation__run">
            <at-alert
                class="congratulation__title"
                :message="$t('setup.process.status.success')"
                :description="$t('setup.process.end_message')"
                type="success"
            />
            <at-button class="button-success" type="success" @click="$router.push({ name: 'auth.login' })">{{
                $t('setup.process.end_install')
            }}</at-button>
        </div>
    </div>
</template>

<script>
    import ApiService from '@/service/api';

    export default {
        name: 'congratulation',
        props: {
            storage: {},
        },
        data() {
            return {
                status: 'process',
                isProcess: false,
                isShowProcess: false,
                permission: true,
                installSteps: [],
                apiService: new ApiService(),
                checkBoxLabel: this.$t('setup.header.congratulation.get_statistic'),
                isDocker: false,
                isHideControls: false,
            };
        },
        methods: {
            async onInstall() {
                if (this.installSteps.length > 0) {
                    this.installSteps = [];
                }

                this.isShowProcess = true;
                this.isProcess = true;

                name = 'database';
                this.installSteps.push({ name, color: 'blue', status: 'In progress' });
                let recaptchaParams = {};

                if (
                    Object.hasOwnProperty.call(this.storage['recaptcha'], 'enabled_recaptcha') &&
                    this.storage['recaptcha'].enabled_recaptcha
                ) {
                    recaptchaParams = {
                        RECAPTCHA_SITE_KEY: this.storage['recaptcha'].recaptchaParams.site_key,
                        RECAPTCHA_SECRET_KEY: this.storage['recaptcha'].recaptchaParams.secret_key,
                    };
                }
                try {
                    const { data } = await this.apiService.setEnvFile({
                        DB_HOST: this.storage[name].databaseParams.host_name,
                        DB_DATABASE: this.storage[name].databaseParams.database_name,
                        DB_USERNAME: this.storage[name].databaseParams.user_name,
                        DB_PASSWORD: this.storage[name].databaseParams.password,
                        MAIL_FROM_ADDRESS: 'mail@example.com',
                        ...recaptchaParams,
                    });
                    this.installSteps[this.stepNumber].color = 'green';
                    this.installSteps[this.stepNumber].status = 'Done';
                    this.isDocker = data.is_docker;
                } catch ({ response }) {
                    this.installSteps[this.stepNumber].color = 'red';
                    this.installSteps[this.stepNumber].status = 'Error';
                    this.isProcess = false;

                    this.$Notify({
                        title: this.$t(`setup.process.status.title`),
                        message: this.$t(`setup.header.process.status.error`),
                        type: 'error',
                    });

                    return;
                }

                let name = 'account';
                this.installSteps.push({ name, color: 'blue', status: 'In progress' });

                try {
                    await this.apiService.registrationAdmin({
                        ...this.storage[name].accountParams,
                        ...this.storage['company'].companyParams,
                    });
                    this.installSteps[this.stepNumber].color = 'green';
                    this.installSteps[this.stepNumber].status = 'Done';
                } catch (response) {
                    this.installSteps[this.stepNumber].color = 'red';
                    this.installSteps[this.stepNumber].status = 'Error';
                    this.isProcess = false;
                    this.$Notify({
                        title: this.$t(`setup.process.status.title`),
                        message: this.$t(`setup.process.status.error`),
                        type: 'error',
                    });

                    return;
                }

                if (this.permission) {
                    name = 'permission';
                    this.installSteps.push({ name, color: 'blue', status: 'In progress' });
                    try {
                        await this.apiService.registrationInCollector({
                            email: this.storage['account'].accountParams.email,
                        });
                        this.installSteps[this.stepNumber].color = 'green';
                        this.installSteps[this.stepNumber].status = 'Done';
                    } catch ({ resposne }) {
                        this.installSteps[this.stepNumber].color = 'red';
                        this.installSteps[this.stepNumber].status = 'Error';
                        this.isProcess = false;

                        this.$Notify({
                            title: this.$t(`setup.process.status.title`),
                            message: this.$t(`setup.process.status.error`),
                            type: 'error',
                        });

                        return;
                    }
                }
                if (this.isDocker) {
                    this.apiService.setConfig({});
                }

                this.isProcess = false;
                this.isHideControls = true;
                this.$emit('getStatusOfInstalled', this.isHideControls);
                this.$Notify({
                    title: this.$t(`setup.process.status.title`),
                    message: this.$t(`setup.process.status.success`),
                    type: 'success',
                });
            },
            handlPermission(val) {
                this.permission = val;
            },
        },
        computed: {
            stepNumber() {
                return this.installSteps.length - 1;
            },
        },
        mounted() {
            this.$emit('setState', { congratulation: { status: 'process' } });
        },
    };
</script>

<style lang="scss" scoped>
    .congratulation {
        display: flex;
        flex-direction: column;
        width: 70%;
        align-items: center;
        &__process {
            display: flex;
            flex-direction: column;
        }
        &__footer {
            display: flex;
            flex-direction: column;
        }
        &__statistic {
            margin-bottom: $layout-01;
        }
        &__run {
            width: 100%;
            text-align: center;
            .button-success {
                margin-top: 23px;
            }
            .congratulation__title {
                margin: 0px;
            }
        }
        &__title {
            margin: 23px 0;
            padding: 20px;
            &::v-deep {
                .at-alert__message {
                    font-size: 20px;
                }
                .at-alert__description {
                    font-size: 16px;
                }
            }
        }
        &__docker-supervisor,
        &__docker-cron {
            border: solid 1px #d7e4fe;
            background-color: #eff4fe;
            padding: 20px;
            margin: 23px 0;
            h4 {
                color: #3b688c;
                padding-bottom: 1rem;
            }
            li {
                color: #3b688c;
            }
        }
    }
</style>
