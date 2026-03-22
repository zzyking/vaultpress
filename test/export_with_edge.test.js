const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  DEFAULT_EDGE_BIN,
  buildPdfOptions,
  getPlatformBrowserCandidates,
  parseMarginShorthand,
  resolveBrowserBinary,
  resolveExecutableOnPath,
  resolveRuntimeOptions,
} = require('../lib/export_with_edge');

test('resolveRuntimeOptions uses caller cwd for note, output, debug html, and browser paths', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'vaultpress-runtime-'));
  fs.mkdirSync(path.join(cwd, 'bin'), { recursive: true });
  const browserPath = path.join(cwd, 'bin', 'edge');
  fs.writeFileSync(browserPath, '');

  const runtime = resolveRuntimeOptions('notes/demo.md', 'dist/demo.pdf', {
    OPENCLAW_OBS_PDF_BROWSER: './bin/edge',
    OPENCLAW_OBS_PDF_CWD: cwd,
    OPENCLAW_OBS_PDF_DEBUG_HTML: 'debug/rendered.html',
    OPENCLAW_OBS_PDF_KEEP_TEMP: '1',
    OPENCLAW_OBS_PDF_PAPER_SIZE: 'Letter',
  });

  assert.equal(runtime.notePath, path.join(cwd, 'notes', 'demo.md'));
  assert.equal(runtime.outputPath, path.join(cwd, 'dist', 'demo.pdf'));
  assert.equal(runtime.debugHtmlPath, path.join(cwd, 'debug', 'rendered.html'));
  assert.equal(runtime.browserPath, browserPath);
  assert.equal(runtime.paperSize, 'Letter');
  assert.equal(runtime.keepTemp, true);
});

test('resolveRuntimeOptions defaults output next to input note', () => {
  const cwd = '/tmp/vaultpress-default-output';
  const runtime = resolveRuntimeOptions('notes/demo.md', '', {
    OPENCLAW_OBS_PDF_CWD: cwd,
  });

  assert.equal(runtime.outputPath, path.join(cwd, 'notes', 'demo.pdf'));
});

test('resolveBrowserBinary prefers explicit browser env and resolves missing paths relative to cwd', () => {
  const cwd = '/tmp/vaultpress-browser';
  const missing = resolveBrowserBinary({
    OPENCLAW_OBS_PDF_BROWSER: './custom/browser',
    OPENCLAW_OBS_PDF_CWD: cwd,
  });

  assert.equal(missing, path.join(cwd, 'custom', 'browser'));

  const fallback = resolveBrowserBinary({
    OPENCLAW_OBS_PDF_CWD: cwd,
  });

  assert.equal(fallback, DEFAULT_EDGE_BIN);
});

test('resolveExecutableOnPath finds browser binaries from PATH entries', () => {
  const binDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vaultpress-path-bin-'));
  const binaryPath = path.join(binDir, 'google-chrome');
  fs.writeFileSync(binaryPath, '');

  const resolved = resolveExecutableOnPath('google-chrome', {
    PATH: binDir,
  }, 'linux');

  assert.equal(resolved, binaryPath);
});

test('resolveBrowserBinary prefers PATH browsers before platform fallbacks', () => {
  const binDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vaultpress-path-browser-'));
  const binaryPath = path.join(binDir, 'chromium');
  fs.writeFileSync(binaryPath, '');

  const resolved = resolveBrowserBinary({
    PATH: binDir,
  }, 'linux');

  assert.equal(resolved, binaryPath);
});

test('getPlatformBrowserCandidates returns common Chromium-family installs for each platform', () => {
  const darwinCandidates = getPlatformBrowserCandidates('darwin', { HOME: '/Users/test' });
  assert.ok(darwinCandidates.some((candidate) => candidate.includes('Google Chrome.app')));
  assert.ok(darwinCandidates.some((candidate) => candidate.includes('Microsoft Edge.app')));

  const linuxCandidates = getPlatformBrowserCandidates('linux', {});
  assert.ok(linuxCandidates.includes('/usr/bin/google-chrome'));
  assert.ok(linuxCandidates.includes('/opt/microsoft/msedge/msedge'));

  const winCandidates = getPlatformBrowserCandidates('win32', {
    PROGRAMFILES: 'C:\\Program Files',
    'PROGRAMFILES(X86)': 'C:\\Program Files (x86)',
    LOCALAPPDATA: 'C:\\Users\\king\\AppData\\Local',
  });
  assert.ok(winCandidates.some((candidate) => candidate.endsWith(path.join('Edge', 'Application', 'msedge.exe'))));
  assert.ok(winCandidates.some((candidate) => candidate.endsWith(path.join('Chrome', 'Application', 'chrome.exe'))));
});

test('parseMarginShorthand expands css-like margin strings for pdf output', () => {
  assert.deepEqual(parseMarginShorthand('12mm'), {
    top: '12mm',
    right: '12mm',
    bottom: '12mm',
    left: '12mm',
  });
  assert.deepEqual(parseMarginShorthand('10mm 20mm 30mm'), {
    top: '10mm',
    right: '20mm',
    bottom: '30mm',
    left: '20mm',
  });
});

test('buildPdfOptions enables header and footer templates when configured', () => {
  const options = buildPdfOptions({
    displayHeaderFooter: true,
    footerTemplate: '<div>Footer</div>',
    headerTemplate: '<div>Header</div>',
    margin: '14mm 12mm 16mm 12mm',
    paperSize: 'Letter',
    printBackground: true,
  }, '/tmp/out.pdf');

  assert.equal(options.path, '/tmp/out.pdf');
  assert.equal(options.format, 'Letter');
  assert.equal(options.displayHeaderFooter, true);
  assert.equal(options.headerTemplate, '<div>Header</div>');
  assert.equal(options.footerTemplate, '<div>Footer</div>');
  assert.deepEqual(options.margin, {
    top: '14mm',
    right: '12mm',
    bottom: '16mm',
    left: '12mm',
  });
});
