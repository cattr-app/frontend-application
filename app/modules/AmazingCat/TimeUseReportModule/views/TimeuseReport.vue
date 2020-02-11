<template>
    <div class="time-use-report">
        <h1 class="page-title">{{ $t('navigation.time-use-report') }}</h1>
        <div class="controls-row">
            <div class="calendar controls-row__item">
                <Calendar
                        :start="dates.start"
                        :end="dates.end"
                        @change="onCalendarChange"
                />
            </div>
            <div class="select controls-row__item">
                <UserSelect @change="onUsersChange"></UserSelect>
            </div>
            <div class="timezone controls-row__item">
                <TimezonePicker :value="timezone" :inputHandler="onTimezoneChange" />
            </div>
        </div>
        <div class="at-container">
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
    import { getDateToday, getEndDay, getStartDay } from '@/utils/time';
    import moment from 'moment';
    import Preloader from '@/components/Preloader';
    import UserSelect from '@/components/UserSelect';
    import TimezonePicker from '@/components/TimezonePicker';
    import Calendar from '@/components/Calendar';
    import {mapActions, mapGetters} from "vuex";

    export default {
        components: {
            List,
            Preloader,
            UserSelect,
            TimezonePicker,
            Calendar
        },
        data() {
            const today = getDateToday();

            return {
                dates: {
                    type: 'day',
                    start: today,
                    end: today,
                },
                userReportsList: [],
                user: new UsersService(),
                timeUseService: new TimeUseReportService(),
                isDataLoading: false,
                userIDs: []
            };
        },

        computed: {
            ...mapGetters("timeline", ["timezone"]),
        },

        methods: {
            getEndDay,
            getStartDay,
            getDateToday,

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
                const start_at = moment.tz(this.dates.start, this.timezone).startOf('day').toISOString();
                const end_at = moment.tz(this.dates.end, this.timezone).endOf('day').toISOString();

                const { data } = await this.timeUseService.getTimeUserReport({
                    user_ids: this.userIDs,
                    start_at,
                    end_at,
                    timezone: this.timezone
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

            onCalendarChange({start, end}) {
                this.dates.start = start;
                this.dates.end = end;
                this.getReport();
            },

            onTimezoneChange(timezone) {
                console.log(timezone);
                this.setTimezone(timezone);
                this.getReport();
            }
        },

        async mounted() {
            await this.sendRequests();
        }
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
</style>
