/**
 * ====================================================================
 *            MAVIS PANEL — CLOUDFLARE WORKER RUNTIME
 * ====================================================================
 * High-performance Serverless VLESS over WebSocket Proxy & Web Panel
 * Developed by Arash Seyfi
 * Built with Cloudflare Workers TCP Sockets (cloudflare:sockets)
 * ====================================================================
 */

import { connect } from 'cloudflare:sockets';
import { EMBEDDED_ASSETS } from './assets.js';

const DEFAULT_UUID = 'd342d11e-d424-4583-b36e-524ab1f0afa4';
const DEFAULT_CLEAN_IPS = [
  '104.16.0.0',
  '162.159.0.0',
  'icook.hk',
  'speed.cloudflare.com',
  'visa.com',
  'www.csgo.com.cn'
];

const WORKER_START_TIME = Date.now();

function uuidToBytes(uuidStr) {
  const clean = (uuidStr || '').replace(/-/g, '').toLowerCase();
  if (clean.length !== 32) return null;
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function compareBytes(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function yamlSafeQuote(str) {
  return `"${String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function buildNodes(host, uuid, prefix, cleanIps, wsPath) {
  const nodes = [];

  // 1. TLS Direct (Port 443)
  const tlsDirectName = `${prefix}TLS Direct`;
  const tlsDirectUri = `vless://${uuid}@${host}:443?encryption=none&security=tls&sni=${host}&type=ws&host=${host}&path=${encodeURIComponent(wsPath)}#${encodeURIComponent(tlsDirectName)}`;
  nodes.push({
    name: tlsDirectName,
    type: 'VLESS-WS-TLS',
    compat: true,
    server: host,
    port: 443,
    tls: true,
    sni: host,
    uri: tlsDirectUri,
    note: 'Cloudflare Edge CDN (TLS 443 Direct)'
  });

  // 2. HTTP (Port 80)
  const httpName = `${prefix}HTTP 80`;
  const httpUri = `vless://${uuid}@${host}:80?encryption=none&security=none&type=ws&host=${host}&path=${encodeURIComponent(wsPath)}#${encodeURIComponent(httpName)}`;
  nodes.push({
    name: httpName,
    type: 'VLESS-WS',
    compat: true,
    server: host,
    port: 80,
    tls: false,
    sni: '',
    uri: httpUri,
    note: 'Cloudflare Edge CDN (Non-TLS Port 80)'
  });

  // 3. Clean IPs (TLS with Clean IPs and Worker SNI)
  for (const ip of cleanIps) {
    const cleanName = `${prefix}Clean (${ip})`;
    const cleanUri = `vless://${uuid}@${ip}:443?encryption=none&security=tls&sni=${host}&type=ws&host=${host}&path=${encodeURIComponent(wsPath)}#${encodeURIComponent(cleanName)}`;
    nodes.push({
      name: cleanName,
      type: 'VLESS-WS-TLS',
      compat: true,
      server: ip,
      port: 443,
      tls: true,
      sni: host,
      uri: cleanUri,
      note: `Clean IP: ${ip} via ${host}`
    });
  }

  return nodes;
}

function buildClashYaml(nodes) {
  const proxyLines = [];
  const proxyNames = [];

  for (const n of nodes) {
    proxyNames.push(n.name);
    proxyLines.push(`  - name: ${yamlSafeQuote(n.name)}`);
    proxyLines.push(`    type: vless`);
    proxyLines.push(`    server: ${yamlSafeQuote(n.server)}`);
    proxyLines.push(`    port: ${n.port}`);
    proxyLines.push(`    uuid: ${yamlSafeQuote(n.uri.split('//')[1].split('@')[0])}`);
    proxyLines.push(`    network: ws`);
    proxyLines.push(`    tls: ${n.tls}`);
    proxyLines.push(`    udp: true`);
    if (n.tls && n.sni) {
      proxyLines.push(`    servername: ${yamlSafeQuote(n.sni)}`);
    }
    proxyLines.push(`    ws-opts:`);
    proxyLines.push(`      path: ${yamlSafeQuote('/mavis-ws')}`);
    proxyLines.push(`      headers:`);
    proxyLines.push(`        Host: ${yamlSafeQuote(n.sni || n.server)}`);
  }

  const proxiesBlock = proxyLines.join('\n');
  const proxyListStr = proxyNames.map(name => `      - ${yamlSafeQuote(name)}`).join('\n');

  return `# Mavis Panel - Clash Meta (Mihomo) Subscription
port: 7890
socks-port: 7891
allow-lan: true
mode: rule
log-level: info

proxies:
${proxiesBlock}

proxy-groups:
  - name: "🦇 Mavis Panel"
    type: select
    proxies:
      - "⚡ Auto Select"
${proxyListStr}

  - name: "⚡ Auto Select"
    type: url-test
    url: http://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    proxies:
${proxyListStr}

rules:
  - MATCH,"🦇 Mavis Panel"
`;
}

function buildSingBoxJson(nodes) {
  const outbounds = [];
  const proxyTags = [];

  for (const n of nodes) {
    proxyTags.push(n.name);
    const ob = {
      type: 'vless',
      tag: n.name,
      server: n.server,
      server_port: n.port,
      uuid: n.uri.split('//')[1].split('@')[0],
      transport: {
        type: 'ws',
        path: '/mavis-ws',
        headers: {
          Host: n.sni || n.server
        }
      }
    };
    if (n.tls) {
      ob.tls = {
        enabled: true,
        server_name: n.sni
      };
    }
    outbounds.push(ob);
  }

  const clientConfig = {
    outbounds: [
      {
        type: 'selector',
        tag: 'select',
        outbounds: ['auto', ...proxyTags]
      },
      {
        type: 'urltest',
        tag: 'auto',
        outbounds: proxyTags,
        url: 'http://www.gstatic.com/generate_204',
        interval: '3m'
      },
      ...outbounds
    ]
  };

  return JSON.stringify(clientConfig, null, 2);
}

// --- VLESS WebSocket Connection Handler ---
async function handleVlessWebSocket(request, env) {
  const webSocketPair = new WebSocketPair();
  const [clientWs, serverWs] = Object.values(webSocketPair);
  serverWs.accept();

  const targetUuidBytes = uuidToBytes(env.UUID || DEFAULT_UUID);
  const proxyIp = (env.PROXY_IP || '').trim();

  let remoteSocket = null;
  let socketWriter = null;
  let isHandshakeDone = false;

  serverWs.addEventListener('message', async (event) => {
    try {
      const data = event.data;
      const buffer = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer);

      if (!isHandshakeDone) {
        if (buffer.length < 22) {
          serverWs.close(1002, 'Protocol error: header too short');
          return;
        }

        const clientUuidBytes = buffer.subarray(1, 17);
        if (!compareBytes(clientUuidBytes, targetUuidBytes)) {
          serverWs.close(1008, 'Unauthorized UUID');
          return;
        }

        const addonsLen = buffer[17];
        const cmdOffset = 18 + addonsLen;
        if (buffer.length < cmdOffset + 4) {
          serverWs.close(1002, 'Protocol error: invalid addons/command');
          return;
        }

        const command = buffer[cmdOffset];
        // 1 = TCP, 2 = UDP
        if (command !== 1) {
          serverWs.close(1003, 'Unsupported command (TCP only)');
          return;
        }

        const port = (buffer[cmdOffset + 1] << 8) | buffer[cmdOffset + 2];
        const addrType = buffer[cmdOffset + 3];
        let address = '';
        let payloadOffset = 0;

        if (addrType === 1) {
          if (buffer.length < cmdOffset + 8) {
            serverWs.close(1002, 'Invalid IPv4 header');
            return;
          }
          address = buffer.subarray(cmdOffset + 4, cmdOffset + 8).join('.');
          payloadOffset = cmdOffset + 8;
        } else if (addrType === 2) {
          const domainLen = buffer[cmdOffset + 4];
          if (buffer.length < cmdOffset + 5 + domainLen) {
            serverWs.close(1002, 'Invalid domain header');
            return;
          }
          address = new TextDecoder().decode(buffer.subarray(cmdOffset + 5, cmdOffset + 5 + domainLen));
          payloadOffset = cmdOffset + 5 + domainLen;
        } else if (addrType === 3) {
          if (buffer.length < cmdOffset + 20) {
            serverWs.close(1002, 'Invalid IPv6 header');
            return;
          }
          const ipv6 = [];
          for (let i = 0; i < 8; i++) {
            const idx = cmdOffset + 4 + i * 2;
            ipv6.push(((buffer[idx] << 8) | buffer[idx + 1]).toString(16));
          }
          address = ipv6.join(':');
          payloadOffset = cmdOffset + 20;
        } else {
          serverWs.close(1002, 'Unknown address type');
          return;
        }

        const targetHost = proxyIp || address;
        const targetPort = proxyIp ? 443 : port;

        try {
          remoteSocket = connect({
            hostname: targetHost,
            port: targetPort
          });
        } catch (err) {
          serverWs.close(1011, 'Cannot connect: ' + err.message);
          return;
        }

        socketWriter = remoteSocket.writable.getWriter();
        isHandshakeDone = true;

        const initialPayload = buffer.subarray(payloadOffset);
        if (initialPayload.length > 0) {
          await socketWriter.write(initialPayload);
        }

        pipeRemoteToWs(remoteSocket, serverWs);
      } else {
        if (socketWriter) {
          await socketWriter.write(buffer);
        }
      }
    } catch (err) {
      if (remoteSocket) try { remoteSocket.close(); } catch {}
      try { serverWs.close(); } catch {}
    }
  });

  serverWs.addEventListener('close', () => {
    if (socketWriter) try { socketWriter.releaseLock(); } catch {}
    if (remoteSocket) try { remoteSocket.close(); } catch {}
  });

  serverWs.addEventListener('error', () => {
    if (socketWriter) try { socketWriter.releaseLock(); } catch {}
    if (remoteSocket) try { remoteSocket.close(); } catch {}
  });

  return new Response(null, {
    status: 101,
    webSocket: clientWs
  });
}

async function pipeRemoteToWs(socket, ws) {
  let isFirst = true;
  const reader = socket.readable.getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value && value.length > 0) {
        if (isFirst) {
          isFirst = false;
          const resp = new Uint8Array(2 + value.length);
          resp[0] = 0; // version
          resp[1] = 0; // addons len
          resp.set(value, 2);
          ws.send(resp);
        } else {
          ws.send(value);
        }
      }
    }
  } catch (err) {
    // Socket ended
  } finally {
    try { reader.releaseLock(); } catch {}
    try { socket.close(); } catch {}
    try { ws.close(); } catch {}
  }
}

