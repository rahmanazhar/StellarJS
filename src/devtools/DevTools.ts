import { Express, Request, Response } from 'express';
import { createLogger } from '../utils/helpers';

const logger = createLogger('DevTools');

export interface DevToolsOptions {
  /** Mount path (default: '/__stellar') */
  path?: string;
  /** Only mount in development (default: true) */
  devOnly?: boolean;
  /** Enable request log panel (default: true) */
  requestLog?: boolean;
  /** Max request log entries */
  maxLogEntries?: number;
}

interface RequestLogEntry {
  id: string;
  method: string;
  path: string;
  status: number;
  duration: number;
  timestamp: string;
  body?: unknown;
}

export class DevTools {
  private mountPath: string;
  private requestLog: RequestLogEntry[] = [];
  private maxLogEntries: number;
  private startTime = Date.now();

  constructor(private options: DevToolsOptions = {}) {
    this.mountPath = options.path || '/__stellar';
    this.maxLogEntries = options.maxLogEntries || 100;
  }

  mount(app: Express, extraInfo?: Record<string, unknown>): void {
    if (this.options.devOnly !== false && process.env.NODE_ENV === 'production') {
      logger.warn('DevTools not mounted in production. Set devOnly: false to override.');
      return;
    }

    // Request logging middleware
    if (this.options.requestLog !== false) {
      app.use((req: Request, res: Response, next: () => void) => {
        const start = Date.now();
        const id = Math.random().toString(36).slice(2);
        const originalEnd = res.end.bind(res);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (res.end as any) = (...args: any[]) => {
          const entry: RequestLogEntry = {
            id,
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration: Date.now() - start,
            timestamp: new Date().toISOString(),
          };

          this.requestLog.unshift(entry);
          if (this.requestLog.length > this.maxLogEntries) {
            this.requestLog.pop();
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (originalEnd as (...a: any[]) => any)(...args);
        };

        next();
      });
    }

    // Dashboard route
    app.get(this.mountPath, (_req: Request, res: Response) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(this.renderDashboard(extraInfo));
    });

    // API routes for the dashboard
    app.get(`${this.mountPath}/api/info`, (_req: Request, res: Response) => {
      res.json({
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development',
        ...extraInfo,
      });
    });

    app.get(`${this.mountPath}/api/requests`, (_req: Request, res: Response) => {
      res.json(this.requestLog);
    });

    app.delete(`${this.mountPath}/api/requests`, (_req: Request, res: Response) => {
      this.requestLog = [];
      res.json({ cleared: true });
    });

    logger.info(`DevTools available at ${this.mountPath}`);
  }

