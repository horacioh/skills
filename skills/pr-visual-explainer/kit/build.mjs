#!/usr/bin/env node
// Usage: node build.mjs <spec.json> --work <collect workdir> [--repo <checkout>] [--out <dir>] [--no-shots]
// Validates the spec against the real PR (refs, diff excerpts, file list), highlights code,
// runs the ELK layout in Chrome with real fonts, writes a self-contained out/index.html,
// then screenshots every block (desktop) and the full page (phone) and checks for overflow.
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url'; import { chromium } from 'playwright-core'; import { codeToTokens, bundledLanguages } from 'shiki';
import { findChrome } from './chrome.mjs';
import { manifestScreens } from './screens.mjs';
import { parseDiff } from './diff.mjs';

const KIT = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2); const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const specPath = args[0]; if (!specPath) { console.error('usage: node build.mjs spec.json --work work [--repo checkout] [--out out]'); process.exit(2); }
const SPEC_DIR = path.dirname(path.resolve(specPath));
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const work = opt('--work'); const repo = opt('--repo'); const out = path.resolve(opt('--out') || 'out');
const errors = [], warns = [];
const err = m => errors.push(m), warn = m => warns.push(m);

// ---- PR metadata from collect.sh
if (work) {
  const meta = JSON.parse(fs.readFileSync(path.join(work, 'meta.json'), 'utf8'));
  spec.pr = { ...meta, ...spec.pr, headSha: meta.headSha, baseSha: meta.baseSha, stats: meta.stats };
}
for (const k of ['repo', 'number', 'title', 'headSha', 'baseSha']) if (!spec.pr?.[k]) err(`pr.${k} missing (run collect.sh and pass --work)`);
const diffText = work && fs.existsSync(path.join(work, 'pr.diff')) ? fs.readFileSync(path.join(work, 'pr.diff'), 'utf8') : null;

const diffFiles = parseDiff(diffText || '');


// Verbatim slice of a real hunk: { hunk: text inside the hunk, from: first line text, to: last line text }
function pickHunk(real, pk, where) {
  const h = real.hunks.find(h => (h.header + '\n' + h.lines.join('\n')).includes(pk.hunk || pk.from || ''));
  if (!h) return err(`${where}: no hunk contains "${pk.hunk || pk.from}"`);
  let a = pk.from ? h.lines.findIndex(l => l.includes(pk.from)) : 0;
  if (a < 0) return err(`${where}: "${pk.from}" not in hunk ${h.header}`);
  let z = pk.to ? h.lines.findIndex((l, i) => i >= a && l.includes(pk.to)) : h.lines.length - 1;
  if (z < 0) return err(`${where}: "${pk.to}" not after "${pk.from}" in hunk ${h.header}`);
  let [, o, n] = h.header.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)/).map(Number);
  for (const l of h.lines.slice(0, a)) { if (l[0] !== '+') o++; if (l[0] !== '-') n++; }
  return `@@ -${o} +${n} @@ ${pk.label || ''}\n` + h.lines.slice(a, z + 1).join('\n');
}


