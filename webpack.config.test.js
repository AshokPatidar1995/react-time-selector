const path = require('path');
const rules = require('./webpack.rules.js');

// This config file is used to create a webpack bundle that we use on
// in src/test.html to test out the component in a browser.
module.exports = {
  entry: path.join(__dirname, 'src/components/App/App.jsx'),
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'test.js',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.css'],
  },
  devtool: 'source-map',
  module: {
    rules,
  },
};
