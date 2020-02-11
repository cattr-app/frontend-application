<template>
    <div class="project-reports">
        <h1 class="page-title">{{ $t('navigation.project-report')}}</h1>
        <div class="controls-row">
            <calendar @change="onCalendarChange"
                      :start="datepicker.date.start"
                      :end="datepicker.date.end"
                      class="controls-row__item"
            >
            </calendar>

            <UserSelect @change="onUsersSelect" class="controls-row__item"></UserSelect>

            <multi-select class="project-select controls-row__item"
                          name="projects"
                          :inputHandler="selectedProjects"
                          :service="projectService">
            </multi-select>

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
            <div v-if="Object.keys(projects).length && !isDataLoading">
                <project v-for="project in projects" :key="project.id" :project="project"
                         :start="datepicker.date.start" :end="datepicker.date.end"></project>
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
import { getDateToday, getStartDate, getEndDate } from '@/utils/time';
import MultiSelect from '@/components/MultiSelect';
import Preloader from '@/components/Preloader';
import moment from 'moment';
import ExportDropdown from "@/components/ExportDropdown";
import { getMimeType, downloadBlob } from "@/utils/file";

export default {
    components: {
        UserSelect,
        Calendar,
        Project,
        MultiSelect,
        Preloader,
        ExportDropdown
    },
    name: 'ProjectReport',

    watch: {
        'datepicker.date': function () {
            this.fetchData();
        },
        userIds() {
            this.fetchData();
        },
    },
    data() {
        const today = this.getDateToday();
        return {
            isDataLoading: false,
            projects: [],
            projectsList: [],
            projectReportsList: {},
            datepicker: {
                date: {
                    start: this.getStartDate(today),
                    end: this.getEndDate(today),
                    type: 'day'
                }
            },
            reportTimezone: null,
            userIds: [],
            usersService: new UsersService(),
            projectService: new ProjectService(),
            reportService: new ProjectReportService()
        };
    },
    computed: {
        exportFilename() {
            const days = moment(this.datepicker.date.end).diff(this.datepicker.date.start, 'days');
            return days > 1
                ? `AT Report from ${this.datepicker.date.start} to ${this.datepicker.date.end}`
                : `AT Report ${this.datepicker.date.start}`;
        },
    },
    methods: {
        getStartDate,
        getEndDate,
        getDateToday,
        onUsersSelect(uids) {
            this.userIds = uids;
        },

        onCalendarChange(data) {
            this.datepicker.date = data;
        },

        async fetchData() {
            this.isDataLoading = true;
            const timezone = this.$store.getters['timeline/timezone'];
            const { data } = await this.reportService.getProjects({
                uids: this.userIds,
                start_at: moment.tz(this.datepicker.date.start, timezone).startOf('day').toISOString(),
                end_at: moment.tz(this.datepicker.date.end, timezone).endOf('day').toISOString(),
                pids: this.projectsList,
            });

            this.$set(this, 'projects', data.projects);
            this.reportTimezone = data.timezone;
            this.isDataLoading = false;
        },
        async onExport(format) {
            const mimetype = getMimeType(format);

            const config = {
                headers: { 'Accept': mimetype },
            };

            const response = await this.reportService.getReport(
                this.datepicker.date.start,
                this.datepicker.date.end,
                this.userIds, this.projectsList,
                config);

            const blob = new Blob([response.data], { type: mimetype });
            const fileName = `${this.exportFilename}.${format}`;
            downloadBlob(blob, fileName);
        },
        selectedProjects(values) {
            this.projectsList = values;
            this.fetchData();
        }
    },
};
</script>

<style lang="scss" scoped>
    .at-container {
        overflow: hidden;
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
