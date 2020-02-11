<template>
    <ul class="redmine-priorities">
        <li class="redmine-priorities__item"
            v-for="(redminePriority, index) of redminePriorities"
            :key="redminePriority.id">
            <label class="redmine-priorities__field">
                <span class="redmine-priorities__label">
                    {{ redminePriority.name }}
                </span>

                <at-select class="redmine-priorities__select"
                    :value="+redminePriority.priority_id"
                    @on-change="onChange(index, $event)">
                    <at-option
                        v-for="internalPriority of internalPriorities"
                        :key="internalPriority.id" :value="+internalPriority.id">
                        {{ internalPriority.name }}
                    </at-option>
                </at-select>
            </label>
        </li>
    </ul>
</template>

<script>
    export default {
        model: {
            prop: 'redminePriorities',
            event: 'change',
        },

        props: {
            redminePriorities: {
                type: Array,
                required: true,
            },

            internalPriorities: {
                type: Array,
                required: true,
            },

            changeHandler: {
                type: Function,
                default: () => (value) => {},
            }
        },

        methods: {
            onChange(index, value) {
                const priorities = [...this.redminePriorities];
                priorities[index].priority_id = value;
                this.changeHandler(priorities);
            },
        },
    };
</script>

<style lang="scss" scoped>
    .redmine-priorities {
        &__field {
            display: flex;
            align-items: baseline;

            margin-bottom: 1em;
        }

        &__label {
            width: 150px;
        }
    }
</style>
