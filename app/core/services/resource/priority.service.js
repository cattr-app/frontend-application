import ResourceService from '../resource.service';
import axios from 'axios';
import { serialize } from '@/utils/url';

export default class PriorityService extends ResourceService {
    /**
     * @param config
     * @returns {Promise<AxiosResponse<T>>}
     */
    getAll(config = {}) {
        return axios.get('priorities/list', config);
    }

    /**
     * @param id
     * @returns string
     */
    getItemRequestUri(id) {
        return `priorities/show?${serialize({ id })}`;
    }

    /**
     * @param id
     * @returns {Promise<AxiosResponse<T>>}
     */
    getItem(id) {
        return axios.get(this.getItemRequestUri(id));
    }

    /**
     * @param data
     * @param isNew
     * @returns {Promise<AxiosResponse<T>>}
     */
    save(data, isNew = false) {
        return axios.post(`priorities/${isNew ? 'create' : 'edit'}`, data);
    }

    /**
     * @param id
     * @returns {Promise<AxiosResponse<T>>}
     */
    deleteItem(id) {
        return axios.post('priorities/remove', { id });
    }

    /**
     * @returns string
     */
    getOptionLabelKey() {
        return 'name';
    }

    /**
     *
     * @param filters
     * @param config
     * @returns {Promise<AxiosResponse<T>>}
     */
    getWithFilters(filters, config = {}) {
        return axios.post('priorities/list', filters, config);
    }
}
