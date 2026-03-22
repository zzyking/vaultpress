#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');
const { launch } = require('puppeteer-core');

const { renderNoteToHtml } = require('./export_note_to_html');
const { exists, resolveAbsolutePath } = require('./render/utils');

const DEFAULT_EDGE_BIN = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
const PATH_BROWSER_NAMES = [
  'msedge',
  'microsoft-edge',
  'google-chrome',
  'google-chrome-stable',
  'chromium',
  'chromium-browser',
];

function resolveExecutableOnPath(name, env = process.env, platform = process.platform) {
  const pathValue = env.PATH || '';
  const pathEntries = pathValue.split(path.delimiter).filter(Boolean);
  const extensions = platform === 'win32'
    ? (env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';').filter(Boolean)
    : [''];

  for (const entry of pathEntries) {
    for (const extension of extensions) {
      const candidate = path.join(entry, platform === 'win32' ? `${name}${extension}` : name);
      if (exists(candidate)) return candidate;
    }
  }

  return null;
}

function getPlatformBrowserCandidates(platform = process.platform, env = process.env) {
  if (platform === 'darwin') {
    return [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      path.join(os.homedir(), 'Applications', 'Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome'),
      path.join(os.homedir(), 'Applications', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
      path.join(os.homedir(), 'Applications', 'Microsoft Edge.app', 'Contents', 'MacOS', 'Microsoft Edge'),
    ];
  }

  if (platform === 'win32') {
    const roots = [
      env.PROGRAMFILES,
      env['PROGRAMFILES(X86)'],
      env.LOCALAPPDATA,
    ].filter(Boolean);
    const suffixes = [
      ['Microsoft', 'Edge', 'Application', 'msedge.exe'],
      ['Google', 'Chrome', 'Application', 'chrome.exe'],
      ['Chromium', 'Application', 'chrome.exe'],
    ];
    return roots.flatMap((root) => suffixes.map((parts) => path.join(root, ...parts)));
  }

  return [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
    '/snap/bin/chromium',
    '/opt/google/chrome/chrome',
    '/opt/microsoft/msedge/msedge',
  ];
}

function resolveBrowserBinary(env = process.env, platform = process.platform) {
  const cwd = env.OPENCLAW_OBS_PDF_CWD || process.cwd();
  const explicitCandidates = [
    env.OPENCLAW_OBS_PDF_BROWSER,
    env.VAULTPRESS_BROWSER,
    env.EDGE_BIN,
  ].filter(Boolean).map((candidate) => resolveAbsolutePath(candidate, cwd));

  if (explicitCandidates.length > 0) {
    return explicitCandidates[0];
  }

  const pathCandidate = PATH_BROWSER_NAMES
    .map((name) => resolveExecutableOnPath(name, env, platform))
    .find(Boolean);
  if (pathCandidate) return pathCandidate;

  const candidates = getPlatformBrowserCandidates(platform, env);
  for (const candidate of candidates) {
    if (exists(candidate)) return candidate;
  }

  return candidates[0] || DEFAULT_EDGE_BIN;
}

function resolveRuntimeOptions(noteInput, outputInput, env = process.env) {
  const cwd = env.OPENCLAW_OBS_PDF_CWD || process.cwd();
  const rootDir = path.resolve(__dirname, '..');
  const notePath = resolveAbsolutePath(noteInput, cwd);
  const outputPath = outputInput
    ? resolveAbsolutePath(outputInput, cwd)
    : path.join(path.dirname(notePath), `${path.basename(notePath, path.extname(notePath))}.pdf`);

  return {
    browserPath: resolveBrowserBinary(env),
    cwd,
    debugHtmlPath: env.OPENCLAW_OBS_PDF_DEBUG_HTML ? resolveAbsolutePath(env.OPENCLAW_OBS_PDF_DEBUG_HTML, cwd) : '',
    keepTemp: env.OPENCLAW_OBS_PDF_KEEP_TEMP === '1',
    notePath,
    outputPath,
    paperSize: env.OPENCLAW_OBS_PDF_PAPER_SIZE || 'A4',
    rootDir,
  };
}

function ensureParentDir(targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
}

function createTempDir(rootDir) {
  try {
    return fs.mkdtempSync(path.join(rootDir, '.vaultpress-tmp.'));
  } catch {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'vaultpress-'));
  }
}

function appendLog(logPath, lines) {
  if (!Array.isArray(lines) || lines.length === 0) return;
  fs.appendFileSync(logPath, `${lines.join('\n')}\n`, 'utf8');
}

function createRunArtifacts(rootDir) {
  const tmpDir = createTempDir(rootDir);
  return {
    tmpDir,
    htmlPath: path.join(tmpDir, 'rendered.html'),
    profileDir: path.join(tmpDir, 'browser-profile'),
    logPath: path.join(tmpDir, 'browser.log'),
  };
}

function formatExportErrorMessage(error, context) {
  const details = [
    error && error.message ? error.message : String(error),
    `Temp files kept at: ${context.tmpDir}`,
    `Browser log: ${context.logPath}`,
    `Rendered HTML: ${context.htmlPath}`,
  ];
  if (context.debugHtmlPath) details.push(`Debug HTML copy: ${context.debugHtmlPath}`);
  return details.join('\n');
}

function parseMarginShorthand(value) {
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { top: '0', right: '0', bottom: '0', left: '0' };
  if (parts.length === 1) return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
  if (parts.length === 2) return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
  if (parts.length === 3) return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
  return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
}

