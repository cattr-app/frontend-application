<template>
    <multi-select
        placeholder="control.project_selected"
        :inputHandler="selectedProjects"
        :selected="selectedProjectIds"
        :service="projectService"
        name="projects"
        :size="size"
        @onOptionsLoad="onLoad"
    >
    </multi-select>
</template>

<script>
    import MultiSelect from './MultiSelect';
    import ProjectService from '../service/resource/projectService';

    const localStorageKey = 'amazingcat.local.storage.project_select';

    export default {
        name: 'ProjectSelect',
        components: {
            MultiSelect,
        },
        props: {
            size: {
                type: String,
                default: 'normal',
            },
        },
        data() {
            return {
                projectService: new ProjectService(),
                selectedProjectIds: JSON.parse(localStorage.getItem(localStorageKey)),
            };
        },
        methods: {
            onLoad(allSelectOptions) {
                const allProjectIds = allSelectOptions.map(option => option.value);

                // Select all options if storage is empty
                if (!localStorage.getItem(localStorageKey)) {
                    this.selectedProjectIds = allProjectIds;
                    localStorage.setItem(localStorageKey, JSON.stringify(this.selectedProjectIds));
                    return this.$emit('change', this.selectedProjectIds);
                }

                // Remove options that no longer exists
                const existingProjectIds = this.selectedProjectIds.filter(projectId =>
                    allProjectIds.includes(projectId),
                );

                if (this.selectedProjectIds.length > existingProjectIds.length) {
                    this.selectedProjectIds = existingProjectIds;
                    localStorage.setItem(localStorageKey, JSON.stringify(this.selectedProjectIds));
                }

                this.$emit('change', this.selectedProjectIds);
            },
            selectedProjects(values) {
                this.selectedProjectIds = values;
                localStorage.setItem(localStorageKey, JSON.stringify(this.selectedProjectIds));
                this.$emit('change', values);
            },
        },
    };
</script>
