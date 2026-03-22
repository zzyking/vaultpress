#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const { loadExtraCss, loadRenderConfig } = require('./render/config');
const { buildDocumentHtml } = require('./render/document');
const { createRenderer } = require('./render/renderer');

function renderNoteToHtml(options) {
  const inputPath = path.resolve(options.inputPath);
  const outputPath = path.resolve(options.outputPath);
  const noteDir = path.dirname(inputPath);
  const rootDir = path.resolve(options.basedir || process.cwd());
  const rawMarkdown = fs.readFileSync(inputPath, 'utf8');
  const loaded = loadRenderConfig(rawMarkdown, {
    defaultMargin: '14mm 12mm 16mm 12mm',
    defaultPaperSize: options.paperSizeOverride || process.env.OPENCLAW_OBS_PDF_PAPER_SIZE || 'A4',
    defaultTitle: path.basename(inputPath, path.extname(inputPath)),
  });
  const renderer = createRenderer({
    noteDir,
    outputPath,
    rootDir,
  });
  const extraCssPath = renderer.resolveExistingPath(loaded.options.extraCssPath, noteDir);
  const extraCss = extraCssPath ? loadExtraCss(extraCssPath) : '';
  const body = renderer.buildRenderPipeline().processMarkdown(loaded.body, noteDir, path.basename(inputPath));
  const html = buildDocumentHtml({
    body,
    documentTitle: loaded.options.title,
    extraCss,
    extraCssPathRaw: loaded.options.extraCssPath,
    inputBasename: path.basename(inputPath),
    pageMargin: loaded.options.margin,
    paperSize: loaded.options.paperSize,
    printBackground: loaded.options.printBackground,
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html);
  return {
    outputPath,
    renderOptions: loaded.options,
  };
}

function main(argv = process.argv.slice(2)) {
  if (argv.length < 2) {
    console.error('Usage: node export_note_to_html.js <input.md> <output.html>');
    process.exit(2);
  }

  const result = renderNoteToHtml({
    basedir: process.env.OPENCLAW_OBS_PDF_BASEDIR || process.cwd(),
    inputPath: argv[0],
    outputPath: argv[1],
    paperSizeOverride: process.env.OPENCLAW_OBS_PDF_PAPER_SIZE,
  });
  console.error(result.outputPath);
}

if (require.main === module) {
  main();
}

module.exports = {
  renderNoteToHtml,
};
