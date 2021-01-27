<template>
    <div>
        <div class="crud crud__content">
            <div class="page-controls">
                <h1 class="page-title crud__title">{{ project.name }}</h1>

                <div class="control-items">
                    <div class="control-item">
                        <at-button
                            v-if="$can('create', 'task')"
                            type="primary"
                            size="large"
                            icon="icon-edit"
                            @click="$router.push({ name: 'Tasks.crud.tasks.new' })"
                        >
                            {{ $t('projects.add_task') }}
                        </at-button>
                    </div>

                    <div class="control-item">
                        <at-button size="large" @click="$router.push(`/projects/${$route.params['id']}/tasks/list`)">
                            {{ $t('control.task-list') }}
                        </at-button>
                    </div>

                    <div class="control-item">
                        <at-button size="large" @click="$router.go(-1)">{{ $t('control.back') }}</at-button>
                    </div>
                </div>
            </div>

            <div ref="kanban" class="project-tasks at-container">
                <kanban-board :stages="stages" :blocks="blocks" @update-block="updateBlock">
                    <div
                        v-for="stage in stages"
                        :slot="stage"
                        :key="`stage_${stage}`"
                        class="status"
                        :style="getHeaderStyle(stage)"
                    >
                        <h3>{{ stage }}</h3>
                    </div>

                    <div
                        v-for="block in blocks"
                        :slot="block.id"
                        :key="`block_${block.id}`"
                        class="task"
                        @click="loadTask(block.id)"
                    >
                        <h4 class="task-name">{{ getTask(block.id).task_name }}</h4>

                        <p class="task-description">{{ getTask(block.id).description }}</p>

                        <div class="task-users">
                            <team-avatars :users="getTask(block.id).users"></team-avatars>
                        </div>
                    </div>
                </kanban-board>
            </div>
        </div>

        <div v-if="task" class="task-view">
            <div class="task-view-header">
                <h4 class="task-view-title">{{ task.task_name }}</h4>

                <p class="task-view-description">{{ task.description }}</p>

                <div class="task-view-close" @click="task = null">
                    <span class="icon icon-x"></span>
                </div>
            </div>

            <div class="row">
                <div class="col-8 label">{{ $t('field.users') }}:</div>

                <div class="col">
                    <team-avatars :users="task.users"></team-avatars>
                </div>
            </div>

            <div class="row">
                <div class="col-8 label">{{ $t('field.due_date') }}:</div>
                <div class="col">{{ task.due_date ? formatDate(task.due_date) : '' }}</div>
            </div>

            <div class="row">
                <div class="col-8 label">{{ $t('field.total_spent') }}:</div>
                <div class="col">{{ formatDurationString(task.total_spent_time) }}</div>
            </div>

            <div class="row">
                <div class="col-8 label">{{ $t('field.priority') }}:</div>
                <div class="col">{{ task.priority.name }}</div>
            </div>

            <div class="row">
                <div class="col-8 label">{{ $t('field.source') }}:</div>
                <div class="col">{{ task.project.source }}</div>
            </div>

            <div class="row">
                <div class="col-8 label">{{ $t('field.created_at') }}:</div>
                <div class="col">{{ formatDate(task.created_at) }}</div>
            </div>

            <div class="row">
                <div class="col-8 label">{{ $t('field.history') }}:</div>
                <div class="col toggle-history">
                    <a v-if="showHistory" href="#" @click="showHistory = false">
                        {{ $t('projects.hide_history') }}
                    </a>

                    <a v-else href="#" @click="showHistory = true">
                        {{ $t('projects.show_history') }}
                    </a>
                </div>

                <template v-if="showHistory">
                    <div v-for="change in task.changes" :key="change.id" class="change">
                        <team-avatars class="change-avatar" :users="[change.user]" />

                        <template v-if="change.field === 'users'">
                            {{
                                $t('projects.task_change_users', {
                                    user: change.user.full_name,
                                    date: fromNow(change.created_at),
                                    value:
                                        change.new_value && change.new_value.length
                                            ? JSON.parse(change.new_value)
                                                  .map(user => user.full_name)
                                                  .join(', ')
                                            : '',
                                })
                            }}
                        </template>

                        <template v-else-if="change.field !== 'relative_position'">
                            {{
                                $t('projects.task_change', {
                                    user: change.user.full_name,
                                    field: $t(`field.${change.field}`).toLocaleLowerCase(),
                                    date: fromNow(change.created_at),
                                })
                            }}
                        </template>
                    </div>
                </template>
            </div>

            <div class="row">
                <div class="col-8 label">{{ $t('field.comments') }}:</div>
                <div class="col"></div>

                <div ref="commentForm" class="comment-form">
                    <at-textarea v-model="commentMessage" class="comment-message" @change="commentMessageChange" />

                    <div
                        v-if="showUsers"
                        class="comment-form-users"
                        :style="{ top: `${usersTop - scrollTop - commentMessageScrollTop}px`, left: `${usersLeft}px` }"
                    >
                        <div
                            v-for="user in visibleUsers"
                            :key="user.id"
                            class="comment-form-user"
                            @click="insertUserName(user.full_name)"
                        >
                            <team-avatars class="user-avatar" :users="[user]" />
                            {{ user.full_name }}
                        </div>
                    </div>

                    <at-button class="comment-submit" @click.prevent="createComment(task.id)">
                        {{ $t('projects.add_comment') }}
                    </at-button>
                </div>

                <div v-for="comment in task.comments" :key="comment.id" class="comment">
                    <div class="comment-header">
                        <span class="comment-author">
                            <team-avatars class="comment-avatar" :users="[comment.user]" />
                            {{ comment.user.full_name }}
                        </span>

                        <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
                    </div>

                    <div class="comment-content">
                        <template v-for="(content, index) in getCommentContent(comment)">
                            <span v-if="content.type === 'text'" :key="index">{{ content.text }}</span>
                            <span v-else-if="content.type === 'username'" :key="index" class="username">{{
                                content.text
                            }}</span>
                        </template>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import { offset } from 'caret-pos';
    import ProjectService from '@/services/resource/project.service';
    import StatusService from '@/services/resource/status.service';
    import TasksService from '@/services/resource/task.service';
    import TaskCommentService from '@/services/resource/task-comment.service';
    import UsersService from '@/services/resource/user.service';
    import { getTextColor } from '@/utils/color';
    import { formatDate, formatDurationString, fromNow } from '@/utils/time';
    import TeamAvatars from '../components/TeamAvatars';

    export default {
        components: {
            TeamAvatars,
        },
        name: 'Tasks',
        data() {
            return {
                projectService: new ProjectService(),
                statusService: new StatusService(),
                taskService: new TasksService(),
                taskCommentService: new TaskCommentService(),
                userService: new UsersService(),
                project: {},
                statuses: [],
                tasks: [],
                task: null,
                showHistory: true,
                commentMessage: '',
                users: [],
                userFilter: '',
                userNameStart: 0,
                userNameEnd: 0,
                showUsers: false,
                usersTop: 0,
                usersLeft: 0,
                scrollTop: 0,
                commentMessageScrollTop: 0,
            };
        },
        computed: {
            stages() {
                return this.statuses.map(status => status.name);
            },
            blocks() {
                return this.tasks.map(task => ({
                    id: +task.id,
                    status: this.getStatusName(task.status_id),
                }));
            },
            visibleUsers() {
                return this.users.filter(user => {
                    return (
                        user.full_name
                            .replace(/\s/g, '')
                            .toLocaleLowerCase()
                            .indexOf(this.userFilter) === 0
                    );
                });
            },
        },
        methods: {
            getTextColor,
            formatDate,
            formatDurationString,
            fromNow,
            getBlock(id) {
                return this.blocks.find(block => +block.id === +id);
            },
            getTask(id) {
                return this.tasks.find(task => +task.id === +id);
            },
            getStatusByName(name) {
                return this.statuses.find(status => status.name === name);
            },
            getStatusName(id) {
                const status = this.statuses.find(status => +status.id === +id);
                if (status !== undefined) {
                    return status.name;
                }

                return '';
            },
            getHeaderStyle(name) {
                const status = this.getStatusByName(name);

                return {
                    background: status.color,
                    color: this.getTextColor(status.color),
                };
            },
            async updateBlock(blockId, newStatusName) {
                const block = this.getBlock(blockId);
                const newStatus = this.statuses.find(s => s.name === newStatusName);

                const blockElement = this.$refs.kanban.querySelector(`[data-block-id="${blockId}"]`);
                const prevBlockElement = blockElement.previousSibling;
                const nextBlockElement = blockElement.nextSibling;

                const prevBlockId = prevBlockElement ? +prevBlockElement.getAttribute('data-block-id') : 0;
                const prevTask = prevBlockId ? this.getTask(prevBlockId) : null;

                const nextBlockId = nextBlockElement ? +nextBlockElement.getAttribute('data-block-id') : 0;
                const nextTask = nextBlockId ? this.getTask(nextBlockId) : null;

                let newRelativePosition;
                if (prevTask !== null && nextTask !== null) {
                    newRelativePosition = (prevTask.relative_position + nextTask.relative_position) / 2;
                } else if (prevTask !== null) {
                    newRelativePosition = prevTask.relative_position + 1;
                } else if (nextTask !== null) {
                    newRelativePosition = nextTask.relative_position - 1;
                } else {
                    newRelativePosition = 0;
                }

                const task = this.getTask(blockId);

                const updatedTask = (
                    await this.taskService.save({
                        ...task,
                        users: task.users.map(user => +user.id),
                        status_id: newStatus.id,
                        relative_position: newRelativePosition,
                    })
                ).data.res;

                const taskIndex = this.tasks.findIndex(t => +t.id === +updatedTask.id);
                if (taskIndex !== -1) {
                    const tasks = [...this.tasks];
                    tasks.splice(taskIndex, 1, { ...task, ...updatedTask });
                    tasks.sort((a, b) => a.relative_position - b.relative_position);
                    this.tasks = tasks;
                }
            },
            async loadTask(id) {
                this.task = (
                    await this.taskService.getItem(id, {
                        with: 'users,priority,project,changes,changes.user,comments,comments.user',
                    })
                ).data;
            },
            async createComment(id) {
                const comment = await this.taskCommentService.save({
                    task_id: id,
                    content: this.commentMessage,
                });

                await this.loadTask(id);

                this.commentMessage = '';
            },
            commentMessageChange(value) {
                const textArea = this.$refs.commentForm.querySelector('textarea');
                const regexp = /@([0-9a-zа-я._-]*)/gi;
                let match,
                    found = false;
                while ((match = regexp.exec(value)) !== null) {
                    const start = match.index;
                    const end = start + match[0].length;
                    if (textArea.selectionStart >= start && textArea.selectionEnd <= end) {
                        this.userNameStart = start;
                        this.userNameEnd = end;
                        this.userFilter = match[1].replace(/\s/g, '').toLocaleLowerCase();
                        this.showUsers = true;

                        this.scrollTop = document.scrollingElement.scrollTop;
                        this.commentMessageScrollTop = textArea.scrollTop;

                        const coords = offset(textArea);
                        this.usersTop = coords.top + 20;
                        this.usersLeft = coords.left;

                        found = true;
                        break;
                    }
                }

                if (!found) {
                    this.showUsers = false;
                    this.userFilter = '';
                }
            },
            onScroll() {
                this.scrollTop = document.scrollingElement.scrollTop;
            },
            insertUserName(value) {
                const messageBefore = this.commentMessage.substring(0, this.userNameStart);
                const messageAfter = this.commentMessage.substring(this.userNameEnd);
                const userName = `@${value.replace(/[^0-9a-zа-я._-]/gi, '')}`;
                this.commentMessage = [messageBefore, userName, messageAfter].join('');

                this.$nextTick(() => {
                    const textArea = this.$refs.commentForm.querySelector('textarea');
                    textArea.focus();

                    textArea.selectionStart = this.userNameStart + userName.length;
                    textArea.selectionEnd = this.userNameStart + userName.length;

                    this.showUsers = false;
                    this.userFilter = '';
                });
            },
            getCommentContent(comment) {
                return comment.content.split(/(@[0-9a-zа-я._-]+)/gi).map(str => {
                    return {
                        type: /^@[0-9a-zа-я._-]+/i.test(str) ? 'username' : 'text',
                        text: str,
                    };
                });
            },
        },
        async created() {
            const projectId = this.$route.params['id'];

            this.project = (await this.projectService.getItem(projectId)).data;
            this.statuses = (await this.statusService.getAll()).data;

            this.tasks = (
                await this.taskService.getWithFilters({
                    project_id: projectId,
                    orderBy: 'relative_position',
                    with: 'users,priority',
                })
            ).data;

            this.users = (await this.userService.getAll()).data;
        },
        mounted() {
            window.addEventListener('scroll', this.onScroll);

            if (this.$route.query.task) {
                this.loadTask(+this.$route.query.task);
            }
        },
        beforeDestroy() {
            window.removeEventListener('scroll', this.onScroll);
        },
    };
