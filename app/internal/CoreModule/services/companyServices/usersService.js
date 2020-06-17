import ResourceService from '@/service/resource/resourceService';
import axios from 'axios';

export default class UsersService extends ResourceService {
    /**
     * Get all users.
     *
     * @param config
     * @returns {Promise<AxiosResponse<T>>}
     */
    getAll(config = {}) {
        return axios.get('users/list', config);
    }

    /**
     * Fetch item data from api endpoint
     *
     * @returns {data}
     */
    getItem() {
        return Promise.resolve().then(() => {
            return {
                data: {},
            };
        });
    }

    /**
     * Save user.
     *
     * @param data
     * @param isNew
     * @returns {Promise<AxiosResponse<T>>}
     */
    save(data, isNew = false) {
        return axios.post(`users/${isNew ? 'create' : 'edit'}`, data);
    }

    /**
     * Remove user.
     *
     * @param id
     * @returns {Promise<AxiosResponse<T>>}
     */
    deleteItem(id) {
        return axios.post('users/remove', { id });
    }

    /**
     * Get option label key.
     *
     * @returns {string}
     */
    getOptionLabelKey() {
        return 'full_name';
    }

    /**
     *
     * @param filters
     * @returns {Promise<AxiosResponse<T>>}
     */
    getWithFilters(filters) {
        return axios.post('users/list', filters);
    }

    /**
     * Send at invitation to the user.
     *
     * @param id
     * @returns {Promise<AxiosResponse<T>>}
     */
    sendInvite(id) {
        return axios.post('users/send-invite', { id });
    }
}
