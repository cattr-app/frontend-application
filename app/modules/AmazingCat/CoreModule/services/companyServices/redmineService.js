import axios from '@/config/app';
import SettingsService from '../settingsService';
import Store from '@/store';

/**
 * Section service class.
 * Used to fetch data from api for inside DynamicSettings.vue
 * Data is stored inside store -> settings -> sections -> data
 */
export default class RedmineService extends SettingsService {
    /**
     * API endpoint URL
     * @returns string
     */
    getItemRequestUri() {
        return `integration/redmine/settings`;
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
        return axios.patch(this.getItemRequestUri(), data);
    }
}
