/**
 * ====================================================================
 *                 MAVIS PANEL — STANDALONE CORE
 * ====================================================================
 * Stealth proxy core & single-port multiplexer
 * Single-port router for Linux containers, VPS & cloud servers
 * Generated automatically by Mavis Panel compiler
 * ====================================================================
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');
const express = require('express');
const axios = require('axios');

// --- Embedded Web Panel Assets (Monochrome Clean B&W) ---
const EMBEDDED_ASSETS = {
  indexHtml: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Mavis Panel</title>\n  <link rel=\"stylesheet\" href=\"/mavis-assets/app.css\">\n  <link rel=\"icon\" type=\"image/svg+xml\" href=\"/mavis-assets/logo.svg\">\n</head>\n<body>\n\n  <nav class=\"topbar\">\n    <a href=\"#/home\" class=\"logo\">Mavis</a>\n    <div class=\"nav-links\">\n      <a href=\"#/home\" class=\"nav-link active\" data-page=\"home\">Home</a>\n      <a href=\"#/subs\" class=\"nav-link\" data-page=\"subs\">Subs</a>\n      <a href=\"#/nodes\" class=\"nav-link\" data-page=\"nodes\">Direct Links</a>\n    </div>\n  </nav>\n\n  <main>\n\n    <!-- HOME -->\n    <div id=\"viewHome\" class=\"page active\">\n\n      <div class=\"status-bar\">\n        <div class=\"status-row\">\n          <span class=\"dot green\"></span>\n          <span class=\"status-label\">Uptime</span>\n          <span class=\"status-val\" id=\"homeUptime\">—</span>\n        </div>\n        <div class=\"status-row\">\n          <span class=\"status-label\">Location</span>\n          <span class=\"status-val\" id=\"homeLocation\">—</span>\n        </div>\n        <div class=\"status-row\">\n          <span class=\"status-label\">Host</span>\n          <span class=\"status-val\" id=\"homeHost\">—</span>\n        </div>\n        <div class=\"status-row\">\n          <span class=\"status-label\">Port</span>\n          <span class=\"status-val\" id=\"homePort\">—</span>\n        </div>\n      </div>\n\n      <div class=\"protos\">\n        <span class=\"proto-tag\">VLESS</span>\n        <span class=\"proto-tag\">Trojan</span>\n        <span class=\"proto-tag\">VMess</span>\n        <span class=\"proto-tag\">Shadowsocks</span>\n        <span class=\"proto-tag\">WireGuard</span>\n        <span class=\"proto-tag\">Reality</span>\n      </div>\n\n    </div>\n\n    <!-- SUBS -->\n    <div id=\"viewSubs\" class=\"page\">\n\n      <div class=\"section-head\">\n        <h2>Subscriptions</h2>\n        <div class=\"proto-switch\">\n          <button type=\"button\" id=\"btnProtoHttp\" class=\"sw-btn active\">HTTP</button>\n          <button type=\"button\" id=\"btnProtoHttps\" class=\"sw-btn\">HTTPS</button>\n        </div>\n      </div>\n\n      <div class=\"sub-list\">\n\n        <div class=\"sub-row\">\n          <div class=\"sub-meta\">\n            <strong>Universal</strong>\n            <span class=\"sub-hint\">v2rayN / v2rayNG / Hiddify / Streisand</span>\n          </div>\n          <div class=\"sub-controls\">\n            <input type=\"text\" id=\"urlSubCompat\" class=\"mono-input\" readonly>\n            <button type=\"button\" class=\"btn\" data-action=\"copy-input\" data-target=\"urlSubCompat\">Copy</button>\n            <button type=\"button\" class=\"btn\" data-action=\"qr-input\" data-target=\"urlSubCompat\">QR</button>\n          </div>\n        </div>\n\n        <div class=\"sub-row\">\n          <div class=\"sub-meta\">\n            <strong>Clash Meta / Mihomo</strong>\n            <span class=\"sub-hint\">Clash Verge / Mihomo / Flclash</span>\n          </div>\n          <div class=\"sub-controls\">\n            <input type=\"text\" id=\"urlClash\" class=\"mono-input\" readonly>\n            <button type=\"button\" class=\"btn\" data-action=\"copy-input\" data-target=\"urlClash\">Copy</button>\n            <button type=\"button\" class=\"btn\" data-action=\"qr-input\" data-target=\"urlClash\">QR</button>\n          </div>\n        </div>\n\n        <div class=\"sub-row\">\n          <div class=\"sub-meta\">\n            <strong>Sing-box JSON</strong>\n          </div>\n          <div class=\"sub-controls\">\n            <input type=\"text\" id=\"urlSb\" class=\"mono-input\" readonly>\n            <button type=\"button\" class=\"btn\" data-action=\"copy-input\" data-target=\"urlSb\">Copy</button>\n          </div>\n        </div>\n\n        <div class=\"sub-row\">\n          <div class=\"sub-meta\">\n            <strong>Full Subscription</strong>\n            <span class=\"sub-hint\">All protocols</span>\n          </div>\n          <div class=\"sub-controls\">\n            <input type=\"text\" id=\"urlSubFull\" class=\"mono-input\" readonly>\n            <button type=\"button\" class=\"btn\" data-action=\"copy-input\" data-target=\"urlSubFull\">Copy</button>\n          </div>\n        </div>\n\n        <div class=\"sub-row\" id=\"subRowWg\">\n          <div class=\"sub-meta\">\n            <strong>WireGuard</strong>\n            <span class=\"sub-hint\">.conf profile</span>\n          </div>\n          <div class=\"sub-controls\">\n            <input type=\"text\" id=\"urlWgConf\" class=\"mono-input\" readonly>\n            <button type=\"button\" class=\"btn\" data-action=\"copy-input\" data-target=\"urlWgConf\">Copy</button>\n            <a href=\"/mavis/wg.conf\" id=\"btnDownloadWg\" download=\"mavis-wg.conf\" class=\"btn\">Download</a>\n          </div>\n        </div>\n\n      </div>\n    </div>\n\n    <!-- NODES -->\n    <div id=\"viewNodes\" class=\"page\">\n      <div class=\"section-head\">\n        <h2>Direct Links</h2>\n        <div class=\"loc-badge\" id=\"nodesLocationBadge\">\n          <span class=\"dot green\"></span>\n          <span id=\"nodesLocation\">Loading…</span>\n        </div>\n      </div>\n      <div id=\"nodesContainer\" class=\"nodes-list\">\n        <p class=\"muted center\">Loading links…</p>\n      </div>\n    </div>\n\n  </main>\n\n  <!-- QR Modal -->\n  <div id=\"qrModal\" class=\"modal-bg\">\n    <div class=\"modal\">\n      <div class=\"modal-top\">\n        <h3 id=\"qrModalTitle\">QR Code</h3>\n        <button type=\"button\" class=\"modal-close\" id=\"qrCloseBtn\">&times;</button>\n      </div>\n      <div class=\"modal-body\">\n        <div id=\"qrcodeWrapper\" class=\"qr-box\"></div>\n      </div>\n    </div>\n  </div>\n\n  <div id=\"mavisToast\" class=\"toast\"></div>\n\n  <footer class=\"footer\">Made by Arash Seyfi</footer>\n\n  <script src=\"/mavis-assets/app.js\"></script>\n</body>\n</html>\n",
  appCss: "/* Mavis Panel */\n\n* { box-sizing: border-box; margin: 0; padding: 0; }\n\nhtml, body {\n  background: #111;\n  color: #ccc;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;\n  font-size: 14px;\n  line-height: 1.5;\n  -webkit-font-smoothing: antialiased;\n}\n\n::-webkit-scrollbar { width: 6px; }\n::-webkit-scrollbar-track { background: #111; }\n::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }\n\n/* Layout */\nmain {\n  max-width: 720px;\n  margin: 0 auto;\n  padding: 24px 20px 60px;\n}\n\n/* Top bar */\n.topbar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  max-width: 720px;\n  margin: 0 auto;\n  padding: 16px 20px;\n}\n\n.logo {\n  font-size: 16px;\n  font-weight: 700;\n  color: #fff;\n  text-decoration: none;\n  letter-spacing: -0.02em;\n}\n\n.nav-links { display: flex; gap: 4px; }\n\n.nav-link {\n  padding: 5px 12px;\n  color: #888;\n  text-decoration: none;\n  font-size: 13px;\n  font-weight: 500;\n  border-radius: 4px;\n}\n\n.nav-link:hover { color: #bbb; }\n.nav-link.active { color: #111; background: #ddd; }\n\n/* Pages */\n.page { display: none; }\n.page.active { display: block; }\n\n/* Status bar */\n.status-bar {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 2px;\n  margin-bottom: 24px;\n  background: #1a1a1a;\n  border: 1px solid #222;\n  border-radius: 6px;\n  overflow: hidden;\n}\n\n.status-row {\n  flex: 1 1 auto;\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 10px 14px;\n  min-width: 130px;\n  font-size: 13px;\n  border-right: 1px solid #222;\n}\n\n.status-row:last-child { border-right: none; }\n\n.dot {\n  width: 6px;\n  height: 6px;\n  border-radius: 50%;\n  flex-shrink: 0;\n}\n\n.dot.green { background: #4a4; }\n\n.status-label { color: #666; margin-right: 4px; }\n.status-val { color: #ddd; font-weight: 600; }\n\n/* Protocol tags */\n.protos {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n}\n\n.proto-tag {\n  font-size: 12px;\n  font-weight: 600;\n  color: #999;\n  background: #1a1a1a;\n  border: 1px solid #252525;\n  padding: 4px 10px;\n  border-radius: 4px;\n}\n\n/* Section head */\n.section-head {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  margin-bottom: 16px;\n}\n\n.section-head h2 {\n  font-size: 16px;\n  font-weight: 700;\n  color: #eee;\n}\n\n/* Proto switch */\n.proto-switch { display: flex; gap: 2px; }\n\n.sw-btn {\n  background: transparent;\n  border: 1px solid #333;\n  color: #888;\n  font-size: 12px;\n  font-weight: 600;\n  padding: 4px 10px;\n  border-radius: 4px;\n  cursor: pointer;\n}\n\n.sw-btn.active {\n  background: #ddd;\n  color: #111;\n  border-color: #ddd;\n}\n\n/* Sub list */\n.sub-list { display: flex; flex-direction: column; gap: 10px; }\n\n.sub-row {\n  background: #1a1a1a;\n  border: 1px solid #222;\n  border-radius: 6px;\n  padding: 12px 14px;\n}\n\n.sub-meta { margin-bottom: 8px; }\n.sub-meta strong { color: #ddd; font-size: 13px; }\n.sub-hint { color: #666; font-size: 12px; margin-left: 8px; }\n\n.sub-controls { display: flex; gap: 6px; align-items: center; }\n\n.mono-input {\n  flex: 1;\n  background: #111;\n  border: 1px solid #2a2a2a;\n  color: #888;\n  font-family: \"SF Mono\", \"Cascadia Code\", \"Consolas\", monospace;\n  font-size: 12px;\n  padding: 7px 10px;\n  border-radius: 4px;\n  outline: none;\n  min-width: 0;\n}\n\n.mono-input:focus { color: #ccc; border-color: #444; }\n\n/* Buttons */\n.btn {\n  background: #222;\n  border: 1px solid #333;\n  color: #ccc;\n  font-size: 12px;\n  font-weight: 600;\n  padding: 7px 12px;\n  border-radius: 4px;\n  cursor: pointer;\n  text-decoration: none;\n  white-space: nowrap;\n  display: inline-flex;\n  align-items: center;\n}\n\n.btn:hover { background: #2a2a2a; border-color: #444; }\n\n/* Location badge */\n.loc-badge {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  font-size: 12px;\n  color: #888;\n}\n\n/* Nodes list */\n.nodes-list {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 10px;\n}\n\n.node-card {\n  background: #1a1a1a;\n  border: 1px solid #222;\n  border-radius: 6px;\n  padding: 12px;\n}\n\n.node-top {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 6px;\n  margin-bottom: 6px;\n}\n\n.node-proto {\n  font-size: 11px;\n  font-weight: 700;\n  color: #111;\n  background: #aaa;\n  padding: 1px 6px;\n  border-radius: 3px;\n}\n\n.node-badges { display: flex; gap: 4px; }\n\n.node-badge {\n  font-size: 11px;\n  color: #666;\n  border: 1px solid #2a2a2a;\n  padding: 1px 5px;\n  border-radius: 3px;\n}\n\n.node-name {\n  font-size: 13px;\n  font-weight: 600;\n  color: #ccc;\n  margin-bottom: 8px;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n\n.node-uri {\n  width: 100%;\n  background: #111;\n  border: 1px solid #2a2a2a;\n  color: #666;\n  font-family: monospace;\n  font-size: 11px;\n  padding: 5px 8px;\n  border-radius: 4px;\n  outline: none;\n  margin-bottom: 8px;\n}\n\n.node-uri:focus { color: #aaa; border-color: #444; }\n\n.node-actions { display: flex; gap: 6px; }\n\n.node-actions .btn { flex: 1; justify-content: center; font-size: 12px; padding: 5px 8px; }\n\n/* Utilities */\n.muted { color: #666; }\n.center { text-align: center; }\n\n/* Modal */\n.modal-bg {\n  position: fixed;\n  inset: 0;\n  background: rgba(0,0,0,.7);\n  display: none;\n  align-items: center;\n  justify-content: center;\n  z-index: 100;\n  padding: 20px;\n}\n\n.modal-bg.active { display: flex; }\n\n.modal {\n  background: #1a1a1a;\n  border: 1px solid #333;\n  border-radius: 8px;\n  width: 100%;\n  max-width: 320px;\n  padding: 16px;\n}\n\n.modal-top {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  margin-bottom: 12px;\n}\n\n.modal-top h3 { font-size: 14px; color: #ddd; }\n\n.modal-close {\n  background: none;\n  border: none;\n  color: #888;\n  font-size: 20px;\n  cursor: pointer;\n  line-height: 1;\n}\n\n.modal-body { text-align: center; }\n\n.qr-box {\n  background: #fff;\n  padding: 10px;\n  border-radius: 6px;\n  display: inline-block;\n}\n\n.qr-box img { display: block; }\n\n/* Toast */\n.toast {\n  position: fixed;\n  bottom: 20px;\n  left: 50%;\n  transform: translateX(-50%) translateY(80px);\n  background: #ddd;\n  color: #111;\n  padding: 6px 16px;\n  border-radius: 6px;\n  font-size: 13px;\n  font-weight: 600;\n  z-index: 200;\n  pointer-events: none;\n  transition: transform .2s ease;\n}\n\n.toast.show { transform: translateX(-50%) translateY(0); }\n\n/* Responsive */\n@media (max-width: 600px) {\n  .status-bar { flex-direction: column; gap: 0; }\n  .status-row { border-right: none; border-bottom: 1px solid #222; }\n  .status-row:last-child { border-bottom: none; }\n  .nodes-list { grid-template-columns: 1fr; }\n  .sub-hint { display: block; margin-left: 0; margin-top: 2px; }\n  .section-head { flex-wrap: wrap; }\n}\n\n/* Footer */\n.footer {\n  max-width: 720px;\n  margin: 0 auto;\n  padding: 24px 20px;\n  text-align: center;\n  font-size: 12px;\n  color: #555;\n}\n",
  appJs: "// Mavis Panel\n\nlet gateData = null;\n\nfunction showToast(text) {\n  const t = document.getElementById('mavisToast');\n  if (!t) return;\n  t.innerText = text;\n  t.classList.add('show');\n  setTimeout(() => t.classList.remove('show'), 2000);\n}\n\nfunction copyText(text) {\n  if (!text) return;\n  if (navigator.clipboard && window.isSecureContext) {\n    navigator.clipboard.writeText(text).then(() => showToast('Copied')).catch(() => fbCopy(text));\n  } else {\n    fbCopy(text);\n  }\n}\n\nfunction fbCopy(text) {\n  const ta = document.createElement('textarea');\n  ta.value = text;\n  ta.style.cssText = 'position:fixed;opacity:0';\n  document.body.appendChild(ta);\n  ta.select();\n  try { document.execCommand('copy'); showToast('Copied'); }\n  catch { showToast('Copy failed'); }\n  document.body.removeChild(ta);\n}\n\n// QR modal\nfunction openQr(text, title) {\n  if (!text) return;\n  const modal = document.getElementById('qrModal');\n  const wrap = document.getElementById('qrcodeWrapper');\n  const titleEl = document.getElementById('qrModalTitle');\n  if (!modal || !wrap) return;\n  if (titleEl) titleEl.innerText = title || 'QR Code';\n  wrap.innerHTML = '';\n  const img = document.createElement('img');\n  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;\n  img.alt = 'QR';\n  img.width = 200;\n  img.height = 200;\n  wrap.appendChild(img);\n  modal.classList.add('active');\n}\n\nfunction closeQr() {\n  document.getElementById('qrModal')?.classList.remove('active');\n}\n\ndocument.getElementById('qrCloseBtn')?.addEventListener('click', closeQr);\ndocument.getElementById('qrModal')?.addEventListener('click', e => {\n  if (e.target.id === 'qrModal') closeQr();\n});\ndocument.addEventListener('keydown', e => { if (e.key === 'Escape') closeQr(); });\n\n// Event delegation\ndocument.addEventListener('click', e => {\n  const btn = e.target.closest('button, a');\n  if (!btn) return;\n  const action = btn.getAttribute('data-action');\n  if (!action) return;\n\n  if (action === 'copy-input') {\n    const el = document.getElementById(btn.getAttribute('data-target'));\n    if (el) copyText(el.value);\n  } else if (action === 'qr-input') {\n    const el = document.getElementById(btn.getAttribute('data-target'));\n    if (el) openQr(el.value, 'Subscription QR');\n  } else if (action === 'copy-text') {\n    const raw = btn.getAttribute('data-text');\n    if (raw) copyText(decodeURIComponent(raw));\n  } else if (action === 'qr-text') {\n    const raw = btn.getAttribute('data-text');\n    if (raw) openQr(decodeURIComponent(raw), btn.getAttribute('data-title') || 'QR Code');\n  }\n});\n\n// Routing\nfunction route() {\n  let hash = window.location.hash || '#/home';\n  if (hash === '#' || hash === '') hash = '#/home';\n  const pg = hash.replace(/^#\\/?/, '').split('?')[0].toLowerCase() || 'home';\n  let page = 'home';\n  if (pg === 'subs' || pg === 'sub') page = 'subs';\n  else if (pg === 'nodes' || pg === 'node') page = 'nodes';\n\n  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));\n  const viewMap = { home: 'viewHome', subs: 'viewSubs', nodes: 'viewNodes' };\n  document.getElementById(viewMap[page])?.classList.add('active');\n\n  document.querySelectorAll('.nav-link').forEach(el => {\n    el.classList.toggle('active', el.getAttribute('data-page') === page);\n  });\n\n  window.scrollTo({ top: 0 });\n}\n\nwindow.addEventListener('hashchange', route);\n\nfunction esc(str) {\n  if (!str) return '';\n  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');\n}\n\n// Render nodes\nfunction renderNodes(nodes) {\n  const c = document.getElementById('nodesContainer');\n  if (!c) return;\n\n  const active = (nodes || []).filter(n => {\n    if (!n || !n.uri) return false;\n    const t = (n.type || '').toLowerCase();\n    return !t.includes('hy2') && !t.includes('hysteria');\n  });\n\n  if (!active.length) {\n    c.innerHTML = '<p class=\"muted center\" style=\"grid-column:1/-1;padding:32px 0\">No active links.</p>';\n    return;\n  }\n\n  let html = '';\n  active.forEach((node, i) => {\n    const name = node.name || `Node ${i + 1}`;\n    const lt = (node.type || '').toLowerCase();\n\n    let proto = 'VLESS';\n    if (lt.includes('vmess')) proto = 'VMess';\n    else if (lt.includes('trojan')) proto = 'Trojan';\n    else if (lt.includes('shadowsocks') || lt.includes('ss')) proto = 'SS';\n    else if (lt.includes('wireguard') || lt.includes('wg')) proto = 'WG';\n    else if (lt.includes('tuic')) proto = 'TUIC';\n\n    let badges = '';\n    if (lt.includes('ws')) badges += '<span class=\"node-badge\">WS</span>';\n    else if (lt.includes('httpupgrade')) badges += '<span class=\"node-badge\">HTTPUpgrade</span>';\n    else if (lt.includes('grpc')) badges += '<span class=\"node-badge\">gRPC</span>';\n    else if (lt.includes('xhttp')) badges += '<span class=\"node-badge\">XHTTP</span>';\n\n    if (lt.includes('reality')) badges += '<span class=\"node-badge\">Reality</span>';\n    else if (lt.includes('tls')) badges += '<span class=\"node-badge\">TLS</span>';\n\n    const eu = encodeURIComponent(node.uri);\n\n    html += `<div class=\"node-card\">\n      <div class=\"node-top\">\n        <span class=\"node-proto\">${proto}</span>\n        <div class=\"node-badges\">${badges}</div>\n      </div>\n      <div class=\"node-name\" title=\"${esc(name)}\">${esc(name)}</div>\n      <input type=\"text\" class=\"node-uri\" readonly value=\"${esc(node.uri)}\" onclick=\"this.select()\">\n      <div class=\"node-actions\">\n        <button type=\"button\" class=\"btn\" data-action=\"copy-text\" data-text=\"${eu}\">Copy</button>\n        <button type=\"button\" class=\"btn\" data-action=\"qr-text\" data-text=\"${eu}\" data-title=\"${encodeURIComponent(name)}\">QR</button>\n      </div>\n    </div>`;\n  });\n\n  c.innerHTML = html;\n}\n\n// Load data\nasync function loadData() {\n  try {\n    const segs = window.location.pathname.split('/').filter(Boolean);\n    const prefix = segs[0] || 'mavis';\n\n    const res = await fetch('/health');\n    const data = await res.json();\n    gateData = data;\n\n    const port = data.publicPort || window.location.port || '2705';\n    const host = data.domain || data.host || window.location.hostname;\n    const loc = data.location || 'Global';\n\n    let uptime = '—';\n    if (data.uptime !== undefined) {\n      const m = Math.floor(data.uptime / 60);\n      const s = Math.floor(data.uptime % 60);\n      uptime = `${m}m ${s}s`;\n    }\n\n    const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };\n    set('homeLocation', loc);\n    set('homePort', port);\n    set('homeHost', host);\n    set('homeUptime', uptime);\n    set('nodesLocation', loc);\n\n    const engines = [];\n    if (data.engines?.singbox) engines.push('sing-box');\n    if (data.engines?.xray) engines.push('xray');\n    if (data.engines?.argo) engines.push('argo');\n    set('homeEngine', engines.join(' + ') || 'sing-box');\n\n    let activeProto = (data.forceHttps || window.location.protocol === 'https:') ? 'https:' : 'http:';\n\n    const updateSubs = (proto) => {\n      let origin;\n      if (data.publicBaseUrl?.trim()) {\n        origin = data.publicBaseUrl.trim().replace(/\\/+$/, '');\n      } else if (data.subBase?.trim()) {\n        origin = data.subBase.trim().replace(/\\/+$/, '');\n      } else {\n        const hp = window.location.port ? `${window.location.hostname}:${window.location.port}` : window.location.hostname;\n        if (proto === 'https:') {\n          if (data.domain) origin = data.domain.startsWith('http') ? data.domain : `https://${data.domain}`;\n          else if (window.location.protocol === 'https:') origin = window.location.origin;\n          else origin = `https://${hp}`;\n        } else {\n          origin = `http://${hp}`;\n        }\n      }\n\n      const val = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };\n      val('urlSubCompat', `${origin}/${prefix}/base64`);\n      val('urlSubFull', `${origin}/${prefix}/base64?compat=full`);\n      val('urlClash', `${origin}/${prefix}/clash`);\n      val('urlSb', `${origin}/${prefix}/sb/raw`);\n      val('urlWgConf', `${origin}/${prefix}/wg.conf`);\n\n      const dlBtn = document.getElementById('btnDownloadWg');\n      if (dlBtn) dlBtn.href = `${origin}/${prefix}/wg.conf`;\n    };\n\n    updateSubs(activeProto);\n\n    const btnHttp = document.getElementById('btnProtoHttp');\n    const btnHttps = document.getElementById('btnProtoHttps');\n    if (btnHttp && btnHttps) {\n      btnHttp.classList.toggle('active', activeProto === 'http:');\n      btnHttps.classList.toggle('active', activeProto === 'https:');\n\n      btnHttp.onclick = () => {\n        activeProto = 'http:';\n        btnHttp.classList.add('active');\n        btnHttps.classList.remove('active');\n        updateSubs('http:');\n        showToast('HTTP');\n      };\n      btnHttps.onclick = () => {\n        activeProto = 'https:';\n        btnHttps.classList.add('active');\n        btnHttp.classList.remove('active');\n        updateSubs('https:');\n        showToast('HTTPS');\n      };\n    }\n\n    renderNodes(data.nodes);\n\n  } catch (err) {\n    console.error('Load failed:', err);\n    const c = document.getElementById('nodesContainer');\n    if (c) c.innerHTML = '<p class=\"muted center\" style=\"grid-column:1/-1;padding:32px 0\">Failed to connect.</p>';\n  }\n}\n\ndocument.addEventListener('DOMContentLoaded', () => {\n  route();\n  loadData();\n});\n",
  logoSvg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"currentColor\">\n  <path d=\"M12 4.5c.7 0 1.2.5 1.4 1.1.3.8 1 1.4 1.9 1.6 1.2.2 2.5-.3 3.8-1.3.6-.4 1.4-.2 1.8.4.3.5.2 1.3-.3 1.7-1.3 1.1-2.2 2.4-2.6 3.9-.3 1.1.1 2.3.9 3.2 1.3 1.1 2.9 1.7 4.7 1.7.7 0 1.3.6 1.3 1.3 0 .7-.6 1.3-1.3 1.3-3 0-5.7-1.1-7.8-2.9-.9-.8-2.2-1.3-3.8-1.3s-2.9.5-3.8 1.3c-2.1 1.8-4.8 2.9-7.8 2.9-.7 0-1.3-.6-1.3-1.3 0-.7.6-1.3 1.3-1.3 1.8 0 3.4-.6 4.7-1.7.8-.9 1.2-2.1.9-3.2-.4-1.5-1.3-2.8-2.6-3.9-.5-.4-.6-1.2-.3-1.7.4-.6 1.2-.8 1.8-.4 1.3 1 2.6 1.5 3.8 1.3.9-.2 1.6-.8 1.9-1.6.2-.6.7-1.1 1.4-1.1z\"/>\n</svg>\n"
};

