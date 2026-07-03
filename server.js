import Fastify from 'fastify';
import http from 'node:http';
import https from 'node:https';

const fastify = Fastify({ logger: false });

// --- Service definitions ---
const SERVICES = [
  {
    id: 'proxmox',
    name: 'Proxmox',
    description: 'Hypervisor & container management',
    url: 'https://192.168.4.231:8006',
    category: 'infrastructure',
    icon: '🖥️',
  },
  {
    id: 'homeassistant',
    name: 'Home Assistant',
    description: 'Smart home automation',
    url: 'http://192.168.4.243:8123',
    category: 'infrastructure',
    icon: '🏠',
  },
  {
    id: 'adguard',
    name: 'AdGuard Home',
    description: 'DNS ad blocker',
    url: 'http://192.168.4.235:3000',
    category: 'infrastructure',
    icon: '🛡️',
  },
  {
    id: 'ntfy',
    name: 'ntfy',
    description: 'Push notifications',
    url: 'http://192.168.4.241:2586',
    category: 'infrastructure',
    icon: '🔔',
  },
  {
    id: 'copyparty',
    name: 'Files (copyparty)',
    description: 'Vault file browser',
    url: 'http://192.168.4.232:3923',
    category: 'apps',
    icon: '📁',
  },
  {
    id: 'transmission',
    name: 'Transmission',
    description: 'Torrent client',
    url: 'http://192.168.4.250:9091',
    category: 'apps',
    icon: '⬇️',
  },
  {
    id: 'balooooba',
    name: 'files.balooooba.ca',
    description: 'Public file share',
    url: 'https://files.balooooba.ca',
    category: 'apps',
    icon: '🌐',
  },
  {
    id: 'pi-agent',
    name: 'Pi Agent',
    description: 'Coding assistant web UI',
    url: 'http://100.76.192.124:8504',
    category: 'apps',
    icon: '🤖',
  },
];

// --- Health check helper ---
function checkHealth(url, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: timeoutMs, rejectUnauthorized: false }, (res) => {
      res.resume(); // drain body
      resolve({ ok: true, ms: Date.now() - start });
    });
    req.on('error', () => resolve({ ok: false, ms: Date.now() - start }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, ms: Date.now() - start }); });
  });
}

// --- Health endpoint (AJAX) ---
fastify.get('/api/health', async (_req, reply) => {
  const results = await Promise.all(
    SERVICES.map(async (s) => {
      const { ok, ms } = await checkHealth(s.url);
      return { id: s.id, ok, ms };
    })
  );
  reply.send(results);
});

