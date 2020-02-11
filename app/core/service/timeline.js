import axios from 'axios';
import moment from 'moment';
import StoreService from './storeService';

export default class TimelineService extends StoreService {
    constructor(
        context,
        timeIntervalService,
        projectService,
        taskService,
        screenshotService,
        userService,
    ) {
        super(context);

        this.timeIntervalService = timeIntervalService;
        this.projectService = projectService;
        this.taskService = taskService;
        this.screenshotService = screenshotService;
        this.userService = userService;
    }

    loadUsers() {
        return this.userService.getAll({}).then(response => {
            const { data } = response;
            this.context.dispatch('setUsers', data);

            return data;
        }).catch(e => {
            if (!axios.isCancel(e)) {
                throw e;
            }
        });
    }

    /**
     * @returns {Promise<AxiosResponse<T>>}
     * @param projectIDs
     */
    loadProjects(projectIDs) {
        return this.projectService.getWithFilters({ id: ['=', projectIDs] }).then(response => {
            if (!response) {
                return;
            }

            const { data } = response;
            const projects = data.reduce((projects, project) => {
                projects[project.id] = project;
                return projects;
            }, {});

            this.context.dispatch('setProjects', projects);
        }).catch(e => {
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
        return this.taskService.getWithFilters({ id: ['=', taskIDs] }).then(response => {
            if (typeof response !== 'undefined') {
                const { data } = response;
                const tasks = data.reduce((tasks, task) => {
                    tasks[task.id] = task;
                    return tasks;
                }, {});

                this.context.dispatch(action, tasks);
            }
        }).catch(e => {
            if (!axios.isCancel(e)) {
                throw e;
            }
        });
    }

    /**
     * @returns {Promise<AxiosResponse<T>>}
     * @param userIDs
     * @param startAt
     * @param endAt
     */
    load(userIDs, startAt, endAt) {
        return this.timeIntervalService.getDashboardIntervals(userIDs, startAt, endAt, {}).then(response => {
            if (!response) {
                return;
            }

            const data = response.data.userIntervals;
            this.context.dispatch('setIntervals', data);

            if (!data) {
                return;
            }

            const uniqueProjectIDs = new Set();
            const uniqueTaskIDs = new Set();
            Object.keys(data).forEach(userID => {
                const userIntervals = data[userID].intervals;
                userIntervals.forEach(interval => {
                    uniqueProjectIDs.add(interval.project_id);
                    uniqueTaskIDs.add(interval.task_id);
                });
            });

            const promises = [];
            const projectIDs = [...uniqueProjectIDs];
            if (projectIDs.length) {
                promises.push(this.loadProjects(projectIDs));
            }

            const taskIDs = [...uniqueTaskIDs];
            if (taskIDs.length) {
                promises.push(this.loadTasks(taskIDs));
            }

            return Promise.all(promises);
        }).catch(e => {
            if (!axios.isCancel(e)) {
                throw e;
            }
        });
    }

    /**
     * @returns {Promise<AxiosResponse<T>>}
     * @param userIDs
     * @param startAt
     * @param endAt
     */
    loadScreenshots(userIDs, startAt, endAt) {
        return this.screenshotService.getWithFilters({
            with: 'timeInterval',
            'timeInterval.user_id': ['=', userIDs],
            'timeInterval.start_at': ['>=', startAt],
            'timeInterval.end_at': ['<=', endAt],
        }).then(response => {
            const { data } = response;

            this.context.dispatch('setScreenshots', data);
        }).catch(e => {
            if (!axios.isCancel(e)) {
                throw e;
            }
        });
    }

    /**
     * @returns {Promise<AxiosResponse<T>>}
     * @param userIDs
     */
    loadLatestIntervals(userIDs) {
        const endAt = moment();
        const startAt = endAt.clone().subtract(10, 'minutes');
        return this.timeIntervalService.getDashboardIntervals(userIDs, startAt, endAt).then(response => {
            if (typeof response !== 'undefined') {
                const data = response.data.userIntervals;
                this.context.dispatch('setLatestIntervals', data);

                if (!data) {
                    return;
                }

                const uniqueTaskIDs = new Set();
                Object.keys(data).forEach(userID => {
                    const userIntervals = data[userID].intervals;
                    userIntervals.forEach(interval => {
                        uniqueTaskIDs.add(interval.task_id);
                    });
                });

                const taskIDs = [...uniqueTaskIDs];
                if (taskIDs.length) {
                    return this.loadTasks(taskIDs, 'setLatestTasks');
                }
            }
        }).catch(e => {
            if (!axios.isCancel(e)) {
                throw e;
            }
        });
    }
}
