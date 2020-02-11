import axios from 'axios';
import env from '_app/etc/env';

console.log(env);

axios.defaults.baseURL = (env.API_URL || 'http://localhost:8000') + '/' + (env.API_VERSION || '');
axios.defaults.headers.common['X-REQUESTED-WITH'] = 'XMLHttpRequest';

const token = localStorage.getItem('access_token');
if (token) {
    axios.defaults.headers['Authorization'] = `Bearer ${token}`;
}

export default axios;
