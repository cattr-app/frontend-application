import axios from 'axios';
import { getStartDay, getEndDay } from '@/utils/time';

export default class ProjectReportService {
    /**
     * @returns {Promise<AxiosResponse<T>>}
     * @param startAt
     * @param endAt
     * @param users
     * @param projects
     */
    getReport(startAt, endAt, users, projects) {
        return axios.post('report/project', {
            start_at: getStartDay(startAt),
            end_at: getEndDay(endAt),
            users,
            projects,
        });
    }

    /**
     * @returns {Promise<AxiosResponse<T>>}
     * @param startAt
     * @param endAt
     * @param users
     * @param projects
     * @param config
     */
    getReportFile(startAt, endAt, users, projects, config = {}) {
        const params = {
            start_at: getStartDay(startAt),
            end_at: getEndDay(endAt),
            users,
            projects,
        };

        return axios.post(`report/project/download`, params, {
            ...config,
            responseType: 'blob',
        });
    }
}
