const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { renderNoteToHtml } = require('../lib/export_note_to_html');

test('renderNoteToHtml uses gray-matter frontmatter, local marked rendering, and obsidian transforms', () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'vaultpress-render-'));
  const noteDir = path.join(workspace, 'notes');
  fs.mkdirSync(noteDir, { recursive: true });

  fs.writeFileSync(path.join(noteDir, 'custom.css'), '.custom-rule { color: red; }\n');
  fs.writeFileSync(path.join(noteDir, 'child.md'), [
    '# Child',
    '',
    '## Section',
    '',
    'Embedded paragraph.',
  ].join('\n'));
  fs.writeFileSync(path.join(noteDir, 'main.md'), [
    '---',
    'title: Rendered Title',
    'extra-css: ./custom.css',
    'pdf:',
    '  format: Letter',
    '  margin: 20mm',
    '  print_background: false',
    '---',
    '',
    '# Main',
    '',
    '[[child#Section|Section Link]]',
    '',
    '![[child#Section]]',
    '',
    '> [!tip] Useful',
    '> Callout body',
    '',
    'Formula: $x + 1$',
    '',
    '[^one]',
    '',
    '[^one]: Footnote text',
  ].join('\n'));

  const outputPath = path.join(workspace, 'out', 'main.html');
  renderNoteToHtml({
    basedir: workspace,
    inputPath: path.join(noteDir, 'main.md'),
    outputPath,
  });

  const html = fs.readFileSync(outputPath, 'utf8');
  assert.match(html, /<title>Rendered Title<\/title>/);
  assert.match(html, /@page \{ size:Letter; margin:20mm; \}/);
  assert.match(html, /<body class="no-print-background">/);
  assert.match(html, /\/\* extra-css: \.\/custom\.css \*\//);
  assert.match(html, /\.custom-rule \{ color: red; \}/);
  assert.match(html, /class="wikilink"/);
  assert.match(html, /class="embed note-embed"/);
  assert.match(html, /class="callout callout-tip"/);
  assert.match(html, /Footnotes/);
  assert.match(html, /math-inline/);
});

test('renderNoteToHtml supports page-break shorthands and raw html page-break blocks', () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'vaultpress-page-break-'));
  const noteDir = path.join(workspace, 'notes');
  fs.mkdirSync(noteDir, { recursive: true });

  fs.writeFileSync(path.join(noteDir, 'page-breaks.md'), [
    '# First',
    '',
    '\\pagebreak',
    '',
    '## Second',
    '',
    '---page-break---',
    '',
    '## Third',
    '',
    '<div class="page-break"></div>',
    '',
    '## Fourth',
  ].join('\n'));

  const outputPath = path.join(workspace, 'out', 'page-breaks.html');
  renderNoteToHtml({
    basedir: workspace,
    inputPath: path.join(noteDir, 'page-breaks.md'),
    outputPath,
  });

  const html = fs.readFileSync(outputPath, 'utf8');
  const pageBreakMatches = html.match(/<div class="page-break"><\/div>/g) || [];
  assert.equal(pageBreakMatches.length, 3);
  assert.match(html, /\.page-break \{ display:block; width:100%; height:0; margin:0; border:0; break-after:page; page-break-after:always; \}/);
});

test('renderNoteToHtml returns header and footer print options from frontmatter', () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'vaultpress-header-footer-'));
  const noteDir = path.join(workspace, 'notes');
  fs.mkdirSync(noteDir, { recursive: true });

  fs.writeFileSync(path.join(noteDir, 'print.md'), [
    '---',
    'pdf:',
    '  headerTemplate: "<div>Header</div>"',
    '  footerTemplate: "<div>Footer</div>"',
    '  displayHeaderFooter: true',
    '---',
    '',
    '# Printable',
  ].join('\n'));

  const outputPath = path.join(workspace, 'out', 'print.html');
  const rendered = renderNoteToHtml({
    basedir: workspace,
    inputPath: path.join(noteDir, 'print.md'),
    outputPath,
  });

  assert.equal(rendered.renderOptions.displayHeaderFooter, true);
  assert.equal(rendered.renderOptions.headerTemplate, '<div>Header</div>');
  assert.equal(rendered.renderOptions.footerTemplate, '<div>Footer</div>');
});
