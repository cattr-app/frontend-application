<template>
    <div class="screenshots">
        <h3 class="screenshots__title">{{ $t('field.screenshots') }}</h3>
        <at-checkbox-group v-model="selectedIntervalIds">
            <div class="row">
                <div v-for="screenshot in screenshots" :key="screenshot.id" class="col-4 screenshots__item">
                    <div class="screenshot">
                        <Screenshot
                            :disableModal="true"
                            :project="getProject(screenshot)"
                            :screenshot="screenshot"
                            :task="getTask(screenshot)"
                            :user="user"
                            :timezone="timezone"
                            @click="showPopup(screenshot)"
                        />
                        <at-checkbox class="screenshot__checkbox" :label="screenshot.time_interval_id" />
                    </div>
                </div>
                <ScreenshotModal
                    :project="modal.project"
                    :screenshot="modal.screenshot"
                    :show="modal.show"
                    :showNavigation="true"
                    :task="modal.task"
                    :user="user"
                    @close="onHide"
                    @remove="onRemove"
                    @showNext="showNext"
                    @showPrevious="showPrevious"
                />
            </div>
        </at-checkbox-group>
    </div>
</template>

<script>
    import { mapGetters } from 'vuex';
    import Screenshot from '@/components/Screenshot';
    import ScreenshotModal from '@/components/ScreenshotModal';
    import ScreenshotService from '@/service/resource/screenshotService';

    export default {
        name: 'TimelineScreenshots',
        components: {
            Screenshot,
            ScreenshotModal,
        },
        data() {
            return {
                screenshotsService: new ScreenshotService(),
                selectedIntervalIds: [],
                modal: {
                    screenshot: null,
                    project: null,
                    task: null,
                    show: false,
                },
            };
        },
        computed: {
            ...mapGetters('timeline', ['tasks', 'screenshots', 'timezone']),
            ...mapGetters('user', ['user']),
            projects() {
                return Object.keys(this.tasks)
                    .map(taskID => this.tasks[taskID])
                    .reduce((projects, task) => ({ ...projects, [task.project_id]: task.project }), {});
            },
        },
        mounted() {
            window.addEventListener('keydown', this.onKeyDown);
        },
        beforeDestroy() {
            window.removeEventListener('keydown', this.onKeyDown);
        },
        methods: {
            onKeyDown(e) {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.showPrevious();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.showNext();
                }
            },
            showPopup(screenshot) {
                if (typeof screenshot !== 'object') {
                    return;
                }

                this.modal.project = this.getProject(screenshot);
                this.modal.task = this.getTask(screenshot);
                this.modal.screenshot = screenshot;

                this.modal.show = true;
            },
            onHide() {
                this.modal.show = false;
            },
            showPrevious() {
                const currentIndex = this.screenshots.findIndex(x => x.id === this.modal.screenshot.id);

                if (currentIndex !== 0) {
                    this.updateDataModal(currentIndex - 1);
                }
            },
            showNext() {
                const currentIndex = this.screenshots.findIndex(x => x.id === this.modal.screenshot.id);

                if (currentIndex + 1 !== this.screenshots.length) {
                    this.updateDataModal(currentIndex + 1);
                }
            },
            updateDataModal(currentIndex) {
                this.modal.screenshot = this.screenshots[currentIndex];
                this.modal.project = this.getProject(this.modal.screenshot);
                this.modal.task = this.getTask(this.modal.screenshot);
            },
            getProjectByID(id) {
                if (!this.projects || !this.projects[id]) {
                    return null;
                }

                return this.projects[id];
            },
            getProject(screenshot) {
                if (!screenshot.time_interval) {
                    return null;
                }

                const task = this.getTask(screenshot);
                if (!task) {
                    return null;
                }

                return this.getProjectByID(task.project_id);
            },
            getTaskByID(id) {
                if (!this.tasks || !this.tasks[id]) {
                    return null;
                }

                return this.tasks[id];
            },
            getTask(screenshot) {
                if (!screenshot.time_interval) {
                    return null;
                }

                return this.getTaskByID(screenshot.time_interval.task_id);
            },
            async onRemove(screenshotID) {
                try {
                    await this.screenshotsService.deleteItem(screenshotID);

                    this.$emit('on-remove', [this.modal.screenshot]);

                    this.$Notify({
                        type: 'success',
                        title: this.$t('notification.screenshot.delete.success.title'),
                        message: this.$t('notification.screenshot.delete.success.message'),
                    });

                    this.modal.show = false;
                } catch (e) {
                    this.$Notify({
                        type: 'error',
                        title: this.$t('notification.screenshot.delete.error.title'),
                        message: this.$t('notification.screenshot.delete.error.message'),
                    });
                }
            },
            clearSelectedIntervals() {
                this.selectedIntervalIds = [];
            },
        },
        watch: {
            selectedIntervalIds(intervalIds) {
                this.$emit('onSelectedIntervals', intervalIds);
            },
        },
    };
</script>

<style lang="scss" scoped>
    .screenshots {
        &__title {
            color: #b1b1be;
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 16px;
            margin-top: 37px;
        }

        &__item {
            margin-bottom: $layout-01;
        }
    }

    .screenshot {
        height: 100px;
        position: relative;
        margin-bottom: $layout-01;

        &__checkbox {
            left: -5px;
            position: absolute;
            top: -5px;
            z-index: 0;
        }

        &::v-deep {
            .screenshot-image {
                img {
                    border-radius: 5px;
                    height: 100px;
                }
            }
        }
    }
</style>
