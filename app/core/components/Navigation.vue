<template>
    <at-menu class="navbar container-fluid" router mode="horizontal">
        <router-link to="/dashboard" class="navbar__logo"></router-link>
        <div v-if="loggedIn">
            <template v-for="(item, key) in navItems">
                <at-menu-item :key="key" :to="item.to">
                    {{ $t(item.label) }}
                </at-menu-item>
            </template>
            <template v-for="(item, key) in navDropdowns">
                <at-submenu :key="key" :title="$t(key)">
                    <template slot="title">{{ $t(key) }}</template>
                    <template v-for="(val, itemKey) in item">
                        <at-menu-item :key="itemKey" :to="val.to">
                            {{ $t(val.label) }}
                        </at-menu-item>
                    </template>
                </at-submenu>
            </template>
        </div>
        <at-dropdown v-if="loggedIn" placement="bottom-right" @on-dropdown-command="userDropdownHandle">
            <i class="icon icon-chevron-down at-menu__submenu-icon"></i>
            <user-avatar :user="user" :border-radius="10"></user-avatar>
            <at-dropdown-menu slot="menu">
                <template v-for="(item, key) of userDropdownItems">
                    <at-dropdown-item :key="key" :name="item.to.name">
                        <span v-html="item.title">{{ item.title }}</span>
                    </at-dropdown-item>
                </template>
                <li class="at-dropdown-menu__item" @click="logout()">
                    <i class="icon icon-log-out"></i> {{ $t('navigation.logout') }}
                </li>
            </at-dropdown-menu>
        </at-dropdown>
    </at-menu>
</template>

<script>
    import { mapGetters } from 'vuex';
    import UserAvatar from './UserAvatar';
    import { getModuleList } from '../moduleLoader';

    export default {
        components: {
            UserAvatar,
        },
        data() {
            return {
                modules: Object.values(getModuleList()).map(i => i.moduleInstance),
            };
        },
        methods: {
            userDropdownHandle(route) {
                this.$router.push({ name: route });
            },
            async logout() {
                await this.$store.getters['user/apiService'].logout();
            },
        },
        computed: {
            navItems() {
                const navItems = [];
                this.modules.forEach(m => {
                    const entries = m.getNavbarEntries();
                    entries.forEach(e => {
                        if (e.displayCondition(this.$store)) {
                            navItems.push(e.getData());
                        }
                    });
                });

                return navItems;
            },
            navDropdowns() {
                const entriesDr = {};
                this.modules.forEach(m => {
                    const entriesDropdown = m.getNavbarEntriesDropdown();
                    Object.keys(entriesDropdown).forEach(key => {
                        const isAllowItem = entriesDropdown[key][0].displayCondition(this.$store);
                        if (!entriesDr.hasOwnProperty(entriesDropdown[key][0].section) && isAllowItem) {
                            entriesDr[entriesDropdown[key][0].section] = [];
                        }
                        if (isAllowItem) {
                            entriesDr[entriesDropdown[key][0].section].push(entriesDropdown[key][0]);
                        }
                    });
                });

                return entriesDr;
            },
            ...mapGetters('user', ['user']),
            userDropdownItems() {
                const items = [
                    {
                        to: {
                            name: 'about',
                        },
                        title: `<i class="icon icon-info"></i> ${this.$t('navigation.about')}`,
                    },
                    {
                        to: {
                            name: 'Users.settings.account',
                        },
                        title: `<i class="icon icon-settings"></i> ${this.$t('navigation.settings')}`,
                    },
                ];

                if (this.user && this.user.is_admin) {
                    items.push({
                        to: {
                            name: 'Settings.company.general',
                        },
                        title: `<i class="icon icon-settings"></i> ${this.$t('navigation.company_settings')}`,
                    });
                }

                return items;
            },
            rules() {
                return this.$store.getters['user/allowedRules'];
            },
            loggedIn() {
                return this.$store.getters['user/loggedIn'];
            },
        },
    };
</script>

<style lang="scss" scoped>
    .navbar {
        display: flex;
        height: auto;
        padding: 0.75em 24px;
        justify-content: space-between;
        box-shadow: 0px 0px 10px rgba(63, 51, 86, 0.1);
        border-bottom: 0;

        &__logo {
            background: url('../assets/logo.svg');
            height: 45px;
            width: 45px;
            background-size: cover;
        }

        &::v-deep {
            .at-menu {
                &__item-link {
                    &::after {
                        bottom: -0.75em;
                    }
                }
            }

            .at-menu__submenu-title {
                padding-right: 0 !important;
            }

            .at-dropdown {
                display: flex;
                align-items: center;

                &-menu {
                    overflow: hidden;

                    &__item {
                        font-weight: 600;
                        color: $gray-3;

                        &:hover {
                            color: $blue-2;
                            background-color: #fff;
                        }
                    }
                }

                &__trigger {
                    display: flex;
                    align-items: center;
                    cursor: pointer;

                    .icon {
                        margin-right: 8px;
                    }
                }

                &__popover {
                    width: fit-content;
                }

                .at-dropdown-menu__item .icon {
                    margin-right: 6px;
                }
            }
        }
    }
</style>
