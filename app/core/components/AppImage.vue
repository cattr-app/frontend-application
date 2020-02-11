<template>
    <img :src="url" @click="$emit('click', $event)"/>
</template>

<script>
    import axios from 'axios';
    import env from '_app/etc/env';

    export default {
        name: 'AppImage',
        props: {
            src: {
                type: String,
                required: true
            },
            isBlob: {
                type: Boolean,
                default: true
            }
        },
        data() {
            return {
                url: env.API_URL + '/' + this.src
            };
        },
        methods: {
            load() {
                if (this.url) {
                    URL.revokeObjectURL(this.url);
                    this.url = null;
                }

                if (this.src) {
                    axios.get(this.src, {
                        baseURL: (env.API_URL || 'http://localhost:8000') + '/',
                        responseType: 'blob'
                    }).then(response => {
                        const blob = response.data;
                        this.url = URL.createObjectURL(blob);
                    });
                }
            }
        },
        mounted() {
            if (this.isBlob) {
                this.load();
            }
        },
        beforeDestroy() {
            if (this.url) {
                URL.revokeObjectURL(this.url);
                this.url = null;
            }
        },
        watch: {
            src() {
                if (this.isBlob) {
                    this.load();
                } else {
                    this.url = env.API_URL + '/' + this.src;
                }
            }
        }
    };
</script>

<style scoped>
</style>