function buildPdfOptions(renderOptions, outputPath) {
  const options = {
    path: outputPath,
    printBackground: renderOptions.printBackground !== false,
    preferCSSPageSize: true,
  };

  if (renderOptions.paperSize) options.format = renderOptions.paperSize;
  if (renderOptions.margin) options.margin = parseMarginShorthand(renderOptions.margin);
  if (renderOptions.displayHeaderFooter) {
    options.displayHeaderFooter = true;
    options.headerTemplate = renderOptions.headerTemplate || '<div></div>';
    options.footerTemplate = renderOptions.footerTemplate || '<div></div>';
  }

  return options;
}

async function printWithBrowser(browserPath, profileDir, outputPath, fileUrl, logPath, renderOptions) {
  const log = [
    `[vaultpress] browser: ${browserPath}`,
    `[vaultpress] source: ${fileUrl}`,
    `[vaultpress] output: ${outputPath}`,
  ];
  let browser;
  try {
    browser = await launch({
      executablePath: browserPath,
      headless: true,
      args: [
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--allow-file-access-from-files',
        '--enable-local-file-accesses',
        `--user-data-dir=${profileDir}`,
      ],
      timeout: 45000,
    });
    const page = await browser.newPage();
    page.on('console', (message) => {
      log.push(`[console:${message.type()}] ${message.text()}`);
    });
    page.on('pageerror', (error) => {
      log.push(`[pageerror] ${error.stack || error.message || String(error)}`);
    });
    page.on('requestfailed', (request) => {
      const failure = request.failure();
      log.push(`[requestfailed] ${request.url()}${failure?.errorText ? ` :: ${failure.errorText}` : ''}`);
    });
    await page.goto(fileUrl, {
      waitUntil: 'networkidle0',
      timeout: 45000,
    });
    await page.pdf(buildPdfOptions(renderOptions, outputPath));
    log.push(`Rendered ${fileUrl} to ${outputPath}`);
  } catch (error) {
    log.push(`[error] ${error.stack || error.message || String(error)}`);
    throw error;
  } finally {
    if (browser) await browser.close();
    fs.writeFileSync(logPath, `${log.join('\n')}\n`, 'utf8');
  }
}

async function exportWithEdge(noteInput, outputInput, env = process.env, deps = {}) {
  const renderNoteToHtmlImpl = deps.renderNoteToHtml || renderNoteToHtml;
  const printWithBrowserImpl = deps.printWithBrowser || printWithBrowser;
  const createRunArtifactsImpl = deps.createRunArtifacts || createRunArtifacts;
  const runtime = resolveRuntimeOptions(noteInput, outputInput, env);

  if (!exists(runtime.notePath) || !fs.statSync(runtime.notePath).isFile()) {
    throw new Error(`Note not found: ${runtime.notePath}`);
  }

  if (!exists(runtime.browserPath)) {
    throw new Error(`Browser not found: ${runtime.browserPath}`);
  }

  ensureParentDir(runtime.outputPath);
  const artifacts = createRunArtifactsImpl(runtime.rootDir);
  fs.mkdirSync(artifacts.profileDir, { recursive: true });
  appendLog(artifacts.logPath, [
    `[vaultpress] note: ${runtime.notePath}`,
    `[vaultpress] output: ${runtime.outputPath}`,
    `[vaultpress] debug-html: ${runtime.debugHtmlPath || '(none)'}`,
    `[vaultpress] keep-temp: ${runtime.keepTemp ? 'true' : 'false'}`,
  ]);
  let shouldKeepTemp = runtime.keepTemp;

  try {
    const rendered = renderNoteToHtmlImpl({
      basedir: runtime.cwd,
      inputPath: runtime.notePath,
      outputPath: artifacts.htmlPath,
      paperSizeOverride: runtime.paperSize,
    });
    appendLog(artifacts.logPath, [`[vaultpress] rendered-html: ${artifacts.htmlPath}`]);

    if (runtime.debugHtmlPath) {
      ensureParentDir(runtime.debugHtmlPath);
      fs.copyFileSync(artifacts.htmlPath, runtime.debugHtmlPath);
      appendLog(artifacts.logPath, [`[vaultpress] copied-debug-html: ${runtime.debugHtmlPath}`]);
    }

    await printWithBrowserImpl(
      runtime.browserPath,
      artifacts.profileDir,
      runtime.outputPath,
      `file://${artifacts.htmlPath}`,
      artifacts.logPath,
      rendered.renderOptions,
    );
    const hasOutput = exists(runtime.outputPath) && fs.statSync(runtime.outputPath).size > 0;
    if (!hasOutput) throw new Error('Browser print failed: output missing or empty.');
    return runtime.outputPath;
  } catch (error) {
    shouldKeepTemp = true;
    appendLog(artifacts.logPath, [`[vaultpress] export-failed: ${error.stack || error.message || String(error)}`]);
    const wrappedError = new Error(formatExportErrorMessage(error, {
      debugHtmlPath: runtime.debugHtmlPath,
      htmlPath: artifacts.htmlPath,
      logPath: artifacts.logPath,
      tmpDir: artifacts.tmpDir,
    }));
    wrappedError.cause = error;
    throw wrappedError;
  } finally {
    if (!shouldKeepTemp) fs.rmSync(artifacts.tmpDir, { recursive: true, force: true });
  }
}

async function main(argv = process.argv.slice(2), env = process.env) {
  if (argv.length < 1 || argv.length > 2) {
    console.error('Usage: lib/export_with_edge.js <note.md> [output.pdf]');
    process.exit(2);
  }

  try {
    const outputPath = await exportWithEdge(argv[0], argv[1], env);
    console.log(outputPath);
  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  DEFAULT_EDGE_BIN,
  buildPdfOptions,
  createRunArtifacts,
  exportWithEdge,
  formatExportErrorMessage,
  getPlatformBrowserCandidates,
  main,
  parseMarginShorthand,
  printWithBrowser,
  resolveBrowserBinary,
  resolveExecutableOnPath,
  resolveRuntimeOptions,
};
