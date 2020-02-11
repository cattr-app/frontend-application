import ResourceService from './resouceService';
import axios from 'axios';

export default class TimeIntervalService extends ResourceService {

    /**
     * @returns {string}
     * @param id
     */
    getItemRequestUri(id) {
        return `time-intervals/show?id=${id}`;
    }

    /**
     * @returns {Promise<AxiosResponse<T>>}
     * @param id
     */
    getItem(id) {
        return axios.get(this.getItemRequestUri(id));
    }

    /**
     * @returns {Promise<AxiosResponse<T>>}
     */
    getAll() {
        return axios.get('time-intervals/list');
    }

    /**
     * @returns {Promise<AxiosResponse<T>>}
     * @param data
     */
    save(data) {
        return axios.post('time-intervals/manual-create', data);
    }

    /**
     * @returns {Promise<AxiosResponse<T>>}
     * @param data
     */
    bulkEdit(data) {
        return axios.post('time-intervals/bulk-edit', data);
    }

    /**
     * @returns {Promise<AxiosResponse<T>>}
     * @param data
     */
    bulkDelete(data) {
        return axios.post('time-intervals/bulk-remove', data);
    }

    /**
     * @returns {Promise<AxiosResponse<T>>}
     * @param userIds
     * @param startAt
     * @param endAt
     * @param config
     */
    getDashboardIntervals(userIds, startAt, endAt, config = {}) {
        const url = 'time-intervals/dashboard';
        const data = {
            user_ids: userIds,
            start_at: startAt,
            end_at: endAt,
        };

        return axios.post(url, data, config);
    }
}
