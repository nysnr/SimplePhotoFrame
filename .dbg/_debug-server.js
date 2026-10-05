const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { URL } = require('url');

const args = process.argv.slice(2).reduce((acc, v, i, arr) => {
  if (v && v.startsWith('--')) {
    const k = v.slice(2);
    const next = arr[i + 1] && !String(arr[i + 1]).startsWith('--') ? arr[i + 1] : true;
    acc[k] = next === true ? true : next;
    if (next !== true) arr[i + 1] = null;
  }
  return acc;
}, {});

const SESSION_ID = args.session || 'default';
const OUTDIR = args.outdir || '.dbg';
const BASE_PORT = parseInt(args.port || '7777', 10);
const MAX_RETRIES = 10;
const IDLE = parseInt(args.idle || '0', 10) * 1000;
const CLEAN = !!args.clean;
const REMOTE = !!args.remote;

if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });
const absOutdir = path.resolve(OUTDIR);
const logFile = path.join(absOutdir, `trae-debug-log-${SESSION_ID}.ndjson`);
const envFile = path.join(absOutdir, `${SESSION_ID}.env`);

if (CLEAN) { try { fs.truncateSync(logFile, 0); } catch (_) {} }

const appendLine = (line) => {
  fs.appendFileSync(logFile, line + '\n', { flag: 'a' });
};

const getLocalIPs = () => {
  const nics = os.networkInterfaces();
  const out = [];
  for (const name of Object.keys(nics)) {
    for (const nic of nics[name]) {
      if (nic.family === 'IPv4' && !nic.internal) out.push(nic.address);
    }
  }
  return out;
};

let idleTimer = null;
const refreshIdle = () => {
  if (!IDLE) return;
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => process.exit(0), IDLE);
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const handleRequest = (req, res) => {
  refreshIdle();
  const url = new URL(req.url, 'http://localhost/');
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    return res.end();
  }
  if (req.method === 'POST' && url.pathname === '/event') {
    let body = '';
    req.on('data', (c) => (body += c.toString()));
    req.on('end', () => {
      try {
        const e = JSON.parse(body);
        if (!e.ts) e.ts = Date.now();
        if (!e.sessionId) e.sessionId = SESSION_ID;
        appendLine(JSON.stringify(e));
        res.writeHead(200, { ...CORS, 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(400, { ...CORS, 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: String(err && err.message || err) }));
      }
    });
    return;
  }
  if (req.method === 'GET' && url.pathname === '/health') {
    let count = 0;
    try {
      count = fs.readFileSync(logFile, 'utf-8').split(/\r?\n/).filter(l => l.trim()).length;
    } catch (_) {}
    res.writeHead(200, { ...CORS, 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, uptime: process.uptime(), logCount: count, sessionId: SESSION_ID }));
  }
  if (req.method === 'GET' && url.pathname === '/logs') {
    let data = '[]';
    try {
      const last = parseInt(url.searchParams.get('last') || '0', 10);
      const lines = fs.readFileSync(logFile, 'utf-8').split(/\r?\n/).filter(l => l.trim());
      const slice = last > 0 ? lines.slice(-last) : lines;
      data = '[' + slice.join(',') + ']';
    } catch (_) {}
    res.writeHead(200, { ...CORS, 'Content-Type': 'application/json' });
    return res.end(data);
  }
  if (req.method === 'DELETE' && url.pathname === '/logs') {
    try { fs.truncateSync(logFile, 0); } catch (_) {}
    res.writeHead(200, { ...CORS, 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, cleared: true }));
  }
  res.writeHead(404, { ...CORS, 'Content-Type': 'text/plain' });
  res.end('not found');
};

const tryListen = (port, retriesLeft) => new Promise((resolve, reject) => {
  const server = http.createServer(handleRequest);
  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE' && retriesLeft > 0) {
      server.close();
      return resolve(tryListen(port + 1, retriesLeft - 1));
    }
    reject(err);
  });
  server.listen(port, REMOTE ? '0.0.0.0' : '127.0.0.1', () => {
    resolve({ server, port });
  });
});

(async () => {
  const { server, port } = await tryListen(BASE_PORT, MAX_RETRIES);
  const host = REMOTE ? (getLocalIPs()[0] || '0.0.0.0') : '127.0.0.1';
  const api_url = `http://${host}:${port}/event`;
  fs.writeFileSync(envFile, `DEBUG_SERVER_URL=${api_url}\nDEBUG_SESSION_ID=${SESSION_ID}\n`, 'utf-8');
  process.stdout.write(`@@DEBUG_SERVER_INFO\n${JSON.stringify({ api_url, session_id: SESSION_ID, log_dir: absOutdir, log_file: path.resolve(logFile), env_file: path.resolve(envFile) }, null, 2)}\n@@END_DEBUG_SERVER_INFO\n`);
  process.stdout.write(`Listening on ${host}:${port}\n`);
  refreshIdle();
  process.on('SIGINT', () => { try { server.close(); } catch (_) {} process.exit(0); });
})().catch((e) => { console.error(e); process.exit(1); });
