<template>
    <div class="timeline">
        <div class="row">
            <div class="col-5 pr-1">
                <div class="at-container sidebar">
                    <TimelineSidebar :active-task="activeTask" :isDataLoading="isDataLoading" />
                </div>
            </div>
            <div class="col-19">
                <div class="controls-row flex-between">
                    <div class="flex">
                        <Calendar
                            class="controls-row__item"
                            :range="false"
                            :sessionStorageKey="sessionStorageKey"
                            @change="onCalendarChange"
                        />
                        <TimezonePicker
                            class="controls-row__item"
                            :value="timezone"
                            @onTimezoneChange="onTimezoneChange"
                        />
                    </div>

                    <div class="flex">
                        <router-link
                            v-if="$store.getters['user/user'].manual_time"
                            to="/time-intervals/new"
                            class="controls-row__item"
                        >
                            <at-button class="controls-row__btn" icon="icon-edit">{{
                                $t('control.add_time')
                            }}</at-button>
                        </router-link>

                        <ExportDropdown
                            class="export-btn dropdown controls-row__btn controls-row__item"
                            position="left-top"
                            trigger="hover"
                            @export="onExport"
                        >
                        </ExportDropdown>
                    </div>
                </div>

                <div class="at-container">
                    <TimelineDayGraph
                        v-if="type === 'day'"
                        class="graph"
                        :start="start"
                        :end="end"
                        :events="userEvents"
                        :timezone="timezone"
                        @selectedIntervals="onIntervalsSelect"
                        @outsideClick="clearIntervals"
                    />
                    <TimelineCalendarGraph
                        v-else
                        class="graph"
                        :start="start"
                        :end="end"
                        :timePerDay="userTimePerDay"
                    />

                    <TimelineScreenshots
                        v-if="type === 'day' && screenshots && screenshots.length"
                        ref="timelineScreenshots"
                        @on-remove="recalculateStatistic"
                        @onSelectedIntervals="setSelectedIntervals"
                    />
                    <preloader v-if="isDataLoading" class="timeline__loader" :is-transparent="true"></preloader>

                    <time-interval-edit
                        :screenshots="selectedScreenshots"
                        :selected-interval-ids="selectedIntervalIds"
                        @remove="onBulkRemove"
                        @edit="loadData"
                    ></time-interval-edit>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import moment from 'moment';
    import debounce from 'lodash/debounce';
    import { mapGetters, mapActions } from 'vuex';
    import Calendar from '@/components/Calendar';
    import TimelineSidebar from '../../components/TimelineSidebar';
    import TimelineDayGraph from '../../components/TimelineDayGraph';
    import TimelineCalendarGraph from '../../components/TimelineCalendarGraph';
    import TimelineScreenshots from '../../components/TimelineScreenshots';
    import TimezonePicker from '@/components/TimezonePicker';
    import DashboardReportService from '@/service/reports/dashboardReportService';
    import { getMimeType, downloadBlob } from '@/utils/file';
    import { getDateToday, getEndDay, getStartDay } from '@/utils/time';
    import { getStartOfDayInTimezone, getEndOfDayInTimezone } from '@/utils/time';
    import ExportDropdown from '@/components/ExportDropdown';
    import cloneDeep from 'lodash/cloneDeep';
    import TimeIntervalEdit from '../../components/TimeIntervalEdit';
    import Preloader from '@/components/Preloader';

    const updateInterval = 60 * 1000;

    export default {
        name: 'Timeline',
        components: {
            Calendar,
            TimelineSidebar,
            TimelineDayGraph,
            TimelineCalendarGraph,
            TimelineScreenshots,
            TimezonePicker,
            ExportDropdown,
            TimeIntervalEdit,
            Preloader,
        },
        data() {
            const today = this.getDateToday();
            const sessionStorageKey = 'amazingcat.session.storage.timeline';

            return {
                type: 'day',
                start: today,
                end: today,
                datepickerDateStart: '',
                datepickerDateEnd: '',
                activeTask: +localStorage.getItem('timeline.active-task') || 0,
                reportService: new DashboardReportService(),
                showExportModal: false,
                selectedIntervalIds: [],
                selectedScreenshots: [],
                sessionStorageKey: sessionStorageKey,
                isDataLoading: false,
            };
        },
        mounted() {
            localStorage['dashboard.tab'] = 'timeline';
            this.loadData();
            this.updateHandle = setInterval(() => this.loadData(false), updateInterval);
        },
        beforeDestroy() {
            clearInterval(this.updateHandle);
            this.service.unloadIntervals();
            this.service.unloadScreenshots();
        },
        computed: {
            ...mapGetters('timeline', [
                'service',
                'screenshots',
                'events',
                'intervals',
                'timePerDay',
                'timePerProject',
                'timezone',
            ]),
            ...mapGetters('user', ['user']),
            userEvents() {
                if (!this.user || !this.user.id || !this.events[this.user.id]) {
                    return [];
                }

                return this.events[this.user.id];
            },
            userTimePerDay() {
                if (!this.user || !this.user.id || !this.timePerDay[this.user.id]) {
                    return {};
                }

                return this.timePerDay[this.user.id];
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
            loadData: debounce(async function(withLoadingIndicator = true) {
                this.isDataLoading = withLoadingIndicator;

                if (!this.user || !this.user.id) {
                    this.isDataLoading = false;

                    return;
                }

                const userIDs = [this.user.id];
                const projectIDs = [];

                const startAt = this.getStartOfDayInTimezone(this.start, this.timezone);
                const endAt = this.getEndOfDayInTimezone(this.end, this.timezone);

                await this.service.load(userIDs, projectIDs, startAt, endAt);

                this.isDataLoading = false;

                if (this.type === 'day') {
                    await this.service.loadScreenshots(userIDs, startAt, endAt);
                }
            }, 1000),
            onCalendarChange({ type, start, end }) {
                this.type = type;
                this.start = start;
                this.end = end;

                this.service.unloadIntervals();
                this.service.unloadScreenshots();

                this.loadData();
            },
            onIntervalsSelect(event) {
                this.activeTask = event.task_id;
                localStorage['timeline.active-task'] = event.task_id;

                this.selectedIntervalIds = event.ids;
                this.selectedScreenshots = this.screenshots.filter(screenshot =>
                    this.selectedIntervalIds.includes(screenshot.time_interval.id),
                );
            },
            async onExport(format) {
                const mimetype = getMimeType(format);

                const config = {
                    headers: { Accept: mimetype },
                };

                const params = {
                    start_at: this.start,
                    end_at: this.end,
                    user_ids: [this.user.id],
                    project_ids: this.projectIDs,
                };

                const response = await this.reportService.getReport(params, config);
                const blob = new Blob([response.data], { type: mimetype });
                const fileName = `${this.exportFilename}.${format}`;
                downloadBlob(blob, fileName);
            },
            onBulkRemove() {
                this.recalculateStatistic(this.selectedScreenshots);
                this.clearIntervals();
            },
            onTimezoneChange(timezone) {
                this.setTimezone(timezone);
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
            setSelectedIntervals(intervalIds) {
                this.selectedScreenshots = this.screenshots.filter(screenshot =>
                    intervalIds.includes(screenshot.time_interval_id),
                );
                this.selectedIntervalIds = intervalIds;
            },
            clearIntervals() {
                if (this.$refs.timelineScreenshots) {
                    this.$refs.timelineScreenshots.clearSelectedIntervals();
                }
                this.selectedScreenshots = [];
                this.selectedIntervalIds = [];
            },
        },
        watch: {
            user() {
                this.loadData();
            },
            timezone() {
                this.service.unloadIntervals();
                this.loadData();
            },
        },
    };
</script>

<style lang="scss" scoped>
    .at-container {
        position: relative;
        padding: 1em;

        &:not(:last-child) {
            padding-right: 1.5em;
        }
    }

    .sidebar {
        padding: 30px 0;
    }

    .timeline {
        &__loader {
            z-index: 0;
            border-radius: 20px;
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

    .controls-row {
        z-index: 1;
        position: relative;
    }

    .graph {
        width: 100%;
    }

    .pr-1 {
        padding-right: 1em;
    }

    ::v-deep {
        .at-select {
            &__selection {
                border: 1px solid $gray-6;
            }
        }
    }
</style>
