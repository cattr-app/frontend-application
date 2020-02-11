<template>
    <div>
        <at-select v-model="model" v-if="options" filterable :placeholder="$t('control.select')">
            <at-option
                    v-for="option of options" :key="option.value"
                    :value="option.value"
                    :label="option.label">
            </at-option>
        </at-select>
        <at-input v-else disabled></at-input>
    </div>
</template>

<script>
    export default {
        name: "ResourceSelect",
        props: {
            value: {
                type: [String, Number, Array],
                default: ''
            },
            service: {
                type: Object
            }
        },
        async mounted() {
            this.options = await this.service.getOptionList();
        },
        data() {
            return {
                options: null,
            }
        },
        computed: {
            model: {
                get() {
                    return this.value;
                },
                set(value) {
                    this.$emit('input', value)
                }
            }
        }
    }
</script>

<style lang="scss" scoped>

</style>
