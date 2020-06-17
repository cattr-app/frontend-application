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
                <router-view></router-view>
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
                    .sort((a, b) => a.order - b.order);
            },
        },
    };
</script>

<style lang="scss" scoped>
    .settings {
        margin: 0 15%;

        &__menu {
            border-top-left-radius: 20px;
            border-top-right-radius: 20px;
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