// ref + find -> ref with real line numbers, so prose never cites a guessed range.
// find: "text on the line" or ["first line text", "last line text"]. Nodes may use `symbol`.
const fileText = {};
function showFile(sha, f) { const k = sha + ':' + f; if (!(k in fileText)) { try { fileText[k] = execFileSync('git', ['-C', repo, 'show', k], { maxBuffer: 64e6 }).toString().split('\n'); } catch { fileText[k] = null; } } return fileText[k]; }
function resolveFind(o, where) {
  const find = o.find ?? o.symbol; if (!o.ref || find == null || /#L\d/.test(o.ref) || /^https?:/.test(o.ref) || !repo) return;
  const base = o.ref.startsWith('base:'); const f = o.ref.replace(/^base:/, ''); const lines = showFile(base ? spec.pr.baseSha : spec.pr.headSha, f);
  if (!lines) return err(`${where}: ${f} not found at ${base ? 'base' : 'head'}`);
  const [a, z] = Array.isArray(find) ? find : [find];
  const i = lines.findIndex(l => l.includes(a)); if (i < 0) return err(`${where}: "${a}" not found in ${f}`);
  if (lines.filter(l => l.includes(a)).length > 1) warn(`${where}: "${a}" occurs more than once in ${f}; using the first (line ${i + 1})`);
  let j = i; if (z) { j = lines.findIndex((l, k) => k > i && l.includes(z)); if (j < 0) return err(`${where}: "${z}" not found after line ${i + 1} in ${f}`); }
  o.ref = `${o.ref}#L${i + 1}${j > i ? `-L${j + 1}` : ''}`; delete o.find;
}

const COLLAPSE = '(^|/)(bun\\.lockb?|package-lock\\.json|pnpm-lock\\.yaml|yarn\\.lock|Cargo\\.lock|go\\.sum)$|(^|/)dist/|\\.snap$|(^|/)meta/_journal\\.json$|(^|/)meta/\\d+_snapshot\\.json$|\\.min\\.(js|css)$';
// ---- refs must point at real files/lines at the right commit
const lineCount = {};
function checkRef(ref, where) {
  if (!ref || /^https?:/.test(ref)) return;
  const m = ref.match(/^(base:)?([^#]+)(?:#L(\d+)(?:-L(\d+))?)?$/); if (!m) return err(`${where}: bad ref "${ref}" (use path#L10-L20 or base:path#L3)`);
  if (!repo) return;
  const sha = m[1] ? spec.pr.baseSha : spec.pr.headSha; const key = sha + ':' + m[2];
  if (!(key in lineCount)) { try { lineCount[key] = execFileSync('git', ['-C', repo, 'show', key], { maxBuffer: 64e6 }).toString().split('\n').length; } catch { lineCount[key] = -1; } }
  if (lineCount[key] < 0) return err(`${where}: ${m[2]} does not exist at ${m[1] ? 'base' : 'head'} ${sha.slice(0, 7)}${m[1] ? '' : ' (removed code needs base:)'}`);
  const hi = +(m[4] || m[3] || 0); if (hi > lineCount[key]) err(`${where}: ${ref} past end of file (${lineCount[key]} lines)`);
}

// ---- block validation + enrichment
const ids = new Set(); spec.blocks ||= [];
const langOf = f => { const e = path.extname(f).slice(1).toLowerCase(); const map = { mjs: 'js', cjs: 'js', mts: 'ts', yml: 'yaml', sh: 'bash', md: 'markdown', h: 'c', rs: 'rust', py: 'python', rb: 'ruby', kt: 'kotlin' }; const l = map[e] || e; return bundledLanguages[l] ? l : (f.endsWith('Dockerfile') ? 'docker' : 'text'); };
for (const b of spec.blocks) {
  const W = `block "${b.id}"`;
  if (!b.id || ids.has(b.id)) err(`${W}: missing or duplicate id`); ids.add(b.id);
  if (!b.title) err(`${W}: title missing`);
  if (b.type === 'diagram') {
    const nids = new Set(), gids = new Set();
    const walk = ns => ns.forEach(n => { if (!n.id) err(`${W}: node without id`); if (nids.has(n.id) || gids.has(n.id)) err(`${W}: duplicate node id ${n.id}`); if (n.children) { gids.add(n.id); walk(n.children); } else { nids.add(n.id); resolveFind(n, `${W} node ${n.id}`); checkRef(n.ref, `${W} node ${n.id}`); } });
    walk(b.nodes || []);
    for (const e of b.edges || []) { for (const end of [e.from, e.to]) { if (gids.has(end)) err(`${W}: edge ${e.from}->${e.to} touches group ${end}; connect leaf nodes`); else if (!nids.has(end)) err(`${W}: edge endpoint ${end} is not a node`); } }
    for (const [i, s] of (b.steps || []).entries()) for (const f of s.focus || []) if (!nids.has(f) && !gids.has(f)) err(`${W}: step ${i + 1} focuses unknown ${f}`);
    if (nids.size > 18) warn(`${W}: ${nids.size} nodes; split it or use groups + a tour, readers lose the thread past ~15`);
  } else if (b.type === 'sequence') {
    const ps = new Set((b.participants || []).map(p => p.id));
    (b.messages || []).forEach((m, i) => { if (m.divider || m.note) return; resolveFind(m, `${W} message ${i}`); for (const x of [m.from, m.to]) if (!ps.has(x)) err(`${W}: message ${i} uses unknown participant ${x}`); checkRef(m.ref, `${W} message ${i}`); });
  } else if (b.type === 'code') {
    const real = diffFiles.get(b.file);
    if (b.pick && real) b.diff = (Array.isArray(b.pick) ? b.pick : [b.pick]).map((pk, i) => pickHunk(real, pk, `${W} pick ${i + 1}`)).filter(Boolean).join('\n');
    if (!b.file || !b.diff) { err(`${W}: code needs file + pick (or a verbatim diff excerpt from pr.diff)`); continue; }
    if (diffText && !real) err(`${W}: ${b.file} is not changed in this PR`);
    const lines = []; let o = 0, n = 0;
    for (const raw of b.diff.replace(/\n$/, '').split('\n')) {
      const h = raw.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)/);
      if (h) { if (lines.length) lines.push({ t: '…', text: h[3].trim() || '⋯' }); o = +h[1]; n = +h[2]; continue; }
      if (raw === '…' || raw === '...') { lines.push({ t: '…', text: '⋯' }); continue; }
      const t = raw[0] === '+' ? '+' : raw[0] === '-' ? '-' : ' '; const code = raw.slice(1);
      if (real && t === '+' && !real.added.has(code.trim())) err(`${W}: added line not in the PR diff: ${code.trim().slice(0, 80)}`);
      if (real && t === '-' && !real.removed.has(code.trim())) err(`${W}: removed line not in the PR diff: ${code.trim().slice(0, 80)}`);
      lines.push({ t, code, o: t === '+' ? null : o, n: t === '-' ? null : n }); if (t !== '+') o++; if (t !== '-') n++;
    }
    const lang = b.lang || langOf(b.file);
    const src = lines.filter(l => l.t !== '…').map(l => l.code).join('\n');
    const tok = await codeToTokens(src, { lang, themes: { light: 'github-light', dark: 'github-dark' } });
    let k = 0;
    for (const l of lines) { if (l.t === '…') continue; const tl = tok.tokens[k++] || []; l.h = tl.map(x => `<span style="color:${x.htmlStyle?.color || x.color};--shiki-dark:${x.htmlStyle?.['--shiki-dark'] || ''}">${x.content.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</span>`).join(''); delete l.code; }
    b.notes = (b.notes || []).map((nt, i) => { const idx = lines.findIndex(l => l.h && l.h.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').includes(nt.at)); if (idx < 0) err(`${W}: note ${i + 1} anchor "${nt.at}" not found in excerpt`); return { line: idx, text: nt.text }; });
    b.lines = lines; delete b.diff;
    // long markup lines (Tailwind classes, JSX) read better wrapped than scrolled
    if (b.wrap === undefined) b.wrap = Math.max(...lines.map(l => (l.h || '').replace(/<[^>]+>/g, '').length)) > 110;
    if (lines.length > 60) warn(`${W}: ${lines.length} lines; trim to the lines that carry the idea`);
  } else if (b.type === 'files') {
    if (!work) { warn(`${W}: no --work, file stats unavailable`); continue; }
    const ns = fs.readFileSync(path.join(work, 'numstat.tsv'), 'utf8').trim().split('\n').filter(Boolean).map(l => l.split('\t'));
    const stat = {}; for (const [a, d, ...p] of ns) { let f = p.join('\t'); const ren = f.match(/^(.*)\{(.*) => (.*)\}(.*)$/) || f.match(/^()(.*) => (.*)()$/); if (ren) f = ren[1] + ren[3] + ren[4]; stat[f.replace(/\/\//g, '/')] = { add: +a || 0, del: +d || 0, bin: a === '-' }; }
    const st = {}; for (const l of fs.readFileSync(path.join(work, 'name-status.tsv'), 'utf8').trim().split('\n')) { const [s, ...p] = l.split('\t'); st[p[p.length - 1]] = s[0]; }
    const seen = new Set();
    // areas may claim files by regex: { name, match: "__tests__|\\.test\\." }
    { const placed = new Set((b.areas || []).flatMap(a => (a.files || []).map(f => f.path)));
      for (const a of b.areas || []) { a.files = a.files || []; if (a.match) { const re = new RegExp(a.match); for (const p of Object.keys(stat)) if (!placed.has(p) && re.test(p) && !new RegExp(b.collapse || COLLAPSE).test(p)) { a.files.push({ path: p }); placed.add(p); } delete a.match; } } }
    for (const a of b.areas || []) for (const f of a.files) { const s = stat[f.path]; if (!s) { err(`${W}: ${f.path} not in this PR`); continue; } Object.assign(f, s, { status: f.status || (st[f.path] === 'A' ? 'added' : st[f.path] === 'D' ? 'removed' : undefined) }); seen.add(f.path); }
    const gen = new RegExp(b.collapse || COLLAPSE);
    const rest = Object.keys(stat).filter(f => !seen.has(f));
    const collapsed = rest.filter(f => gen.test(f)); const missing = rest.filter(f => !gen.test(f));
    if (missing.length) { warn(`${W}: ${missing.length} changed files not placed in an area, added to "Other": ${missing.slice(0, 6).join(', ')}${missing.length > 6 ? '…' : ''}`); b.areas.push({ name: 'Other', files: missing.map(p => ({ path: p, ...stat[p] })) }); }
    b.collapsed = { count: collapsed.length, add: collapsed.reduce((s, f) => s + stat[f].add, 0), del: collapsed.reduce((s, f) => s + stat[f].del, 0), label: b.collapsedLabel };
  } else if (b.type === 'steps') (b.items || []).forEach((s, i) => { resolveFind(s, `${W} item ${i + 1}`); checkRef(s.ref, `${W} item ${i + 1}`); });
  else if (b.type === 'screens' || b.type === 'compare') {
    const inline = o => { if (o && o.src && !o.src.startsWith('data:') && !/^https?:/.test(o.src)) { const p = path.resolve(SPEC_DIR, o.src); if (!fs.existsSync(p)) return err(`${W}: image ${o.src} missing`); o.src = `data:image/${path.extname(p).slice(1).replace('jpg', 'jpeg')};base64,${fs.readFileSync(p).toString('base64')}`; } };
    if (b.type === 'screens') {
      if (b.manifest !== undefined) {
        try {
          if (b.items !== undefined) throw new Error('use manifest or items, not both');
          b.items = manifestScreens(SPEC_DIR, b.manifest);
          delete b.manifest;
        } catch (e) { err(`${W}: ${e.message}`); }
      } else (b.items ||= []).forEach(inline);
    } else for (const s of ['before', 'after']) if (b[s]?.image) { const o = { src: b[s].image }; inline(o); b[s].image = o.src; }
  } else if (b.type === 'decision') { if (!b.why) warn(`${W}: no "why"; page will say the rationale is not stated. Ask the author rather than inventing one.`); if (!(b.options || []).some(o => o.chosen)) err(`${W}: mark the chosen option`); }
}
if (spec.video) for (const [i, s] of (spec.video.scenes || []).entries()) if (s.block && !ids.has(s.block)) err(`video scene ${i + 1}: unknown block ${s.block}`);

warns.splice(0).forEach(w => console.warn('warn:', w));
if (errors.length) { errors.forEach(e => console.error('error:', e)); console.error(`\n${errors.length} error(s): the explainer would show something the PR does not contain. Fix the spec.`); process.exit(1); }

// ---- assemble HTML
const font = (pkg, file) => `data:font/woff2;base64,${fs.readFileSync(path.join(KIT, 'node_modules/@fontsource', pkg, 'files', file)).toString('base64')}`;
const faces = [['Inter', 'inter', [400, 500, 600, 700]], ['Inter Tight', 'inter-tight', [500, 600, 700]], ['JetBrains Mono', 'jetbrains-mono', [400, 700]]]
  .flatMap(([fam, pkg, ws]) => ws.map(w => `@font-face{font-family:"${fam}";font-weight:${w};font-style:normal;font-display:block;src:url(${font(pkg, `${pkg}-latin-${w}-normal.woff2`)}) format("woff2")}`)).join('\n');
const css = faces + '\n' + fs.readFileSync(path.join(KIT, 'template/styles.css'), 'utf8');
const js = fs.readFileSync(path.join(KIT, 'template/app.js'), 'utf8');
const html = (s, pre = '') => `<!doctype html><html lang="${spec.lang || 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${(spec.pr.title || '').replace(/[<&]/g, '')} · ${spec.pr.repo}#${spec.pr.number}</title><style>${css}</style></head><body>
${pre}<script>window.SPEC=${JSON.stringify(s).replace(/</g, '\\u003c')}</script><script>${js}</script></body></html>`;
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: findChrome(), args: ['--no-sandbox', '--font-render-hinting=none'] });
const consoleErrors = [];
async function open(url, viewport, scale = 1) { const p = await browser.newPage({ viewport, deviceScaleFactor: scale }); p.on('pageerror', e => consoleErrors.push(String(e))); p.on('console', m => m.type() === 'error' && consoleErrors.push(m.text())); await p.goto(url); return p; }

// layout pass with real font metrics
const layoutFile = path.join(out, '.layout.html');
fs.writeFileSync(layoutFile, html(spec, `<script>${fs.readFileSync(path.join(KIT, 'node_modules/elkjs/lib/elk.bundled.js'), 'utf8')}</script>`));
const lp = await open(`${pathToFileURL(layoutFile)}?layout`, { width: 1400, height: 900 });
await lp.evaluate(() => window.__booted);
fs.rmSync(layoutFile);
await lp.waitForFunction(() => window.__LAYOUTS, null, { timeout: 60000 }).catch(() => {});
const layouts = await lp.evaluate(() => window.__LAYOUTS); await lp.close();
if (!layouts) { console.error('layout failed:', consoleErrors.join('\n')); process.exit(1); }
for (const b of spec.blocks) if (layouts[b.id]) {
  b.layouts = layouts[b.id]; const w = b.layouts.wide.w, sc = Math.min(1, 1064 / w);
  if (sc < .72) warn(`block "${b.id}": wide layout is ${w}px, shown at ${Math.round(Math.max(sc, .55) * 100)}% on desktop${sc < .55 ? ' and scrolls sideways' : ''}. Try direction DOWN, fewer nodes, or split the diagram.`);
}
warns.splice(0).forEach(w => console.warn('warn:', w));
fs.writeFileSync(path.join(out, 'index.html'), html(spec));
fs.writeFileSync(path.join(out, 'spec.built.json'), JSON.stringify(spec));

// verification shots
if (!args.includes('--no-shots')) {
  const shots = path.join(out, 'shots'); fs.mkdirSync(shots, { recursive: true });
  const report = [];
  for (const [name, vp, scale] of [['desktop', { width: 1280, height: 900 }, 2], ['phone', { width: 390, height: 844 }, 3]]) {
    for (const theme of ['light', 'dark']) {
      const p = await open(pathToFileURL(path.join(out, 'index.html')).href, vp, scale);
      await p.evaluate(t => { document.documentElement.dataset.theme = t; }, theme); await p.waitForTimeout(300);
      const ov = await p.evaluate(() => {
        const iw = innerWidth, sw = document.documentElement.scrollWidth; if (sw <= iw) return { sw, iw };
        // name the deepest elements that stick out, ignoring those inside an intentional scroller
        const bad = [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > iw + 1 && !e.closest('.dg-scroll, .c-body') && ![...e.children].some(c => c.getBoundingClientRect().right > iw + 1));
        return { sw, iw, who: [...new Set(bad.slice(0, 4).map(e => `${e.closest('[data-block]')?.dataset.block || 'page'} > ${e.tagName.toLowerCase()}.${[...e.classList].join('.')} "${(e.textContent || '').trim().slice(0, 40)}"`))] };
      });
      if (ov.sw > ov.iw) report.push(`OVERFLOW ${name}/${theme}: page is ${ov.sw}px wide in a ${ov.iw}px viewport; culprits: ${ov.who.join(' | ')}`);
      if (theme === 'light' || name === 'desktop') await p.screenshot({ path: path.join(shots, `${name}-${theme}-full.png`), fullPage: true });
      if (name === 'desktop' && theme === 'light') {
        await p.locator('.hd').screenshot({ path: path.join(shots, `00-header.png`) });
        for (const [i, b] of spec.blocks.entries()) await p.locator(`[data-block="${b.id}"]`).screenshot({ path: path.join(shots, `${String(i + 1).padStart(2, '0')}-${b.id}.png`) });
      }
      // Diagrams too small to read on a phone
      if (name === 'phone' && theme === 'light') {
        const tiny = await p.evaluate(() => [...document.querySelectorAll('.dg-canvas')].map(c => ({ id: c.closest('[data-block]').id, s: new DOMMatrix(getComputedStyle(c).transform).a })).filter(x => x.s < .7));
        tiny.forEach(t => report.push(`note: ${t.id} renders at ${Math.round(t.s * 100)}% on phones (scrolls sideways inside its card)`));
      }
      await p.close();
    }
  }
  report.forEach(r => console.log(r));
}
await browser.close();
if (consoleErrors.length) { console.error('browser errors:\n' + consoleErrors.join('\n')); process.exit(1); }
console.log(`built ${path.join(out, 'index.html')} (${Math.round(fs.statSync(path.join(out, 'index.html')).size / 1024)} KB)`);
