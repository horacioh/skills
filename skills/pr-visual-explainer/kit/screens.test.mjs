import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { manifestScreens } from './screens.mjs';

test('recorded pairs resolve from the manifest directory in before/after order', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pr-screens-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aW9sAAAAASUVORK5CYII=';
  const image = path.join(dir, 'capture.png');
  fs.writeFileSync(image, Buffer.from(png, 'base64'));
  const helper = fileURLToPath(new URL('../../repro-before-after/record-pair.mjs', import.meta.url));
  const evidence = path.join(dir, 'evidence');
  for (const captions of [['Error occurs', 'Error gone'], ['Stale status', 'Current status']]) {
    execFileSync(process.execPath, [helper, evidence, image, image, ...captions]);
  }
  const items = manifestScreens(dir, 'evidence/manifest.json');
  assert.deepEqual(items.map(({ tag, caption }) => [tag, caption]), [
    ['Before', 'Error occurs'], ['After', 'Error gone'],
    ['Before', 'Stale status'], ['After', 'Current status'],
  ]);
  assert.ok(items.every(item => item.src === `data:image/png;base64,${png}`));
  assert.throws(() => manifestScreens(dir, 'missing.json'), { code: 'ENOENT' });
  const file = path.join(evidence, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  manifest.pairs[0].before.src = 'before/../../capture.png';
  fs.writeFileSync(file, JSON.stringify(manifest));
  assert.throws(() => manifestScreens(dir, 'evidence/manifest.json'), /before needs a raster image/);
});
