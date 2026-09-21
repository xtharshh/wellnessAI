// Local API server for LAN device testing: compiles server/ and serves it on
// 0.0.0.0:3000 so physical devices on the same Wi-Fi can reach it.
// Usage: node scripts/serve-api.cjs [--port 3000] [--no-build]
// Env comes from the repo .env file (NEON_DATABASE_URL, OPENAI_API_KEY, ...).
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(__dirname, '.apibuild');
const PORT = Number(process.env.API_PORT || argv('--port') || 3000);

function argv(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function loadEnv() {
  const file = path.join(ROOT, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}

function collectTs(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) collectTs(p, out);
    else if (e.name.endsWith('.ts')) out.push(p);
  }
  return out;
}

function build() {
  if (process.argv.includes('--no-build') && fs.existsSync(BUILD)) {
    console.log('[api] reusing existing build');
    return;
  }
  console.log('[api] compiling routes...');
  const files = collectTs(path.join(ROOT, 'server')).join(' ');
  execSync(
    `npx tsc --ignoreConfig --target es2020 --module commonjs --moduleResolution node --esModuleInterop --skipLibCheck --strict false --ignoreDeprecations 6.0 --outDir "${BUILD}" ${files}`,
    { cwd: ROOT, stdio: 'inherit' }
  );
}

function load(rel) {
  const mod = require(path.join(BUILD, rel));
  return mod.default || mod;
}

// [method, regex, module, paramName?]
const ROUTES = [
  ['GET', /^\/api\/health$/, 'health.js'],
  ['POST', /^\/api\/auth\/signup$/, 'auth/signup.js'],
  ['POST', /^\/api\/auth\/login$/, 'auth/login.js'],
  ['POST', /^\/api\/auth\/logout$/, 'auth/logout.js'],
  ['GET', /^\/api\/auth\/me$/, 'auth/me.js'],
  ['PATCH', /^\/api\/auth\/profile$/, 'auth/profile.js'],
  ['POST', /^\/api\/auth\/password$/, 'auth/password.js'],
  ['POST', /^\/api\/auth\/forgot$/, 'auth/forgot.js'],
  ['POST', /^\/api\/auth\/reset$/, 'auth/reset.js'],
  ['GET', /^\/api\/settings$/, 'settings.js'],
  ['PATCH', /^\/api\/settings$/, 'settings.js'],
  ['GET', /^\/api\/snapshots$/, 'snapshots.js'],
  ['POST', /^\/api\/snapshots$/, 'snapshots.js'],
  ['GET', /^\/api\/summary$/, 'summary.js'],
  ['GET', /^\/api\/insights\/feedback$/, 'insights/feedback.js'],
  ['POST', /^\/api\/insights\/feedback$/, 'insights/feedback.js'],
  ['GET', /^\/api\/recommendations$/, 'recommendations.js'],
  ['POST', /^\/api\/recommendations\/generate$/, 'recommendations/generate.js'],
  ['*', /^\/api\/recommendations\/([^/]+)$/, 'recommendations/[id].js', 'id'],
  ['GET', /^\/api\/journals$/, 'journals.js'],
  ['POST', /^\/api\/journals$/, 'journals.js'],
  ['DELETE', /^\/api\/journals\/([^/]+)$/, 'journals/[id].js', 'id'],
  ['GET', /^\/api\/exercises$/, 'exercises.js'],
  ['POST', /^\/api\/exercises$/, 'exercises.js'],
  ['*', /^\/api\/exercises\/([^/]+)$/, 'exercises/[id].js', 'id'],
  ['GET', /^\/api\/lifestyle$/, 'lifestyle.js'],
  ['POST', /^\/api\/lifestyle$/, 'lifestyle.js'],
  ['GET', /^\/api\/doctors$/, 'doctors.js'],
  ['GET', /^\/api\/appointments$/, 'appointments.js'],
  ['POST', /^\/api\/appointments$/, 'appointments.js'],
  ['PATCH', /^\/api\/appointments\/([^/]+)$/, 'appointments/[id].js', 'id'],
  ['POST', /^\/api\/chat$/, 'chat.js'],
  ['POST', /^\/api\/doctor-chat$/, 'doctor-chat.js'],
  ['POST', /^\/api\/voice\/transcribe$/, 'voice/transcribe.js'],
];

async function main() {
  loadEnv();
  if (!process.env.NEON_DATABASE_URL) {
    console.error('[api] NEON_DATABASE_URL is missing (repo .env). Cannot start.');
    process.exit(1);
  }
  build();

  const cache = {};
  const handlerFor = (method, pathname) => {
    for (const [m, re, mod, param] of ROUTES) {
      if (m !== '*' && m !== method) continue;
      const match = pathname.match(re);
      if (match) return { mod, paramValue: param ? decodeURIComponent(match[1]) : undefined };
    }
    return null;
  };

  const server = http.createServer((req, res) => {
    const started = Date.now();
    const url = new URL(req.url || '/', 'http://localhost');
    const found = handlerFor(req.method || 'GET', url.pathname);
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', async () => {
      const query = Object.fromEntries(url.searchParams.entries());
      const finish = (code) => console.log(`[api] ${req.method} ${url.pathname} -> ${code} (${Date.now() - started}ms)`);
      const mockRes = {
        setHeader: (k, v) => res.setHeader(k, v),
        status: (c) => { res.statusCode = c; return mockRes; },
        json: (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); finish(res.statusCode); },
        end: (b) => { res.end(b); finish(res.statusCode); },
      };
      if (!found) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Not found' }));
        finish(404);
        return;
      }
      if (found.paramValue !== undefined) query.id = found.paramValue;
      const mockReq = {
        method: req.method,
        headers: req.headers,
        body: raw,
        query,
        socket: { remoteAddress: req.socket.remoteAddress },
      };
      try {
        if (!cache[found.mod]) cache[found.mod] = load(found.mod);
        await cache[found.mod](mockReq, mockRes);
      } catch (e) {
        console.error('[api] handler crashed:', e);
        if (!res.writableEnded) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Internal server error' }));
        }
        finish(500);
      }
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[api] listening on http://0.0.0.0:${PORT} (LAN: http://192.168.1.4:${PORT})`);
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
