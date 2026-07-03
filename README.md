# Homelab Homepage

Tailscale-only dashboard for the m720q homelab. One page with service links, live health checks, and basic stats.

## Quick Start

```bash
npm install
npm start
```

Server runs at `http://100.76.192.124:8080` (Tailscale IP, port 8080).

## What's On It

### Apps
| Service | URL |
|---------|-----|
| Files (copyparty) | `http://192.168.4.232:3923` |
| Transmission | `http://192.168.4.250:9091` |
| files.balooooba.ca | `https://files.balooooba.ca` |
| Pi Agent | `http://100.76.192.124:8504` |

### Infrastructure
| Service | URL |
|---------|-----|
| Proxmox | `https://192.168.4.231:8006` |
| Home Assistant | `http://192.168.4.243:8123` |
| AdGuard Home | `http://192.168.4.235:3000` |
| ntfy | `http://192.168.4.241:2586` |

## Features

- **Health checks** — each service card shows a green/red dot, auto-refreshes every 15 seconds
- **Stats bar** — service count, healthy count, last check time, host uptime
- **Dark theme** — clean card layout, responsive grid, Inter font
- **Zero auth** — Tailscale handles network access; no app-level auth needed

## API

| Endpoint | Description |
|----------|-------------|
| `GET /` | Main page |
| `GET /api/health` | JSON array of `{id, ok, ms}` for each service |
| `GET /api/uptime` | Host uptime in seconds |

## Tech Stack

- **Runtime**: Node.js (ESM)
- **Server**: Fastify 5
- **Frontend**: Vanilla HTML/CSS/JS (no build step, no framework)
- **Health checks**: Node `http`/`https` GET with 3s timeout

## Adding a Service

Edit the `SERVICES` array in `server.js`. Each entry:

```js
{
  id: 'my-service',
  name: 'My Service',
  description: 'What it does',
  url: 'http://...',
  category: 'apps',       // or 'infrastructure'
  icon: '🔧',            // emoji
}
```

## Running as a Service

```bash
# Create a systemd unit
cat > /etc/systemd/system/homelab-homepage.service << 'EOF'
[Unit]
Description=Homelab Homepage
After=network.target

[Service]
Type=simple
WorkingDirectory=/DEV/homepage
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now homelab-homepage
```

## Hosts (m720q Proxmox)

| CT/VM | Name | IP | Purpose |
|-------|------|----|---------|
| CT 100 | nas | .232 | Samba + copyparty |
| CT 101 | torrent | .250 | Transmission |
| CT 200 | pi | DHCP (Tailscale: 100.76.192.124) | pi agent, this server |
| CT 400 | ntfy | .241 | Push notifications |
| CT 500 | adguard | .235 | DNS ad blocker |
| VM 102 | haos | .243 | Home Assistant OS |

## License

MIT