class AssetManager {
  static getIndexHtml() { return EMBEDDED_ASSETS.indexHtml; }
  static getAppCss() { return EMBEDDED_ASSETS.appCss; }
  static getAppJs() { return EMBEDDED_ASSETS.appJs; }
  static getLogoSvg() { return EMBEDDED_ASSETS.logoSvg; }

  static _readFileCandidate(filenames) {
    const names = Array.isArray(filenames) ? filenames : [filenames];
    const dirs = [
      path.join(process.cwd(), 'assets'),
      path.join(__dirname, 'assets'),
      path.join(process.cwd()),
      path.join(__dirname)
    ];
    for (const d of dirs) {
      for (const name of names) {
        const full = path.join(d, name);
        try {
          if (fs.existsSync(full)) {
            const buf = fs.readFileSync(full);
            if (buf && buf.length > 0) return buf;
          }
        } catch (_) {}
      }
    }
    return null;
  }

  static getLogo() {
    const buf = this._readFileCandidate(['logo.svg', 'logo.png']);
    if (buf) return buf;
    return Buffer.from(EMBEDDED_ASSETS.logoSvg, 'utf8');
  }
}


// --- Module: lib/tls-sni.js ---
/**
 * Extracts Server Name Indication (SNI) and ALPN from TLS ClientHello record buffer
 * RFC 5246 / RFC 8446 / RFC 7301 compliant binary parser
 */
function parseClientHello(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 42) {
    return { sni: null, alpn: [] };
  }

  try {
    if (buf[0] !== 0x16 || buf[1] !== 0x03) {
      return { sni: null, alpn: [] };
    }

    let offset = 5;
    if (buf[offset] !== 0x01) {
      return { sni: null, alpn: [] };
    }

    offset += 1 + 3 + 2 + 32;
    if (offset >= buf.length) return { sni: null, alpn: [] };

    const sessionIdLen = buf[offset];
    offset += 1 + sessionIdLen;
    if (offset + 2 > buf.length) return { sni: null, alpn: [] };

    const cipherSuitesLen = buf.readUInt16BE(offset);
    offset += 2 + cipherSuitesLen;
    if (offset + 1 > buf.length) return { sni: null, alpn: [] };

    const compMethodsLen = buf[offset];
    offset += 1 + compMethodsLen;
    if (offset + 2 > buf.length) return { sni: null, alpn: [] };

    const extTotalLen = buf.readUInt16BE(offset);
    offset += 2;
    const extLimit = Math.min(offset + extTotalLen, buf.length);

    let sni = null;
    const alpn = [];

    while (offset + 4 <= extLimit) {
      const extType = buf.readUInt16BE(offset);
      const extLen = buf.readUInt16BE(offset + 2);
      offset += 4;

      if (extType === 0x0000 && !sni) {
        // server_name
        if (offset + 2 <= extLimit) {
          const sniListLen = buf.readUInt16BE(offset);
          let sniOffset = offset + 2;
          const sniLimit = Math.min(sniOffset + sniListLen, extLimit);

          while (sniOffset + 3 <= sniLimit) {
            const nameType = buf[sniOffset];
            const nameLen = buf.readUInt16BE(sniOffset + 1);
            sniOffset += 3;

            if (nameType === 0x00 && sniOffset + nameLen <= buf.length) {
              sni = buf.toString('utf8', sniOffset, sniOffset + nameLen);
              break;
            }
            sniOffset += nameLen;
          }
        }
      } else if (extType === 0x0010) {
        // ALPN (Application-Layer Protocol Negotiation)
        if (offset + 2 <= extLimit) {
          const alpnListLen = buf.readUInt16BE(offset);
          let aOffset = offset + 2;
          const aLimit = Math.min(aOffset + alpnListLen, extLimit);
          while (aOffset + 1 <= aLimit) {
            const pLen = buf[aOffset];
            aOffset++;
            if (aOffset + pLen <= aLimit) {
              alpn.push(buf.toString('utf8', aOffset, aOffset + pLen));
            }
            aOffset += pLen;
          }
        }
      }

      offset += extLen;
    }

    return { sni, alpn };
  } catch {
    return { sni: null, alpn: [] };
  }
}

