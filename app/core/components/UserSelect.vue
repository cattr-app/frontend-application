<template>
    <div class="user-select" :class="{ 'at-select--visible': showPopup }" @click.stop="togglePopup">
        <at-input class="user-select-input" :readonly="true" :value="inputValue"></at-input>

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
                            v-model="searchActiveValue"
                            class="user-search-input"
                            :placeholder="$t('control.search')"
                        />
                    </div>

                    <div>
                        <at-select v-model="userType" placeholder="fields.type" class="user-type-filter">
                            <at-option key="all" value="all">
                                {{ $t('field.types.all') }}
                            </at-option>

                            <at-option key="employee" value="employee">
                                {{ $t('field.types.employee') }}
                            </at-option>

                            <at-option key="client" value="client">
                                {{ $t('field.types.client') }}
                            </at-option>
                        </at-select>
                    </div>

                    <div class="user-select-all" @click="selectAllActiveUsers">
                        <span>{{ $t(selectedActiveUsers.length ? 'control.clear_all' : 'control.select_all') }}</span>
                    </div>

                    <div class="user-select-list">
                        <preloader v-if="isLoading"></preloader>
                        <ul>
                            <li
                                v-for="user in filteredActiveUsers"
                                :key="user.id"
                                :class="{
                                    'user-select-item': true,
                                    active: userIDs.includes(user.id),
                                }"
                                @click="toggleUser(user.id)"
                            >
                                <UserAvatar
                                    class="user-avatar"
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

                <div v-if="userSelectTab == 'inactive'">
                    <div class="user-search">
                        <at-input
                            v-model="searchInactiveValue"
                            class="user-search-input"
                            :placeholder="$t('control.search')"
                        />
                    </div>

                    <div>
                        <at-select v-model="userType" placeholder="fields.type" class="user-type-filter">
                            <at-option key="all" value="all">
                                {{ $t('field.types.all') }}
                            </at-option>

                            <at-option key="employee" value="employee">
                                {{ $t('field.types.employee') }}
                            </at-option>

                            <at-option key="client" value="client">
                                {{ $t('field.types.client') }}
                            </at-option>
                        </at-select>
                    </div>

                    <div class="user-select-all" @click="selectAllInactiveUsers">
                        <span>{{ $t(selectedInactiveUsers.length ? 'control.clear_all' : 'control.select_all') }}</span>
                    </div>

                    <div class="user-select-list">
                        <preloader v-if="isLoading"></preloader>
                        <ul>
                            <li
                                v-for="user in filteredInactiveUsers"
                                :key="user.id"
                                :class="{
                                    'user-select-item': true,
                                    active: userIDs.includes(user.id),
                                }"
                                @click="toggleUser(user.id)"
                            >
                                <UserAvatar
                                    class="user-avatar"
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
            </div>
        </transition>
    </div>
</template>

<script>
    import UserAvatar from './UserAvatar';
    import UsersService from '../service/resource/usersService';
    import Preloader from '@/components/Preloader';

    const localStorageKey = 'user-select.users';

    export default {
        name: 'UserSelect',
        components: {
            UserAvatar,
            Preloader,
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
                userType: 'all',
                isLoading: false,
            };
        },
        async mounted() {
            window.addEventListener('click', this.hidePopup);

            this.isLoading = true;

            const { data } = await this.usersService.getAll();
            this.users = data;

            this.isLoading = false;

            if (!localStorage.getItem(localStorageKey)) {
                this.userIDs = this.users.map(user => user.id);
                localStorage.setItem(localStorageKey, JSON.stringify(this.userIDs));
            }

            // remove nonexistent users from selected
            const existingUserIDs = this.users.filter(user => this.userIDs.includes(user.id)).map(user => user.id);

            if (this.userIDs.length > existingUserIDs.length) {
                this.userIDs = existingUserIDs;
                localStorage.setItem(localStorageKey, JSON.stringify(this.userIDs));
            }

            if (this.userIDs.length) {
                this.$emit('change', this.userIDs);
            }
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
            selectedActiveUsers() {
                return this.activeUsers.filter(({ id }) => this.userIDs.includes(id));
            },
            selectedInactiveUsers() {
                return this.inactiveUsers.filter(({ id }) => this.userIDs.includes(id));
            },
            filteredActiveUsers() {
                return this.activeUsers.filter(user => {
                    if (this.userType !== 'all' && user.type !== this.userType) {
                        return false;
                    }

                    const name = user.full_name.toUpperCase();
                    const value = this.searchActiveValue.toUpperCase();

                    return name.indexOf(value) !== -1;
                });
            },
            filteredInactiveUsers() {
                return this.inactiveUsers.filter(user => {
                    if (this.userType !== 'all' && user.type !== this.userType) {
                        return false;
                    }

                    const name = user.full_name.toUpperCase();
                    const value = this.searchInactiveValue.toUpperCase();

                    return name.indexOf(value) !== -1;
                });
            },
            inputValue() {
                return this.$tc('control.user_selected', this.userIDs.length, {
                    count: this.userIDs.length,
                });
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
                // If some users already selected we are going to clear it
                if (!this.selectedActiveUsers.length) {
                    this.userIDs = this.userIDs.concat(
                        this.activeUsers
                            .filter(
                                ({ full_name }) =>
                                    full_name.toUpperCase().indexOf(this.searchActiveValue.toUpperCase()) !== -1,
                            )
                            .map(({ id }) => id)
                            .filter(id => !this.userIDs.includes(id)),
                    );
                } else {
                    this.userIDs = this.userIDs.filter(uid => !this.activeUsers.map(({ id }) => id).includes(uid));
                }

                this.changed = true;
                localStorage[localStorageKey] = JSON.stringify(this.userIDs);
            },
            selectAllInactiveUsers() {
                if (!this.selectedInactiveUsers.length) {
                    this.userIDs = this.userIDs.concat(
                        this.inactiveUsers
                            .filter(
                                ({ full_name }) =>
                                    full_name.toUpperCase().indexOf(this.searchInactiveValue.toUpperCase()) !== -1,
                            )
                            .map(({ id }) => id)
                            .filter(id => !this.userIDs.includes(id)),
                    );
                } else {
                    this.userIDs = this.userIDs.filter(uid => !this.inactiveUsers.map(({ id }) => id).includes(uid));
                }

                this.changed = true;
                localStorage[localStorageKey] = JSON.stringify(this.userIDs);
            },
            onTabChange({ name }) {
                this.userSelectTab = name;
            },
        },
    };
</script>

<style lang="scss" scoped>
    .user-select {
        position: relative;
        min-width: 240px;

        &::v-deep {
            .at-input__original {
                border: 1px solid #eeeef5;
                border-radius: 5px;

                padding-right: $spacing-08;
                cursor: text;
            }

            .at-tabs-nav {
                width: 100%;
            }

            .at-tabs-nav__item {
                color: #b1b1be;
                font-size: 15px;
                font-weight: 600;
                text-align: center;
                margin: 0;
                line-height: 39px;
                width: 50%;

                &--active {
                    color: #2e2ef9;

                    &::after {
                        background-color: #2e2ef9;
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
            position: relative;
            min-height: 60px;
        }

        &-all {
            position: relative;
            display: block;
            font-size: 10px;
            font-weight: 600;
            color: #59566e;
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
                background: #f4f4ff;
            }

            &::before,
            &::after {
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

    .user-type-filter {
        padding: 0 12px;
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
            max-height: 360px;
        }
    }
</style>
