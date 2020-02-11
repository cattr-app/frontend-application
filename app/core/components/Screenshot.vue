<template>
    <div @click="$emit('click', $event)" class="screenshot">
        <AppImage
                :is-blob="false"
                :src="screenshot.thumbnail_path || screenshot.path"
                @click="onShow"
                class="screenshot-image"
        />

        <div class="screenshot-text" v-if="showText">
            <span class="screenshot-task" v-if="task && showTask">{{ task.task_name }}</span>
            <span class="screenshot-time">{{ formatTime(screenshot.created_at) }}</span>
        </div>

        <ScreenshotModal :project="project"
                         :screenshot="screenshot"
                         :show="showModal"
                         :showNavigation="showNavigation"
                         :task="task"
                         :user="user"
                         @close="onHide"
                         @remove="onRemove"
                         @showNext="$emit('showNext')"
                         @showPrevious="$emit('showPrevious')"
                         v-if="!disableModal"
        />
    </div>
</template>

<script>
    import moment from 'moment';
    import AppImage from './AppImage';
    import ScreenshotModal from './ScreenshotModal';

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
        },
        data () {
            return {
                showModal: false,
            };
        },
        methods: {
            formatTime (value) {
                return moment(value).format('HH:mm');
            },
            onShow () {
                if (this.disableModal) {
                    return;
                }

                this.showModal = true;
                this.$emit('showModalChange', true);
            },
            onHide () {
                this.showModal = false;
                this.$emit('showModalChange', false);
            },
            onRemove () {
                this.onHide();
                this.$emit('remove', this.screenshot);
            },
        },
    };
</script>

<style lang="scss" scoped>
    .screenshot
    {
        display:   flex;
        flex-flow: column;

        &-image
        {
            border-radius: 5px;
            cursor:        pointer;
            display:       inline-block;
            flex:          1;
            height:        auto;
            width:         100%;
            object-fit:    cover;
        }

        &-text
        {
            align-items:     baseline;
            color:           #59566E;
            display:         flex;
            flex-flow:       row nowrap;
            font-size:       11px;
            font-weight:     600;
            justify-content: space-between;
        }

        &-task
        {
            overflow:      hidden;
            text-overflow: ellipsis;
            white-space:   nowrap;
        }

        &-time
        {
            margin-left: 0.5em;
        }
    }
</style>