function parseClientHelloSni(buf) {
  return parseClientHello(buf).sni;
}

function parseClientHelloAlpn(buf) {
  return parseClientHello(buf).alpn;
}


// --- Module: lib/logger.js ---
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  electric: '\x1b[38;5;39m',
  navy: '\x1b[38;5;25m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  white: '\x1b[37m'
};

class Logger {
  static quiet = false;

  static banner() {
    if (this.quiet) return;
    console.log(`\n${ANSI.white}${ANSI.bold}  ======================================================${ANSI.reset}`);
    console.log(`${ANSI.white}${ANSI.bold}  Mavis Panel ${ANSI.dim}• Stealth Single-Port Proxy Gateway${ANSI.reset}`);
    console.log(`${ANSI.white}${ANSI.bold}  ======================================================${ANSI.reset}\n`);
  }

  static renewNotice() {
    // Cleaned up - no promotional renewal notice
  }

  static info(msg) {
    if (!this.quiet) console.log(`${ANSI.cyan}[i] ${msg}${ANSI.reset}`);
  }

  static success(msg) {
    if (!this.quiet) console.log(`${ANSI.green}[OK] ${msg}${ANSI.reset}`);
  }

  static warn(msg) {
    if (!this.quiet) console.log(`${ANSI.yellow}[!] ${msg}${ANSI.reset}`);
  }

  static error(msg) {
    console.error(`${ANSI.red}[X] ${msg}${ANSI.reset}`);
  }

  static step(msg) {
    if (!this.quiet) console.log(`${ANSI.electric}==> ${msg}${ANSI.reset}`);
  }

  static item(label, val) {
    if (!this.quiet) {
      console.log(`  ${ANSI.cyan}${label.padEnd(18)}:${ANSI.reset} ${ANSI.white}${val}${ANSI.reset}`);
    }
  }

  static section(title) {
    if (!this.quiet) {
      console.log(`\n${ANSI.bold}${ANSI.electric}--- ${title} ---${ANSI.reset}`);
    }
  }
}


// --- Module: lib/config.js ---
/**
 * Default configuration template for mavis-panel
 */
const DEFAULT_CONFIG = {
  brand: 'Mavis Panel',
  product: 'Mavis Panel',
  tagline: 'Stealth proxy gateway & single-port multiplexer.',
  publicPort: parseInt(process.env.SERVER_PORT || process.env.PORT || '2705', 10) || 2705,
  panelPath: 'mavis',
  dataDirHint: '/home/container/mavis-data',
  uuid: '',
  domain: '',
  forceHost: '',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || process.env.SUB_BASE_URL || '',
  subBase: process.env.SUB_BASE || '',
  forceHttps: process.env.FORCE_HTTPS === 'true' || false,
  allowLocalHostLinks: false,
  nodePrefix: 'Mavis • ',
  sniHy2: 'www.google.com',
  massProxyUrl: 'https://www.gstatic.com',
  enable: {
    hysteria2: false,
    vlessWs: true,
    vlessWsTls: true,
    vlessHttpUpgrade: true,
    vlessXhttp: false,
    vlessGrpc: true,
    trojanWs: true,
    trojanGrpcTls: true,
    vmessWsTls: true,
    vmessWs: true,
    reality: true,
    shadowTlsVless: false,
    shadowsocks: true,
    wireguard: true,
    tuic: false,
    socks: false,
    httpProxy: false,
    argo: false
  },
  argo: {
    domain: '',
    auth: '',
    localPort: 8001
  },
  reality: {
    target: 'www.microsoft.com',
    targetPort: 443,
    shortId: ''
  },
  shadowTls: {
    sni: 'www.microsoft.com',
    password: ''
  },
  shadowsocks: {
    method: 'aes-256-gcm',
    password: ''
  },
  wireguard: {
    port: 51820,
    serverIp: '10.66.66.1/24',
    clientIp: '10.66.66.2/32',
    mtu: 1420
  },
  tuic: {
    port: 8443,
    congestionController: 'bbr'
  },
  socks: {
    user: '',
    pass: ''
  },
  httpProxy: {
    user: '',
    pass: ''
  },
  singBoxVersion: '1.11.15',
  xrayVersion: '',
  panelToken: '',
  cpuLimitPercent: null,
  quietConsoleAfterMs: 180000
};

/**
 * Determine suitable writable data directory
 */
function resolveDataDir(hint = '/home/container/mavis-data') {
  const customEnv = process.env.MAVIS_DATA_DIR || process.env.BK_DATA_DIR || process.env.FILE_PATH;
  if (customEnv) {
    try {
      fs.mkdirSync(customEnv, { recursive: true });
      fs.accessSync(customEnv, fs.constants.W_OK);
      return customEnv;
    } catch {
      // fallback
    }
  }

  const candidates = [
    hint,
    path.join(__dirname, '..', 'mavis-data'),
    path.join(process.cwd(), 'mavis-data'),
    path.join(os.tmpdir(), 'mavis-data')
  ];

  for (const dir of candidates) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
      return dir;
    } catch {
      // try next
    }
  }

  return path.join(os.tmpdir(), 'mavis-data');
}

/**
 * Merge user runtime config with environment variables and defaults
 */
function buildConfig(userOverrides = {}) {
  const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

  // Merge direct overrides
  if (userOverrides && typeof userOverrides === 'object') {
    for (const [key, val] of Object.entries(userOverrides)) {
      if (val !== undefined && val !== null) {
        if (typeof val === 'object' && !Array.isArray(val) && cfg[key] && typeof cfg[key] === 'object') {
          cfg[key] = { ...cfg[key], ...val };
        } else {
          cfg[key] = val;
        }
      }
    }
  }

  // Environment variables overrides
  const env = process.env;
  const parseBool = (v, defaultVal) => (v !== undefined ? v === '1' || v === 'true' : defaultVal);

  if (env.SERVER_PORT || env.PORT || env.SB_PORT) {
    const parsedPort = parseInt(env.SERVER_PORT || env.PORT || env.SB_PORT, 10);
    if (!isNaN(parsedPort) && parsedPort > 0) {
      cfg.publicPort = parsedPort;
    }
  }
  if (env.UUID || env.SB_UUID) cfg.uuid = env.UUID || env.SB_UUID;
  if (env.DOMAIN || env.SB_DOMAIN) cfg.domain = env.DOMAIN || env.SB_DOMAIN;
  if (env.FORCE_HOST || env.CFIP) cfg.forceHost = env.FORCE_HOST || env.CFIP;
  if (env.ALLOW_LOCALHOST_LINKS !== undefined) cfg.allowLocalHostLinks = parseBool(env.ALLOW_LOCALHOST_LINKS, false);
  if (env.PANEL_PATH || env.SUB_PATH) cfg.panelPath = (env.PANEL_PATH || env.SUB_PATH).replace(/^\//, '');
  if (env.NODE_PREFIX) cfg.nodePrefix = env.NODE_PREFIX;
  if (env.PANEL_TOKEN) cfg.panelToken = env.PANEL_TOKEN;
  if (env.SNI_HY2 || env.SB_SNI) cfg.sniHy2 = env.SNI_HY2 || env.SB_SNI;
  if (env.MASS_PROXY_URL || env.SB_MASS_PROXY) cfg.massProxyUrl = env.MASS_PROXY_URL || env.SB_MASS_PROXY;

  // Protocol switches via env
  if (env.ENABLE_HYSTERIA2 !== undefined) cfg.enable.hysteria2 = parseBool(env.ENABLE_HYSTERIA2, cfg.enable.hysteria2);
  if (env.ENABLE_VLESS_WS !== undefined) cfg.enable.vlessWs = parseBool(env.ENABLE_VLESS_WS, cfg.enable.vlessWs);
  if (env.ENABLE_HTTPUPGRADE !== undefined) cfg.enable.vlessHttpUpgrade = parseBool(env.ENABLE_HTTPUPGRADE, cfg.enable.vlessHttpUpgrade);
  if (env.ENABLE_XHTTP !== undefined) cfg.enable.vlessXhttp = parseBool(env.ENABLE_XHTTP, cfg.enable.vlessXhttp);
  if (env.ENABLE_REALITY !== undefined) cfg.enable.reality = parseBool(env.ENABLE_REALITY, cfg.enable.reality);
  if (env.ENABLE_VLESS_GRPC !== undefined) cfg.enable.vlessGrpc = parseBool(env.ENABLE_VLESS_GRPC, cfg.enable.vlessGrpc);
  if (env.ENABLE_TROJAN_WS !== undefined || env.ENABLE_TROJAN !== undefined) {
    cfg.enable.trojanWs = parseBool(env.ENABLE_TROJAN_WS !== undefined ? env.ENABLE_TROJAN_WS : env.ENABLE_TROJAN, cfg.enable.trojanWs);
  }
  if (env.ENABLE_SHADOWTLS_VLESS !== undefined) cfg.enable.shadowTlsVless = parseBool(env.ENABLE_SHADOWTLS_VLESS, cfg.enable.shadowTlsVless);
  if (env.ENABLE_SS !== undefined) cfg.enable.shadowsocks = parseBool(env.ENABLE_SS, cfg.enable.shadowsocks);
  if (env.ENABLE_WIREGUARD !== undefined || env.ENABLE_WG !== undefined) {
    cfg.enable.wireguard = parseBool(env.ENABLE_WIREGUARD !== undefined ? env.ENABLE_WIREGUARD : env.ENABLE_WG, cfg.enable.wireguard);
  }
  if (env.ENABLE_TUIC !== undefined) cfg.enable.tuic = parseBool(env.ENABLE_TUIC, cfg.enable.tuic);
  if (env.ENABLE_SOCKS !== undefined) cfg.enable.socks = parseBool(env.ENABLE_SOCKS, cfg.enable.socks);
  if (env.ENABLE_HTTP_PROXY !== undefined) cfg.enable.httpProxy = parseBool(env.ENABLE_HTTP_PROXY, cfg.enable.httpProxy);
  if (env.ENABLE_ARGO !== undefined) cfg.enable.argo = parseBool(env.ENABLE_ARGO, cfg.enable.argo);

  if (env.WG_PORT) cfg.wireguard.port = parseInt(env.WG_PORT, 10);
  if (env.WG_SERVER_IP) cfg.wireguard.serverIp = env.WG_SERVER_IP;
  if (env.WG_CLIENT_IP) cfg.wireguard.clientIp = env.WG_CLIENT_IP;

  if (env.TUIC_PORT) cfg.tuic.port = parseInt(env.TUIC_PORT, 10);
  if (env.TUIC_CC) cfg.tuic.congestionController = env.TUIC_CC;

  if (env.ARGO_DOMAIN) cfg.argo.domain = env.ARGO_DOMAIN;
  if (env.ARGO_AUTH) cfg.argo.auth = env.ARGO_AUTH;
  if (env.ARGO_PORT) cfg.argo.localPort = parseInt(env.ARGO_PORT, 10);

  if (env.REALITY_TARGET) cfg.reality.target = env.REALITY_TARGET;
  if (env.REALITY_TARGET_PORT) cfg.reality.targetPort = parseInt(env.REALITY_TARGET_PORT, 10);
  if (env.REALITY_SHORT_ID) cfg.reality.shortId = env.REALITY_SHORT_ID;

  if (env.SHADOWTLS_SNI) cfg.shadowTls.sni = env.SHADOWTLS_SNI;
  if (env.SHADOWTLS_PASSWORD) cfg.shadowTls.password = env.SHADOWTLS_PASSWORD;

  if (env.SS_METHOD) cfg.shadowsocks.method = env.SS_METHOD;
  if (env.SS_PASSWORD) cfg.shadowsocks.password = env.SS_PASSWORD;

  if (env.CPU_LIMIT_PERCENT) cfg.cpuLimitPercent = parseInt(env.CPU_LIMIT_PERCENT, 10);

  // Data paths
  const dataDir = resolveDataDir(cfg.dataDirHint);
  const paths = {
    dataDir,
    stateFile: path.join(dataDir, 'state.json'),
    binDir: path.join(dataDir, 'bin'),
    certDir: path.join(dataDir, 'cert'),
    certPath: path.join(dataDir, 'cert', 'cert.pem'),
    keyPath: path.join(dataDir, 'cert', 'key.pem'),
    singboxBin: path.join(dataDir, 'bin', os.platform() === 'win32' ? 'sing-box.exe' : 'sing-box'),
    singboxConfig: path.join(dataDir, 'sing-box.json'),
    singboxLog: path.join(dataDir, 'sing-box.log'),
    xrayBin: path.join(dataDir, 'bin', os.platform() === 'win32' ? 'xray.exe' : 'xray'),
    xrayConfig: path.join(dataDir, 'xray.json'),
    xrayLog: path.join(dataDir, 'xray.log'),
    cloudflaredBin: path.join(dataDir, 'bin', os.platform() === 'win32' ? 'cloudflared.exe' : 'cloudflared'),
    cloudflaredLog: path.join(dataDir, 'cloudflared.log')
  };

  return {
    ...cfg,
    paths
  };
}

const MAVIS_CONFIG = DEFAULT_CONFIG;
const BK_CONFIG = MAVIS_CONFIG;


// --- Module: lib/ports.js ---
/**
 * Finds an available TCP port on localhost (127.0.0.1)
 */
function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const address = srv.address();
      const port = typeof address === 'object' && address ? address.port : null;
      srv.close((err) => {
        if (err) return reject(err);
        if (!port) return reject(new Error('Failed to resolve ephemeral port'));
        resolve(port);
      });
    });
  });
}

/**
 * Allocates multiple distinct free local ports
 */
async function allocatePorts(count = 1) {
  const ports = [];
  for (let i = 0; i < count; i++) {
    const p = await findFreePort();
    ports.push(p);
  }
  return count === 1 ? ports[0] : ports;
}


// --- Module: lib/state.js ---
function deriveX25519PublicKey(privBase64) {
  try {
    if (!privBase64 || typeof privBase64 !== 'string') return null;
    const privBuf = Buffer.from(privBase64.trim(), 'base64');
    if (privBuf.length !== 32) return null;
    const pkcs8 = Buffer.concat([Buffer.from('302e020100300506032b656e04220420', 'hex'), privBuf]);
    const keyObj = crypto.createPrivateKey({ key: pkcs8, format: 'der', type: 'pkcs8' });
    return crypto.createPublicKey(keyObj).export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64');
  } catch {
    return null;
  }
}

class StateManager {
  constructor(paths, initialConfig) {
    this.paths = paths;
    this.config = initialConfig;
    this.state = {
      uuid: '',
      hy2Password: '',
      hy2ObfsPassword: '',
      realityPrivateKey: '',
      realityPublicKey: '',
      realityShortId: '',
      shadowTlsPassword: '',
      shadowsocksPassword: '',
      wireguardPrivateKey: '',
      wireguardPublicKey: '',
      wireguardClientPrivateKey: '',
      wireguardClientPublicKey: '',
      publicIp: '',
      links: [],
      clashYaml: '',
      singboxJson: '',
      xrayJson: '',
      base64Sub: '',
      updatedAt: null
    };
  }

