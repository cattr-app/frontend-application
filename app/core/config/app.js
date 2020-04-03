import axios from 'axios';
import env from '_app/etc/env';

if (process.env.NODE_ENV === 'development') {
    console.log(env);
}

axios.defaults.baseURL = (env.API_URL || `${window.location.origin}/api`) + '/' + (env.API_VERSION || '');
axios.defaults.headers.common['X-REQUESTED-WITH'] = 'XMLHttpRequest';

const token = localStorage.getItem('access_token');
if (token) {
    axios.defaults.headers['Authorization'] = `Bearer ${token}`;
}

export default axios;
