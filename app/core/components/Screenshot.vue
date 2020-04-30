<template>
    <div class="screenshot" @click="$emit('click', $event)">
        <AppImage
            :is-blob="false"
            :src="getThumbnailPath(screenshot)"
            class="screenshot-image"
            :lazy="lazyImage"
            @click="onShow"
        />

        <div v-if="showText" class="screenshot-text">
            <span v-if="task && showTask" class="screenshot-task" :title="task.task_name">
                {{ task.task_name }}
            </span>
            <span class="screenshot-time">{{ screenshotTime }}</span>
        </div>

        <ScreenshotModal
            v-if="!disableModal"
            :project="project"
            :screenshot="screenshot"
            :show="showModal"
            :showNavigation="showNavigation"
            :task="task"
            :user="user"
            @close="onHide"
            @remove="onRemove"
            @showNext="$emit('showNext')"
            @showPrevious="$emit('showPrevious')"
        />
    </div>
</template>

<script>
    import moment from 'moment';
    import AppImage from './AppImage';
    import ScreenshotModal from './ScreenshotModal';
    import { mapGetters } from 'vuex';

    export function thumbnailPathProvider(screenshot) {
        return screenshot.path;
    }

    export const config = { thumbnailPathProvider };

    export default {
        name: 'Screenshot',
        components: {
            AppImage,
            ScreenshotModal,
        },
        props: {
            screenshot: {
                type: Object,
            },
            project: {
                type: Object,
            },
            task: {
                type: Object,
            },
            user: {
                type: Object,
            },
            showText: {
                type: Boolean,
                default: true,
            },
            showTask: {
                type: Boolean,
                default: true,
            },
            showNavigation: {
                type: Boolean,
                default: false,
            },
            disableModal: {
                type: Boolean,
                default: false,
            },
            lazyImage: {
                type: Boolean,
                default: true,
            },
            timezone: {
                type: String,
            },
        },
        data() {
            return {
                showModal: false,
            };
        },
        computed: {
            ...mapGetters('user', ['companyData']),
            screenshotTime() {
                const timezone = this.timezone || this.companyData['timezone'];

                if (!timezone && !this.screenshot.time_interval.start_at) {
                    return;
                }

                return moment(this.screenshot.time_interval.start_at)
                    .tz(timezone)
                    .format('HH:mm');
            },
        },
        methods: {
            onShow() {
                if (this.disableModal) {
                    return;
                }

                this.showModal = true;
                this.$emit('showModalChange', true);
            },
            onHide() {
                this.showModal = false;
                this.$emit('showModalChange', false);
            },
            onRemove() {
                this.onHide();
                this.$emit('remove', this.screenshot);
            },
            getThumbnailPath(screenshot) {
                return config.thumbnailPathProvider(screenshot);
            },
        },
    };
</script>

<style lang="scss" scoped>
    .screenshot {
        display: flex;
        flex-flow: column;

        &-image {
            border-radius: 5px;
            cursor: pointer;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        &-text {
            align-items: baseline;
            color: #59566e;
            display: flex;
            flex-flow: row nowrap;
            font-size: 11px;
            font-weight: 600;
            justify-content: space-between;
        }

        &-task {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        &-time {
            margin-left: 0.5em;
        }
    }
</style>
