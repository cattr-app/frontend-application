const { writeFileSync, readdirSync, mkdirSync, copyFileSync, existsSync } = require('fs');
const { join } = require('path');
const { merge } = require('lodash');

const env = require('../app/etc/env');

const dirIterator = (sourcePath, destPath) => {
    readdirSync(sourcePath, { withFileTypes: true })
        .filter(item => ['.', '..'].indexOf(item.name) === -1)
        .forEach(el => {
            if (el.isDirectory()) {
                mkdirSync(join(destPath, el.name), { recursive: true });
                dirIterator(join(sourcePath, el.name), join(destPath, el.name));
            } else {
                copyFileSync(join(sourcePath, el.name), join(destPath, el.name));
            }
        });
};

module.exports = class CattrWebpackPlugin {
    constructor(
        options = {
            fileName: 'cattr.manifest',
            outputDir: 'output',
        },
    ) {
        this.options = options;
    }

    apply(compiler) {
        compiler.hooks.done.tap('CattrWebpackPlugin', stats => {
            // Finding plugins config
            let plugins = require('../app/etc/modules.config.json');

            if (
                existsSync(
                    join(stats.compilation.options.context, 'app', 'etc', `modules.${process.env.NODE_ENV}.json`),
                )
            ) {
                plugins = merge(
                    plugins,
                    require(join(
                        stats.compilation.options.context,
                        'app',
                        'etc',
                        `modules.${process.env.NODE_ENV}.json`,
                    )),
                );
            }

            if (existsSync(join(stats.compilation.options.context, 'app', 'etc', 'modules.local.json'))) {
                plugins = merge(
                    plugins,
                    require(join(stats.compilation.options.context, 'app', 'etc', 'modules.local.json')),
                );
            }

            const manifestPlugins = [];

            Object.keys(plugins).forEach(el => {
                manifestPlugins.push({ ...plugins[el], name: el });
            });

            // Create manifest file
            writeFileSync(
                join(stats.compilation.options.output.path, this.options.fileName),
                JSON.stringify({
                    backend_path: env.API_URL,
                    frontend_version: process.env.npm_package_version,
                    frontend_plugins: manifestPlugins,
                }),
            );

            // Copying to output dir
            dirIterator(
                stats.compilation.options.output.path,
                join(stats.compilation.options.context, this.options.outputDir),
            );
        });
    }
};
