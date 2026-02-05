const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';

  return {
    entry: './src/index.js',
    output: {
      filename: isProd ? '[name].[contenthash].js' : 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
      assetModuleFilename: 'assets/[hash][ext][query]',
      clean: true,
    },
    devtool: isProd ? 'source-map' : 'eval-source-map',
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: 'babel-loader',
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: './src/index.html',
        filename: 'index.html',
        inject: 'body',
        minify: isProd
          ? {
              collapseWhitespace: true,
              removeComments: true,
              removeRedundantAttributes: true,
              useShortDoctype: true,
            }
          : false,
      }),
    ],
    devServer: {
      static: [
        { directory: path.join(__dirname, 'dist') },
        { directory: path.join(__dirname, 'public') },
      ],
      port: 5000,
      host: '0.0.0.0',
      allowedHosts: 'all',
      open: false,
      hot: true,
      client: {
        webSocketURL: 'auto://0.0.0.0:0/ws',
      },
      historyApiFallback: true,
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
      },
      runtimeChunk: 'single',
    },
    performance: {
      hints: isProd ? 'warning' : false,
    },
    mode: isProd ? 'production' : 'development',
    cache: {
      type: 'filesystem',
    },
    resolve: {
      extensions: ['.js', '.json'],
    },
  };
};
