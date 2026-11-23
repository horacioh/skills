import fs from 'node:fs';
import path from 'node:path';

const [out, before, after, beforeCaption, afterCaption, ...extra] = process.argv.slice(2);
if (!out || !before || !after || !beforeCaption?.trim() || !afterCaption?.trim() || extra.length) {
  console.error('Usage: node record-pair.mjs <evidence-dir> <before-image> <after-image> <before-caption> <after-caption>');
  process.exit(2);
}

try {
  for (const image of [before, after]) {
    if (!/^\.(png|jpe?g|webp)$/i.test(path.extname(image)) || !fs.statSync(image).isFile()) {
      throw new Error(`Expected a PNG, JPEG or WebP image: ${image}`);
    }
  }
  const file = path.join(out, 'manifest.json');
  const manifest = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { version: 1, pairs: [] };
  if (manifest?.version !== 1 || !Array.isArray(manifest.pairs)) throw new Error('Expected a version 1 screenshot manifest');
  const pair = {};
  for (const [state, image, caption] of [['before', before, beforeCaption], ['after', after, afterCaption]]) {
    const src = `${state}/${manifest.pairs.length + 1}${path.extname(image).toLowerCase()}`;
    fs.mkdirSync(path.join(out, state), { recursive: true });
    fs.copyFileSync(image, path.join(out, src));
    pair[state] = { src, caption };
  }
  manifest.pairs.push(pair);
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Wrote ${file} (${manifest.pairs.length} pair(s))`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
