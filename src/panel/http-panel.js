const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { LinkGenerator } = require('./links');
const { AssetManager } = require('../assets');

function createHttpPanel(config, stateManager, engineStatusGetter, resolvedHostGetter) {
  const app = express();
  const panelPath = config.panelPath.replace(/^\//, '') || 'mavis';

  // Token authentication middleware
  const authMiddleware = (req, res, next) => {
    if (!config.panelToken) return next();

    const authHeader = req.headers.authorization;
    const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const queryToken = req.query.token;

    if (queryToken === config.panelToken || bearer === config.panelToken) {
      return next();
    }

    res.status(401).send('Unauthorized: Invalid or missing panelToken.');
  };

  // Find assets directory on disk and mount express.static
  
  
  const candidateAssetDirs = [
    path.join(process.cwd(), 'assets'),
    path.join(__dirname, 'assets'),
    path.join('/home/container/assets')
  ];
  for (const dir of candidateAssetDirs) {
    if (fs.existsSync(dir)) {
      app.use('/assets', express.static(dir));
      app.use(`/${panelPath}/assets`, express.static(dir));
      break;
    }
  }

  // Asset routes
  app.get(['/mavis-assets/app.css', '/assets/app.css', `/${panelPath}/assets/app.css`, `/${panelPath}/app.css`, '/app.css'], (req, res) => {
    res.setHeader('Content-Type', 'text/css; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(AssetManager.getAppCss());
  });

  app.get(['/mavis-assets/app.js', '/assets/app.js', `/${panelPath}/assets/app.js`, `/${panelPath}/app.js`, '/app.js'], (req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(AssetManager.getAppJs());
  });

  app.get([
    '/mavis-assets/logo.svg', '/assets/logo.svg', '/logo.svg',
    '/mavis-assets/logo.png', '/assets/logo.png', '/logo.png',
    `/${panelPath}/assets/logo.png`, `/${panelPath}/logo.png`
  ], (req, res) => {
    const isSvg = req.path.endsWith('.svg');
    res.setHeader('Content-Type', isSvg ? 'image/svg+xml' : 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(AssetManager.getLogoSvg());
  });

  // Helper to get active host for request
  const getRequestHost = (req) => {
    if (config.forceHost) return config.forceHost;
    if (resolvedHostGetter) {
      const h = resolvedHostGetter();
      if (h && h !== '127.0.0.1') return h;
    }
    if (req.headers.host) {
      return req.headers.host.split(':')[0];
    }
    return '127.0.0.1';
  };

  // Location cache
  let cachedLocation = null;
  const resolveLocation = async (ip) => {
    if (cachedLocation) return cachedLocation;
    try {
      
      const targetIp = ip && !ip.startsWith('127.') && !ip.startsWith('10.') && !ip.startsWith('192.') ? ip : '';
      const r = await axios.get(`https://freeipapi.com/api/json/${targetIp}`, { timeout: 2500 });
      if (r.data && r.data.countryName) {
        cachedLocation = (r.data.cityName ? `${r.data.cityName}, ` : '') + r.data.countryName;
        return cachedLocation;
      }
    } catch {}
    try {
      
      const r = await axios.get('https://1.1.1.1/cdn-cgi/trace', { timeout: 2000 });
      const m = r.data.match(/loc=([^\r\n]+)/);
      if (m && m[1]) {
        cachedLocation = m[1].trim();
        return cachedLocation;
      }
    } catch {}
    cachedLocation = ip || 'Global';
    return cachedLocation;
  };

  // Health endpoint
  app.get('/health', async (req, res) => {
    const engines = engineStatusGetter ? engineStatusGetter() : {};
    const host = getRequestHost(req);
    const linkGen = new LinkGenerator(config, stateManager.state, host);
    const allNodes = linkGen.getAllNodes({ compat: 'full', allowLocalHostLinks: true });
    const location = await resolveLocation(host);

    res.json({
      ok: true,
      brand: config.brand,
      product: config.product,
      uptime: process.uptime(),
      publicPort: config.publicPort,
      host,
      domain: config.domain || '',
      forceHost: config.forceHost || '',
      publicBaseUrl: config.publicBaseUrl || '',
      subBase: config.subBase || '',
      forceHttps: Boolean(config.forceHttps),
      location: location || 'Global Server',
      engines,
      nodes: allNodes.map(node => ({
        name: node.name,
        type: node.type,
        compat: node.compat,
        uri: node.uri,
        wgConf: node.wgConf || null,
        singboxJson: node.singboxJson || null,
        note: node.note || null
      }))
    });
  });

  // Panel HTML endpoints
  const renderPanel = (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(AssetManager.getIndexHtml());
  };

  app.get('/', authMiddleware, renderPanel);
  app.get(`/${panelPath}`, authMiddleware, renderPanel);

  // Subscriptions: Base64 & Raw (HTTP & HTTPS compatible for v2rayN, v2rayNG, Hiddify)
  app.get([`/${panelPath}/base64`, `/${panelPath}/raw`, `/${panelPath}/sub`, '/sub', '/base64'], authMiddleware, (req, res) => {
    const isBase64 = req.path.endsWith('/base64') || req.path.endsWith('/sub') || req.path === '/sub';
    const compatMode = req.query.compat || 'v2ray'; // Default to strict v2ray compatibility
    const host = getRequestHost(req);

    const linkGen = new LinkGenerator(config, stateManager.state, host);
    const allowLocal = Boolean(config.allowLocalHostLinks || host === '127.0.0.1' || host === 'localhost');
    const nodes = linkGen.getAllNodes({
      compat: compatMode,
      allowLocalHostLinks: allowLocal
    });

    const links = nodes.map(n => n.uri);
    const text = links.join('\n');

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="mavis.txt"');
    res.setHeader('Profile-Update-Interval', '24');
    res.setHeader('Subscription-Userinfo', 'upload=0; download=0; total=0; expire=0');

    if (isBase64) {
      res.send(Buffer.from(text).toString('base64'));
    } else {
      res.send(text);
    }
  });

  // Subscriptions: Clash Meta (Mihomo)
  app.get([`/${panelPath}/clash`, `/${panelPath}/clash.yaml`, '/clash'], authMiddleware, (req, res) => {
    const host = getRequestHost(req);
    const linkGen = new LinkGenerator(config, stateManager.state, host);
    const nodes = linkGen.getAllNodes({ compat: 'full', allowLocalHostLinks: true });
    const yaml = linkGen.buildClashMetaYaml(nodes);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="mavis-clash.yaml"');
    res.setHeader('Profile-Update-Interval', '24');
    res.send(yaml);
  });

  // Subscriptions: Sing-box client JSON
  app.get([`/${panelPath}/sb/raw`, `/${panelPath}/sb/base64`, `/${panelPath}/sb`, '/sb'], authMiddleware, (req, res) => {
    const isBase64 = req.path.endsWith('/base64');
    const host = getRequestHost(req);
    const linkGen = new LinkGenerator(config, stateManager.state, host);
    const nodes = linkGen.getAllNodes({ compat: 'full', allowLocalHostLinks: true });
    const jsonStr = linkGen.buildSingBoxClientJson(nodes);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', isBase64 ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8');
    if (isBase64) {
      res.send(Buffer.from(jsonStr).toString('base64'));
    } else {
      res.send(jsonStr);
    }
  });

  // Subscriptions: Xray client JSON
  app.get([`/${panelPath}/xray/raw`, `/${panelPath}/xray/base64`], authMiddleware, (req, res) => {
    const isBase64 = req.path.endsWith('/base64');
    const jsonStr = stateManager.state.xrayJson || '{}';

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', isBase64 ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8');
    if (isBase64) {
      res.send(Buffer.from(jsonStr).toString('base64'));
    } else {
      res.send(jsonStr);
    }
  });

  // WireGuard Configuration (.conf) - Graceful failure handling
  app.get([`/${panelPath}/wg.conf`, `/${panelPath}/wireguard.conf`, '/wg.conf'], authMiddleware, (req, res) => {
    try {
      const host = getRequestHost(req);
      const linkGen = new LinkGenerator(config, stateManager.state, host);
      let wgNode = null;
      try {
        wgNode = linkGen.generateWireGuard();
      } catch (wgErr) {
        console.warn(`[WireGuard] Warning: Failed to generate WireGuard node: ${wgErr.message}`);
      }

      let conf = wgNode && wgNode.wgConf;
      if (!conf) {
        const keys = linkGen._getOrGenerateWgKeys();
        conf = [
          '[Interface]',
          `PrivateKey = ${keys.clientPriv}`,
          'Address = 10.66.66.2/32',
          'DNS = 1.1.1.1, 8.8.8.8',
          'MTU = 1420',
          '',
          '[Peer]',
          `PublicKey = ${keys.serverPub}`,
          `Endpoint = ${host}:51820`,
          'AllowedIPs = 0.0.0.0/0, ::/0',
          'PersistentKeepalive = 25'
        ].join('\n') + '\n';
      }

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="wg0.conf"');
      res.send(conf);
    } catch (err) {
      console.warn(`[WireGuard] WireGuard endpoint error: ${err.message}`);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.status(200).send('# WireGuard configuration failed gracefully.\n');
    }
  });

  const server = http.createServer(app);
  server.keepAliveTimeout = 120000;
  server.headersTimeout = 125000;
  return { app, server };
}

module.exports = {
  createHttpPanel,
  AssetManager
};
