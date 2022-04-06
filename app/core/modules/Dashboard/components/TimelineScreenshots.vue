<template>
    <div class="screenshots">
        <h3 class="screenshots__title">{{ $t('field.screenshots') }}</h3>
        <at-checkbox-group v-model="selectedIntervalIds">
            <div class="row">
                <div
                    v-for="(interval, index) in intervals[this.user.id]"
                    :key="interval.id"
                    class="col-4 col-xl-3 screenshots__item"
                >
                    <div class="screenshot" :index="index" @click.shift.prevent.stop="onShiftClick(index)">
                        <Screenshot
                            :disableModal="true"
                            :project="{ id: interval.project_id, name: interval.project_name }"
                            :interval="interval"
                            :task="interval.task"
                            :user="user"
                            :timezone="timezone"
                            @click="showPopup(interval, $event)"
                        />
                        <div @click="onCheckboxClick(index)">
                            <at-checkbox class="screenshot__checkbox" :label="interval.id" />
                        </div>
                    </div>
                </div>
                <ScreenshotModal
                    :project="modal.project"
                    :interval="modal.interval"
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
    import TimeIntervalService from '@/services/resource/time-interval.service';

    export default {
        name: 'TimelineScreenshots',
        components: {
            Screenshot,
            ScreenshotModal,
        },
        data() {
            return {
                intervalsService: new TimeIntervalService(),
                selectedIntervalIds: [],
                modal: {
                    interval: null,
                    project: null,
                    task: null,
                    show: false,
                },
                firstSelectedCheckboxIndex: null,
            };
        },
        computed: {
            ...mapGetters('timeline', ['tasks', 'intervals', 'timezone']),
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
            onShiftClick(index) {
                if (this.firstSelectedCheckboxIndex === null) {
                    this.firstSelectedCheckboxIndex = index;
                }

                this.selectedIntervalIds = this.intervals
                    .slice(
                        Math.min(index, this.firstSelectedCheckboxIndex),
                        Math.max(index, this.firstSelectedCheckboxIndex) + 1,
                    )
                    .map(el => el.id);
            },
            onCheckboxClick(index) {
                if (this.firstSelectedCheckboxIndex === null) this.firstSelectedCheckboxIndex = index;
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
            showPopup(interval, e) {
                if (e.shiftKey) {
                    return;
                }

                if (typeof interval !== 'object' || interval.id === null) {
                    return;
                }

                this.modal.project = interval.task.project;
                this.modal.task = interval.task;
                this.modal.interval = interval;

                this.modal.show = true;
            },
            onHide() {
                this.modal.show = false;
            },
            showPrevious() {
                const currentIndex = this.intervals.findIndex(el => el.id === this.modal.interval.id);

                if (currentIndex !== 0) {
                    this.updateDataModal(currentIndex - 1);
                }
            },
            showNext() {
                const currentIndex = this.intervals.findIndex(el => el.id === this.modal.interval.id);

                if (currentIndex + 1 !== this.intervals.length) {
                    this.updateDataModal(currentIndex + 1);
                }
            },
            updateDataModal(currentIndex) {
                this.modal.interval = this.intervals[currentIndex];
                this.modal.project = this.modal.interval.task.project;
                this.modal.task = this.modal.interval.task;
            },
            async onRemove(intervalID) {
                try {
                    await this.intervalsService.deleteItem(intervalID);

                    this.$emit('on-remove', [this.modal.interval]);

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
                if (intervalIds.length === 0) this.firstSelectedCheckboxIndex = null;

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
        position: relative;
        margin-bottom: $layout-01;

        &__checkbox {
            left: -5px;
            position: absolute;
            top: -5px;
            z-index: 0;
        }

        &::v-deep {
            .screenshot__image {
                img {
                    height: 100px;
                }
            }
        }
    }
</style>
