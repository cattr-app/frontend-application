<template>
    <at-select
        :value="value"
        :filterable="true"
        v-model="zone"
        :placeholder="$t('control.select')"
    >
        <at-option
            v-for="zone in values"
            :key="zone.value"
            :value="zone.value"
        >{{ zone.label }}
        </at-option>
    </at-select>
</template>

<script>
    import moment from 'moment';
    import 'moment-timezone';
    import { getZones, getCountryName } from '../utils/time';

    export default {
        name: 'TimezonePicker',
        props: {
            value: {
                type: String,
                required: true,
            },
            inputHandler: {
                required: true,
                type: Function
            }
        },
        data() {
            return {
                zone: this.value
            }
        },
        computed: {
            values() {
                return getZones().reduce((total, { iso, zones }) => {
                    const countryName = getCountryName(iso);

                    return total.concat(zones.map(zoneName => {
                        const shortZoneName = zoneName.replace(/_/g, ' ').split('/').pop();
                        const offset = moment.tz(zoneName).format('Z');

                        if (zones.length === 1) {
                            return {
                                value: zoneName,
                                label: `${countryName} (GMT${offset})`,
                            };
                        }

                        return {
                            value: zoneName,
                            label: `${countryName} - ${shortZoneName} (GMT${offset})`,
                        };
                    }));
                }, []);
            },
        },

        watch: {
            zone() {
                this.onChange(this.zone)
            }
        },

        methods: {
            onChange(value) {
                this.inputHandler(value);
            },
        },
    };
</script>

<style lang="scss" scoped>
    ::v-deep {
        .at-select {

            &__selection {
                min-width: 240px;
            }

            &__input {
                padding-right: $spacing-04;
            }
        }
    }
</style>
