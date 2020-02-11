import ApiService from '../../service/api';

const state = {
    api: null,
    lastLogoutReason: null,
    user: {
        token: null,
        data: {},
        loggedIn: false,
        allowedRules: [],
        companyData: {}
    }
};

const getters = {
    user: s => s.user.data,
    token: s => s.user.token,
    loggedIn: s => s.user.loggedIn,
    allowedRules: s => s.user.allowedRules,
    companyData: s => s.user.companyData,
    apiService: s => s.api,

    lastLogoutReason: s => s.lastLogoutReason
};

const mutations = {
    setService(s, serviceObject) {
        s.api = serviceObject;
    },

    setUserData(s, userData) {
        s.user.data = userData;
    },

    setUserToken(s, token) {
        s.user.token = token;
    },

    setLoggedInStatus(s, status) {
        s.user.loggedIn = status;
    },

    setAllowedRules(s, allowedRules) {
        s.user.allowedRules = allowedRules;
    },

    setCompanyData(s, companyData) {
        s.user.companyData = companyData;
    },

    lastLogoutReason(s, reason) {
        s.lastLogoutReason = reason;
    }
};

const actions = {
    init(ctx) {
        if (localStorage.getItem('access_token')) {
            ctx.commit('setUserToken', localStorage.getItem('access_token'));
            ctx.commit('setLoggedInStatus', true);
        }

        ctx.commit('setService', new ApiService(ctx));
    },

    setToken({ commit }, token) {
        commit('setUserToken', token);
    },

    setUser({ commit }, user) {
        commit('setUserData', user);
    },

    setLoggedInStatus({ commit }, status) {
        commit('setLoggedInStatus', status);
    },

    setAllowedRules({ commit }, allowedRules) {
        commit('setAllowedRules', allowedRules);
    },

    setCompanyData: ({ commit }, data) => {
        commit('setCompanyData', data);
    },

    forceUserExit({ commit }, reason = null) {
        localStorage.removeItem('access_token');

        if (reason) {
            commit('lastLogoutReason', reason);
        }
        commit('setLoggedInStatus', false);
        commit('setUserToken', null);
        commit('setUserData', {});
    }
};

export default {
    state,
    getters,
    mutations,
    actions
};
