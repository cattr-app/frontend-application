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
    getReport(startAt, endAt, userIDs, config = {}) {
        const params = serialize({
            start_at: getStartDay(startAt),
            end_at: getEndDay(endAt),
            user_ids: userIDs,
        });

        return axios.get(`reports/dashboard?${params}`, { ...config, responseType: 'blob' });
    }

}
