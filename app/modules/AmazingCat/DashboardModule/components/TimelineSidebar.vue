<template>
    <div>
        <div class="total-time">
            <h5>{{ $t('dashboard.total_time') }}:</h5>
            <h5>
                <Skeleton :loading="isDataLoading" width="50px">{{ formatDuration(totalTime) }} </Skeleton>
            </h5>
        </div>

        <div v-for="project in userProjects" :key="project.id" class="project">
            <div class="project__header">
                <Skeleton :loading="isDataLoading" width="100%" height="15px">
                    <div class="project__title">
                        <span class="project__name" :title="project.name">
                            {{ project.name }}
                        </span>
                        <span class="project__duration">
                            {{ formatDuration(project.duration) }}
                        </span>
                    </div>
                    <!-- /.project-title -->
                </Skeleton>
            </div>
            <!-- /.project-header -->

            <ul class="task-list">
                <li
                    v-for="task in getTasks(project.id)"
                    :key="task.id"
                    class="task"
                    :class="{ 'task-active': activeTask === task.id }"
                >
                    <Skeleton :loading="isDataLoading" width="100%" height="15px">
                        <h3 class="task__title" :title="task.name">{{ task.name }}</h3>

                        <div class="task__progress">
                            <at-progress
                                class="task__progressbar"
                                status="success"
                                :stroke-width="5"
                                :percent="(100 * task.duration) / project.duration"
                            ></at-progress>

                            <span class="task__duration">{{ formatDuration(task.duration) }}</span>
                        </div>
                    </Skeleton>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
    import { mapGetters } from 'vuex';
    import { formatDurationString } from '@/utils/time';
    import { Skeleton } from 'vue-loading-skeleton';

    export default {
        name: 'TimelineSidebar',
        components: {
            Skeleton,
        },
        props: {
            activeTask: {
                type: Number,
            },
            isDataLoading: {
                type: Boolean,
                default: false,
            },
        },
        computed: {
            ...mapGetters('timeline', ['timePerProject']),
            ...mapGetters('user', ['user']),
            userProjects() {
                if (!this.user || !this.user.id) {
                    return [];
                }

                if (!this.timePerProject[this.user.id]) {
                    return [];
                }

                return Object.values(this.timePerProject[this.user.id]);
            },
            totalTime() {
                const sum = (totalTime, time) => (totalTime += time.duration);
                return this.userProjects.reduce(sum, 0);
            },
        },
        methods: {
            getTasks(projectID) {
                return Object.values(this.timePerProject[this.user.id][projectID].tasks);
            },
            formatDuration: formatDurationString,
        },
    };
</script>

<style lang="scss" scoped>
    .total-time {
        display: flex;
        justify-content: space-between;
        align-items: center;

        padding: 0 20px;
        margin-bottom: $spacing-05;
    }

    .project {
        &__header {
            padding: 0 20px;
            margin-bottom: 15px;
        }

        &__title {
            display: flex;
            flex-flow: row nowrap;
            justify-content: space-between;
            align-items: baseline;
            color: #151941;
            font-size: 20px;
            font-weight: bold;
            white-space: nowrap;
        }

        &__name {
            overflow: hidden;
            text-overflow: ellipsis;
        }

        &__duration {
            float: right;
            margin-left: 0.5em;
            font-size: 15px;
        }

        &:not(:last-child) {
            margin-bottom: 70px;
        }
    }

    .task-list {
        list-style: none;
    }

    .task {
        color: #b1b1be;
        padding: 5px 20px;

        &::v-deep {
            .at-progress-bar {
                padding-right: 0;
            }

            .at-progress-bar__wraper {
                background: #e0dfed;
            }

            .at-progress--success .at-progress-bar__inner {
                background: #2dc38d;
            }

            .at-progress__text {
                display: none;
            }
        }

        &__title {
            color: inherit;
            white-space: nowrap;
            overflow: hidden;
            font-size: 15px;
            font-weight: 600;
            text-overflow: ellipsis;
        }

        &__active {
            background: #f4f4ff;
            color: #151941;
            border-left: 3px solid #2e2ef9;

            &::v-deep {
                .at-progress-bar__wraper {
                    background: #b1b1be;
                }
            }
        }

        &__progress {
            display: flex;
            flex-flow: row nowrap;
            justify-content: space-between;
            align-items: center;
        }

        &__progressbar {
            flex: 1;
        }

        &__duration {
            margin-left: 1em;
            color: #59566e;
            font-size: 11px;
            font-weight: 500;
            text-transform: uppercase;
        }
    }
</style>
