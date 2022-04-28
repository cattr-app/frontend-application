import axios from 'axios';
import ReportService from '@/services/report.service';
import { getEndDay, getStartDay } from '@/utils/time';

export default class TimeUseReportService extends ReportService {
    /**
     * @returns {Promise<AxiosResponse<T>>}
     * @param startAt
     * @param endAt
     * @param users
     */
    async getReport(startAt, endAt, users) {
        return await axios.post('report/time', {
            start_at: getStartDay(startAt),
            end_at: getEndDay(endAt),
            users,
        });
    }
}
