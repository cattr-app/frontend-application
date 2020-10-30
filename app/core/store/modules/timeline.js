import moment from 'moment';
import 'moment-timezone';
import TimelineService from '../../services/timeline.service';
import ProjectService from '../../services/resource/project.service';
import ScreenshotService from '../../services/resource/screenshot.service';
import TasksService from '../../services/resource/task.service';
import TimeIntervalService from '../../services/resource/time-interval.service';
import UserService from '../../services/resource/user.service';

const state = {
    service: null,
    intervals: {},
    projects: {},
    tasks: {},
    screenshots: [],
    users: [],
    latestIntervals: {},
    latestTasks: {},
    latestProjects: {},
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
    latestProjects: state => state.latestProjects,
    events: state => {
        if (!state.intervals) {
            return {};
        }

        return Object.keys(state.intervals).reduce((result, userID) => {
            const userSlice = state.intervals[userID];
            if (!userSlice) {
                return result;
            }

            return {
                ...result,
                [userID]: userSlice.intervals,
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
                if (!projects[event.task.project_id]) {
                    projects[event.task.project_id] = {
                        id: event.task.project_id,
                        name: event.task.project.name,
                        duration: event.duration,
                        tasks: {},
                    };
                } else {
                    projects[event.task.project_id].duration += event.duration;
                }

                if (!projects[event.task.project_id].tasks[event.task.id]) {
                    projects[event.task.project_id].tasks[event.task.id] = {
                        id: event.task.id,
                        name: event.task.task_name,
                        duration: event.duration,
                    };
                } else {
                    projects[event.task.project_id].tasks[event.task.id].duration += event.duration;
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
                const startAt = moment.tz(event.start_at, state.timezone);
                const endAt = moment.tz(event.end_at, state.timezone);

                const startDate = startAt.format('YYYY-MM-DD');
                const endDate = endAt.format('YYYY-MM-DD');
                if (startDate === endDate) {
                    if (result[startDate]) {
                        result[startDate] += event.duration;
                    } else {
                        result[startDate] = event.duration;
                    }
                } else {
                    // If interval spans over midnight, divide it at midnight
                    const startOfDay = endAt.clone().startOf('day');
                    const startDateDuration = startOfDay.diff(startAt, 'seconds');
                    if (result[startDate]) {
                        result[startDate] += startDateDuration;
                    } else {
                        result[startDate] = startDateDuration;
                    }

                    const endDateDuration = endAt.diff(startOfDay, 'seconds');
                    if (result[endDate]) {
                        result[endDate] += endDateDuration;
                    } else {
                        result[endDate] = endDateDuration;
                    }
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
    setLatestProjects(state, projects) {
        state.latestProjects = projects;
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
    setLatestProjects({ commit }, projects) {
        commit('setLatestProjects', projects);
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
