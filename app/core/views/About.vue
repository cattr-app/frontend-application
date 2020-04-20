<template>
    <div class="about content-wrapper">
        <div class="container">
            <div class="at-container">
                <div class="at-container__inner">
                    <div class="row">
                        <div class="col-8 col-offset-8 about__alert-wrapper">
                            <at-alert
                                v-if="updateVersionMsg"
                                type="success"
                                class="about__alert"
                                :message="updateVersionMsg"
                                @on-close="updateVersionMsg = null"
                            />

                            <at-alert
                                v-if="knownVulnerableMsg"
                                type="error"
                                class="about__alert"
                                :message="knownVulnerableMsg"
                                @on-close="knownVulnerableMsg = null"
                            />
                        </div>
                        <!-- /.col-8 -->
                    </div>
                    <!-- /.row -->

                    <div class="about__logo"></div>

                    <h2>Cattr</h2>
                    <p class="about__version">
                        <skeleton :loading="isLoading" width="80px">{{ appData.app_version || 'Undefined' }}</skeleton>
                    </p>
                    <p>
                        Instance ID:
                        <strong
                            ><skeleton :loading="isLoading" width="200px">{{
                                appData.instance_id || 'Undefined'
                            }}</skeleton></strong
                        >
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

    export default {
        name: 'About',
        components: {
            Skeleton,
        },
        async mounted() {
            this.isLoading = true;

            const { data } = await axios.get('about');
            this.appData = data.info;

            if (data.info.known_vulnerable) {
                this.knownVulnerableMsg = `${this.$i18n.t('message.vulnerable_version')} ${data.info.update_version}`;
                return;
            }

            if (data.info.update_version) {
                this.updateVersionMsg = `${this.$i18n.t('message.update_version')} ${data.info.update_version}`;
            }

            this.isLoading = false;
        },
        data() {
            return {
                appData: [],
                knownVulnerableMsg: null,
                updateVersionMsg: null,
                isLoading: false,
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
            display: block;
            height: 120px;
            width: 120px;
            background-image: url('../assets/logo.svg');
            background-size: cover;
            margin-left: auto;
            margin-right: auto;
            margin-bottom: $layout-01;
        }

        &__version {
            color: $gray-3;
            font-weight: bold;
        }

        &__link {
            color: $gray-3;
        }
    }
</style>
