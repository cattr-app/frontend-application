<template>
    <div class="avatar">
        <vue-avatar
            class="avatar__photo"
            :username="username"
            :size="size"
            :customStyle="styles"
            :backgroundColor="backgroundColor"
            :src="src"
        ></vue-avatar>
        <div v-show="online" class="avatar__online-status"></div>
    </div>
</template>

<script>
    import md5 from 'js-md5';
    import Avatar from 'vue-avatar';

    export default {
        name: 'UserAvatar',
        props: {
            size: {
                type: Number,
                default: 30,
            },
            borderRadius: {
                type: Number,
                default: 5,
            },
            user: {
                type: Object,
                required: true,
            },
            online: {
                type: Boolean,
            },
        },
        components: {
            'vue-avatar': Avatar,
        },
        computed: {
            username() {
                if (!this.user || !this.user.full_name) {
                    return '';
                }

                return this.user.full_name;
            },
            email() {
                if (!this.user || !this.user.email) {
                    return '';
                }

                return this.user.email;
            },
            src() {
                if (this.user.avatar === 'gravatar') {
                    const emailMD5 = md5(this.email);

                    return `https://www.gravatar.com/avatar/${emailMD5}`;
                }

                return null;
            },
            backgroundColor() {
                return !this.username ? '#eaeaea' : null;
            },
            styles() {
                return {
                    borderRadius: `${this.borderRadius}px`,
                };
            },
        },
    };
</script>

<style lang="scss" scoped>
    .avatar {
        position: relative;

        &__online-status {
            height: 7px;
            width: 7px;
            position: absolute;
            background: #6eceb2;
            border-radius: 100%;
            border: 1px solid white;
            right: 0;
            bottom: 0px;
        }
    }
</style>
