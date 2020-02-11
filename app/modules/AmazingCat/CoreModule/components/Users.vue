<template>
    <router-view></router-view>
</template>

<script>
    export default {
        mounted() {
            if (this.$route.name === 'company.users') {
                this.$router.push({name: 'AmazingCat_CoreModule.crud.users'});
            }
        },
    };
</script>

<style lang="scss" scoped>
    .crud {
        width: 100%;
    }
</style>
