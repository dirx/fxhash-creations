const CopyPlugin = require('copy-webpack-plugin');
const config = require('./webpack.config');
const ZipperPlugin = require('./ZipperPlugin');
const path = require('path');
const RemovePlugin = require('remove-files-webpack-plugin');

module.exports = {
    ...config,
    mode: 'production',
    plugins: [
        ...config.plugins,
        new CopyPlugin({
            patterns: [
                {
                    from: 'public',
                    filter: async (filePath) => {
                        return path.basename(filePath) !== 'index.html';
                    },
                },
            ],
        }),
        new RemovePlugin({
            after: {
                include: ['./dist/.DS_Store'],
            },
        }),
        new ZipperPlugin(),
    ],
};
