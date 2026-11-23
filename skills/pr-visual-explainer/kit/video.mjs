#!/usr/bin/env node
// Usage: node video.mjs <out dir from build.mjs> [--theme light|dark] [--fps 30] [--silent]
// Narrates spec.video.scenes, lays out a timeline from the real audio lengths,
// captures each frame deterministically via window.renderAt(t) and muxes H.264 + AAC.
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url'; import { chromium } from 'playwright-core';
import { findChrome } from './chrome.mjs';
import { narrate } from './tts.mjs';
const args = process.argv.slice(2); const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const out = path.resolve(args[0] || 'out'); const fps = +opt('--fps', 30); const theme = opt('--theme', 'light'); const silent = args.includes('--silent');
for (const tool of ['ffmpeg', 'ffprobe']) {
  if (spawnSync(tool, ['-version'], { stdio: 'ignore' }).status !== 0) {
    console.error(`${tool} is needed to render video. Install FFmpeg (https://ffmpeg.org/download.html) and add its bin directory to PATH, or use build.mjs for HTML only.`);
    process.exit(1);
  }
}
const spec = JSON.parse(fs.readFileSync(path.join(out, 'spec.built.json'), 'utf8'));
const V = spec.video; if (!V?.scenes?.length) { console.error('spec.video.scenes is empty'); process.exit(1); }
const CHROME = findChrome();
const tmp = path.join(out, '.video'); fs.mkdirSync(tmp, { recursive: true });
const dur = f => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim();
const spoken = s => s.replace(/\*([^*]+)\*/g, '$1').replace(/`([^`]+)`/g, '$1');
function speechDuration(file, boundaries) {
  const length = dur(file);
  const { stderr } = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', 'silencedetect=noise=-45dB:d=0.3', '-f', 'null', '-'], { encoding: 'utf8' });
  const terminalSilence = [...(stderr || '').matchAll(/silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/g)].at(-1);
  if (!terminalSilence || Math.abs(length - Number(terminalSilence[1])) > .05) return length;
  return Math.min(length, Math.max(Number(terminalSilence[1]) - Number(terminalSilence[2]) + .12, ...boundaries.map(b => b.end)));
}

// 1. audio
const scenes = V.scenes.map((s, i) => ({ ...s, i }));
const tracks = new Map();
if (!silent) for (const s of scenes.filter(s => s.say?.trim())) {
  const { audioFilePath, boundaries } = await narrate(path.join(tmp, `s${s.i}`), spoken(s.say), V.voice || 'en-US-AndrewNeural', V.rate || '+0%');
  tracks.set(s.i, { file: audioFilePath, duration: speechDuration(audioFilePath, boundaries), sentences: boundaries.filter(b => b.type === 'SentenceBoundary') });
}
// 2. timeline: each scene lasts its narration plus a beat; settled results hold >= 1.6s
let t = 0;
for (const s of scenes) {
  const track = tracks.get(s.i);
  const a = track?.duration || 0;
  const lead = s.i === 0 ? .6 : .35; s.start = t; s.audioAt = t + lead;
  s.duration = Math.max(s.hold || 0, a ? lead + a + .75 : (s.block ? 3 : 3.5), s.i === 0 ? 4 : 1.6);
  const raw = track?.sentences || [];
  // map spoken sentences back to the caption text (keeps *highlight* marks)
  const capSents = (s.say || '').match(/[^.!?]+[.!?]+["')]*\s*|[^.!?]+$/g)?.map(x => x.trim()) || [];
  s.sentences = capSents.map((text, k) => ({ text, start: k === 0 ? s.start : s.audioAt + (raw[k]?.start ?? (a * k / capSents.length)) }));
  t += s.duration;
}
const total = t + .6;
const tl = { total, scenes: scenes.map(({ i, ...s }) => s) };
fs.writeFileSync(path.join(out, 'timeline.json'), JSON.stringify(tl, null, 2));
console.log(`timeline ${total.toFixed(1)}s, ${scenes.length} scenes`);

// 3. mixed narration track
const audio = path.join(tmp, 'narration.m4a');
if (tracks.size) {
  const withAudio = scenes.filter(s => tracks.has(s.i));
  const inputs = withAudio.flatMap(s => ['-i', tracks.get(s.i).file]);
  const fl = withAudio.map((s, k) => `[${k}:a]atrim=duration=${tracks.get(s.i).duration},adelay=${Math.round(s.audioAt * 1000)}:all=1[a${k}]`).join(';') + ';' + withAudio.map((_, k) => `[a${k}]`).join('') + `amix=inputs=${withAudio.length}:normalize=0,apad=whole_dur=${total.toFixed(2)},loudnorm=I=-16:TP=-1.5:LRA=11[out]`;
  execFileSync('ffmpeg', ['-y', '-v', 'error', ...inputs, '-filter_complex', fl, '-map', '[out]', '-ar', '48000', '-c:a', 'aac', '-b:a', '160k', audio]);
}

// 4. frames -> ffmpeg
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--font-render-hinting=none'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(`${pathToFileURL(path.join(out, 'index.html'))}?video&theme=${theme}`);
await page.waitForFunction(() => window.__ready);
await page.evaluate(tl => window.__videoInit(tl), tl);
const mp4 = path.join(out, 'explainer.mp4');
const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', ...(tracks.size ? ['-i', audio] : []),
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', ...(tracks.size ? ['-c:a', 'copy', '-shortest'] : []), mp4], { stdio: ['pipe', 'inherit', 'inherit'] });
const shots = path.join(out, 'video-shots'); fs.rmSync(shots, { recursive: true, force: true }); fs.mkdirSync(shots);
const checkpoints = new Map(tl.scenes.map((s, k) => [Math.round((s.start + s.duration - .4) * fps), k]));
const N = Math.ceil(total * fps);
for (let f = 0; f < N; f++) {
  await page.evaluate(x => window.renderAt(x), f / fps);
  const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (checkpoints.has(f)) fs.writeFileSync(path.join(shots, `scene-${String(checkpoints.get(f) + 1).padStart(2, '0')}.jpg`), buf);
  if (f % (fps * 10) === 0) process.stdout.write(`\rframe ${f}/${N}`);
}
ff.stdin.end(); const exit = await new Promise(r => ff.on('close', r)); await browser.close();
if (exit !== 0) throw new Error(`FFmpeg exited with status ${exit}`);
if (errs.length) { console.error('\nbrowser errors:\n' + errs.join('\n')); process.exit(1); }
console.log(`\nwrote ${mp4} (${(fs.statSync(mp4).size / 1e6).toFixed(1)} MB, ${dur(mp4).toFixed(1)}s); end-of-scene stills in ${shots}`);