// --- Main page ---
fastify.get('/', async (_req, reply) => {
  // Initial render — all unknown until JS fetches /api/health
  const categories = {
    infrastructure: SERVICES.filter((s) => s.category === 'infrastructure'),
    apps: SERVICES.filter((s) => s.category === 'apps'),
  };

  const cardsHtml = Object.entries(categories)
    .map(
      ([cat, svcs]) => `
      <section class="category">
        <h2 class="category-label">${cat === 'infrastructure' ? 'Infrastructure' : 'Apps'}</h2>
        <div class="card-grid">
          ${svcs
            .map(
              (s) => `
            <a href="${s.url}" target="_blank" rel="noopener" class="card" id="card-${s.id}">
              <span class="card-icon">${s.icon}</span>
              <div class="card-body">
                <h3 class="card-name">${s.name}</h3>
                <p class="card-desc">${s.description}</p>
              </div>
              <span class="health-dot" id="dot-${s.id}" title="checking…">○</span>
            </a>`
            )
            .join('')}
        </div>
      </section>`
    )
    .join('');

  reply.type('text/html').send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Homelab</title>
<style>
  :root {
    --bg: #0f1117;
    --surface: #1a1d27;
    --surface-hover: #222633;
    --border: #2a2e3d;
    --text: #e4e6ed;
    --text-dim: #8b8fa3;
    --accent: #6c9cfc;
    --green: #4ade80;
    --red: #f87171;
    --radius: 10px;
    --font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: var(--font);
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    padding: 2rem;
  }

  .container {
    max-width: 900px;
    margin: 0 auto;
  }

  header {
    margin-bottom: 2.5rem;
  }

  header h1 {
    font-size: 1.6rem;
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  header .meta {
    color: var(--text-dim);
    font-size: 0.82rem;
    margin-top: 0.35rem;
  }

  .category { margin-bottom: 2rem; }

  .category-label {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-dim);
    margin-bottom: 0.75rem;
    padding-left: 2px;
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 0.6rem;
  }

  .card {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.85rem 1rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    text-decoration: none;
    color: inherit;
    transition: background 0.15s, border-color 0.15s, transform 0.1s;
  }

  .card:hover {
    background: var(--surface-hover);
    border-color: var(--accent);
    transform: translateY(-1px);
  }

  .card-icon { font-size: 1.3rem; flex-shrink: 0; }

  .card-body { flex: 1; min-width: 0; }

  .card-name {
    font-size: 0.88rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-desc {
    font-size: 0.75rem;
    color: var(--text-dim);
    margin-top: 0.1rem;
  }

  .health-dot {
    font-size: 0.65rem;
    flex-shrink: 0;
    transition: color 0.2s;
    color: var(--text-dim);
  }
  .health-dot.ok  { color: var(--green); }
  .health-dot.err { color: var(--red); }

  /* Stats bar */
  .stats-bar {
    margin-top: 2rem;
    padding: 1rem 1.2rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .stat-label {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-dim);
    font-weight: 600;
  }

  .stat-value {
    font-size: 0.88rem;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  .stat-value .ok { color: var(--green); }
  .stat-value .err { color: var(--red); }
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>Homelab</h1>
    <p class="meta">Tailscale — m720q</p>
  </header>

  ${cardsHtml}

  <div class="stats-bar">
    <div class="stat">
      <span class="stat-label">Services</span>
      <span class="stat-value" id="stat-count">—</span>
    </div>
    <div class="stat">
      <span class="stat-label">Healthy</span>
      <span class="stat-value" id="stat-healthy">—</span>
    </div>
    <div class="stat">
      <span class="stat-label">Last check</span>
      <span class="stat-value" id="stat-time">—</span>
    </div>
    <div class="stat">
      <span class="stat-label">Uptime</span>
      <span class="stat-value" id="stat-uptime">—</span>
    </div>
  </div>
</div>

<script>
  function updateHealth() {
    fetch('/api/health')
      .then(r => r.json())
      .then(results => {
        let healthy = 0;
        results.forEach(r => {
          const dot = document.getElementById('dot-' + r.id);
          if (dot) {
            dot.className = 'health-dot ' + (r.ok ? 'ok' : 'err');
            dot.textContent = r.ok ? '●' : '●';
            dot.title = r.ok ? 'up (' + r.ms + 'ms)' : 'down';
          }
          if (r.ok) healthy++;
        });
        document.getElementById('stat-count').textContent = results.length;
        const hEl = document.getElementById('stat-healthy');
        hEl.innerHTML = '<span class="' + (healthy === results.length ? 'ok' : 'err') + '">' + healthy + '/' + results.length + '</span>';
        document.getElementById('stat-time').textContent = new Date().toLocaleTimeString();
      })
      .catch(() => {});
  }

  function updateUptime() {
    fetch('/api/uptime')
      .then(r => r.json())
      .then(d => {
        const h = Math.floor(d.uptimeSec / 3600);
        const m = Math.floor((d.uptimeSec % 3600) / 60);
        document.getElementById('stat-uptime').textContent = h + 'h ' + m + 'm';
      })
      .catch(() => {});
  }

  updateHealth();
  updateUptime();
  setInterval(updateHealth, 15000);
</script>
</body>
</html>`);
});

// --- Uptime endpoint ---
fastify.get('/api/uptime', async () => {
  const os = await import('node:os');
  return { uptimeSec: os.uptime() };
});

// --- Start ---
const PORT = 8080;
const HOST = '100.76.192.124';

fastify.listen({ port: PORT, host: HOST }, (err) => {
  if (err) { fastify.log.error(err); process.exit(1); }
  console.log(`Homepage running at http://${HOST}:${PORT}`);
});
