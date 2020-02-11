<template>
    <div class="dashboard">
        <div class="dashboard-routes dashboard__routes flex">
            <h1 class="dashboard-routes__link">
                <router-link :to="{name: 'dashboard.timeline'}">{{ $t('dashboard.timeline') }}</router-link>
            </h1>
            <h1 class="dashboard-routes__link" v-if="hasTeamAccess">
                <router-link :to="{name: 'dashboard.team'}">{{ $t('dashboard.team') }}</router-link>
            </h1>
        </div>
        <div class="dashboard__content-wrapper">
            <router-view :key="$route.fullPath"></router-view>
        </div>
    </div>
</template>

<script>
    import { mapGetters } from 'vuex';
    import { havePermission } from '@/utils/user';

    export default {
        name: 'Index',

        beforeMount() {
            if (this.$route.name === 'dashboard') {
                this.$router.push({ name: 'dashboard.timeline' });
            }
        },

        computed: {
            ...mapGetters('user', ['user', 'allowedRules']),

            hasTeamAccess() {
                if (this.user.is_admin) {
                    return true;
                }

                return havePermission(this.allowedRules, 'dashboard/manager_access');
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
            margin-right: 1.8em;
            font-size: 1.8rem;

            &:last-child {
                margin-right: initial;
            }

            a {
                color: #B1B1BE;
            }

            .router-link-active {
                color: #2E2EF9;
            }
        }
    }
</style>
