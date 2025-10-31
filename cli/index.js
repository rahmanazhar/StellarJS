#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const { createProject } = require('./commands/create');
const { generateComponent, generateService } = require('./commands/generate');
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

// Parse command line arguments
program.parse(process.argv);

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
