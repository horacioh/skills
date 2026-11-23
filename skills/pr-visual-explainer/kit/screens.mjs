import fs from 'node:fs';
import path from 'node:path';

export function manifestScreens(specDir, manifestPath) {
  if (typeof manifestPath !== 'string' || !manifestPath || path.isAbsolute(manifestPath)) {
    throw new Error('manifest must be a path relative to the spec');
  }
  const file = path.resolve(specDir, manifestPath);
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (manifest?.version !== 1 || !Array.isArray(manifest.pairs) || !manifest.pairs.length) {
    throw new Error('manifest must have version 1 and at least one pair');
  }
  return manifest.pairs.flatMap(pair => ['before', 'after'].map(state => {
    const { src, caption } = pair?.[state] || {};
    const mime = { '.png': 'png', '.jpg': 'jpeg', '.jpeg': 'jpeg', '.webp': 'webp' }[path.extname(typeof src === 'string' ? src : '').toLowerCase()];
    if (!mime || !src.startsWith(`${state}/`) || src.split(/[\\/]/).includes('..') || typeof caption !== 'string' || !caption.trim()) {
      throw new Error(`each ${state} needs a raster image under ${state}/ and a caption`);
    }
    const data = fs.readFileSync(path.resolve(path.dirname(file), src));
    return { src: `data:image/${mime};base64,${data.toString('base64')}`, caption, status: 'changed', tag: state === 'before' ? 'Before' : 'After' };
  }));
}
