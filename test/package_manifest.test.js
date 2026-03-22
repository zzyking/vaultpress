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
    'CHANGELOG.md',
    'LICENSE',
    'README.md',
  ]);

  assert.equal(pkg.engines.node, '>=18');
  assert.ok(Array.isArray(pkg.keywords));
  assert.ok(pkg.keywords.includes('obsidian'));
  assert.ok(pkg.keywords.includes('pdf'));
  assert.equal(pkg.author, 'zzyking <zangzeyuan@bupt.edu.cn>');
  assert.equal(pkg.repository.type, 'git');
  assert.equal(pkg.repository.url, 'git+https://github.com/zzyking/vaultpress.git');
  assert.equal(pkg.homepage, 'https://github.com/zzyking/vaultpress#readme');
  assert.equal(pkg.bugs.url, 'https://github.com/zzyking/vaultpress/issues');
  assert.equal(pkg.scripts.export, 'bash bin/vaultpress');
  assert.equal(pkg.scripts.test, 'node --test');
  assert.equal(pkg.scripts['pack:check'], 'npm_config_cache=/tmp/vaultpress-npm-cache npm pack --dry-run');
  assert.equal(pkg.scripts.screenshots, 'bash bin/vaultpress-screenshots');
});
