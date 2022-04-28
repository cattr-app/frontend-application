import axios from 'axios';
import { getStartDay, getEndDay } from '@/utils/time';
import ReportService from '@/services/report.service';

export default class ProjectReportService extends ReportService {
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
     * @param format
     */
    downloadReport(startAt, endAt, users, projects, format) {
        const params = {
            start_at: getStartDay(startAt),
            end_at: getEndDay(endAt),
            users,
            projects,
        };

        return axios.post(`report/project/download`, params, {
            headers: { Accept: format },
        });
    }
}
