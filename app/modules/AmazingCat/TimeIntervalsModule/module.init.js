import TimeIntervalService from '@/service/resource/timeIntervalService';
import UsersService from '@/service/resource/usersService';
import TasksService from '@/service/resource/tasksService';
import LazySelect from './components/LazySelect';
import DatetimeInput from './components/DatetimeInput';
import moment from 'moment';
import axios from 'axios';
import env from '_app/etc/env';

export const ModuleConfig = {
    enabled: true,
    routerPrefix: 'time-intervals',
    loadOrder: 1,
};

export function init(context, router) {
    const crud = context.createCrud('time-intervals.crud-title', 'time-intervals', TimeIntervalService);
    const crudNewRoute = crud.new.getNewRouteName();

    crud.new.addToMetaProperties('permissions', 'time-intervals/create', crud.new.getRouterConfig());
    crud.new.addToMetaProperties('afterSubmitCallback', () => router.go(-1), crud.new.getRouterConfig());

    const fieldsToFill = [
        {
            label: 'field.user',
            key: 'user_id',
            type: 'resource-select',
            service: new UsersService(),
            required: true,
        },
        {
            label: 'field.task',
            key: 'task_id',
            render: (h, props) => {
                return h(LazySelect, {
                    props: {
                        service: new TasksService(),
                        inputHandler: props.inputHandler,
                        userID: props.values.user_id,
                    },
                });
            },
            required: true,
        },
        {
            label: 'field.start_at',
            key: 'start_at',
            render: (h, props) => {
                const value =
                    typeof props.currentValue === 'string'
                        ? props.currentValue
                        : moment()
                              .startOf('hour')
                              .toISOString();

                return h(DatetimeInput, {
                    props: {
                        inputHandler: props.inputHandler,
                        value,
                    },
                    on: {
                        change: value => {
                            value = moment(value)
                                .add(10, 'minutes')
                                .toISOString();
                            props.setValue('end_at', value);

                            // Set is_manual for task here, because it`s stupid to fill it manually each time
                            props.setValue('is_manual', true);
                        },
                    },
                });
            },
            required: true,
        },
        {
            label: 'field.end_at',
            key: 'end_at',
            render: (h, props) => {
                const value =
                    typeof props.currentValue === 'string'
                        ? props.currentValue
                        : moment()
                              .startOf('day')
                              .toISOString();

                return h(DatetimeInput, {
                    props: {
                        inputHandler: props.inputHandler,
                        value,
                    },
                });
            },
            required: true,
        },
    ];

    crud.new.addField(fieldsToFill);

    context.addRoute(crud.getRouterConfig());

    context.addLocalizationData({
        en: require('./locales/en'),
        ru: require('./locales/ru'),
    });

    return context;
}
