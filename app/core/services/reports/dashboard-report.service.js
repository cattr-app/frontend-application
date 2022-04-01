import axios from 'axios';

export default class DashboardReportService {
    /**
     * @returns {Promise<AxiosResponse<T>>}
     * @param params
     * @param config
     */
    getReport(params, config = {}) {
        return axios.post(`reports/dashboard`, params, {
            ...config,
            responseType: 'blob',
        });
    }

    sendInvites(emails) {
        return axios.post(`register/create`, emails);
    }
}
