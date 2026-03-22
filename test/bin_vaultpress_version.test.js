const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { execFileSync } = require('child_process');

const pkg = require('../package.json');

test('bin/vaultpress prints the package version', () => {
  const output = execFileSync(path.join(process.cwd(), 'bin', 'vaultpress'), ['--version'], {
    encoding: 'utf8',
  }).trim();

  assert.equal(output, pkg.version);
});
