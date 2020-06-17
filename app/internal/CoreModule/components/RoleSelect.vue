<template>
    <at-select
        v-if="roles.length > 0"
        ref="select"
        class="role-select"
        :value="value"
        filterable
        @on-change="inputHandler"
    >
        <at-option v-for="(role, index) in roles" :key="index" :value="role.id">{{ ucfirst(role.name) }}</at-option>
    </at-select>
</template>

<script>
    import { mapGetters, mapActions } from 'vuex';
    import { ucfirst } from '@/utils/string';

    export default {
        props: {
            value: Number,
        },
        computed: {
            ...mapGetters('roles', ['roles']),
        },
        methods: {
            ucfirst,
            ...mapActions({
                getRoles: 'roles/loadRoles',
            }),
            inputHandler(value) {
                this.$emit('input', value);
                this.$emit('updateProps', value);
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
