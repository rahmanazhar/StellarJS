const path = require('path');
const webpack = require('webpack');
const ora = require('ora');
const chalk = require('chalk');
const fs = require('fs-extra');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

async function buildProject() {
  const spinner = ora('Building project for production...').start();

  try {
    // Clean dist directory
    await fs.emptyDir(path.join(process.cwd(), 'dist'));

    // Build client and server
    const [clientConfig, serverConfig] = await Promise.all([
      getWebpackConfig('client'),
      getWebpackConfig('server'),
    ]);

    // Run webpack builds
    await Promise.all([runWebpack(clientConfig), runWebpack(serverConfig)]);

    // Copy public files
    await fs.copy(path.join(process.cwd(), 'public'), path.join(process.cwd(), 'dist', 'public'), {
      filter: (src) => !src.includes('node_modules'),
    });

    spinner.succeed(chalk.green('Production build completed successfully!'));

    // Log build stats
    const clientStats = await fs.stat(path.join(process.cwd(), 'dist', 'client', 'main.js'));
    const serverStats = await fs.stat(path.join(process.cwd(), 'dist', 'server', 'main.js'));

    console.log('\nBuild statistics:');
    console.log(
      chalk.cyan(`  Client bundle size: ${(clientStats.size / 1024 / 1024).toFixed(2)} MB`)
    );
    console.log(
      chalk.cyan(`  Server bundle size: ${(serverStats.size / 1024 / 1024).toFixed(2)} MB`)
    );
    console.log('\nTo start the production server:');
    console.log(chalk.cyan('  npm start\n'));
  } catch (error) {
    spinner.fail('Build failed');
    throw error;
  }
}

function runWebpack(config) {
  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) {
        reject(err);
        return;
      }

      if (stats.hasErrors()) {
        reject(new Error(stats.toString('errors-only')));
        return;
      }

      resolve(stats);
    });
  });
}

async function getWebpackConfig(target) {
  const configPath = path.join(process.cwd(), 'webpack.config.js');
  let config;

  try {
    config = require(configPath);
  } catch {
    config = getDefaultWebpackConfig(target);
  }

  return typeof config === 'function' ? config(target) : config;
}

function getDefaultWebpackConfig(target) {
  const isClient = target === 'client';

  return {
    mode: 'production',
    target: isClient ? 'web' : 'node',
    entry: isClient ? './src/index.tsx' : './src/server/index.ts',
    output: {
      path: path.resolve(process.cwd(), 'dist', target),
      filename: '[name].[contenthash].js',
      publicPath: '/',
      ...(isClient ? {} : { libraryTarget: 'commonjs2' }),
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      alias: {
        '@': path.resolve(process.cwd(), 'src'),
      },
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: 'ts-loader',
        },
        {
          test: /\.css$/,
          use: isClient ? [MiniCssExtractPlugin.loader, 'css-loader'] : ['null-loader'],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/[hash][ext][query]',
          },
        },
      ],
    },
    optimization: {
      minimize: isClient,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: false,
            },
          },
          extractComments: false,
        }),
        new CssMinimizerPlugin(),
      ],
      ...(isClient
        ? {
            splitChunks: {
              chunks: 'all',
              name: false,
            },
            runtimeChunk: {
              name: 'runtime',
            },
          }
        : {}),
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production'),
        'process.env.BROWSER': JSON.stringify(isClient),
      }),
      ...(isClient
        ? [
            new MiniCssExtractPlugin({
              filename: 'css/[name].[contenthash].css',
              chunkFilename: 'css/[id].[contenthash].css',
            }),
          ]
        : []),
    ],
    ...(isClient
      ? {}
      : {
          externals: [
            /^[a-z\-0-9]+$/, // Exclude node_modules
          ],
        }),
  };
}

module.exports = {
  buildProject,
};
