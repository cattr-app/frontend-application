import ApiService from '../../service/api';

const state = {
    api: null,
    lastLogoutReason: null,
    user: {
        token: null,
        data: {},
        loggedIn: false,
        allowedRules: [],
        projectRules: [],
        companyData: {},
    },
    allowedRulesLoaded: false,
    projectRulesLoaded: false,
};

const getters = {
    user: s => s.user.data,
    token: s => s.user.token,
    loggedIn: s => s.user.loggedIn,
    allowedRules: s => s.user.allowedRules,
    projectRules: s => s.user.projectRules,
    companyData: s => s.user.companyData,
    apiService: s => s.api,
    rulesLoaded: s => s.allowedRulesLoaded && s.projectRulesLoaded,

    // Returns true if user have permission globally or in the specified project
    can: s => (permission, projectID = null) => {
        if (s.user.is_admin) {
            return true;
        }

        const [object, action] = permission.split('/');

        const { allowedRules } = s.user;
        if (
            Object.keys(allowedRules).some(
                rule => allowedRules[rule].object === object && allowedRules[rule].action === action,
            )
        ) {
            return true;
        }

        if (projectID !== null) {
            const projectRules = s.user.projectRules[projectID];
            if (projectRules !== null && projectRules !== undefined) {
                if (
                    Object.keys(projectRules).some(
                        rule => projectRules[rule].object === object && projectRules[rule].action === action,
                    )
                ) {
                    return true;
                }
            }
        }

        return false;
    },

    // Returns true if user have permission globally or in any project
    canInAnyProject: s => permission => {
        if (s.user.is_admin) {
            return true;
        }

        const [object, action] = permission.split('/');

        const { allowedRules } = s.user;
        if (
            Object.keys(allowedRules).some(
                rule => allowedRules[rule].object === object && allowedRules[rule].action === action,
            )
        ) {
            return true;
        }

        return Object.keys(s.user.projectRules).some(projectID => {
            const projectRules = s.user.projectRules[projectID];
            return Object.keys(projectRules).some(
                rule => projectRules[rule].object === object && projectRules[rule].action === action,
            );
        });
    },

    lastLogoutReason: s => s.lastLogoutReason,
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
        s.allowedRulesLoaded = true;
    },

    setProjectRules(s, projectRules) {
        s.user.projectRules = projectRules;
        s.projectRulesLoaded = true;
    },

    setCompanyData(s, companyData) {
        s.user.companyData = companyData;
    },

    lastLogoutReason(s, reason) {
        s.lastLogoutReason = reason;
    },
};

const actions = {
    init(ctx) {
        if (localStorage.getItem('access_token')) {
            ctx.commit('setUserToken', localStorage.getItem('access_token'));
            ctx.commit('setLoggedInStatus', true);
        }

        if (localStorage.getItem('lastLogoutReason')) {
            ctx.commit('lastLogoutReason', localStorage.getItem('lastLogoutReason'));
            localStorage.removeItem('lastLogoutReason');
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

    setProjectRules({ commit }, projectRules) {
        commit('setProjectRules', projectRules);
    },

    setCompanyData: ({ commit }, data) => {
        commit('setCompanyData', data);
    },

    forceUserExit({ commit }, reason = null) {
        localStorage.clear();
        sessionStorage.clear();

        if (reason) {
            sessionStorage.setItem('lastLogoutReason', reason);
        }

        sessionStorage.setItem('logout', 'true');

        location.reload();
    },
};

export default {
    state,
    getters,
    mutations,
    actions,
};
