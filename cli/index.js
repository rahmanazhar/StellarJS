#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const { createProject } = require('./commands/create');
const { generateComponent, generateService } = require('./commands/generate');
const { deployProject } = require('./commands/deploy');
const {
  createDeploymentConfig,
  deployToEnvironment,
  uploadToServer,
} = require('./commands/deployment-utils');
const { version } = require('../package.json');

// Configure CLI
program.name('stellar').description('StellarJS CLI - Modern Fullstack Framework').version(version);

// Create new project
program
  .command('create <project-name>')
  .description('Create a new StellarJS project')
  .option('-t, --template <template>', 'Template to use (default: basic)', 'basic')
  .option('--typescript', 'Use TypeScript (default: true)', true)
  .option('--skip-install', 'Skip package installation', false)
  .action(async (projectName, options) => {
    try {
      await createProject(projectName, options);
      console.log(chalk.green(`\n✨ Successfully created project ${chalk.bold(projectName)}\n`));
      console.log('To get started:');
      console.log(chalk.cyan(`  cd ${projectName}`));
      console.log(chalk.cyan('  npm run dev'));
    } catch (error) {
      console.error(chalk.red('\nError creating project:'), error.message);
      process.exit(1);
    }
  });

// Generate components/services
program
  .command('generate <type> <name>')
  .alias('g')
  .description('Generate a new component, service, or other artifact')
  .option('-p, --path <path>', 'Custom path for generation')
  .option('--php', 'Generate PHP-connected component with API integration')
  .option('--crud', 'Generate CRUD component with PHP backend integration')
  .action(async (type, name, options) => {
    try {
      switch (type.toLowerCase()) {
        case 'component':
        case 'c':
          await generateComponent(name, options);
          break;
        case 'service':
        case 's':
          await generateService(name, options);
          break;
        default:
          console.error(chalk.red(`Unknown generation type: ${type}`));
          process.exit(1);
      }
      console.log(chalk.green(`\n✨ Successfully generated ${type}: ${chalk.bold(name)}\n`));
    } catch (error) {
      console.error(chalk.red(`\nError generating ${type}:`), error.message);
      process.exit(1);
    }
  });

// Dev server
program
  .command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'Port to run on', '3000')
  .action(async (options) => {
    try {
      const { startDevServer } = require('./commands/dev');
      await startDevServer(options);
    } catch (error) {
      console.error(chalk.red('\nError starting development server:'), error.message);
      process.exit(1);
    }
  });

// Build
program
  .command('build')
  .description('Build for production')
  .action(async () => {
    try {
      const { buildProject } = require('./commands/build');
      await buildProject();
      console.log(chalk.green('\n✨ Build completed successfully\n'));
    } catch (error) {
      console.error(chalk.red('\nError building project:'), error.message);
      process.exit(1);
    }
  });

// Deploy
program
  .command('deploy <server-type>')
  .description('Deploy to server (hestiacp, apache, nginx, php)')
  .option('-d, --domain <domain>', 'Domain name', 'example.com')
  .option('--document-root <path>', 'Document root path', '/var/www/html')
  .option('--generate-php', 'Generate PHP backend API', false)
  .option('--database <name>', 'Database name', 'stellar_db')
  .option('--db-user <user>', 'Database user', 'root')
  .option('--db-password <password>', 'Database password', '')
  .action(async (serverType, options) => {
    try {
      await deployProject(serverType, options);
    } catch (error) {
      console.error(chalk.red('\nError preparing deployment:'), error.message);
      process.exit(1);
    }
  });

// Deployment configuration
program
  .command('deploy:config')
  .description('Create deployment configuration file')
  .option('-t, --type <type>', 'Server type (apache, nginx, hestiacp)', 'apache')
  .option('-d, --domain <domain>', 'Domain name', 'example.com')
  .option('--generate-php', 'Generate PHP backend', false)
  .action(async (options) => {
    try {
      await createDeploymentConfig(options);
    } catch (error) {
      console.error(chalk.red('\nError creating deployment config:'), error.message);
      process.exit(1);
    }
  });

// Deploy to environment
program
  .command('deploy:env <environment>')
  .description('Deploy to specific environment (production, staging)')
  .action(async (environment) => {
    try {
      await deployToEnvironment(environment);
    } catch (error) {
      console.error(chalk.red(`\nError deploying to ${environment}:`), error.message);
      process.exit(1);
    }
  });

// Upload files
program
  .command('upload')
  .description('Upload files to server')
  .option('-h, --host <host>', 'Server host')
  .option('-u, --username <username>', 'Username')
  .option('-p, --password <password>', 'Password (optional for key-based auth)')
  .option('-m, --method <method>', 'Upload method (sftp, ftp, rsync)', 'sftp')
  .option('--local-path <path>', 'Local path to upload', './deploy')
  .option('--remote-path <path>', 'Remote path', '/var/www/html')
  .action(async (options) => {
    try {
      await uploadToServer(options);
    } catch (error) {
      console.error(chalk.red('\nError uploading files:'), error.message);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
