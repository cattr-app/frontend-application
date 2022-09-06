import moment from 'moment';
import 'moment-timezone';
import TasksService from '@/services/resource/task.service';
import UserService from '@/services/resource/user.service';
import DashboardService from '_internal/Dashboard/services/dashboard.service';
import _ from 'lodash';
import rootStore from '@/store';

const state = {
    service: null,
    intervals: {},
    tasks: {},
    users: [],
    timezone: moment.tz.guess(),
};

const getters = {
    service: state => state.service,
    intervals: state => {
        const companyTimezone = rootStore.getters['user/companyData'].timezone;

        for (const userId of Object.keys(state.intervals)) {
            state.intervals[userId].map(interval => {
                interval.durationByDay = {};

                const startAt = moment.tz(interval.start_at, companyTimezone).tz(state.timezone);
                const endAt = moment.tz(interval.end_at, companyTimezone).tz(state.timezone);

                const startDate = startAt.format('YYYY-MM-DD');
                const endDate = endAt.format('YYYY-MM-DD');
                if (startDate === endDate) {
                    if (interval.durationByDay[startDate]) {
                        interval.durationByDay[startDate] += interval.duration;
                    } else {
                        interval.durationByDay[startDate] = interval.duration;
                    }
                } else {
                    // If interval spans over midnight, divide it at midnight
                    const startOfDay = endAt.clone().startOf('day');
                    const startDateDuration = startOfDay.diff(startAt, 'seconds');
                    if (interval.durationByDay[startDate]) {
                        interval.durationByDay[startDate] += startDateDuration;
                    } else {
                        interval.durationByDay[startDate] = startDateDuration;
                    }

                    const endDateDuration = endAt.diff(startOfDay, 'seconds');
                    if (interval.durationByDay[endDate]) {
                        interval.durationByDay[endDate] += endDateDuration;
                    } else {
                        interval.durationByDay[endDate] = endDateDuration;
                    }
                }
            });
        }

        return state.intervals;
    },
    tasks: state => state.tasks,
    users: state => state.users,
    timePerProject: (state, getters) => {
        return Object.keys(getters.intervals).reduce((result, userID) => {
            const userEvents = getters.intervals[userID];
            if (!userEvents) {
                return result;
            }

            const projects = userEvents.reduce((projects, event) => {
                if (!projects[event.project_id]) {
                    projects[event.project_id] = {
                        id: event.project_id,
                        name: event.project_name,
                        duration: event.duration,
                        tasks: {},
                        durationByDay: event.durationByDay,
                    };
                } else {
                    projects[event.project_id].duration += event.duration;
                    projects[event.project_id].durationByDay = _.mergeWith(
                        {},
                        projects[event.project_id].durationByDay,
                        event.durationByDay,
                        _.add,
                    );
                }

                if (!projects[event.project_id].tasks[event.task_id]) {
                    projects[event.project_id].tasks[event.task_id] = {
                        id: event.task_id,
                        name: event.task_name,
                        duration: event.duration,
                        durationByDay: event.durationByDay,
                    };
                } else {
                    projects[event.project_id].tasks[event.task_id].duration += event.duration;
                    projects[event.project_id].tasks[event.task_id].durationByDay = _.mergeWith(
                        {},
                        projects[event.project_id].tasks[event.task_id].durationByDay,
                        event.durationByDay,
                        _.add,
                    );
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
        return Object.keys(getters.intervals).reduce((result, userID) => {
            const userEvents = getters.intervals[userID];
            if (!userEvents) {
                return result;
            }

            // TODO: optimize by using durationByDay property of interval(event)
            const companyTimezone = rootStore.getters['user/companyData'].timezone;

            const userTimePerDay = userEvents.reduce((result, event) => {
                const startAt = moment.tz(event.start_at, companyTimezone).tz(state.timezone);
                const endAt = moment.tz(event.end_at, companyTimezone).tz(state.timezone);

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
    setTasks(state, tasks) {
        state.tasks = tasks;
    },
    setUsers(state, users) {
        state.users = users;
    },
    setTimezone(state, timezone) {
        state.timezone = timezone;
    },
};

const actions = {
    init(context) {
        context.commit('setService', new DashboardService(context, new TasksService(), new UserService()));
    },
};

export default {
    state,
    getters,
    mutations,
    actions,
};
