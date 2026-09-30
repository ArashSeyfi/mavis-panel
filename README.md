# Mavis Panel

Single-port proxy multiplexer with a web panel. Routes TLS, HTTP, WebSocket, gRPC, and HTTPUpgrade through one port. Runs sing-box and xray under the hood.

## What it does

- Multiplexes all proxy traffic through a single TCP port
- Supports VLESS, Trojan, VMess, Shadowsocks, WireGuard, and Reality
- Generates subscription links for v2rayNG, Hiddify, Clash Meta, Streisand, etc.
- Provides direct connection URIs with copy/QR
- Optional Cloudflare Argo tunnel integration
- Zero logs

## Quick start

```bash
npm install
npm run dev
```

Panel opens at `http://localhost:2705/mavis`

## Production build

The build script compiles all source files and frontend assets into a single standalone `index.js`:

```bash
npm run build
node index.js
```

## Docker

```bash
docker build -t mavis-panel .
docker run -p 443:443 mavis-panel
```

Or with docker-compose:

```bash
docker compose up -d
```

## Environment variables

| Variable | Default | What it does |
|---|---|---|
| `PORT` | `2705` | Ingress port |
| `PANEL_PATH` | `mavis` | Web panel URL path |
| `PANEL_TOKEN` | — | Auth token (optional) |
| `UUID` | auto | Proxy user UUID |
| `FORCE_HOST` | — | Override public hostname |
| `SERVER_NAME` | `mavis-panel` | Name shown in connection links |
| `ENGINE` | `sing-box` | Proxy backend (`sing-box` or `xray`) |
| `ARGO_AUTH` | — | Cloudflare Argo tunnel credentials |
| `ARGO_DOMAIN` | — | Argo tunnel domain |
| `FORCE_HTTPS` | `false` | Force HTTPS in subscription URLs |

## Project structure

```
src/
├── boot.js              # Startup orchestrator
├── config.js            # Config loader & defaults
├── server.js            # Dev entry point
├── state.js             # Runtime state
├── ports.js             # Port allocator
├── cert.js              # Self-signed cert generator
├── tls-sni.js           # TLS ClientHello SNI parser
├── logger.js            # Console logger
├── binaries.js          # Engine binary downloader
├── assets.js            # Frontend asset loader
├── engines/
│   ├── singbox.js       # Sing-box config generator
│   ├── xray.js          # Xray config generator
│   └── argo.js          # Cloudflare Argo controller
├── mux/
│   └── tcp-router.js    # Single-port traffic router
├── panel/
│   ├── http-panel.js    # Express web app & API
│   ├── links.js         # Subscription & link generator
│   └── validator.js     # Config validator
└── public/
    ├── index.html
    ├── app.css
    ├── app.js
    └── logo.svg
```

## License

MIT

---

Made by Arash Seyfi
