#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

/**
 * stellar generate client
 *
 * Scans your server's registered routes (via a manifest file) and generates
 * a fully-typed TypeScript client.
 *
 * Usage:
 *   stellar generate client [--out <path>] [--manifest <path>]
 */

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function routeToMethodName(method, routePath) {
  const clean = routePath
    .replace(/^\/api\/[^/]+/, '') // strip /api/serviceName
    .replace(/\/:(\w+)/g, 'By$1') // /:id → ById
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return `${method.toLowerCase()}${
    clean
      ? capitalize(clean.replace(/_(\w)/g, (_, c) => c.toUpperCase()))
      : capitalize(routePath.replace(/[^a-zA-Z]/g, '').substring(0, 8))
  }`;
}

function generateClientCode(services, options = {}) {
  const baseUrl = options.baseUrl || 'process.env.STELLAR_API_URL || "http://localhost:3000"';

  const methods = [];

  for (const service of services) {
    const { name, routes } = service;

    for (const route of routes) {
      const methodName = routeToMethodName(route.method, `/api/${name}${route.path}`);
      const hasBody = ['post', 'put', 'patch'].includes(route.method.toLowerCase());
      const hasParams = route.path.includes(':');
      const params = (route.path.match(/:(\w+)/g) || []).map((p) => p.slice(1));

      const paramArgs = params.map((p) => `${p}: string`).join(', ');
      const bodyArg = hasBody ? `body: Record<string, unknown>` : '';
      const args = [paramArgs, bodyArg, 'options?: RequestInit'].filter(Boolean).join(', ');

      const urlPath = `/api/${name}${route.path}`.replace(/:(\w+)/g, '${$1}');
      const fetchBody = hasBody ? `\n    body: JSON.stringify(body),` : '';

      methods.push(`
  /** ${route.method.toUpperCase()} /api/${name}${route.path} */
  async ${methodName}(${args}): Promise<T> {
    const url = \`\${this.baseUrl}${urlPath}\`;
    const response = await fetch(url, {
      method: '${route.method.toUpperCase()}',
      headers: { 'Content-Type': 'application/json', ...this.defaultHeaders },${fetchBody}
      ...options,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new StellarClientError(response.status, error.message || 'Request failed', error);
    }
    return response.json() as Promise<T>;
  }`);
    }
  }

  return `// ============================================================
// StellarJS Auto-Generated API Client
// Generated at: ${new Date().toISOString()}
// DO NOT EDIT — run "stellar generate client" to regenerate
// ============================================================

export class StellarClientError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = 'StellarClientError';
  }
}

export interface StellarClientOptions {
  baseUrl?: string;
  headers?: Record<string, string>;
  /** Interceptor called before every request */
  onRequest?: (url: string, init: RequestInit) => RequestInit | Promise<RequestInit>;
  /** Interceptor called after every response */
  onResponse?: (response: Response) => void | Promise<void>;
}

export class StellarClient<T = unknown> {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private options: StellarClientOptions;

  constructor(options: StellarClientOptions = {}) {
    this.baseUrl = options.baseUrl || (${baseUrl});
    this.defaultHeaders = options.headers || {};
    this.options = options;
  }

  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = \`Bearer \${token}\`;
  }

  clearAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  setHeader(name: string, value: string): void {
    this.defaultHeaders[name] = value;
  }

  // ─── Generated Methods ───────────────────────────────────────
${methods.join('\n')}
}

// Default export: pre-configured singleton
export const api = new StellarClient();
export default StellarClient;
`;
}

async function generateClient(options = {}) {
  const outPath = options.out || 'src/stellar-client.ts';
  const manifestPath = options.manifest || '.stellar/routes.json';
  const spinner = ora('Generating typed API client...').start();

  try {
    let services = [];

    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      services = manifest.services || [];
      spinner.text = `Found ${services.length} services in manifest`;
    } else {
      // Try to infer from source files
      spinner.text = 'No manifest found, scanning source files...';
      services = scanSourceRoutes();
    }

    if (services.length === 0) {
      spinner.warn('No services found. Register services with server.registerService() first.');
      console.log(
        chalk.dim(
          '\nTip: Run your server once with STELLAR_WRITE_MANIFEST=true to auto-generate the manifest'
        )
      );
      return;
    }

    const code = generateClientCode(services, options);

    // Ensure output directory exists
    const outDir = path.dirname(outPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    fs.writeFileSync(outPath, code, 'utf8');

    spinner.succeed(chalk.green(`Client generated: `) + chalk.cyan(outPath));

    console.log(chalk.dim('\nUsage:'));
    console.log(chalk.white(`  import { api } from './${outPath.replace(/\.ts$/, '')}';`));
    console.log(chalk.white(`  const user = await api.getUsers();`));
    console.log('');
    console.log(chalk.dim(`Services included: ${services.map((s) => s.name).join(', ')}`));
  } catch (error) {
    spinner.fail(chalk.red('Client generation failed: ' + error.message));
    process.exit(1);
  }
}

function scanSourceRoutes() {
  // Heuristic scan: look for registerService() calls in source files
  const services = [];
  const srcDir = path.resolve('src');
  if (!fs.existsSync(srcDir)) return services;

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(ts|js)$/.test(entry.name)) continue;
      const content = fs.readFileSync(full, 'utf8');
      // Look for route definitions
      const routeMatches = content.matchAll(
        /method:\s*['"](\w+)['"]\s*,\s*path:\s*['"]([^'"]+)['"]/g
      );
      for (const match of routeMatches) {
        // Try to infer service name from directory
        const parts = path.relative(srcDir, full).split(path.sep);
        const serviceName = parts.length > 1 ? parts[parts.length - 2] : 'api';
        let service = services.find((s) => s.name === serviceName);
        if (!service) {
          service = { name: serviceName, routes: [] };
          services.push(service);
        }
        service.routes.push({ method: match[1], path: match[2] });
      }
    }
  }

  walk(srcDir);
  return services;
}

module.exports = { generateClient, generateClientCode };
