<template>
    <div class="datetimeinput" @click="togglePopup" ref="datetimeinput">
        <div class="at-input">
            <at-input
                class="input"
                :readonly="true"
                :value="inputValue"
            />

            <transition name="slide-up">
                <div v-show="showPopup"
                    class="datepicker-wrapper at-select__dropdown at-select__dropdown--bottom"
                    @click.stop>
                    <date-picker
                        class="datepicker"
                        :append-to-body="false"
                        :clearable="false"
                        :editable="false"
                        :inline="true"
                        :lang="datePickerLang"
                        type="day"
                        :value="datePickerValue"
                        :disabled-date="disabledDate"
                        @change="onDateChange"
                    />

                    <ul class="hour-select">
                        <li v-for="h in hours" :key="h" class="item"
                            :class="{ 'selected': hour === h }"
                            @click="setHour(h)">
                            {{h.toString().padStart(2, '0')}}
                        </li>
                    </ul>

                    <ul class="minute-select">
                        <li v-for="m in minutes" :key="m" class="item"
                            :class="{ 'selected': minute === m }"
                            @click="setMinute(m)">
                            {{m.toString().padStart(2, '0')}}
                        </li>
                    </ul>
                </div>
            </transition>
        </div>
    </div>
</template>

<script>
    import moment from 'moment';

    const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm';

    export default {
        name: "DatetimeInput",
        props: {
            inputHandler: {
                type: Function,
                required: true,
            },
            value: {
                type: String,
                required: true,
            },
        },
        data() {
            return {
                showPopup: false,
            }
        },
        computed: {
            datePickerLang() {
                return {
                    formatLocale: { firstDayOfWeek: 1 },
                    monthFormat: 'MMMM',
                };
            },
            datePickerValue() {
                return moment(this.value).toDate();
            },
            inputValue() {
                return moment(this.value).format(DATETIME_FORMAT);
            },
            hours() {
                const hours = [];
                for (let i = 0; i < 24; i++) {
                    hours.push(i);
                }

                return hours;
            },
            minutes() {
                const minutes = [];
                for (let i = 0; i < 60; i += 5) {
                    minutes.push(i);
                }

                return minutes;
            },
            hour() {
                return moment(this.value).hours();
            },
            minute() {
                return moment(this.value).minutes();
            },
        },
        mounted() {
            window.addEventListener('click', this.hidePopup);

            const dateTimeStr = moment().startOf('day').toISOString();
            this.inputHandler(dateTimeStr);
            this.$emit('change', dateTimeStr);
        },
        beforeDestroy() {
            window.removeEventListener('click', this.hidePopup);
        },
        methods: {
            togglePopup() {
                this.showPopup = !this.showPopup;
            },
            hidePopup(event) {
                if (event.target.closest('.datetimeinput') !== this.$refs.datetimeinput) {
                    this.showPopup = false;
                }
            },
            onDateChange(value) {
                const dateTime = moment(value).hour(this.hour).minute(this.minute);
                const dateTimeStr = dateTime.toISOString();

                this.inputHandler(dateTimeStr);
                this.$emit('change', dateTimeStr);
            },
            setHour(value) {
                const dateTime = moment(this.value).hour(value);
                const dateTimeStr = dateTime.toISOString();

                this.inputHandler(dateTimeStr);
                this.$emit('change', dateTimeStr);
            },
            setMinute(value) {
                const dateTime = moment(this.value).minute(value);
                const dateTimeStr = dateTime.toISOString();

                this.inputHandler(dateTimeStr);
                this.$emit('change', dateTimeStr);
            },
            disabledDate(date) {
                return moment(date).isAfter(moment(), 'day');
            },
        },
    };
</script>

<style lang="scss" scoped>
    .input {
        background: #FFFFFF;
        width: 330px;
        height: 40px;
        border: 1px solid #C5D9E8;
        border-radius: 5px;
        cursor: pointer;

        &:hover {
            border: 1px solid #79A1EB;
        }

        &::v-deep {
            .at-input__original {
                border: 0;
                background: transparent;
            }

            .at-input__original {
                cursor: pointer;
            }
        }
    }

    .datetimeinput {
        display: inline-block;
    }

    .datepicker-wrapper {
        position: absolute;

        display: flex;
        flex-flow: row;
        align-items: stretch;

        width: 400px;
        height: 280px;
        max-height: unset;
    }

    .datepicker {
        flex: 1;
    }

    .datetimeinput::v-deep {
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

    .hour-select,
    .minute-select {
        padding: 5px;
        width: 50px;
        overflow-y: scroll;
        text-align: center;

        .item {
            padding: 3px;
            cursor: pointer;
        }

        .selected {
            background: #2E2EF9;
            color: #FFFFFF;
            border-radius: 7px;
        }
    }
</style>
