<template>
    <div class="project-reports">
        <h1 class="page-title">{{ $t('navigation.project-report') }}</h1>
        <div class="controls-row">
            <Calendar class="controls-row__item" :sessionStorageKey="sessionStorageKey" @change="onCalendarChange" />

            <UserSelect class="controls-row__item" @change="onUsersSelect" />

            <ProjectSelect class="controls-row__item" @change="onProjectsChange" />

            <div class="controls-row__item controls-row__item--left-auto">
                <small v-if="reportTimezone">{{ $t('project-report.report_timezone', [reportTimezone]) }}</small>
            </div>

            <ExportDropdown
                class="export-btn dropdown controls-row__btn controls-row__item"
                position="left-top"
                trigger="hover"
                @export="onExport"
            >
            </ExportDropdown>
        </div>

        <div class="at-container">
            <div class="total-time-row">
                <span class="total-time-label">Total Time</span>
                <span class="total-time-value">{{ formatDurationString(totalTime) }}</span>
            </div>

            <div v-if="Object.keys(projects).length && !isDataLoading">
                <project
                    v-for="project in projects"
                    :key="project.id"
                    :project="project"
                    :start="datepickerDateStart"
                    :end="datepickerDateEnd"
                ></project>
            </div>
            <div v-else class="at-container__inner no-data">
                <preloader v-if="isDataLoading"></preloader>
                <span>{{ $t('message.no_data') }}</span>
            </div>
        </div>
    </div>
</template>

<script>
    import UsersService from '@/service/resource/usersService';
    import ProjectService from '@/service/resource/projectService';
    import Calendar from '@/components/Calendar';
    import UserSelect from '@/components/UserSelect';
    import ProjectReportService from '@/service/reports/ProjectReportService';
    import Project from './ProjectReport/Project';
    import { getDateToday, getStartDate, getEndDate, formatDurationString } from '@/utils/time';
    import ProjectSelect from '@/components/ProjectSelect';
    import Preloader from '@/components/Preloader';
    import moment from 'moment';
    import ExportDropdown from '@/components/ExportDropdown';
    import { getMimeType, downloadBlob } from '@/utils/file';

    export default {
        components: {
            UserSelect,
            Calendar,
            Project,
            ProjectSelect,
            Preloader,
            ExportDropdown,
        },
        name: 'ProjectReport',

        data() {
            const today = this.getDateToday();
            const sessionStorageKey = 'amazingcat.session.storage.project_report';

            return {
                isDataLoading: false,
                projects: [],
                projectsList: [],
                projectReportsList: {},
                datepickerDateStart: this.getStartDate(today),
                datepickerDateEnd: this.getEndDate(today),
                reportTimezone: null,
                userIds: [],
                usersService: new UsersService(),
                projectService: new ProjectService(),
                reportService: new ProjectReportService(),
                sessionStorageKey: sessionStorageKey,
            };
        },
        computed: {
            exportFilename() {
                const days = moment(this.datepickerDateEnd).diff(this.datepickerDateStart, 'days');
                return days > 1
                    ? `AT Report from ${this.datepickerDateStart} to ${this.datepickerDateEnd}`
                    : `AT Report ${this.datepickerDateStart}`;
            },
            totalTime() {
                return this.projects.reduce((total, current) => total + current.project_time, 0);
            },
        },
        methods: {
            getStartDate,
            getEndDate,
            getDateToday,
            formatDurationString,

            onUsersSelect(uids) {
                this.userIds = uids;
                this.fetchData();
            },

            onProjectsChange(projectIDs) {
                this.projectsList = projectIDs;
                this.fetchData();
            },
            onCalendarChange({ start, end }) {
                this.datepickerDateStart = getStartDate(start);
                this.datepickerDateEnd = getStartDate(end);
                this.fetchData();
            },
            async fetchData() {
                this.isDataLoading = true;
                const timezone = this.$store.getters['timeline/timezone'];
                const { data } = await this.reportService.getProjects({
                    uids: this.userIds,
                    start_at: moment
                        .tz(this.datepickerDateStart, timezone)
                        .startOf('day')
                        .toISOString(),
                    end_at: moment
                        .tz(this.datepickerDateEnd, timezone)
                        .endOf('day')
                        .toISOString(),
                    pids: this.projectsList,
                });

                this.$set(this, 'projects', data.projects);
                this.reportTimezone = data.timezone;
                this.isDataLoading = false;
            },
            async onExport(format) {
                const mimetype = getMimeType(format);

                const config = {
                    headers: { Accept: mimetype },
                };

                const response = await this.reportService.getReport(
                    this.datepickerDateStart,
                    this.datepickerDateEnd,
                    this.userIds,
                    this.projectsList,
                    config,
                );

                const blob = new Blob([response.data], { type: mimetype });
                const fileName = `${this.exportFilename}.${format}`;
                downloadBlob(blob, fileName);
            },
        },
    };
</script>

<style lang="scss" scoped>
    .at-container {
        overflow: hidden;
    }

    .total-time-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 21px;
        color: $black-900;
        font-size: 2rem;
        font-weight: bold;
    }

    .no-data {
        text-align: center;
        font-weight: bold;
        position: relative;
    }

    .project-select {
        width: 240px;
    }
</style>
