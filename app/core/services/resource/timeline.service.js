import axios from 'axios';
import StoreService from '@/services/store.service';
import moment from 'moment';

export default class TimelineService extends StoreService {
    constructor(context, timeIntervalService, projectService, taskService, userService) {
        super(context);

        this.timeIntervalService = timeIntervalService;
        this.projectService = projectService;
        this.taskService = taskService;
        this.userService = userService;
    }

    loadUsers() {
        return this.userService
            .getAll({})
            .then(response => {
                const { data } = response;
                this.context.dispatch('setUsers', data.data);

                return data.data;
            })
            .catch(e => {
                if (!axios.isCancel(e)) {
                    throw e;
                }
            });
    }

    /**
     * @returns {Promise<AxiosResponse<T>>}
     * @param projectIDs
     */
    loadProjects(projectIDs, action = 'setProjects') {
        return this.projectService
            .getWithFilters({ id: ['=', projectIDs] })
            .then(response => {
                if (!response) {
                    return;
                }

                const { data } = response;
                const projects = data.reduce((projects, project) => {
                    projects[project.id] = project;
                    return projects;
                }, {});

                this.context.dispatch(action, projects);
            })
            .catch(e => {
                if (!axios.isCancel(e)) {
                    throw e;
                }
            });
    }

    /**
     * @returns {Promise<AxiosResponse<T>>}
     * @param taskIDs
     * @param action
     */
    loadTasks(taskIDs, action = 'setTasks') {
        return this.taskService
            .getWithFilters({
                id: ['=', taskIDs],
                with: 'project',
            })
            .then(response => {
                if (typeof response !== 'undefined') {
                    const { data } = response;
                    const tasks = data.reduce((tasks, task) => {
                        tasks[task.id] = task;
                        return tasks;
                    }, {});

                    this.context.dispatch(action, tasks);

                    return tasks;
                }
            })
            .catch(e => {
                if (!axios.isCancel(e)) {
                    throw e;
                }
            });
    }

    /**
     * @returns {Promise<AxiosResponse<T>>}
     * @param userIDs
     * @param projectIDs
     * @param startAt
     * @param endAt
     */
    load(userIDs, projectIDs, startAt, endAt) {
        return this.timeIntervalService
            .getDashboardIntervals(userIDs, projectIDs, startAt, endAt, {})
            .then(response => {
                if (!response) {
                    return;
                }

                const data = response.data.data;

                this.context.dispatch('setIntervals', data);

                if (!data) {
                    return;
                }

                const uniqueProjectIDs = new Set();
                const uniqueTaskIDs = new Set();
                Object.keys(data).forEach(userID => {
                    const userIntervals = data[userID];
                    userIntervals.forEach(interval => {
                        uniqueProjectIDs.add(interval.project_id);
                        uniqueTaskIDs.add(interval.task_id);
                    });
                });

                const promises = [];

                const taskIDs = [...uniqueTaskIDs];
                if (taskIDs.length) {
                    promises.push(this.loadTasks(taskIDs));
                }

                return Promise.all(promises);
            })
            .then(() => {
                return this.loadUsers();
            })
            .then(() =>
                this.context.dispatch(
                    'setUsers',
                    this.context.state.users.map(u => {
                        if (this.context.state.intervals.hasOwnProperty(u.id)) {
                            const lastInterval = this.context.state.intervals[u.id].slice(-1)[0];

                            if (
                                Math.abs(
                                    moment(lastInterval.end_at).diff(
                                        moment().subtract(u.screenshot_interval || 1, 'minutes'),
                                        'seconds',
                                    ),
                                ) < 10
                            ) {
                                return {
                                    ...u,
                                    last_interval: lastInterval,
                                };
                            }
                        }

                        return { ...u, last_interval: null };
                    }),
                ),
            )
            .catch(e => {
                if (!axios.isCancel(e)) {
                    throw e;
                }
            });
    }

    unloadIntervals() {
        this.context.dispatch('setIntervals', []);
    }
}
