<template>
    <div :class="classes">
        <h1 class="page-title">{{ $t('navigation.settings') }}</h1>
        <div class="at-container">
            <at-menu v-if="sections" class="settings__menu" router mode="horizontal">
                <template v-for="(section, key) in sections">
                    <at-menu-item v-if="section.access" :key="key" :to="{ name: section.pathName }">
                        {{ $t(section.label) }}
                    </at-menu-item>
                </template>
            </at-menu>
            <div class="settings__content">
                <router-view @onUpdate="reinitSections"></router-view>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'Settings',
        computed: {
            classes() {
                const route = this.$route.name.split('.').pop();
                return ['settings', `settings--${route}`];
            },
            sections() {
                return this.$store.getters['settings/sections']
                    .filter(section => section.scope === 'settings')
                    .sort((a, b) => {
                        if (b.label < a.label) {
                            return 1;
                        } else if (b.label > a.label) {
                            return -1;
                        }
                        return 0;
                    });
            },
        },
        methods: {
            async reinitSections() {
                if (this.reloadingSections) {
                    return;
                }

                this.reloadingSections = true;

                try {
                    await this.$store.dispatch('user/setCompanyData', {});
                    await this.$store.dispatch('settings/clearSections');
                    const userApi = await this.$store.getters['user/apiService'];
                    await userApi.getCompanyData();
                } finally {
                    this.reloadingSections = false;
                }
            },
        },

        mounted() {
            if (this.$route.name === 'settings') {
                this.$router.push({ name: 'settings.account' });
            }
        },
    };
</script>

<style lang="scss" scoped>
    .settings {
        margin: 0 15%;

        &__menu {
            border-top-left-radius: 20px;
            border-top-right-radius: 20px;

            border-bottom: 1px solid $gray-4;

            width: 100%;
        }

        &__content {
            background: $color-white;
            padding: $spacing-06;

            border-bottom-left-radius: 20px;
            border-bottom-right-radius: 20px;
        }
    }
</style>