  private renderDashboard(info?: Record<string, unknown>): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>StellarJS DevTools</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f0f13;color:#e2e8f0;min-height:100vh}
    header{background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:20px 32px;display:flex;align-items:center;gap:16px;border-bottom:1px solid #2d3748}
    header h1{font-size:22px;font-weight:700;background:linear-gradient(90deg,#60a5fa,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    header .badge{background:#2563eb;color:#fff;font-size:11px;font-weight:600;padding:3px 8px;border-radius:999px}
    .container{display:grid;grid-template-columns:300px 1fr;gap:0;height:calc(100vh - 65px)}
    .sidebar{background:#13131a;border-right:1px solid #2d3748;padding:24px;overflow-y:auto}
    .main{padding:24px;overflow-y:auto}
    .section{margin-bottom:32px}
    .section h2{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;margin-bottom:12px}
    .card{background:#1a1a2e;border:1px solid #2d3748;border-radius:10px;padding:16px;margin-bottom:10px}
    .stat{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #2d3748}
    .stat:last-child{border-bottom:none}
    .stat-label{font-size:13px;color:#94a3b8}
    .stat-value{font-size:13px;font-weight:600;color:#60a5fa}
    .nav-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;cursor:pointer;transition:background 0.15s;margin-bottom:4px;font-size:14px;color:#94a3b8}
    .nav-item:hover,.nav-item.active{background:#1e1e3a;color:#e2e8f0}
    .nav-item .dot{width:8px;height:8px;border-radius:50%;background:#22c55e}
    .tag{display:inline-block;font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px;margin-right:6px}
    .tag-get{background:#1a3a2a;color:#4ade80}
    .tag-post{background:#1a2a3a;color:#60a5fa}
    .tag-put{background:#2a1a2a;color:#c084fc}
    .tag-delete{background:#3a1a1a;color:#f87171}
    .tag-patch{background:#2a2a1a;color:#fbbf24}
    .log-item{background:#1a1a2e;border:1px solid #2d3748;border-radius:8px;padding:12px 14px;margin-bottom:8px;display:flex;gap:12px;align-items:center}
    .log-item .method{font-size:11px;font-weight:700;width:50px;text-align:center}
    .log-item .path{font-size:13px;flex:1;font-family:monospace;color:#e2e8f0}
    .log-item .status{font-size:12px;font-weight:600;padding:2px 8px;border-radius:4px}
    .status-2xx{background:#1a3a2a;color:#4ade80}
    .status-3xx{background:#2a2a1a;color:#fbbf24}
    .status-4xx{background:#3a2a1a;color:#fb923c}
    .status-5xx{background:#3a1a1a;color:#f87171}
    .log-item .duration{font-size:12px;color:#64748b;width:60px;text-align:right}
    .panel{display:none}.panel.active{display:block}
    #clear-btn{background:#2d3748;border:none;color:#94a3b8;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;margin-bottom:16px}
    #clear-btn:hover{background:#374151;color:#e2e8f0}
    .plugin-item{background:#1a1a2e;border:1px solid #2d3748;border-radius:8px;padding:12px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}
    .mem-bar{background:#2d3748;border-radius:4px;height:6px;margin-top:6px;overflow:hidden}
    .mem-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#3b82f6,#8b5cf6)}
    .uptime{font-size:36px;font-weight:700;color:#60a5fa;margin-bottom:4px}
    .empty{color:#4a5568;font-size:13px;text-align:center;padding:32px 0}
    .live-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;margin-right:6px;animation:pulse 2s infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
  </style>
</head>
<body>
<header>
  <span style="font-size:28px">⭐</span>
  <h1>StellarJS DevTools</h1>
  <span class="badge">v1.1.0</span>
  <span style="margin-left:auto;font-size:13px;color:#64748b"><span class="live-dot"></span>Live</span>
</header>
<div class="container">
  <div class="sidebar">
    <div class="section">
      <h2>Navigation</h2>
      <div class="nav-item active" onclick="showPanel('overview')"><span class="dot"></span>Overview</div>
      <div class="nav-item" onclick="showPanel('routes')">🔀 Routes</div>
      <div class="nav-item" onclick="showPanel('requests')">📡 Request Log</div>
      <div class="nav-item" onclick="showPanel('plugins')">🧩 Plugins</div>
      <div class="nav-item" onclick="showPanel('system')">💻 System</div>
    </div>
    <div class="section">
      <h2>Quick Stats</h2>
      <div class="card">
        <div class="stat"><span class="stat-label">Environment</span><span class="stat-value" id="env-badge">${
          process.env.NODE_ENV || 'development'
        }</span></div>
        <div class="stat"><span class="stat-label">Uptime</span><span class="stat-value" id="uptime-val">—</span></div>
        <div class="stat"><span class="stat-label">Requests</span><span class="stat-value" id="req-count">0</span></div>
      </div>
    </div>
  </div>
  <div class="main">
    <!-- Overview Panel -->
    <div class="panel active" id="panel-overview">
      <div class="section">
        <h2>Server Overview</h2>
        <div class="card">
          <div class="uptime" id="uptime-main">—</div>
          <div style="color:#64748b;font-size:13px">seconds uptime</div>
        </div>
      </div>
      <div class="section" id="info-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      </div>
    </div>
    <!-- Routes Panel -->
    <div class="panel" id="panel-routes">
      <div class="section">
        <h2>Registered Routes</h2>
        <div id="routes-list">
          ${this.renderRoutes(info)}
        </div>
      </div>
    </div>
    <!-- Requests Panel -->
    <div class="panel" id="panel-requests">
      <div class="section">
        <h2>Request Log</h2>
        <button id="clear-btn" onclick="clearLog()">Clear Log</button>
        <div id="requests-list"></div>
      </div>
    </div>
    <!-- Plugins Panel -->
    <div class="panel" id="panel-plugins">
      <div class="section">
        <h2>Registered Plugins</h2>
        <div id="plugins-list">${this.renderPlugins(info)}</div>
      </div>
    </div>
    <!-- System Panel -->
    <div class="panel" id="panel-system">
      <div class="section">
        <h2>System Info</h2>
        <div id="system-info" class="card"></div>
      </div>
    </div>
  </div>
</div>
<script>
const API = '${this.mountPath}/api';
function showPanel(name){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('panel-'+name).classList.add('active');
  event.currentTarget.classList.add('active');
  if(name==='requests') loadRequests();
  if(name==='system') loadSystem();
  if(name==='overview') loadOverview();
}
function statusClass(s){return s>=500?'status-5xx':s>=400?'status-4xx':s>=300?'status-3xx':'status-2xx'}
function methodTag(m){return \`<span class="tag tag-\${m.toLowerCase()}">\${m}</span>\`}
async function loadRequests(){
  const r=await fetch(API+'/requests').then(r=>r.json());
  document.getElementById('req-count').textContent=r.length;
  const el=document.getElementById('requests-list');
  if(!r.length){el.innerHTML='<p class="empty">No requests yet</p>';return}
  el.innerHTML=r.map(entry=>\`
    <div class="log-item">
      <span class="method">\${methodTag(entry.method)}</span>
      <span class="path">\${entry.path}</span>
      <span class="status \${statusClass(entry.status)}">\${entry.status}</span>
      <span class="duration">\${entry.duration}ms</span>
    </div>
  \`).join('');
}
async function clearLog(){
  await fetch(API+'/requests',{method:'DELETE'});
  loadRequests();
}
async function loadOverview(){
  const info=await fetch(API+'/info').then(r=>r.json());
  document.getElementById('uptime-main').textContent=info.uptime;
  document.getElementById('uptime-val').textContent=info.uptime+'s';
  const grid=document.getElementById('info-grid');
  const mem=info.memoryUsage;
  const heapPct=Math.round(mem.heapUsed/mem.heapTotal*100);
  grid.innerHTML=\`
    <div class="card"><div class="stat"><span class="stat-label">Node.js</span><span class="stat-value">\${info.nodeVersion}</span></div>
    <div class="stat"><span class="stat-label">Heap Used</span><span class="stat-value">\${Math.round(mem.heapUsed/1024/1024)}MB</span></div>
    <div class="mem-bar"><div class="mem-fill" style="width:\${heapPct}%"></div></div></div>
    <div class="card"><div class="stat"><span class="stat-label">RSS</span><span class="stat-value">\${Math.round(mem.rss/1024/1024)}MB</span></div>
    <div class="stat"><span class="stat-label">External</span><span class="stat-value">\${Math.round(mem.external/1024/1024)}MB</span></div></div>
  \`;
}
async function loadSystem(){
  const info=await fetch(API+'/info').then(r=>r.json());
  const el=document.getElementById('system-info');
  el.innerHTML=Object.entries(info).map(([k,v])=>\`<div class="stat"><span class="stat-label">\${k}</span><span class="stat-value">\${typeof v==='object'?JSON.stringify(v):v}</span></div>\`).join('');
}
// Auto-refresh every 5s
setInterval(()=>{
  fetch(API+'/requests').then(r=>r.json()).then(r=>{
    document.getElementById('req-count').textContent=r.length;
  });
  fetch(API+'/info').then(r=>r.json()).then(r=>{
    document.getElementById('uptime-val').textContent=r.uptime+'s';
    if(document.getElementById('uptime-main').textContent!=='—')document.getElementById('uptime-main').textContent=r.uptime;
  });
},5000);
loadOverview();
</script>
</body>
</html>`;
  }

  private renderRoutes(info?: Record<string, unknown>): string {
    const raw = info?.registeredServices;
    const services: string[] = Array.isArray(raw) ? (raw as string[]) : [];
    if (!services.length) {
      return '<p class="empty">No routes registered yet</p>';
    }
    return services
      .map(
        (s) =>
          `<div class="log-item"><span class="path">/api/${s}</span><span class="tag tag-get">Service</span></div>`
      )
      .join('');
  }

  private renderPlugins(info?: Record<string, unknown>): string {
    const raw = info?.plugins;
    const plugins: Array<{ name: string; version?: string }> = Array.isArray(raw)
      ? (raw as Array<{ name: string; version?: string }>)
      : [];
    if (!plugins.length) {
      return '<p class="empty">No plugins registered</p>';
    }
    return plugins
      .map(
        (p) =>
          `<div class="plugin-item"><span>${p.name}</span><span class="tag tag-get">${
            p.version || 'v?'
          }</span></div>`
      )
      .join('');
  }
}

let globalDevTools: DevTools | null = null;

export const initDevTools = (
  app: Express,
  options?: DevToolsOptions,
  info?: Record<string, unknown>
): DevTools => {
  globalDevTools = new DevTools(options);
  globalDevTools.mount(app, info);
  return globalDevTools;
};

export const getDevTools = (): DevTools | null => globalDevTools;
