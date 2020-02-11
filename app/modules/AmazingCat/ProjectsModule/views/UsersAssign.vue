<template>
    <div class="crud projects__users-assign crud__content">
        <div class="page-controls">
            <h1 class="page-title">Assign users to project #{{ project[projectService.getIdParam()] }}</h1>
            <div class="control-items">
                <div class="control-item">
                    <at-button size="large" @click="$router.go(-1)">Back</at-button>
                </div>
            </div>
        </div>
        <div class="assign-form">
            <div class="row at-row">
                <div class="col-md-12">
                    <at-button type="info" hollow class="btn-top-action" @click="addUsers()">Add Users</at-button>
                    <at-input v-model="search.addable" placeholder="Search Users">
                        <template slot="prepend">
                            <i class="icon icon-search"></i>
                        </template>
                    </at-input>
                    <ul class="users-list">
                        <li class="list-item" v-for="user in filteredAddableUsers" :key="user[usersService.getIdParam()]"
                            @click="handle(user.id, 'selectedUsersIds')"
                            :class="{'item-selected': selectedUsersIds.findIndex(i => i === user.id) > -1}"
                        >
                            {{ user.full_name }}
                        </li>
                    </ul>
                </div>
                <div class="col-md-12">
                    <at-button type="info" hollow class="btn-top-action" @click="removeItems()">Remove Users</at-button>
                    <at-input v-model="search.removable" placeholder="Search Users">
                        <template slot="append">
                            <i class="icon icon-search"></i>
                        </template>
                    </at-input>
                    <ul class="users-list">
                        <li class="list-item" v-for="user in filteredRemovableUsers"
                            :key="user[usersService.getIdParam()]"
                            @click="handle(user.id, 'removableUsersIds')"
                            :class="{'item-selected': removableUsersIds.findIndex(i => i === user.id) > -1}"
                        >
                            {{ user.full_name }}
                        </li>
                    </ul>
                </div>
            </div>
            <at-button size="large" @click="save()">Save</at-button>
        </div>
    </div>
</template>

<script>
    import ProjectService from '@/service/resource/projectService';
    import UsersService from '@/service/resource/usersService';

    const escapeRegExp = s => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

    export default {
        name: 'UsersAssign',

        data() {
            return {
                project: {},
                projectUsers: [],
                users: [],
                projectService: new ProjectService(),
                usersService: new UsersService(),

                selectedUsersIds: [],
                removableUsersIds: [],

                search: {
                    addable: '',
                    removable: ''
                }
            };
        },

        async mounted() {
            this.project = (await this.projectService.getItem(this.$route.params[this.projectService.getIdParam()])).data;
            this.projectUsers = this.project.users;
            this.users = (await this.usersService.getAll()).data;
        },

        methods: {
            save() {
                this.projectService.saveUsersRelations(this.projectUsers, this.project.users);
            },

            addUsers() {
                const users = this.users.filter(user => {
                    for (const id of this.selectedUsersIds) {
                        if (id === user.id) {
                            this.selectedUsersIds.splice(this.selectedUsersIds.findIndex(i => i === id), 1);
                            return true;
                        }
                    }
                    return false;
                });
                this.projectUsers = [...this.projectUsers, ...users];
            },

            removeItems() {
                if (this.removableUsersIds.length) {
                    this.projectUsers = this.projectUsers.filter(user => {
                        for (const id of this.removableUsersIds) {
                            if (id === user.id) {
                                this.removableUsersIds.splice(this.selectedUsersIds.findIndex(i => i === id), 1);
                                return false;
                            }
                        }
                        return true;
                    });
                }
            },

            filterList(q, list, field) {
                const words = q.split(' ').map(s => s.trim()).filter(s => s.length !== 0);
                const hasTrailingSpace = q.endsWith(' ');
                const regexString = words.map((word, i) => {
                    if (i + 1 === words.length && !hasTrailingSpace)
                        return `(?=.*\\b${escapeRegExp(word)})`;
                    return `(?=.*\\b${escapeRegExp(word)}\\b)`;
                }).join('');
                const searchRegex = new RegExp(`${regexString}.+`, 'gi');
                return list.filter(item => searchRegex.test(item[field]));

            },

            handle(id, propName) {
                const itemPos = this[propName].findIndex(i => i === id);
                if (itemPos > -1) {
                    this[propName].splice(itemPos, 1);
                } else {
                    this[propName].push(id);
                }
            }
        },

        computed: {
            filteredAddableUsers() {
                if (this.search.addable.length > 0) {
                    return this.filterList(this.search.addable, this.addableUsers, 'full_name');
                }
                return this.addableUsers;
            },

            filteredRemovableUsers() {
                if (this.search.removable.length > 0) {
                    return this.filterList(this.search.removable, this.projectUsers, 'full_name');
                }
                return this.projectUsers;
            },

            addableUsers() {
                const users = Array.from(this.users);

                if (this.projectUsers.length) {
                    const addedUsersIds = this.projectUsers.map(u => u[this.usersService.getIdParam()]);
                    addedUsersIds.forEach(id => {
                        users.splice(users.findIndex(user => {
                            return user[this.usersService.getIdParam()] === id;
                        }), 1);
                    });
                }

                return users;
            }
        }
    };
</script>

<style lang="scss" scoped>
    .projects {
        &__users-assign {
            margin-left: 15%;
            margin-right: 15%;

            .assign-form {
                .btn-top-action {
                    width: 100%;
                    text-align: center;
                    margin-bottom: 15px;
                }

                .users-list {
                    border: 1px solid $border-color-gray;
                    height: 400px;
                    overflow-y: auto;
                    border-radius: 5px;
                    list-style: none;

                    .list-item {
                        padding: .5em 1em;
                        border-bottom: 1px solid $border-color-base;

                        &:hover {
                            background: $table-tr-bg-color-hover;
                            cursor: pointer;
                        }

                        &.item-selected {
                            background: darken($table-tr-bg-color-hover, 5%);
                        }
                    }
                }
            }
        }
    }
</style>
