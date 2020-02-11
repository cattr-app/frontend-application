<template>
    <at-select class="role-select" :value="value" filterable @on-change="inputHandler($event)">
        <at-option v-for="role in roles" :key="role.id" :value="+role.id">{{role.name}}
        </at-option>
    </at-select>
</template>

<script>
    import { mapGetters, mapActions } from 'vuex';

    export default {
        name: 'RoleSelect',

        props: {
            value: {
                type: Number,
                required: true,
            },
            inputHandler: {
                type: Function,
                required: true,
            },
        },

        computed: {
            ...mapGetters('roles', ['roles']),
        },

        methods: {
            ...mapActions({
                getRoles: 'roles/loadRoles',
            }),
        },

        async mounted() {
            await this.getRoles();
        },
    };
</script>

<style lang="scss" scoped>

</style>
