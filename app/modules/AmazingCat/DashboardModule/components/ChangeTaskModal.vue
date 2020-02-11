<template>
    <at-modal
            :value="showModal"
            :title="$t('control.edit_intervals')"
            @on-cancel="cancel"
            @on-confirm="confirm"
    >
        <validation-observer v-slot="{}" ref="form">
            <validation-provider ref="project" rules="required" v-slot="{ errors }" :name="$t('field.project')" mode="passive">
                <div class="input-group">
                    <small>{{ $t('field.project') }}</small>

                    <resource-select
                            v-model="projectId"
                            class="input"
                            :service="projectsService"
                            :class="{'at-select--error': errors.length > 0}"
                    />

                    <p>{{ errors[0] }}</p>
                </div>
            </validation-provider>

            <validation-provider ref="task" rules="required" v-slot="{ errors }" :name="$t('field.task')" mode="passive">
                <div class="input-group">
                    <small>{{ $t('field.task') }}</small>

                    <at-select
                            v-model="taskId"
                            v-if="enableTaskSelect"
                            filterable
                            class="input"
                            :placeholder="$t('control.select')"
                            :class="{'at-select--error': errors.length > 0}"
                    >
                        <at-option
                                v-for="option of tasksOptionList" :key="option.value"
                                :value="option.value"
                                :label="option.label"
                        />
                    </at-select>
                    <at-input v-else class="input" disabled />

                    <p>{{ errors[0] }}</p>
                </div>
            </validation-provider>
        </validation-observer>

        <div slot="footer">
            <at-button @click="cancel">{{ $t('control.cancel') }}</at-button>
            <at-button
                    type="primary"
                    @click="confirm"
                    :disabled="disableButtons"
            >{{ $t('control.save') }}
            </at-button>
        </div>
    </at-modal>
</template>

<script>
    import ResourceSelect from '@/components/ResourceSelect';
    import ProjectService from '@/service/resource/projectService';
    import TasksService from "@/service/resource/tasksService";
    import { ValidationObserver, ValidationProvider } from 'vee-validate';

    export default {
        name: 'ChangeTaskModal',
        components: {
            ResourceSelect,
            ValidationObserver,
            ValidationProvider
        },
        props: {
            showModal: {
                required: true,
                type: Boolean,
            },
            disableButtons: {
                default: false,
                type: Boolean,
            },
        },
        computed: {
            enableTaskSelect() {
                return !!(this.projectId && this.tasksOptionList);
            },
        },
        data() {
            return {
                projectId: '',
                taskId: '',

                projectsService: new ProjectService(),
                tasksService: new TasksService(),

                tasksOptionList: null,
            }
        },
        methods: {
            cancel() {
                this.$refs.form.reset();

                this.projectId = '';
                this.taskId = '';

                this.$emit('cancel');
            },

            async confirm() {
                const valid = await this.$refs.form.validate();
                if (!valid) {
                    return;
                }

                const { taskId } = this;

                this.projectId = '';
                this.taskId = '';

                this.$emit('confirm', taskId);
            },
        },
        watch: {
            async projectId (projectId) {
                this.tasksOptionList = [];

                this.tasksOptionList = await this.tasksService
                    .getWithFilters({ project_id: projectId })
                    .then(({ data }) => {
                            return data.map(option => {
                                return {
                                    value: option.id,
                                    label: option['task_name'],
                                }
                            })
                        }
                    );

                requestAnimationFrame(() => {
                    this.$refs.project.reset();
                    this.$refs.task.reset();
                });
            }
        },
    };
</script>

<style lang="scss" scoped>
    .input-group {
        margin-bottom: $layout-01;
    }

    .input {
        margin-bottom: $spacing-02;
    }
</style>
