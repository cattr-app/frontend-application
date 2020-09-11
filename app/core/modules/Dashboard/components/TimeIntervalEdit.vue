<template>
    <div>
        <transition name="slide-up">
            <div v-if="intervalIds.length" class="time-interval-edit-panel">
                <div class="container-fluid">
                    <div class="row flex-middle flex-between">
                        <div class="col-4">
                            {{ $t('field.selected') }}:
                            <strong>{{ getFormattedTotalTime() }}</strong>
                        </div>
                        <div class="col-12">
                            <div class="flex flex-end">
                                <at-button
                                    class="time-interval-edit-panel__btn"
                                    :disabled="disabledButtons"
                                    @click="openAddNewTaskModal"
                                    >{{ $t('control.add_new_task') }}
                                </at-button>

                                <at-button
                                    class="time-interval-edit-panel__btn"
                                    :disabled="disabledButtons"
                                    @click="openChangeTaskModal"
                                    >{{ $t('control.edit_intervals') }}
                                </at-button>

                                <at-button
                                    class="time-interval-edit-panel__btn"
                                    type="error"
                                    :disabled="disabledButtons"
                                    @click="deleteTimeIntervals"
                                    ><i class="icon icon-trash"></i>
                                    {{ $t('control.delete') }}
                                </at-button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </transition>

        <template v-if="showAddNewTaskModal">
            <AddNewTaskModal
                :showModal="showAddNewTaskModal"
                :disableButtons="disabledButtons"
                @cancel="onAddNewTaskModalCancel"
                @confirm="onAddNewTaskModalConfirm"
            />
        </template>

        <template v-if="showChangeTaskModal">
            <ChangeTaskModal
                :showModal="showChangeTaskModal"
                :disableButtons="disabledButtons"
                @cancel="onChangeTaskModalCancel"
                @confirm="onChangeTaskModalConfirm"
            />
        </template>
    </div>
</template>

<script>
    import moment from 'moment';
    import { mapGetters } from 'vuex';
    import AddNewTaskModal from './AddNewTaskModal';
    import ChangeTaskModal from './ChangeTaskModal';
    import TasksService from '@/service/resource/tasksService';
    import TimeIntervalsService from '@/service/resource/timeIntervalService';

    export default {
        name: 'TimeIntervalEdit',
        components: {
            AddNewTaskModal,
            ChangeTaskModal,
        },
        props: {
            selectedIntervalIds: {
                type: Array,
            },
            screenshots: {
                type: Array,
            },
            intervals: {
                type: Array,
            },
        },
        computed: {
            ...mapGetters('user', ['user']),
            showAddNewTaskModal() {
                return this.modal === 'addNewTask';
            },

            showChangeTaskModal() {
                return this.modal === 'changeTask';
            },
        },
        data() {
            return {
                tasksService: new TasksService(),
                timeIntervalsService: new TimeIntervalsService(),

                modal: '',
                disabledButtons: false,
                intervalIds: [],
            };
        },
        methods: {
            totalTimeOfSelectedIntervals() {
                if (typeof this.intervals !== 'undefined') {
                    return this.intervals
                        .filter(interval => this.intervalIds.includes(interval.id))
                        .map(interval => {
                            const start = moment.utc(interval.start_at);
                            const end = moment.utc(interval.end_at);
                            return end.diff(start);
                        })
                        .reduce((total, curr) => total + curr, 0);
                } else {
                    return this.screenshots
                        .filter(screenshot => this.intervalIds.includes(screenshot.time_interval_id))
                        .map(screenshot => {
                            const start = moment.utc(screenshot.time_interval.start_at);
                            const end = moment.utc(screenshot.time_interval.end_at);
                            return end.diff(start);
                        })
                        .reduce((total, curr) => total + curr, 0);
                }
            },
            getFormattedTotalTime() {
                return moment.utc(this.totalTimeOfSelectedIntervals()).format('HH:mm:ss');
            },
            async saveTimeIntervals(data) {
                try {
                    this.disabledButtons = true;

                    await this.timeIntervalsService.bulkEdit(data);

                    this.$Notify({
                        type: 'success',
                        title: this.$t('notification.screenshot.save.success.title'),
                        message: this.$t('notification.screenshot.save.success.message'),
                    });

                    this.$emit('edit');

                    this.modal = '';
                    this.disabledButtons = false;
                } catch (e) {
                    this.$Notify({
                        type: 'error',
                        title: this.$t('notification.screenshot.save.error.title'),
                        message: this.$t('notification.screenshot.save.error.message'),
                    });

                    this.disabledButtons = false;
                }
            },
            async deleteTimeIntervals() {
                try {
                    this.disabledButtons = true;

                    await this.timeIntervalsService.bulkDelete({
                        intervals: this.intervalIds,
                    });

                    this.$Notify({
                        type: 'success',
                        title: this.$t('notification.screenshot.delete.success.title'),
                        message: this.$t('notification.screenshot.delete.success.message'),
                    });

                    this.$emit('remove', this.intervalIds);
                    this.intervalIds = [];
                    this.disabledButtons = false;
                } catch (e) {
                    this.$Notify({
                        type: 'error',
                        title: this.$t('notification.screenshot.delete.error.title'),
                        message: this.$t('notification.screenshot.delete.error.message'),
                    });

                    this.disabledButtons = false;
                }
            },
            async createTask(projectId, taskName, taskDescription) {
                try {
                    this.disabledButtons = true;

                    const taskResponse = await this.tasksService.save(
                        {
                            project_id: projectId,
                            task_name: taskName,
                            description: taskDescription,
                            user_id: this.user.id,
                            active: true,
                            priority_id: 2,
                        },
                        true,
                    );

                    const task = taskResponse.data.res;
                    const intervals = this.intervalIds.map(id => ({
                        id,
                        task_id: task.id,
                    }));
                    await this.timeIntervalsService.bulkEdit({ intervals });

                    this.$Notify({
                        type: 'success',
                        title: this.$t('notification.screenshot.save.success.title'),
                        message: this.$t('notification.screenshot.save.success.message'),
                    });

                    this.$emit('edit');

                    this.modal = '';
                    this.disabledButtons = false;
                } catch (e) {
                    this.$Notify({
                        type: 'error',
                        title: this.$t('notification.screenshot.save.error.title'),
                        message: this.$t('notification.screenshot.save.error.message'),
                    });

                    this.disabledButtons = false;
                }
            },
            openAddNewTaskModal() {
                this.modal = 'addNewTask';
            },
            openChangeTaskModal() {
                this.modal = 'changeTask';
            },
            onAddNewTaskModalConfirm({ projectId, taskName, taskDescription }) {
                this.createTask(projectId, taskName, taskDescription);
            },
            onChangeTaskModalConfirm(taskId) {
                const intervals = this.intervalIds.map(id => ({ id, task_id: taskId }));
                this.saveTimeIntervals({ intervals });
            },
            onAddNewTaskModalCancel() {
                this.modal = '';
            },
            onChangeTaskModalCancel() {
                this.modal = '';
            },
        },
        watch: {
            selectedIntervalIds(values) {
                this.intervalIds = values;
            },
        },
    };
</script>

<style lang="scss" scoped>
    .time-interval-edit-panel {
        border-top: 1px solid $gray-4;
        padding: 15px 0;
        position: fixed;
        z-index: 999;
        background-color: #fff;

        bottom: 0;
        right: 0;
        left: 0;

        &__btn {
            margin-right: $layout-01;

            &:last-child {
                margin-right: 0;
            }
        }
    }
</style>
