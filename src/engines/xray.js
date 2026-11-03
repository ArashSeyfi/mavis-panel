const fs = require('fs');
const { spawn } = require('child_process');
const { Logger, rotateLogIfNeeded } = require('../logger');

class XrayEngine {
  constructor(config, stateManager, localPort) {
    this.config = config;
    this.paths = config.paths;
    this.stateManager = stateManager;
    this.port = localPort;
    this.process = null;
    this.logRotatorTimer = null;
  }

  buildConfig() {
    const state = this.stateManager.state;
    const xhttpPath = `/${this.config.panelPath}-xh`;

    let xrayLogLevel = (this.config.xrayLogLevel || this.config.logLevel || 'warning').toLowerCase();
    if (xrayLogLevel === 'warn') xrayLogLevel = 'warning';

    return {
      log: {
        loglevel: xrayLogLevel
      },
      inbounds: [
        {
          port: this.port,
          listen: '127.0.0.1',
          protocol: 'vless',
          settings: {
            clients: [
              {
                id: state.uuid,
                level: 0
              }
            ],
            decryption: 'none'
          },
          streamSettings: {
            network: 'xhttp',
            xhttpSettings: {
              path: xhttpPath,
              mode: 'auto'
            }
          }
        }
      ],
      outbounds: [
        {
          protocol: 'freedom',
          tag: 'direct'
        }
      ]
    };
  }

  start() {
    if (!fs.existsSync(this.paths.xrayBin)) {
      return false;
    }

    const cfg = this.buildConfig();
    fs.writeFileSync(this.paths.xrayConfig, JSON.stringify(cfg, null, 2), 'utf8');

    const maxLogSize = (this.config.maxLogSizeMb || 5) * 1024 * 1024;
    rotateLogIfNeeded(this.paths.xrayLog, maxLogSize);

    const logFd = fs.openSync(this.paths.xrayLog, 'a');
    this.process = spawn(this.paths.xrayBin, ['run', '-c', this.paths.xrayConfig], {
      stdio: ['ignore', logFd, logFd],
      detached: false
    });

    this.logRotatorTimer = setInterval(() => {
      rotateLogIfNeeded(this.paths.xrayLog, maxLogSize);
    }, 60000);
    if (this.logRotatorTimer.unref) this.logRotatorTimer.unref();

    this.process.on('error', (err) => {
      Logger.warn(`Xray engine error: ${err.message}`);
    });

    this.process.on('exit', () => {
      if (this.logRotatorTimer) {
        clearInterval(this.logRotatorTimer);
        this.logRotatorTimer = null;
      }
      try { fs.closeSync(logFd); } catch {}
    });

    Logger.success(`Xray-core (XHTTP) running on local port ${this.port}.`);
    return true;
  }

  stop() {
    if (this.logRotatorTimer) {
      clearInterval(this.logRotatorTimer);
      this.logRotatorTimer = null;
    }
    if (this.process && !this.process.killed) {
      try {
        this.process.kill('SIGTERM');
      } catch {}
    }
  }
}

module.exports = { XrayEngine };
