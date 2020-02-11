<template>
    <div class="timeline">
        <div class="row">
            <div class="col-5 pr-1">
                <div class="section sidebar">
                    <TimelineSidebar :active-task="activeTask"/>
                </div>
            </div>
            <div class="col-19">
                <div class="controls-row flex-between">
                    <Calendar
                            class="controls-row__item"
                            :start="start"
                            :end="end"
                            :range="false"
                            :initialTab="type"
                            @change="onCalendarChange"
                    />

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
                                class="export-btn dropdown controls-row__btn controls-row__item"
                                position="left-top"
                                trigger="hover"
                                @export="onExport"
                        >
                        </ExportDropdown>
                    </div>
                </div>

                <div class="section">
                    <TimelineDayGraph v-if="type === 'day'"
                                      class="graph"
                                      :start="start"
                                      :end="end"
                                      :events="userEvents"
                                      @selectedIntervals="onSelectedIntervals"
                                      @outsideClick="hideIntervalsEdit"
                    />
                    <TimelineCalendarGraph v-else
                                           class="graph"
                                           :start="start"
                                           :end="end"
                                           :timePerDay="userTimePerDay"
                    />

                    <TimelineScreenshots
                            ref="timelineScreenshots"
                            v-if="type === 'day' && screenshots && screenshots.length"
                            @on-remove="recalculateStatistic"
                            @onSelectedIntervals="setSelectedIntervals"
                    />
                </div>

                <time-interval-edit
                        :screenshots="selectedScreenshots"
                        :selected-interval-ids="selectedIntervalIds"
                        @remove="onBulkRemove"
                        @edit="loadData"
                ></time-interval-edit>
            </div>
        </div>
    </div>
</template>

<script>
    import moment from 'moment';
    import debounce from 'lodash/debounce';
    import { mapGetters } from 'vuex';
    import Calendar from '@/components/Calendar';
    import TimelineSidebar from '../../components/TimelineSidebar';
    import TimelineDayGraph from '../../components/TimelineDayGraph';
    import TimelineCalendarGraph from '../../components/TimelineCalendarGraph';
    import TimelineScreenshots from '../../components/TimelineScreenshots';
    import DashboardReportService from '@/service/reports/dashboardReportService';
    import { getMimeType, downloadBlob } from '@/utils/file';
    import { getDateToday, getEndDay, getStartDay } from "@/utils/time";
    import ExportDropdown from "@/components/ExportDropdown";
    import { cloneDeep } from 'lodash';
    import TimeIntervalEdit from "../../components/TimeIntervalEdit";

    export default {
        name: 'Timeline',
        components: {
            Calendar,
            TimelineSidebar,
            TimelineDayGraph,
            TimelineCalendarGraph,
            TimelineScreenshots,
            ExportDropdown,
            TimeIntervalEdit
        },
        data() {
            const today = this.getDateToday();

            return {
                type: localStorage.getItem('timeline.type') || 'day',
                start: localStorage.getItem('timeline.start') || today,
                end: localStorage.getItem('timeline.end') || today,
                activeTask: +localStorage.getItem('timeline.active-task') || 0,
                reportService: new DashboardReportService(),
                showExportModal: false,
                selectedIntervalIds: [],
                selectedScreenshots: [],
            };
        },
        mounted() {
            this.loadData();
        },
        computed: {
            ...mapGetters('timeline', [
                'service',
                'screenshots',
                'events',
                'intervals',
                'timePerDay',
                'timePerProject',
            ]),
            ...mapGetters('user', [
                'user',
            ]),
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

                return days > 1 ? `AT Report from ${this.start} to ${this.end}` : `AT Report ${this.start}`;
            },
        },
        methods: {
            getStartDay,
            getEndDay,
            getDateToday,
            loadData: debounce(async function () {
                if (!this.user || !this.user.id) {
                    return;
                }

                const userIDs = [this.user.id];

                const startAt = this.getStartDay(this.start);
                const endAt = this.getEndDay(this.end);

                await this.service.load(userIDs, startAt, endAt);

                if (this.type === 'day') {
                    await this.service.loadScreenshots(userIDs, startAt, endAt);
                }
            }, 100),
            onCalendarChange({ type, start, end }) {
                this.type = type;
                this.start = start;
                this.end = end;

                localStorage['timeline.type'] = type;
                localStorage['timeline.start'] = start;
                localStorage['timeline.end'] = end;

                this.loadData();
            },
            onSelectedIntervals(event) {
                this.activeTask = event.task_id;
                localStorage['timeline.active-task'] = event.task_id;

                this.selectedIntervalIds = event.ids;
                this.selectedScreenshots = this.screenshots.filter(screenshot => this.selectedIntervalIds.includes(screenshot.time_interval.id));
            },
            async onExport(format) {
                const mimetype = getMimeType(format);

                const config = {
                    headers: { 'Accept': mimetype },
                };

                const response = await this.reportService.getReport(this.start, this.end, [this.user.id], config);
                const blob = new Blob([response.data], { type: mimetype });
                const fileName = `${this.exportFilename}.${format}`;
                downloadBlob(blob, fileName);

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
            setSelectedIntervals(intervalIds) {
                this.selectedScreenshots = this.screenshots.filter(screenshot => intervalIds.includes(screenshot.time_interval.id));
                this.selectedIntervalIds = intervalIds;
            },
            hideIntervalsEdit() {
                if (this.$refs.timelineScreenshots) {
                    this.$refs.timelineScreenshots.clearSelectedIntervals();
                }
                this.selectedScreenshots = [];
                this.selectedIntervalIds = [];
            }
        },
        watch: {
            user() {
                this.loadData();
            },
        },
    };
</script>

<style lang="scss" scoped>
    .section {
        background: #FFFFFF;
        border: 1px solid #DFE5ED;
        box-sizing: border-box;
        box-shadow: 0px 0px 100px rgba(63, 51, 86, 0.1);
        border-radius: 20px;

        padding: 1em;

        &:not(:last-child) {
            padding-right: 1.5em;
        }
    }

    .sidebar {
        padding: 30px 0;
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

    .graph {
        width: 100%;
    }

    .pr-1 {
        padding-right: 1em;
    }
</style>
