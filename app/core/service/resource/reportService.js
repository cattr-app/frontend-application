import ResourceService from './resourceService';
import axios from 'axios';
import moment from 'moment';

export default class ReportService extends ResourceService {
    getScreenshots(params) {
        return axios.post('/project-report/screenshots', { params });
    }
}
