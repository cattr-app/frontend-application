import axios from 'axios';
import { getEndDay, getStartDay } from '@/utils/time';

export default class DashboardService {
    /**
     * @returns {Promise<AxiosResponse<T>>}
     * @param startAt
     * @param endAt
     * @param users
     * @param projects
     * @param format
     */
    queueReport(startAt, endAt, users, projects, format) {
        const params = {
            start_at: getStartDay(startAt),
            end_at: getEndDay(endAt),
            users,
            projects,
        };

        return axios.post(`report/dashboard/download`, params, {
            headers: { Accept: format },
        });
    }

    sendInvites(emails) {
        return axios.post(`register/create`, emails);
    }
}
