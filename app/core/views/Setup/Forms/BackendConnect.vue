<template>
    <div class="status">
        <at-alert class="status__alert" :type="typeStatus" :message="message" show-icon />
        <at-button type="info" class="status__button" @click="makeConnection">Update status</at-button>
    </div>
</template>

<script>
    import ApiService from '@/service/api';

    export default {
        name: 'backend-connect',
        data() {
            return {
                status: 'process',
                apiService: new ApiService(),
            };
        },
        async created() {
            await this.makeConnection();
        },
        computed: {
            typeStatus() {
                if (this.status !== 'finish' && this.status !== 'error') {
                    return 'process';
                }
                return this.getStatus();
            },
            message() {
                return (
                    this.$t(`setup.header.backend-connect.status`) +
                    ': ' +
                    this.$t(`setup.header.backend-connect.${this.getStatus()}`)
                );
            },
        },
        methods: {
            async makeConnection() {
                this.status = 'process';
                try {
                    const { data } = await this.apiService.chechStatusBackend();
                    this.status = 'finish';
                } catch ({ response }) {
                    this.status = 'error';
                }
                this.$Notify({
                    title: this.$t(`setup.header.backend-connect.status`),
                    message: this.$t(`setup.header.backend-connect.${this.getStatus()}`),
                    type: this.getStatus(),
                });
            },
            getStatus() {
                return this.status === 'finish' ? 'success' : this.status;
            },
        },
        watch: {
            status(status) {
                this.$emit('setState', { 'backend-connect': { status } });
            },
        },
    };
</script>

<style lang="scss" scoped>
    .status {
        display: flex;
        &__button {
            margin-left: 10px;
        }
        &__alert {
            min-width: 300px;
        }
    }
</style>
