const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const LicenseWebpackPlugin =
    require('license-webpack-plugin').LicenseWebpackPlugin;
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    entry: './src/index.ts',
    output: {
        path: path.resolve(__dirname, '../dist'),
        filename: 'bundle.js',
        clean: true,
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.d.ts'],
        modules: [path.resolve('./src'), path.resolve('./node_modules')],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            { test: /\.js$/, loader: 'source-map-loader' },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            favicon: false,
            template: './public/index.html',
            inject: 'body',
            publicPath: './',
        }),
        new LicenseWebpackPlugin({
            licenseTextOverrides: {
                '@fontsource/vt323': 'OFL-1.1',
            },
        }),
        new webpack.BannerPlugin({
            banner: `Zebra
Real-time deterministic animation based on vanilla js & 2d rendering context, variable size, 2022
If you need help please press 'h'.
Dirk Adler, https://twitter.com/d_rx`,
        }),
    ],
    optimization: {
        minimizer: [
            new TerserPlugin({
                extractComments: false,
            }),
        ],
    },
};
