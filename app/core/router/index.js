import Vue from 'vue';
import VueRouter from 'vue-router';
import Store from '@/store';

// Fixing new issue with VueRouter caused by new Promise API
const originalPush = VueRouter.prototype.push;
VueRouter.prototype.push = function push(location) {
    return originalPush.call(this, location).catch(err => err);
};

Vue.use(VueRouter);

const routes = [
    {
        path: '/auth/login',
        name: 'auth.login',
        meta: {
            auth: false,
            layout: 'auth-layout',
        },
        component: () => import(/* webpackChunkName: "login" */ '../views/Auth/Login.vue'),
        beforeEnter: (to, from, next) => {
            if (Store.getters['user/loggedIn']) {
                next({ name: 'index' });
            } else {
                next();
            }
        },
    },
    {
        path: '/auth/password/reset',
        name: 'auth.password.reset',
        meta: {
            auth: false,
        },
        component: () => import(/* webpackChunkName: "ResetPassword" */ '../views/Auth/ResetPassword.vue'),
    },
    {
        path: '/auth/register',
        name: 'auth.register',
        meta: {
            auth: false,
        },
        component: () => import(/* webpackChunkName: "Register" */ '../views/Auth/Register.vue'),
    },
    {
        path: '*',
        name: 'not-found',
        meta: {
            auth: false,
        },
        component: () => import(/* webpackChunkName: "PageNotFound" */ '../views/PageNotFound.vue'),
    },
    {
        path: '/forbidden',
        name: 'forbidden',
        meta: {
            auth: false,
        },
        component: () => import(/* webpackChunkName: "PageForbidden" */ '../views/PageForbidden.vue'),
    },
    {
        path: '/about',
        name: 'about',
        component: () => import(/* webpackChunkName: "About" */ '../views/About.vue'),
    },
    {
        path: '/setup',
        name: 'setup',
        meta: {
            auth: false,
        },
        component: () => import(/* webpackChunkName: "Setup" */ '../views/Setup/Setup.vue'),
    },
];

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes,
});

router.beforeEach((to, from, next) => {
    // Close pending requests when switching pages
    Store.dispatch('httpRequest/cancelPendingRequests');
    const a = true;

    if (to.matched.some(record => record.meta.auth || typeof record.meta.auth === 'undefined')) {
        if (a) {
            return next({ name: 'setup' }); // проверка на первый запуск сайта
        }
        if (!Store.getters['user/loggedIn']) {
            return next({ name: 'auth.login' });
        }
    }

    const requiredPermissions = to.matched
        .map(record => record.meta.permissions)
        .filter(permissions => permissions)
        .reduce((total, permissions) => total.concat(permissions), []);

    if (!requiredPermissions.length) {
        return next();
    }

    const checkPermissions = () => {
        if (
            Store.getters['user/user'].is_admin ||
            requiredPermissions.every(permission => Store.getters['user/canInAnyProject'](permission))
        ) {
            return next();
        }

        next({ name: 'forbidden' });
    };

    if (!Store.getters['user/rulesLoaded']) {
        Store.watch(
            () => Store.getters['user/rulesLoaded'],
            () => checkPermissions(),
        );
    } else {
        checkPermissions();
    }
});

export default router;
