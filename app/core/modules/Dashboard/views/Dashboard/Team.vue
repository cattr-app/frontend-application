<template>
    <div class="team">
        <div class="controls-row flex-between">
            <div class="flex">
                <Calendar
                    class="controls-row__item"
                    :sessionStorageKey="sessionStorageKey"
                    @change="onCalendarChange"
                />

                <UserSelect class="controls-row__item" :currentTasks="currentTasks" @change="onUsersChange" />

                <ProjectSelect class="controls-row__item" @change="onProjectsChange" />

                <TimezonePicker class="controls-row__item" :value="timezone" @onTimezoneChange="onTimezoneChange" />
            </div>

            <div class="flex">
                <router-link
                    v-if="$can('viewManualTime', 'dashboard')"
                    to="/time-intervals/new"
                    class="controls-row__item"
                >
                    <at-button class="controls-row__btn" icon="icon-edit">{{ $t('control.add_time') }}</at-button>
                </router-link>

                <ExportDropdown
                    class="export controls-row__item controls-row__btn"
                    position="left"
                    trigger="hover"
                    @export="onExport"
                >
                </ExportDropdown>
            </div>
        </div>

        <div class="at-container">
            <div class="at-container__inner">
                <div class="row">
                    <div class="col-8 col-lg-6">
                        <TeamSidebar
                            class="sidebar"
                            :users="graphUsers"
                            :worked="worked"
                            :currentTasks="currentTasks"
                            :currentProjects="currentProjects"
                            :sort="sort"
                            :sortDir="sortDir"
                            @sort="onSort"
                        />
                    </div>

                    <div class="col-16 col-lg-18">
                        <TeamDayGraph
                            v-if="type === 'day'"
                            class="graph"
                            :users="graphUsers"
                            :events="events"
                            :timezone="timezone"
                            @selectedIntervals="onSelectedIntervals"
                        />
                        <TeamTableGraph
                            v-else
                            class="graph"
                            :start="start"
                            :end="end"
                            :users="graphUsers"
                            :timePerDay="timePerDay"
                        />
                    </div>

                    <time-interval-edit
                        :screenshots="selectedScreenshots"
                        :intervals="selectedIntervals"
                        :selected-interval-ids="selectedIntervalIds"
                        @remove="onBulkRemove"
                        @edit="load"
                        @close="clearIntervals"
                    ></time-interval-edit>
                </div>
                <preloader v-if="isDataLoading" class="team__loader" :is-transparent="true"></preloader>
            </div>
        </div>
    </div>
</template>