// --- Main Worker Fetch Handler ---
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;
      const host = url.host;

      // WebSocket Upgrade -> VLESS Proxy
      if (request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
        return handleVlessWebSocket(request, env);
      }

      const panelPath = (env.PANEL_PATH || 'mavis').replace(/^\//, '').replace(/\/+$/, '') || 'mavis';
      const uuid = (env.UUID || DEFAULT_UUID).trim();
      const prefix = env.NODE_PREFIX || 'mavis-worker - ';
      const cleanIps = env.CLEAN_IPS
        ? env.CLEAN_IPS.split(',').map(s => s.trim()).filter(Boolean)
        : DEFAULT_CLEAN_IPS;

      // Auth check for panel
      const checkAuth = () => {
        if (!env.PANEL_TOKEN) return true;
        const authHeader = request.headers.get('Authorization') || '';
        const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
        const queryToken = url.searchParams.get('token');
        return queryToken === env.PANEL_TOKEN || bearer === env.PANEL_TOKEN;
      };

      // Asset endpoints
      if (
        pathname === '/mavis-assets/app.css' ||
        pathname === '/assets/app.css' ||
        pathname === `/${panelPath}/assets/app.css` ||
        pathname === `/${panelPath}/app.css` ||
        pathname === '/app.css'
      ) {
        return new Response(EMBEDDED_ASSETS.appCss, {
          headers: {
            'Content-Type': 'text/css; charset=utf-8',
            'Cache-Control': 'public, max-age=86400'
          }
        });
      }

      if (
        pathname === '/mavis-assets/app.js' ||
        pathname === '/assets/app.js' ||
        pathname === `/${panelPath}/assets/app.js` ||
        pathname === `/${panelPath}/app.js` ||
        pathname === '/app.js'
      ) {
        return new Response(EMBEDDED_ASSETS.appJs, {
          headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Cache-Control': 'public, max-age=86400'
          }
        });
      }

      if (
        pathname === '/mavis-assets/logo.svg' ||
        pathname === '/assets/logo.svg' ||
        pathname === '/logo.svg' ||
        pathname === `/${panelPath}/assets/logo.svg` ||
        pathname === `/${panelPath}/logo.svg`
      ) {
        return new Response(EMBEDDED_ASSETS.logoSvg, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=86400'
          }
        });
      }

      // Health endpoint (for app.js and status checks)
      if (pathname === '/health' || pathname === `/${panelPath}/health`) {
        const nodes = buildNodes(host, uuid, prefix, cleanIps, '/mavis-ws');
        const healthData = {
          ok: true,
          brand: 'Mavis Panel',
          product: 'Cloudflare Worker Edge',
          uptime: Math.floor((Date.now() - WORKER_START_TIME) / 1000),
          publicPort: 443,
          host: host,
          domain: host,
          forceHost: host,
          publicBaseUrl: `https://${host}`,
          subBase: `https://${host}`,
          forceHttps: true,
          location: `Cloudflare Edge (${request.cf?.colo || request.cf?.country || 'Global'})`,
          engines: {
            worker: true,
            vless_ws: true
          },
          nodes: nodes.map(n => ({
            name: n.name,
            type: n.type,
            compat: n.compat,
            uri: n.uri,
            note: n.note
          }))
        };
        return new Response(JSON.stringify(healthData, null, 2), {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // Subscription: Universal Base64 and Raw
      if (
        pathname === `/${panelPath}/base64` ||
        pathname === `/${panelPath}/raw` ||
        pathname === `/${panelPath}/sub` ||
        pathname === '/sub' ||
        pathname === '/base64'
      ) {
        if (!checkAuth()) {
          return new Response('Unauthorized', { status: 401 });
        }

        const isBase64 = pathname.endsWith('/base64') || pathname.endsWith('/sub') || pathname === '/sub';
        const nodes = buildNodes(host, uuid, prefix, cleanIps, '/mavis-ws');
        const text = nodes.map(n => n.uri).join('\n');

        const body = isBase64 ? btoa(text) : text;
        return new Response(body, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'text/plain; charset=utf-8',
            'Content-Disposition': 'attachment; filename="mavis-worker.txt"',
            'Profile-Update-Interval': '24',
            'Subscription-Userinfo': 'upload=0; download=0; total=0; expire=0'
          }
        });
      }

      // Subscription: Clash Meta (Mihomo)
      if (
        pathname === `/${panelPath}/clash` ||
        pathname === `/${panelPath}/clash.yaml` ||
        pathname === '/clash'
      ) {
        if (!checkAuth()) {
          return new Response('Unauthorized', { status: 401 });
        }

        const nodes = buildNodes(host, uuid, prefix, cleanIps, '/mavis-ws');
        const yaml = buildClashYaml(nodes);
        return new Response(yaml, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'text/yaml; charset=utf-8',
            'Content-Disposition': 'inline; filename="mavis-clash.yaml"',
            'Profile-Update-Interval': '24'
          }
        });
      }

      // Subscription: Sing-box client JSON
      if (
        pathname === `/${panelPath}/sb` ||
        pathname === `/${panelPath}/sb/raw` ||
        pathname === '/sb'
      ) {
        if (!checkAuth()) {
          return new Response('Unauthorized', { status: 401 });
        }

        const nodes = buildNodes(host, uuid, prefix, cleanIps, '/mavis-ws');
        const jsonStr = buildSingBoxJson(nodes);
        return new Response(jsonStr, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json; charset=utf-8',
            'Profile-Update-Interval': '24'
          }
        });
      }

      // Web Panel HTML
      if (pathname === '/' || pathname === `/${panelPath}` || pathname === `/${panelPath}/`) {
        if (!checkAuth()) {
          return new Response('Unauthorized: Invalid or missing token.', { status: 401 });
        }
        return new Response(EMBEDDED_ASSETS.indexHtml, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8'
          }
        });
      }

      return new Response('Not Found', { status: 404 });
    } catch (err) {
      return new Response('Worker Error: ' + (err.stack || err.message), {
        status: 500,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  }
};
