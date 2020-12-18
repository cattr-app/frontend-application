import axios from 'axios';
import httpInterceptor from '@/helpers/httpInterceptor';

if (process.env.NODE_ENV === 'development') {
    console.log(process.env);
}

axios.defaults.baseURL =
    (process.env.VUE_APP_API_URL !== 'null' ? process.env.VUE_APP_API_URL : `${window.location.origin}/api`) + '/';
axios.defaults.headers.common['X-REQUESTED-WITH'] = 'XMLHttpRequest';

httpInterceptor.setup();

export default axios;
