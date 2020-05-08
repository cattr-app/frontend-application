import axios from 'axios';
import env from '_app/etc/env';
import httpInterceptor from '@/helpers/httpInterceptor';

if (process.env.NODE_ENV === 'development') {
    console.log(env);
}

axios.defaults.baseURL = (env.API_URL || `${window.location.origin}/api`) + '/' + (env.API_VERSION || '');
axios.defaults.headers.common['X-REQUESTED-WITH'] = 'XMLHttpRequest';

httpInterceptor.setup();

export default axios;
