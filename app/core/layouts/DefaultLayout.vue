<template>
    <div class="default-layout">
        <Navigation/>
        <div class="content-wrapper">
            <div class="container-fluid">
                <slot></slot>
            </div>
        </div>
        <!-- /.content-wrapper -->
    </div>
</template>

<script>
    import Navigation from '@/components/Navigation';

    export default {
        name: "DefaultLayout",
        components: {
            Navigation
        }
    }
</script>

<style scoped>

</style>
