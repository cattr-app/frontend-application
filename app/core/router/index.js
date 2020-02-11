import Vue from 'vue';
import VueRouter from 'vue-router';
import Store from '../store/index';
import { havePermissions } from '../utils/user';

// Fixing new issue with VueRouter caused by new Promise API
const originalPush = VueRouter.prototype.push;
VueRouter.prototype.push = function push(location) {
    return originalPush.call(this, location).catch(err => err);
};
//

Vue.use(VueRouter);

const routes = [
    {
        path: '/auth/login',
        name: 'auth.login',
        meta: {
            auth: false,
            layout: 'auth-layout'
        },
        component: () => import(/* webpackChunkName: "login" */ '../views/Auth/Login.vue'),
        beforeEnter: (to, from, next) => {
            if (Store.getters['user/loggedIn']) {
                next({ name: 'index' });
            } else {
                next();
            }
        }
    },
    {
        path: '/auth/password/reset',
        name: 'auth.password.reset',
        meta: {
            auth: false,
            layout: 'auth-layout'
        },
        component: () => import('../views/Auth/ResetPassword.vue'),
    },
    {
        path: '*',
        meta: {
            auth: false
        },
        component: () => import('../views/PageNotFound.vue')
    },
    {
        path: '/forbidden',
        name: 'forbidden',
        meta: {
            auth: false
        },
        component: () => import('../views/PageForbidden.vue')
    }
];

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
});

router.beforeEach((to, from, next) => {
    if (to.matched.some(record => record.meta.auth || typeof record.meta.auth === 'undefined')) {
        if (!Store.getters['user/loggedIn']) {
            return next({name: 'auth.login'});
        }
    }

    const requiredPermissions = to.matched.map(record => record.meta.permissions)
        .filter(permissions => permissions)
        .reduce((total, permissions) => total.concat(permissions), []);

    if (!requiredPermissions.length) {
        return next();
    }

    if (!Object.keys(Store.getters['user/allowedRules']).length) {
        Store.watch(() => Store.getters['user/allowedRules'], allowedRules => {
            if (!Store.getters['user/user'].is_admin && !havePermissions(allowedRules, requiredPermissions)) {
                return next({name: 'forbidden'});
            }
            return next();
        });
    } else {
        if (!Store.getters['user/user'].is_admin
            && !havePermissions(Store.getters['user/allowedRules'], requiredPermissions)
        ) {
            return next({name: 'forbidden'});
        }
        return next();
    }
});

export default router;
