<template>
    <at-select
        v-if="roles.length > 0"
        ref="select"
        class="role-select"
        :value="value"
        filterable
        @on-change="inputHandler($event)"
    >
        <at-option v-for="(role, index) in roles" :key="index" :value="role.id">{{ role.name }}</at-option>
    </at-select>
</template>

<script>
    import { mapGetters, mapActions } from 'vuex';

    export default {
        props: {
            value: Number,
        },
        computed: {
            ...mapGetters('roles', ['roles']),
        },
        methods: {
            ...mapActions({
                getRoles: 'roles/loadRoles',
            }),
            inputHandler(ev) {
                this.$emit('updateProps', ev);
            },
        },
        async created() {
            await this.getRoles();

            if (this.$refs.select !== undefined) {
                this.$refs.select.$children.forEach(option => {
                    option.hidden = false;
                });
            }
        },
    };
</script>
