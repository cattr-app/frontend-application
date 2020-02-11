<template>
    <div class="calendar" @click.stop="togglePopup">
        <at-input
                class="input"
                :readonly="true"
                :value="inputValue"
        >
            <template v-slot:prepend>
                <div class="previous" @click.stop.prevent="selectPrevious">&lt;</div>
            </template>

            <template v-slot:append>
                <div class="next" @click.stop.prevent="selectNext">&gt;</div>
            </template>
        </at-input>

        <span class="calendar-icon icon icon-calendar"></span>

        <transition name="slide-up">
            <div v-show="showPopup" :class="{
                'datepicker-wrapper': true,
                'datepicker-wrapper--range': datePickerRange,
                'at-select__dropdown at-select__dropdown--bottom': true
            }" @click.stop>
                <div>
                    <at-tabs :value="tab" @on-change="onTabChange">
                        <at-tab-pane v-if="day" :label="$t('control.day')" name="day"></at-tab-pane>
                        <at-tab-pane v-if="week" :label="$t('control.week')" name="week"></at-tab-pane>
                        <at-tab-pane v-if="month" :label="$t('control.month')" name="month"></at-tab-pane>
                        <at-tab-pane v-if="range" :label="$t('control.range')" name="range"></at-tab-pane>
                    </at-tabs>
                </div>

                <date-picker
                        class="datepicker"
                        :append-to-body="false"
                        :clearable="false"
                        :editable="false"
                        :inline="true"
                        :lang="datePickerLang"
                        :type="datePickerType"
                        :range="datePickerRange"
                        :value="datePickerValue"
                        @change="onDateChange"
                >
                </date-picker>
            </div>
        </transition>
    </div>
</template>

