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
  for (const line of text.replace(/\n$/, '').split('\n')) {
    if (line.startsWith('diff --git ')) {
      oldPath = newPath = file = hunk = undefined;
    } else if (line.startsWith('@@ ')) {
      const path = newPath ?? oldPath;
      if (path == null) continue;
      if (!file) {
        file = { hunks: [] };
        files.set(path, file);
      }
      hunk = { header: line, lines: [] };
      file.hunks.push(hunk);
    } else if (hunk && (line === '' || /^[ +\-]/.test(line))) {
      hunk.lines.push(line || ' ');
    } else if (!hunk && line.startsWith('--- ')) {
      oldPath = headerPath(line.slice(4));
    } else if (!hunk && line.startsWith('+++ ')) {
      newPath = headerPath(line.slice(4));
    }
  }
  return files;
}

export function hunkStart(line) {
  const m = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)$/);
  return m && { old: +m[1], next: +m[2], label: m[3].trim() };
}

export function diffRows(file) {
  const rows = new Map();
  for (const hunk of file.hunks) {
    let { old, next } = hunkStart(hunk.header);
    for (const row of hunk.lines) {
      rows.set(`${old}:${next}`, row);
      if (row[0] !== '+') old++;
      if (row[0] !== '-') next++;
    }
  }
  return rows;
}

export function pickHunk(file, pick) {
  for (const h of file.hunks) {
    if (pick.hunk && !(h.header + '\n' + h.lines.join('\n')).includes(pick.hunk)) continue;
    const start = pick.from ? h.lines.findIndex(line => line.includes(pick.from)) : 0;
    if (start < 0) continue;
    const end = pick.to ? h.lines.findIndex((line, i) => i >= start && line.includes(pick.to)) : h.lines.length - 1;
    if (end < start) continue;
    let { old, next } = hunkStart(h.header);
    for (const line of h.lines.slice(0, start)) {
      if (line[0] !== '+') old++;
      if (line[0] !== '-') next++;
    }
    return `@@ -${old} +${next} @@ ${pick.label || ''}\n` + h.lines.slice(start, end + 1).join('\n');
  }
}
