/**
 * URI and Node validation for client compatibility (v2rayN, v2rayNG, Hiddify, sing-box)
 */

function isLocalAddress(host) {
  if (!host) return true;
  const clean = host.toLowerCase().trim();
  return (
    clean === '127.0.0.1' ||
    clean === 'localhost' ||
    clean === '::1' ||
    clean === '0.0.0.0' ||
    clean.startsWith('127.')
  );
}

/**
 * Validates a node share URI
 * @param {object} node Node object containing uri, type, name
 * @param {object} options { allowLocalHostLinks, compatMode }
 * @returns {boolean}
 */
function isValidNode(node, options = {}) {
  if (!node || !node.uri || typeof node.uri !== 'string') return false;

  const { allowLocalHostLinks = false, compatMode = 'v2ray' } = options;
  const uri = node.uri.trim();

  try {
    const scheme = uri.split('://')[0].toLowerCase();

    // Special handling for vmess:// (base64 JSON)
    if (scheme === 'vmess') {
      try {
        const rawJson = Buffer.from(uri.replace(/^vmess:\/\//i, ''), 'base64').toString('utf8');
        const vConf = JSON.parse(rawJson);
        if (!vConf.add || !vConf.port || !vConf.id) return false;
        if (!allowLocalHostLinks && isLocalAddress(vConf.add)) return false;
        return true;
      } catch {
        return false;
      }
    }

    const parsed = new URL(uri);

    // Check host
    if (!allowLocalHostLinks && isLocalAddress(parsed.hostname)) {
      return false;
    }

    // Compat mode filter
    if (compatMode === 'v2ray') {
      const allowedSchemes = ['vless', 'vmess', 'trojan', 'ss'];
      if (!allowedSchemes.includes(scheme)) {
        return false;
      }
    }

    // Protocol-specific checks
    if (scheme === 'vless') {
      const uuid = parsed.username;
      if (!uuid || uuid.length < 8) return false;

      const security = parsed.searchParams.get('security');
      if (security === 'reality') {
        const pbk = parsed.searchParams.get('pbk');
        const sid = parsed.searchParams.get('sid');
        const sni = parsed.searchParams.get('sni');
        if (!pbk || !sid || !sni) return false;
      }

      const type = parsed.searchParams.get('type');
      if (type === 'ws') {
        const pathVal = parsed.searchParams.get('path');
        if (!pathVal) return false;
      }

      if (type === 'grpc') {
        const serviceName = parsed.searchParams.get('serviceName');
        if (!serviceName) return false;
      }

      if (compatMode === 'v2ray' && (type === 'httpupgrade' || type === 'xhttp')) {
        return false;
      }
    }

    if (scheme === 'trojan') {
      if (!parsed.username) return false;
    }

    if (scheme === 'ss') {
      if (!parsed.username && !parsed.hostname) return false;
    }

    return true;
  } catch {
    return false;
  }
}

module.exports = {
  isLocalAddress,
  isValidNode
};
