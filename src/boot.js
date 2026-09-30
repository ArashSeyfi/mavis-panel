const axios = require('axios');
const { Logger } = require('./logger');
const { buildConfig } = require('./config');
const { StateManager } = require('./state');
const { allocatePorts } = require('./ports');
const { BinaryManager } = require('./binaries');
const { SingBoxEngine } = require('./engines/singbox');
const { XrayEngine } = require('./engines/xray');
const { ArgoTunnel } = require('./engines/argo');
const { LinkGenerator } = require('./panel/links');
const { createHttpPanel } = require('./panel/http-panel');
const { TcpRouter } = require('./mux/tcp-router');

async function resolvePublicHost(config) {
  if (config.forceHost) return config.forceHost;
  if (config.domain) return config.domain;
  if (process.env.CFIP) return process.env.CFIP;
  if (process.env.DOMAIN || process.env.SB_DOMAIN) return process.env.DOMAIN || process.env.SB_DOMAIN;

  try {
    const res = await axios.get('https://api.ipify.org?format=text', { timeout: 3500 });
    if (res.data && typeof res.data === 'string' && res.data.trim()) {
      return res.data.trim();
    }
  } catch {}

  try {
    const res = await axios.get('https://ifconfig.me/ip', { timeout: 3500 });
    if (res.data && typeof res.data === 'string' && res.data.trim()) {
      return res.data.trim();
    }
  } catch {}

  try {
    const res = await axios.get('https://1.1.1.1/cdn-cgi/trace', { timeout: 3500 });
    if (res.data && typeof res.data === 'string') {
      const match = res.data.match(/ip=([^\r\n]+)/);
      if (match && match[1]) return match[1].trim();
    }
  } catch {}

  return '127.0.0.1';
}

async function startGate(userConfig = {}) {
  // 1. Banner & notices
  Logger.banner();
  Logger.renewNotice();

  // 2. Build configuration
  const config = buildConfig(userConfig);
  Logger.section('Configuration');
  Logger.item('Public Port', config.publicPort);
  Logger.item('Panel Path', `/${config.panelPath}`);
  Logger.item('Data Directory', config.paths.dataDir);

  // 3. Persistent state
  const stateMgr = new StateManager(config.paths, config);
  const state = stateMgr.loadOrCreate();
  Logger.item('UUID', state.uuid);

  // 4. Resolve host / IP
  const resolvedHost = await resolvePublicHost(config);
  stateMgr.setPublicIp(resolvedHost);
  Logger.item('Resolved Host', resolvedHost);

  // 5. Allocate dynamic internal ports
  const allocatedPorts = {};
  if (config.enable.vlessWs) allocatedPorts.vlessWs = await allocatePorts();
  if (config.enable.vlessWsTls) allocatedPorts.vlessWsTls = await allocatePorts();
  if (config.enable.vmessWs || config.enable.vmessWsTls) allocatedPorts.vmessWs = await allocatePorts();
  if (config.enable.trojanGrpcTls) allocatedPorts.trojanGrpcTls = await allocatePorts();
  if (config.enable.vlessHttpUpgrade) allocatedPorts.vlessHu = await allocatePorts();
  if (config.enable.vlessGrpc) allocatedPorts.vlessGrpc = await allocatePorts();
  if (config.enable.trojanWs) allocatedPorts.trojanWs = await allocatePorts();
  if (config.enable.reality) allocatedPorts.reality = await allocatePorts();
  if (config.enable.shadowTlsVless) allocatedPorts.shadowTls = await allocatePorts();
  if (config.enable.shadowsocks) allocatedPorts.shadowsocks = await allocatePorts();
  if (config.enable.socks) allocatedPorts.socks = await allocatePorts();
  if (config.enable.httpProxy) allocatedPorts.httpProxy = await allocatePorts();
  if (config.enable.vlessXhttp) allocatedPorts.xray = await allocatePorts();

  // 6. Manage Binaries
  Logger.section('Engines & Binaries');
  const binManager = new BinaryManager(config);

  const hasSingBox = await binManager.ensureSingBox();
  let hasXray = false;
  if (config.enable.vlessXhttp) {
    hasXray = await binManager.ensureXray();
  }
  let hasCloudflared = false;
  if (config.enable.argo) {
    hasCloudflared = await binManager.ensureCloudflared();
  }

  // 7. Start Engine Instances
  let singboxInstance = null;
  if (hasSingBox) {
    singboxInstance = new SingBoxEngine(config, stateMgr, allocatedPorts);
    singboxInstance.start();
  } else {
    Logger.warn('sing-box binary could not be started. (Mock/offline mode active).');
  }

  let xrayInstance = null;
  if (hasXray && allocatedPorts.xray) {
    xrayInstance = new XrayEngine(config, stateMgr, allocatedPorts.xray);
    xrayInstance.start();
  }

  let argoInstance = null;
  let argoDomain = null;
  if (hasCloudflared && config.enable.argo) {
    argoInstance = new ArgoTunnel(config, config.publicPort);
    argoDomain = await argoInstance.start();
  }

  // 8. Generate share links & subscriptions
  const linkGen = new LinkGenerator(config, stateMgr.state, resolvedHost);
  const compatNodes = linkGen.getAllNodes({ compat: 'v2ray', argoDomain, allowLocalHostLinks: config.allowLocalHostLinks });
  const allNodes = linkGen.getAllNodes({ compat: 'full', argoDomain, allowLocalHostLinks: true });
  const links = compatNodes.map(n => n.uri);
  const clashYaml = linkGen.buildClashMetaYaml(allNodes);
  const singboxJson = linkGen.buildSingBoxClientJson(allNodes);

  stateMgr.setLinks(links, clashYaml, singboxJson);

  // 9. HTTP Panel & TCP multiplexer
  const engineStatusGetter = () => ({
    singbox: !!(singboxInstance && singboxInstance.process && !singboxInstance.process.killed),
    xray: !!(xrayInstance && xrayInstance.process && !xrayInstance.process.killed),
    argo: !!(argoInstance && argoInstance.process && !argoInstance.process.killed)
  });

  const { server: expressServer, app: expressApp } = createHttpPanel(config, stateMgr, engineStatusGetter, () => resolvedHost);
  const tcpRouter = new TcpRouter(config, allocatedPorts, expressServer, expressApp);
  await tcpRouter.start();

  // 10. Summary
  const panelUrl = `http://${resolvedHost}:${config.publicPort}/${config.panelPath}`;
  Logger.section('Mavis Panel Active');
  Logger.item('Host', resolvedHost);
  Logger.item('Web Panel', panelUrl);

  // Graceful shutdown
  const shutdown = () => {
    Logger.info('Stopping Mavis Panel...');
    if (singboxInstance) singboxInstance.stop();
    if (xrayInstance) xrayInstance.stop();
    if (argoInstance) argoInstance.stop();
    if (tcpRouter) tcpRouter.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return {
    config,
    state: stateMgr.state,
    nodes: compatNodes,
    allNodes,
    panelUrl,
    allocatedPorts,
    tcpRouter,
    singboxInstance,
    xrayInstance,
    argoInstance,
    shutdown
  };
}

module.exports = {
  resolvePublicHost,
  startGate
};
