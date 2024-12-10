const path = require('path');
const chalk = require('chalk');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const { createServer } = require('../../src/server/StellarServer');
const ora = require('ora');

async function startDevServer(options) {
  const spinner = ora('Starting development server...').start();
  
  try {
    const [clientConfig, serverConfig] = await Promise.all([
      getWebpackConfig('client'),
      getWebpackConfig('server')
    ]);

    // Start backend server
    const server = createServer({
      port: parseInt(options.port, 10),
      auth: {
        jwtSecret: process.env.JWT_SECRET || 'development-secret'
      }
    });

    // Start frontend dev server
    const compiler = webpack(clientConfig);
    const devServer = new WebpackDevServer({
      port: parseInt(options.port, 10) + 1,
      hot: true,
      historyApiFallback: true,
      proxy: {
        '/api': `http://localhost:${options.port}`
      },
      static: {
        directory: path.join(process.cwd(), 'public')
      }
    }, compiler);

    // Start both servers
    await Promise.all([
      server.start(),
      devServer.start()
    ]);

    spinner.succeed(chalk.green('Development server started successfully!'));
    console.log('\nAvailable on:');
    console.log(chalk.cyan(`  Frontend: http://localhost:${parseInt(options.port, 10) + 1}`));
    console.log(chalk.cyan(`  Backend:  http://localhost:${options.port}`));
    console.log('\nNote: Press Ctrl+C to stop the development server\n');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down development server...');
      await Promise.all([
        server.stop(),
        new Promise(resolve => devServer.close(resolve))
      ]);
      process.exit(0);
    });

  } catch (error) {
    spinner.fail('Failed to start development server');
    throw error;
  }
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
    mode: 'development',
    target: isClient ? 'web' : 'node',
    entry: isClient 
      ? './src/index.tsx'
      : './src/server/index.ts',
    output: {
      path: path.resolve(process.cwd(), 'dist', target),
      filename: '[name].js',
      publicPath: '/'
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      alias: {
        '@': path.resolve(process.cwd(), 'src')
      }
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true
            }
          }
        },
        {
          test: /\.css$/,
          use: isClient 
            ? ['style-loader', 'css-loader']
            : ['null-loader']
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource'
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('development'),
        'process.env.BROWSER': JSON.stringify(isClient)
      })
    ],
    devtool: 'source-map',
    ...(isClient ? {
      optimization: {
        splitChunks: {
          chunks: 'all'
        }
      }
    } : {})
  };
}

module.exports = {
  startDevServer
};
