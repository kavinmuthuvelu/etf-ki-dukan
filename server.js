/**
 * ETF Ki Dukan — Server v3.0
 * ===========================
 * Runs both locally (node server.js) and on Render.com.
 *
 * LOCAL:   http://localhost:3001
 * RENDER:  https://your-app.onrender.com
 *
 * Routes:
 *   GET  /              → serves etf_ki_dukan.html
 *   GET  /health        → health check JSON
 *   GET  /scrip-master  → Dhan scrip master CSV (cached 24h)
 *   *    /dhan/*        → proxy to api.dhan.co or sandbox.dhan.co
 */

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ── Config ──────────────────────────────────────────────────────────────────
const PORT      = process.env.PORT || 3001;
const IS_RENDER = !!process.env.RENDER;           // Render sets this automatically
const HOST      = IS_RENDER ? '0.0.0.0' : '127.0.0.1';
const HTML_FILE = path.join(__dirname, 'etf_ki_dukan.html');

// On Render the filesystem is ephemeral — use /tmp for cache
// Locally use the project directory so cache survives restarts
const CACHE_DIR  = IS_RENDER ? '/tmp' : __dirname;
const CACHE_FILE = path.join(CACHE_DIR, 'scrip-master-cache.csv');
const CACHE_TTL  = 24 * 60 * 60 * 1000; // 24 hours

