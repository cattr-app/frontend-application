const state = {
    sections: [],
};

const getters = {
    sections: s => s.sections,
};

const mutations = {

    setSection(s, section) {
        s.sections.push(section);
    },

    update(s, data) {
        s.sections[s.sections.findIndex(p => p.pathName === data.name)].data = data.data;
    }

};

const actions = {

    /**
     * Push new section to sections array
     *
     * @param commit
     * @param section
     * @returns {Promise}
     */
    setSettingSection: async ({commit}, section) => {
        const access = await section.accessCheck();
        if (!access) {
            return;
        }
        return new Promise((resolve) => {
            section.meta.service.getItem().then(async response => {
                section.data = response.data;
                section = {
                    label: section.meta.label,
                    fields: section.meta.fields,
                    pathName: section.name,
                    service: section.meta.service,
                    data: section.data,
                    access: access,
                    scope: section.scope,
                };
                commit('setSection', section);

                resolve(response);
            });
        })
    },

    /**
     * Update section after user changed / filled any fields
     *
     * @param commit
     * @param data
     */
    updateSection: ({commit}, data) => {
        commit('update', data)
    }
};

export default {
    state,
    getters,
    mutations,
    actions
};
