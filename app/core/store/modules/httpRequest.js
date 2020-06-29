import ApiService from '@/service/api';

const state = {
    cancelTokens: [],
    isInstall: false,
};

const getters = {
    cancelTokens(state) {
        return state.cancelTokens;
    },
    getStatusOfInstalling(state) {
        return state.isInstall;
    },
};

const mutations = {
    addCancelToken(state, token) {
        state.cancelTokens.push(token);
    },
    clearCancelTokens(state) {
        state.cancelTokens = [];
    },
    changeStatusInstall(state, status) {
        state.isInstall = status;
    },
};

const actions = {
    cancelPendingRequests(context) {
        context.state.cancelTokens.forEach(request => {
            if (request.cancel) {
                request.cancel();
            }
        });

        context.commit('clearCancelTokens');
    },
    async checkInstalled(context) {
        const { status } = (await new ApiService().getStatusOfInstalling()).data;
        context.commit('changeStatusInstall', status);
    },
};

export default {
    state,
    getters,
    mutations,
    actions,
};
