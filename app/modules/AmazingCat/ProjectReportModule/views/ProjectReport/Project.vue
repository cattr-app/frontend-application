<template>
    <div class="project">
        <div class="project__header">
            <h1 class="project__title">{{ project.name }}</h1>
            <span class="h3">{{ formatDurationString(project.project_time) }}</span>
        </div>
        <at-collapse simple class="list__item">
            <at-collapse-item class="list__item" v-for="user in project.users" :key="user.id">
                <div class="row flex-middle" slot="title">
                    <div class="col-3 col-xs-2 col-md-1">
                        <user-avatar :user="user" :size="avatarSize"></user-avatar>
                    </div>
                    <div class="col-8 col-md-10 col-lg-11">
                        <span class="h5">{{ user.full_name }}</span>
                    </div>
                    <div class="col-4 col-md-3 col-lg-2">
                        <span class="h4">{{ formatDurationString(user.tasks_time) }}</span>
                    </div>
                    <div class="col-10">
                        <at-progress status="success"
                                     :stroke-width="15"
                                     :percent="getUserPercentage(user.tasks_time, project.project_time)">
                        </at-progress>
                    </div>
                </div>

                <at-collapse @on-change="handleCollapseTask(user, $event)" simple accordion>
                    <at-collapse-item v-for="task in user.tasks" :key="`tasks-${task.id}`"
                                      :name="task.id">
                        <div class="row" slot="title">
                            <div class="col-10 col-md-11 col-lg-12">
                                <span class="h4">{{ task.task_name }}</span>
                            </div>
                            <div class="col-4 col-md-3 col-lg-2">
                                <span class="h4">{{ formatDurationString(task.duration) }}</span>
                            </div>
                            <div class="col-10">
                                <at-progress status="success"
                                             :stroke-width="15"
                                             :percent="getUserPercentage(task.duration, user.tasks_time)">
                                </at-progress>
                            </div>
                        </div>
                        <at-collapse class="project__screenshots screenshots" @on-change="handleCollapseDate" accordion>
                            <span class="screenshots__title">{{ $t('field.screenshots') }}</span>
                            <at-collapse-item v-for="(dateScreens, date) of task.screenshots"
                                              :key="date"
                                              :name="`${task.id}-${date}`">
                                <div class="row" slot="title">
                                    <div class="col-12">
                                        <span class="h5">{{ moment(date).locale($i18n.locale).format('MMMM DD, YYYY') }}
                                        </span>
                                    </div>
                                    <div class="col-12">
                                        <span class="h5">{{ getDateTime(task, date) }}</span>
                                    </div>
                                </div>

                                <template v-if="isDateOpened(`${task.id}-${date}`)">
                                    <template v-for="(hourScreens, idx) in dateScreens">
                                        <div class="row"
                                            :key="`screen-${task.id}-${date}-${idx}`">
                                            <div class="col-12 col-md-6 col-lg-4"
                                                 :key="index" v-for="(interval, index) in getHourRow(hourScreens)">
                                                <Screenshot v-if="interval"
                                                            class="screenshots__item"
                                                            :key="index"
                                                            :screenshot="interval"
                                                            :user="user"
                                                            :task="task"
                                                            :disableModal="true"
                                                            :showNavigation="true"
                                                            :showTask="false"
                                                            @click="onShow(dateScreens, interval, user, task)"
                                                ></Screenshot>

                                                <div v-else
                                                     :key="index"
                                                     class="screenshots__item screenshots__placeholder">
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                </template>
                            </at-collapse-item>
                        </at-collapse>
                    </at-collapse-item>
                </at-collapse>

            </at-collapse-item>
        </at-collapse>

        <ScreenshotModal
                :show="modal.show"
                :screenshot="modal.screenshot"
                :project="modal.project"
                :task="modal.task"
                :user="modal.user"
                :showNavigation="true"
                @close="onHide"
                @showPrevious="onShowPrevious"
                @showNext="onShowNext"
        />
    </div>
</template>

