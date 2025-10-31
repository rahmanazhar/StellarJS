const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');
const ora = require('ora');

async function createProject(projectName, options) {
  const spinner = ora('Creating StellarJS project...').start();
  const projectPath = path.join(process.cwd(), projectName);

  try {
    // Create project directory
    await fs.mkdir(projectPath);

    // Create project structure
    await createProjectStructure(projectPath);

    // Create package.json
    await createPackageJson(projectPath, projectName);

    // Create tsconfig if using TypeScript
    if (options.typescript) {
      await createTsConfig(projectPath);
    }

    // Create initial source files
    await createSourceFiles(projectPath, options);

    // Install dependencies
    if (!options.skipInstall) {
      spinner.text = 'Installing dependencies...';
      installDependencies(projectPath);
    }

    spinner.succeed('Project created successfully!');
  } catch (error) {
    spinner.fail('Failed to create project');
    throw error;
  }
}

async function createProjectStructure(projectPath) {
  const dirs = [
    'src/components',
    'src/services',
    'src/hooks',
    'src/utils',
    'src/pages',
    'src/styles',
    'public',
    'tests',
  ];

  for (const dir of dirs) {
    await fs.mkdir(path.join(projectPath, dir), { recursive: true });
  }
}

async function createPackageJson(projectPath, projectName) {
  const packageJson = {
    name: projectName,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'stellar dev',
      build: 'stellar build',
      start: 'stellar start',
      test: 'jest',
    },
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      'react-router-dom': '^6.14.0',
      express: '^4.18.2',
      cors: '^2.8.5',
      'stellar-js': 'latest',
    },
    devDependencies: {
      '@types/react': '^18.2.14',
      '@types/react-dom': '^18.2.6',
      '@types/express': '^4.17.17',
      '@types/node': '^20.3.2',
      typescript: '^5.1.5',
      jest: '^29.5.0',
      '@types/jest': '^29.5.2',
      eslint: '^8.43.0',
      '@typescript-eslint/parser': '^5.61.0',
      '@typescript-eslint/eslint-plugin': '^5.61.0',
    },
  };

  await fs.writeFile(path.join(projectPath, 'package.json'), JSON.stringify(packageJson, null, 2));
}

async function createTsConfig(projectPath) {
  const tsConfig = {
    compilerOptions: {
      target: 'es2020',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      noFallthroughCasesInSwitch: true,
      module: 'esnext',
      moduleResolution: 'node',
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx',
    },
    include: ['src'],
    exclude: ['node_modules'],
  };

  await fs.writeFile(path.join(projectPath, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));
}

async function createSourceFiles(projectPath, options) {
  const ext = options.typescript ? 'tsx' : 'jsx';

  // Create App component
  const appContent = `
import React from 'react';
import { StellarApp } from 'stellar-js';
import Router from './Router';

const config = {
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key'
  }
};

function App() {
  return (
    <StellarApp config={config}>
      <Router />
    </StellarApp>
  );
}

export default App;
`;

  // Create Router
  const routerContent = `
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

function Router() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}

export default Router;
`;

  // Create Home page
  const homeContent = `
import React from 'react';

function Home() {
  return (
    <div>
      <h1>Welcome to StellarJS!</h1>
      <p>Start building your awesome app.</p>
    </div>
  );
}

export default Home;
`;

  await Promise.all([
    fs.writeFile(path.join(projectPath, 'src', `App.${ext}`), appContent.trim()),
    fs.writeFile(path.join(projectPath, 'src', `Router.${ext}`), routerContent.trim()),
    fs.writeFile(path.join(projectPath, 'src/pages', `Home.${ext}`), homeContent.trim()),
  ]);
}

function installDependencies(projectPath) {
  try {
    execSync('npm install', { cwd: projectPath, stdio: 'inherit' });
  } catch (error) {
    throw new Error('Failed to install dependencies');
  }
}

module.exports = {
  createProject,
};
