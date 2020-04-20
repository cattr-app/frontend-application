<template>
    <div>
        <div class="input-group">
            <p v-t="'demo.auth_message'"></p>

            <at-select v-model="userIndex">
                <at-option
                    v-for="(credential, index) in credentials"
                    :key="credential.user"
                    :value="index"
                    v-html="credential.user"
                />
            </at-select>
        </div>

        <div class="input-group">
            <LanguageSelector :value="language" @setLanguage="setLanguage" />
        </div>
    </div>
</template>

<script>
    import i18n from '@/i18n';
    import { getUserLang, getLangCookie, setLangCookie } from '@/i18n';
    import { DEMO_CREDENTIALS } from '_app/etc/demo.credentials';
    import LanguageSelector from '../../CoreModule/components/LanguageSelector';

    export default {
        name: 'UserSelect',

        components: {
            LanguageSelector,
        },

        data() {
            return {
                credentials: DEMO_CREDENTIALS,
                userIndex: null,
            };
        },

        computed: {
            user() {
                return this.credentials[this.userIndex];
            },
            language() {
                return getLangCookie() || getUserLang();
            },
        },

        watch: {
            userIndex(value) {
                this.$emit('change', this.user);
            },
        },

        mounted() {
            this.userIndex = 0;
        },

        methods: {
            setLanguage(lang) {
                i18n.locale = lang;
                setLangCookie(lang);
            },
        },
    };
</script>

<style lang="scss" scoped>
    .input-group p {
        text-align: center;
    }
</style>
