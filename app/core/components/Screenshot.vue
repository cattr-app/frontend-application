<template>
    <div class="screenshot" @click="$emit('click', $event)">
        <AppImage
            :is-blob="false"
            :src="getThumbnailPath(screenshot)"
            class="screenshot__image"
            :lazy="lazyImage"
            @click="onShow"
        />

        <at-tooltip>
            <template slot="content">
                <div v-if="screenshot.time_interval.activity_fill === null" class="screenshot__activity">
                    {{ $t('tooltip.activity_progress.not_tracked') }}
                </div>
                <div v-else class="screenshot__activity">
                    <span class="screenshot__overall-activity">
                        {{
                            $t('tooltip.activity_progress.overall', { percent: screenshot.time_interval.activity_fill })
                        }}
                    </span>
                    <div class="screenshot__device-activity">
                        <span v-if="screenshot.time_interval.mouse_fill !== null">
                            {{
                                $t('tooltip.activity_progress.mouse', { percent: screenshot.time_interval.mouse_fill })
                            }}
                        </span>
                        <span v-if="screenshot.time_interval.keyboard_fill !== null">{{
                            $t('tooltip.activity_progress.keyboard', {
                                percent: screenshot.time_interval.keyboard_fill,
                            })
                        }}</span>
                    </div>
                </div>
            </template>
            <at-progress
                class="screenshot__activity-bar"
                :stroke-width="5"
                :percent="screenshot.time_interval.activity_fill || 0"
            />
        </at-tooltip>

        <div v-if="showText" class="screenshot__text">
            <span v-if="task && showTask" class="screenshot__task" :title="`${task.task_name} (${task.project.name})`">
                {{ task.task_name }} ({{ task.project.name }})
            </span>
            <span class="screenshot__time">{{ screenshotTime }}</span>
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

                if (!timezone || !this.screenshot.time_interval.start_at) {
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
        &__image {
            border-radius: 5px;
            cursor: pointer;
            width: 100%;
            line-height: 0;
            overflow: hidden;

            &::v-deep {
                img {
                    height: 150px;
                }
            }
        }

        &__text {
            align-items: baseline;
            color: #59566e;
            display: flex;
            flex-flow: row nowrap;
            font-size: 11px;
            font-weight: 600;
            justify-content: space-between;
        }

        &__activity {
            text-align: center;
        }

        &__device-activity {
            white-space: nowrap;
        }

        &__task {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        &::v-deep {
            .at-tooltip {
                width: 100%;

                &__trigger {
                    width: 100%;
                }
            }

            .at-progress__text {
                display: none;
            }
        }
    }
</style>
