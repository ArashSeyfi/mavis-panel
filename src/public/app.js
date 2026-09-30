// Mavis Panel

let gateData = null;

function showToast(text) {
  const t = document.getElementById('mavisToast');
  if (!t) return;
  t.innerText = text;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

function copyText(text) {
  if (!text) return;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => showToast('Copied')).catch(() => fbCopy(text));
  } else {
    fbCopy(text);
  }
}

function fbCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); showToast('Copied'); }
  catch { showToast('Copy failed'); }
  document.body.removeChild(ta);
}

// QR modal
function openQr(text, title) {
  if (!text) return;
  const modal = document.getElementById('qrModal');
  const wrap = document.getElementById('qrcodeWrapper');
  const titleEl = document.getElementById('qrModalTitle');
  if (!modal || !wrap) return;
  if (titleEl) titleEl.innerText = title || 'QR Code';
  wrap.innerHTML = '';
  const img = document.createElement('img');
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
  img.alt = 'QR';
  img.width = 200;
  img.height = 200;
  wrap.appendChild(img);
  modal.classList.add('active');
}

function closeQr() {
  document.getElementById('qrModal')?.classList.remove('active');
}

document.getElementById('qrCloseBtn')?.addEventListener('click', closeQr);
document.getElementById('qrModal')?.addEventListener('click', e => {
  if (e.target.id === 'qrModal') closeQr();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeQr(); });

// Event delegation
document.addEventListener('click', e => {
  const btn = e.target.closest('button, a');
  if (!btn) return;
  const action = btn.getAttribute('data-action');
  if (!action) return;

  if (action === 'copy-input') {
    const el = document.getElementById(btn.getAttribute('data-target'));
    if (el) copyText(el.value);
  } else if (action === 'qr-input') {
    const el = document.getElementById(btn.getAttribute('data-target'));
    if (el) openQr(el.value, 'Subscription QR');
  } else if (action === 'copy-text') {
    const raw = btn.getAttribute('data-text');
    if (raw) copyText(decodeURIComponent(raw));
  } else if (action === 'qr-text') {
    const raw = btn.getAttribute('data-text');
    if (raw) openQr(decodeURIComponent(raw), btn.getAttribute('data-title') || 'QR Code');
  }
});

// Routing
function route() {
  let hash = window.location.hash || '#/home';
  if (hash === '#' || hash === '') hash = '#/home';
  const pg = hash.replace(/^#\/?/, '').split('?')[0].toLowerCase() || 'home';
  let page = 'home';
  if (pg === 'subs' || pg === 'sub') page = 'subs';
  else if (pg === 'nodes' || pg === 'node') page = 'nodes';

  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  const viewMap = { home: 'viewHome', subs: 'viewSubs', nodes: 'viewNodes' };
  document.getElementById(viewMap[page])?.classList.add('active');

  document.querySelectorAll('.nav-link').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-page') === page);
  });

  window.scrollTo({ top: 0 });
}

window.addEventListener('hashchange', route);

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Render nodes
function renderNodes(nodes) {
  const c = document.getElementById('nodesContainer');
  if (!c) return;

  const active = (nodes || []).filter(n => {
    if (!n || !n.uri) return false;
    const t = (n.type || '').toLowerCase();
    return !t.includes('hy2') && !t.includes('hysteria');
  });

  if (!active.length) {
    c.innerHTML = '<p class="muted center" style="grid-column:1/-1;padding:32px 0">No active links.</p>';
    return;
  }

  let html = '';
  active.forEach((node, i) => {
    const name = node.name || `Node ${i + 1}`;
    const lt = (node.type || '').toLowerCase();

    let proto = 'VLESS';
    if (lt.includes('vmess')) proto = 'VMess';
    else if (lt.includes('trojan')) proto = 'Trojan';
    else if (lt.includes('shadowsocks') || lt.includes('ss')) proto = 'SS';
    else if (lt.includes('wireguard') || lt.includes('wg')) proto = 'WG';
    else if (lt.includes('tuic')) proto = 'TUIC';

    let badges = '';
    if (lt.includes('ws')) badges += '<span class="node-badge">WS</span>';
    else if (lt.includes('httpupgrade')) badges += '<span class="node-badge">HTTPUpgrade</span>';
    else if (lt.includes('grpc')) badges += '<span class="node-badge">gRPC</span>';
    else if (lt.includes('xhttp')) badges += '<span class="node-badge">XHTTP</span>';

    if (lt.includes('reality')) badges += '<span class="node-badge">Reality</span>';
    else if (lt.includes('tls')) badges += '<span class="node-badge">TLS</span>';

    const eu = encodeURIComponent(node.uri);

    html += `<div class="node-card">
      <div class="node-top">
        <span class="node-proto">${proto}</span>
        <div class="node-badges">${badges}</div>
      </div>
      <div class="node-name" title="${esc(name)}">${esc(name)}</div>
      <input type="text" class="node-uri" readonly value="${esc(node.uri)}" onclick="this.select()">
      <div class="node-actions">
        <button type="button" class="btn" data-action="copy-text" data-text="${eu}">Copy</button>
        <button type="button" class="btn" data-action="qr-text" data-text="${eu}" data-title="${encodeURIComponent(name)}">QR</button>
      </div>
    </div>`;
  });

  c.innerHTML = html;
}

