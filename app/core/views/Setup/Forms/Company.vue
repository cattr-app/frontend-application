<template>
    <validation-observer ref="validateObs">
        <validation-provider v-slot="{ errors }" rules="required" name="Timezone">
            <small>{{ $t('setup.header.company.timezone') }}</small>
            <timezone-picker :value="companyForm.timezone" @onTimezoneChange="onTimezoneChange" />
            <p>{{ errors[0] }}</p>
        </validation-provider>

        <validation-provider v-slot="{ errors }" rules="required" name="Language">
            <small>{{ $t('setup.header.company.language') }}</small>
            <at-select v-model="companyForm.language" :placeholder="$t('control.select')" @on-change="onLanguage">
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
    import { getLangCookie, setLangCookie } from '@/i18n/index';

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

            const lang = getLangCookie();
            if (lang) {
                this.companyForm.language = lang;
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
            onLanguage(val) {
                setLangCookie(val);
                this.$i18n.locale = val;
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
