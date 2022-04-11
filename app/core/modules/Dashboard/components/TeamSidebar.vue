<template>
    <div class="team_sidebar">
        <div class="row team_sidebar__heading">
            <div class="col-16">{{ $t('dashboard.user') }}</div>
            <div>{{ $t('dashboard.worked') }}</div>
        </div>
        <div v-for="(user, key) in users" :key="key" class="row">
            <div class="col-16 row team_sidebar__user_row">
                <div class="col-5">
                    <UserAvatar :user="user" />
                </div>
                <div class="team_sidebar__user_info">
                    <div class="team_sidebar__user_name">{{ user.full_name }}</div>
                    <div class="team_sidebar__user_task">
                        <router-link
                            v-if="user.last_interval"
                            :to="`/tasks/view/${user.last_interval.task_id}`"
                            :title="user.last_interval.task_name"
                            target="_blank"
                        >
                            {{ user.last_interval.project_name | truncate }}
                        </router-link>
                        <a v-else>&nbsp;</a>
                    </div>
                </div>
            </div>
            <div class="team_sidebar__user_worked">
                {{ getWorked(user.id) }}
            </div>
        </div>
    </div>
</template>

<script>
    import { formatDurationString } from '@/utils/time';
    import { mapGetters } from 'vuex';
    import UserAvatar from '@/components/UserAvatar';

    export default {
        name: 'TeamSidebar',
        components: { UserAvatar },
        props: {
            sort: {
                type: String,
                required: true,
            },
            sortDir: {
                type: String,
                required: true,
            },
            users: {
                type: Array,
                required: true,
            },
        },
        computed: {
            ...mapGetters('dashboard', ['intervals']),
        },
        filters: {
            truncate(value) {
                return value.length >= 25 ? value.substring(0, 25) + '...' : value;
            },
        },
        methods: {
            getWorked(userId) {
                return formatDurationString(
                    this.intervals.hasOwnProperty(userId)
                        ? this.intervals[userId].reduce((acc, el) => acc + el.duration, 0)
                        : 0,
                );
            },
        },
    };
</script>

<style lang="scss" scoped>
    .team_sidebar {
        &__heading {
            font-weight: 600;
            color: #b1b1be;
            margin-bottom: 20px;
        }

        &__user {
            &_name {
                font-size: 10pt;
                font-weight: 500;
                color: #151941;
            }

            &_row {
                margin: 16px 0;
            }

            &_worked {
                color: #59566e;
                font-weight: 600;
                margin-top: 15px;
            }

            &_task {
                font-size: 9pt;
            }

            &_info {
                margin-top: -5px;
            }
        }
    }
</style>