// Load data
async function loadData() {
  try {
    const segs = window.location.pathname.split('/').filter(Boolean);
    const prefix = segs[0] || 'mavis';

    const res = await fetch('/health');
    const data = await res.json();
    gateData = data;

    const port = data.publicPort || window.location.port || '2705';
    const host = data.domain || data.host || window.location.hostname;
    const loc = data.location || 'Global';

    let uptime = '—';
    if (data.uptime !== undefined) {
      const m = Math.floor(data.uptime / 60);
      const s = Math.floor(data.uptime % 60);
      uptime = `${m}m ${s}s`;
    }

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    set('homeLocation', loc);
    set('homePort', port);
    set('homeHost', host);
    set('homeUptime', uptime);
    set('nodesLocation', loc);

    const engines = [];
    if (data.engines?.singbox) engines.push('sing-box');
    if (data.engines?.xray) engines.push('xray');
    if (data.engines?.argo) engines.push('argo');
    set('homeEngine', engines.join(' + ') || 'sing-box');

    let activeProto = (data.forceHttps || window.location.protocol === 'https:') ? 'https:' : 'http:';

    const updateSubs = (proto) => {
      let origin;
      if (data.publicBaseUrl?.trim()) {
        origin = data.publicBaseUrl.trim().replace(/\/+$/, '');
      } else if (data.subBase?.trim()) {
        origin = data.subBase.trim().replace(/\/+$/, '');
      } else {
        const hp = window.location.port ? `${window.location.hostname}:${window.location.port}` : window.location.hostname;
        if (proto === 'https:') {
          if (data.domain) origin = data.domain.startsWith('http') ? data.domain : `https://${data.domain}`;
          else if (window.location.protocol === 'https:') origin = window.location.origin;
          else origin = `https://${hp}`;
        } else {
          origin = `http://${hp}`;
        }
      }

      const val = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
      val('urlSubCompat', `${origin}/${prefix}/base64`);
      val('urlSubFull', `${origin}/${prefix}/base64?compat=full`);
      val('urlClash', `${origin}/${prefix}/clash`);
      val('urlSb', `${origin}/${prefix}/sb/raw`);
      val('urlWgConf', `${origin}/${prefix}/wg.conf`);

      const dlBtn = document.getElementById('btnDownloadWg');
      if (dlBtn) dlBtn.href = `${origin}/${prefix}/wg.conf`;
    };

    updateSubs(activeProto);

    const btnHttp = document.getElementById('btnProtoHttp');
    const btnHttps = document.getElementById('btnProtoHttps');
    if (btnHttp && btnHttps) {
      btnHttp.classList.toggle('active', activeProto === 'http:');
      btnHttps.classList.toggle('active', activeProto === 'https:');

      btnHttp.onclick = () => {
        activeProto = 'http:';
        btnHttp.classList.add('active');
        btnHttps.classList.remove('active');
        updateSubs('http:');
        showToast('HTTP');
      };
      btnHttps.onclick = () => {
        activeProto = 'https:';
        btnHttps.classList.add('active');
        btnHttp.classList.remove('active');
        updateSubs('https:');
        showToast('HTTPS');
      };
    }

    renderNodes(data.nodes);

  } catch (err) {
    console.error('Load failed:', err);
    const c = document.getElementById('nodesContainer');
    if (c) c.innerHTML = '<p class="muted center" style="grid-column:1/-1;padding:32px 0">Failed to connect.</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  route();
  loadData();
});