  loadOrCreate() {
    try {
      fs.mkdirSync(this.paths.dataDir, { recursive: true });
      if (fs.existsSync(this.paths.stateFile)) {
        const raw = fs.readFileSync(this.paths.stateFile, 'utf8');
        const parsed = JSON.parse(raw);
        this.state = { ...this.state, ...parsed };
      }
    } catch (err) {
      Logger.warn(`Failed to read existing state.json: ${err.message}. Generating fresh state.`);
    }

    // UUID
    if (this.config.uuid) {
      this.state.uuid = this.config.uuid;
    } else if (!this.state.uuid) {
      this.state.uuid = crypto.randomUUID();
    }

    // Hysteria2
    this.state.hy2Password = this.state.uuid;
    if (!this.state.hy2ObfsPassword) {
      this.state.hy2ObfsPassword = crypto.randomBytes(8).toString('hex');
    }

    // ShadowTLS
    if (this.config.shadowTls && this.config.shadowTls.password) {
      this.state.shadowTlsPassword = this.config.shadowTls.password;
    } else if (!this.state.shadowTlsPassword) {
      this.state.shadowTlsPassword = crypto.randomBytes(12).toString('hex');
    }

    // Shadowsocks
    if (this.config.shadowsocks && this.config.shadowsocks.password) {
      this.state.shadowsocksPassword = this.config.shadowsocks.password;
    } else if (!this.state.shadowsocksPassword) {
      this.state.shadowsocksPassword = crypto.randomBytes(16).toString('base64url');
    }

    // Reality
    if (this.config.reality && this.config.reality.shortId) {
      this.state.realityShortId = this.config.reality.shortId;
    } else if (!this.state.realityShortId) {
      this.state.realityShortId = crypto.randomBytes(4).toString('hex');
    }

    // WireGuard
    const isValidKey = (k) => typeof k === 'string' && k.trim().length >= 40;
    let srvPriv = this.state.wireguardPrivateKey;
    let srvPub = this.state.wireguardPublicKey;
    let cliPriv = this.state.wireguardClientPrivateKey;
    let cliPub = this.state.wireguardClientPublicKey;

    if (!isValidKey(srvPriv) || !isValidKey(srvPub)) {
      try {
        const srv = crypto.generateKeyPairSync('x25519');
        srvPriv = srv.privateKey.export({ type: 'pkcs8', format: 'der' }).subarray(-32).toString('base64');
        srvPub = srv.publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64');
      } catch (err) {
        Logger.warn(`Failed to generate WireGuard server keypair: ${err.message}`);
      }
    } else {
      const derived = deriveX25519PublicKey(srvPriv);
      if (derived) srvPub = derived;
    }

    if (!isValidKey(cliPriv) || !isValidKey(cliPub)) {
      try {
        const cli = crypto.generateKeyPairSync('x25519');
        cliPriv = cli.privateKey.export({ type: 'pkcs8', format: 'der' }).subarray(-32).toString('base64');
        cliPub = cli.publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64');
      } catch (err) {
        Logger.warn(`Failed to generate WireGuard client keypair: ${err.message}`);
      }
    } else {
      const derived = deriveX25519PublicKey(cliPriv);
      if (derived) cliPub = derived;
    }

    this.state.wireguardPrivateKey = srvPriv;
    this.state.wireguardPublicKey = srvPub;
    this.state.wireguardClientPrivateKey = cliPriv;
    this.state.wireguardClientPublicKey = cliPub;

    this.save();
    return this.state;
  }

  setRealityKeys(privateKey, publicKey) {
    this.state.realityPrivateKey = privateKey;
    this.state.realityPublicKey = publicKey;
    this.save();
  }

  setWireGuardKeys(serverPriv, serverPub, clientPriv, clientPub) {
    this.state.wireguardPrivateKey = serverPriv;
    this.state.wireguardPublicKey = serverPub;
    this.state.wireguardClientPrivateKey = clientPriv;
    this.state.wireguardClientPublicKey = clientPub;
    this.save();
  }

  setLinks(links, clashYaml = '', singboxJson = '', xrayJson = '') {
    this.state.links = links;
    this.state.clashYaml = clashYaml;
    this.state.singboxJson = singboxJson;
    this.state.xrayJson = xrayJson;
    this.state.base64Sub = Buffer.from(links.join('\n')).toString('base64');
    this.save();
  }

  setPublicIp(ip) {
    this.state.publicIp = ip;
    this.save();
  }

  save() {
    try {
      this.state.updatedAt = new Date().toISOString();
      fs.mkdirSync(this.paths.dataDir, { recursive: true });
      fs.writeFileSync(this.paths.stateFile, JSON.stringify(this.state, null, 2), 'utf8');
    } catch (err) {
      Logger.warn(`Could not save state.json: ${err.message}`);
    }
  }
}

StateManager.deriveX25519PublicKey = deriveX25519PublicKey;


// --- Module: lib/binaries.js ---
/**
 * Normalizes system architecture to sing-box and xray standard
 */
function getNormalizedArch() {
  const arch = os.arch();
  if (arch === 'arm64' || arch === 'aarch64') {
    return { sb: 'arm64', xray: 'arm64-v8a', cf: 'arm64' };
  }
  return { sb: 'amd64', xray: '64', cf: 'amd64' };
}

/**
 * Checks free disk space in megabytes using df -m if on Linux
 */
