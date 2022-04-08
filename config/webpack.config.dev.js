const config = require('./webpack.config');

module.exports = {
    ...config,
    mode: 'development',
    devServer: {
        hot: false,
        port: 8080,
        open: true,
        client: {
            overlay: {
                errors: true,
                warnings: false,
            },
        },
    },
};
