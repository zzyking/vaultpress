#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { renderNoteToHtml } = require('./export_note_to_html');
const { exists, resolveAbsolutePath } = require('./render/utils');

const DEFAULT_EDGE_BIN = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';

function resolveBrowserBinary(env = process.env) {
  const cwd = env.OPENCLAW_OBS_PDF_CWD || process.cwd();
  const explicitCandidates = [
    env.OPENCLAW_OBS_PDF_BROWSER,
    env.VAULTPRESS_BROWSER,
    env.EDGE_BIN,
  ].filter(Boolean).map((candidate) => resolveAbsolutePath(candidate, cwd));

  if (explicitCandidates.length > 0) {
    return explicitCandidates[0];
  }

  const candidates = [DEFAULT_EDGE_BIN];
  for (const candidate of candidates) {
    if (exists(candidate)) return candidate;
  }

  return DEFAULT_EDGE_BIN;
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

function printWithBrowser(browserPath, profileDir, outputPath, fileUrl, logPath) {
  const logFd = fs.openSync(logPath, 'w');
  try {
    return spawnSync(browserPath, [
      '--headless=new',
      '--disable-gpu',
      '--run-all-compositor-stages-before-draw',
      '--virtual-time-budget=15000',
      '--no-first-run',
      '--no-default-browser-check',
      '--allow-file-access-from-files',
      '--enable-local-file-accesses',
      `--user-data-dir=${profileDir}`,
      `--print-to-pdf=${outputPath}`,
      fileUrl,
    ], {
      stdio: ['ignore', logFd, logFd],
      timeout: 45000,
    });
  } finally {
    fs.closeSync(logFd);
  }
}

function exportWithEdge(noteInput, outputInput, env = process.env) {
  const runtime = resolveRuntimeOptions(noteInput, outputInput, env);

  if (!exists(runtime.notePath) || !fs.statSync(runtime.notePath).isFile()) {
    throw new Error(`Note not found: ${runtime.notePath}`);
  }

  if (!exists(runtime.browserPath)) {
    throw new Error(`Browser not found: ${runtime.browserPath}`);
  }

  ensureParentDir(runtime.outputPath);
  const tmpDir = createTempDir(runtime.rootDir);
  const htmlPath = path.join(tmpDir, 'rendered.html');
  const profileDir = path.join(tmpDir, 'edge-profile');
  const logPath = path.join(tmpDir, 'edge.log');
  fs.mkdirSync(profileDir, { recursive: true });

  try {
    renderNoteToHtml({
      basedir: runtime.cwd,
      inputPath: runtime.notePath,
      outputPath: htmlPath,
      paperSizeOverride: runtime.paperSize,
    });

    if (runtime.debugHtmlPath) {
      ensureParentDir(runtime.debugHtmlPath);
      fs.copyFileSync(htmlPath, runtime.debugHtmlPath);
    }

    const result = printWithBrowser(runtime.browserPath, profileDir, runtime.outputPath, `file://${htmlPath}`, logPath);
    const hasOutput = exists(runtime.outputPath) && fs.statSync(runtime.outputPath).size > 0;
    if (result.error && result.error.code !== 'ETIMEDOUT' && !hasOutput) throw result.error;
    if (result.status !== 0 && !hasOutput) throw new Error(`Browser print failed. Log: ${logPath}`);
    if (!hasOutput) throw new Error(`Browser print failed: output missing or empty. Log: ${logPath}`);
    return runtime.outputPath;
  } finally {
    if (!runtime.keepTemp) fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function main(argv = process.argv.slice(2), env = process.env) {
  if (argv.length < 1 || argv.length > 2) {
    console.error('Usage: lib/export_with_edge.js <note.md> [output.pdf]');
    process.exit(2);
  }

  try {
    const outputPath = exportWithEdge(argv[0], argv[1], env);
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
  exportWithEdge,
  main,
  resolveBrowserBinary,
  resolveRuntimeOptions,
};
