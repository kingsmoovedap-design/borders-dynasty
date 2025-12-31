const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // ...existing config
  plugins: [
    new HtmlWebpackPlugin({
      template: 'public/index.html'
    })
  ]
};
