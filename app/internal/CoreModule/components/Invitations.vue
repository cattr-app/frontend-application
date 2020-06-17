<template>
    <router-view></router-view>
</template>

<script>
    export default {
        mounted() {
            switch (this.$route.name) {
                case 'company.invitations':
                    this.$router.replace({ name: 'Core.crud.invitations' });
                    break;

                case 'company.invitations.view':
                    this.$router.replace({
                        name: 'Core.crud.invitations.view',
                        params: { id: this.$route.params.id },
                    });
                    break;
            }
        },
    };
</script>

<style scoped></style>
