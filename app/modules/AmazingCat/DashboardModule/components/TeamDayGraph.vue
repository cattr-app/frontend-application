<template>
    <div class="canvas" ref="canvasWrapper">
        <canvas ref="canvas"></canvas>

        <div class="popup"
            v-show="hoverPopup.show && !clickPopup.show"
            :style="{ left: `${hoverPopup.x - 30}px`, bottom: `${height - hoverPopup.y + 10}px` }"
        >
            <div v-if="hoverPopup.event">
                {{ getProjectName(hoverPopup.event.project_id) }}
                ({{ getTaskName(hoverPopup.event.task_id) }})
            </div>

            <div v-if="hoverPopup.event">
                {{ formatDuration(hoverPopup.event.duration) }}
            </div>

            <a class="corner" :style="{ left: `${hoverPopup.borderX}px` }"></a>
        </div>

        <div class="popup"
            v-show="clickPopup.show"
            :style="{ left: `${clickPopup.x - 30}px`, bottom: `${height - clickPopup.y + 10}px` }"
        >
            <div v-if="clickPopup.event && getScreenshotByInterval(clickPopup.intervalID)">
                <Screenshot
                    :screenshot="getScreenshotByInterval(clickPopup.intervalID)"
                    :project="getProject(clickPopup.event.project_id)"
                    :task="getTask(clickPopup.event.task_id)"
                    :user="getUser(clickPopup.event.user_id)"
                    :showText="false"
                    :disableModal="true"
                    @click="showPopup"
                />
            </div>

            <div v-if="clickPopup.event">
                <router-link :to="`/projects/view/${clickPopup.event.project_id}`">
                    {{ getProjectName(clickPopup.event.project_id) }}
                </router-link>

                <router-link :to="`/tasks/view/${clickPopup.event.task_id}`">
                    ({{ getTaskName(clickPopup.event.task_id) }})
                </router-link>
            </div>

            <a class="corner" :style="{ left: `${clickPopup.borderX}px` }"></a>
        </div>

        <ScreenshotModal :project="modal.project"
                         :screenshot="modal.screenshot"
                         :show="modal.show"
                         :showNavigation="true"
                         :task="modal.task"
                         :user="modal.user"
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
    import 'moment-timezone';
    import { mapGetters } from 'vuex';
    import Screenshot from '@/components/Screenshot';
    import ScreenshotModal from '@/components/ScreenshotModal';
    import { formatDurationString } from '@/utils/time';
    import ScreenshotService from "@/service/resource/screenshotService";
    import { cloneDeep, merge } from 'lodash';

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

    const sidebarWidth = 300;
    const titleHeight = 20;
    const subtitleHeight = 20;
    const rowHeight = 65;
    const columns = 24;

    const maxLeftOffset = 800;
    const defaultCornerOffset = 15;

    export default {
        name: 'TeamDayGraph',
        components: {
            Screenshot,
            ScreenshotModal
        },
        props: {
            users: {
                type: Array,
                required: true,
            },
            events: {
                type: Object,
                required: true,
            },
            timezone: {
                type: String,
                required: true,
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
                availableIntervals: {},
                modal: {
                    show: false,
                    interval: null,
                    project: null,
                    task: null,
                    user: null,
                    screenshot: null,
                    intervalID: null,
                },
            };
        },
        computed: {
            ...mapGetters('timeline', [
                'tasks',
                'projects',
                'screenshots',
                'intervals'
            ]),
            height() {
                return this.users.length * rowHeight + titleHeight + subtitleHeight;
            },
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
        },
        beforeDestroy() {
            window.removeEventListener('resize', this.onResize);
            window.removeEventListener('mousedown', this.onClick);
        },
        methods: {
            formatDuration: formatDurationString,
            showPopup(){
                this.modal.interval = this.clickPopup.intervalID;
                this.modal.project = this.getProject(this.clickPopup.event.project_id);
                this.modal.user = this.getUser(this.clickPopup.event.user_id);
                this.modal.task = this.getTask(this.clickPopup.event.task_id);
                this.modal.screenshot = this.getScreenshotByInterval(this.clickPopup.intervalID);

                this.modal.show = true;
            },
            onHide () {
                this.modal.show = false;
            },
            showPrevious () {
                const intervals = this.intervals[this.modal.user.id].intervals;

                const currentIndex = intervals.findIndex(x => x.id === this.modal.interval.id);

                if (currentIndex !== 0) {
                    this.modal.interval = intervals[currentIndex - 1];
                    this.modal.project = this.getProject(this.modal.interval.project_id);
                    this.modal.user = this.getUser(this.modal.interval.user_id);
                    this.modal.task = this.getTask(this.modal.interval.task_id);
                    this.modal.screenshot = this.getScreenshotByInterval(this.modal.interval.id);
                }
            },
            showNext () {
                const intervals = this.intervals[this.modal.user.id].intervals;

                const currentIndex = intervals.findIndex(x => x.id === this.modal.interval.id);

                if (currentIndex + 1 !== intervals.length) {
                    this.modal.interval = intervals[currentIndex + 1];
                    this.modal.project = this.getProject(this.modal.interval.project_id);
                    this.modal.user = this.getUser(this.modal.interval.user_id);
                    this.modal.task = this.getTask(this.modal.interval.task_id);
                    this.modal.screenshot = this.getScreenshotByInterval(this.modal.interval.id);
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
            getUser(userID) {
                return this.users.find(user => user.id === userID);
            },
            getScreenshotByInterval(intervalID) {
                return this.screenshots.find(screenshot => screenshot.time_interval_id === intervalID);
            },
            draw: debounce(function () {
                this.canvas.clear();

                const width = this.canvas.getWidth();
                const height = this.users.length * rowHeight;
                const columnWidth = width / columns;

                // Background
                this.canvas.add(new fabric.Rect({
                        left: 0, top: titleHeight + subtitleHeight,
                        width: width - 1, height: height - 1,
                        rx: 20, ry: 20,
                        fill: '#FAFAFA',
                        stroke: '#DFE5ED',
                        strokeWidth: 1,
                        ...fabricObjectOptions,
                    })
                    .on('mousedown', () => this.$emit('outsideClick'))
                );

                for (let column = 0; column < columns; ++column) {
                    const date = moment().startOf('day').add(column, 'hours');
                    const left = columnWidth * column;

                    // Column headers - hours
                    this.canvas.add(new fabric.Textbox(date.format('h'), {
                        left, top: 0,
                        width: columnWidth, height: titleHeight,
                        textAlign: 'center',
                        fontFamily: 'Nunito, sans-serif',
                        fontSize: 15,
                        fill: '#151941',
                        ...fabricObjectOptions,
                    }));

                    // Column headers - am/pm
                    this.canvas.add(new fabric.Textbox(date.format('A'), {
                        left, top: titleHeight,
                        width: columnWidth, height: subtitleHeight,
                        textAlign: 'center',
                        fontFamily: 'Nunito, sans-serif',
                        fontSize: 10,
                        fontWeight: '600',
                        fill: '#B1B1BE',
                        ...fabricObjectOptions,
                    }));

                    // Vertical grid lines
                    if (column > 0) {
                        this.canvas.add(new fabric.Line([
                            0, 0,
                            0, height,
                        ], {
                            left, top: titleHeight + subtitleHeight,
                            stroke: '#DFE5ED',
                            strokeWidth: 1,
                            ...fabricObjectOptions,
                        }));
                    }
                }

                this.users.forEach((user, row) => {
                    const top = row * rowHeight + titleHeight + subtitleHeight;

                    // Intervals
                    const userEvents = this.events[user.id];
                    if (userEvents) {
                        userEvents.forEach(event => {
                            this.availableIntervals[user.id] = merge(event.ids, this.availableIntervals[user.id]);

                            const startOfDay = moment.tz(event.start_at, this.timezone).startOf('day');
                            const secondsFromMidnight = moment(event.start_at).diff(startOfDay, 'seconds');
                            const duration = moment(event.end_at).diff(event.start_at, 'seconds');

                            const left = Math.floor(secondsFromMidnight * columnWidth / 3600);
                            const width = Math.ceil(duration * columnWidth / 3600);

                            const rect = new fabric.Rect({
                                left, top: top + rowHeight / 4,
                                width, height: rowHeight / 2,
                                rx: 2, ry: 2,
                                fill: event.is_manual ? '#c4b52d' : '#2DC48D',
                                stroke: 'transparent',
                                strokeWidth: 0,
                                ...fabricObjectOptions,
                                cursor: 'pointer',
                                hoverCursor: 'pointer',
                            });

                            rect.on('mouseover', e => {
                                if( e.target.left > maxLeftOffset ) {
                                    this.hoverPopup = {
                                        show: true,
                                        x: maxLeftOffset,
                                        y: e.target.top,
                                        event,
                                        borderX: defaultCornerOffset + e.target.left - maxLeftOffset
                                    };
                                }else{
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
                                const n = Math.floor((pointer.x - target.left) * ids.length / (target.width + 1));
                                const x = target.left + target.width * n / ids.length;
                                const y = target.top;
                                const intervalID = ids[n];

                                this.$emit('selectedIntervals', event);

                                if( x > maxLeftOffset ) {
                                    this.clickPopup = {
                                        show: true,
                                        x: maxLeftOffset,
                                        y, event, intervalID,
                                        borderX: defaultCornerOffset + x - maxLeftOffset
                                    };
                                }else{
                                    this.clickPopup = {
                                        show: true,
                                        x, y, event, intervalID,
                                        borderX: defaultCornerOffset
                                    };
                                }

                                e.e.stopPropagation();
                            });

                            this.canvas.add(rect);
                        });
                    }

                    // Horizontal grid lines
                    if (row > 0) {
                        this.canvas.add(new fabric.Line([
                            0, 0,
                            width, 0,
                        ], {
                            left: 0, top,
                            stroke: '#DFE5ED',
                            strokeWidth: 1,
                            ...fabricObjectOptions,
                        }));
                    }
                });

                this.canvas.requestRenderAll();
            }, 100),
            onResize: debounce(function () {
                const { width } = this.$refs.canvasWrapper.getBoundingClientRect();
                this.canvas.setWidth(width);
                this.canvas.setHeight(this.height);
                this.draw();
            }, 100),
            onClick(e) {
                if (e.button !== 0 || e.target && e.target.closest('.popup')) {
                    return;
                }

                if (this.clickPopup.show) {
                    this.clickPopup.show = false;
                }
            },
            async onRemove() {
                try {
                    await this.screenshotsService.deleteItem(this.modal.screenshot.id);

                    const interval = this.modal.screenshot.time_interval;
                    const totalIntervals = cloneDeep(this.intervals);
                    const userInterval = cloneDeep(this.intervals[interval.user_id]);

                    userInterval.duration -= moment(interval.end_at).diff(interval.start_at, 'seconds');
                    userInterval.intervals = userInterval.intervals.filter(int => int.id !== interval.id);

                    totalIntervals[interval.user_id] = userInterval;
                    this.$store.dispatch('timeline/setIntervals', totalIntervals);

                    this.$Notify({
                        type: 'success',
                        title: 'Deleted Successfully',
                        message: 'Screenshot was deleted successfully'
                    });
                } catch (e) {
                    this.$Notify({
                        type: 'error',
                        title: 'Deletion Error',
                        message: 'This screenshot can not be deleted OR something unusual happened during the request'
                    });
                }
            }
        },
        watch: {
            users() {
                this.onResize();
            },
            events() {
                this.draw();
            },
            timezone() {
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
            position: absolute;
            display: block;

            background: #ffffff;

            border: 0;
            border-radius: 20px;

            box-shadow: 0px 7px 64px rgba(0, 0, 0, 0.07);

            width: 270px;

            padding: 10px;

            text-align: center;

            z-index: 1;

            & .corner {
                content: ' ';

                position: absolute;
                display: block;

                border-top: 10px solid #ffffff;
                border-left: 15px solid transparent;
                border-right: 15px solid transparent;

                left: 15px;
                bottom: -10px;

                width: 0;
                height: 0;

                z-index: 1;
            }
        }
    }
</style>
