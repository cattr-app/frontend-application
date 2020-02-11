import ResourceService from '@/service/resource/resouceService';
import axios from 'axios';

export default class EmailReportService extends ResourceService {
    constructor(params = {}) {
        super();
        this.params = params;
    }

    /**
     * @param id
     * @returns {string}
     */
    getItemRequestUri(id) {
        return `email-reports/show?id=${id}`;
    }

    /**
     * @param id
     * @returns {Promise<AxiosResponse<T>>}
     */
    getItem(id) {
        return axios.get(this.getItemRequestUri(id));
    }

    /**
     * @returns {Promise<AxiosResponse<T>>}
     */
    getAll() {
        return axios.get('email-reports/list');
    }

    /**
     * @param id
     * @returns {Promise<AxiosResponse<T>>}
     */
    deleteItem(id) {
        return axios.post('email-reports/remove', { id });
    }

    /**
     * @param data
     * @param isNew
     * @returns {Promise<AxiosResponse<T>>}
     */
    save(data, isNew = false) {
        return axios.post(`email-reports/${isNew ? 'create' : 'edit'}`, data);
    }

    /**
     * @returns {Promise<AxiosResponse<T>>}
     * @param filters
     * @param config
     */
    getWithFilters(filters, config = {}) {
        return axios.post('email-reports/list', filters, config);
    }

}