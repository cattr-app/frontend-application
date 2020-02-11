import _ from 'lodash';

export default class AbstractCrud {

    /**
     * @param property
     * @param data
     * @param routerConfig
     */
    addToMetaProperties(property, data, routerConfig) {
        _.set(routerConfig.meta, property, data);
    }

}
