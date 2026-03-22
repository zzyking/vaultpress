const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

test('bin/vaultpress resolves package root correctly when invoked through a symlink', () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'vaultpress-bin-link-'));
  const packageRoot = path.join(workspace, 'pkg');
  const binDir = path.join(packageRoot, 'bin');
  const libDir = path.join(packageRoot, 'lib');
  const externalBinDir = path.join(workspace, 'global-bin');

  fs.mkdirSync(binDir, { recursive: true });
  fs.mkdirSync(libDir, { recursive: true });
  fs.mkdirSync(externalBinDir, { recursive: true });

  fs.copyFileSync(
    path.join(process.cwd(), 'bin', 'vaultpress'),
    path.join(binDir, 'vaultpress'),
  );
  fs.chmodSync(path.join(binDir, 'vaultpress'), 0o755);

  fs.writeFileSync(
    path.join(libDir, 'export_with_edge.sh'),
    '#!/usr/bin/env bash\nset -euo pipefail\nprintf "%s\\n" "$0"\nprintf "%s\\n" "$OPENCLAW_OBS_PDF_CWD"\nprintf "%s\\n" "$1"\n',
    'utf8',
  );
  fs.chmodSync(path.join(libDir, 'export_with_edge.sh'), 0o755);

  const symlinkPath = path.join(externalBinDir, 'vp');
  fs.symlinkSync(path.join(packageRoot, 'bin', 'vaultpress'), symlinkPath);

  const output = execFileSync(symlinkPath, ['example.md'], {
    cwd: workspace,
    encoding: 'utf8',
  }).trim().split('\n');

  assert.equal(fs.realpathSync(output[0]), fs.realpathSync(path.join(packageRoot, 'lib', 'export_with_edge.sh')));
  assert.equal(fs.realpathSync(output[1]), fs.realpathSync(workspace));
  assert.equal(output[2], 'example.md');
});
