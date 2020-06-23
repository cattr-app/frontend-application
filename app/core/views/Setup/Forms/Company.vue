<template>
    <validation-observer ref="validateObs">
        <validation-provider v-slot="{ errors }" rules="required" name="Timezone">
            <small>Timezone</small>
            <timezone-picker :value="companyForm.timezone" @onTimezoneChange="onTimezoneChange" />
            <p>{{ errors[0] }}</p>
        </validation-provider>

        <validation-provider v-slot="{ errors }" rules="required" name="Language">
            <small>Language</small>
            <at-select v-model="companyForm.language">
                <at-option v-for="(language, index) in languageList" :key="index" :value="index">{{
                    language
                }}</at-option>
            </at-select>
            <p>{{ errors[0] }}</p>
        </validation-provider>
    </validation-observer>
</template>

<script>
    import { ValidationObserver, ValidationProvider } from 'vee-validate';
    import TimezonePicker from '@/components/TimezonePicker.vue';

    export default {
        name: 'company',
        components: {
            ValidationProvider,
            ValidationObserver,
            TimezonePicker,
        },
        props: {
            storage: {},
        },
        data() {
            return {
                companyForm: {
                    timezone: '',
                    language: '',
                },
                disabledForm: false,
                status: 'process',
            };
        },
        mounted() {
            if (this.storage['company'].hasOwnProperty('companyParams')) {
                this.companyForm = this.storage['company'].companyParams;
            }
            this.$emit('setState', { company: { status: this.status } });
        },
        computed: {
            languageList() {
                return this.$store.getters['lang/langList'];
            },
        },
        methods: {
            onTimezoneChange(val) {
                this.companyForm.timezone = val;
            },
        },
        watch: {
            companyForm: {
                handler(val) {
                    if (val.timezone && val.language) {
                        this.status = 'finish';
                        this.$emit('setState', { company: { status: this.status, companyParams: this.companyForm } });
                    } else {
                        this.status = 'process';
                    }
                },
                deep: true,
            },
        },
    };
</script>

<style></style>
