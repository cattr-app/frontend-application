const webpack = require('webpack');
const env = require('./app/etc/env');
const resolve = require('path').resolve;
const isDevMod = process.env.NODE_ENV !== 'production';
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const SentryPlugin = require('@sentry/webpack-plugin');
const fs = require('fs');

let coreAlias;

if (!isDevMod) {
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

process.env.VUE_APP_VERSION = `${process.env.npm_package_version}@${process.env.COMMIT_SHA}`;

module.exports = {
    css: {
        extract: !isDevMod,
        sourceMap: isDevMod,
        loaderOptions: {
            scss: {
                sourceMap: true,
                prependData: `
                    @import "~@/sass/includes/variables";
                `,
            },
        },
    },
    transpileDependencies: ['@amazingtime/core', /(.+)-cattr-module/gi],
    configureWebpack: {
        devtool: isDevMod ? 'eval-source-maps' : '',
        entry: {
            app: './app/main.js',
        },
        resolve: {
            alias: {
                _app: resolve(__dirname, 'app'),
                '@': coreAlias,
                _modules: resolve(__dirname, 'app', 'modules'),
                _vendor_modules: resolve(__dirname, 'node_modules'),
            },
        },
        optimization: {
            splitChunks: {
                chunks: 'all',
                maxSize: 500000,
            },
        },
        performance: {
            hints: isDevMod ? false : 'warning',
            maxAssetSize: 512000,
            maxEntrypointSize: 2000000,
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: '[name].css',
                chunkFilename: '[id].css',
                ignoreOrder: true,
            }),
            new SentryPlugin({
                release: process.env.VUE_APP_VERSION,
                dryRun:
                    !isDevMod ||
                    !('SENTRY_ORG' in process.env) ||
                    !('SENTRY_AUTH_TOKEN' in process.env) ||
                    !('VUE_APP_SENTRY_DSN' in process.env),
                include: '.',
                ext: [
                  'js',
                  'map',
                  'jsbundle',
                  'bundle',
                  'vue',
                  'json'
                ],
                ignore: [
                    'node_modules',
                    'vue.config.js',
                    'babel.config.js',
                    'postcss.config.js',
                    'prettier.config.js',
                    'dist',
                ],
            }),
            new BundleAnalyzerPlugin({
                analyzerMode: isDevMod ? 'server' : 'disabled',
                openAnalyzer: false,
            }),
            // eslint-disable-next-line no-useless-escape
            new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en|ru|da/),
        ],
        module: {
            rules: [
                {
                    test: /\.css$/i,
                    use: [
                        {
                            loader: MiniCssExtractPlugin.loader,
                            options: {
                                hmr: isDevMod,
                                reloadAll: true,
                            },
                        },
                        'css-loader',
                    ],
                },
            ],
        },
    },
};