// ── Logger ──────────────────────────────────────────────────────────────────
function log(msg) {
  process.stdout.write(`[${new Date().toISOString()}] ${msg}\n`);
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function json(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

// ── Server ───────────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {

  // CORS pre-flight
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers',
    'Content-Type, Accept, access-token, client-id, dhanClientId, X-Dhan-Host');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── Serve app HTML ─────────────────────────────────────────────────────────
  if (req.url === '/' || req.url === '/index.html') {
    if (!fs.existsSync(HTML_FILE)) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`<h2>etf_ki_dukan.html not found</h2>
               <p>Expected at: <code>${HTML_FILE}</code></p>
               <p>Make sure both files are in the same directory.</p>`);
      return;
    }
    res.writeHead(200, {
      'Content-Type':  'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    fs.createReadStream(HTML_FILE).pipe(res);
    return;
  }

  // ── Health check ───────────────────────────────────────────────────────────
  if (req.url === '/health') {
    json(res, 200, {
      status:    'ok',
      proxy:     'Dhan API Proxy',
      version:   '3.0',
      env:       IS_RENDER ? 'render' : 'local',
      pid:       process.pid,
      uptime:    Math.floor(process.uptime()),
    });
    return;
  }

  // ── Scrip master CSV ───────────────────────────────────────────────────────
  if (req.url === '/scrip-master') {

    // Serve fresh cache if available
    try {
      const stat = fs.statSync(CACHE_FILE);
      if (Date.now() - stat.mtimeMs < CACHE_TTL) {
        log('scrip-master: serving from cache');
        res.writeHead(200, {
          'Content-Type':                'text/csv',
          'Access-Control-Allow-Origin': '*',
          'X-Cache':                     'HIT',
        });
        fs.createReadStream(CACHE_FILE).pipe(res);
        return;
      }
    } catch(e) { /* cache miss or stat error — fetch fresh */ }

    log('scrip-master: fetching from images.dhan.co...');
    const csvReq = https.request({
      hostname: 'images.dhan.co',
      port:     443,
      path:     '/api-data/api-scrip-master.csv',
      method:   'GET',
      headers:  { 'Accept': 'text/csv,*/*', 'User-Agent': 'ETFKiDukan/3.0' },
      timeout:  60000,
    }, (csvRes) => {
      const chunks = [];
      csvRes.on('data', c => chunks.push(c));
      csvRes.on('end', () => {
        const body = Buffer.concat(chunks);
        log(`scrip-master: fetched ${(body.length / 1024 / 1024).toFixed(1)} MB, HTTP ${csvRes.statusCode}`);
        // Write cache
        try { fs.writeFileSync(CACHE_FILE, body); log('scrip-master: cache written'); }
        catch(e) { log('scrip-master: cache write failed — ' + e.message); }
        res.writeHead(csvRes.statusCode, {
          'Content-Type':                'text/csv',
          'Access-Control-Allow-Origin': '*',
          'X-Cache':                     'MISS',
        });
        res.end(body);
      });
      csvRes.on('error', err => {
        log('scrip-master stream error: ' + err.message);
        if (!res.headersSent) json(res, 502, { error: err.message });
      });
    });

    csvReq.on('error', err => {
      log('scrip-master fetch error: ' + err.message);
      // Serve stale cache if available
      try {
        const stale = fs.readFileSync(CACHE_FILE);
        log('scrip-master: serving stale cache after error');
        res.writeHead(200, {
          'Content-Type':                'text/csv',
          'Access-Control-Allow-Origin': '*',
          'X-Cache':                     'STALE',
        });
        res.end(stale);
      } catch(e2) {
        if (!res.headersSent) json(res, 503, { error: 'Unavailable', detail: err.message });
      }
    });

    csvReq.on('timeout', () => {
      log('scrip-master: request timed out');
      csvReq.destroy();
      if (!res.headersSent) json(res, 504, { error: 'Timeout fetching scrip master' });
    });

    csvReq.end();
    return;
  }

  // ── Proxy → Dhan API ───────────────────────────────────────────────────────
  if (req.url.startsWith('/dhan/') || req.url.startsWith('/dhan?')) {
    const apiPath    = req.url.replace(/^\/dhan/, '');
    const targetHost = req.headers['x-dhan-host'] || 'api.dhan.co';

    const fwdHeaders = {
      'Content-Type': 'application/json',
      'Accept':       'application/json',
    };
    if (req.headers['access-token'])  fwdHeaders['access-token']  = req.headers['access-token'];
    if (req.headers['client-id'])     fwdHeaders['client-id']     = req.headers['client-id'];
    if (req.headers['dhanclientid'])  fwdHeaders['dhanClientId']  = req.headers['dhanclientid'];

    let reqBody = '';
    req.on('data', chunk => reqBody += chunk);
    req.on('end', () => {
      log(`→ ${req.method} ${targetHost}${apiPath}`);

      const proxyReq = https.request({
        hostname: targetHost,
        port:     443,
        path:     apiPath,
        method:   req.method,
        headers:  fwdHeaders,
        timeout:  20000,
      }, (proxyRes) => {
        const chunks = [];
        proxyRes.on('data',  c => chunks.push(c));
        proxyRes.on('end', () => {
          const body = Buffer.concat(chunks);
          log(`  ← ${proxyRes.statusCode} (${body.length}b)`);
          res.writeHead(proxyRes.statusCode, {
            'Content-Type':                proxyRes.headers['content-type'] || 'application/json',
            'Content-Length':              body.length,
            'Access-Control-Allow-Origin': '*',
          });
          res.end(body);
        });
        proxyRes.on('error', err => {
          log(`  ← stream error: ${err.message}`);
          if (!res.headersSent) json(res, 502, { error: 'Stream error', message: err.message });
        });
      });

      proxyReq.on('timeout', () => {
        log(`  TIMEOUT ${apiPath}`);
        proxyReq.destroy();
        if (!res.headersSent) json(res, 504, { error: 'Gateway Timeout' });
      });

      proxyReq.on('error', err => {
        log(`  CONNECT ERROR ${targetHost}: ${err.message}`);
        if (!res.headersSent) json(res, 502, { error: 'Cannot reach ' + targetHost, message: err.message });
      });

      if (reqBody && (req.method === 'POST' || req.method === 'PUT')) proxyReq.write(reqBody);
      proxyReq.end();
    });

    req.on('error', err => log(`req read error: ${err.message}`));
    return;
  }

  // ── 404 ────────────────────────────────────────────────────────────────────
  json(res, 404, { error: 'Not found', url: req.url });
});

server.listen(PORT, HOST, () => {
  log(`ETF Ki Dukan server v3.0 started`);
  log(`Environment : ${IS_RENDER ? 'Render.com' : 'Local'}`);
  log(`Listening   : http://${HOST}:${PORT}`);
  log(`HTML file   : ${HTML_FILE}`);
  log(`Cache dir   : ${CACHE_DIR}`);
  if (!IS_RENDER) {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║   ETF Ki Dukan — Server v3.0             ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║   Open:  http://localhost:${PORT}             ║`);
    console.log('║   Stop:  Ctrl+C                          ║');
    console.log('╚══════════════════════════════════════════╝\n');
    // Auto-open browser locally
    if (process.stdout.isTTY) {
      const url = `http://localhost:${PORT}`;
      const cmd = process.platform === 'win32' ? `start ${url}`
                : process.platform === 'darwin' ? `open ${url}`
                : `xdg-open ${url}`;
      require('child_process').exec(cmd);
    }
  }
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') log(`Port ${PORT} already in use — is another instance running?`);
  else log(`Server error: ${err.message}`);
  process.exit(1);
});

process.on('SIGTERM', () => { log('SIGTERM — shutting down'); server.close(() => process.exit(0)); });
process.on('SIGINT',  () => { log('SIGINT — shutting down');  server.close(() => process.exit(0)); });
