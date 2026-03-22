const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  createRunArtifacts,
  DEFAULT_EDGE_BIN,
  buildPdfOptions,
  formatExportErrorMessage,
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

test('resolveBrowserBinary prefers explicit browser env and otherwise returns a valid platform fallback', () => {
  const cwd = '/tmp/vaultpress-browser';
  const missing = resolveBrowserBinary({
    OPENCLAW_OBS_PDF_BROWSER: './custom/browser',
    OPENCLAW_OBS_PDF_CWD: cwd,
  });

  assert.equal(missing, path.join(cwd, 'custom', 'browser'));

  const env = {
    ...process.env,
    OPENCLAW_OBS_PDF_CWD: cwd,
  };
  const fallback = resolveBrowserBinary(env, process.platform);
  const pathFallback = [
    'msedge',
    'microsoft-edge',
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser',
  ].map((name) => resolveExecutableOnPath(name, env, process.platform)).find(Boolean);
  const platformCandidates = getPlatformBrowserCandidates(process.platform, env);

  assert.ok(
    fallback === pathFallback
      || platformCandidates.includes(fallback)
      || fallback === DEFAULT_EDGE_BIN,
  );
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

test('createRunArtifacts builds a temp workspace with stable artifact names', () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vaultpress-artifacts-'));
  const artifacts = createRunArtifacts(rootDir);

  assert.ok(artifacts.tmpDir.startsWith(rootDir));
  assert.equal(artifacts.htmlPath, path.join(artifacts.tmpDir, 'rendered.html'));
  assert.equal(artifacts.profileDir, path.join(artifacts.tmpDir, 'browser-profile'));
  assert.equal(artifacts.logPath, path.join(artifacts.tmpDir, 'browser.log'));
});

test('formatExportErrorMessage includes temp and log locations for debugging', () => {
  const message = formatExportErrorMessage(new Error('boom'), {
    debugHtmlPath: '/tmp/debug.html',
    htmlPath: '/tmp/rendered.html',
    logPath: '/tmp/browser.log',
    tmpDir: '/tmp/vaultpress-run',
  });

  assert.match(message, /boom/);
  assert.match(message, /Temp files kept at: \/tmp\/vaultpress-run/);
  assert.match(message, /Browser log: \/tmp\/browser\.log/);
  assert.match(message, /Rendered HTML: \/tmp\/rendered\.html/);
  assert.match(message, /Debug HTML copy: \/tmp\/debug\.html/);
});

test('exportWithEdge preserves temp files and logs on failure even without keep-temp', async () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'vaultpress-export-fail-'));
  const notePath = path.join(workspace, 'note.md');
  const browserPath = path.join(workspace, 'browser');
  const tmpDir = path.join(workspace, 'tmp-run');
  fs.writeFileSync(notePath, '# Demo\n');
  fs.writeFileSync(browserPath, '');

  await assert.rejects(
    () => require('../lib/export_with_edge').exportWithEdge(notePath, path.join(workspace, 'out.pdf'), {
      OPENCLAW_OBS_PDF_BROWSER: browserPath,
      OPENCLAW_OBS_PDF_CWD: workspace,
    }, {
      createRunArtifacts() {
        return {
          tmpDir,
          htmlPath: path.join(tmpDir, 'rendered.html'),
          profileDir: path.join(tmpDir, 'browser-profile'),
          logPath: path.join(tmpDir, 'browser.log'),
        };
      },
      renderNoteToHtml(options) {
        fs.mkdirSync(path.dirname(options.outputPath), { recursive: true });
        fs.writeFileSync(options.outputPath, '<html></html>');
        return { renderOptions: {} };
      },
      async printWithBrowser(_browserPath, _profileDir, _outputPath, _fileUrl, logPath) {
        fs.writeFileSync(logPath, '[browser] launch failed\n', 'utf8');
        throw new Error('launch failed');
      },
    }),
    (error) => {
      assert.match(error.message, /launch failed/);
      assert.match(error.message, /Temp files kept at:/);
      return true;
    },
  );

  assert.ok(fs.existsSync(tmpDir));
  assert.ok(fs.existsSync(path.join(tmpDir, 'browser.log')));
  assert.ok(fs.existsSync(path.join(tmpDir, 'rendered.html')));
});

test('exportWithEdge removes temp files on success unless keep-temp is set', async () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'vaultpress-export-success-'));
  const notePath = path.join(workspace, 'note.md');
  const browserPath = path.join(workspace, 'browser');
  const tmpDir = path.join(workspace, 'tmp-run');
  const outputPath = path.join(workspace, 'out.pdf');
  fs.writeFileSync(notePath, '# Demo\n');
  fs.writeFileSync(browserPath, '');

  const result = await require('../lib/export_with_edge').exportWithEdge(notePath, outputPath, {
    OPENCLAW_OBS_PDF_BROWSER: browserPath,
    OPENCLAW_OBS_PDF_CWD: workspace,
  }, {
    createRunArtifacts() {
      return {
        tmpDir,
        htmlPath: path.join(tmpDir, 'rendered.html'),
        profileDir: path.join(tmpDir, 'browser-profile'),
        logPath: path.join(tmpDir, 'browser.log'),
      };
    },
    renderNoteToHtml(options) {
      fs.mkdirSync(path.dirname(options.outputPath), { recursive: true });
      fs.writeFileSync(options.outputPath, '<html></html>');
      return { renderOptions: {} };
    },
    async printWithBrowser(_browserPath, _profileDir, outputFilePath, _fileUrl, logPath) {
      fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
      fs.writeFileSync(outputFilePath, 'pdf');
      fs.writeFileSync(logPath, '[browser] ok\n', 'utf8');
    },
  });

  assert.equal(result, outputPath);
  assert.ok(fs.existsSync(outputPath));
  assert.equal(fs.existsSync(tmpDir), false);
});