<script>
    import moment from 'moment';
    import env from '_app/etc/env';
    import Screenshot from "@/components/Screenshot";
    import ScreenshotModal from "@/components/ScreenshotModal";
    import UserAvatar from "@/components/UserAvatar";
    import ProjectReportService from '@/service/reports/ProjectReportService';
    import { getEndDay, getStartDay, formatDurationString } from '@/utils/time';

    export default {
        name: 'Project',

        components: {
            Screenshot,
            ScreenshotModal,
            UserAvatar,
        },

        data() {
            return {
                apiPath: (env.API_URL || `${window.location.origin}/api`),
                modal: {
                    show: false,
                    dateScreenshots: {},
                    screenshot: null,
                    project: null,
                    user: null,
                    task: null,
                },
                openedDates: [],
                avatarSize: 35,
                reportService: new ProjectReportService(),
                taskDurations: {},
                screenshotsPerRow: 6
            }
        },

        props: {
            project: {
                type: Object,
                required: true
            },
            start: {
                type: String,
            },
            end: {
                type: String,
            },
        },

        mounted() {
            window.addEventListener('keydown', this.onKeyDown);
        },

        beforeDestroy() {
            window.removeEventListener('keydown', this.onKeyDown);
        },

        methods: {
            moment,
            getStartDay,
            getEndDay,
            formatDurationString,

            onShow(dateScreenshots, screenshot, user, task) {
                this.modal = {
                    ...this.modal,
                    show: true,
                    dateScreenshots,
                    screenshot,
                    user,
                    task,
                };
            },

            onHide(screenshot) {
                this.modal = {
                    ...this.modal,
                    show: false,
                    screenshot: null,
                };
            },

            onShowPrevious() {
                const screenshots = Object.values(this.modal.dateScreenshots)
                    .reduce((total, current) => total.concat(current), []);
                const currentIndex = screenshots
                    .filter(screenshot => screenshot)
                    .findIndex(screenshot => +screenshot.id === +this.modal.screenshot.id);
                if (currentIndex === -1 || currentIndex === 0) {
                    return;
                }

                this.modal = {
                    ...this.modal,
                    show: true,
                    screenshot: screenshots[currentIndex - 1],
                };
            },

            onShowNext() {
                const screenshots = Object.values(this.modal.dateScreenshots)
                    .reduce((total, current) => total.concat(current), []);
                const currentIndex = screenshots
                    .filter(screenshot => screenshot)
                    .findIndex(screenshot => +screenshot.id === +this.modal.screenshot.id);
                if (currentIndex === -1 || currentIndex === screenshots.length - 1) {
                    return;
                }

                this.modal = {
                    ...this.modal,
                    show: true,
                    screenshot: screenshots[currentIndex + 1],
                };
            },

            onKeyDown(e) {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.onShowPrevious();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.onShowNext();
                }
            },

            isDateOpened(collapseId) {
                return this.openedDates.findIndex(p => p === collapseId) > -1;
            },

            handleCollapseDate(data) {
                this.openedDates = data;
            },

            handleCollapseTask(user, taskID) {
                if (typeof taskID === 'object') {
                    taskID = taskID[0];
                }
                const key = `${user.id}:${taskID}`;
                this.$set(this.taskDurations, key, user.tasks);
            },

            formatDate(value) {
                return moment(value).format('DD.MM.YYYY HH:mm:ss');
            },

            getDateTime(task, date) {
                date = moment(date).format("YYYY-MM-DD");
                return this.formatDurationString(task.dates[date]);
            },

            getUserPercentage(seconds, totalTime) {
                if (!totalTime) {
                    return 0;
                }

                return Math.floor((seconds * 100) / totalTime);
            },

            getHourRow(screenshots) {
                let result = new Array(this.screenshotsPerRow).fill(null);

                for(let key in screenshots) {
                    if (screenshots.hasOwnProperty(key)) {
                        result[key] = screenshots[key];
                    }
                }
                return result;
            },
        }
    };
</script>

<style lang="scss" scoped>
    .project {
        &__header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: none;
            padding: 14px 21px;
            border-bottom: 3px solid $blue-3;
        }

        &__title {
            color: $black-900;
            font-size: 2rem;
            font-weight: bold;
        }

        &__screenshots {
            margin-bottom: $spacing-05;
        }
    }

    .screenshots {
        padding-top: $spacing-03;

        &__title {
            font-size: 15px;
            color: $gray-3;
            font-weight: bold;
        }

        &__item {
            margin-bottom: $spacing-04;
        }

        &__placeholder {
            width: 100%;
            height: 150px;
            border: 2px dashed $gray-3;
        }

        &::v-deep {
            .at-collapse__header {
                padding: 14px 0;
            }

            img {
                object-fit: cover;
                height: 150px;
            }
        }
    }
</style>
