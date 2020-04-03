<template>
    <div>
        <multi-select :inputHandler="selectedProjects" :selected="projectsId" :service="projectService" name="projects">
        </multi-select>
    </div>
</template>

<script>
    import MultiSelect from './MultiSelect';
    import ProjectService from '../service/resource/projectService';

    const localStorageKey = 'project-select.projects';

    export default {
        name: 'ProjectSelect',
        components: {
            MultiSelect,
        },
        data() {
            let projectsId = [];
            if (localStorage.getItem(localStorageKey)) {
                projectsId = JSON.parse(localStorage.getItem(localStorageKey));
            }

            return {
                projectService: new ProjectService(),
                projects: [],
                projectsId,
            };
        },
        async mounted() {
            if (typeof localStorage[localStorageKey] === 'undefined') {
                this.projectsId = await this.projectService.getAll().then(({ data }) => {
                    return data.map(project => project.id);
                });
                localStorage[localStorageKey] = JSON.stringify(this.projects);
            }

            if (this.projectsId.length) {
                this.$emit('change', this.projectsId);
            }

            this.projects = await this.projectService.getAll().then(({ data }) => {
                const existingProjectIDs = data
                    .filter(project => this.projectsId.includes(project.id))
                    .map(project => project.id);

                if (this.projectsId.length > existingProjectIDs.length) {
                    this.projectsId = existingProjectIDs;
                    localStorage[localStorageKey] = JSON.stringify(this.projectsId);
                }

                return data;
            });
        },
        methods: {
            selectedProjects(values) {
                this.projectsId = values;
                localStorage[localStorageKey] = JSON.stringify(this.projectsId);
                this.$emit('change', values);
            },
        },
    };
</script>
