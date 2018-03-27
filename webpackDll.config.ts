const webpack = require('webpack');

const dllName = "dll"
const path = require('path');

const vendors = [
    "three",
];

module.exports = {
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: dllName + '.js',
        library: dllName,
    },
    entry: {
        "lib": vendors,
    },
    resolve: {
    },
    devtool: "source-map",
    plugins: [
        new webpack.DllPlugin({
            path: './dist/webpackDll.json',
            name: dllName,
            context: __dirname,
        })
    ],
};
