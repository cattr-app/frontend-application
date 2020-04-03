import isObject from 'lodash/isObject';

export default class NavbarEntry {
    constructor(label, to, displayCondition = () => true, section) {
        if (!isObject(to)) {
            throw new Error('[to] instance must be a JavaScript object');
        }
        this.label = label;
        this.to = to;
        this.displayCondition = displayCondition;
        this.section = section;
    }

    getData() {
        return {
            label: this.label,
            to: this.to,
            displayCondition: this.displayCondition,
            section: this.section,
        };
    }
}
