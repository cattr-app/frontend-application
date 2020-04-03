<template>
    <div class="at-select">
        <v-select
            :options="options"
            label="label"
            placeholder="Type at least 3 characters to search"
            :clearable="false"
            @input="inputHandler($event.id)"
            @search="onSearch"
        >
        </v-select>
        <i class="icon icon-chevron-down at-select__arrow"></i>
    </div>
</template>

<script>
    import vSelect from 'vue-select';
    import axios from '@/config/app';

    const CancelToken = axios.CancelToken;
    let cancel;

    export default {
        name: 'LazySelect',
        components: {
            vSelect,
        },
        props: {
            value: {
                type: Number,
            },
            userID: {
                type: Number,
            },
            service: {
                type: Object,
                required: true,
            },
            inputHandler: {
                type: Function,
                required: true,
            },
        },
        data() {
            return {
                options: [],
            };
        },
        methods: {
            onSearch(query, loading) {
                if (query.length >= 3) {
                    this.fetchTasks(query, loading);
                } else {
                    this.options = [];
                }
            },
            async fetchTasks(query, loading) {
                cancel && cancel();
                loading(true);

                const filters = { task_name: ['like', `%${query}%`], with: 'project' };
                if (this.userID) {
                    filters['user_id'] = this.userID;
                }

                this.options = await this.service
                    .getWithFilters(filters, {
                        cancelToken: new CancelToken(function executor(c) {
                            cancel = c;
                        }),
                    })
                    .then(({ data }) => {
                        loading(false);

                        return data.map(task => {
                            const label =
                                typeof task.project !== 'undefined'
                                    ? `${task.project.name} - ${task.task_name}`
                                    : task.task_name;

                            return { ...task, label };
                        });
                    });
            },
        },
    };
</script>