<script>
    import moment from 'moment';
    import 'moment-timezone';
    import throttle from 'lodash/throttle';
    import { mapActions, mapGetters } from 'vuex';
    import Calendar from '@/components/Calendar';
    import UserSelect from '@/components/UserSelect';
    import ProjectSelect from '@/components/ProjectSelect';
    import TeamSidebar from '../../components/TeamSidebar';
    import TeamDayGraph from '../../components/TeamDayGraph';
    import TeamTableGraph from '../../components/TeamTableGraph';
    import TimezonePicker from '@/components/TimezonePicker';
    import DashboardReportService from '@/services/reports/dashboard-report.service';
    import ProjectService from '@/services/resource/project.service';
    import { downloadBlob, getMimeType } from '@/utils/file';
    import { getDateToday, getEndDay, getEndOfDayInTimezone, getStartDay, getStartOfDayInTimezone } from '@/utils/time';
    import ExportDropdown from '@/components/ExportDropdown';
    import TimeIntervalEdit from '../../components/TimeIntervalEdit';
    import cloneDeep from 'lodash/cloneDeep';
    import Preloader from '@/components/Preloader';

    const updateInterval = 60 * 1000;

    export default {
        name: 'Team',
        components: {
            Calendar,
            UserSelect,
            ProjectSelect,
            TeamSidebar,
            TeamDayGraph,
            TeamTableGraph,
            TimezonePicker,
            ExportDropdown,
            TimeIntervalEdit,
            Preloader,
        },
        data() {
            const today = this.getDateToday();
            const sessionStorageKey = 'amazingcat.session.storage.team';

            return {
                type: 'day',
                start: today,
                end: today,
                userIDs: [],
                projectIDs: [],
                sort: localStorage.getItem('team.sort') || 'user',
                sortDir: localStorage.getItem('team.sort-dir') || 'asc',
                projectService: new ProjectService(),
                reportService: new DashboardReportService(),
                showExportModal: false,
                selectedIntervalIds: [],
                selectedScreenshots: [],
                selectedIntervals: [],
                sessionStorageKey: sessionStorageKey,
                isDataLoading: false,
            };
        },
        created() {
            localStorage['dashboard.tab'] = 'team';
            this.service.loadUsers();
            this.load();
            this.updateHandle = setInterval(() => this.load(false), updateInterval);
        },
        beforeDestroy() {
            clearInterval(this.updateHandle);
            this.service.unloadIntervals();
            this.service.unloadScreenshots();
        },
        computed: {
            ...mapGetters('timeline', [
                'service',
                'intervals',
                'screenshots',
                'events',
                'timePerDay',
                'users',
                'latestIntervals',
                'latestTasks',
                'latestProjects',
                'timezone',
            ]),
            graphUsers() {
                const { worked } = this;

                return this.users
                    .filter(user => this.userIDs.includes(user.id))
                    .sort((a, b) => {
                        let order = 0;
                        if (this.sort === 'user') {
                            const aName = a.full_name.toUpperCase();
                            const bName = b.full_name.toUpperCase();
                            order = aName.localeCompare(bName);
                        } else if (this.sort === 'worked') {
                            const aWorked = worked[a.id] || 0;
                            const bWorked = worked[b.id] || 0;
                            order = aWorked - bWorked;
                        }

                        return this.sortDir === 'asc' ? order : -order;
                    });
            },
            worked() {
                if (!this.intervals) {
                    return {};
                }

                return Object.keys(this.intervals).reduce((result, userID) => {
                    const { duration } = this.intervals[userID];

                    return {
                        ...result,
                        [userID]: duration,
                    };
                }, {});
            },
            currentTasks() {
                if (!this.latestIntervals) {
                    return {};
                }

                return Object.keys(this.latestIntervals).reduce((result, userID) => {
                    const { intervals } = this.latestIntervals[userID];
                    if (intervals.length) {
                        const interval = intervals[intervals.length - 1];
                        const task = this.latestTasks[interval.task_id];
                        if (task) {
                            return {
                                ...result,
                                [userID]: task,
                            };
                        }
                    }

                    return result;
                }, {});
            },
            currentProjects() {
                if (!this.latestIntervals) {
                    return {};
                }

                return Object.keys(this.latestIntervals).reduce((result, userID) => {
                    const task = this.currentTasks[userID];
                    if (task) {
                        const project = this.latestProjects[task.project_id];

                        return {
                            ...result,
                            [userID]: project,
                        };
                    }

                    return result;
                }, {});
            },
            exportFilename() {
                const days = moment(this.end).diff(this.start, 'days');

                return days > 1
                    ? `Dashboard Report from ${this.start} to ${this.end}`
                    : `Dashboard Report ${this.start}`;
            },
        },
        methods: {
            getStartDay,
            getEndDay,
            getDateToday,
            getStartOfDayInTimezone,
            getEndOfDayInTimezone,
            ...mapActions({
                setTimezone: 'timeline/setTimezone',
            }),
            load: throttle(async function(withLoadingIndicator = true) {
                this.isDataLoading = withLoadingIndicator;
                if (!this.userIDs.length || !this.projectIDs.length) {
                    this.isDataLoading = false;

                    return;
                }

                this.service.loadLatestIntervals(this.userIDs, this.projectIDs);

                const startAt = this.getStartOfDayInTimezone(this.start, this.timezone);
                const endAt = this.getEndOfDayInTimezone(this.end, this.timezone);

                await this.service.load(this.userIDs, this.projectIDs, startAt, endAt);

                if (this.type === 'day') {
                    await this.service.loadScreenshots(this.userIDs, startAt, endAt);
                }

                this.isDataLoading = false;
            }, 1000),
            onCalendarChange({ type, start, end }) {
                this.type = type;
                this.start = start;
                this.end = end;

                this.service.unloadIntervals();
                this.service.unloadScreenshots();

                this.load();
            },
            onUsersChange(userIDs) {
                this.userIDs = [...userIDs];

                this.load();
            },
            onProjectsChange(projectIDs) {
                this.projectIDs = [...projectIDs];

                this.load();
            },
            onTimezoneChange(timezone) {
                this.setTimezone(timezone);
            },
            onSort(column) {
                if (column === this.sort) {
                    this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sort = column;
                    // Sort users ascending and time descending by default
                    this.sortDir = column === 'user' ? 'asc' : 'desc';
                }

                localStorage['team.sort'] = this.sort;
                localStorage['team.sort-dir'] = this.sortDir;
            },
            async onExport(format) {
                const mimetype = getMimeType(format);

                const config = {
                    headers: { Accept: mimetype },
                };

                let sortBy;
                if (this.sort === 'user') sortBy = 'name';
                if (this.sort === 'worked') sortBy = 'time_worked';

                const params = {
                    start_at: this.start,
                    end_at: moment
                        .utc(this.end)
                        .add(1, 'day')
                        .format('YYYY-MM-DD'),
                    user_ids: this.userIDs,
                    project_ids: this.projectIDs,
                    order_by: sortBy,
                    order_dir: this.sortDir,
                    timezone: this.timezone,
                };

                const response = await this.reportService.getReport(params, config);
                const blob = new Blob([response.data], { type: mimetype });
                const fileName = `${this.exportFilename}.${format}`;
                downloadBlob(blob, fileName);
            },
            onSelectedIntervals(event) {
                this.selectedIntervalIds = event.ids;
                this.selectedScreenshots = this.screenshots.filter(screenshot =>
                    this.selectedIntervalIds.includes(screenshot.time_interval_id),
                );
                this.selectedIntervals = Object.values(this.intervals).reduce((acc, curr) => {
                    return [...acc, ...curr.intervals.filter(interval => event.ids.includes(interval.id))];
                }, []);
            },
            onBulkRemove() {
                this.recalculateStatistic(this.selectedScreenshots);
                this.clearIntervals();
            },
            recalculateStatistic(screenshots) {
                screenshots.map(screenshot => {
                    const interval = screenshot.time_interval;
                    const totalIntervals = cloneDeep(this.intervals);
                    const userInterval = cloneDeep(this.intervals[interval.user_id]);
                    const deletedDuration = moment(interval.end_at).diff(interval.start_at, 'seconds');

                    userInterval.duration -= deletedDuration;
                    userInterval.intervals = userInterval.intervals.filter(int => {
                        if (int.ids.includes(interval.id)) {
                            int.duration -= deletedDuration;
                        }
                        return int.duration > 0;
                    });

                    totalIntervals[interval.user_id] = userInterval;
                    this.$store.dispatch('timeline/setIntervals', totalIntervals);
                    this.$store.dispatch(
                        'timeline/setScreenshots',
                        this.screenshots.filter(scr => scr.id !== screenshot.id),
                    );
                });
            },
            clearIntervals() {
                this.selectedScreenshots = [];
                this.selectedIntervals = [];
                this.selectedIntervalIds = [];
            },

            // for send invites to new users
            async getModalInvite() {
                let modal;
                try {
                    modal = await this.$Modal.prompt({
                        title: this.$t('invite.label'),
                        content: this.$t('invite.content'),
                    });
                } catch {
                    return;
                }

                if (!modal.value) {
                    this.$Message.error(this.$t('invite.message.error'));
                    return;
                }

                const emails = modal.value.split(',');

                // eslint-disable-next-line no-useless-escape
                const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
                const validation = {
                    isError: false,
                    emails: [],
                };

                for (let i = 0; i < emails.length; i++) {
                    let email = emails[i].replace(' ', '');
                    if (regex.exec(email) == null) {
                        validation.isError = true;
                        validation.emails.push(email);
                    }
                }

                if (!validation.isError) {
                    this.reportService.sendInvites({ emails }).then(({ data }) => {
                        this.$Message.success('Success');
                    });
                } else {
                    this.$Message.error(this.$t('invite.message.valid') + validation.emails);
                }
            },
        },
        watch: {
            timezone() {
                this.service.unloadIntervals();
                this.load();
            },
        },
    };
</script>

<style lang="scss" scoped>
    .at-container {
        &__inner {
            position: relative;
        }
    }

    .team__loader {
        z-index: 0;
        border-radius: 20px;

        &::v-deep {
            align-items: baseline;

            .lds-ellipsis {
                position: sticky;
                top: 25px;
            }
        }
    }

    .timeline-type {
        margin-left: 10px;
        border-radius: 5px;

        .at-btn:first-child {
            border-radius: 5px 0 0 5px;
        }

        .at-btn:last-child {
            border-radius: 0 5px 5px 0;
        }

        &-btn {
            border: 1px solid #eeeef5;
            color: #b1b1be;
            font-size: 15px;
            font-weight: 500;
            height: 40px;

            &.active {
                color: #ffffff;
                background: #2e2ef9;
            }
        }
    }

    .export {
        display: flex;
        align-items: center;
        justify-content: center;

        width: 40px;

        &::v-deep .at-btn__text {
            color: #2e2ef9;
            font-size: 25px;
        }
    }

    .button-invite {
        color: #618fea;
    }
</style>
