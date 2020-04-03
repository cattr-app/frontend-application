import axios from 'axios';
import { getStartDay, getEndDay } from '../../utils/time';
import { serialize } from '../../utils/url';

export default class DashboardReportService {
    /**
     * @returns {Promise<AxiosResponse<T>>}
     * @param startAt
     * @param endAt
     * @param userIDs
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
