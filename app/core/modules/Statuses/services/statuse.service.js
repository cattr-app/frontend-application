import axios from '@/config/app';
import ResourceService from '@/services/resource/resource.service';

export default class StatusService extends ResourceService {
    getAll(config = {}) {
        return axios.get('statuses/list', config);
    }

    getItemRequestUri(id) {
        return `statuses/show?id=${id}`;
    }

    getItem(id, filters = {}) {
        return axios.get(this.getItemRequestUri(id));
    }

    save(data, isNew = false) {
        return axios.post(`statuses/${isNew ? 'create' : 'edit'}`, data);
    }

    deleteItem(id) {
        return axios.post('statuses/remove', { id });
    }

    getWithFilters(filters, config = {}) {
        return axios.post('statuses/list', filters, config);
    }
}
