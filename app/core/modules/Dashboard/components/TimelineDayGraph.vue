<template>
    <div ref="canvasWrapper" class="canvas">
        <canvas ref="canvas"></canvas>

        <div
            v-show="hoverPopup.show && !clickPopup.show"
            :style="{
                left: `${hoverPopup.x - 30}px`,
                bottom: `${height - hoverPopup.y + 10}px`,
            }"
            class="popup"
        >
            <div v-if="hoverPopup.event">
                {{ getTaskName(hoverPopup.event.task.id) }}
                ({{ getProjectName(hoverPopup.event.task.project_id) }})
            </div>

            <div v-if="hoverPopup.event">
                {{ formatDuration(hoverPopup.event.duration) }}
            </div>

            <a class="corner" :style="{ left: `${hoverPopup.borderX}px` }"></a>
        </div>

        <div
            v-show="clickPopup.show"
            :style="{
                left: `${clickPopup.x - 30}px`,
                bottom: `${height - clickPopup.y + 10}px`,
            }"
            class="popup"
            :data-offset="`${clickPopup.borderX}px`"
        >
            <Screenshot
                v-if="clickPopup.event && getScreenshotByInterval(clickPopup.intervalID)"
                :lazyImage="false"
                :disableModal="true"
                :project="getProject(clickPopup.event.project_id)"
                :screenshot="getScreenshotByInterval(clickPopup.intervalID)"
                :showText="false"
                :task="getTask(clickPopup.event.task_id)"
                :user="user"
                @click="showPopup(getScreenshotByInterval(clickPopup.intervalID))"
            />

            <div v-if="clickPopup.event">
                <router-link :to="`/tasks/view/${clickPopup.event.task.id}`">
                    {{ getTaskName(clickPopup.event.task.id) }}
                </router-link>

                <router-link :to="`/projects/view/${clickPopup.event.task.project_id}`">
                    ({{ getProjectName(clickPopup.event.task.project_id) }})
                </router-link>
            </div>

            <a class="corner" :style="{ left: `${clickPopup.borderX}px` }"></a>
        </div>

        <ScreenshotModal
            :project="modal.project"
            :screenshot="modal.screenshot"
            :show="modal.show"
            :showNavigation="true"
            :task="modal.task"
            :user="user"
            @close="onHide"
            @remove="onRemove"
            @showNext="showNext"
            @showPrevious="showPrevious"
        />
    </div>
</template>

