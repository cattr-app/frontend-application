import axios from '@/config/app';
import SettingsService from '../settingsService';
import Store from '@/store';

/**
 * Section service class.
 * Used to fetch data from api for inside DynamicSettings.vue
 * Data is stored inside store -> settings -> sections -> data
 */
export default class CompanyService extends SettingsService {
    /**
     * API endpoint URL
     * @returns string
     */
    getItemRequestUri() {
        return `companymanagement/getData`;
    }

    /**
     * Fetch item data from api endpoint
     * @returns {data}
     */
    getItem() {
        if (Object.keys(Store.getters['user/companyData']).length) {
            return Promise.resolve({ data: Store.getters['user/companyData'] });
        }

        return new Promise(resolve => {
            Store.watch(
                () => Store.getters['user/companyData'],
                data => resolve({ data }),
            );
        });
    }

    /**
     * Save item data
     * @param data
     * @returns {Promise<void>}
     */
    save(data) {
        //todo need fix
        if ('color' in data && typeof data.color === 'object') {
            data = { ...data, color: JSON.stringify(data.color) };
        }

        return axios.post('companymanagement/save', data);
    }
}
