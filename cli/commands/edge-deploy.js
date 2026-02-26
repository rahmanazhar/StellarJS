#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

/**
 * stellar deploy:edge --target=<vercel|cloudflare|aws-lambda|docker|fly>
 */

const TARGETS = {
  vercel: generateVercel,
  cloudflare: generateCloudflare,
  'aws-lambda': generateAWSLambda,
  docker: generateDocker,
  fly: generateFly,
};

function readPackageJson() {
  const pkgPath = path.resolve('package.json');
  if (!fs.existsSync(pkgPath)) return {};
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
}

// ─── Vercel ─────────────────────────────────────────────────────────────────

function generateVercel(options) {
  const pkg = readPackageJson();
  const config = {
    version: 2,
    builds: [{ src: 'dist/index.js', use: '@vercel/node' }],
    routes: [
      { src: '/api/(.*)', dest: '/dist/index.js' },
      { src: '/(.*)', dest: '/dist/index.js' },
    ],
    env: {
      NODE_ENV: 'production',
    },
  };

  fs.writeFileSync('vercel.json', JSON.stringify(config, null, 2));
  return { files: ['vercel.json'], instructions: 'Run: vercel deploy' };
}

// ─── Cloudflare Workers ──────────────────────────────────────────────────────

function generateCloudflare(options) {
  const wranglerConfig = `name = "${readPackageJson().name || 'stellar-app'}"
main = "dist/worker.js"
compatibility_date = "${new Date().toISOString().split('T')[0]}"
node_compat = true

[build]
command = "npm run build"

[[routes]]
pattern = "/*"
zone_name = "${options.domain || 'example.com'}"

[vars]
NODE_ENV = "production"
`;

  const workerEntry = `// Cloudflare Worker entry point for StellarJS
import app from './index';

export default {
  async fetch(request, env, ctx) {
    // Polyfill process.env from CF env bindings
    Object.assign(process.env, env);

    return new Promise((resolve) => {
      const url = new URL(request.url);
      const nodeReq = {
        method: request.method,
        url: url.pathname + url.search,
        headers: Object.fromEntries(request.headers),
        body: request.body,
      };
      const chunks = [];
      const nodeRes = {
        statusCode: 200,
        headers: {},
        setHeader(name, value) { this.headers[name] = value; },
        getHeader(name) { return this.headers[name]; },
        write(chunk) { chunks.push(chunk); },
        end(chunk) {
          if (chunk) chunks.push(chunk);
          resolve(new Response(chunks.join(''), {
            status: this.statusCode,
            headers: this.headers,
          }));
        },
      };
      app(nodeReq, nodeRes);
    });
  },
};
`;

  fs.writeFileSync('wrangler.toml', wranglerConfig);
  fs.writeFileSync('src/worker.ts', workerEntry);

  return {
    files: ['wrangler.toml', 'src/worker.ts'],
    instructions: 'Run: npx wrangler deploy',
  };
}

// ─── AWS Lambda ──────────────────────────────────────────────────────────────

function generateAWSLambda(options) {
  const pkg = readPackageJson();
  const appName = (pkg.name || 'stellar-app').replace(/[@/]/g, '-').replace(/^-/, '');

  const serverlessConfig = `service: ${appName}

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs20.x
  stage: \${opt:stage, 'production'}
  region: \${opt:region, 'us-east-1'}
  memorySize: 512
  timeout: 30
  environment:
    NODE_ENV: production

functions:
  app:
    handler: dist/lambda.handler
    events:
      - httpApi:
          path: /{proxy+}
          method: ANY
      - httpApi:
          path: /
          method: ANY

plugins:
  - serverless-offline

package:
  patterns:
    - '!node_modules/.cache/**'
    - '!src/**'
    - '!tests/**'
    - '!*.ts'
`;

  const lambdaEntry = `import { createServer } from 'http';
import serverless from 'serverless-http';
import app from './index';

export const handler = serverless(app);
`;

  fs.writeFileSync('serverless.yml', serverlessConfig);
  fs.writeFileSync('src/lambda.ts', lambdaEntry);

  return {
    files: ['serverless.yml', 'src/lambda.ts'],
    instructions: 'Run: npm install serverless serverless-http && npx serverless deploy',
  };
}

