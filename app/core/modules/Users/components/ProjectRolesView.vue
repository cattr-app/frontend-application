<template>
    <div v-if="Object.keys(relations).length > 0" class="project-roles">
        <div v-for="projectRole in projectRoles" :key="projectRole.id" class="project-roles__role">
            <h4 class="project-roles__title">{{ $t('field.roles.' + projectRole.name) }}</h4>

            <ul class="project-roles__list">
                <li v-for="project in getProjectsForRole(projectRole.id)" :key="project.id" class="project-roles__item">
                    {{ project.name }}
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
    import { mapActions, mapGetters } from 'vuex';
    import ProjectService from '@/service/resource/projectService';

    export default {
        name: 'ProjectRolesView',
        props: {
            relations: {
                type: Object,
                required: true,
            },
        },
        data() {
            return {
                projects: [],
            };
        },
        computed: {
            ...mapGetters('roles', ['roles']),
            projectRoleIds() {
                return Object.keys(this.relations);
            },
            projectRoles() {
                return this.projectRoleIds.map(id => this.roles.find(role => +role.id === +id)).filter(role => role);
            },
        },
        methods: {
            ...mapActions({
                getRoles: 'roles/loadRoles',
            }),
            getProjectIdsForRole(roleId) {
                return roleId in this.relations ? this.relations[roleId].project_ids : [];
            },
            getProjectsForRole(roleId) {
                const ids = this.getProjectIdsForRole(roleId);

                return this.projects.filter(project => ids.indexOf(project.id) !== -1);
            },
        },
        async created() {
            this.getRoles();

            const projectIds = Object.values(this.relations).reduce((ids, relation) => {
                return ids.concat(relation.project_ids);
            }, []);

            const response = await new ProjectService().getWithFilters({
                id: ['=', projectIds],
            });

            this.projects = response.data;
        },
    };
</script>

<style lang="scss" scoped>
    .project-roles {
        &__role {
            margin-bottom: $layout-01;

            &:last-child {
                margin-bottom: 0;
            }
        }

        &__title {
            font-size: 1em;
        }

        &__list {
            display: flex;
            flex-flow: column nowrap;
        }
    }
</style>
