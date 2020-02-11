<template>
    <div class="team">
        <div class="controls-row flex-between">
            <div class="flex">
                <Calendar
                        class="controls-row__item"
                        :start="start"
                        :end="end"
                        :initialTab="type"
                        @change="onCalendarChange"
                />

                <UserSelect
                        class="controls-row__item"
                        :currentTasks="currentTasks"
                        @change="onUsersChange"
                />

                <TimezonePicker
                        class="controls-row__item"
                        :value="timezone"
                        :inputHandler="onTimezoneChange"
                />
            </div>

            <!--<at-button-group class="timeline-type">
                <at-button class="timeline-type-btn">
                    <span class="icon icon-clock"></span>
                    Time
                </at-button>

                <at-button class="timeline-type-btn active">
                    <span class="icon icon-bar-chart-2"></span>
                    Bars
                </at-button>
            </at-button-group>-->

            <div class="flex">
                <router-link v-if="$store.getters['user/user'].manual_time"
                             to="time-intervals/new"
                             class="controls-row__item">
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
                                @outsideClick="hideIntervalsEdit"
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
                            :selected-interval-ids="selectedIntervalIds"
                            @remove="onBulkRemove"
                            @edit="load"
                    ></time-interval-edit>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import moment from 'moment';
    import 'moment-timezone';
    import debounce from 'lodash/debounce';
    import { mapGetters, mapActions } from 'vuex';
    import Calendar from '@/components/Calendar';
    import UserSelect from '@/components/UserSelect';
    import TeamSidebar from '../../components/TeamSidebar';
    import TeamDayGraph from '../../components/TeamDayGraph';
    import TeamTableGraph from '../../components/TeamTableGraph';
    import TimezonePicker from '@/components/TimezonePicker';
    import DashboardReportService from '@/service/reports/dashboardReportService';
    import { getMimeType, downloadBlob } from '@/utils/file';
    import { getDateToday, getEndDay, getStartDay } from "@/utils/time";
    import ExportDropdown from "@/components/ExportDropdown";
    import TimeIntervalEdit from "../../components/TimeIntervalEdit";
    import { cloneDeep } from 'lodash';


    export default {
        name: 'Team',
        components: {
            Calendar,
            UserSelect,
            TeamSidebar,
            TeamDayGraph,
            TeamTableGraph,
            TimezonePicker,
            ExportDropdown,
            TimeIntervalEdit
        },
        data() {
            const today = this.getDateToday();

            return {
                type: localStorage.getItem('team.type') || 'day',
                start: localStorage.getItem('team.start') || today,
                end: localStorage.getItem('team.end') || today,
                userIDs: [],
                sort: localStorage.getItem('team.sort') || 'user',
                sortDir: localStorage.getItem('team.sort-dir') || 'asc',
                reportService: new DashboardReportService(),
                showExportModal: false,
                selectedIntervalIds: [],
                selectedScreenshots: [],
            };
        },
        mounted() {
            this.load();
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
                'timezone',
            ]),
            graphUsers() {
                const { worked } = this;

                return this.users.filter(user => this.userIDs.includes(user.id)).sort((a, b) => {
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
            exportFilename() {
                const days = moment(this.end).diff(this.start, 'days');

                return days > 1 ? `AT Report from ${this.start} to ${this.end}` : `AT Report ${this.start}`;
            },
        },
        methods: {
            getStartDay,
            getEndDay,
            getDateToday,
            ...mapActions({
                setTimezone: 'timeline/setTimezone',
            }),
            load: debounce(async function () {
                if (!this.userIDs.length) {
                    return;
                }

                this.service.loadUsers().then(users => {
                    const ids = users.map(user => user.id);
                    this.service.loadLatestIntervals(ids);
                });

                const startAt = this.getStartDay(this.start);
                const endAt = this.getEndDay(this.end);

                await this.service.load(this.userIDs, startAt, endAt);

                if (this.type === 'day') {
                    await this.service.loadScreenshots(this.userIDs, startAt, endAt);
                }

            }, 100),
            onCalendarChange({ type, start, end }) {
                this.type = type;
                this.start = start;
                this.end = end;

                localStorage['team.type'] = type;
                localStorage['team.start'] = start;
                localStorage['team.end'] = end;

                this.load();
            },
            onUsersChange(userIDs) {
                this.userIDs = [...userIDs];

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
                    headers: { 'Accept': mimetype },
                };

                const response = await this.reportService.getReport(this.start, this.end, this.userIDs, config);
                const blob = new Blob([response.data], { type: mimetype });
                const fileName = `${this.exportFilename}.${format}`;
                downloadBlob(blob, fileName);
            },
            onSelectedIntervals(event) {
                this.selectedIntervalIds = event.ids;
                this.selectedScreenshots = this.screenshots.filter(screenshot => this.selectedIntervalIds.includes(screenshot.time_interval.id));
            },
            onBulkRemove() {
                this.recalculateStatistic(this.selectedScreenshots);
                this.selectedIntervalIds = [];
                this.selectedScreenshots = [];
            },
            recalculateStatistic(screenshots) {
                screenshots.map(screenshot => {
                    const interval = screenshot.time_interval;
                    const totalIntervals = cloneDeep(this.intervals);
                    const userInterval = cloneDeep(this.intervals[interval.user_id]);

                    userInterval.duration -= moment(interval.end_at).diff(interval.start_at, 'seconds');
                    userInterval.intervals = userInterval.intervals.filter(int => int.id !== interval.id);

                    totalIntervals[interval.user_id] = userInterval;
                    this.$store.dispatch('timeline/setIntervals', totalIntervals);
                    this.$store.dispatch('timeline/setScreenshots', this.screenshots.filter(scr => scr.id !== screenshot.id));
                });
            },
            hideIntervalsEdit() {
                this.selectedScreenshots = [];
                this.selectedIntervalIds = [];
            }
        },
    };
</script>

<style lang="scss" scoped>
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
            border: 1px solid #EEEEF5;
            color: #B1B1BE;
            font-size: 15px;
            font-weight: 500;
            height: 40px;

            &.active {
                color: #FFFFFF;
                background: #2E2EF9;
            }
        }
    }

    .export {
        display: flex;
        align-items: center;
        justify-content: center;

        width: 40px;

        &::v-deep .at-btn__text {
            color: #2E2EF9;
            font-size: 25px;
        }
    }

    ::v-deep {
        .at-select {
            &__selection {
                border: 1px solid $gray-6;
            }
        }
    }
</style>
