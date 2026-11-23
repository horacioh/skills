/* PR visual explainer runtime. Reads window.SPEC (built by build.mjs). Modes:
   default = interactive page; ?layout = measure nodes + run ELK (build time only);
   ?video = 1920x1080 stage driven by window.renderAt(t). */
(() => {
const S = window.SPEC;
const Q = new URLSearchParams(location.search);
const MODE = Q.has('layout') ? 'layout' : Q.has('video') ? 'video' : 'page';
const $ = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const md = s => esc(s)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>');
const mdBlock = s => {
  const lines = String(s ?? '').split('\n'); let out = '', list = false;
  for (const l of lines) {
    const m = l.match(/^\s*[-*]\s+(.*)/);
    if (m) { if (!list) { out += '<ul>'; list = true; } out += `<li>${md(m[1])}</li>`; continue; }
    if (list) { out += '</ul>'; list = false; }
    if (l.trim()) out += `<p>${md(l)}</p>`;
  }
  return out + (list ? '</ul>' : '');
};
const STATUS = { added: ['+', 'New'], changed: ['~', 'Changed'], removed: ['−', 'Removed'] };
const badge = (st, word) => STATUS[st] ? `<span class="badge ${st}"><b>${STATUS[st][0]}</b>${esc(word || STATUS[st][1])}</span>` : '';

const P = 'fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"';
const ICONS = {
  module: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  function: '<path d="M8 4c-2 0-3 1-3 3v2c0 1.5-1 3-2 3 1 0 2 1.5 2 3v2c0 2 1 3 3 3M16 4c2 0 3 1 3 3v2c0 1.5 1 3 2 3-1 0-2 1.5-2 3v2c0 2-1 3-3 3"/>',
  db: '<ellipse cx="12" cy="5.5" rx="7.5" ry="2.8"/><path d="M4.5 5.5v13c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-13M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8"/>',
  ui: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/>',
  service: '<rect x="3.5" y="4" width="17" height="7" rx="2"/><rect x="3.5" y="13" width="17" height="7" rx="2"/><path d="M7.5 7.5h.01M7.5 16.5h.01"/>',
  external: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5s1.1-5.9 3.6-8.5z"/>',
  actor: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5c.8-3.8 3.7-6 7.5-6s6.7 2.2 7.5 6"/>',
  job: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  config: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  test: '<path d="M9 3h6M10 3v6.5L4.8 18.3A1.8 1.8 0 0 0 6.3 21h11.4a1.8 1.8 0 0 0 1.5-2.7L14 9.5V3"/><path d="M7.5 15h9"/>',
  api: '<path d="M7 8 3 12l4 4M17 8l4 4-4 4M14 5l-4 14"/>',
  cli: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="m7 10 3 2.5L7 15M12.5 15H17"/>',
  queue: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  state: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/><path d="M11 7.5h3.5a2 2 0 0 1 2 2V13"/>',
  doc: '<path d="M6 3h9l4 4v14H6z"/><path d="M9.5 11h6M9.5 15h6"/>',
  event: '<path d="M13 3 5 13.5h6.5L10.5 21 19 10h-6.5z"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/>',
  cache: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><circle cx="12" cy="12" r="4"/>',
  goal: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/>',
  change: '<path d="M4 7h13l-3-3M20 17H7l3 3"/>',
  why: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.3-2.4 3.6M12 17h.01"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  risk: '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.2h.01"/>',
  note: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8h.01"/>',
  merged: '<circle cx="6.5" cy="5.5" r="2"/><circle cx="6.5" cy="18.5" r="2"/><circle cx="17.5" cy="12" r="2"/><path d="M6.5 7.5v9M6.5 7.5c0 3 3 4.5 9 4.5"/>',
  open: '<circle cx="6.5" cy="5.5" r="2"/><circle cx="6.5" cy="18.5" r="2"/><circle cx="17.5" cy="18.5" r="2"/><path d="M6.5 7.5v9M17.5 16.5V9a2.5 2.5 0 0 0-2.5-2.5h-4"/><path d="m12.5 4.5-2 2 2 2"/>',
  files: '<path d="M8 3h7l4 4v11H8z"/><path d="M5 7v14h11"/>',
  user: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5c.8-3.8 3.7-6 7.5-6s6.7 2.2 7.5 6"/>',
  branch: '<circle cx="6.5" cy="5.5" r="2"/><circle cx="6.5" cy="18.5" r="2"/><circle cx="17.5" cy="7.5" r="2"/><path d="M6.5 7.5v9M17.5 9.5c0 4-11 3-11 7"/>',
  prev: '<path d="m14.5 6-6 6 6 6"/>', next: '<path d="m9.5 6 6 6-6 6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
  timeline: '<path d="M4 6h3M4 12h3M4 18h3M10 6h10M10 12h10M10 18h10"/>',
  diagram: '<rect x="3" y="3.5" width="7" height="6" rx="1.5"/><rect x="14" y="14.5" width="7" height="6" rx="1.5"/><path d="M6.5 9.5v3a2 2 0 0 0 2 2H14"/>',
  code: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4"/>',
  decision: '<path d="M12 21v-6M12 15 6 9V4M12 15l6-6V4M4 6l2-2 2 2M16 6l2-2 2 2"/>',
  sequence: '<path d="M6 3v18M18 3v18M6 8h10M16 6l2 2-2 2M18 15H8M8 13l-2 2 2 2"/>',
  metric: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-9 9"/>',
};
const icon = k => `<svg viewBox="0 0 24 24" ${P} aria-hidden="true">${ICONS[k] || ICONS.module}</svg>`;
const BLOCK_ICON = { diagram: 'diagram', sequence: 'sequence', code: 'code', decision: 'decision', steps: 'timeline', files: 'files', compare: 'change', callout: 'note', metrics: 'metric', screens: 'image' };

const gh = `https://github.com/${S.pr.repo}`;
const fileUrl = (file, base) => `${gh}/blob/${base ? S.pr.baseSha : S.pr.headSha}/${file.split('/').map(encodeURIComponent).join('/')}`;
function refUrl(ref) {
  if (!ref) return null;
  if (/^https?:/.test(ref)) return ref;
  const base = ref.startsWith('base:');
  const r = base ? ref.slice(5) : ref;
  const frag = r.match(/#L\d+(?:-L\d+)?$/)?.[0] || '';
  return fileUrl(frag ? r.slice(0, -frag.length) : r, base) + frag;
}
const refLabel = ref => ref ? ref.replace(/^base:/, '').replace(/#L(\d+)(-L(\d+))?$/, (m, a, b, c) => `:${a}${c ? '–' + c : ''}`) : '';

/* ---------- diagram ---------- */
function nodeHTML(n) {
  const k = n.kind || 'module';
  const fields = n.fields ? `<div class="fields">${n.fields.map(f => `<div class="${f.status || ''}"><span>${STATUS[f.status] ? `<span class="g">${STATUS[f.status][0]}</span>` : '<span class="g"></span>'}${esc(f.name)}</span><span class="ty">${esc(f.type || '')}</span></div>`).join('')}</div>` : '';
  return `<span class="ic">${icon(k)}</span><span class="tx"><div class="lb">${md(n.label)}</div>${n.sub ? `<div class="sb">${md(n.sub)}</div>` : ''}${n.status && n.status !== 'unchanged' ? badge(n.status, n.badge) : ''}${fields}</span>`;
}
function makeNode(n) {
  const url = refUrl(n.ref);
  const e = $(url ? 'a' : 'div', `node k-${n.kind || 'module'} ${n.status || ''}`, nodeHTML(n));
  if (url) { e.href = url; e.target = '_blank'; e.rel = 'noopener'; e.title = refLabel(n.ref); }
  e.dataset.id = n.id; return e;
}
const edgeId = e => e.id || `${e.from}->${e.to}`;
function allNodes(b) { const out = []; const walk = ns => ns.forEach(n => { if (n.children) walk(n.children); else out.push(n); }); walk(b.nodes); return out; }
function allGroups(b) { const out = []; const walk = ns => ns.forEach(n => { if (n.children) { out.push(n); walk(n.children); } }); walk(b.nodes); return out; }

function smoothPath(pts) {
  // ELK routes orthogonally; round each bend so edges read as one calm stroke.
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const r = Math.min(12, Math.hypot(b.x - a.x, b.y - a.y) / 2, Math.hypot(c.x - b.x, c.y - b.y) / 2);
    const ux = Math.sign(b.x - a.x), uy = Math.sign(b.y - a.y), vx = Math.sign(c.x - b.x), vy = Math.sign(c.y - b.y);
    d += ` L${b.x - ux * r},${b.y - uy * r} Q${b.x},${b.y} ${b.x + vx * r},${b.y + vy * r}`;
  }
  const z = pts[pts.length - 1]; return d + ` L${z.x},${z.y}`;
}

function renderDiagram(b, key) {
  const L = b.layouts && b.layouts[key]; const wrap = $('div', 'dg-canvas');
  if (!L) return wrap;
  wrap.style.width = L.w + 'px'; wrap.style.height = L.h + 'px';
  for (const g of allGroups(b)) {
    const r = L.groups[g.id]; if (!r) continue;
    const e = $('div', `dg-group ${g.status || ''}`, `<span class="g-label">${g.kind ? icon(g.kind) : ''}${md(g.label)}${g.status && g.status !== 'unchanged' ? ' ' + badge(g.status) : ''}</span>`);
    Object.assign(e.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' }); e.dataset.id = g.id; wrap.append(e);
  }
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'dg-svg'); svg.setAttribute('width', L.w); svg.setAttribute('height', L.h);
  const defs = document.createElementNS(NS, 'defs'); svg.append(defs);
  const uid = b.id.replace(/\W/g, '');
  for (const st of ['plain', 'added', 'changed', 'removed']) {
    const m = document.createElementNS(NS, 'marker');
    Object.entries({ id: `ah-${uid}-${st}`, viewBox: '0 0 10 10', refX: 8.5, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse', markerUnits: 'userSpaceOnUse' }).forEach(([k, v]) => m.setAttribute(k, v));
    m.innerHTML = `<path d="M1,1.5 L8.5,5 L1,8.5" fill="none" stroke="${st === 'plain' ? 'var(--faint)' : `var(--${st})`}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
    defs.append(m);
  }
  for (const ed of b.edges || []) {
    const r = L.edges[edgeId(ed)]; if (!r) continue;
    const p = document.createElementNS(NS, 'path'); const st = ed.status && ed.status !== 'unchanged' ? ed.status : '';
    p.setAttribute('d', smoothPath(r.points)); p.setAttribute('class', `edge ${st} ${ed.style === 'dashed' ? 'dashed' : ''}`);
    p.setAttribute('marker-end', `url(#ah-${uid}-${st || 'plain'})`); if (ed.both) p.setAttribute('marker-start', `url(#ah-${uid}-${st || 'plain'})`);
    p.dataset.id = edgeId(ed); svg.append(p);
  }
  wrap.append(svg);
  for (const n of allNodes(b)) {
    const r = L.nodes[n.id]; if (!r) continue; const e = makeNode(n);
    Object.assign(e.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px', maxWidth: 'none' }); wrap.append(e);
  }
  for (const ed of b.edges || []) {
    const r = L.edges[edgeId(ed)]; if (!r || !ed.label || !r.label) continue; const st = ed.status && ed.status !== 'unchanged' ? ed.status : '';
    const e = $('div', `e-label boxed ${st}`, (STATUS[st] ? `<b class="mono">${STATUS[st][0]}</b> ` : '') + md(ed.label));
    Object.assign(e.style, { left: r.label.x + 'px', top: r.label.y + 'px', width: r.label.w + 'px', height: r.label.h + 'px' }); e.dataset.id = edgeId(ed); wrap.append(e);
  }
  return wrap;
}

function legendFor(b) {
  const used = new Set(); const scan = x => { if (x.status && STATUS[x.status]) used.add(x.status); };
  (b.nodes ? allNodes(b).concat(allGroups(b)) : []).forEach(scan); (b.edges || []).forEach(scan); (b.messages || []).forEach(scan); (b.participants || []).forEach(scan);
  if (!used.size) return null;
  const el = $('div', 'legend');
  for (const st of ['added', 'changed', 'removed']) if (used.has(st)) el.append($('span', '', `<i class="${st}"></i>${badge(st)}`));
  if (b.nodes && allNodes(b).some(n => n.ref)) el.append($('span', '', 'Boxes link to the source at this PR’s commit'));
  return el;
}

function fitDiagram(fig, b) {
  const host = fig.querySelector('.dg-fit');
  const draw = () => {
    const avail = fig.querySelector('.dg-scroll').clientWidth;
    const key = avail < 640 && b.layouts.narrow ? 'narrow' : 'wide';
    if (host.dataset.key !== key) { host.innerHTML = ''; host.append(renderDiagram(b, key)); host.dataset.key = key; applyFocus(fig, fig._focus); }
    const L = b.layouts[key]; const s = Math.max(Math.min(1, avail / L.w), avail >= 640 ? .55 : .66);
    const c = host.firstChild; c.style.transform = `scale(${s})`;
    host.style.width = L.w * s + 'px'; host.style.height = L.h * s + 'px';
  };
  draw(); new ResizeObserver(draw).observe(fig.querySelector('.dg-scroll'));
}

function focusSets(b, step) {
  if (!step) return null;
  if (Array.isArray(step)) step = { focus: step };
  const nodes = new Set(step.focus || []); const edges = new Set(step.edges || []);
  if (!step.edges && b.edges) for (const e of b.edges) if (nodes.has(e.from) && nodes.has(e.to)) edges.add(edgeId(e));
  if (b.messages) (step.messages || []).forEach(i => edges.add('m' + i));
  return { nodes, edges, lines: step.lines, items: step.items };
}
function applyFocus(root, f) {
  root._focus = f;
  const has = !!f && (f.nodes.size || f.edges.size);
  root.classList.toggle('has-focus', has);
  root.querySelectorAll('[data-id]').forEach(e => {
    const id = e.dataset.id; e.classList.toggle('is-focus', !!f && (f.nodes.has(id) || f.edges.has(id)));
  });
}

function tourUI(fig, b) {
  const steps = b.steps; if (!steps || !steps.length) return null;
  const t = $('div', 'tour'); let i = -1;
  t.innerHTML = `<span class="step-no num"></span><div class="step-tx"></div><div class="nav"><button type="button" aria-label="Previous step">${icon('prev')}</button><button type="button" aria-label="Next step">${icon('next')}</button></div>`;
  const [prev, next] = t.querySelectorAll('button');
  const set = n => {
    i = n; const st = steps[i];
    t.querySelector('.step-no').textContent = i < 0 ? `${steps.length} steps` : `Step ${i + 1} of ${steps.length}`;
    t.querySelector('.step-tx').innerHTML = i < 0 ? (b.tourIntro ? md(b.tourIntro) : 'Walk through how it works, one step at a time.') : (st.title ? `<strong>${md(st.title)}.</strong> ` : '') + md(st.text || '');
    applyFocus(fig, i < 0 ? null : focusSets(b, st));
    prev.disabled = i < 0; next.disabled = i >= steps.length - 1;
  };
  prev.onclick = () => set(i - 1); next.onclick = () => set(i + 1); set(-1);
  return t;
}

/* ---------- sequence ---------- */
function renderSequence(b, narrow) {
  const ps = b.participants; const est = Math.max(...ps.map(p => String(p.label).length * 8.6 + 72)); const colW = narrow ? 150 : Math.max(170, Math.min(310, Math.max(est, Math.min(240, 1000 / ps.length)))); const pad = colW / 2;
  const W = colW * ps.length; const el = $('div', 'seq'); el.style.width = W + 'px';
  const xOf = id => pad + ps.findIndex(p => p.id === id) * colW;
  let y = 0; const headH = 44;
  ps.forEach(p => { const h = $('div', `p-head ${p.status || ''}`, `${p.kind ? icon(p.kind) : ''}${md(p.label)}`); h.style.left = xOf(p.id) + 'px'; h.style.top = '0px'; el.append(h); });
  y = headH + 22;
  const NS = 'http://www.w3.org/2000/svg'; const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'dg-svg');
  const items = []; document.body.append(el); el.style.position = 'absolute'; el.style.visibility = 'hidden';
  (b.messages || []).forEach((m, i) => {
    if (m.divider) { const d = $('div', 'divider', md(m.divider)); d.style.top = y + 'px'; el.append(d); y += 34; return; }
    if (m.note) { const n = $('div', 'note', md(m.note)); el.append(n); const x = xOf(m.at || m.from || ps[0].id); n.style.left = Math.max(0, Math.min(W - 250, x - 110)) + 'px'; n.style.top = y + 'px'; y += n.offsetHeight + 14; return; }
    const self = m.from === m.to; const x1 = xOf(m.from), x2 = xOf(m.to);
    const st = m.status && m.status !== 'unchanged' ? m.status : '';
    const lab = $('div', `m-label msg ${st}`, (STATUS[st] ? `<span class="g">${STATUS[st][0]}</span>` : '') + md(m.label)); lab.dataset.id = 'm' + i;
    const span = self ? colW - 30 : Math.abs(x2 - x1) - 16; lab.style.maxWidth = Math.max(120, span) + 'px'; el.append(lab);
    const lh = lab.offsetHeight; lab.style.left = (self ? x1 + colW / 2 - 6 : (x1 + x2) / 2) + 'px'; lab.style.top = y + 'px';
    const ay = y + lh + 7;
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', self ? `M${x1},${ay - 4} C${x1 + 60},${ay - 8} ${x1 + 60},${ay + 22} ${x1 + 4},${ay + 18}` : `M${x1},${ay} L${x2 + (x2 > x1 ? -3 : 3)},${ay}`);
    p.setAttribute('class', `edge msg ${st} ${m.kind === 'return' || m.kind === 'async' ? 'dashed' : ''}`); p.dataset.id = 'm' + i;
    p.setAttribute('marker-end', `url(#sq-${b.id.replace(/\W/g, '')}-${st || 'plain'})`); items.push(p);
    y = ay + (self ? 32 : 18);
  });
  const H = y + 10;
  const defs = document.createElementNS(NS, 'defs');
  for (const st of ['plain', 'added', 'changed', 'removed']) defs.innerHTML += `<marker id="sq-${b.id.replace(/\W/g, '')}-${st}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto" markerUnits="userSpaceOnUse"><path d="M1,1.5 L8.5,5 L1,8.5" fill="none" stroke="${st === 'plain' ? 'var(--faint)' : `var(--${st})`}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></marker>`;
  svg.append(defs);
  ps.forEach(p => { const l = document.createElementNS(NS, 'path'); l.setAttribute('d', `M${xOf(p.id)},${headH} V${H}`); l.setAttribute('stroke', 'var(--line-strong)'); l.setAttribute('stroke-dasharray', '1 5'); l.setAttribute('stroke-linecap', 'round'); l.setAttribute('stroke-width', '1.5'); svg.append(l); });
  items.forEach(p => svg.append(p));
  svg.setAttribute('width', W); svg.setAttribute('height', H); el.prepend(svg);
  el.style.height = H + 'px'; el.remove(); el.style.position = 'relative'; el.style.visibility = '';
  el._size = { w: W, h: H }; return el;
}
function fitSequence(fig, b) {
  const host = fig.querySelector('.dg-fit');
  const draw = () => {
    const avail = fig.querySelector('.dg-scroll').clientWidth; const narrow = avail < 640;
    if (host.dataset.key !== String(narrow)) { host.innerHTML = ''; const s = renderSequence(b, narrow); s.classList.add('dg-canvas'); s.style.position = 'absolute'; host.append(s); host.dataset.key = String(narrow); host._size = s._size; applyFocus(fig, fig._focus); }
    const { w, h } = host._size; const s = Math.max(Math.min(1, avail / w), .7);
    host.firstChild.style.transform = `scale(${s})`; host.style.width = w * s + 'px'; host.style.height = h * s + 'px';
  };
  draw(); new ResizeObserver(draw).observe(fig.querySelector('.dg-scroll'));
}

/* ---------- other blocks ---------- */
function renderCode(b) {
  const c = $('div', 'card code' + (b.wrap ? ' wrap' : ''));
  const url = b.ref ? refUrl(b.ref) : fileUrl(b.file, b.side === 'base');
  const adds = b.lines.filter(l => l.t === '+').length, dels = b.lines.filter(l => l.t === '-').length;
  c.innerHTML = `<div class="c-head">${icon('file').replace('<svg', '<svg width="15" height="15"')}<a href="${esc(url)}" target="_blank" rel="noopener">${esc(b.file)}</a>${b.status ? badge(b.status) : ''}<span class="cnt num">${adds ? `<span class="delta-add">+${adds}</span>` : ''}${dels ? `<span class="delta-del">−${dels}</span>` : ''}</span></div>`;
  const body = $('div', 'c-body'); const tb = $('table'); const pins = {}; (b.notes || []).forEach((n, i) => (pins[n.line] ??= []).push(i + 1));
  b.lines.forEach((l, i) => {
    const tr = $('tr', l.t === '+' ? 'add' : l.t === '-' ? 'del' : l.t === '…' ? 'gap' : '');
    tr.dataset.id = 'L' + i;
    if (l.t === '…') { tr.innerHTML = `<td colspan="5">${esc(l.text || '⋯')}</td>`; tb.append(tr); return; }
    tr.innerHTML = `<td class="ln num">${l.o ?? ''}</td><td class="ln num">${l.n ?? ''}</td><td class="sg">${l.t === '+' ? '+' : l.t === '-' ? '−' : ''}</td><td class="cd">${l.h}</td><td class="mk">${(pins[i] || []).map(p => `<span class="pin">${p}</span>`).join(' ')}</td>`;
    tb.append(tr);
  });
  body.append(tb); c.append(body);
  if (b.notes && b.notes.length) { const ol = $('ol', 'notes'); b.notes.forEach((n, i) => ol.append($('li', '', `<span class="pin">${i + 1}</span><div>${md(n.text)}</div>`))); c.append(ol); }
  return c;
}
function renderDecision(b) {
  const w = $('div', 'decision');
  w.append($('div', 'card q', `<strong>${md(b.question)}</strong>${b.context ? `<p>${md(b.context)}</p>` : ''}`));
  const opts = $('div', 'opts');
  for (const o of b.options || []) {
    const e = $('div', `card opt ${o.chosen ? 'chosen' : ''}`);
    e.innerHTML = `<div class="o-hd"><h3>${md(o.name)}</h3><span class="tag">${o.chosen ? icon('check') + 'Chosen' : 'Not chosen'}</span></div>${o.summary ? `<p>${md(o.summary)}</p>` : ''}<ul class="pc">${(o.pros || []).map(p => `<li class="pro"><span>${md(p)}</span></li>`).join('')}${(o.cons || []).map(p => `<li class="con"><span>${md(p)}</span></li>`).join('')}</ul>`;
    opts.append(e);
  }
  w.append(opts);
  w.append($('div', 'card why', `${icon('why')}<p>${b.why ? md(b.why) : '<span class="unstated">Rationale not stated in the PR, its commits or review thread.</span>'}${b.source ? ` <a class="ref" href="${esc(b.source)}">source</a>` : ''}</p>`));
  return w;
}
function renderSteps(b) {
  const ol = $('ol', 'steps');
  b.items.forEach((s, i) => { const li = $('li', s.status || '', `<div class="st"><h3>${md(s.title)}${s.status ? badge(s.status) : ''}</h3>${s.text ? `<p>${md(s.text)}</p>` : ''}${s.ref ? `<a class="ref" href="${esc(refUrl(s.ref))}" target="_blank" rel="noopener">${esc(refLabel(s.ref))}</a>` : ''}</div>`); li.dataset.id = 'i' + i; ol.append(li); });
  return ol;
}
function renderFiles(b) {
  const c = $('div', 'card files'); const max = Math.max(1, ...b.areas.flatMap(a => a.files.map(f => f.add + f.del)));
  for (const a of b.areas) {
    const s = $('div', 'f-area', `<h3>${md(a.name)}${a.why ? `<span class="why-a">${md(a.why)}</span>` : ''}</h3>`);
    for (const f of a.files) {
      const dir = f.path.includes('/') ? f.path.slice(0, f.path.lastIndexOf('/') + 1) : ''; const base = f.path.slice(dir.length);
      const r = $('div', 'f-row');
      const pa = Math.max(f.add ? 2 : 0, Math.round(f.add / max * 100)), pd = Math.max(f.del ? 2 : 0, Math.round(f.del / max * 100));
      r.innerHTML = `<span class="ord num ${f.order ? '' : 'none'}">${f.order || ''}</span><a class="p" href="${esc(fileUrl(f.path, f.status === 'removed'))}" target="_blank" rel="noopener"><span class="dir">${esc(dir)}</span>${esc(base)}${f.note ? `<small>${md(f.note)}</small>` : ''}</a><span class="ct num">${f.status === 'added' ? badge('added') + ' ' : f.status === 'removed' ? badge('removed') + ' ' : ''}<span class="delta-add">+${f.add}</span> <span class="delta-del">−${f.del}</span></span><span class="bar"><i class="a" style="width:${pa}%"></i><i class="d" style="width:${pd}%"></i></span>`;
      s.append(r);
    }
    c.append(s);
  }
  if (b.collapsed && b.collapsed.count) c.append($('div', 'f-collapsed', `${b.collapsed.count} more files not shown: ${md(b.collapsed.label || 'generated, lockfiles and snapshots')} (<span class="delta-add">+${b.collapsed.add}</span> <span class="delta-del">−${b.collapsed.del}</span>)`));
  return c;
}
function renderCompare(b) {
  const g = $('div', 'compare');
  for (const side of ['before', 'after']) {
    const d = b[side]; const e = $('div', `card side ${side}`, `<h3>${side === 'before' ? '<b class="mono">−</b>' : '<b class="mono">+</b>'} ${md(d.title || (side === 'before' ? 'Before' : 'After'))}</h3>`);
    if (d.image) e.append($('img', '', '')), e.lastChild.src = d.image, e.lastChild.alt = d.alt || d.title || side;
    if (d.points) e.append($('ul', '', d.points.map(p => `<li>${md(p)}</li>`).join('')));
    if (d.text) e.append($('div', 'md', mdBlock(d.text)));
    g.append(e);
  }
  return g;
}
const renderCallout = b => $('div', `card callout ${b.tone || 'note'}`, `${icon(b.tone === 'risk' ? 'risk' : b.tone === 'test' ? 'check' : 'note')}<div><h3>${md(b.title || '')}</h3><div class="md">${mdBlock(b.text)}</div></div>`);
function renderMetrics(b) {
  const c = $('div', 'card metrics');
  for (const m of b.items) {
    const max = Math.max(m.before, m.after) || 1; const better = (m.better || 'lower') === 'lower' ? m.after < m.before : m.after > m.before;
    const pct = m.before ? Math.round((m.after - m.before) / m.before * 100) : 0;
    c.append($('div', 'metric', `<div class="m-hd"><span>${md(m.label)}</span><span class="delta num">${m.after === m.before ? '= no change' : `${pct > 0 ? '+' : ''}${pct}% ${better ? '✓ better' : '✕ worse'}`}</span></div>
      <div class="m-row before"><span>Before</span><span class="track"><i style="width:${m.before / max * 100}%"></i></span><span class="v num">${m.before}${esc(m.unit || '')}</span></div>
      <div class="m-row after"><span>After</span><span class="track"><i style="width:${m.after / max * 100}%"></i></span><span class="v num">${m.after}${esc(m.unit || '')}</span></div>${m.source ? `<div class="m-row"><span></span><span>${md(m.source)}</span></div>` : ''}`));
  }
  return c;
}
function renderScreens(b) {
  const g = $('div', 'screens');
  for (const s of b.items) { const f = $('figure', 'card', `<img src="${s.src}" alt="${esc(s.alt || s.caption || '')}"><figcaption>${s.status ? badge(s.status, s.tag) : ''}${md(s.caption || '')}</figcaption>`); g.append(f); }
  return g;
}

function blockEl(b, idx) {
  const sec = $('section', 'block'); sec.id = b.id; sec.dataset.block = b.id;
  const hd = $('header'); hd.innerHTML = `<div class="kicker">${icon(BLOCK_ICON[b.type] || 'note')}${esc(b.kicker || `${idx + 1}`)}</div><h2>${md(b.title)}</h2>${b.lede ? `<p class="lede">${md(b.lede)}</p>` : ''}`;
  sec.append(hd);
  if (b.type === 'diagram' || b.type === 'sequence') {
    const fig = $('div', 'figure'); fig.innerHTML = '<div class="dg-scroll"><div class="dg-fit"></div></div>'; sec.append(fig);
    const lg = legendFor(b); if (lg) fig.append(lg);
    const t = tourUI(fig, b); if (t) fig.append(t);
    sec._mount = () => (b.type === 'diagram' ? fitDiagram : fitSequence)(fig, b);
  } else if (b.type === 'code') sec.append(renderCode(b));
  else if (b.type === 'decision') sec.append(renderDecision(b));
  else if (b.type === 'steps') sec.append(renderSteps(b));
  else if (b.type === 'files') sec.append(renderFiles(b));
  else if (b.type === 'compare') sec.append(renderCompare(b));
  else if (b.type === 'callout') sec.append(renderCallout(b));
  else if (b.type === 'metrics') sec.append(renderMetrics(b));
  else if (b.type === 'screens') sec.append(renderScreens(b));
  return sec;
}

function header() {
  const pr = S.pr; const h = $('header', 'hd');
  const merged = pr.state === 'merged';
  h.innerHTML = `<div class="hd-top"><a href="${gh}">${esc(pr.repo)}</a><span class="dot-sep"></span><a href="${gh}/pull/${pr.number}">#${pr.number}</a><span class="state">${icon(merged ? 'merged' : 'open')}${esc(pr.state ? pr.state[0].toUpperCase() + pr.state.slice(1) : 'Open')}</span><button class="theme-btn" type="button" aria-label="Toggle dark mode">${icon('moon')}</button></div>
  <h1 class="title">${md(pr.title)}</h1>${S.tldr ? `<p class="tldr">${md(S.tldr)}</p>` : ''}
  <div class="meta">${pr.author ? `<span>${icon('user')}${esc(pr.author)}</span>` : ''}<span>${icon('branch')}<span class="mono">${esc(pr.head || '')}</span> → <span class="mono">${esc(pr.base || '')}</span></span>${pr.stats ? `<span class="num">${icon('files')}${pr.stats.files} files · <span class="delta-add">+${pr.stats.add}</span> <span class="delta-del">−${pr.stats.del}</span></span>` : ''}</div>`;
  if (S.summary) {
    const t = $('div', 'trio');
    [['goal', 'Goal', S.summary.goal], ['change', 'What changed', S.summary.change], ['why', 'Why this way', S.summary.why]].forEach(([k, l, v]) => v && t.append($('div', 'card', `<h3>${icon(k)}${l}</h3><p>${md(v)}</p>`)));
    h.append(t);
  }
  if (S.blocks.length > 3) { const toc = $('nav', 'toc'); S.blocks.forEach(b => toc.append(Object.assign($('a', '', md(b.nav || b.title)), { href: '#' + b.id }))); h.append(toc); }
  const btn = h.querySelector('.theme-btn');
  const cur = () => document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const paint = () => btn.innerHTML = icon(cur() === 'dark' ? 'sun' : 'moon');
  btn.onclick = () => { document.documentElement.dataset.theme = cur() === 'dark' ? 'light' : 'dark'; paint(); }; paint();
  return h;
}

function page() {
  const pg = $('main', 'page'); pg.append(header());
  const secs = S.blocks.map((b, i) => blockEl(b, i)); secs.forEach(s => pg.append(s));
  pg.append($('footer', 'foot', `<span>Explains <a href="${gh}/pull/${S.pr.number}">${esc(S.pr.repo)}#${S.pr.number}</a> at <a class="mono" href="${gh}/commit/${S.pr.headSha}">${esc((S.pr.headSha || '').slice(0, 7))}</a></span><span>Status uses symbols as well as colour: + new · ~ changed · − removed (dashed)</span>${S.video ? '<span><a href="explainer.mp4">Narrated video</a></span>' : ''}`));
  document.body.append(pg); secs.forEach(s => s._mount && s._mount());
}

/* ---------- layout pass (build time) ---------- */
async function layoutPass() {
  const elk = new ELK(); const out = {};
  const box = $('div', 'measure'); box.style.cssText = 'position:absolute;left:-9999px;top:0;'; document.body.append(box);
  const measure = el => { box.append(el); const r = { w: Math.ceil(el.offsetWidth), h: Math.ceil(el.offsetHeight) }; el.remove(); return r; };
  for (const b of S.blocks.filter(b => b.type === 'diagram')) {
    const sizes = {}; for (const n of allNodes(b)) sizes[n.id] = measure(makeNode(n));
    const lsz = {}; for (const e of b.edges || []) if (e.label) { const st = e.status && e.status !== 'unchanged' ? e.status : ''; lsz[edgeId(e)] = measure($('div', `e-label boxed ${st}`, (STATUS[st] ? `<b class="mono">${STATUS[st][0]}</b> ` : '') + md(e.label))); }
    const gsz = {}; for (const g of allGroups(b)) { const l = $('div', 'dg-group'); l.style.position = 'relative'; l.innerHTML = `<span class="g-label" style="position:static;display:inline-flex">${g.kind ? icon(g.kind) : ''}${md(g.label)}${g.status && g.status !== 'unchanged' ? ' ' + badge(g.status) : ''}</span>`; gsz[g.id] = measure(l); }
    out[b.id] = {};
    const dirs = { wide: b.direction || 'RIGHT', narrow: b.narrowDirection || 'DOWN' };
    for (const [key, dir] of Object.entries(dirs)) {
      const parent = {}; const toElk = n => n.children ? (n.children.forEach(c => parent[c.id] = n.id), {
        id: n.id, layoutOptions: { 'elk.padding': `[top=${44},left=18,bottom=18,right=18]`, 'elk.nodeSize.constraints': 'MINIMUM_SIZE', 'elk.nodeSize.minimum': `(${gsz[n.id].w + 36},40)` }, children: n.children.map(toElk)
      }) : { id: n.id, width: sizes[n.id].w, height: sizes[n.id].h };
      const graph = {
        id: 'root', layoutOptions: {
          'elk.algorithm': 'layered', 'elk.direction': dir, 'elk.hierarchyHandling': 'INCLUDE_CHILDREN', 'elk.edgeRouting': 'ORTHOGONAL',
          'elk.spacing.nodeNode': String(b.spacing || 30), 'elk.layered.spacing.nodeNodeBetweenLayers': String(b.layerSpacing || 70),
          'elk.spacing.edgeNode': '22', 'elk.spacing.edgeEdge': '14', 'elk.spacing.edgeLabel': '6', 'elk.layered.spacing.edgeNodeBetweenLayers': '22',
          'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES', 'elk.layered.cycleBreaking.strategy': 'MODEL_ORDER', 'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
          'elk.edgeLabels.placement': 'CENTER', 'elk.layered.edgeLabels.sideSelection': 'SMART_DOWN', 'elk.padding': '[top=6,left=6,bottom=6,right=6]',
        },
        children: b.nodes.map(toElk),
        edges: (b.edges || []).map(e => ({ id: edgeId(e), sources: [e.from], targets: [e.to], labels: e.label ? [{ id: edgeId(e) + ':l', width: lsz[edgeId(e)].w, height: lsz[edgeId(e)].h, text: 'x' }] : [] })),
      };
      const res = await elk.layout(graph);
      const abs = {}; const L = { dir, w: Math.ceil(res.width), h: Math.ceil(res.height), nodes: {}, groups: {}, edges: {} };
      const walk = (n, ox, oy) => (n.children || []).forEach(c => { const x = ox + c.x, y = oy + c.y; abs[c.id] = { x, y }; (c.children && c.children.length ? L.groups : L.nodes)[c.id] = { x: Math.round(x), y: Math.round(y), w: Math.round(c.width), h: Math.round(c.height) }; walk(c, x, y); });
      walk(res, 0, 0); abs.root = { x: 0, y: 0 };
      const anc = id => { const a = []; while (id) { a.push(id); id = parent[id]; } return a; };
      for (const e of res.edges) {
        const src = e.sources[0], tgt = e.targets[0]; const as = anc(parent[src]), at = new Set(anc(parent[tgt]));
        const lca = as.find(x => at.has(x)) || 'root'; const o = abs[lca] || abs.root;
        const s = e.sections && e.sections[0]; if (!s) continue;
        const pts = [s.startPoint, ...(s.bendPoints || []), s.endPoint].map(p => ({ x: Math.round(p.x + o.x), y: Math.round(p.y + o.y) }));
        const lab = e.labels && e.labels[0] && e.labels[0].x != null ? { x: Math.round(e.labels[0].x + o.x), y: Math.round(e.labels[0].y + o.y), w: e.labels[0].width, h: e.labels[0].height } : null;
        L.edges[e.id] = { points: pts, label: lab };
      }
      out[b.id][key] = L;
    }
  }
  window.__LAYOUTS = out;
}

/* ---------- video ---------- */
let V = null;
function videoInit(tl) {
  document.body.className = 'video';
  const stage = $('div', 'v-stage'); document.body.append(stage);
  const slides = {};
  const mk = b => {
    if (slides[b.id]) return slides[b.id];
    const sl = $('div', 'v-slide'); const view = $('div', 'v-view'); const cam = $('div', 'v-cam'); view.append(cam); sl.append(view); stage.append(sl);
    let inner, size;
    if (b.type === 'diagram') { inner = renderDiagram(b, 'wide'); inner.style.position = 'relative'; size = { w: b.layouts.wide.w, h: b.layouts.wide.h }; }
    else if (b.type === 'sequence') { inner = renderSequence(b, false); size = inner._size; }
    else { const sec = blockEl(b, 0); sec.style.width = (b.videoWidth || 1100) + 'px'; inner = sec; }
    cam.append(inner);
    if (!size) { size = { w: inner.offsetWidth, h: inner.offsetHeight }; }
    const vw = view.clientWidth, vh = view.clientHeight;
    slides[b.id] = { sl, cam, inner, size, vw, vh, b };
    inner.querySelectorAll('path.edge').forEach(p => { p._len = p.getTotalLength(); });
    return slides[b.id];
  };
  tl.scenes.forEach(s => { if (s.block) mk(S.blocks.find(b => b.id === s.block)); });
  const intro = $('div', 'v-intro', `<div class="k">${esc(S.pr.repo)} <span class="dot-sep"></span> #${S.pr.number}</div><h1>${md(S.pr.title)}</h1>${S.tldr ? `<p>${md(S.tldr)}</p>` : ''}`);
  stage.append(intro);
  const chap = $('div', 'v-chapter'); const prl = $('div', 'v-pr', `${esc(S.pr.repo)} #${S.pr.number}`); const cap = $('div', 'v-caption'); const prog = $('div', 'v-progress');
  stage.append(chap, prl, cap, prog);
  V = { tl, slides, intro, chap, cap, prog, prl };
}
const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
function camFor(sd, f) {
  const { size, vw, vh, inner, b } = sd; const fit = Math.min(vw / size.w, vh / size.h, b.maxVideoScale || 1.6);
  let bx = null;
  if (f && (b.type === 'diagram') && f.nodes.size) {
    const L = b.layouts.wide; let x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9;
    f.nodes.forEach(id => { const r = L.nodes[id] || L.groups[id]; if (!r) return; x1 = Math.min(x1, r.x); y1 = Math.min(y1, r.y); x2 = Math.max(x2, r.x + r.w); y2 = Math.max(y2, r.y + r.h); });
    if (x2 > x1) bx = { x: x1 - 60, y: y1 - 60, w: x2 - x1 + 120, h: y2 - y1 + 120 };
  } else if (f && b.type === 'code' && f.lines) {
    const rows = [...inner.querySelectorAll('tr')].filter((r, i) => i >= f.lines[0] && i <= f.lines[1]);
    if (rows.length) { const top = rows[0].offsetTop + inner.querySelector('.c-body').offsetTop, bot = rows[rows.length - 1].offsetTop + rows[rows.length - 1].offsetHeight + inner.querySelector('.c-body').offsetTop; bx = { x: 0, y: top - 120, w: size.w, h: bot - top + 240 }; }
  } else if (f && b.type === 'steps' && f.items) {
    const lis = [...inner.querySelectorAll('.steps li')].filter((_, k) => f.items.includes(k));
    if (lis.length) { const top = Math.min(...lis.map(l => l.offsetTop)), bot = Math.max(...lis.map(l => l.offsetTop + l.offsetHeight)); bx = { x: 0, y: top - 80, w: size.w, h: bot - top + 160 }; }
  }
  if (!bx) return { s: fit, x: (vw - size.w * fit) / 2, y: (vh - size.h * fit) / 2 };
  const s = Math.max(fit, Math.min(vw / bx.w, vh / bx.h, b.maxVideoZoom || 1.6));
  let x = vw / 2 - (bx.x + bx.w / 2) * s, y = vh / 2 - (bx.y + bx.h / 2) * s;
  const minX = Math.min(0, vw - size.w * s), minY = Math.min(0, vh - size.h * s);
  x = size.w * s <= vw ? (vw - size.w * s) / 2 : clamp(x, minX, 0); y = size.h * s <= vh ? (vh - size.h * s) / 2 : clamp(y, minY, 0);
  return { s, x, y };
}
function captionHTML(sc, t) {
  const sents = sc.sentences || [{ text: sc.say, start: sc.start }];
  let cur = sents[0]; for (const s of sents) if (t >= s.start - .05) cur = s;
  return esc(cur?.text).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*([^*]+)\*/g, '<mark>$1</mark>');
}
function renderAt(t) {
  const { tl, slides, intro, chap, cap, prog } = V; const sc = tl.scenes; let i = 0;
  for (let k = 0; k < sc.length; k++) if (t >= sc[k].start) i = k;
  const s = sc[i]; const prev = sc[i - 1];
  prog.style.width = (clamp(t / tl.total) * 100) + '%';
  const introOn = !s.block; intro.style.opacity = introOn ? 1 : prev && !prev.block ? 1 - ease(clamp((t - s.start) / .5)) : 0;
  const ui = s.block ? 1 : 0; [chap, cap, V.prl].forEach(e => e.style.opacity = ui);
  for (const sd of Object.values(slides)) sd.sl.style.opacity = 0;
  if (!s.block) { cap.style.opacity = s.say ? 1 : 0; if (s.say) cap.innerHTML = captionHTML(s, t); return; }
  const b = S.blocks.find(x => x.id === s.block); const sd = slides[b.id];
  const blockIdx = S.blocks.indexOf(b);
  chap.innerHTML = `<span class="n">${blockIdx + 1}</span>${md(b.nav || b.title)}`;
  cap.innerHTML = captionHTML(s, t);
  const fade = prev && prev.block !== s.block ? ease(clamp((t - s.start) / .45)) : 1;
  sd.sl.style.opacity = fade;
  if (prev && prev.block && prev.block !== s.block && fade < 1) slides[prev.block].sl.style.opacity = 1 - fade;
  const step = s.step != null ? (b.steps || b.items ? (b.steps || [])[s.step] : null) : null;
  const f = s.focus ? focusSets(b, s.focus) : step ? focusSets(b, step) : null;
  applyFocus(sd.inner.closest('.v-cam'), f && (f.nodes.size || f.edges.size) ? f : null);
  if (b.type === 'steps' && s.items) { sd.inner.querySelector('.steps').classList.add('has-focus'); sd.inner.querySelectorAll('.steps li').forEach((li, k) => li.classList.toggle('is-focus', s.items.includes(k))); }
  if (b.type === 'code' && s.lines) sd.inner.querySelectorAll('tr').forEach((r, k) => r.classList.toggle('is-focus', k >= s.lines[0] && k <= s.lines[1]));
  const cf = f || (s.lines ? { lines: s.lines, nodes: new Set() } : s.items ? { items: s.items, nodes: new Set() } : null);
  const to = camFor(sd, cf);
  let from = to;
  if (prev && prev.block === s.block) {
    const pb = prev.step != null ? (b.steps || [])[prev.step] : null; const pf = prev.focus ? focusSets(b, prev.focus) : pb ? focusSets(b, pb) : (prev.lines ? { lines: prev.lines, nodes: new Set() } : null);
    from = camFor(sd, pf || (prev.items ? { items: prev.items, nodes: new Set() } : null));
  }
  const k = ease(clamp((t - s.start) / .9));
  const c = { s: from.s + (to.s - from.s) * k, x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k };
  sd.cam.style.transform = `translate(${c.x}px,${c.y}px) scale(${c.s})`;
  sd.inner.querySelectorAll('path.edge').forEach(p => {
    const draw = f && f.edges.has(p.dataset.id) && (p.classList.contains('added') || s.draw);
    if (draw && p._len) { const q = ease(clamp((t - s.start - .3) / .9)); p.style.strokeDasharray = `${p._len}`; p.style.strokeDashoffset = `${p._len * (1 - q)}`; }
    else { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; }
  });
}

/* ---------- boot ---------- */
async function boot() {
  await document.fonts.ready;
  if (MODE === 'layout') return layoutPass();
  if (MODE === 'video') { document.documentElement.dataset.theme = Q.get('theme') || 'light'; window.__videoInit = videoInit; window.renderAt = renderAt; window.__ready = true; return; }
  page();
}
document.documentElement.classList.add('js');
window.__booted = boot();
})();
