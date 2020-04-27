<template>
    <div class="screenshots">
        <h1 class="page-title">{{ $t('navigation.screenshots') }}</h1>
        <div class="controls-row">
            <div class="controls-row__item">
                <Calendar :sessionStorageKey="sessionStorageKey" @change="onCalendarChange" />
            </div>
            <div class="controls-row__item">
                <UserSelect @change="onUsersChange"></UserSelect>
            </div>
            <div class="controls-row__item">
                <ProjectSelect @change="onProjectsChange"></ProjectSelect>
            </div>
        </div>
        <div class="at-container">
            <div class="at-container__inner">
                <template v-if="this.screenshots.length > 0">
                    <div class="row">
                        <div
                            v-for="screenshot in this.screenshots"
                            :key="screenshot.id"
                            class="col-4 screenshots__card"
                        >
                            <Screenshot
                                class="screenshot"
                                :disableModal="true"
                                :screenshot="screenshot"
                                :task="screenshot.timeinterval.task"
                                :user="modal.user"
                                @click="showImage(screenshot)"
                            />
                        </div>
                    </div>

                    <ScreenshotModal
                        :project="modal.project"
                        :screenshot="modal.screenshot"
                        :show="modal.show"
                        :showNavigation="true"
                        :task="modal.task"
                        :user="modal.user"
                        @close="onHide"
                        @remove="removeScreenshot"
                        @showNext="showNext"
                        @showPrevious="showPrevious"
                    />
                </template>

                <div v-else class="no-data">
                    <span>{{ $t('message.no_data') }}</span>
                </div>
                <preloader v-if="isDataLoading"></preloader>
            </div>
        </div>
        <div class="screenshots__pagination">
            <at-pagination
                :total="screenshotsTotal"
                :current="page"
                :page-size="limit"
                @page-change="loadPage"
            ></at-pagination>
        </div>
    </div>
</template>

<script>
    import { mapGetters } from 'vuex';
    import Calendar from '@/components/Calendar';
    import Screenshot from '@/components/Screenshot';
    import ScreenshotModal from '@/components/ScreenshotModal';
    import UserSelect from '@/components/UserSelect';
    import ProjectService from '@/service/resource/projectService';
    import ScreenshotService from '@/service/resource/screenshotService';
    import { getDateToday, getEndDay, getStartDay } from '@/utils/time';
    import Preloader from '@/components/Preloader';
    import ProjectSelect from '@/components/ProjectSelect';

    export default {
        name: 'Screenshots',
        components: {
            Calendar,
            Screenshot,
            ScreenshotModal,
            UserSelect,
            Preloader,
            ProjectSelect,
        },

        data() {
            const limit = 30;
            const localStorageKey = 'user-select.users';
            const sessionStorageKey = 'amazingcat.session.storage.screenshots';

            return {
                screenshots: [],
                userIDs: null,
                projectsList: [],
                datepickerDateStart: '',
                datepickerDateEnd: '',
                projectService: new ProjectService(),
                screenshotsService: new ScreenshotService(),
                modal: {
                    show: false,
                },
                limit: limit,
                page: 1,
                screenshotsTotal: 0,
                localStorageKey: localStorageKey,
                sessionStorageKey: sessionStorageKey,
                isDataLoading: false,
            };
        },

        computed: {
            ...mapGetters('timeline', ['service', 'users']),
            ...mapGetters('user', ['user']),
        },

        async mounted() {
            window.addEventListener('keydown', this.onKeyDown);

            await this.getScreenshots();
        },

        beforeDestroy() {
            window.removeEventListener('keydown', this.onKeyDown);
        },

        methods: {
            getStartDay,
            getEndDay,

            onHide() {
                this.modal.show = false;
            },
            onKeyDown(e) {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.showPrevious();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.showNext();
                }
            },
            showPrevious() {
                const currentIndex = this.screenshots.findIndex(x => x.id === this.modal.screenshot.id);

                if (currentIndex !== 0) {
                    this.modal.screenshot = this.screenshots[currentIndex - 1];
                }
            },
            showNext() {
                const currentIndex = this.screenshots.findIndex(x => x.id === this.modal.screenshot.id);

                if (currentIndex + 1 !== this.screenshots.length) {
                    this.modal.screenshot = this.screenshots[currentIndex + 1];
                }
            },
            showImage(screenshot) {
                this.modal = {
                    screenshot,
                    user: screenshot.timeinterval.user,
                    task: screenshot.timeinterval.task,
                    project: screenshot.timeinterval.task?.project,
                    show: true,
                };
            },
            onUsersChange(userIDs) {
                this.userIDs = userIDs;
                if (this._isMounted) {
                    this.getScreenshots();
                }
            },
            onProjectsChange(projectIDs) {
                this.projectsList = projectIDs;
                if (this._isMounted) {
                    this.getScreenshots();
                }
            },
            onCalendarChange({ start, end }) {
                this.datepickerDateStart = start;
                this.datepickerDateEnd = end;
                this.getScreenshots();
            },
            async getScreenshots() {
                if (this.userIDs === 'undefined') {
                    return;
                }

                this.isDataLoading = true;

                let { data } = await this.screenshotsService.getWithFilters({
                    'timeInterval.user_id': ['in', this.userIDs],
                    'timeInterval.task.project_id': ['in', this.projectsList],
                    'timeInterval.start_at': ['>=', this.getStartDay(this.datepickerDateStart)],
                    'timeInterval.end_at': ['<=', this.getEndDay(this.datepickerDateEnd)],
                    paginate: true,
                    perPage: this.limit,
                    page: this.page,
                    with: 'timeinterval.task,timeinterval.task.project,timeinterval.user',
                });

                this.isDataLoading = false;
                this.screenshotsTotal = data.total;
                this.screenshots = data.data;
            },
            async removeScreenshot(id) {
                try {
                    await this.screenshotsService.deleteItem(id);
                    this.$Notify({
                        type: 'success',
                        title: this.$t('notification.screenshot.save.success.title'),
                        message: this.$t('notification.screenshot.save.success.message'),
                    });

                    this.screenshots = this.screenshots.filter(screen => screen.id !== id);
                    this.onHide();
                } catch (e) {
                    this.$Notify({
                        type: 'error',
                        title: this.$t('notification.screenshot.save.success.title'),
                        message: this.$t('notification.screenshot.save.success.message'),
                    });
                }
            },
            async loadPage(page) {
                this.page = page;
                await this.getScreenshots();
            },
        },
    };
</script>

<style lang="scss" scoped>
    .at-container {
        overflow: hidden;
        margin-bottom: $layout-01;

        &__inner {
            position: relative;
        }
    }

    .screenshots {
        &__card {
            margin-bottom: $layout-02;
            cursor: pointer;
        }

        &__pagination {
            flex-direction: row-reverse;
            display: flex;
        }
    }

    .screenshot::v-deep {
        .screenshot-image {
            img {
                height: 150px;
                border-radius: 5px;
            }
        }
    }

    .no-data {
        position: relative;
        text-align: center;
        font-weight: bold;
    }
</style>
