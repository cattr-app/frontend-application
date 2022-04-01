import axios from 'axios';

export default class TimeUseReportService {
    /**
     * @returns {Promise<AxiosResponse<T>>}
     * @param filters
     */
    async getTimeUserReport(filters) {
        return await axios.post('time/report', filters);
    }
}