<script>
    import moment from 'moment';

    export default {
        name: 'Calendar',
        props: {
            start: {
                type: String,
                required: true,
            },
            end: {
                type: String,
                required: true,
            },
            range: {
                type: Boolean,
                default: true,
            },
            day: {
                type: Boolean,
                default: true
            },
            week: {
                type: Boolean,
                default: true
            },
            month: {
                type: Boolean,
                default: true
            },
            initialTab: {
                type: String,
            },
        },
        data() {
            return {
                tab: this.initialTab || 'day',
                showPopup: false,
            };
        },
        mounted() {
            window.addEventListener('click', this.hidePopup);
        },
        beforeDestroy() {
            window.removeEventListener('click', this.hidePopup);
        },
        computed: {
            inputValue() {
                switch (this.tab) {
                    case 'date':
                    default:
                        return moment(this.start, 'YYYY-MM-DD').locale(this.$i18n.locale).format('MMM. DD, YYYY');

                    case 'week': {
                        const start = moment(this.start, 'YYYY-MM-DD').locale(this.$i18n.locale).startOf('isoWeek');
                        const end = moment(this.end, 'YYYY-MM-DD').locale(this.$i18n.locale).endOf('isoWeek');
                        if (start.month() === end.month()) {
                            return start.format('MMM. DD-') + end.format('DD, YYYY');
                        }

                        return start.format('MMM. DD — ') + end.format('MMM. DD, YYYY');
                    }

                    case 'month':
                        return moment(this.start, 'YYYY-MM-DD').locale(this.$i18n.locale).startOf('month').format('MMM., YYYY');

                    case 'range': {
                        const start = moment(this.start, 'YYYY-MM-DD').locale(this.$i18n.locale);
                        const end = moment(this.end, 'YYYY-MM-DD').locale(this.$i18n.locale);
                        if (start.month() === end.month() && start.year() === end.year()) {
                            return start.format('MMM. DD, ') + end.format('DD, YYYY');
                        } else if (start.year() === end.year()) {
                            return start.locale(this.$i18n.locale).format('MMM. DD, — ')
                                + end.locale(this.$i18n.locale).format('MMM. DD, YYYY');
                        } else {
                            return start.locale(this.$i18n.locale).format('MMM. DD, YYYY — ')
                                + end.locale(this.$i18n.locale).format('MMM. DD, YYYY');
                        }
                    }
                }
            },
            datePickerLang() {
                return {
                    formatLocale: { firstDayOfWeek: 1 },
                    monthFormat: 'MMMM',
                };
            },
            datePickerType() {
                switch (this.tab) {
                    case 'day':
                    case 'range':
                    default:
                        return 'date';

                    case 'week':
                        return 'week';

                    case 'month':
                        return 'month';
                }
            },
            datePickerRange() {
                return this.tab === 'range';
            },
            datePickerValue() {
                if (this.tab === 'range') {
                    return [
                        moment(this.start, 'YYYY-MM-DD').toDate(),
                        moment(this.end, 'YYYY-MM-DD').toDate(),
                    ];
                }

                return moment(this.start, 'YYYY-MM-DD').toDate();
            },
        },
        methods: {
            togglePopup() {
                this.showPopup = !this.showPopup;
            },
            hidePopup() {
                this.showPopup = false;
            },
            selectPrevious() {
                let start, end;
                switch (this.tab) {
                    case 'day':
                    default: {
                        const date = moment(this.start).subtract(1, 'day').format('YYYY-MM-DD');
                        start = date;
                        end = date;
                        break;
                    }

                    case 'week': {
                        const date = moment(this.start).subtract(1, 'week');
                        start = date.startOf('isoWeek').format('YYYY-MM-DD');
                        end = date.endOf('isoWeek').format('YYYY-MM-DD');
                        break;
                    }

                    case 'month': {
                        const date = moment(this.start).subtract(1, 'month');
                        start = date.startOf('month').format('YYYY-MM-DD');
                        end = date.endOf('month').format('YYYY-MM-DD');
                        break;
                    }

                    case 'range': {
                        const diff = moment(this.end).diff(this.start, 'days') + 1;
                        start = moment(this.start).subtract(diff, 'days').format('YYYY-MM-DD');
                        end = moment(this.end).subtract(diff, 'days').format('YYYY-MM-DD');
                        break;
                    }
                }

                this.$emit('change', {
                    type: this.tab,
                    start,
                    end,
                });
            },
            selectNext() {
                let start, end;
                switch (this.tab) {
                    case 'day':
                    default: {
                        const date = moment(this.start).add(1, 'day').format('YYYY-MM-DD');
                        start = date;
                        end = date;
                        break;
                    }

                    case 'week': {
                        const date = moment(this.start).add(1, 'week');
                        start = date.startOf('isoWeek').format('YYYY-MM-DD');
                        end = date.endOf('isoWeek').format('YYYY-MM-DD');
                        break;
                    }

                    case 'month': {
                        const date = moment(this.start).add(1, 'month');
                        start = date.startOf('month').format('YYYY-MM-DD');
                        end = date.endOf('month').format('YYYY-MM-DD');
                        break;
                    }

                    case 'range': {
                        const diff = moment(this.end).diff(this.start, 'days') + 1;
                        start = moment(this.start).add(diff, 'days').format('YYYY-MM-DD');
                        end = moment(this.end).add(diff, 'days').format('YYYY-MM-DD');
                        break;
                    }
                }

                this.$emit('change', {
                    type: this.tab,
                    start,
                    end,
                });
            },
            onTabChange({ index, name }) {
                // Needed to force redraw of the date-picker
                this.tab = 'range';
                this.$nextTick(() => {
                    this.tab = name;
                });
            },
            onDateChange(value) {
                this.showPopup = false;

                let start, end;
                switch (this.tab) {
                    case 'day':
                    default: {
                        const date = moment(value).format('YYYY-MM-DD');
                        start = date;
                        end = date;
                        break;
                    }

                    case 'week':
                        start = moment(value).startOf('isoWeek').format('YYYY-MM-DD');
                        end = moment(value).endOf('isoWeek').format('YYYY-MM-DD');
                        break;

                    case 'month':
                        start = moment(value).startOf('month').format('YYYY-MM-DD');
                        end = moment(value).endOf('month').format('YYYY-MM-DD');
                        break;

                    case 'range':
                        start = moment(value[0]).format('YYYY-MM-DD');
                        end = moment(value[1]).format('YYYY-MM-DD');
                        break;
                }

                this.$emit('change', {
                    type: this.tab,
                    start,
                    end,
                });
            },
        },
    };
</script>

