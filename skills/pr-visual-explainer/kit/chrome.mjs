import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function findChrome() {
  const windows = process.platform === 'win32';
  const names = windows ? ['chrome.exe', 'chromium.exe'] : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome'];
  const onPath = (process.env.PATH || '').split(path.delimiter).filter(Boolean).flatMap(dir => names.map(name => path.join(dir, name)));
  const installed = windows
    ? [process.env.LOCALAPPDATA, process.env.PROGRAMFILES, process.env['ProgramFiles(x86)']].filter(Boolean)
      .flatMap(dir => ['Google/Chrome/Application/chrome.exe', 'Chromium/Application/chrome.exe'].map(name => path.join(dir, name)))
    : process.platform === 'darwin'
      ? ['/Applications', path.join(os.homedir(), 'Applications')].flatMap(dir => ['Google Chrome', 'Chromium'].map(name => path.join(dir, `${name}.app/Contents/MacOS/${name}`)))
      : ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium', '/opt/google/chrome/chrome'];
  const candidates = process.env.CHROME ? [process.env.CHROME] : [...onPath, ...installed];
  for (const candidate of candidates) {
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      if (fs.statSync(candidate).isFile()) return path.resolve(candidate);
    } catch {}
  }
  throw new Error(process.env.CHROME
    ? 'CHROME does not point to an executable. Set CHROME to the full path to Chrome or Chromium.'
    : 'Chrome or Chromium was not found. Install either browser, or set CHROME to its executable path.');
}
