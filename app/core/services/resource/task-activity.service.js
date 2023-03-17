import ResourceService from '@/services/resource.service';
import axios from 'axios';

export default class TaskActivityService extends ResourceService {
    /**
     * @returns {Promise<AxiosResponse<T>>}
     * @param data
     * @param isNew
     */
    get(data) {
        return axios.post('task-activity/index', data);
    }
}
