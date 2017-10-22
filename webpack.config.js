var webpack = require('webpack');
var path = require('path');
var buildPath = path.resolve(__dirname, 'build');
var mainPath = path.resolve(__dirname, 'app.js');

var config = {
  devtool: 'eval',
  entry: [mainPath],
  output: {
    path: buildPath,
    filename: 'bundle.js',
    publicPath: '/build/'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [{
          loader: 'babel-loader',
        }]
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      }
    ]
  },

  // We have to manually add the Hot Replacement plugin when running
  // from Node
  plugins: [
      new webpack.ProvidePlugin({
          $: "jquery",
          jQuery: "jquery"
      })
    ]
};

module.exports = config;