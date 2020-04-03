<template>
    <div :class="classes">
        <h1 class="page-title">{{ $t('navigation.company_settings') }}</h1>
        <div class="at-container">
            <at-menu v-if="sections" class="settings__menu" router mode="horizontal">
                <template v-for="(section, key) in sections">
                    <at-menu-item v-if="section.access" :key="key" :to="{ name: section.pathName }"
                        >{{ $t(section.label) }}
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
        name: 'CompanySettings',
        computed: {
            classes() {
                const route = this.$route.name.split('.').pop();
                return ['settings', `settings--company-${route}`];
            },
            sections() {
                return this.$store.getters['settings/sections']
                    .filter(section => section.scope === 'company')
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
                await this.$store.dispatch('user/setCompanyData', {});
                const userApi = await this.$store.getters['user/apiService'];
                await this.$store.dispatch('settings/clearSections').then(async () => {
                    await userApi.getCompanyData();
                });
            },
        },
        mounted() {
            if (this.$route.name === 'company') {
                this.$router.push({ name: 'company.general' });
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

            &__item-link {
                padding: 0 $spacing-06;
            }
        }

        &__content {
            padding: $spacing-06;
        }

        &--company-users {
            margin: 0;
        }
    }

    .settings__content::v-deep {
        .at-container,
        .at-container__inner,
        .crud {
            all: unset;
        }
    }
</style>
