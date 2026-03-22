#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');
const { launch } = require('puppeteer-core');

const { renderNoteToHtml } = require('./export_note_to_html');
const { resolveBrowserBinary } = require('./export_with_edge');
const { resolveAbsolutePath } = require('./render/utils');

const DEFAULT_SHOWCASE_FIXTURES = ['03-embeds', '04-callouts', '06-extensions'];

function normalizeFixtureName(value) {
  return String(value || '')
    .trim()
    .replace(/^fixtures\//, '')
    .replace(/\.(md|pdf|png)$/i, '');
}

function resolveScreenshotJobs(args, options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  const outputDir = options.outputDir || path.join(rootDir, 'examples', 'screenshots');
  const targets = (args && args.length ? args : DEFAULT_SHOWCASE_FIXTURES).map(normalizeFixtureName);

  return targets.map((name) => ({
    fixtureName: name,
    notePath: path.join(rootDir, 'fixtures', `${name}.md`),
    screenshotPath: path.join(outputDir, `${name}.png`),
  }));
}

async function captureScreenshot(options) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vaultpress-shot-'));
  const htmlPath = path.join(tmpDir, 'rendered.html');
  const browserPath = options.browserPath || resolveBrowserBinary(options.env || process.env);
  let browser;

  try {
    const rendered = renderNoteToHtml({
      basedir: options.basedir,
      inputPath: options.notePath,
      outputPath: htmlPath,
      paperSizeOverride: options.paperSize,
    });
    void rendered;

    fs.mkdirSync(path.dirname(options.screenshotPath), { recursive: true });
    browser = await launch({
      executablePath: browserPath,
      headless: true,
      args: [
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--allow-file-access-from-files',
        '--enable-local-file-accesses',
      ],
      timeout: 45000,
    });

    const page = await browser.newPage();
    await page.setViewport({
      width: options.width || 1440,
      height: options.height || 1200,
      deviceScaleFactor: 1,
    });
    await page.goto(`file://${htmlPath}`, {
      waitUntil: 'networkidle0',
      timeout: 45000,
    });
    await page.screenshot({
      path: options.screenshotPath,
      fullPage: options.fullPage !== false,
      type: 'png',
    });
    return options.screenshotPath;
  } finally {
    if (browser) await browser.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

async function run(args = process.argv.slice(2), env = process.env) {
  const rootDir = path.resolve(__dirname, '..');
  const cwd = env.OPENCLAW_OBS_PDF_CWD || process.cwd();
  const browserArgIndex = args.indexOf('--browser');
  let browserPath = '';
  if (browserArgIndex !== -1) {
    browserPath = resolveAbsolutePath(args[browserArgIndex + 1], cwd);
    args = args.slice(0, browserArgIndex).concat(args.slice(browserArgIndex + 2));
  }

  if (args.includes('-h') || args.includes('--help')) {
    console.log(`Usage:
  node lib/capture_example_screenshots.js [fixture ...] [--browser /path/to/browser]

Defaults:
  03-embeds 04-callouts 06-extensions
`);
    return;
  }

  const jobs = resolveScreenshotJobs(args, { rootDir });
  for (const job of jobs) {
    if (!fs.existsSync(job.notePath)) {
      throw new Error(`Fixture not found: ${job.fixtureName}`);
    }
    const out = await captureScreenshot({
      basedir: rootDir,
      browserPath,
      env,
      notePath: job.notePath,
      screenshotPath: job.screenshotPath,
    });
    console.log(out);
  }
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = {
  DEFAULT_SHOWCASE_FIXTURES,
  captureScreenshot,
  normalizeFixtureName,
  resolveScreenshotJobs,
  run,
};
