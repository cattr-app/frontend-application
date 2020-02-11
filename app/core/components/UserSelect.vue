<template>
    <div class="user-select"
         :class="{'at-select--visible' : showPopup}"
         @click.stop="togglePopup">
        <at-input
            class="user-select-input"
            :readonly="true"
            :value="inputValue"
        >
        </at-input>

        <span
            v-show="userIDs.length"
            class="user-select__clear icon icon-x at-select__clear"
            @click="clearSelection"
        ></span>

        <span class="icon icon-chevron-down at-select__arrow"></span>

        <transition name="slide-up">
            <div v-show="showPopup" class="at-select__dropdown at-select__dropdown--bottom" @click.stop>
                <at-tabs :value="userSelectTab" @on-change="onTabChange">
                    <at-tab-pane :label="$t('control.active')" name="active" />
                    <at-tab-pane :label="$t('control.inactive')" name="inactive" />
                </at-tabs>

                <div v-if="userSelectTab == 'active'">
                    <div class="user-search">
                        <at-input
                            class="user-search-input"
                            :placeholder="$t('control.search')"
                            v-model="searchActiveValue"
                        />
                    </div>

                    <div @click="selectAllActiveUsers" class="user-select-all">
                        <span>{{ $t('control.select_all') }}</span>
                    </div>

                    <ul class="user-select-list">
                        <li
                            :class="{ 'user-select-item': true, active: userIDs.includes(user.id) }"
                            v-for="user in filteredActiveUsers"
                            :key="user.id"
                            @click="toggleUser(user.id)"
                        >
                            <UserAvatar class="user-avatar"
                                :size="25"
                                :borderRadius="5"
                                :user="user"
                                :isOnline="getUserTask(user.id) !== null"
                            />

                            <div class="user-name">{{ user.full_name }}</div>
                        </li>
                    </ul>
                </div>

                <div v-if="userSelectTab == 'inactive'">
                    <div class="user-search">
                        <at-input
                            class="user-search-input"
                            :placeholder="$t('control.search')"
                            v-model="searchInactiveValue"
                        />
                    </div>

                    <div @click="selectAllInactiveUsers" class="user-select-all">
                        <span>{{ $t('control.select_all') }}</span>
                    </div>

                    <ul class="user-select-list">
                        <li
                            :class="{ 'user-select-item': true, active: userIDs.includes(user.id) }"
                            v-for="user in filteredInactiveUsers"
                            :key="user.id"
                            @click="toggleUser(user.id)"
                        >
                            <UserAvatar class="user-avatar"
                                :size="25"
                                :borderRadius="5"
                                :user="user"
                                :isOnline="getUserTask(user.id) !== null"
                            />

                            <div class="user-name">{{ user.full_name }}</div>
                        </li>
                    </ul>
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
    import UserAvatar from './UserAvatar';
    import UsersService from "../service/resource/usersService";
    import { getInitials } from '../utils/string';

    const localStorageKey = 'user-select.users';

    export default {
        name: 'UserSelect',
        components: {
            UserAvatar,
        },
        props: {
            currentTasks: {
                required: false,
                default: () => {
                    return {};
                },
            },
        },
        data() {
            let userIDs = [];
            if (localStorage.getItem(localStorageKey)) {
                userIDs = JSON.parse(localStorage.getItem(localStorageKey));
            }

            return {
                showPopup: false,
                userSelectTab: 'active',
                userIDs,
                usersService: new UsersService(),
                searchActiveValue: '',
                searchInactiveValue: '',
                changed: false,

                users: [],
            };
        },
        async mounted() {
            window.addEventListener('click', this.hidePopup);

            if (this.userIDs.length) {
                this.$emit('change', this.userIDs);
            }

            this.users = (await this.usersService.getAll().then(({ data }) => {
                // remove nonexistent users from selected
                const existingUserIDs = data.filter(user => this.userIDs.includes(user.id)).map(user => user.id);

                if(this.userIDs.length > existingUserIDs.length) {
                    this.userIDs = existingUserIDs;
                    localStorage[localStorageKey] = JSON.stringify(this.userIDs);
                }

                return data;
            }));
        },

        beforeDestroy() {
            window.removeEventListener('click', this.hidePopup);
        },

        computed: {
            activeUsers() {
                return this.users.filter(user => user.active);
            },
            inactiveUsers() {
                return this.users.filter(user => !user.active);
            },
            filteredActiveUsers() {
                return this.activeUsers.filter(user => {
                    const name = user.full_name.toUpperCase();
                    const value = this.searchActiveValue.toUpperCase();

                    return name.indexOf(value) !== -1;
                });
            },
            filteredInactiveUsers() {
                return this.inactiveUsers.filter(user => {
                    const name = user.full_name.toUpperCase();
                    const value = this.searchInactiveValue.toUpperCase();

                    return name.indexOf(value) !== -1;
                });
            },
            inputValue() {
                return this.$tc('control.user_selected', this.userIDs.length, {count: this.userIDs.length});
            },
        },
        methods: {
            togglePopup() {
                this.showPopup = !this.showPopup;

                if (!this.showPopup && this.changed) {
                    this.changed = false;
                    this.$emit('change', this.userIDs);
                }
            },

            hidePopup() {
                this.showPopup = false;

                if (this.changed) {
                    this.changed = false;
                    this.$emit('change', this.userIDs);
                }
            },

            clearSelection() {
                this.userIDs = [];
                this.$emit('change', this.userIDs);
                localStorage[localStorageKey] = JSON.stringify(this.userIDs);
            },

            toggleUser(userID) {
                if (this.userIDs.includes(userID)) {
                    this.userIDs = this.userIDs.filter(id => id !== userID);
                } else {
                    this.userIDs.push(userID);
                }

                this.changed = true;
                localStorage[localStorageKey] = JSON.stringify(this.userIDs);
            },

            getUserTask(userID) {
                if (!this.currentTasks[userID]) {
                    return null;
                }

                return this.currentTasks[userID];
            },

            selectAllActiveUsers() {
                this.userIDs = this.activeUsers
                    .filter(({ full_name }) => full_name.toUpperCase().indexOf(this.searchActiveValue.toUpperCase()) !== -1)
                    .map(({ id }) => id);
                this.changed = true;
                localStorage[localStorageKey] = JSON.stringify(this.userIDs);
            },

            selectAllInactiveUsers() {
                this.userIDs = this.inactiveUsers
                    .filter(({ full_name }) => full_name.toUpperCase().indexOf(this.searchInactiveValue.toUpperCase()) !== -1)
                    .map(({ id }) => id);
                this.changed = true;
                localStorage[localStorageKey] = JSON.stringify(this.userIDs);
            },

            onTabChange({ name }) {
                this.userSelectTab = name;
            },
        },
    }
