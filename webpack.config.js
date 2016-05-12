'use strict'
let webpack = require('webpack')

module.exports = {
  context: __dirname + '/app',
  entry: [
    'babel-polyfill',
    './entry.js',
  ],
  output: {
    path: __dirname + '/dist',
    filename: 'bundle.js',
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: 'babel',
      },
      {
        test: /\.styl$/,
        loader: 'style-loader!raw!stylus-loader',
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader',
      },
      {
        test: /\.(eot|woff|woff2|ttf|svg)($|\?)/,
        loader: 'url-loader?limit=30000&name=[name]-[hash].[ext]',
      },
      {
        test: /(isotope|masonry|outlayer|item|get-size|fizzy-ui-utils\/utils)\.js$/,
        loader: 'imports?define=>false',
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
      {
        test: /\.coffee$/,
        loader: 'coffee-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/,
        loader: 'style!css!sass',
        exclude: /node_modules/,
      },
    ],
  },
  debug: false,
  resolve: {
    root: ['/',],
    modulesDirectories: ['node_modules', 'lib',],
    extensions: ['', '.js',],
  },
  devServer: {
    historyApiFallback: false,
    proxy: {
      '*': 'http://localhost:8000',
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      __IS_BROWSER__: true,
    }),
  ],
}
