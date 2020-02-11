import moment from 'moment';
import 'moment-timezone';
import TimelineService from '../../service/timeline';
import ProjectService from '../../service/resource/projectService';
import ScreenshotService from '../../service/resource/screenshotService';
import TasksService from '../../service/resource/tasksService';
import TimeIntervalService from '../../service/resource/timeIntervalService';
import UserService from '../../service/resource/usersService';

const state = {
    service: null,
    intervals: {},
    projects: {},
    tasks: {},
    screenshots: [],
    users: [],
    latestIntervals: {},
    latestTasks: {},
    timezone: moment.tz.guess(),
};

const getters = {
    service: state => state.service,
    intervals: state => state.intervals,
    projects: state => state.projects,
    tasks: state => state.tasks,
    screenshots: state => state.screenshots,
    users: state => state.users,
    latestIntervals: state => state.latestIntervals,
    latestTasks: state => state.latestTasks,
    events: state => {
        if (!state.intervals) {
            return {};
        }

        return Object.keys(state.intervals).reduce((result, userID) => {
            const userSlice = state.intervals[userID];
            if (!userSlice) {
                return result;
            }

            const events = userSlice.intervals.reduce((events, interval) => {
                if (!events.length) {
                    const ids = typeof interval.ids !== 'undefined' ? interval.ids : [interval.id];

                    return [{ ...interval, ids }];
                }

                const last = events[events.length - 1];
                const ids = typeof interval.ids !== 'undefined' ? interval.ids : [interval.id];
                const consecutive = moment(interval.start_at).diff(last.end_at, 'seconds') <= 1;
                if (consecutive && interval.task_id === last.task_id && interval.is_manual === last.is_manual) {
                    events[events.length - 1] = {
                        ...last,
                        ids: [...last.ids, ...ids],
                        end_at: interval.end_at,
                        duration: last.duration + interval.duration,
                    };
                } else {
                    events.push({ ...interval, ids });
                }

                return events;
            }, []);

            return {
                ...result,
                [userID]: events,
            };
        }, {});
    },
    timePerProject: (state, getters) => {
        return Object.keys(getters.events).reduce((result, userID) => {
            const userEvents = getters.events[userID];
            if (!userEvents) {
                return result;
            }

            const projects = userEvents.reduce((projects, event) => {
                if (!projects[event.project_id]) {
                    projects[event.project_id] = {
                        id: event.project_id,
                        name: getters.projects[event.project_id] ? getters.projects[event.project_id].name : '',
                        duration: event.duration,
                        tasks: {},
                    };
                } else {
                    projects[event.project_id].duration += event.duration;
                }

                if (!projects[event.project_id].tasks[event.task_id]) {
                    projects[event.project_id].tasks[event.task_id] = {
                        id: event.task_id,
                        name: getters.tasks[event.task_id] ? getters.tasks[event.task_id].task_name : '',
                        duration: event.duration,
                    }
                } else {
                    projects[event.project_id].tasks[event.task_id].duration += event.duration;
                }

                return projects;
            }, {});

            return {
                ...result,
                [userID]: projects,
            };
        }, {});
    },
    timePerDay: (state, getters) => {
        return Object.keys(getters.events).reduce((result, userID) => {
            const userEvents = getters.events[userID];
            if (!userEvents) {
                return result;
            }

            const userTimePerDay = userEvents.reduce((result, event) => {
                const date = moment.tz(event.start_at, state.timezone).format('YYYY-MM-DD');
                if (result[date]) {
                    result[date] += event.duration;
                } else {
                    result[date] = event.duration;
                }

                return result;
            }, {});

            return {
                ...result,
                [userID]: userTimePerDay,
            };
        }, {});
    },
    timezone: state => state.timezone,
};

const mutations = {
    setService(state, service) {
        state.service = service;
    },
    setIntervals(state, intervals) {
        state.intervals = intervals;
    },
    setProjects(state, projects) {
        state.projects = projects;
    },
    setTasks(state, tasks) {
        state.tasks = tasks;
    },
    setScreenshots(state, screenshots) {
        state.screenshots = screenshots;
    },
    setUsers(state, users) {
        state.users = users;
    },
    setLatestIntervals(state, intervals) {
        state.latestIntervals = intervals;
    },
    setLatestTasks(state, tasks) {
        state.latestTasks = tasks;
    },
    setTimezone(state, timezone) {
        state.timezone = timezone;
    },
};

const actions = {
    init(context) {
        const timeIntervalService = new TimeIntervalService();
        const projectService = new ProjectService();
        const taskService = new TasksService();
        const screenshotService = new ScreenshotService();
        const userService = new UserService();

        const service = new TimelineService(
            context,
            timeIntervalService,
            projectService,
            taskService,
            screenshotService,
            userService,
        );

        context.commit('setService', service);
    },
    setIntervals({ commit }, intervals) {
        commit('setIntervals', intervals);
    },
    setProjects({ commit }, projects) {
        commit('setProjects', projects);
    },
    setTasks({ commit }, tasks) {
        commit('setTasks', tasks);
    },
    setScreenshots({ commit }, screenshots) {
        commit('setScreenshots', screenshots);
    },
    setUsers({ commit }, users) {
        commit('setUsers', users);
    },
    setLatestIntervals({ commit }, intervals) {
        commit('setLatestIntervals', intervals);
    },
    setLatestTasks({ commit }, tasks) {
        commit('setLatestTasks', tasks);
    },
    setTimezone({ commit }, timezone) {
        commit('setTimezone', timezone);
    },
};

export default {
    state,
    getters,
    mutations,
    actions,
};
