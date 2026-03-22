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
