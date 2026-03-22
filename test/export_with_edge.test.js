const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { DEFAULT_EDGE_BIN, resolveBrowserBinary, resolveRuntimeOptions } = require('../lib/export_with_edge');

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
