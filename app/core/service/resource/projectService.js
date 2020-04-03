import ResourceService from './resouceService';
import axios from 'axios';
import difference from 'lodash/difference';
import { serialize } from '../../utils/url';

export default class ProjectService extends ResourceService {
    constructor(params = {}) {
        super();
        this.params = params;
    }

    /**
     * @param id
     * @returns {string}
     */
    getItemRequestUri(id) {
        return `projects/show?id=${id}`;
    }

    /**
     * @param id
     * @returns {Promise<AxiosResponse<T>>}
     */
    getItem(id) {
        return axios.get(this.getItemRequestUri(id));
    }

    /**
     * @returns {Promise<AxiosResponse<T>>}
     */
    getAll() {
        return axios.get('projects/list?' + serialize(this.params)).catch(error => {
            if (!('message' in error) || error.message !== 'Page switch') {
                console.error(error);
            } else {
                return { data: [] };
            }
        });
    }

    /**
     * @param id
     * @returns {Promise<AxiosResponse<T>>}
     */
    deleteItem(id) {
        return axios.post('projects/remove', { id });
    }

    /**
     *
     * @param filters
     * @returns {Promise<AxiosResponse<T>>}
     */
    getWithFilters(filters, config = {}) {
        return axios.post('projects/list', filters, config);
    }

    /**
     * @param data
     * @param isNew
     * @returns {Promise<AxiosResponse<T>>}
     */
    save(data, isNew = false) {
        return axios.post(`projects/${isNew ? 'create' : 'edit'}`, data);
    }

    /**
     * @param userID
     * @returns {Promise<AxiosResponse<T>>}
     */
    getUserProjectRelations(userID) {
        return axios.post('projects-users/list', {
            user_id: userID,
        });
    }

    /**
     * @param userID
     * @param projectID
     * @param roleID
     * @returns {Promise<AxiosResponse<T>>}
     */
    addUserProjectRelation(userID, projectID, roleID) {
        return axios.post('projects-users/create', {
            user_id: userID,
            project_id: projectID,
            role_id: roleID,
        });
    }

    /**
     * @param userID
     * @param projectID
     * @returns {Promise<AxiosResponse<T>>}
     */
    removeUserProjectRelation(userID, projectID) {
        return axios.post('projects-users/remove', {
            user_id: userID,
            project_id: projectID,
        });
    }

    removeUsersFromProject(projectId, users) {
        return axios.post('project-users/bulk-remove', {});
    }

    addUsersToProject(projectId, users) {}

    saveUsersRelations(newData, originalData) {
        const addedUsers = difference(newData, originalData);
        const removedUsers = difference(originalData, newData);
    }

    /**
     *
     * @returns {string}
     */
    getOptionLabelKey() {
        return 'name';
    }
}
