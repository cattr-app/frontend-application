<template>
    <div class="project-roles">
        <ul>
            <li class="project-roles__item" v-for="(relation, index) in relations" :key="index">
                <at-select class="project-roles__project" :value="relation.project_id" filterable
                           @on-change="onChangeProject(relation, $event)">
                    <at-option v-for="project in projects"
                               :key="project.id" :value="+project.id">{{project.name}}
                    </at-option>
                </at-select>

                <at-select class="project-roles__role" :value="relation.role_id" filterable
                           @on-change="onChangeRole(relation, $event)">
                    <at-option v-for="role in roles"
                               :key="role.id" :value="+role.id">{{role.name}}
                    </at-option>
                </at-select>

                <at-button class="project-roles__remove"
                           @click.prevent="onRemoveRelation(relation, index)">
                    <span class="icon icon-x"></span>
                </at-button>
            </li>
        </ul>

        <at-button class="project-roles__add"
                   @click.prevent="relations.push({ user_id: userID, project_id: 0, role_id: 0 })">
            {{ $t('control.add') }}
        </at-button>
    </div>
</template>

<script>
    import { mapGetters, mapActions } from 'vuex';
    import ProjectService from '@/service/resource/projectService';
    import UsersService from '@/service/resource/usersService';

    export default {
        name: 'ProjectRoles',

        data() {
            return {
                userID: null,
                projects: [],
                relations: [],
                projectService: new ProjectService(),
            };
        },

        computed: {
            ...mapGetters('roles', ['roles']),
        },

        methods: {
            ...mapActions({
                getRoles: 'roles/loadRoles',
            }),

            async load() {
                this.userID = +this.$route.params.id;

                await this.getRoles();
                this.projects = (await this.projectService.getAll()).data;
                this.relations = (await this.projectService.getUserProjectRelations(this.userID)).data;

            },

            addRelation(relation) {
                const { user_id, project_id, role_id } = relation;
                if (!user_id || !project_id || !role_id) {
                    return;
                }

                return this.projectService.addUserProjectRelation(user_id, project_id, role_id);
            },

            removeRelation(relation) {
                const { user_id, project_id, role_id } = relation;
                if (!user_id || !project_id || !role_id) {
                    return;
                }

                return this.projectService.removeUserProjectRelation(user_id, project_id);
            },

            async onChangeProject(relation, newProjectID) {
                await this.removeRelation(relation);
                await this.addRelation({ ...relation, project_id: newProjectID });

                relation.project_id = newProjectID;

            },

            async onChangeRole(relation, newRoleID) {
                await this.removeRelation(relation);
                await this.addRelation({ ...relation, role_id: newRoleID });

                relation.role_id = newRoleID;

            },

            async onRemoveRelation(relation, index) {
                await this.removeRelation(relation);

                this.relations.splice(index, 1);
            },
        },

        mounted() {
            this.load();
        },
    };
</script>

<style lang="scss" scoped>
    .project-roles {

        &__item {
            display: flex;
            flex-flow: row nowrap;
        }

        &__project,
        &__role {
            flex: 1;

            margin-right: .75em;
            margin-bottom: .75em;
        }

        &__remove {
            height: 40px;
        }
    }
</style>
