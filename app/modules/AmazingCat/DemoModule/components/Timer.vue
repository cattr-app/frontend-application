<template>
    <i18n class="demo" path="demo.warning" tag="div">
        <template v-slot:timer>
            <a v-html="timeBeforeDemoReset" />
        </template>
    </i18n>
</template>

<script>
    export default {
        data() {
            return {
                timeBeforeDemoReset: '',
            };
        },

        created() {
            this.interval = setInterval(() => {
                const now = new Date();

                const h = 2 - (now.getHours() % 3);
                const m = 59 - now.getMinutes();
                const s = (59 - now.getSeconds()).toString().padStart(2, '0');

                this.timeBeforeDemoReset = `${h}:${m}:${s}`;
            }, 1000);
        },

        beforeDestroy() {
            clearInterval(this.interval);
        },
    };
</script>

<style lang="scss" scoped>
    .demo {
        background: $red-200;
        font-weight: bold;
        padding: 5px;
        text-align: center;
    }
</style>