// ─── Docker ──────────────────────────────────────────────────────────────────

function generateDocker(options) {
  const pkg = readPackageJson();
  const port = options.port || 3000;

  const dockerfile = `# ── Build Stage ────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# ── Production Stage ────────────────────────────────
FROM node:20-alpine AS production

RUN addgroup -g 1001 -S stellar && adduser -S stellar -u 1001

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER stellar

EXPOSE ${port}

ENV NODE_ENV=production
ENV PORT=${port}

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget -qO- http://localhost:${port}/health || exit 1

CMD ["node", "dist/index.js"]
`;

  const dockerignore = `node_modules
.git
.env*
*.log
dist
.stellar
coverage
tests
docs
`;

  const composeFile = `version: '3.9'

services:
  app:
    build:
      context: .
      target: production
    ports:
      - "${port}:${port}"
    environment:
      - NODE_ENV=production
      - PORT=${port}
      - MONGODB_URI=mongodb://mongo:27017/stellar
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis
    restart: unless-stopped
    networks:
      - stellar-net

  mongo:
    image: mongo:7
    volumes:
      - mongo-data:/data/db
    networks:
      - stellar-net
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    networks:
      - stellar-net
    restart: unless-stopped

volumes:
  mongo-data:
  redis-data:

networks:
  stellar-net:
    driver: bridge
`;

  fs.writeFileSync('Dockerfile', dockerfile);
  fs.writeFileSync('.dockerignore', dockerignore);
  fs.writeFileSync('docker-compose.yml', composeFile);

  return {
    files: ['Dockerfile', '.dockerignore', 'docker-compose.yml'],
    instructions: 'Run: docker compose up --build',
  };
}

// ─── Fly.io ──────────────────────────────────────────────────────────────────

function generateFly(options) {
  const pkg = readPackageJson();
  const appName = (pkg.name || 'stellar-app').replace(/[@/]/g, '-').replace(/^-/, '');
  const port = options.port || 3000;

  const flyConfig = `app = "${appName}"
primary_region = "${options.region || 'iad'}"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "${port}"

[http_service]
  internal_port = ${port}
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

  [http_service.concurrency]
    type = "connections"
    hard_limit = 25
    soft_limit = 20

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512
`;

  fs.writeFileSync('fly.toml', flyConfig);

  // Also generate Dockerfile if it doesn't exist
  if (!fs.existsSync('Dockerfile')) {
    const { files } = generateDocker(options);
    return {
      files: [...files, 'fly.toml'],
      instructions: 'Run: fly launch --no-deploy && fly deploy',
    };
  }

  return {
    files: ['fly.toml'],
    instructions: 'Run: fly launch --no-deploy && fly deploy',
  };
}

// ─── Main Command ────────────────────────────────────────────────────────────

async function edgeDeploy(target, options = {}) {
  if (!target || !TARGETS[target]) {
    console.error(chalk.red(`Unknown target: ${target}`));
    console.log(chalk.dim(`Available targets: ${Object.keys(TARGETS).join(', ')}`));
    process.exit(1);
  }

  const spinner = ora(`Generating ${chalk.cyan(target)} deployment config...`).start();

  try {
    const result = TARGETS[target](options);
    spinner.succeed(chalk.green(`${target} config generated`));

    console.log('');
    console.log(chalk.bold('Generated files:'));
    result.files.forEach((f) => console.log(chalk.cyan(`  ${f}`)));
    console.log('');
    console.log(chalk.bold('Next step:'));
    console.log(chalk.white(`  ${result.instructions}`));
    console.log('');
  } catch (error) {
    spinner.fail(chalk.red('Deployment config generation failed: ' + error.message));
    process.exit(1);
  }
}

module.exports = { edgeDeploy };
