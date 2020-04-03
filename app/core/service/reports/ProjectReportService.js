import axios from 'axios';
import { getStartDay, getEndDay } from '../../utils/time';

export default class ProjectReportService {
    /**
     * @returns {Promise<AxiosResponse<T>>}
     * @param filters
     */
    getProjects(filters) {
        return axios.post('project-report/list', filters);
    }

    /**
     * @returns {Promise<AxiosResponse<T>>}
     * @param id
     * @param filters
     */
    getTaskDurations(id, filters) {
        return axios.post('project-report/list/tasks/' + id, filters);
    }

    /**
     * @returns {Promise<AxiosResponse<T>>}
     * @param startAt
     * @param endAt
     * @param userIDs
     * @param config
     */
    getReport(startAt, endAt, userIDs, projectIds, config = {}) {
        const params = {
            start_at: getStartDay(startAt),
            end_at: getEndDay(endAt),
            uids: userIDs,
            pids: projectIds,
        };

        return axios.post(`reports/projects`, params, {
            ...config,
            responseType: 'blob',
        });
    }
}
