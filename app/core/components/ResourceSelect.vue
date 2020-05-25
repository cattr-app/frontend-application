<template>
    <div>
        <at-select v-if="options" ref="select" v-model="model" :placeholder="$t('control.select')" filterable>
            <at-option
                v-for="option of options"
                :key="option.value"
                :label="ucfirst(option.label)"
                :value="option.value"
            >
            </at-option>
        </at-select>
        <at-input v-else disabled></at-input>
    </div>
</template>

<script>
    import { ucfirst } from '@/utils/string';

    export default {
        name: 'ResourceSelect',
        props: {
            value: {
                type: [String, Number, Array],
                default: '',
            },
            service: {
                type: Object,
            },
        },
        async mounted() {
            this.options = await this.service.getOptionList();
            await this.$nextTick();
            if ('select' in this.$refs) {
                this.$refs.select.$children.forEach(option => {
                    option.hidden = false;
                });
            }
        },
        data() {
            return {
                options: null,
            };
        },
        methods: {
            ucfirst,
        },
        computed: {
            model: {
                get() {
                    return this.value;
                },
                set(value) {
                    this.$emit('input', value);
                },
            },
        },
    };
</script>
