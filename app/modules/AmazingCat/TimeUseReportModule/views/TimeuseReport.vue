<template>
    <div class="time-use-report">
        <h1 class="page-title">{{ $t('navigation.time-use-report') }}</h1>
        <div class="controls-row">
            <div class="calendar controls-row__item">
                <Calendar :sessionStorageKey="sessionStorageKey" @change="onCalendarChange" />
            </div>
            <div class="select controls-row__item">
                <UserSelect @change="onUsersChange"></UserSelect>
            </div>
            <div class="timezone controls-row__item">
                <TimezonePicker :value="timezone" @onTimezoneChange="onTimezoneChange" />
            </div>
        </div>
        <div class="at-container">
            <div class="total-time-row">
                <span class="total-time-label">Total Time</span>
                <span class="total-time-value">{{ formatDurationString(totalTime) }}</span>
            </div>
            <div v-if="Object.keys(userReportsList).length && !isDataLoading">
                <list :reportsList="userReportsList"></list>
            </div>
            <div v-else class="at-container__inner no-data">
                <preloader v-if="isDataLoading"></preloader>
                <span>{{ $t('message.no_data') }}</span>
            </div>
        </div>
    </div>
</template>

<script>
    import List from './TimeUseReport/List';
    import UsersService from '@/service/resource/usersService';
    import TimeUseReportService from '@/service/reports/TimeUseReportService';
    import { formatDurationString } from '@/utils/time';
    import moment from 'moment';
    import Preloader from '@/components/Preloader';
    import UserSelect from '@/components/UserSelect';
    import TimezonePicker from '@/components/TimezonePicker';
    import Calendar from '@/components/Calendar';
    import { mapActions, mapGetters } from 'vuex';

    export default {
        components: {
            List,
            Preloader,
            UserSelect,
            TimezonePicker,
            Calendar,
        },
        data() {
            const sessionStorageKey = 'amazingcat.session.storage.timeuse_report';

            return {
                datepickerDateStart: '',
                datepickerDateEnd: '',
                userReportsList: [],
                user: new UsersService(),
                timeUseService: new TimeUseReportService(),
                isDataLoading: false,
                userIDs: [],
                sessionStorageKey: sessionStorageKey,
            };
        },
        computed: {
            ...mapGetters('timeline', ['timezone']),
            totalTime() {
                return this.userReportsList.reduce((total, current) => total + current.total_time, 0);
            },
        },
        methods: {
            formatDurationString,

            ...mapActions({
                setTimezone: 'timeline/setTimezone',
            }),
            async sendRequests() {
                this.users = (await this.user.getAll()).data;
                await this.getReport();
            },
            async getReport() {
                if (this.userIDs === 'undefined') {
                    return;
                }

                this.isDataLoading = true;
                const start_at = moment
                    .tz(this.datepickerDateStart, this.timezone)
                    .startOf('day')
                    .toISOString();
                const end_at = moment
                    .tz(this.datepickerDateEnd, this.timezone)
                    .endOf('day')
                    .toISOString();

                const { data } = await this.timeUseService.getTimeUserReport({
                    user_ids: this.userIDs,
                    start_at,
                    end_at,
                    timezone: this.timezone,
                });
                this.userReportsList = data;
                this.isDataLoading = false;
            },
            onUsersChange(userIDs) {
                this.userIDs = userIDs;
                if (this._isMounted) {
                    this.getReport();
                }
            },
            onCalendarChange({ start, end }) {
                this.datepickerDateStart = start;
                this.datepickerDateEnd = end;
                this.getReport();
            },
            onTimezoneChange(timezone) {
                this.setTimezone(timezone);
                this.getReport();
            },
        },
        async mounted() {
            await this.sendRequests();
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

    .timezone::v-deep {
        .at-select {
            &__selection,
            &__selection:hover {
                border: 1px solid $gray-6;
            }
        }
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
</style>
