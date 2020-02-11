import ResourceService from '@/service/resource/resouceService';
import axios from 'axios';

export default class InvoicesService extends ResourceService {
    constructor(params = {}) {
        super();
        this.params = params;
    }

    /**
     * @returns {Promise<AxiosResponse<T>>}
     */
    getAll(data) {
        return axios.post('/invoices/list', data);
    }

    /**
     * @param data
     * @returns {Promise<AxiosResponse<T>>}
     */
    setProjectRate(data) {
        return axios.post('invoices/setProjectRate', data);
    }

    /**
     * @param data
     * @returns {Promise<AxiosResponse<T>>}
     */
    setDefaultRate(data) {
        return axios.post('invoices/setDefaultRate', data);
    }

}
