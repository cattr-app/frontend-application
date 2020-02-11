<template>
    <ListBox
        keyField="id"
        labelField="name"
        valueField="selected"
        :values="listBoxItems"
        @change="onChange" />
</template>

<script>
    import ListBox from '@/components/ListBox';

    export default {
        components: {
            ListBox,
        },

        model: {
            prop: 'selected',
            event: 'change',
        },

        props: {
            statuses: {
                type: Array,
                required: true,
            },

            selected: {
                type: Array,
                required: true,
            },

            changeHandler: {
                type: Function,
                default: () => (value) => {},
            }
        },

        computed: {
            listBoxItems() {
                return this.statuses.map(status => ({ ...status, selected: this.selected.includes(status.id) }));
            },
        },

        methods: {
            onChange(items) {
                const selectedIDs = items.filter(item => item.selected).map(item => item.id);
                this.changeHandler(selectedIDs);
            },
        },
    };
</script>
