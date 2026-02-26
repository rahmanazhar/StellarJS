# StellarJS

A modern fullstack JavaScript framework combining React with a production-ready Express backend — built-in authentication, microservices, real-time WebSocket, AI integration, background jobs, SSR/SSG/ISR, multi-tenancy, i18n, image optimization, and a live DevTools dashboard.

[![npm version](https://badge.fury.io/js/%40rahmanazhar%2Fstellar-js.svg)](https://www.npmjs.com/package/@rahmanazhar/stellar-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why StellarJS?

Next.js and Nuxt.js are frontend frameworks with API routes bolted on. StellarJS is a **backend-first fullstack framework** with real enterprise architecture that also handles the frontend excellently.

| Feature                | Next.js   | Nuxt.js   | StellarJS |
| ---------------------- | --------- | --------- | --------- |
| SSR / SSG / ISR        | ✅        | ✅        | ✅        |
| File-based routing     | ✅        | ✅        | ✅        |
| Built-in auth          | ❌ plugin | ❌ plugin | ✅        |
| Real-time WebSocket    | ❌ plugin | ❌ plugin | ✅        |
| Background jobs        | ❌        | ❌        | ✅        |
| AI integration         | ❌        | ❌        | ✅        |
| Microservices registry | ❌        | ❌        | ✅        |
| Multi-tenancy          | ❌        | ❌        | ✅        |
| Audit logging          | ❌        | ❌        | ✅        |
| DevTools dashboard     | ❌        | ✅        | ✅        |
| Plugin system          | ✅        | ✅        | ✅        |
| i18n                   | ❌ plugin | ✅        | ✅        |
| Image optimization     | ✅        | ✅        | ✅        |

## Requirements

- Node.js >= 14
- MongoDB (for auth features)
- Redis (optional — for production job queues via BullMQ)

## Installation

```bash
npm install @rahmanazhar/stellar-js
```

## Quick Start

```bash
npx stellar create my-app
cd my-app
npm run dev
```

---

## Server

```typescript
import { createServer } from '@rahmanazhar/stellar-js';

const server = createServer({ port: 3000 });

server.registerService({
  name: 'users',
  routes: [
    { method: 'GET', path: '/', handler: (req, res) => res.json({ users: [] }) },
    { method: 'POST', path: '/', handler: (req, res) => res.json({ created: true }) },
  ],
});

server.start();
```

---

## AI Integration

OpenAI, Anthropic (Claude), and Ollama — with SSE streaming and a React hook.

### Server setup

```typescript
import { createServer, initAI } from '@rahmanazhar/stellar-js';

const ai = initAI({
  anthropic: { apiKey: process.env.ANTHROPIC_API_KEY, defaultModel: 'claude-sonnet-4-6' },
  openai: { apiKey: process.env.OPENAI_API_KEY, defaultModel: 'gpt-4o' },
  ollama: { baseURL: 'http://localhost:11434', defaultModel: 'llama3.2' },
  defaultProvider: 'anthropic',
});

const server = createServer({ port: 3000 });

server.getApp().post(
  '/api/ai/chat',
  ai.createRouteHandler({
    systemPrompt: 'You are a helpful assistant.',
    stream: true,
  })
);
```

### React hook

```tsx
import { useAI } from '@rahmanazhar/stellar-js';

function Chat() {
  const { messages, send, isStreaming, abort } = useAI({
    endpoint: '/api/ai/chat',
  });

  return (
    <div>
      {messages.map((m, i) => (
        <div key={i}>
          <b>{m.role}:</b> {m.content}
        </div>
      ))}
      <button onClick={() => send('Hello!')} disabled={isStreaming}>
        Send
      </button>
      {isStreaming && <button onClick={abort}>Stop</button>}
    </div>
  );
}
```

### Programmatic use (server-side)

```typescript
const ai = getAI();

// Single completion
const reply = await ai.complete([{ role: 'user', content: 'Summarize this document...' }], {
  provider: 'anthropic',
  model: 'claude-sonnet-4-6',
});

// Streaming
for await (const chunk of ai.stream([{ role: 'user', content: 'Tell me a story' }])) {
  process.stdout.write(chunk);
}
```

Requires: `npm install openai` and/or `npm install @anthropic-ai/sdk`

---

## Authentication

Real JWT authentication backed by MongoDB with bcrypt password hashing. No stubs.

### Setup

```typescript
import { createAuthService, createAuthMiddleware } from '@rahmanazhar/stellar-js';

const authService = createAuthService({
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: '7d',
  mongoUri: process.env.MONGODB_URI,
});

const requireAuth = createAuthMiddleware({ jwtSecret: process.env.JWT_SECRET });
```

### Auth endpoints

| Method | Path                      | Description         |
| ------ | ------------------------- | ------------------- |
| POST   | /api/auth/register        | Register a new user |
| POST   | /api/auth/login           | Login, returns JWT  |
| POST   | /api/auth/logout          | Invalidate session  |
| POST   | /api/auth/forgot-password | Email reset token   |
| POST   | /api/auth/reset-password  | Reset with token    |

### UserModel fields

| Field              | Type     | Notes                          |
| ------------------ | -------- | ------------------------------ |
| email              | String   | Unique, required               |
| password           | String   | bcrypt hashed, `select: false` |
| name               | String   | Display name                   |
| roles              | String[] | Default: `['user']`            |
| isActive           | Boolean  | Account status                 |
| lastLogin          | Date     | Updated on login               |
| passwordResetToken | String   | HMAC-hashed, 10-min TTL        |

---

## Real-time WebSocket

Socket.IO with typed channels, auth guards, and automatic reconnection.

### Server

```typescript
import { initWebSocket } from '@rahmanazhar/stellar-js';
import { createServer as createHttpServer } from 'http';

const httpServer = createHttpServer(app.getApp());
const ws = initWebSocket(httpServer);

ws.createChannel('notifications', { auth: true }, (socket) => {
  socket.on('subscribe', (topic: string) => socket.join(topic));
});

ws.broadcast('notifications', 'alert', { text: 'Hello!' });
```

### React hook

```tsx
import { useChannel } from '@rahmanazhar/stellar-js';

const { isConnected, send, on } = useChannel('notifications', {
  token: localStorage.getItem('token'),
});
```

Requires: `npm install socket.io socket.io-client`

---

## Background Jobs

BullMQ + Redis in production, in-memory fallback in development.

```typescript
import { initJobQueue } from '@rahmanazhar/stellar-js';

const jobs = initJobQueue({ redis: process.env.REDIS_URL, inMemoryFallback: true });

jobs.defineJob({
  name: 'send-email',
  handler: async (payload: { to: string; subject: string }) => {
    await emailService.send(payload);
  },
  options: { retries: 3, backoff: 'exponential' },
});

await jobs.dispatch('send-email', { to: user.email, subject: 'Welcome!' });

jobs.scheduleJob({
  name: 'cleanup',
  cron: '0 * * * *',
  handler: async () => {
    await SessionModel.deleteExpired();
  },
});
```

Requires (production): `npm install bullmq ioredis`

---

## SSR / SSG / ISR

```typescript
import { initSSR, initFileRouter } from '@rahmanazhar/stellar-js';

const ssr = initSSR({ clientBundlePath: '/static/app.js' });
initFileRouter(server.getApp(), { pagesDir: 'src/pages', ssrEngine: ssr });
```

### Page module

```tsx
// src/pages/users/[id].tsx
export const getServerProps: GetServerProps = async ({ params }) => {
  const user = await UserService.findById(params.id);
  if (!user) return { notFound: true, props: {} };
  return { props: { user }, revalidate: 60 }; // ISR: revalidate every 60s
};

export default function UserPage({ user }) {
  return <h1>{user.name}</h1>;
}
```

### File routing conventions

| File                    | Route                           |
| ----------------------- | ------------------------------- |
| `pages/index.tsx`       | `/`                             |
| `pages/about.tsx`       | `/about`                        |
| `pages/users/index.tsx` | `/users`                        |
| `pages/users/[id].tsx`  | `/users/:id`                    |
| `pages/api/users.ts`    | (skipped — use registerService) |

---

## Microservices

```typescript
import { initServiceRegistry, createInterServiceClient } from '@rahmanazhar/stellar-js';

const registry = initServiceRegistry({ heartbeatInterval: 10000 });
registry.register({ name: 'order-service', url: 'http://orders:3002', version: '1.0.0' });

const client = createInterServiceClient('order-service', { retries: 3 });
const orders = await client.get('/orders?userId=123');
```

---

## Multi-tenancy

```typescript
import { tenantMiddleware, tenantScope } from '@rahmanazhar/stellar-js';

server.use(
  tenantMiddleware({
    strategy: 'subdomain', // or 'header' | 'path' | 'jwt-claim'
    required: true,
  })
);

app.get('/data', async (req, res) => {
  const data = await Model.find(tenantScope(req, { active: true }));
  res.json(data);
});
```

---

## Plugin System

```typescript
import { definePlugin, initPluginRegistry } from '@rahmanazhar/stellar-js';

const StripePlugin = definePlugin({
  name: 'stripe',
  setup(ctx, { secretKey }) {
    ctx.extend('stripe', new Stripe(secretKey));
    ctx.addRoute('post', '/webhook', handleWebhook);
  },
});

const registry = initPluginRegistry();
await registry.register(StripePlugin({ secretKey: process.env.STRIPE_KEY }));

const stripe = registry.get('stripe');
```

---

## Event Bus

```typescript
import { stellarOn, stellarEmit } from '@rahmanazhar/stellar-js';

stellarOn('user.registered', async ({ userId, email }) => {
  await jobs.dispatch('send-email', { to: email, subject: 'Welcome!' });
});

stellarEmit('user.registered', { userId: user.id, email: user.email });
```

---

## i18n

```tsx
import { I18nProvider, useTranslation } from '@rahmanazhar/stellar-js';

const config = {
  defaultLocale: 'en',
  locales: ['en', 'ar', 'fr'],
  messages: {
    en: { welcome: 'Hello, {{name}}!' },
    ar: { welcome: 'مرحبا، {{name}}!' },
    fr: { welcome: 'Bonjour, {{name}}!' },
  },
};

function Header({ name }: { name: string }) {
  const { t, setLocale, formatDate, formatCurrency, isRTL } = useTranslation();
  return (
    <header dir={isRTL ? 'rtl' : 'ltr'}>
      <h1>{t('welcome', { name })}</h1>
      <button onClick={() => setLocale('ar')}>عربي</button>
    </header>
  );
}
```

---

## Image Optimization

```typescript
const optimizer = initImageOptimizer({ sourceDir: 'public', defaultFormat: 'webp', quality: 85 });
server.getApp().get('/__stellar/image', optimizer.createHandler());
```

```tsx
import { StellarImage } from '@rahmanazhar/stellar-js';

<StellarImage src="/hero.jpg" width={1200} height={600} alt="Hero" priority placeholder="blur" />;
```

Requires: `npm install sharp`

---

## Database Adapters

```typescript
import { initDatabaseAdapter } from '@rahmanazhar/stellar-js';

await initDatabaseAdapter({ adapter: 'mongoose', url: process.env.MONGODB_URI });
await initDatabaseAdapter({ adapter: 'prisma', url: process.env.DATABASE_URL });
await initDatabaseAdapter({ adapter: 'redis', url: process.env.REDIS_URL });
```

---

## Security

Enterprise-grade security included by default.

| Feature           | Description                                                     |
| ----------------- | --------------------------------------------------------------- |
| Helmet            | HTTP security headers                                           |
| Rate limiting     | Per-IP throttling                                               |
| XSS protection    | Input sanitization                                              |
| MongoDB injection | Query sanitization                                              |
| HPP               | HTTP parameter pollution prevention                             |
| CORS              | Fine-grained origin control                                     |
| Audit logging     | Every request logged with actor, resource, severity             |
| CSRF              | `generateCSRFToken()` / `verifyCSRFToken()`                     |
| JWT               | `signWithExpiry()`, `verifyWithExpiry()`, `generateJWTSecret()` |
| Encryption        | `encrypt()` / `decrypt()`                                       |
| Hashing           | `hashSHA256()`, `hashSHA512()`, `generateHMAC()`                |
| OTP               | `generateOTP()` — 6-digit time-based                            |
| Data masking      | `maskEmail()`, `maskCreditCard()`, `maskSensitiveData()`        |

---

## DevTools

Live dashboard at `/__stellar` (development only).

```typescript
import { initDevTools } from '@rahmanazhar/stellar-js';

initDevTools(
  server.getApp(),
  { devOnly: true },
  {
    registeredServices: ['users', 'orders'],
    plugins: registry.getPluginInfo(),
  }
);
```

Shows: uptime, memory, live request log, routes, registered plugins.

---

## CLI

```bash
stellar create my-app              # Scaffold new project
stellar dev                        # Start dev server
stellar build                      # Production build
stellar generate:client            # Generate typed API client
stellar deploy:edge docker         # Generate Dockerfile + docker-compose
stellar deploy:edge vercel         # Generate vercel.json
stellar deploy:edge cloudflare     # Generate wrangler.toml
stellar deploy:edge aws-lambda     # Generate serverless.yml
stellar deploy:edge fly            # Generate fly.toml
stellar generate component Button  # Scaffold a React component
stellar generate service payments  # Scaffold a service
```

---

## Typed API Client

```bash
stellar generate:client --out src/api-client.ts
```

```typescript
import { api } from './api-client';

const users = await api.getUsersAll();
const user = await api.getUsersById('123');
await api.postUsers({ name: 'Alice', email: 'alice@example.com' });
```

---

## Repository

[https://github.com/rahmanazhar/StellarJS](https://github.com/rahmanazhar/StellarJS)

## License

MIT © Rahman Azhar
