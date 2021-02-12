import axios from 'axios';
import moment from 'moment';
import StoreService from './store.service';

export default class TimelineService extends StoreService {
    constructor(context, timeIntervalService, projectService, taskService, screenshotService, userService) {
        super(context);

        this.timeIntervalService = timeIntervalService;
        this.projectService = projectService;
        this.taskService = taskService;
        this.screenshotService = screenshotService;
        this.userService = userService;
    }

    loadUsers() {
        return this.userService
            .getAll({})
            .then(response => {
                const { data } = response;
                this.context.dispatch('setUsers', data);

                return data;
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
                        uniqueProjectIDs.add(interval.task.project_id);
                        uniqueTaskIDs.add(interval.task.id);
                    });
                });

                const promises = [];

                const taskIDs = [...uniqueTaskIDs];
                if (taskIDs.length) {
                    promises.push(this.loadTasks(taskIDs));
                }

                return Promise.all(promises);
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
     * @param startAt
     * @param endAt
     */
    loadScreenshots(userIDs, startAt, endAt) {
        return this.screenshotService
            .getWithFilters({
                with: 'timeInterval',
                'timeInterval.user_id': ['=', userIDs],
                'timeInterval.start_at': ['between', [startAt, endAt]],
            })
            .then(response => {
                const { data } = response;

                this.context.dispatch('setScreenshots', data);
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
     */
    async loadLatestIntervals(userIDs, projectIDs) {
        const endAt = moment();
        const startAt = endAt.clone().subtract(10, 'minutes');
        try {
            const response = await this.timeIntervalService.getDashboardIntervals(userIDs, projectIDs, startAt, endAt);
            if (typeof response !== 'undefined') {
                const data = response.data.userIntervals;
                this.context.dispatch('setLatestIntervals', data);
            }

            return response;
        } catch (e) {
            if (!axios.isCancel(e)) {
                throw e;
            }
        }
    }

    unloadIntervals() {
        this.context.dispatch('setIntervals', []);
        this.context.dispatch('setLatestIntervals', []);
    }

    unloadScreenshots() {
        this.context.dispatch('setScreenshots', []);
    }
}
