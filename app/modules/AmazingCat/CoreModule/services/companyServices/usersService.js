import ResourceService from '@/service/resource/resouceService';
import axios from 'axios';

export default class UsersService extends ResourceService {
    getAll(config = {}) {
        return axios.get('users/list', config);
    }

    /**
     * Fetch item data from api endpoint
     * @returns {data}
     */
    getItem() {
        return Promise.resolve().then(() => {
            return {
                data: {},
            };
        });
    }

    save(data, isNew = false) {
        return axios.post(`users/${isNew ? 'create' : 'edit'}`, data);
    }

    deleteItem(id) {
        return axios.post('users/remove', { id });
    }

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
}