function checkDiskSpaceMb(dir) {
  if (os.platform() !== 'linux') return 1024;
  try {
    const res = spawnSync('df', ['-m', dir], { encoding: 'utf8', timeout: 3000 });
    if (res.status === 0 && res.stdout) {
      const lines = res.stdout.trim().split('\n');
      if (lines.length >= 2) {
        const parts = lines[1].trim().split(/\s+/);
        const avail = parseInt(parts[3], 10);
        if (!isNaN(avail)) return avail;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Download a file with timeout and streaming
 */
async function downloadToFile(url, destPath) {
  const tempPath = `${destPath}.tmp_${Date.now()}`;
  const writer = fs.createWriteStream(tempPath);

  try {
    const resp = await axios({
      method: 'get',
      url,
      responseType: 'stream',
      timeout: 60000,
      headers: {
        'User-Agent': 'mavis-panel/1.0'
      }
    });

    await new Promise((resolve, reject) => {
      resp.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    fs.renameSync(tempPath, destPath);
    if (os.platform() !== 'win32') {
      fs.chmodSync(destPath, 0o755);
    }
    return true;
  } catch (err) {
    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch {}
    throw err;
  }
}

class BinaryManager {
  constructor(config) {
    this.config = config;
    this.paths = config.paths;
    this.arch = getNormalizedArch();
  }

  ensureDirectories() {
    fs.mkdirSync(this.paths.dataDir, { recursive: true });
    fs.mkdirSync(this.paths.binDir, { recursive: true });
    fs.mkdirSync(this.paths.certDir, { recursive: true });
  }

  async ensureSingBox() {
    this.ensureDirectories();
    const bin = this.paths.singboxBin;

    // Check if valid executable already exists
    if (fs.existsSync(bin)) {
      try {
        const stat = fs.statSync(bin);
        if (stat.size > 1024 * 1024) {
          if (os.platform() !== 'win32') fs.chmodSync(bin, 0o755);
          return true;
        }
      } catch {}
    }

    const freeMb = checkDiskSpaceMb(this.paths.binDir);
    if (freeMb !== null && freeMb < 40) {
      Logger.warn(`Low disk space (~${freeMb}MB free). sing-box download might fail with ENOSPC.`);
    }

    const ver = this.config.singBoxVersion || '1.11.15';
    const osType = os.platform() === 'win32' ? 'windows' : 'linux';
    const ext = osType === 'windows' ? 'zip' : 'tar.gz';
    const tarName = `sing-box-${ver}-${osType}-${this.arch.sb}.${ext}`;
    const url = process.env.SB_URL || `https://github.com/SagerNet/sing-box/releases/download/v${ver}/${tarName}`;
    const archivePath = path.join(this.paths.binDir, tarName);

    Logger.step(`Downloading sing-box v${ver} (${osType}-${this.arch.sb})...`);

    try {
      await downloadToFile(url, archivePath);

      if (osType === 'linux') {
        const extDir = path.join(this.paths.binDir, `sb_extract_${Date.now()}`);
        fs.mkdirSync(extDir, { recursive: true });
        const tarRes = spawnSync('tar', ['-xzf', archivePath, '-C', extDir]);
        if (tarRes.status !== 0) throw new Error(`tar extraction failed: ${tarRes.stderr}`);

        const files = fs.readdirSync(extDir);
        let foundBin = null;
        for (const f of files) {
          const sub = path.join(extDir, f);
          if (fs.statSync(sub).isDirectory()) {
            const candidate = path.join(sub, 'sing-box');
            if (fs.existsSync(candidate)) {
              foundBin = candidate;
              break;
            }
          }
        }

        if (!foundBin && fs.existsSync(path.join(extDir, 'sing-box'))) {
          foundBin = path.join(extDir, 'sing-box');
        }

        if (!foundBin) throw new Error('sing-box binary not found in archive');

        fs.copyFileSync(foundBin, bin);
        fs.chmodSync(bin, 0o755);

        try {
          fs.unlinkSync(archivePath);
          fs.rmSync(extDir, { recursive: true, force: true });
        } catch {}
      }

      Logger.success('sing-box engine installed successfully.');
      return true;
    } catch (err) {
      Logger.error(`sing-box installation error: ${err.message}`);
      return false;
    }
  }

  async ensureXray() {
    this.ensureDirectories();
    const bin = this.paths.xrayBin;

    if (fs.existsSync(bin)) {
      try {
        const stat = fs.statSync(bin);
        if (stat.size > 1024 * 1024) {
          if (os.platform() !== 'win32') fs.chmodSync(bin, 0o755);
          return true;
        }
      } catch {}
    }

    const freeMb = checkDiskSpaceMb(this.paths.binDir);
    if (freeMb !== null && freeMb < 40) {
      Logger.warn(`Low disk space (~${freeMb}MB free). Skipping optional Xray-core.`);
      return false;
    }

    const osType = os.platform() === 'win32' ? 'windows' : 'linux';
    const zipName = `Xray-${osType}-${this.arch.xray}.zip`;
    const url = this.config.xrayVersion
      ? `https://github.com/XTLS/Xray-core/releases/download/v${this.config.xrayVersion}/${zipName}`
      : `https://github.com/XTLS/Xray-core/releases/latest/download/${zipName}`;
    const archivePath = path.join(this.paths.binDir, zipName);

    Logger.step(`Downloading optional Xray-core (${osType}-${this.arch.xray})...`);

    try {
      await downloadToFile(url, archivePath);
      const extDir = path.join(this.paths.binDir, `xray_extract_${Date.now()}`);
      fs.mkdirSync(extDir, { recursive: true });

      const unzipRes = spawnSync('unzip', ['-o', archivePath, '-d', extDir]);
      if (unzipRes.status !== 0) throw new Error(`unzip failed: ${unzipRes.stderr}`);

      const candidate = path.join(extDir, os.platform() === 'win32' ? 'xray.exe' : 'xray');
      if (!fs.existsSync(candidate)) throw new Error('xray binary missing after unzip');

      fs.copyFileSync(candidate, bin);
      if (os.platform() !== 'win32') fs.chmodSync(bin, 0o755);

      try {
        fs.unlinkSync(archivePath);
        fs.rmSync(extDir, { recursive: true, force: true });
      } catch {}

      Logger.success('Xray-core engine installed successfully.');
      return true;
    } catch (err) {
      Logger.warn(`Optional Xray-core download skipped: ${err.message}. XHTTP will be disabled.`);
      return false;
    }
  }

  async ensureCloudflared() {
    this.ensureDirectories();
    const bin = this.paths.cloudflaredBin;

    if (fs.existsSync(bin)) {
      try {
        if (fs.statSync(bin).size > 1024 * 1024) {
          if (os.platform() !== 'win32') fs.chmodSync(bin, 0o755);
          return true;
        }
      } catch {}
    }

    const url = os.platform() === 'win32'
      ? `https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-${this.arch.cf === 'arm64' ? 'arm64' : 'amd64'}.exe`
      : `https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${this.arch.cf}`;

    Logger.step('Downloading optional Cloudflare Argo tunnel agent (cloudflared)...');

    try {
      await downloadToFile(url, bin);
      if (os.platform() !== 'win32') fs.chmodSync(bin, 0o755);
      Logger.success('cloudflared installed successfully.');
      return true;
    } catch (err) {
      Logger.warn(`Optional cloudflared download skipped: ${err.message}. Argo tunnel will be inactive.`);
      return false;
    }
  }
}


// --- Module: lib/cert.js ---
function asn1(tag, ...children) {
  const content = Buffer.concat(children);
  let len;
  if (content.length < 128) {
    len = Buffer.from([content.length]);
  } else if (content.length < 256) {
    len = Buffer.from([0x81, content.length]);
  } else if (content.length < 65536) {
    len = Buffer.from([0x82, (content.length >> 8) & 0xff, content.length & 0xff]);
  } else {
    len = Buffer.from([0x83, (content.length >> 16) & 0xff, (content.length >> 8) & 0xff, content.length & 0xff]);
  }
  return Buffer.concat([Buffer.from([tag]), len, content]);
}

function seq(...ch) { return asn1(0x30, ...ch); }
function int(val) { return asn1(0x02, Buffer.isBuffer(val) ? val : Buffer.from([val])); }
function oid(bytes) { return asn1(0x06, Buffer.from(bytes)); }
function utf8(str) { return asn1(0x0c, Buffer.from(str, 'utf8')); }
function utcTime(d) {
  const pad = n => String(n).padStart(2, '0');
  const s = String(d.getUTCFullYear()).slice(2) + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
  return asn1(0x17, Buffer.from(s, 'ascii'));
}

function generateSelfSignedCert(commonName = 'localhost') {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const spkiDer = publicKey.export({ type: 'spki', format: 'der' });

  // sha256WithRSAEncryption: 1.2.840.113549.1.1.11
  const sigAlg = seq(oid([0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x0b]), Buffer.from([0x05, 0x00]));
  const name = seq(asn1(0x31, seq(oid([0x55, 0x04, 0x03]), utf8(commonName))));
  const now = new Date();
  const notAfter = new Date(now.getTime() + 365 * 24 * 3600 * 1000);
  const validity = seq(utcTime(now), utcTime(notAfter));
  const serial = crypto.randomBytes(8);
  serial[0] &= 0x7f;

  const tbs = seq(
    asn1(0xa0, int(2)), // v3
    int(serial),
    sigAlg,
    name,
    validity,
    name,
    spkiDer
  );

  const sig = crypto.sign('sha256', tbs, privateKey);
  const bitSig = Buffer.concat([Buffer.from([0x00]), sig]);
  const certDer = seq(tbs, sigAlg, asn1(0x03, bitSig));
  const certPem = '-----BEGIN CERTIFICATE-----\n' + certDer.toString('base64').match(/.{1,64}/g).join('\n') + '\n-----END CERTIFICATE-----\n';
  const keyPem = privateKey.export({ type: 'pkcs8', format: 'pem' });

  return { certPem, keyPem };
}

function ensureTlsCertificates(certPath, keyPath, sni = 'localhost') {
  try {
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      const c = fs.readFileSync(certPath, 'utf8');
      const k = fs.readFileSync(keyPath, 'utf8');
      if (c.includes('BEGIN CERTIFICATE') && k.includes('PRIVATE KEY')) {
        return { cert: c, key: k };
      }
    }
  } catch (_) {}

  const certDir = path.dirname(certPath);
  try {
    fs.mkdirSync(certDir, { recursive: true });
  } catch (_) {}

  // 1. Try openssl if available
  try {
    const res = spawnSync('openssl', [
      'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
      '-subj', `/CN=${sni}`,
      '-keyout', keyPath,
      '-out', certPath,
      '-days', '365'
    ], { timeout: 15000 });
    if (res.status === 0 && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      return {
        cert: fs.readFileSync(certPath, 'utf8'),
        key: fs.readFileSync(keyPath, 'utf8')
      };
    }
  } catch (_) {}

  // 2. Pure JS fallback
  try {
    const { certPem, keyPem } = generateSelfSignedCert(sni);
    fs.writeFileSync(keyPath, keyPem, 'utf8');
    fs.writeFileSync(certPath, certPem, 'utf8');
    return { cert: certPem, key: keyPem };
  } catch (err) {
    Logger.error(`Failed to generate TLS cert: ${err.message}`);
    return null;
  }
}


// --- Module: lib/engines/singbox.js ---
class SingBoxEngine {
  constructor(config, stateManager, allocatedPorts) {
    this.config = config;
    this.paths = config.paths;
    this.stateManager = stateManager;
    this.ports = allocatedPorts;
    this.process = null;
  }

  generateRealityKeys() {
    const state = this.stateManager.state;
    if (state.realityPrivateKey && state.realityPublicKey) {
      return;
    }

    if (fs.existsSync(this.paths.singboxBin)) {
      try {
        const res = spawnSync(this.paths.singboxBin, ['generate', 'reality-keypair'], {
          encoding: 'utf8',
          timeout: 10000
        });
        const privMatch = /PrivateKey:\s*(\S+)/i.exec(res.stdout || '');
        const pubMatch = /PublicKey:\s*(\S+)/i.exec(res.stdout || '');

        if (privMatch && pubMatch) {
          this.stateManager.setRealityKeys(privMatch[1], pubMatch[1]);
          Logger.success('Generated fresh REALITY keypair.');
          return;
        }
      } catch (_) {}
    }

    // Fallback: Node crypto x25519 keypair
    try {
      const kp = crypto.generateKeyPairSync('x25519');
      const priv = kp.privateKey.export({ type: 'pkcs8', format: 'der' }).subarray(-32).toString('base64url');
      const pub = kp.publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64url');
      this.stateManager.setRealityKeys(priv, pub);
      Logger.success('Generated fresh REALITY keypair via crypto.');
    } catch (err) {
      Logger.warn(`Reality keygen error: ${err.message}.`);
    }
  }

  buildJsonConfig() {
    const state = this.stateManager.state;
    const enable = this.config.enable;
    const wsPath = '/mavis-ws';
    const vmessPath = '/mavis-vmess';
    const huPath = '/mavis-httpupgrade';

    const inbounds = [];

    // 1. VMess + WebSocket (TCP) local inbound
    if ((enable.vmessWs || enable.vmessWsTls) && this.ports.vmessWs) {
      inbounds.push({
        type: 'vmess',
        tag: 'vmess-ws-in',
        listen: '127.0.0.1',
        listen_port: this.ports.vmessWs,
        users: [
          { uuid: state.uuid, alterId: 0 }
        ],
        transport: {
          type: 'ws',
          path: vmessPath,
          max_early_data: 2560,
          early_data_header_name: 'Sec-WebSocket-Protocol'
        }
      });
    }

    // 2. VLESS + WebSocket (TCP) local inbound
    if (enable.vlessWs && this.ports.vlessWs) {
      inbounds.push({
        type: 'vless',
        tag: 'vless-ws-in',
        listen: '127.0.0.1',
        listen_port: this.ports.vlessWs,
        users: [
          { uuid: state.uuid, flow: '' }
        ],
        tls: { enabled: false },
        transport: {
          type: 'ws',
          path: wsPath,
          max_early_data: 2560,
          early_data_header_name: 'Sec-WebSocket-Protocol'
        }
      });
    }

    // 2b. VLESS + WebSocket + TLS local inbound
    if (enable.vlessWsTls && this.ports.vlessWsTls) {
      ensureTlsCertificates(this.paths.certPath, this.paths.keyPath, this.config.domain || 'www.google.com');
      inbounds.push({
        type: 'vless',
        tag: 'vless-ws-tls-in',
        listen: '127.0.0.1',
        listen_port: this.ports.vlessWsTls,
        users: [
          { uuid: state.uuid, flow: '' }
        ],
        tls: {
          enabled: true,
          server_name: this.config.domain || 'www.google.com',
          alpn: ['http/1.1'],
          certificate_path: this.paths.certPath,
          key_path: this.paths.keyPath
        },
        transport: {
          type: 'ws',
          path: wsPath,
          max_early_data: 2560,
          early_data_header_name: 'Sec-WebSocket-Protocol'
        }
      });
    }

    // 3. VLESS + HTTPUpgrade (TCP) local inbound
    if (enable.vlessHttpUpgrade && this.ports.vlessHu) {
      inbounds.push({
        type: 'vless',
        tag: 'vless-hu-in',
        listen: '127.0.0.1',
        listen_port: this.ports.vlessHu,
        users: [
          { uuid: state.uuid, flow: '' }
        ],
        tls: { enabled: false },
        transport: {
          type: 'httpupgrade',
          path: huPath
        }
      });
    }

    // 4. VLESS + REALITY (TCP) local inbound
    if (enable.reality && this.ports.reality && state.realityPrivateKey) {
      inbounds.push({
        type: 'vless',
        tag: 'vless-reality-in',
        listen: '127.0.0.1',
        listen_port: this.ports.reality,
        users: [
          { uuid: state.uuid, flow: 'xtls-rprx-vision' }
        ],
        tls: {
          enabled: true,
          server_name: this.config.reality.target || 'www.microsoft.com',
          alpn: ['http/1.1'],
          reality: {
            enabled: true,
            handshake: {
              server: this.config.reality.target || 'www.microsoft.com',
              server_port: this.config.reality.targetPort || 443
            },
            private_key: state.realityPrivateKey,
            short_id: [state.realityShortId]
          }
        }
      });
    }

    // 5. ShadowTLS v3 + VLESS detour
    if (enable.shadowTlsVless && this.ports.shadowTls) {
      inbounds.push(
        {
          type: 'shadowtls',
          tag: 'shadowtls-in',
          listen: '127.0.0.1',
          listen_port: this.ports.shadowTls,
          version: 3,
          users: [
            { name: 'mavis-user', password: state.shadowTlsPassword }
          ],
          handshake: {
            server: this.config.shadowTls.sni || 'www.microsoft.com',
            server_port: 443
          },
          strict_mode: true,
          detour: 'vless-shadowtls-detour'
        },
        {
          type: 'vless',
          tag: 'vless-shadowtls-detour',
          listen: '127.0.0.1',
          listen_port: 0,
          users: [
            { uuid: state.uuid, flow: '' }
          ]
        }
      );
    }

    // 6. Shadowsocks (TCP) local inbound
    if (enable.shadowsocks && this.ports.shadowsocks) {
      inbounds.push({
        type: 'shadowsocks',
        tag: 'ss-in',
        listen: '127.0.0.1',
        listen_port: this.ports.shadowsocks,
        method: this.config.shadowsocks.method || 'aes-256-gcm',
        password: state.shadowsocksPassword
      });
    }

    // 7. SOCKS5 (TCP) local inbound
    if (enable.socks && this.ports.socks) {
      inbounds.push({
        type: 'socks',
        tag: 'socks-in',
        listen: '127.0.0.1',
        listen_port: this.ports.socks,
        users: this.config.socks.user
          ? [{ username: this.config.socks.user, password: this.config.socks.pass }]
          : []
      });
    }

    // 8. Plain HTTP Proxy local inbound
    if (enable.httpProxy && this.ports.httpProxy) {
      inbounds.push({
        type: 'http',
        tag: 'http-in',
        listen: '127.0.0.1',
        listen_port: this.ports.httpProxy,
        users: this.config.httpProxy.user
          ? [{ username: this.config.httpProxy.user, password: this.config.httpProxy.pass }]
          : []
      });
    }

    // 9. Trojan + WebSocket (TCP) local inbound
    if (enable.trojanWs && this.ports.trojanWs) {
      inbounds.push({
        type: 'trojan',
        tag: 'trojan-ws-in',
        listen: '127.0.0.1',
        listen_port: this.ports.trojanWs,
        users: [
          { password: state.uuid }
        ],
        transport: {
          type: 'ws',
          path: '/mavis-trojan'
        }
      });
    }

    // 9b. Trojan + gRPC + TLS local inbound
    if (enable.trojanGrpcTls && this.ports.trojanGrpcTls) {
      ensureTlsCertificates(this.paths.certPath, this.paths.keyPath, this.config.domain || 'www.google.com');
      inbounds.push({
        type: 'trojan',
        tag: 'trojan-grpc-tls-in',
        listen: '127.0.0.1',
        listen_port: this.ports.trojanGrpcTls,
        users: [
          { password: state.uuid }
        ],
        tls: {
          enabled: true,
          server_name: this.config.domain || 'www.google.com',
          alpn: ['h2'],
          certificate_path: this.paths.certPath,
          key_path: this.paths.keyPath
        },
        transport: {
          type: 'grpc',
          service_name: 'mavis-grpc'
        }
      });
    }

    // 10. VLESS + gRPC (TCP) local inbound
    if (enable.vlessGrpc && this.ports.vlessGrpc) {
      inbounds.push({
        type: 'vless',
        tag: 'vless-grpc-in',
        listen: '127.0.0.1',
        listen_port: this.ports.vlessGrpc,
        users: [
          { uuid: state.uuid, flow: '' }
        ],
        tls: { enabled: false },
        transport: {
          type: 'grpc',
          service_name: 'mavis-grpc'
        }
      });
    }

    // 11. TUIC v5 inbound (UDP)
    if (enable.tuic && this.config.tuic) {
      inbounds.push({
        type: 'tuic',
        tag: 'tuic-in',
        listen: '::',
        listen_port: this.config.tuic.port || 8443,
        users: [
          { uuid: state.uuid, password: state.uuid }
        ],
        congestion_controller: this.config.tuic.congestionController || 'bbr',
        tls: {
          enabled: true,
          server_name: this.config.sniHy2 || 'www.google.com',
          alpn: ['h3'],
          certificate_path: this.paths.certPath,
          key_path: this.paths.keyPath
        }
      });
    }

    const cfg = {
      log: {
        level: 'info',
        timestamp: true
      },
      inbounds,
      outbounds: [
        { type: 'direct', tag: 'direct' },
        { type: 'block', tag: 'block' }
      ],
      route: {
        auto_detect_interface: true,
        final: 'direct'
      }
    };

    // WireGuard under endpoints (NOT inbounds)
    if (enable.wireguard && this.config.wireguard && state.wireguardPrivateKey && state.wireguardClientPublicKey) {
      const wgPort = (this.config.wireguard && this.config.wireguard.port) || 51820;
      cfg.endpoints = [
        {
          type: 'wireguard',
          tag: 'wg-in',
          system: false,
          name: 'mavis-wg0',
          mtu: this.config.wireguard.mtu || 1420,
          address: [this.config.wireguard.serverIp || '10.66.66.1/24'],
          private_key: state.wireguardPrivateKey,
          listen_port: wgPort,
          peers: [
            {
              public_key: state.wireguardClientPublicKey,
              allowed_ips: [this.config.wireguard.clientIp || '10.66.66.2/32']
            }
          ]
        }
      ];
    }

    return cfg;
  }

  testConfigSync(cfgObj) {
    const tmpFile = path.join(this.paths.dataDir, `test-check-${Date.now()}.json`);
    try {
      fs.writeFileSync(tmpFile, JSON.stringify(cfgObj, null, 2), 'utf8');
      const res = spawnSync(this.paths.singboxBin, ['check', '-c', tmpFile], {
        encoding: 'utf8',
        timeout: 8000
      });
      try { fs.unlinkSync(tmpFile); } catch {}
      return {
        ok: res.status === 0,
        error: (res.stderr || res.stdout || '').trim()
      };
    } catch (err) {
      try { fs.unlinkSync(tmpFile); } catch {}
      return { ok: false, error: err.message };
    }
  }

  validateAndSanitize(configData) {
    let check = this.testConfigSync(configData);
    if (check.ok) return configData;

    Logger.warn(`sing-box initial check reported: ${check.error}. Running resilience auto-fix...`);

    if (configData.endpoints && configData.endpoints.length > 0) {
      delete configData.endpoints;
      check = this.testConfigSync(configData);
      if (check.ok) {
        Logger.warn('sing-box validated after omitting endpoints. Core engines running.');
        return configData;
      }
    }

    const optionalTags = ['tuic-in', 'vless-grpc-in', 'trojan-ws-in', 'socks-in', 'http-in', 'shadowtls-in', 'vless-shadowtls-detour'];
    for (const tag of optionalTags) {
      const idx = configData.inbounds.findIndex(ib => ib.tag === tag);
      if (idx !== -1) {
        configData.inbounds.splice(idx, 1);
        check = this.testConfigSync(configData);
        if (check.ok) {
          Logger.warn(`sing-box validated after stripping ${tag}. Continuing with stable inbounds.`);
          return configData;
        }
      }
    }

    const coreTags = ['hy2-in', 'vless-ws-in', 'vless-reality-in', 'ss-in'];
    configData.inbounds = configData.inbounds.filter(ib => coreTags.includes(ib.tag));
    check = this.testConfigSync(configData);
    if (check.ok) {
      Logger.warn('sing-box validated with minimum core inbounds (VLESS-WS, REALITY, Shadowsocks).');
      return configData;
    }

    return null;
  }

  start() {
    if (!fs.existsSync(this.paths.singboxBin)) {
      Logger.warn('sing-box executable missing. Core engine skipped.');
      return false;
    }

    ensureTlsCertificates(this.paths.certPath, this.paths.keyPath, this.config.sniHy2);
    this.generateRealityKeys();

    let configData = this.buildJsonConfig();
    configData = this.validateAndSanitize(configData);

    if (!configData) {
      Logger.error('sing-box validation failed completely even after auto-fix attempts.');
      return false;
    }

    fs.writeFileSync(this.paths.singboxConfig, JSON.stringify(configData, null, 2), 'utf8');
    Logger.success('sing-box configuration validated.');

    const logFd = fs.openSync(this.paths.singboxLog, 'a');
    this.process = spawn(this.paths.singboxBin, ['run', '-c', this.paths.singboxConfig], {
      stdio: ['ignore', logFd, logFd],
      detached: false
    });

    this.process.on('error', (err) => {
      Logger.error(`sing-box process error: ${err.message}`);
    });

    this.process.on('exit', (code, sig) => {
      try { fs.closeSync(logFd); } catch {}
      if (code !== 0 && code !== null) {
        Logger.warn(`sing-box exited with code ${code} (${sig || 'none'})`);
      }
    });

    return true;
  }

  stop() {
    if (this.process && !this.process.killed) {
      try {
        this.process.kill('SIGTERM');
      } catch {}
    }
  }
}


// --- Module: lib/engines/xray.js ---
class XrayEngine {
  constructor(config, stateManager, localPort) {
    this.config = config;
    this.paths = config.paths;
    this.stateManager = stateManager;
    this.port = localPort;
    this.process = null;
  }

  buildConfig() {
    const state = this.stateManager.state;
    const xhttpPath = `/${this.config.panelPath}-xh`;

    return {
      log: {
        loglevel: 'warning'
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

    const logFd = fs.openSync(this.paths.xrayLog, 'a');
    this.process = spawn(this.paths.xrayBin, ['run', '-c', this.paths.xrayConfig], {
      stdio: ['ignore', logFd, logFd],
      detached: false
    });

    this.process.on('error', (err) => {
      Logger.warn(`Xray engine error: ${err.message}`);
    });

    this.process.on('exit', () => {
      try { fs.closeSync(logFd); } catch {}
    });

    Logger.success(`Xray-core (XHTTP) running on local port ${this.port}.`);
    return true;
  }

  stop() {
    if (this.process && !this.process.killed) {
      try {
        this.process.kill('SIGTERM');
      } catch {}
    }
  }
}


// --- Module: lib/engines/argo.js ---
class ArgoTunnel {
  constructor(config, targetPort) {
    this.config = config;
    this.paths = config.paths;
    this.targetPort = targetPort;
    this.process = null;
    this.tunnelDomain = '';
  }

  async discoverDomain(timeoutMs = 45000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      for (const p of [2000, 2001, 2002]) {
        try {
          const resp = await axios.get(`http://127.0.0.1:${p}/quicktunnel`, { timeout: 1500 });
          if (resp.data && resp.data.hostname) {
            return resp.data.hostname.replace(/^https?:\/\//, '').trim().toLowerCase();
          }
        } catch {}
      }

      if (fs.existsSync(this.paths.cloudflaredLog)) {
        try {
          const logContent = fs.readFileSync(this.paths.cloudflaredLog, 'utf8');
          const match = logContent.match(/https?:\/\/([a-z0-9-]+\.trycloudflare\.com)/i);
          if (match) {
            return match[1].toLowerCase();
          }
        } catch {}
      }

      await new Promise(r => setTimeout(r, 2000));
    }
    return null;
  }

  async start() {
    if (!this.config.enable.argo || !fs.existsSync(this.paths.cloudflaredBin)) {
      return null;
    }

    // Named tunnel
    if (this.config.argo.auth && this.config.argo.domain) {
      this.tunnelDomain = this.config.argo.domain;
      Logger.success(`Cloudflare named tunnel active: ${this.tunnelDomain}`);
      return this.tunnelDomain;
    }

    // Quick tunnel
    Logger.step('Launching Cloudflare Argo Quick Tunnel...');
    const logFd = fs.openSync(this.paths.cloudflaredLog, 'a');

    this.process = spawn(this.paths.cloudflaredBin, [
      'tunnel', '--no-autoupdate', '--metrics', '127.0.0.1:2000',
      '--url', `http://127.0.0.1:${this.targetPort}`
    ], {
      stdio: ['ignore', logFd, logFd],
      detached: false
    });

    this.process.on('exit', () => {
      try { fs.closeSync(logFd); } catch {}
    });

    this.tunnelDomain = await this.discoverDomain();
    if (this.tunnelDomain) {
      Logger.success(`Argo Quick Tunnel ready: ${this.tunnelDomain}`);
    } else {
      Logger.warn('Argo tunnel domain could not be resolved within timeout.');
    }

    return this.tunnelDomain;
  }

  stop() {
    if (this.process && !this.process.killed) {
      try { this.process.kill('SIGTERM'); } catch {}
    }
  }
}


// --- Module: lib/panel/validator.js ---
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


// --- Module: lib/panel/links.js ---
/**
 * Link and subscription configuration generator for mavis-panel
 */



function urlSafeEncode(str) {
  return encodeURIComponent(str);
}

function yamlSafeQuote(str) {
  return `"${String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function deriveX25519PublicKey(privBase64) {
  try {
    if (!privBase64 || typeof privBase64 !== 'string') return null;
    const privBuf = Buffer.from(privBase64.trim(), 'base64');
    if (privBuf.length !== 32) return null;
    const pkcs8 = Buffer.concat([Buffer.from('302e020100300506032b656e04220420', 'hex'), privBuf]);
    const keyObj = crypto.createPrivateKey({ key: pkcs8, format: 'der', type: 'pkcs8' });
    return crypto.createPublicKey(keyObj).export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64');
  } catch {
    return null;
  }
}

class LinkGenerator {
  constructor(config, state, resolvedHost) {
    this.config = config;
    this.state = state;
    this.host = config.forceHost || resolvedHost || config.domain || '127.0.0.1';
    this.port = config.publicPort;
    this.prefix = config.nodePrefix || 'mavis - ';
    this.wsPath = '/mavis-ws';
    this.vmessPath = '/mavis-vmess';
    this.huPath = '/mavis-httpupgrade';
    this.xhPath = '/mavis-xhttp';
    this.trPath = '/mavis-trojan';
    this.grpcService = 'mavis-grpc';
  }

  generateHysteria2() {
    return null; // Hysteria removed as requested
  }

  generateVlessWs() {
    if (!this.config.enable.vlessWs) return null;
    const name = `${this.prefix}WS`;
    const clashProxy = {
      name,
      type: 'vless',
      server: this.host,
      port: this.port,
      uuid: this.state.uuid,
      network: 'ws',
      tls: false,
      'ws-opts': {
        path: this.wsPath,
        headers: { Host: this.host }
      }
    };
    const sbOutbound = {
      type: 'vless',
      tag: name,
      server: this.host,
      server_port: this.port,
      uuid: this.state.uuid,
      transport: {
        type: 'ws',
        path: this.wsPath,
        headers: { Host: this.host }
      }
    };
    return {
      name,
      type: 'VLESS-WS',
      label: 'WebSocket Direct / CDN',
      compat: true,
      uri: `vless://${this.state.uuid}@${this.host}:${this.port}?encryption=none&security=none&type=ws&host=${this.host}&path=${urlSafeEncode(this.wsPath)}#${urlSafeEncode(name)}`,
      clash: clashProxy,
      singboxOutbound: [sbOutbound],
      singboxJson: JSON.stringify([sbOutbound], null, 2)
    };
  }

  generateVlessWsTls() {
    if (!this.config.enable.vlessWsTls) return null;
    const name = `${this.prefix}WS-TLS`;
    const sni = this.config.domain || this.host;
    const clashProxy = {
      name,
      type: 'vless',
      server: this.host,
      port: this.port,
      uuid: this.state.uuid,
      network: 'ws',
      tls: true,
      servername: sni,
      'skip-cert-verify': true,
      'ws-opts': {
        path: this.wsPath,
        headers: { Host: sni }
      }
    };
    const sbOutbound = {
      type: 'vless',
      tag: name,
      server: this.host,
      server_port: this.port,
      uuid: this.state.uuid,
      tls: {
        enabled: true,
        server_name: sni,
        insecure: true
      },
      transport: {
        type: 'ws',
        path: this.wsPath,
        headers: { Host: sni }
      }
    };
    return {
      name,
      type: 'VLESS-WS-TLS',
      label: 'CDN Cloudflare Compatible',
      compat: true,
      uri: `vless://${this.state.uuid}@${this.host}:${this.port}?encryption=none&security=tls&sni=${sni}&type=ws&host=${sni}&path=${urlSafeEncode(this.wsPath)}&fp=chrome&allowInsecure=1#${urlSafeEncode(name)}`,
      clash: clashProxy,
      singboxOutbound: [sbOutbound],
      singboxJson: JSON.stringify([sbOutbound], null, 2)
    };
  }

  generateVmessWsTls() {
    if (!this.config.enable.vmessWsTls) return null;
    const name = `${this.prefix}VMess-WS-TLS`;
    const sni = this.config.domain || this.host;
    const vmessConfig = {
      v: '2',
      ps: name,
      add: this.host,
      port: String(this.port),
      id: this.state.uuid,
      aid: '0',
      scy: 'auto',
      net: 'ws',
      type: 'none',
      host: sni,
      path: this.vmessPath,
      tls: 'tls',
      sni: sni,
      alpn: 'http/1.1',
      fp: 'chrome'
    };
    const uri = 'vmess://' + Buffer.from(JSON.stringify(vmessConfig)).toString('base64');
    const clashProxy = {
      name,
      type: 'vmess',
      server: this.host,
      port: this.port,
      uuid: this.state.uuid,
      alterId: 0,
      cipher: 'auto',
      network: 'ws',
      tls: true,
      servername: sni,
      'skip-cert-verify': true,
      'ws-opts': {
        path: this.vmessPath,
        headers: { Host: sni }
      }
    };
    const sbOutbound = {
      type: 'vmess',
      tag: name,
      server: this.host,
      server_port: this.port,
      uuid: this.state.uuid,
      alter_id: 0,
      security: 'auto',
      tls: {
        enabled: true,
        server_name: sni,
        insecure: true
      },
      transport: {
        type: 'ws',
        path: this.vmessPath,
        headers: { Host: sni }
      }
    };
    return {
      name,
      type: 'VMess-WS-TLS',
      label: 'Classic Universal Client',
      compat: true,
      uri,
      clash: clashProxy,
      singboxOutbound: [sbOutbound],
      singboxJson: JSON.stringify([sbOutbound], null, 2)
    };
  }

  generateVmessWs() {
    if (!this.config.enable.vmessWs) return null;
    const name = `${this.prefix}VMess-WS`;
    const vmessConfig = {
      v: '2',
      ps: name,
      add: this.host,
      port: String(this.port),
      id: this.state.uuid,
      aid: '0',
      scy: 'auto',
      net: 'ws',
      type: 'none',
      host: this.host,
      path: this.vmessPath,
      tls: 'none'
    };
    const uri = 'vmess://' + Buffer.from(JSON.stringify(vmessConfig)).toString('base64');
    const clashProxy = {
      name,
      type: 'vmess',
      server: this.host,
      port: this.port,
      uuid: this.state.uuid,
      alterId: 0,
      cipher: 'auto',
      network: 'ws',
      tls: false,
      'ws-opts': {
        path: this.vmessPath,
        headers: { Host: this.host }
      }
    };
    const sbOutbound = {
      type: 'vmess',
      tag: name,
      server: this.host,
      server_port: this.port,
      uuid: this.state.uuid,
      alter_id: 0,
      security: 'auto',
      transport: {
        type: 'ws',
        path: this.vmessPath,
        headers: { Host: this.host }
      }
    };
    return {
      name,
      type: 'VMess-WS',
      label: 'VMess WebSocket Direct',
      compat: true,
      uri,
      clash: clashProxy,
      singboxOutbound: [sbOutbound],
      singboxJson: JSON.stringify([sbOutbound], null, 2)
    };
  }

  generateVlessHttpUpgrade() {
    if (!this.config.enable.vlessHttpUpgrade) return null;
    const name = `${this.prefix}HTTPUpgrade`;
    const clashProxy = {
      name,
      type: 'vless',
      server: this.host,
      port: this.port,
      uuid: this.state.uuid,
      network: 'httpupgrade',
      tls: false,
      'httpupgrade-opts': {
        path: this.huPath,
        host: this.host
      }
    };
    const sbOutbound = {
      type: 'vless',
      tag: name,
      server: this.host,
      server_port: this.port,
      uuid: this.state.uuid,
      transport: {
        type: 'httpupgrade',
        path: this.huPath,
        host: this.host
      }
    };
    return {
      name,
      type: 'VLESS-HTTPUpgrade',
      compat: false,
      uri: `vless://${this.state.uuid}@${this.host}:${this.port}?encryption=none&security=none&type=httpupgrade&path=${urlSafeEncode(this.huPath)}#${urlSafeEncode(name)}`,
      clash: clashProxy,
      singboxOutbound: [sbOutbound],
      singboxJson: JSON.stringify([sbOutbound], null, 2)
    };
  }

  generateReality() {
    if (!this.config.enable.reality) return null;
    if (!this.state.realityPublicKey || !this.state.realityPrivateKey || this.state.realityPublicKey.length < 10) {
      try {
        const kp = crypto.generateKeyPairSync('x25519');
        this.state.realityPrivateKey = kp.privateKey.export({ type: 'pkcs8', format: 'der' }).subarray(-32).toString('base64url');
        this.state.realityPublicKey = kp.publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64url');
        this.state.realityShortId = this.state.realityShortId || crypto.randomBytes(4).toString('hex');
      } catch (_) {
        return null;
      }
    }
    const name = `${this.prefix}Reality`;
    const target = String(this.config.reality.target || 'www.microsoft.com').replace(/[\[\]]/g, '').trim();
    const shortId = this.state.realityShortId || '12345678';
    const clashProxy = {
      name,
      type: 'vless',
      server: this.host,
      port: this.port,
      uuid: this.state.uuid,
      flow: 'xtls-rprx-vision',
      tls: true,
      'reality-opts': {
        'public-key': this.state.realityPublicKey,
        'short-id': shortId
      },
      'client-fingerprint': 'chrome',
      servername: target
    };
    const sbOutbound = {
      type: 'vless',
      tag: name,
      server: this.host,
      server_port: this.port,
      uuid: this.state.uuid,
      flow: 'xtls-rprx-vision',
      tls: {
        enabled: true,
        server_name: target,
        reality: {
          enabled: true,
          public_key: this.state.realityPublicKey,
          short_id: shortId
        },
        utls: { enabled: true, fingerprint: 'chrome' }
      }
    };
    return {
      name,
      type: 'VLESS-REALITY',
      label: 'Anti-blocking / Web traffic',
      compat: true,
      uri: `vless://${this.state.uuid}@${this.host}:${this.port}?encryption=none&security=reality&sni=${target}&fp=chrome&pbk=${this.state.realityPublicKey}&sid=${shortId}&type=tcp&flow=xtls-rprx-vision#${urlSafeEncode(name)}`,
      clash: clashProxy,
      singboxOutbound: [sbOutbound],
      singboxJson: JSON.stringify([sbOutbound], null, 2)
    };
  }

  generateShadowTls() {
    if (!this.config.enable.shadowTlsVless || !this.state.shadowTlsPassword) return null;
    const name = `${this.prefix}ShadowTLS`;
    const sni = String(this.config.shadowTls.sni || 'www.microsoft.com').replace(/[\[\]]/g, '').trim();
    const clashProxy = {
      name,
      type: 'shadow-tls',
      server: this.host,
      port: this.port,
      password: this.state.shadowTlsPassword,
      version: 3,
      sni
    };
    const sbOutbounds = [
      {
        type: 'shadowtls',
        tag: name,
        server: this.host,
        server_port: this.port,
        version: 3,
        password: this.state.shadowTlsPassword,
        tls: {
          enabled: true,
          server_name: sni
        },
        detour: `${name}-detour`
      },
      {
        type: 'vless',
        tag: `${name}-detour`,
        server: this.host,
        server_port: this.port,
        uuid: this.state.uuid
      }
    ];
    return {
      name,
      type: 'ShadowTLS-VLESS',
      compat: false, // shadowtls:// is not recognized by v2rayN/v2rayNG
      uri: `shadowtls://${this.state.shadowTlsPassword}@${this.host}:${this.port}?sni=${sni}&version=3#${urlSafeEncode(name)}`,
      clash: clashProxy,
      singboxOutbound: sbOutbounds,
      singboxJson: JSON.stringify(sbOutbounds, null, 2),
      note: 'Use Hiddify, sing-box, or Clash Meta'
    };
  }

  generateShadowsocks() {
    if (!this.config.enable.shadowsocks || !this.state.shadowsocksPassword) return null;
    const name = `${this.prefix}Shadowsocks`;
    const method = this.config.shadowsocks.method || 'aes-256-gcm';
    const auth = Buffer.from(`${method}:${this.state.shadowsocksPassword}`).toString('base64');
    const clashProxy = {
      name,
      type: 'ss',
      server: this.host,
      port: this.port,
      cipher: method,
      password: this.state.shadowsocksPassword
    };
    const sbOutbound = {
      type: 'shadowsocks',
      tag: name,
      server: this.host,
      server_port: this.port,
      method,
      password: this.state.shadowsocksPassword
    };
    return {
      name,
      type: 'Shadowsocks',
      compat: true,
      uri: `ss://${auth}@${this.host}:${this.port}#${urlSafeEncode(name)}`,
      clash: clashProxy,
      singboxOutbound: [sbOutbound],
      singboxJson: JSON.stringify([sbOutbound], null, 2)
    };
  }

  _getOrGenerateWgKeys() {
    let clientPriv = this.state && this.state.wireguardClientPrivateKey;
    let clientPub = this.state && this.state.wireguardClientPublicKey;
    let serverPriv = this.state && this.state.wireguardPrivateKey;
    let serverPub = this.state && this.state.wireguardPublicKey;

    const isValidBase64Key = (k) => typeof k === 'string' && k.trim().length >= 40;

    if (!isValidBase64Key(clientPriv)) {
      try {
        const kp = crypto.generateKeyPairSync('x25519');
        clientPriv = kp.privateKey.export({ type: 'pkcs8', format: 'der' }).subarray(-32).toString('base64');
        clientPub = kp.publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64');
      } catch (_) {
        const raw = crypto.randomBytes(32);
        raw[0] &= 248; raw[31] &= 127; raw[31] |= 64;
        clientPriv = raw.toString('base64');
        clientPub = deriveX25519PublicKey(clientPriv) || crypto.randomBytes(32).toString('base64');
      }
    } else {
      const derived = deriveX25519PublicKey(clientPriv);
      if (derived) clientPub = derived;
    }

    if (!isValidBase64Key(serverPriv)) {
      try {
        const kp = crypto.generateKeyPairSync('x25519');
        serverPriv = kp.privateKey.export({ type: 'pkcs8', format: 'der' }).subarray(-32).toString('base64');
        serverPub = kp.publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64');
      } catch (_) {
        const raw = crypto.randomBytes(32);
        raw[0] &= 248; raw[31] &= 127; raw[31] |= 64;
        serverPriv = raw.toString('base64');
        serverPub = deriveX25519PublicKey(serverPriv) || crypto.randomBytes(32).toString('base64');
      }
    } else {
      const derived = deriveX25519PublicKey(serverPriv);
      if (derived) serverPub = derived;
    }

    if (this.state) {
      this.state.wireguardClientPrivateKey = clientPriv;
      this.state.wireguardClientPublicKey = clientPub;
      this.state.wireguardPrivateKey = serverPriv;
      this.state.wireguardPublicKey = serverPub;
    }

    return { clientPriv, clientPub, serverPub };
  }

  generateWireGuard() {
    try {
      if (!this.config || !this.config.enable || !this.config.enable.wireguard) return null;

      const keys = this._getOrGenerateWgKeys();
      const clientPrivateKey = keys.clientPriv;
      const serverPublicKey = keys.serverPub;

      if (!clientPrivateKey || !serverPublicKey) return null;

      const name = `${this.prefix}WireGuard`;
      const port = (this.config.wireguard && this.config.wireguard.port) || this.port || 51820;
      const clientIp = (this.config.wireguard && this.config.wireguard.clientIp) || '10.66.66.2/32';
      const ifaceAddress = clientIp.endsWith('/32') ? clientIp.replace('/32', '/24') : clientIp;
      const mtu = (this.config.wireguard && this.config.wireguard.mtu) || 1420;

      const wgConf = [
        '[Interface]',
        `PrivateKey = ${clientPrivateKey}`,
        `Address = ${ifaceAddress}`,
        'DNS = 1.1.1.1, 8.8.8.8',
        `MTU = ${mtu}`,
        '',
        '[Peer]',
        `PublicKey = ${serverPublicKey}`,
        `Endpoint = ${this.host}:${port}`,
        'AllowedIPs = 0.0.0.0/0, ::/0',
        'PersistentKeepalive = 25'
      ].join('\n') + '\n';

      const clashProxy = {
        name,
        type: 'wireguard',
        server: this.host,
        port,
        ip: clientIp.replace(/\/.*$/, ''),
        'public-key': serverPublicKey,
        'private-key': clientPrivateKey,
        udp: true,
        'remote-dns-resolve': true,
        dns: ['1.1.1.1', '8.8.8.8'],
        mtu
      };

      const sbOutbound = {
        type: 'wireguard',
        tag: name,
        server: this.host,
        server_port: port,
        local_address: [clientIp],
        private_key: clientPrivateKey,
        peer_public_key: serverPublicKey,
        mtu
      };

      const rawUri = `wireguard://${encodeURIComponent(clientPrivateKey)}@${this.host}:${port}?publickey=${encodeURIComponent(serverPublicKey)}&address=${encodeURIComponent(clientIp)}&mtu=${mtu}#${urlSafeEncode(name)}`;

      return {
        name,
        type: 'WireGuard',
        compat: false,
        uri: rawUri,
        wgConf,
        clash: clashProxy,
        singboxOutbound: [sbOutbound],
        singboxJson: JSON.stringify([sbOutbound], null, 2),
        note: 'WireGuard .conf / Clash Meta / Sing-box'
      };
    } catch (err) {
      console.warn(`[WARN] WireGuard generation failed: ${err.message}. Skipping.`);
      return null;
    }
  }

  generateTuic() {
    if (!this.config.enable.tuic) return null;
    const name = `${this.prefix}TUIC`;
    const port = this.config.tuic.port || 8443;
    const sni = this.config.sniHy2 || 'www.google.com';
    const cc = this.config.tuic.congestionController || 'bbr';

    const clashProxy = {
      name,
      type: 'tuic',
      server: this.host,
      port,
      uuid: this.state.uuid,
      password: this.state.uuid,
      alpn: ['h3'],
      sni,
      'skip-cert-verify': true,
      'congestion-controller': cc,
      udp: true
    };

    const sbOutbound = {
      type: 'tuic',
      tag: name,
      server: this.host,
      server_port: port,
      uuid: this.state.uuid,
      password: this.state.uuid,
      congestion_controller: cc,
      tls: {
        enabled: true,
        server_name: sni,
        alpn: ['h3'],
        insecure: true
      }
    };

    return {
      name,
      type: 'TUIC',
      compat: false,
      uri: `tuic://${this.state.uuid}:${this.state.uuid}@${this.host}:${port}?congestion_control=${cc}&alpn=h3&sni=${sni}&allow_insecure=1#${urlSafeEncode(name)}`,
      clash: clashProxy,
      singboxOutbound: [sbOutbound],
      singboxJson: JSON.stringify([sbOutbound], null, 2)
    };
  }

  generateXhttp() {
    if (!this.config.enable.vlessXhttp) return null;
    const name = `${this.prefix}XHTTP`;
    return {
      name,
      type: 'VLESS-XHTTP',
      compat: false,
      uri: `vless://${this.state.uuid}@${this.host}:${this.port}?encryption=none&security=none&type=xhttp&path=${urlSafeEncode(this.xhPath)}&mode=auto#${urlSafeEncode(name)}`,
      clash: null
    };
  }

  generateArgo(argoDomain) {
    if (!this.config.enable.argo || !argoDomain) return null;
    const name = `${this.prefix}Argo`;
    const clashProxy = {
      name,
      type: 'vless',
      server: argoDomain,
      port: 443,
      uuid: this.state.uuid,
      network: 'ws',
      tls: true,
      servername: argoDomain,
      'ws-opts': {
        path: this.wsPath,
        headers: { Host: argoDomain }
      }
    };
    const sbOutbound = {
      type: 'vless',
      tag: name,
      server: argoDomain,
      server_port: 443,
      uuid: this.state.uuid,
      tls: {
        enabled: true,
        server_name: argoDomain
      },
      transport: {
        type: 'ws',
        path: this.wsPath,
        headers: { Host: argoDomain }
      }
    };
    return {
      name,
      type: 'VLESS-Argo',
      compat: true,
      uri: `vless://${this.state.uuid}@${argoDomain}:443?encryption=none&security=tls&sni=${argoDomain}&type=ws&host=${argoDomain}&path=${urlSafeEncode(this.wsPath)}#${urlSafeEncode(name)}`,
      clash: clashProxy,
      singboxOutbound: [sbOutbound],
      singboxJson: JSON.stringify([sbOutbound], null, 2)
    };
  }

  generateTrojanWs() {
    if (!this.config.enable.trojanWs) return null;
    const name = `${this.prefix}Trojan-WS`;
    const trPath = this.trPath;
    const clashProxy = {
      name,
      type: 'trojan',
      server: this.host,
      port: this.port,
      password: this.state.uuid,
      network: 'ws',
      tls: false,
      'ws-opts': {
        path: trPath,
        headers: { Host: this.host }
      }
    };
    const sbOutbound = {
      type: 'trojan',
      tag: name,
      server: this.host,
      server_port: this.port,
      password: this.state.uuid,
      transport: {
        type: 'ws',
        path: trPath,
        headers: { Host: this.host }
      }
    };
    return {
      name,
      type: 'Trojan-WS',
      label: 'Trojan WebSocket Direct',
      compat: true,
      uri: `trojan://${this.state.uuid}@${this.host}:${this.port}?security=none&type=ws&host=${this.host}&path=${urlSafeEncode(trPath)}#${urlSafeEncode(name)}`,
      clash: clashProxy,
      singboxOutbound: [sbOutbound],
      singboxJson: JSON.stringify([sbOutbound], null, 2)
    };
  }

  generateTrojanGrpcTls() {
    if (!this.config.enable.trojanGrpcTls) return null;
    const name = `${this.prefix}Trojan-gRPC`;
    const sni = this.config.domain || this.host;
    const serviceName = this.grpcService;
    const clashProxy = {
      name,
      type: 'trojan',
      server: this.host,
      port: this.port,
      password: this.state.uuid,
      network: 'grpc',
      tls: true,
      sni: sni,
      'skip-cert-verify': true,
      alpn: ['h2'],
      'grpc-opts': {
        'grpc-service-name': serviceName
      }
    };
    const sbOutbound = {
      type: 'trojan',
      tag: name,
      server: this.host,
      server_port: this.port,
      password: this.state.uuid,
      tls: {
        enabled: true,
        server_name: sni,
        alpn: ['h2'],
        insecure: true
      },
      transport: {
        type: 'grpc',
        service_name: serviceName
      }
    };
    return {
      name,
      type: 'Trojan-gRPC-TLS',
      label: 'CDN gRPC Alternative',
      compat: true,
      uri: `trojan://${this.state.uuid}@${this.host}:${this.port}?security=tls&sni=${sni}&alpn=h2&type=grpc&serviceName=${urlSafeEncode(serviceName)}&fp=chrome&allowInsecure=1#${urlSafeEncode(name)}`,
      clash: clashProxy,
      singboxOutbound: [sbOutbound],
      singboxJson: JSON.stringify([sbOutbound], null, 2)
    };
  }

  generateVlessGrpc() {
    if (!this.config.enable.vlessGrpc) return null;
    const name = `${this.prefix}VLESS-gRPC`;
    const serviceName = this.grpcService;
    const clashProxy = {
      name,
      type: 'vless',
      server: this.host,
      port: this.port,
      uuid: this.state.uuid,
      network: 'grpc',
      tls: false,
      'grpc-opts': {
        'grpc-service-name': serviceName
      }
    };
    const sbOutbound = {
      type: 'vless',
      tag: name,
      server: this.host,
      server_port: this.port,
      uuid: this.state.uuid,
      transport: {
        type: 'grpc',
        service_name: serviceName
      }
    };
    return {
      name,
      type: 'VLESS-gRPC',
      label: 'gRPC Direct',
      compat: true,
      uri: `vless://${this.state.uuid}@${this.host}:${this.port}?encryption=none&security=none&type=grpc&serviceName=${urlSafeEncode(serviceName)}#${urlSafeEncode(name)}`,
      clash: clashProxy,
      singboxOutbound: [sbOutbound],
      singboxJson: JSON.stringify([sbOutbound], null, 2)
    };
  }

  getAllNodes(options = {}) {
    let argoDomain = null;
    let compat = 'v2ray';
    let allowLocalHost = this.config.allowLocalHostLinks || false;

    if (typeof options === 'string') {
      argoDomain = options;
    } else if (options && typeof options === 'object') {
      argoDomain = options.argoDomain || null;
      if (options.compat) compat = options.compat;
      if (options.allowLocalHostLinks !== undefined) allowLocalHost = options.allowLocalHostLinks;
    }

    let wgNode = null;
    try {
      wgNode = this.generateWireGuard();
    } catch (err) {
      console.warn(`[WARN] WireGuard skipped in getAllNodes: ${err.message}`);
    }

    const all = [
      this.generateReality(),
      this.generateVlessWsTls(),
      this.generateTrojanGrpcTls(),
      this.generateVmessWsTls(),
      this.generateVlessWs(),
      this.generateVmessWs(),
      this.generateTrojanWs(),
      this.generateVlessHttpUpgrade(),
      this.generateVlessGrpc(),
      this.generateXhttp(),
      this.generateShadowsocks(),
      wgNode,
      this.generateShadowTls(),
      this.generateTuic(),
      this.generateArgo(argoDomain)
    ].filter(Boolean);

    return all.filter(node => isValidNode(node, { allowLocalHostLinks: allowLocalHost, compatMode: compat }));
  }

  buildClashMetaYaml(nodes) {
    const proxyLines = [];
    const proxyNames = [];

    for (const node of nodes) {
      if (!node.clash) continue;
      proxyNames.push(node.clash.name);
      proxyLines.push(`  - name: ${yamlSafeQuote(node.clash.name)}`);
      proxyLines.push(`    type: ${node.clash.type}`);
      proxyLines.push(`    server: ${yamlSafeQuote(node.clash.server)}`);
      proxyLines.push(`    port: ${node.clash.port}`);

      if (node.clash.password) proxyLines.push(`    password: ${yamlSafeQuote(node.clash.password)}`);
      if (node.clash.uuid) proxyLines.push(`    uuid: ${yamlSafeQuote(node.clash.uuid)}`);
      if (node.clash.alterId !== undefined) proxyLines.push(`    alterId: ${node.clash.alterId}`);
      if (node.clash.sni) proxyLines.push(`    sni: ${yamlSafeQuote(node.clash.sni)}`);
      if (node.clash.servername) proxyLines.push(`    servername: ${yamlSafeQuote(node.clash.servername)}`);
      if (node.clash['skip-cert-verify'] !== undefined) proxyLines.push(`    skip-cert-verify: ${node.clash['skip-cert-verify']}`);
      if (node.clash.obfs) proxyLines.push(`    obfs: ${node.clash.obfs}`);
      if (node.clash['obfs-password']) proxyLines.push(`    obfs-password: ${yamlSafeQuote(node.clash['obfs-password'])}`);
      if (node.clash.alpn) proxyLines.push(`    alpn: [${node.clash.alpn.map(yamlSafeQuote).join(', ')}]`);
      if (node.clash.network) proxyLines.push(`    network: ${node.clash.network}`);
      if (node.clash.tls !== undefined) proxyLines.push(`    tls: ${node.clash.tls}`);
      if (node.clash.flow) proxyLines.push(`    flow: ${node.clash.flow}`);
      if (node.clash['client-fingerprint']) proxyLines.push(`    client-fingerprint: ${node.clash['client-fingerprint']}`);

      if (node.clash.ip) proxyLines.push(`    ip: ${yamlSafeQuote(node.clash.ip)}`);
      if (node.clash['public-key']) proxyLines.push(`    public-key: ${yamlSafeQuote(node.clash['public-key'])}`);
      if (node.clash['private-key']) proxyLines.push(`    private-key: ${yamlSafeQuote(node.clash['private-key'])}`);
      if (node.clash.udp !== undefined) proxyLines.push(`    udp: ${node.clash.udp}`);
      if (node.clash['remote-dns-resolve'] !== undefined) proxyLines.push(`    remote-dns-resolve: ${node.clash['remote-dns-resolve']}`);
      if (node.clash.dns) proxyLines.push(`    dns: [${node.clash.dns.map(yamlSafeQuote).join(', ')}]`);
      if (node.clash.mtu) proxyLines.push(`    mtu: ${node.clash.mtu}`);
      if (node.clash['congestion-controller']) proxyLines.push(`    congestion-controller: ${yamlSafeQuote(node.clash['congestion-controller'])}`);

      if (node.clash['reality-opts']) {
        proxyLines.push(`    reality-opts:`);
        proxyLines.push(`      public-key: ${yamlSafeQuote(node.clash['reality-opts']['public-key'])}`);
        proxyLines.push(`      short-id: ${yamlSafeQuote(node.clash['reality-opts']['short-id'])}`);
      }

      if (node.clash['ws-opts']) {
        proxyLines.push(`    ws-opts:`);
        proxyLines.push(`      path: ${yamlSafeQuote(node.clash['ws-opts'].path)}`);
        if (node.clash['ws-opts'].headers) {
          proxyLines.push(`      headers:`);
          for (const [k, v] of Object.entries(node.clash['ws-opts'].headers)) {
            proxyLines.push(`        ${k}: ${yamlSafeQuote(v)}`);
          }
        }
      }

      if (node.clash['httpupgrade-opts']) {
        proxyLines.push(`    httpupgrade-opts:`);
        proxyLines.push(`      path: ${yamlSafeQuote(node.clash['httpupgrade-opts'].path)}`);
        proxyLines.push(`      host: ${yamlSafeQuote(node.clash['httpupgrade-opts'].host)}`);
      }

      if (node.clash['grpc-opts']) {
        proxyLines.push(`    grpc-opts:`);
        proxyLines.push(`      grpc-service-name: ${yamlSafeQuote(node.clash['grpc-opts']['grpc-service-name'])}`);
      }

      if (node.clash.cipher) proxyLines.push(`    cipher: ${node.clash.cipher}`);
      if (node.clash.version) proxyLines.push(`    version: ${node.clash.version}`);
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

  buildSingBoxClientJson(nodes) {
    const outbounds = [];
    const proxyTags = [];

    for (const node of nodes) {
      if (node.singboxOutbound && Array.isArray(node.singboxOutbound)) {
        for (const ob of node.singboxOutbound) {
          outbounds.push(ob);
        }
        proxyTags.push(node.name);
      }
    }

    const allOutbounds = [];

    if (proxyTags.length > 0) {
      allOutbounds.push(
        {
          type: 'selector',
          tag: '🦇 Mavis Panel',
          outbounds: ['⚡ Auto Select', ...proxyTags]
        },
        {
          type: 'urltest',
          tag: '⚡ Auto Select',
          outbounds: [...proxyTags],
          url: 'http://www.gstatic.com/generate_204',
          interval: '5m'
        }
      );
    }

    allOutbounds.push(...outbounds);
    allOutbounds.push(
      { type: 'direct', tag: 'direct' },
      { type: 'block', tag: 'block' }
    );

    return JSON.stringify({
      log: { level: 'info' },
      outbounds: allOutbounds
    }, null, 2);
  }
}


// --- Module: lib/panel/http-panel.js ---
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


// --- Module: lib/mux/tcp-router.js ---
class TcpRouter {
  constructor(config, targetPorts, expressServer, expressApp) {
    this.config = config;
    this.ports = targetPorts;
    this.httpServer = expressServer;
    this.expressApp = expressApp || (expressServer && expressServer.listeners('request')[0]);
    this.server = null;
    this.httpsServer = null;
    this.internalHttpsPort = null;
  }

  pipeToBackend(clientSocket, firstChunk, targetPort, label) {
    clientSocket.setTimeout(0);
    clientSocket.setKeepAlive(true, 10000);
    clientSocket.setNoDelay(true);

    const backend = net.connect(targetPort, '127.0.0.1', () => {
      backend.setTimeout(0);
      backend.setKeepAlive(true, 10000);
      backend.setNoDelay(true);
      backend.write(firstChunk);
      clientSocket.pipe(backend);
      backend.pipe(clientSocket);
      clientSocket.resume();
    });

    backend.on('error', (err) => {
      const now = Date.now();
      if (!this._lastWarns) this._lastWarns = {};
      if (!this._lastWarns[label] || now - this._lastWarns[label] > 15000) {
        Logger.warn(`TCP Router: ${label} backend on :${targetPort} unreachable (${err.message})`);
        this._lastWarns[label] = now;
      }
      try { clientSocket.destroy(); } catch {}
    });

    clientSocket.on('error', () => {
      try { backend.destroy(); } catch {}
    });
  }

  attachUpgradeHandlers(server) {
    server.on('upgrade', (req, socket, head) => {
      socket.setTimeout(0);
      socket.setKeepAlive(true, 10000);
      socket.setNoDelay(true);

      const url = req.url || '';
      const mavisWs = '/mavis-ws';
      const mavisVmess = '/mavis-vmess';
      const mavisHu = '/mavis-httpupgrade';
      const mavisXh = '/mavis-xhttp';
      const mavisTr = '/mavis-trojan';

      const brandedWs = '/@mavis--ws';
      const brandedVmess = '/@mavis--vmess';
      const brandedHu = '/@mavis--httpupgrade';
      const brandedXh = '/@mavis--xhttp';
      const brandedTr = '/@mavis--trojan';

      const legacyWs = `/${this.config.panelPath}-ws`;
      const legacyVmess = `/${this.config.panelPath}-vmess`;
      const legacyHu = `/${this.config.panelPath}-hu`;
      const legacyXh = `/${this.config.panelPath}-xh`;
      const legacyTr = `/${this.config.panelPath}-trojan`;

      let destPort = null;
      let label = 'Unknown Upgrade';

      if ((url.startsWith(mavisWs) || url.startsWith(brandedWs) || url.startsWith(legacyWs)) && this.ports.vlessWs) {
        destPort = this.ports.vlessWs;
        label = 'VLESS-WS';
      } else if ((url.startsWith(mavisVmess) || url.startsWith(brandedVmess) || url.startsWith(legacyVmess)) && this.ports.vmessWs) {
        destPort = this.ports.vmessWs;
        label = 'VMess-WS';
      } else if ((url.startsWith(mavisHu) || url.startsWith(brandedHu) || url.startsWith(legacyHu)) && this.ports.vlessHu) {
        destPort = this.ports.vlessHu;
        label = 'VLESS-HTTPUpgrade';
      } else if ((url.startsWith(mavisXh) || url.startsWith(brandedXh) || url.startsWith(legacyXh)) && this.ports.xray) {
        destPort = this.ports.xray;
        label = 'VLESS-XHTTP';
      } else if ((url.startsWith(mavisTr) || url.startsWith(brandedTr) || url.startsWith(legacyTr)) && this.ports.trojanWs) {
        destPort = this.ports.trojanWs;
        label = 'Trojan-WS';
      }

      if (!destPort) {
        socket.write('HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n');
        socket.destroy();
        return;
      }

      const backend = net.connect(destPort, '127.0.0.1', () => {
        backend.setTimeout(0);
        backend.setKeepAlive(true, 10000);
        backend.setNoDelay(true);

        let headersStr = `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`;
        for (let i = 0; i < req.rawHeaders.length; i += 2) {
          headersStr += `${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}\r\n`;
        }
        headersStr += '\r\n';

        backend.write(headersStr);
        if (head && head.length > 0) {
          backend.write(head);
        }

        socket.pipe(backend);
        backend.pipe(socket);
      });

      backend.on('error', () => {
        try { socket.destroy(); } catch {}
      });

      socket.on('error', () => {
        try { backend.destroy(); } catch {}
      });
    });
  }

  async setupInternalHttps() {
    try {
      const certs = ensureTlsCertificates(this.config.paths.certPath, this.config.paths.keyPath, this.config.domain || 'localhost');
      if (!certs || !certs.cert || !certs.key) return;

      const handler = this.expressApp || (this.httpServer && this.httpServer.listeners('request')[0]);
      this.httpsServer = https.createServer({
        cert: certs.cert,
        key: certs.key
      }, handler);

      this.httpsServer.keepAliveTimeout = 120000;
      this.httpsServer.headersTimeout = 125000;

      this.attachUpgradeHandlers(this.httpsServer);

      await new Promise((resolve) => {
        this.httpsServer.listen(0, '127.0.0.1', () => {
          this.internalHttpsPort = this.httpsServer.address().port;
          Logger.item('Internal HTTPS Port', this.internalHttpsPort);
          resolve();
        });
        this.httpsServer.on('error', (err) => {
          Logger.warn(`Internal HTTPS server failed to start: ${err.message}`);
          resolve();
        });
      });
    } catch (err) {
      Logger.warn(`Internal HTTPS setup error: ${err.message}`);
    }
  }

  async start() {
    this.httpServer.keepAliveTimeout = 120000;
    this.httpServer.headersTimeout = 125000;
    this.attachUpgradeHandlers(this.httpServer);

    await this.setupInternalHttps();

    this.server = net.createServer((socket) => {
      socket.setTimeout(0);
      socket.setKeepAlive(true, 10000);
      socket.setNoDelay(true);

      socket.once('data', (chunk) => {
        socket.pause();

        // 1. SOCKS5 check (byte 0x05)
        if (this.config.enable.socks && this.ports.socks && chunk.length >= 2 && chunk[0] === 0x05) {
          this.pipeToBackend(socket, chunk, this.ports.socks, 'SOCKS5');
          return;
        }

        // 2. TLS ClientHello check (0x16 0x03)
        if (chunk.length >= 3 && chunk[0] === 0x16 && chunk[1] === 0x03) {
          const { sni, alpn } = parseClientHello(chunk);
          let target = null;

          // Priority 1: Reality target SNI
          if (this.config.enable.reality && this.ports.reality && sni === this.config.reality.target) {
            target = { port: this.ports.reality, label: 'REALITY' };
          }
          // Priority 2: ShadowTLS SNI (if explicitly enabled)
          else if (this.config.enable.shadowTlsVless && this.ports.shadowTls && sni === this.config.shadowTls.sni) {
            target = { port: this.ports.shadowTls, label: 'ShadowTLS-VLESS' };
          }
          // Priority 3: Trojan gRPC TLS (ALPN h2)
          else if (this.config.enable.trojanGrpcTls && this.ports.trojanGrpcTls && alpn && alpn.includes('h2')) {
            target = { port: this.ports.trojanGrpcTls, label: 'Trojan-gRPC-TLS' };
          }
          // Priority 4: Internal HTTPS server (handles VLESS-WS-TLS, VMess-WS-TLS, HTTPS Sub, HTTPS Panel)
          else if (this.internalHttpsPort) {
            target = { port: this.internalHttpsPort, label: 'Internal-HTTPS' };
          }
          // Priority 5: Fallback to vlessWsTls if singbox port is open
          else if (this.config.enable.vlessWsTls && this.ports.vlessWsTls) {
            target = { port: this.ports.vlessWsTls, label: 'VLESS-WS-TLS' };
          }
          // Priority 6: Reality decoy fallback
          else if (this.config.enable.reality && this.ports.reality) {
            target = { port: this.ports.reality, label: 'REALITY-Decoy' };
          }

          if (target) {
            this.pipeToBackend(socket, chunk, target.port, target.label);
            return;
          }
        }

        // 3. HTTP Proxy check (CONNECT or absolute URL)
        if (this.config.enable.httpProxy && this.ports.httpProxy) {
          const headerSnippet = chunk.toString('latin1', 0, Math.min(chunk.length, 256));
          if (/^CONNECT /i.test(headerSnippet) || /^(GET|POST|HEAD) https?:\/\//i.test(headerSnippet)) {
            this.pipeToBackend(socket, chunk, this.ports.httpProxy, 'HTTP-Proxy');
            return;
          }
        }

        // 4. gRPC check (HTTP/2 cleartext connection preface)
        if (this.config.enable.vlessGrpc && this.ports.vlessGrpc && chunk.length >= 16) {
          if (chunk.toString('latin1', 0, 16) === 'PRI * HTTP/2.0\r\n') {
            this.pipeToBackend(socket, chunk, this.ports.vlessGrpc, 'VLESS-gRPC');
            return;
          }
        }

        // 5. Shadowsocks check: raw encrypted stream doesn't look like standard HTTP verbs
        const firstWords = chunk.toString('latin1', 0, Math.min(chunk.length, 8));
        const isHttpVerb = /^(GET|POST|PUT|HEAD|OPTIONS|DELETE|PATCH|TRACE) /i.test(firstWords);

        if (!isHttpVerb && this.config.enable.shadowsocks && this.ports.shadowsocks) {
          this.pipeToBackend(socket, chunk, this.ports.shadowsocks, 'Shadowsocks');
          return;
        }

        // 6. Fallback: Hand off to internal HTTP server (Express panel & WS upgrades)
        socket.unshift(chunk);
        this.httpServer.emit('connection', socket);
        socket.resume();
      });

      socket.on('error', () => {});
    });

    return new Promise((resolve, reject) => {
      this.server.listen(this.config.publicPort, '0.0.0.0', () => {
        Logger.success(`Public TCP multiplexer listening on 0.0.0.0:${this.config.publicPort}`);
        resolve(this.server);
      });
      this.server.on('error', reject);
    });
  }

  stop() {
    if (this.server) {
      try { this.server.close(); } catch {}
    }
    if (this.httpsServer) {
      try { this.httpsServer.close(); } catch {}
    }
  }
}


// --- Module: lib/boot.js ---
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


// --- Auto-start execution ---
if (require.main === module) {
  startGate(MAVIS_CONFIG).catch(err => {
    console.error('[FATAL] Failed to start Mavis Panel:', err);
    process.exit(1);
  });
}

module.exports = {
  MAVIS_CONFIG,
  BK_CONFIG: MAVIS_CONFIG,
  startGate
};
