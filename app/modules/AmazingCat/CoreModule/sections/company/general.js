import TimezonePicker from '@/components/TimezonePicker';
import CompanyService from '../../services/companyServices/companyService';
import ColorSelect from '../../components/ColorSelect';
import Store from '@/store';
import i18n from '@/i18n';

export default {
    // Check if this section can be rendered and accessed, this param IS OPTIONAL (true by default)
    // NOTICE: this route will not be added to VueRouter AT ALL if this check fails
    // MUST be a function that returns a boolean
    accessCheck: async () => Store.getters['user/user'].is_admin === 1,

    scope: 'company',

    route: {
        // After processing this route will be named as 'settings.exampleSection'
        name: 'general',

        // After processing this route can be accessed via URL 'settings/example'
        path: 'general',

        meta: {
            // After render, this section will be labeled as 'Example Section'
            label: 'settings.general',

            // Service class to gather the data from API, should be an instance of Resource class
            service: new CompanyService(),

            // Renderable fields array
            fields: [
                {
                    label: 'settings.company_timezone',
                    key: 'timezone',
                    render: (h, props) => {
                        if (typeof props.currentValue === 'object') {
                            props.currentValue = '';
                        }

                        return h(TimezonePicker, {
                            props: {
                                value: props.currentValue,
                            },
                            on: {
                                onTimezoneChange(ev) {
                                    props.inputHandler(ev);
                                },
                            },
                        });
                    },
                },
                {
                    label: 'field.work_time',
                    key: 'work_time',
                    maxValue: 24,
                    minValue: 0,
                    fieldOptions: {
                        type: 'number',
                        placeholder: 'field.work_time',
                    },
                    tooltipValue: 'tooltip.work_time',
                },
                {
                    label: 'settings.redmine.label',
                    key: 'redmine_enabled',
                    group: 'integrations',
                    render(h, data) {
                        if (typeof data.currentValue === 'object') {
                            'redmine_enabled' in data.companyData
                                ? data.inputHandler(data.companyData.redmine_enabled)
                                : (data.currentValue = '0');

                            this.inputHandler(data.currentValue);
                        }

                        return h(
                            'at-select',
                            {
                                props: {
                                    value: data.currentValue.toString(),
                                },
                                class: {
                                    'with-margin': true,
                                },
                                on: {
                                    'on-change': value => {
                                        data.inputHandler(value);
                                    },
                                },
                            },
                            [
                                h('at-option', {
                                    props: {
                                        value: '0',
                                        label: i18n.t('control.disable'),
                                    },
                                }),
                                h('at-option', {
                                    props: {
                                        value: '1',
                                        label: i18n.t('control.enable'),
                                    },
                                }),
                            ],
                        );
                    },
                },
                {
                    label: 'settings.gitlab.label',
                    key: 'gitlab_enabled',
                    group: 'integrations',
                    render(h, data) {
                        if (typeof data.currentValue === 'object') {
                            'gitlab_enabled' in data.companyData
                                ? data.inputHandler(data.companyData.gitlab_enabled)
                                : (data.currentValue = '0');

                            this.inputHandler(data.currentValue);
                        }

                        return h(
                            'at-select',
                            {
                                props: {
                                    value: data.currentValue.toString(),
                                },
                                class: {
                                    'with-margin': true,
                                },
                                on: {
                                    'on-change': value => {
                                        data.inputHandler(value);
                                    },
                                },
                            },
                            [
                                h('at-option', {
                                    props: {
                                        value: '0',
                                        label: i18n.t('control.disable'),
                                    },
                                }),
                                h('at-option', {
                                    props: {
                                        value: '1',
                                        label: i18n.t('control.enable'),
                                    },
                                }),
                            ],
                        );
                    },
                },
                {
                    label: 'settings.dashboard.interval-color',
                    key: 'color',
                    displayable: store =>
                        'work_time' in store.getters['user/companyData'] && store.getters['user/companyData'].work_time,
                    tooltipValue: 'tooltip.color_intervals',
                    render(h, props) {
                        const defaultConfig = [
                            {
                                start: 0,
                                end: 0.75,
                                color: '#ffb6c2',
                            },
                            {
                                start: 0.76,
                                end: 1,
                                color: '#93ecda',
                            },
                            {
                                start: 1,
                                end: 0,
                                color: '#3cd7b6',
                                isOverTime: true,
                            },
                        ];

                        if (!Array.isArray(props.currentValue)) {
                            'color' in props.companyData
                                ? (props.currentValue = props.companyData.color)
                                : (props.currentValue = defaultConfig);

                            this.inputHandler(props.currentValue);
                        }

                        return h(ColorSelect, {
                            props: {
                                colorsConfig: props.currentValue,
                            },
                            on: {
                                addColorReadiness(data) {
                                    props.inputHandler(
                                        [...props.currentValue, ...data].sort((a, b) => {
                                            return a.start - b.start;
                                        }),
                                    );
                                },
                                onRemoveRelation(index) {
                                    props.currentValue.splice(index, 1);
                                    props.inputHandler(props.currentValue);
                                },
                                setOverTime(data) {
                                    props.inputHandler(data);
                                },
                                reset() {
                                    props.inputHandler(defaultConfig);
                                },
                                setStart(index, newStart) {
                                    props.currentValue[index].start = newStart;
                                    props.inputHandler(props.currentValue);
                                },
                                setEnd(index, newEnd) {
                                    props.currentValue[index].end = newEnd;
                                    props.inputHandler(props.currentValue);
                                },
                            },
                        });
                    },
                },
            ],
        },
    },
};
