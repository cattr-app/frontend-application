<template>
    <img v-if="error" src="/none.png" />
    <lazy-component v-else-if="lazy">
        <img v-auth-image="url" @click="$emit('click', $event)" @error="handleError" />
    </lazy-component>
    <img v-else v-auth-image="url" @click="$emit('click', $event)" @error="handleError" />
</template>

<script>
    import axios from 'axios';

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
            const url =
                this.src.indexOf('http') === 0
                    ? this.src
                    : (process.env.VUE_APP_API_URL !== 'null' ? process.env.VUE_APP_API_URL : `${window.location.origin}/api`) + '/' + this.src;

            return {
                error: false,
                url,
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
                            baseURL: (process.env.VUE_APP_API_URL || `${window.location.origin}/api`) + '/',
                            responseType: 'blob',
                        })
                        .then(response => {
                            const blob = response.data;
                            this.url = URL.createObjectURL(blob);
                        });
                }
            },
            handleError() {
                this.error = true;
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
                    this.url = (process.env.VUE_APP_API_URL || `${window.location.origin}/api`) + '/' + this.src;
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
