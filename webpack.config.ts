import * as path from 'path';
import * as webpack from 'webpack';
import * as  HtmlWebPackPlugin from "html-webpack-plugin";

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

    plugins: [
        new HtmlWebPackPlugin({
            title: "webCAD",
            template: './src/index.html'
        }),
    ],

    resolve: {
        extensions: [".ts", ".tsx", ".js", "json"]
    },

    module: {
        rules: [{
            test: /\.(glsl|vs|fs)$/,
            // type: "javascript/auto",
            use: "shader-loader"
        },
        {
            test: /\.tsx?$/,
            // type: "javascript/auto",
            use: "awesome-typescript-loader"
        }]
    }
};

export default config;
