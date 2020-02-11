<template>
    <at-select :value="value" @on-change="inputHandler($event)" v-if="Object.keys(languages).length > 0">
        <at-option v-for="(lang, index) in languages" :key="index" :value="lang.value">
            {{ lang.label }}
        </at-option>
    </at-select>
</template>

<script>
    import { mapGetters } from 'vuex';

    export default {
        name: "LanguageSelector",
        props: {
            value: {
                type: [Number, String],
                required: true,
            },
            inputHandler: {
                type: Function,
                required: true,
            },
        },

        computed: {
            ...mapGetters('lang', ['langList']),

            languages() {
                return Object.keys(this.langList).map(p => ({
                    value: p,
                    label: this.langList[p]
                }));
            }
        }
    }
</script>
