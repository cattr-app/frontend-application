<template>
    <div class="screenshots">
        <h1 class="page-title">{{ $t('navigation.screenshots') }}</h1>
        <div class="controls-row">
            <div class="controls-row__item">
                <Calendar
                        :start="datepicker.date.start"
                        :end="datepicker.date.end"
                        @change="onCalendarChange"
                />
            </div>
            <div class="controls-row__item">
                <UserSelect @change="onUsersChange"></UserSelect>
            </div>
            <div class="controls-row__item">
                <multi-select name="projects"
                              :inputHandler="selectedProjects"
                              :service="projectService">
                </multi-select>
            </div>
        </div>
        <div class="at-container">
            <div class="at-container__inner">
                <template v-if="this.screenshots.length > 0">
                    <div class="row">
                        <div class="col-4 screenshots__card" v-for="screenshot in this.screenshots" :key="screenshot.id">
                            <Screenshot class="screenshot"
                                :disableModal="true"
                                :screenshot="screenshot"
                                :task="screenshot.timeinterval.task"
                                :user="modal.user"
                                @click="showImage(screenshot)"
                            />
                        </div>
                    </div>

                    <div class="screenshots__pagination">
                        <at-pagination :total="screenshotsTotal"
                                       :current="page"
                                       :page-size="limit"
                                       @page-change="loadPage"
                        ></at-pagination>
                    </div>

                    <ScreenshotModal :project="modal.project"
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
    </div>
</template>

<script>
    import { mapGetters } from 'vuex';
    import Calendar from "@/components/Calendar";
    import Screenshot from "@/components/Screenshot";
    import ScreenshotModal from '@/components/ScreenshotModal';
    import UserSelect from "@/components/UserSelect";
    import ProjectService from "@/service/resource/projectService";
    import ScreenshotService from "@/service/resource/screenshotService";
    import { formatDate, formatDurationString } from '@/utils/time';
    import {getDateToday, getEndDay, getStartDay} from "@/utils/time";
    import MultiSelect from "@/components/MultiSelect";
    import Preloader from '@/components/Preloader';

    export default {
        name: "Screenshots",
        components: {
            Calendar,
            Screenshot,
            ScreenshotModal,
            UserSelect,
            MultiSelect,
            Preloader
        },

        data() {
            const limit = 30;
            const today = this.getDateToday();
            const localStorageKey = 'user-select.users';

            return {
                screenshots: [],
                userIDs: null,
                projectsList: [],
                datepicker: {
                    date: {
                        start: today,
                        end: today,
                    }
                },
                projectService: new ProjectService(),
                screenshotsService: new ScreenshotService(),
                modal: {
                    show: false,
                },
                limit: limit,
                page: 1,
                screenshotsTotal: 0,
                localStorageKey: localStorageKey,
                isDataLoading: false
            }
        },

        computed: {
            ...mapGetters('timeline', [
                'service',
                'users',
            ]),
            ...mapGetters('user', [
                'user',
            ]),
        },

        watch: {
            'datepicker.date': function () {
                this.getScreenshots();
            },
        },

        async mounted() {
            await this.getScreenshots();
        },

        methods: {
            formatDate,
            formatDurationString,
            getStartDay,
            getEndDay,
            getDateToday,
            onHide () {
                this.modal.show = false;
            },
            showPrevious () {
                const currentIndex = this.screenshots.findIndex(x => x.id === this.modal.screenshot.id);

                if (currentIndex !== 0) {
                    this.modal.screenshot = this.screenshots[currentIndex - 1];
                }
            },
            showNext () {
                const currentIndex = this.screenshots.findIndex(x => x.id === this.modal.screenshot.id);

                if (currentIndex + 1 !== this.screenshots.length) {
                    this.modal.screenshot = this.screenshots[currentIndex + 1];
                }
            },
            showImage(screenshot) {
                const userId = screenshot.timeinterval.user_id;
                const availableUsers = this.users;

                const user = availableUsers.find(user => user.id === userId);

                this.modal = {
                    user,
                    screenshot,
                    task: screenshot.timeinterval.task,
                    show: true
                };
            },

            onUsersChange(userIDs) {
                this.userIDs = userIDs;
                if (this._isMounted) {
                    this.getScreenshots();
                }
            },

            onCalendarChange({start, end}) {
                this.datepicker.date.start = start;
                this.datepicker.date.end = end;
                this.getScreenshots();
            },

            async getScreenshots() {
                if (this.userIDs === 'undefined') {
                    return;
                }

                this.isDataLoading = true;

                let {data, total} = (await this.screenshotsService.getWithFilters({
                    'timeInterval.user_id': ['in', this.userIDs],
                    'timeInterval.task.project_id': ['in', this.projectsList],
                    'timeInterval.start_at': ['>=', this.getStartDay(this.datepicker.date.start)],
                    'timeInterval.end_at': ['<=', this.getEndDay(this.datepicker.date.end)],
                    paginate: true,
                    perPage: this.limit,
                    page: this.page,
                    with: 'timeinterval.task',
                }).then(({ data }) => {
                    this.isDataLoading = false;
                    return data;
                }));

                this.screenshotsTotal = total;
                this.screenshots = data;
            },

            async removeScreenshot(screenshot) {
                try {
                    await this.screenshotsService.deleteItem(screenshot.id);
                    this.$Notify({
                        type: 'success',
                        title: 'Deleted Successfully',
                        message: 'Screenshot was deleted successfully'
                    });

                    this.screenshots = this.screenshots.filter(screen => screen.id !== screenshot.id);
                } catch (e) {
                    this.$Notify({
                        type: 'error',
                        title: 'Deletion Error',
                        message: 'This screenshot can not be deleted OR something unusual happened during the request'
                    });
                }
            },

            async loadPage(page) {
                this.page = page;
                await this.getScreenshots();
            },

            selectedProjects(values) {
                this.projectsList = values;
                this.getScreenshots();
            }
        }
    }
</script>

<style lang="scss" scoped>
    .at-container {
        overflow: hidden;

        &__inner {
            position: relative;
        }
    }

    .screenshots {
        &__card {
            margin-bottom: $layout-02;
            cursor: pointer;
            border-radius: 10px;
        }

        &__pagination {
            flex-direction: row-reverse;
            display: flex;
        }
    }

    .screenshot {
        height: 150px;
    }

    .no-data {
        position: relative;
        text-align: center;
        font-weight: bold;
    }
</style>