</script>

<style lang="scss" scoped>
    .at-container {
        position: relative;
    }

    .control-item:not(:last-child) {
        margin-right: 16px;
    }

    .status {
        width: 100%;
        padding: 16px;
        text-align: center;

        h3 {
            color: inherit;
        }
    }

    .task {
        background: #ffffff;
        padding: 16px;

        &-description {
            height: 24px;
            overflow: hidden;
        }

        &-users {
            display: flex;
            justify-content: flex-end;
            height: 34px;
        }
    }

    .toggle-history {
        text-align: right;
    }

    .change {
        margin-top: 16px;
    }

    .change-avatar {
        display: inline-block;
    }

    .task-view {
        position: absolute;
        top: 0;
        right: 0;
        background: #ffffff;
        border: 1px solid #c5d9e8;
        border-radius: 4px;
        width: 600px;
        min-height: 100%;
        padding: 16px;

        &-header {
            position: relative;
            padding: 32px;
        }

        &-title {
            margin-bottom: 16px;
        }

        &-close {
            position: absolute;
            top: 0;
            right: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            widows: 32px;
            height: 32px;
            cursor: pointer;
        }

        .row {
            margin: 0 32px;
        }

        .row:not(:last-child) {
            border-bottom: 1px solid #eeeef5;
            padding-bottom: 16px;
            margin-bottom: 16px;
        }

        .label {
            font-weight: bold;
        }
    }

    .comment-form {
        width: 100%;
        margin-top: 16px;

        &-users {
            position: fixed;
            background: #fff;
            border-radius: 4px;
            box-shadow: 0px 0px 10px rgba(63, 51, 86, 0.1);
            padding: 4px 0 4px;
            z-index: 10;
        }

        &-user {
            padding: 4px 8px 4px;
            cursor: pointer;

            &:hover {
                background: #ecf2fc;
            }
        }
    }

    .user-avatar {
        display: inline-block;
    }

    .comment-submit {
        margin-top: 8px;
    }

    .comment {
        display: block;
        margin-top: 16px;
        width: 100%;

        &-header {
            display: flex;
            justify-content: space-between;
        }

        &-avatar {
            display: inline-block;
        }

        .username {
            background: #ecf2fc;
            border-radius: 4px;
        }
    }

    .project-tasks {
        padding: 16px;
    }

    .project-tasks /deep/ {
        ul.drag-list,
        ul.drag-inner-list {
            list-style-type: none;
            margin: 0;
            padding: 0;
        }

        .drag-list {
            display: flex;
            align-items: stretch;
            min-height: calc(100vh - 250px);
        }

        .drag-column {
            flex: 1;
            position: relative;
            border: 1px solid #c5d9e8;
            border-radius: 4px;

            h2 {
                font-size: 0.8rem;
                margin: 0;
                text-transform: uppercase;
                font-weight: 600;
            }
        }

        .drag-column:not(:last-child) {
            margin-right: 16px;
        }

        .drag-column-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .drag-inner-list {
            min-height: 50px;
            color: white;
        }

        .drag-item {
            margin: 16px;
            border: 1px solid #c5d9e8;
            border-radius: 4px;
            transition: border 0.2s;
            overflow: hidden;

            &:hover {
                border-color: #79a1eb;
            }
        }

        .drag-header-more {
            cursor: pointer;
        }

        /* Dragula CSS  */

        .gu-mirror {
            position: fixed !important;
            margin: 0 !important;
            z-index: 9999 !important;
            opacity: 0.8;
            list-style-type: none;
        }

        .gu-hide {
            display: none !important;
        }

        .gu-unselectable {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
        }

        .gu-transit {
            opacity: 0.2;
        }
    }
</style>
