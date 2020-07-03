<template>
    <div class="about content-wrapper">
        <div class="container">
            <div class="at-container">
                <div class="at-container__inner">
                    <div class="row">
                        <div class="col-8 col-offset-8 about__alert-wrapper">
                            <at-alert
                                v-if="updateVersionMsg"
                                :message="updateVersionMsg"
                                class="about__alert"
                                type="success"
                            />

                            <at-alert
                                v-if="knownVulnerableMsg"
                                :message="knownVulnerableMsg"
                                class="about__alert"
                                type="error"
                            />

                            <at-alert v-if="infoMsg" :message="infoMsg" class="about__alert" type="info" />
                        </div>
                        <!-- /.col-8 -->
                    </div>
                    <!-- /.row -->

                    <div class="about__logo"></div>

                    <h2>Cattr</h2>
                    <p class="about__version">
                        <skeleton :loading="isLoading" width="80px">{{ appData.version || 'Undefined' }}</skeleton>
                    </p>
                    <p>
                        Instance ID:
                        <strong>
                            <skeleton :loading="isLoading" width="200px"
                                >{{ appData.instance_id || 'Undefined' }}
                            </skeleton>
                        </strong>
                    </p>
                    <p v-if="modulesData.length" class="about__table">
                        <at-table :columns="modulesColumns" :data="modulesData" />
                    </p>

                    <div><a class="about__link" href="https://cattr.app">cattr.app</a></div>
                    <div><a class="about__link" href="https://community.cattr.app">community</a></div>
                </div>
                <!-- /.at-container__inner -->
            </div>
            <!-- /.at-container -->
        </div>
        <!-- /.container -->
    </div>
    <!-- /.content-wrapper -->
</template>

<script>
    import axios from 'axios';
    import { Skeleton } from 'vue-loading-skeleton';
    import semverGt from 'semver/functions/gt';

    export default {
        name: 'About',
        components: {
            Skeleton,
        },
        async mounted() {
            this.isLoading = true;
            try {
                const { data } = await axios.get('about');
                this.appData = data.app;
                this.modulesData = data.modules;

                if (data.app.vulnerable) {
                    this.knownVulnerableMsg = `${this.$i18n.t('message.vulnerable_version')} ${data.app.last_version}`;
                } else if (data.app.last_version && data.app.last_version !== data.app.version) {
                    if (semverGt(data.app.last_version, data.app.version)) {
                        this.updateVersionMsg = `${this.$i18n.t('message.update_version')} ${data.app.last_version}`;
                    } else {
                        this.infoMsg = data.app.message;
                    }
                }
            } catch ({ response }) {
                if (process.env.NODE_ENV === 'development') {
                    console.warn(response ? response : 'request to about is canceled');
                }
            }

            this.isLoading = false;
        },
        data() {
            return {
                appData: {},
                modulesData: [],
                knownVulnerableMsg: null,
                updateVersionMsg: null,
                isLoading: false,
                infoMsg: null,
                modulesColumns: [
                    { title: this.$i18n.t('about.modules.name'), key: 'name' },
                    { title: this.$i18n.t('about.modules.version'), key: 'version' },
                    {
                        title: this.$i18n.t('about.modules.status'),
                        render: (h, params) =>
                            h('AtAlert', {
                                props: {
                                    message: semverGt(params.item.version, params.item.lastVersion)
                                        ? params.item.flashMessage
                                        : params.item.version === params.item.lastVersion
                                        ? this.$i18n.t('about.modules.ok')
                                        : params.item.vulnerable
                                        ? this.$i18n.t('about.modules.vulnerable')
                                        : this.$i18n.t('about.modules.outdated'),
                                    type: semverGt(params.item.version, params.item.lastVersion)
                                        ? 'info'
                                        : params.item.version === params.item.lastVersion
                                        ? 'success'
                                        : params.item.vulnerable
                                        ? 'error'
                                        : 'warning',
                                },
                                style: {
                                    'text-align': 'center',
                                    padding: '4px 8px 4px 16px',
                                },
                            }),
                    },
                ],
            };
        },
    };
</script>

<style lang="scss" scoped>
    .about {
        text-align: center;

        p {
            margin-bottom: $layout-01;
        }

        &__alert-wrapper {
            margin-bottom: $layout-01;
        }

        &__alert {
            margin-bottom: $layout-01;
        }

        &__logo {
            background-image: url('../assets/logo.svg');
            background-size: cover;
            display: block;
            height: 120px;
            margin-bottom: $layout-01;
            margin-left: auto;
            margin-right: auto;
            width: 120px;
        }

        &__version {
            color: $gray-3;
            font-weight: bold;
        }

        &__link {
            color: $gray-3;
        }

        &__table {
            display: flex;
            justify-content: center;

            & > .at-table {
                width: 50%;
            }
        }
    }
</style>