<script>
    import { fabric } from 'fabric';
    import debounce from 'lodash/debounce';
    import moment from 'moment';
    import { formatDurationString } from '@/utils/time';
    import Screenshot from '@/components/Screenshot';
    import ScreenshotModal from '@/components/ScreenshotModal';
    import ScreenshotService from '@/services/resource/screenshot.service';
    import { mapGetters } from 'vuex';

    const fabricObjectOptions = {
        editable: false,
        selectable: false,
        objectCaching: false,
        hasBorders: false,
        hasControls: false,
        hasRotatingPoint: false,
        cursor: 'default',
        hoverCursor: 'default',
    };

    const titleHeight = 20;
    const subtitleHeight = 20;
    const timelineHeight = 75;
    const columns = 24;

    const popupWidth = 270;
    const canvasPadding = 24;
    const defaultCornerOffset = 15;

    export default {
        name: 'TimelineDayGraph',
        props: {
            start: {
                type: String,
                required: true,
            },
            end: {
                type: String,
                required: true,
            },
            events: {
                type: Array,
                required: true,
            },
            timezone: {
                type: String,
                required: true,
            },
        },
        components: {
            Screenshot,
            ScreenshotModal,
        },
        computed: {
            ...mapGetters('timeline', ['tasks', 'screenshots', 'intervals']),
            ...mapGetters('user', ['user']),
            height() {
                return timelineHeight + titleHeight + subtitleHeight;
            },
            projects() {
                return Object.keys(this.tasks)
                    .map(taskID => this.tasks[taskID])
                    .reduce((projects, task) => ({ ...projects, [task.project_id]: task.project }), {});
            },
        },
        data() {
            return {
                hoverPopup: {
                    show: false,
                    x: 0,
                    y: 0,
                    event: null,
                    borderX: 0,
                },
                clickPopup: {
                    show: false,
                    x: 0,
                    y: 0,
                    event: null,
                    intervalID: null,
                    borderX: 0,
                },
                screenshotsService: new ScreenshotService(),
                modal: {
                    screenshot: null,
                    project: null,
                    task: null,
                    show: false,
                },
            };
        },
        mounted() {
            this.canvas = new fabric.Canvas(this.$refs.canvas, {
                backgroundColor: '#fff',
                renderOnAddRemove: false,
                selection: false,
                skipOffscreen: true,
            });

            this.onResize();
            window.addEventListener('resize', this.onResize);
            window.addEventListener('mousedown', this.onClick);
            window.addEventListener('keydown', this.onKeyDown);
        },
        beforeDestroy() {
            window.removeEventListener('resize', this.onResize);
            window.removeEventListener('mousedown', this.onClick);
            window.removeEventListener('keydown', this.onKeyDown);
        },
        methods: {
            formatDuration: formatDurationString,
            showPopup(screenshot) {
                if (typeof screenshot !== 'object') {
                    return;
                }

                this.modal.task = this.getTask(screenshot.time_interval?.task_id);
                this.modal.project = this.modal.task?.project;
                this.modal.screenshot = screenshot;

                this.modal.show = true;
            },
            onHide() {
                this.modal.show = false;
            },
            onKeyDown(e) {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.showPrevious();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.showNext();
                }
            },
            showPrevious() {
                const currentIndex = this.screenshots.findIndex(x => x.id === this.modal.screenshot.id);

                if (currentIndex !== 0) {
                    this.modal.screenshot = this.screenshots[currentIndex - 1];
                }
            },
            showNext() {
                const currentIndex = this.screenshots.findIndex(x => x.id === this.modal.screenshot.id);

                if (currentIndex + 1 !== this.screenshots.length) {
                    this.modal.screenshot = this.screenshots[currentIndex + 1];
                }
            },
            getProjectName(projectID) {
                const project = this.getProject(projectID);
                if (!project) {
                    return '';
                }

                return project.name;
            },
            getTaskName(taskID) {
                const task = this.getTask(taskID);
                if (!task) {
                    return '';
                }

                return task.task_name;
            },
            getProject(projectID) {
                if (!this.projects[projectID]) {
                    return null;
                }

                return this.projects[projectID];
            },
            getTask(taskID) {
                if (!this.tasks[taskID]) {
                    return null;
                }

                return this.tasks[taskID];
            },
            getScreenshotByInterval(intervalID) {
                return this.screenshots.find(screenshot => screenshot.time_interval_id === intervalID);
            },
            draw: debounce(function() {
                this.canvas.clear();

                const width = this.canvas.getWidth();
                const columnWidth = width / columns;

                // Background
                this.canvas.add(
                    new fabric.Rect({
                        left: 0,
                        top: titleHeight + subtitleHeight,
                        width: width - 1,
                        height: timelineHeight - 1,
                        rx: 20,
                        ry: 20,
                        fill: '#FAFAFA',
                        stroke: '#DFE5ED',
                        strokeWidth: 1,
                        ...fabricObjectOptions,
                    }).on('mousedown', () => this.$emit('outsideClick')),
                );

                if (!this.$refs.canvasWrapper) {
                    return;
                }
                const { width: canvasWidth } = this.$refs.canvasWrapper.getBoundingClientRect();
                const maxLeftOffset = canvasWidth - popupWidth + 2 * canvasPadding;

                for (let i = 0; i < columns; ++i) {
                    const date = moment()
                        .startOf('day')
                        .add(i, 'hours');
                    const left = columnWidth * i;

                    // Column header - hour
                    this.canvas.add(
                        new fabric.Textbox(date.format('h'), {
                            left,
                            top: 0,
                            width: columnWidth,
                            height: titleHeight,
                            textAlign: 'center',
                            fontFamily: 'Nunito, sans-serif',
                            fontSize: 15,
                            fill: '#151941',
                            ...fabricObjectOptions,
                        }),
                    );

                    // Column header - am/pm
                    this.canvas.add(
                        new fabric.Textbox(date.format('A'), {
                            left,
                            top: titleHeight,
                            width: columnWidth,
                            height: subtitleHeight,
                            textAlign: 'center',
                            fontFamily: 'Nunito, sans-serif',
                            fontSize: 10,
                            fontWeight: '600',
                            fill: '#B1B1BE',
                            ...fabricObjectOptions,
                        }),
                    );

                    // Vertical grid line
                    if (i > 0) {
                        this.canvas.add(
                            new fabric.Line([0, 0, 0, timelineHeight], {
                                left,
                                top: titleHeight + subtitleHeight,
                                stroke: '#DFE5ED',
                                strokeWidth: 1,
                                ...fabricObjectOptions,
                            }),
                        );
                    }
                }

                // Intervals
                this.events.forEach(event => {
                    const startOfDay = moment.tz(event.start_at, this.timezone).startOf('day');
                    const secondsFromMidnight = moment.utc(event.start_at).diff(startOfDay, 'seconds');
                    const duration = moment.utc(event.end_at).diff(event.start_at, 'seconds');

                    const left = Math.floor((secondsFromMidnight * columnWidth) / 3600);
                    const width = Math.ceil((duration * columnWidth) / 3600);

                    const rect = new fabric.Rect({
                        left,
                        top: titleHeight + subtitleHeight + 22,
                        width,
                        height: 30,
                        rx: 3,
                        ry: 3,
                        fill: event.is_manual ? '#c4b52d' : '#2DC48D',
                        stroke: 'transparent',
                        strokeWidth: 0,
                        ...fabricObjectOptions,
                        cursor: 'pointer',
                        hoverCursor: 'pointer',
                    });

                    rect.on('mouseover', e => {
                        if (e.target.left > maxLeftOffset) {
                            this.hoverPopup = {
                                show: true,
                                x: maxLeftOffset,
                                y: e.target.top,
                                event,
                                borderX: defaultCornerOffset + e.target.left - maxLeftOffset,
                            };
                        } else {
                            this.hoverPopup = {
                                show: true,
                                x: e.target.left,
                                y: e.target.top,
                                borderX: defaultCornerOffset,
                                event,
                            };
                        }
                    });

                    rect.on('mouseout', e => {
                        this.hoverPopup = {
                            ...this.hoverPopup,
                            show: false,
                        };
                    });

                    rect.on('mousedown', e => {
                        const { ids } = event;
                        const { pointer, target } = e;
                        const n = Math.floor(((pointer.x - target.left) * ids.length) / (target.width + 1));
                        const x = target.left + (target.width * n) / ids.length;
                        const y = target.top;
                        const intervalID = ids[n];

                        this.$emit('selectedIntervals', event);

                        if (x > maxLeftOffset) {
                            this.clickPopup = {
                                show: true,
                                x: maxLeftOffset,
                                y,
                                event,
                                intervalID,
                                borderX: defaultCornerOffset + x - maxLeftOffset,
                            };
                        } else {
                            this.clickPopup = {
                                show: true,
                                x,
                                y,
                                event,
                                intervalID,
                                borderX: defaultCornerOffset,
                            };
                        }

                        e.e.stopPropagation();
                    });

                    this.canvas.add(rect);
                });

                this.canvas.requestRenderAll();
            }),
            onClick(e) {
                if (
                    e.target &&
                    e.target.parentElement &&
                    !e.target.parentElement.classList.contains(this.canvas.wrapperEl.classList) &&
                    !e.target.closest('.time-interval-edit-panel') &&
                    !e.target.closest('.screenshot') &&
                    !e.target.closest('.modal') &&
                    !e.target.closest('.at-modal') &&
                    !e.target.closest('.popup')
                ) {
                    if (this.clickPopup.show) {
                        this.clickPopup.show = false;
                    }
                }
            },
            onResize: debounce(function() {
                if (!this.$refs.canvasWrapper) {
                    return;
                }
                const { width } = this.$refs.canvasWrapper.getBoundingClientRect();
                this.canvas.setWidth(width);

                const height = titleHeight + subtitleHeight + timelineHeight;
                this.canvas.setHeight(height);

                this.draw();
            }, 100),
            async onRemove() {
                try {
                    await this.screenshotsService.deleteItem(this.modal.screenshot.id);

                    this.$Notify({
                        type: 'success',
                        title: this.$t('notification.screenshot.delete.success.title'),
                        message: this.$t('notification.screenshot.delete.success.message'),
                    });

                    this.modal.show = false;
                } catch (e) {
                    this.$Notify({
                        type: 'error',
                        title: this.$t('notification.screenshot.delete.error.title'),
                        message: this.$t('notification.screenshot.delete.error.message'),
                    });
                }
            },
        },
        watch: {
            events() {
                this.draw();
            },
        },
    };
</script>

<style lang="scss" scoped>
    .canvas {
        position: relative;

        &::v-deep canvas {
            box-sizing: content-box;
        }

        .popup {
            background: #ffffff;
            border: 0;

            border-radius: 20px;

            box-shadow: 0px 7px 64px rgba(0, 0, 0, 0.07);
            display: block;

            padding: 10px;

            position: absolute;

            text-align: center;

            width: 270px;

            z-index: 1;

            & .corner {
                border-left: 15px solid transparent;

                border-right: 15px solid transparent;
                border-top: 10px solid #ffffff;

                bottom: -10px;
                content: ' ';
                display: block;

                height: 0;

                position: absolute;
                width: 0;

                z-index: 1;
            }
        }
    }
</style>
