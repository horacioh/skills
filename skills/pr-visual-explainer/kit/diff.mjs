function headerPath(value) {
  if (value === '/dev/null') return null;
  if (!value.startsWith('"')) return value.split('\t', 1)[0].slice(2);
  const bytes = [];
  const escapes = { a: 7, b: 8, t: 9, n: 10, v: 11, f: 12, r: 13, '"': 34, '\\': 92 };
  for (const match of value.slice(1, value.lastIndexOf('"')).matchAll(/\\([0-7]{3}|.)|./gu)) {
    const escaped = match[1];
    if (escaped?.length === 3) bytes.push(parseInt(escaped, 8));
    else if (escaped) bytes.push(escapes[escaped]);
    else bytes.push(...Buffer.from(match[0]));
  }
  return Buffer.from(bytes).toString('utf8').slice(2);
}

export function parseDiff(text) {
  const files = new Map();
  let oldPath, newPath, file, hunk;
  for (const line of text.split('\n')) {
    if (line.startsWith('diff --git ')) {
      oldPath = newPath = file = hunk = undefined;
    } else if (line.startsWith('@@ ')) {
      const path = newPath ?? oldPath;
      if (path == null) continue;
      if (!file) {
        file = { hunks: [], added: new Set(), removed: new Set() };
        files.set(path, file);
      }
      hunk = { header: line, lines: [] };
      file.hunks.push(hunk);
    } else if (hunk && /^[ +\-]/.test(line)) {
      hunk.lines.push(line);
      if (line[0] === '+') file.added.add(line.slice(1).trim());
      else if (line[0] === '-') file.removed.add(line.slice(1).trim());
    } else if (!hunk && line.startsWith('--- ')) {
      oldPath = headerPath(line.slice(4));
    } else if (!hunk && line.startsWith('+++ ')) {
      newPath = headerPath(line.slice(4));
    }
  }
  return files;
}
