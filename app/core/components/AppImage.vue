<template>
    <div>
        <transition appear mode="out-in" name="fade">
            <Skeleton v-if="!loaded" />
            <template v-else>
                <img v-if="error" src="@/assets/none.png" alt="Empty image" />
                <lazy-component v-else-if="lazy">
                    <img :src="url" alt="screenshot" @click="$emit('click', $event)" @error="handleError" />
                </lazy-component>
                <img v-else :src="url" alt="screenshot" @click="$emit('click', $event)" @error="handleError" />
            </template>
        </transition>
    </div>
</template>

<script>
    import axios from '@/config/app';
    import { Skeleton } from 'vue-loading-skeleton';

    export default {
        name: 'AppImage',
        props: {
            src: {
                type: String,
                required: true,
            },
            lazy: {
                type: Boolean,
                default: false,
            },
        },
        data() {
            const baseUrl =
                this.src.indexOf('http') === 0
                    ? ''
                    : (process.env.VUE_APP_API_URL !== 'null'
                          ? process.env.VUE_APP_API_URL
                          : `${window.location.origin}/api`) + '/';

            const url = baseUrl + this.src;

            return {
                error: this.src === 'none',
                loaded: this.src === 'none',
                url,
                baseUrl,
            };
        },
        components: {
            Skeleton,
        },
        methods: {
            load() {
                if (this.error) return;

                this.loaded = false;

                if (this.url) {
                    URL.revokeObjectURL(this.url);
                    this.url = null;
                }

                if (this.src) {
                    axios
                        .get(this.src, {
                            responseType: 'blob',
                        })
                        .then(({ data }) => {
                            this.url = URL.createObjectURL(data);
                        })
                        .catch(() => {
                            this.error = true;
                        })
                        .finally(() => {
                            this.loaded = true;
                        });
                }
            },
            handleError() {
                this.error = true;
            },
        },
        mounted() {
            this.load();
        },
        beforeDestroy() {
            if (this.url) {
                URL.revokeObjectURL(this.url);
                this.url = null;
            }
        },
        watch: {
            src() {
                this.load();
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

    .fade-enter-active,
    .fade-leave-active {
        transition: opacity 0.4s;
    }
    .fade-enter,
    .fade-leave-to {
        opacity: 0;
    }
</style>
