import axios from "@/config/app";
import SettingsService from "./settingsService";

/**
 * Section service class.
 * Used to fetch data from api for inside DynamicSettings.vue
 * Data is stored inside store -> settings -> sections -> data
 */
export default class CompanyService extends SettingsService{

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
        return axios.get(this.getItemRequestUri());
    }

    /**
     * Save item data
     * @param data
     * @returns {Promise<void>}
     */
    save(data) {
        return axios.post('companymanagement/save', data);
    }
}
