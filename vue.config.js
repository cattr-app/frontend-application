const env = require('./app/etc/env');
const resolve = require('path').resolve;
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

let coreAlias;
if (process.env.NODE_ENV === 'production') {
    coreAlias = env.LOCAL_BUILD === true ? resolve(__dirname, 'app', 'core') : '@amazingtime/core';
} else {
    switch (env.DEVELOPER_MODE) {
        case 'local':
            coreAlias = resolve(__dirname, 'app', 'core');
            break;
        case 'package':
        default:
            coreAlias = '@amazingtime/core';
            break;
    }
}

Object.keys(env).forEach(p => {
    process.env[`VUE_APP_${p}`] = env[p];
});

module.exports = {
    css: {
        extract: process.env.NODE_ENV === 'production',
        sourceMap: process.env.NODE_ENV !== 'production',
        loaderOptions: {
            scss: {
                sourceMap: true,
                prependData: `
                    @import "~@/sass/includes/variables";
                `
            }
        }
    },

    transpileDependencies: [
        '@amazingtime/core',
        /(.+)-cattr-module/gi
    ],

    configureWebpack: {
        devtool: process.env.NODE_ENV !== 'production' ? 'eval-source-maps' : '',
        entry: {
            app: './app/main.js'
        },
        resolve: {
            alias: {
                '_app': resolve(__dirname, 'app'),
                '@': coreAlias,
                '_modules': resolve(__dirname, 'app', 'modules'),
                '_vendor_modules': resolve(__dirname, 'node_modules')
            }
        },
        plugins: [
            new MiniCssExtractPlugin({
                ignoreOrder: true
            })
        ]
    }
};

