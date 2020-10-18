<template>
    <div class="dashboard">
        <div class="dashboard-routes dashboard__routes flex">
            <h1 class="dashboard-routes__link">
                <router-link :to="{ name: 'dashboard.timeline' }">{{ $t('dashboard.timeline') }}</router-link>
            </h1>
            <h1 v-if="hasTeamAccess" class="dashboard-routes__link">
                <router-link :to="{ name: 'dashboard.team' }">{{ $t('dashboard.team') }}</router-link>
            </h1>
        </div>
        <div class="dashboard__content-wrapper">
            <router-view :key="$route.fullPath"></router-view>
        </div>
    </div>
</template>

<script>
    import { mapGetters } from 'vuex';

    export default {
        name: 'Index',
        computed: {
            ...mapGetters('user', ['canInAnyProject']),
            hasTeamAccess() {
                return this.canInAnyProject('dashboard/manager_access');
            },
        },
    };
</script>

<style lang="scss" scoped>
    .dashboard {
        &__routes {
            margin-bottom: 1em;
        }
    }

    .dashboard-routes {
        &__link {
            margin-right: $layout-03;
            font-size: 1.8rem;

            &:last-child {
                margin-right: initial;
            }

            a {
                color: #b1b1be;
            }

            .router-link-active {
                color: #2e2ef9;
            }
        }
    }
</style>