<style lang="scss" scoped>
    .calendar {
        position: relative;
    }

    .calendar-icon {
        position: absolute;
        top: 0;
        right: 2em;
        color: #2E2EF9;
        line-height: 40px;
        pointer-events: none;
    }

    .input {
        background: #FFFFFF;
        width: 330px;
        height: 40px;
        border: 1px solid #EEEEF5;
        border-radius: 5px;

        cursor: pointer;

        &::v-deep {
            .at-input-group__prepend,
            .at-input-group__append,
            .at-input__original {
                border: 0;
                background: transparent;
            }

            .at-input-group__prepend,
            .at-input-group__append {
                padding: 0;
                font-weight: bold;
            }

            .at-input__original {
                cursor: pointer;
            }
        }

        .fa-calendar {
            color: #2E2EF9;
        }

        .previous,
        .next {
            color: #2E2EF9;

            display: flex;
            flex-flow: row nowrap;
            align-items: center;
            justify-content: center;

            width: 28px;
            height: 100%;

            cursor: pointer;
            user-select: none;
        }
    }

    .datepicker-wrapper {
        position: absolute;
        width: 320px;
        max-height: unset;

        &--range {
            width: 640px;
        }
    }

    .calendar::v-deep {
        .at-tabs__header {
            margin-bottom: 0;
        }

        .at-tabs-nav {
            display: flex;
            flex-flow: row nowrap;
            justify-content: space-between;
        }

        .at-tabs-nav__item {
            color: #C4C4CF;
            font-size: 15px;
            font-weight: 600;
            margin-right: 0;
            padding: 0;

            flex: 1;
            text-align: center;

            &--active {
                color: #2E2EF9;
            }

            &::after {
                background-color: #2E2EF9;
            }
        }

        .mx-datepicker {
            max-height: unset;
        }

        .mx-datepicker-main,
        .mx-datepicker-inline {
            border: none;
        }

        .mx-datepicker-header {
            padding: 0;
            border-bottom: none;
        }

        .mx-calendar {
            width: unset;
        }

        .mx-calendar-content {
            width: unset;
        }

        .mx-calendar-header {
            & > .mx-btn-text {
                padding: 0;
                width: 34px;
                text-align: center;
            }
        }

        .mx-calendar-header-label .mx-btn {
            color: #1A051D;
        }

        .mx-table thead {
            color: #B1B1BE;
            font-weight: 600;
            text-transform: uppercase;
        }

        .mx-week-number-header,
        .mx-week-number {
            display: none;
        }

        .mx-table-date td {
            font-size: 13px;
        }

        .mx-table-date .cell:last-child {
            color: #FF5569;
        }

        .mx-table {
            .cell.not-current-month {
                color: #E7ECF2;
            }

            .cell.active {
                background: transparent;

                & > div {
                    display: inline-block;
                    background: #2E2EF9;
                    color: #FFFFFF;
                    border-radius: 7px;
                    width: 25px;
                    height: 25px;
                    line-height: 25px;
                }
            }

            .cell.in-range {
                background: transparent;

                & > div {
                    display: inline-block;
                    background: #EEEEF5;
                    color: inherit;
                    border-top-left-radius: 5px;
                    border-bottom-left-radius: 5px;
                    width: 100%;
                    height: 22px;
                    line-height: 22px;
                }

                &:last-child > div {
                    border-top-right-radius: 5px;
                    border-bottom-right-radius: 5px;
                }
            }

            .cell.in-range + .cell.in-range > div {
                border-top-left-radius: 0;
                border-bottom-left-radius: 0;
            }

            .mx-active-week {
                background: transparent;

                .cell > div {
                    border-radius: 0;
                }

                .cell:nth-child(3) > div {
                    border-top-left-radius: 5px;
                    border-bottom-left-radius: 5px;
                }

                .cell:nth-child(7) > div {
                    border-top-right-radius: 5px;
                    border-bottom-right-radius: 5px;
                }

                .cell + .cell:not(:last-child) > div {
                    display: inline-block;
                    background: #EEEEF5;
                    color: #151941;
                    width: 100%;
                    height: 22px;
                    line-height: 22px;
                }

                .mx-week-number + .cell > div,
                .cell:last-child > div {
                    display: inline-block;
                    background: #2E2EF9;
                    color: #FFFFFF;
                    border-radius: 7px;
                    width: 25px;
                    height: 25px;
                    line-height: 25px;
                }
            }
        }

        .mx-table-month {
            color: #000000;

            .cell {
                height: 50px;
            }

            .cell.active > div {
                border-radius: 5px;
                width: 54px;
                height: 30px;
            }
        }

        .mx-table-year {
            color: #000000;

            .cell.active > div {
                width: 54px;
            }
        }

        .mx-btn:hover {
            color: #2E2EF9;
        }

        .mx-table .cell.today {
            color: #2a90e9;
        }
    }
</style>
