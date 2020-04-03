<template>
    <div v-if="Object.keys(roles).length > 0" class="project-roles">
        <div v-for="role in roles" :key="role.id">
            <div class="row">
                <div class="col-7 col-md-12 col-sm-12 projects-container">
                    <validation-provider :ref="'provider' + '_' + role.id" v-slot="{ errors }" vid="relation_provider">
                        <MultiSelect
                            :key="role.id"
                            :service="service"
                            :selected="getProjectsForRole(role.id)"
                            :inputHandler="projectIds => updateRelation(role.id, projectIds)"
                            :class="{
                                'at-select--error': errors.length > 0,
                            }"
                        >
                        </MultiSelect>
                        <small v-if="errors.length" class="error">{{ errors[0] }}</small>
                    </validation-provider>
                </div>

                <div class="col-3 col-md-6 col-sm-6 role-container">
                    <at-input readonly :value="$t('users.role.' + role.name)">
                        <template slot="prepend"> {{ $t('users.role.name') }} </template>
                    </at-input>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import { mapActions, mapGetters } from 'vuex';
    import MultiSelect from '@/components/MultiSelect';
    import { ValidationProvider } from 'vee-validate';

    export default {
        name: 'ProjectRoles',
        props: {
            relations: {
                type: Object,
                required: true,
            },
            service: {
                type: Object,
                required: true,
            },
        },
        components: {
            MultiSelect,
            ValidationProvider,
        },
        data() {
            return {
                projects: [],
                selectedProjects: [],
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
                await this.getRoles();
            },
            getProjectsForRole(roleId) {
                return roleId in this.relations ? this.relations[roleId].project_ids : [];
            },
            updateRelation(roleId, projectIds) {
                let selectedProjects = [];
                Object.keys(this.relations).forEach(roleID => {
                    selectedProjects = selectedProjects.concat(this.relations[roleID].project_ids);
                });

                let result = {};
                let duplicatesCheck = new Set(selectedProjects).size !== selectedProjects.length;

                if (duplicatesCheck) {
                    result = {
                        errors: ['This project(-s) were already used for another role!'],
                        valid: false,
                        failedRules: {},
                    };
                } else {
                    result = {
                        errors: [],
                        valid: true,
                        failedRules: {},
                    };
                }

                this.$refs['provider' + '_' + roleId][0].applyResult(result);

                if (roleId in this.relations) {
                    this.relations[roleId].project_ids = projectIds;
                } else {
                    this.relations[roleId] = {
                        project_ids: projectIds,
                        role_id: roleId,
                    };
                }

                this.$emit('updateRelation', this.relations);
                return this.relations;
            },
        },
        async created() {
            await this.load();
        },
    };
</script>

<style lang="scss" scoped>
    .projects-container {
        align-self: center;
    }

    .role-container {
        margin: 1em;
    }

    .role-name {
        line-height: 2em;
    }
</style>
