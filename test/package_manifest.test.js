const test = require('node:test');
const assert = require('node:assert/strict');

const pkg = require('../package.json');

test('package manifest only exposes runtime CLI entrypoints and packaged runtime files', () => {
  assert.deepEqual(pkg.bin, {
    vaultpress: 'bin/vaultpress',
    vp: 'bin/vaultpress',
  });

  assert.deepEqual(pkg.files, [
    'bin/vaultpress',
    'lib/export_note_to_html.js',
    'lib/export_with_edge.js',
    'lib/export_with_edge.sh',
    'lib/render',
    'LICENSE',
    'README.md',
  ]);

  assert.equal(pkg.engines.node, '>=18');
  assert.ok(Array.isArray(pkg.keywords));
  assert.ok(pkg.keywords.includes('obsidian'));
  assert.ok(pkg.keywords.includes('pdf'));
  assert.equal(pkg.scripts.test, 'node --test');
  assert.equal(pkg.scripts['pack:check'], 'npm_config_cache=/tmp/vaultpress-npm-cache npm pack --dry-run');
  assert.equal(pkg.scripts.screenshots, 'bash bin/vaultpress-screenshots');
});
