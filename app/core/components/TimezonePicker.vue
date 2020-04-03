<template>
    <at-select
        ref="select"
        :value="typeof value === 'object' ? '' : value"
        filterable
        :placeholder="$t('control.select')"
        @on-change="inputHandler($event)"
    >
        <at-option v-for="(zone, index) in zones" :key="index" :value="zone.value">{{ zone.label }} </at-option>
    </at-select>
</template>

<script>
    import moment from 'moment';
    import 'moment-timezone';
    import { getZones, getCountryName } from '../utils/time';

    export default {
        props: {
            value: {
                type: [String, Object],
                required: true,
            },
        },
        computed: {
            zones() {
                return getZones().reduce((total, { iso, zones }) => {
                    const countryName = getCountryName(iso);

                    return total.concat(
                        zones.map(zoneName => {
                            const shortZoneName = zoneName
                                .replace(/_/g, ' ')
                                .split('/')
                                .pop();
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
                        }),
                    );
                }, []);
            },
        },
        methods: {
            inputHandler(value) {
                this.$emit('onTimezoneChange', value);
            },
            openItemsInOptions: async function() {
                await this.$nextTick();
                if (this.$refs.select !== undefined) {
                    this.$refs.select.$children.forEach(option => {
                        option.hidden = false;
                    });
                }
            },
        },
        mounted() {
            this.openItemsInOptions();
        },
        beforeUpdate() {
            this.openItemsInOptions();
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
