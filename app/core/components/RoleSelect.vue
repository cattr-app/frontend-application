<template>
    <at-select v-if="roles.length > 0" ref="select" class="role-select" :value="value" @on-change="inputHandler">
        <at-tooltip
            v-for="(role, index) in roles"
            :key="index"
            :content="$t('users.roles-description.' + role.name)"
            placement="left-top"
            class="custom-tooltip-roles"
        >
            <at-option :key="index" :value="role.id">
                {{ $t('users.role.' + role.name) }}
            </at-option>
        </at-tooltip>
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

<style lang="scss" scoped>
    .role-select {
        ::v-deep {
            .at-select__dropdown.at-select__dropdown--bottom {
                overflow-y: visible !important;
            }
        }
        .custom-tooltip-roles {
            display: flex;
            flex-direction: column;
            overflow: visible;
            .at-tooltip--right {
                z-index: 1000;
            }
        }
    }
</style>
