<template>
    <div>
        <div class="total-time">
            <h5>{{ $t('dashboard.total_time') }}:</h5>
            <h5>{{ formatDuration(totalTime) }}</h5>
        </div>

        <div class="project" v-for="project in userProjects" :key="project.id">
            <h2 class="project-title">
                <span class="project-name" :title="project.name">{{ project.name }}</span>
                <span class="project-duration">{{ formatDuration(project.duration) }}</span>
            </h2>

            <ul class="task-list">
                <li v-for="task in getTasks(project.id)" :key="task.id"
                    :class="{ task: true, 'task-active': activeTask === task.id }">
                    <h3 class="task-title" :title="task.name">{{ task.name }}</h3>

                    <div class="task-progress">
                        <at-progress class="task-progressbar"
                            status="success"
                            :stroke-width="5"
                            :percent="100 * task.duration / project.duration"
                        ></at-progress>

                        <span class="task-duration">{{ formatDuration(task.duration) }}</span>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
    import { mapGetters } from 'vuex';
    import { formatDurationString } from '@/utils/time';

    export default {
        name: 'TimelineSidebar',
        props: {
            activeTask: {
                type: Number,
            },
        },
        computed: {
            ...mapGetters('timeline', [
                'timePerProject',
            ]),
            ...mapGetters('user', [
                'user',
            ]),
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
                const sum = (totalTime,time) => totalTime += time.duration;
                return this.userProjects.reduce(sum, 0);
            }
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
        &-title {
            display: flex;
            flex-flow: row nowrap;
            justify-content: space-between;
            align-items: baseline;
            padding: 0 20px;
            margin-bottom: 15px;
            color: #151941;
            font-size: 20px;
            font-weight: bold;
            white-space: nowrap;
        }

        &-name {
            overflow: hidden;
            text-overflow: ellipsis;
        }

        &-duration {
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
        color: #B1B1BE;
        padding: 5px 20px;

        &::v-deep {
            .at-progress-bar {
                padding-right: 0;
            }

            .at-progress-bar__wraper {
                background: #E0DFED;
            }

            .at-progress--success .at-progress-bar__inner {
                background: #2DC38D;
            }

            .at-progress__text {
                display: none;
            }
        }

        &-title {
            color: inherit;
            white-space: nowrap;
            overflow: hidden;
            font-size: 15px;
            font-weight: 600;
            text-overflow: ellipsis;
        }

        &-active {
            background: #F4F4FF;
            color: #151941;
            border-left: 3px solid #2E2EF9;

            &::v-deep {
                .at-progress-bar__wraper {
                    background: #B1B1BE;
                }
            }
        }

        &-progress {
            display: flex;
            flex-flow: row nowrap;
            justify-content: space-between;
            align-items: center;
        }

        &-progressbar {
            flex: 1;
        }

        &-duration {
            margin-left: 1em;
            color: #59566E;
            font-size: 11px;
            font-weight: 500;
            text-transform: uppercase;
        }
    }
</style>
