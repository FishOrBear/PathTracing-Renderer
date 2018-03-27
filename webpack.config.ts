import * as path from 'path';
import * as webpack from 'webpack';
import * as  HtmlWebPackPlugin from "html-webpack-plugin";

const AddAssetHtmlPlugin = require("add-asset-html-webpack-plugin");


const config: webpack.Configuration = {
    entry: './src/index.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'PathTracingRender.js'
    },

    devServer: {
        contentBase: path.join(__dirname, "dist"),
        compress: true,
        port: 9000
    },

    devtool: "source-map",

    resolve: {
        alias: {
            "dat.gui": path.resolve('./node_modules/dat.gui/build/dat.gui.js'),
        },
        extensions: [".ts", ".tsx", ".js", "json"]
    },

    module: {
        rules: [{
            test: /\.(glsl|vs|fs)$/,
            use: "shader-loader"
        },
        {
            test: /\.tsx?$/,
            use: "awesome-typescript-loader"
        }]
    },

    plugins: [
        new HtmlWebPackPlugin({
            title: "webCAD",
            template: './src/index.html'
        }),
        new webpack.DllReferencePlugin({
            context: '.',
            manifest: require(path.resolve("./dist/webpackDll.json"))
        }),
        new AddAssetHtmlPlugin({ filepath: path.resolve("./dist/dll.js") })
    ],
};

export default config;
