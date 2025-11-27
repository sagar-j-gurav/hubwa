const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.[contenthash].js',
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                ['@babel/preset-react', { runtime: 'automatic' }],
                '@babel/preset-typescript',
              ],
              plugins: ['babel-plugin-styled-components'],
            },
          },
        },
        {
          test: /\.svg$/,
          type: 'asset/inline',
        },
        {
          test: /\.(png|jpg|gif|ico)$/,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        favicon: './public/favicon.ico',
      }),
      new webpack.DefinePlugin({
        'process.env': JSON.stringify({
          NODE_ENV: argv.mode,
          REACT_APP_API_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
          REACT_APP_WEBSOCKET_URL: process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:3000',
          REACT_APP_TWILIO_WHATSAPP_NUMBER: process.env.REACT_APP_TWILIO_WHATSAPP_NUMBER || '+447366331247',
        }),
      }),
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      port: 3001,
      hot: true,
      open: true,
      historyApiFallback: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      allowedHosts: 'all',
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
  };
};
