<template>
    <router-view></router-view>
</template>

<script>
    export default {
        mounted() {
            if (this.$route.name === 'company.users') {
                this.$router.push({ name: 'AmazingCat_CoreModule.crud.users' });
            } else if (this.$route.name === 'company.users.view') {
                this.$router.replace({
                    name: 'AmazingCat_CoreModule.crud.users.view',
                    params: { id: this.$route.params.id },
                });
            }
        },
    };
</script>

<style lang="scss" scoped>
    .crud {
        width: 100%;
    }
</style>
