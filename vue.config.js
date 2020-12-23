if (process.env.NODE_ENV === undefined) {
    process.env.NODE_ENV = 'development';
}

const webpack = require('webpack');
const { resolve } = require('path');
const { existsSync } = require('fs');
const isDevMod = process.env.NODE_ENV === 'development';
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const SentryPlugin = require('@sentry/webpack-plugin');
const CattrWebpackPlugin = require('./webpack/CattrWebpackPlugin');

let env = require(resolve(__dirname, 'app', 'etc', 'env.js'));

if (existsSync(resolve(__dirname, 'app', 'etc', `env.${process.env.NODE_ENV}.js`))) {
    env = { ...env, ...require(resolve(__dirname, 'app', 'etc', `env.${process.env.NODE_ENV}.js`)) };
}

if (existsSync(resolve(__dirname, 'app', 'etc', 'env.local.js'))) {
    env = { ...env, ...require(resolve(__dirname, 'app', 'etc', 'env.local.js')) };
}

Object.keys(env).forEach(p => {
    process.env[`VUE_APP_${p}`] = env[p];
});

process.env.VUE_APP_VERSION = process.env.npm_package_version;
process.env.VUE_APP_SENTRY_DSN = process.env.SENTRY_DSN;
process.env.VUE_APP_DOCKER_VERSION = process.env.IMAGE_VERSION;

module.exports = {
    css: {
        extract: !isDevMod,
        sourceMap: isDevMod,
        loaderOptions: {
            scss: {
                sourceMap: false,
                prependData: `
                    @import "~@/sass/includes/variables";
                `,
            },
        },
    },
    transpileDependencies: [/(.+)-cattr-module/gi],
    configureWebpack: {
        devtool: isDevMod ? 'eval-source-maps' : '',
        entry: {
            app: './app/main.js',
        },
        resolve: {
            alias: {
                _app: resolve(__dirname, 'app'),
                '@': resolve(__dirname, 'app', 'core'),
                _modules: resolve(__dirname, 'app', 'vendor_modules'),
                _internal: resolve(__dirname, 'app', 'core', 'modules'),
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
            new CattrWebpackPlugin(),
            new MiniCssExtractPlugin({
                filename: '[name].css',
                chunkFilename: '[id].css',
                ignoreOrder: true,
            }),
            new SentryPlugin({
                release: process.env.VUE_APP_VERSION,
                dryRun: isDevMod || !('SENTRY_DSN' in process.env),
                include: '.',
                ext: ['js', 'map', 'jsbundle', 'bundle', 'vue', 'json'],
                ignore: [
                    'node_modules',
                    'vue.config.js',
                    'babel.config.js',
                    'postcss.config.js',
                    'prettier.config.js',
                    'dist',
                ],
                setCommits: require('fs').existsSync('.git')
                    ? {
                          auto: true,
                      }
                    : undefined,
            }),
            new BundleAnalyzerPlugin({
                analyzerMode: isDevMod && process.env.npm_lifecycle_event !== 'build' ? 'server' : 'disabled',
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
