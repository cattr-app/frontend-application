<template>
    <lazy-component v-if="lazy">
        <img v-auth-image="url" @click="$emit('click', $event)" />
    </lazy-component>
    <img v-else v-auth-image="url" @click="$emit('click', $event)" />
</template>

<script>
    import axios from 'axios';
    import env from '_app/etc/env';

    export default {
        name: 'AppImage',
        props: {
            src: {
                type: String,
                required: true,
            },
            isBlob: {
                type: Boolean,
                default: true,
            },
            lazy: {
                type: Boolean,
                default: false,
            },
        },
        data() {
            return {
                url: (env.API_URL || `${window.location.origin}/api`) + '/' + this.src,
            };
        },
        methods: {
            load() {
                if (this.url) {
                    URL.revokeObjectURL(this.url);
                    this.url = null;
                }

                if (this.src) {
                    axios
                        .get(this.src, {
                            baseURL: (env.API_URL || `${window.location.origin}/api`) + '/',
                            responseType: 'blob',
                        })
                        .then(response => {
                            const blob = response.data;
                            this.url = URL.createObjectURL(blob);
                        });
                }
            },
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
                    this.url = (env.API_URL || `${window.location.origin}/api`) + '/' + this.src;
                }
            },
        },
    };
</script>

<style lang="scss" scoped>
    img {
        width: 100%;
        object-fit: cover;
        background-color: $gray-5;
    }
</style>
