<template>
    <canvas ref="canvas"></canvas>
</template>

<script>
    import { fabric } from 'fabric';
    import md5 from 'js-md5';
    import debounce from 'lodash/debounce';
    import moment from 'moment';
    import { getBackgroundColor } from '@/utils/avatar';
    import { getInitials } from '@/utils/string';
    import { formatDurationString } from '@/utils/time';

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
    const avatarSize = 25;

    export default {
        name: 'TeamSidebar',
        props: {
            users: {
                type: Array,
                required: true,
            },
            worked: {
                type: Object,
                required: true,
            },
            currentTasks: {
                type: Object,
                required: true,
            },
            currentProjects: {
                type: Object,
                required: true,
            },
            sort: {
                type: String,
                required: true,
            },
            sortDir: {
                type: String,
                required: true,
            },
        },
        mounted() {
            this.canvas = new fabric.Canvas(this.$refs.canvas, {
                backgroundColor: '#fff',
                renderOnAddRemove: false,
                selection: false,
                skipOffscreen: true,
            });

            // Fabric function override for use text overflow ellipsis
            fabric.Textbox.prototype._wrapLine = function(_line, lineIndex, desiredWidth) {
                var lineWidth = 0,
                    graphemeLines = [],
                    line = [],
                    // spaces in different languges?
                    words = _line.split(this._reSpaceAndTab),
                    word = '',
                    offset = 0,
                    infix = ' ',
                    wordWidth = 0,
                    infixWidth = 0,
                    largestWordWidth = 0,
                    lineJustStarted = true,
                    additionalSpace = this._getWidthOfCharSpacing(),
                    textWidth = this._measureWord(_line, lineIndex, offset);

                if (this.ellipsis && textWidth > desiredWidth && !this.isEditing) {
                    var ellipsis = '...';
                    var length = _line.length;
                    while (textWidth >= desiredWidth && length-- > 0) {
                        _line = _line.substring(0, length);
                        textWidth = this._measureWord(_line, lineIndex, offset);
                    }
                    graphemeLines.push([_line + ellipsis]);
                    return graphemeLines;
                } else {
                    for (var i = 0; i < words.length; i++) {
                        // i would avoid resplitting the graphemes
                        word = fabric.util.string.graphemeSplit(words[i]);
                        wordWidth = this._measureWord(word, lineIndex, offset);
                        offset += word.length;

                        lineWidth += infixWidth;

                        if ((this.breakWords && wordWidth > desiredWidth) || (this.ellipsis && this.isEditing)) {
                            line.push(infix);
                            var letterWidth;
                            // var word = word.split('');
                            while (word.length) {
                                letterWidth = this._measureWord(word[0], lineIndex, offset);
                                if (lineWidth + letterWidth > desiredWidth) {
                                    graphemeLines.push(line);
                                    line = [];
                                    lineWidth = 0;
                                }
                                line.push(word.shift());
                                offset++;
                                lineWidth += letterWidth;
                            }
                            word = '';
                        } else {
                            lineWidth += wordWidth - additionalSpace;
                        }

                        if (lineWidth >= desiredWidth && !lineJustStarted) {
                            graphemeLines.push(line);
                            line = [];
                            lineWidth = wordWidth;
                            lineJustStarted = true;
                        }

                        if (!lineJustStarted) {
                            line.push(infix);
                        }
                        line = line.concat(word);

                        infixWidth = this._measureWord([infix], lineIndex, offset);
                        offset++;
                        lineJustStarted = false;
                        // keep track of largest word
                        if (wordWidth > largestWordWidth && !this.breakWords && !this.ellipsis) {
                            largestWordWidth = wordWidth;
                        }
                    }

                    i && graphemeLines.push(line);

                    if (largestWordWidth > this.dynamicMinWidth) {
                        this.dynamicMinWidth = largestWordWidth - additionalSpace;
                    }

                    return graphemeLines;
                }
            };

            this.onResize();
            window.addEventListener('resize', this.onResize);
        },
        beforeDestroy() {
            window.removeEventListener('resize', this.onResize);
        },
        methods: {
            formatDuration: formatDurationString,
            draw: debounce(function() {
                this.canvas.clear();

                // User column header
                const userLabel = new fabric.Textbox(this.$t('dashboard.user'), {
                    left: 0,
                    top: 8,
                    height: rowHeight,
                    textAlign: 'left',
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: 15,
                    fontWeight: '600',
                    fill: '#B1B1BE',
                    ...fabricObjectOptions,
                    cursor: 'pointer',
                    hoverCursor: 'pointer',
                });
                userLabel.on('mousedown', e => this.$emit('sort', 'user'));
                this.canvas.add(userLabel);

                if (this.sort === 'user') {
                    const sortIcon = new fabric.Triangle({
                        left: userLabel.width + 4,
                        top: 14,
                        width: 8,
                        height: 8,
                        flipY: this.sortDir === 'desc',
                        fill: '#B1B1BE',
                        strokeWidth: 0,
                        ...fabricObjectOptions,
                        cursor: 'pointer',
                        hoverCursor: 'pointer',
                    });
                    sortIcon.on('mousedown', e => this.$emit('sort', 'user'));
                    this.canvas.add(sortIcon);
                }

                // Worked column header
                const workedLabel = new fabric.Textbox(this.$t('dashboard.worked'), {
                    left: 194,
                    top: 8,
                    height: rowHeight,
                    textAlign: 'left',
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: 15,
                    fontWeight: '600',
                    fill: '#B1B1BE',
                    ...fabricObjectOptions,
                    cursor: 'pointer',
                    hoverCursor: 'pointer',
                });
                workedLabel.on('mousedown', e => this.$emit('sort', 'worked'));
                this.canvas.add(workedLabel);

                if (this.sort === 'worked') {
                    const sortIcon = new fabric.Triangle({
                        left: workedLabel.width + 198,
                        top: 14,
                        width: 8,
                        height: 8,
                        flipY: this.sortDir === 'desc',
                        fill: '#B1B1BE',
                        strokeWidth: 0,
                        ...fabricObjectOptions,
                        cursor: 'pointer',
                        hoverCursor: 'pointer',
                    });
                    sortIcon.on('mousedown', e => this.$emit('sort', 'worked'));
                    this.canvas.add(sortIcon);
                }

                this.users.forEach((user, row) => {
                    const top = row * rowHeight + titleHeight + subtitleHeight;

                    if (user.avatar === 'gravatar') {
                        const emailMD5 = md5(user.email);
                        const url = `https://www.gravatar.com/avatar/${emailMD5}`;
                        fabric.Image.fromURL(
                            url,
                            image => {
                                image.scaleToWidth(avatarSize, true);
                                this.canvas.add(image);
                                this.canvas.requestRenderAll();
                            },
                            {
                                left: 0,
                                top: top + 20,
                                strokeWidth: 0,
                                clipPath: new fabric.Rect({
                                    left: 0,
                                    top: top + 20,
                                    width: avatarSize,
                                    height: avatarSize,
                                    rx: 5,
                                    ry: 5,
                                    absolutePositioned: true,
                                }),
                                ...fabricObjectOptions,
                            },
                        );
                    } else {
                        // Avatar background
                        this.canvas.add(
                            new fabric.Rect({
                                left: 0,
                                top: top + 20,
                                width: avatarSize,
                                height: avatarSize,
                                rx: 5,
                                ry: 5,
                                fill: getBackgroundColor(user.full_name.length),
                                strokeWidth: 0,
                                ...fabricObjectOptions,
                            }),
                        );

                        // Avatar label
                        this.canvas.add(
                            new fabric.Textbox(getInitials(user.full_name), {
                                left: 0,
                                top: top + 25,
                                width: avatarSize,
                                height: avatarSize,
                                textAlign: 'center',
                                fontFamily: 'Nunito, sans-serif',
                                fontSize: 13,
                                fontWeight: '500',
                                fill: 'rgb(255, 255, 255)',
                                ...fabricObjectOptions,
                            }),
                        );
                    }

                    // Name label
                    this.canvas.add(
                        new fabric.Textbox(user.full_name, {
                            left: avatarSize + 10,
                            top: top + 18,
                            width: 140,
                            height: rowHeight,
                            textAlign: 'left',
                            fontFamily: 'Nunito, sans-serif',
                            fontSize: 13,
                            fontWeight: '500',
                            fill: '#151941',
                            ellipsis: true,
                            ...fabricObjectOptions,
                        }),
                    );

                    const currentProject = this.currentProjects[user.id];
                    if (currentProject) {
                        // Current project label
                        this.canvas.add(
                            new fabric.Textbox(currentProject.name.toUpperCase(), {
                                left: avatarSize + 10,
                                top: top + 34,
                                width: 150,
                                height: rowHeight,
                                textAlign: 'left',
                                fontFamily: 'Nunito, sans-serif',
                                fontSize: 8,
                                fontWeight: '600',
                                fill: '#2E2EF9',
                                ellipsis: true,
                                ...fabricObjectOptions,
                            }),
                        );
                    }

                    const currentTask = this.currentTasks[user.id];
                    if (currentTask) {
                        // Avatar active icon
                        this.canvas.add(
                            new fabric.Circle({
                                left: 19,
                                top: top + 20 + 18,
                                radius: 3.5,
                                fill: '#2DC38D',
                                stroke: '#ffffff',
                                strokeWidth: 1,
                                ...fabricObjectOptions,
                            }),
                        );

                        // Task name overflow ellipsis
                        const taskName = new fabric.Textbox(currentTask.task_name.toUpperCase(), {
                            left: avatarSize + 10,
                            top: top + 44,
                            width: 150,
                            height: rowHeight,
                            textAlign: 'left',
                            fontFamily: 'Nunito, sans-serif',
                            fontSize: 8,
                            fontWeight: '600',
                            fill: '#2E2EF9',
                            ellipsis: true,
                            ...fabricObjectOptions,
                        });

                        // Full task name for popup
                        const taskNameHint = new fabric.Textbox(currentTask.task_name.toUpperCase(), {
                            originX: 'left',
                            originY: 'bottom',
                            left: avatarSize + 12,
                            top: top + 43,
                            height: rowHeight,
                            width: 150,
                            textAlign: 'left',
                            fontFamily: 'Nunito, sans-serif',
                            fontSize: 8,
                            fontWeight: '600',
                            fill: '#59566E',
                            ...fabricObjectOptions,
                        });

                        // Rectangle for popup
                        const taskNameHintRect = new fabric.Rect({
                            originX: 'left',
                            originY: 'bottom',
                            left: avatarSize + 10,
                            top: top + 45,
                            width: taskNameHint.width + 5,
                            height: taskNameHint.height + 5,
                            fill: '#FAFAFA',
                            strokeWidth: 1,
                            stroke: '#E0DFED',
                            rx: 1,
                            ry: 1,
                        });

                        const taskHintGroup = new fabric.Group([taskNameHintRect, taskNameHint], {
                            selectable: false,
                            visible: false,
                            ...fabricObjectOptions,
                        });

                        taskName.on('mouseover', e => {
                            taskHintGroup.set({
                                visible: true,
                            });

                            this.canvas.requestRenderAll();
                        });

                        taskName.on('mouseout', e => {
                            taskHintGroup.set({
                                visible: false,
                            });

                            this.canvas.requestRenderAll();
                        });

                        this.canvas.add(taskName);
                        this.canvas.add(taskHintGroup);
                    }

                    // Time worked label
                    const worked = this.worked[user.id] ? this.worked[user.id] : 0;
                    this.canvas.add(
                        new fabric.Textbox(this.formatDuration(worked), {
                            left: 194,
                            top: top + 16,
                            width: sidebarWidth,
                            height: rowHeight,
                            textAlign: 'left',
                            fontFamily: 'Nunito, sans-serif',
                            fontSize: 15,
                            fontWeight: '600',
                            fill: '#59566E',
                            ...fabricObjectOptions,
                        }),
                    );
                });

                this.canvas.requestRenderAll();
            }, 100),
            onResize: debounce(function() {
                const height = this.users.length * rowHeight + titleHeight + subtitleHeight;
                this.canvas.setWidth(sidebarWidth);
                this.canvas.setHeight(height);
                this.draw();
            }, 100),
        },
        watch: {
            users() {
                this.onResize();
            },
            worked() {
                this.draw();
            },
            currentTasks() {
                this.draw();
            },
            currentProjects() {
                this.draw();
            },
        },
    };
</script>

<style lang="scss" scoped>
    .canvas::v-deep canvas {
        box-sizing: content-box;
    }
</style>