</script>

<style lang="scss" scoped>
    .user-select {
        position: relative;
        min-width: 240px;

        &::v-deep {
            .at-input__original {
                border: 1px solid #EEEEF5;
                border-radius: 5px;

                padding-right: $spacing-08;
                cursor: text;
            }

            .at-tabs-nav {
                width: 100%;
            }

            .at-tabs-nav__item {
                color: #B1B1BE;
                font-size: 15px;
                font-weight: 600;
                text-align: center;
                margin: 0;
                line-height: 39px;
                width: 50%;

                &--active {
                    color: #2E2EF9;

                    &::after {
                        background-color: #2E2EF9;
                    }
                }
            }

            .at-tabs__nav {
                height: 39px;
            }

            .at-tabs__header {
                margin-bottom: 0;
            }

            .at-tabs__body {
                display: none;
            }
        }

        &__clear {
            margin-right: $spacing-05;
            display: block;
        }

        &-list {
            overflow-y: scroll;
            max-height: 200px;
        }

        &-all {
            position: relative;
            display: block;
            font-size: 10px;
            font-weight: 600;
            color: #59566E;
            text-transform: uppercase;

            padding: 8px 20px;

            cursor: pointer;
        }

        &-item {
            font-size: 13px;
            font-weight: 500;
            color: #151941;
            cursor: pointer;

            display: flex;
            align-items: center;

            padding: 7px 20px;

            &.active {
                background: #F4F4FF;
            }

            &::before, &::after {
                content: ' ';
                display: table;
                clear: both;
            }
        }
    }

    .user-search-input {
        margin: 0;

        &::v-deep {
            .at-input__original {
                border: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }
    }

    .user-avatar {
        float: left;
        margin-right: 10px;
    }

    .user-name {
        padding-bottom: 3px;
    }

    .at-select {
        &__dropdown {
            overflow: hidden;
            max-height: 320px;
        }
    }
</style>
