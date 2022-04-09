import axios from 'axios';
import { getEndDay, getStartDay } from '@/utils/time';
import ReportService from '@/services/report.service';
import moment from 'moment';

export default class DashboardService extends ReportService {
    constructor(context, taskService, userService) {
        super();
        this.context = context;

        this.taskService = taskService;
        this.userService = userService;
    }

    downloadReport(startAt, endAt, users, projects, format) {
        return axios.post(
            'report/dashboard/download',
            {
                start_at: getStartDay(startAt),
                end_at: getEndDay(endAt),
                users,
                projects,
            },
            {
                headers: { Accept: format },
            },
        );
    }

    getReport(startAt, endAt, users, projects) {
        return axios.post('report/dashboard', { users, projects, start_at: startAt, end_at: endAt });
    }

    unloadIntervals() {
        this.context.commit('setIntervals', []);
    }

    load(userIDs, projectIDs, startAt, endAt) {
        this.getReport(startAt, endAt, userIDs, projectIDs)
            .then(response => {
                if (!response) {
                    return;
                }

                const data = response.data.data;

                this.context.commit('setIntervals', data);

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
                this.context.commit(
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

    loadUsers() {
        return this.userService
            .getAll({})
            .then(response => {
                const { data } = response;
                this.context.commit('setUsers', data.data);

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
     * @param taskIDs
     * @param action
     */
    loadTasks(taskIDs) {
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

                    this.context.commit('setTasks', tasks);

                    return tasks;
                }
            })
            .catch(e => {
                if (!axios.isCancel(e)) {
                    throw e;
                }
            });
    }

    sendInvites(emails) {
        return axios.post(`register/create`, emails);
    }
}
