const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const {
  DEFAULT_SHOWCASE_FIXTURES,
  normalizeFixtureName,
  resolveScreenshotJobs,
} = require('../lib/capture_example_screenshots');

test('normalizeFixtureName strips fixture prefixes and known extensions', () => {
  assert.equal(normalizeFixtureName('fixtures/03-embeds.md'), '03-embeds');
  assert.equal(normalizeFixtureName('04-callouts.pdf'), '04-callouts');
  assert.equal(normalizeFixtureName('06-extensions.png'), '06-extensions');
});

test('resolveScreenshotJobs defaults to the showcase fixtures', () => {
  const rootDir = '/tmp/vaultpress';
  const jobs = resolveScreenshotJobs([], { rootDir });

  assert.deepEqual(jobs.map((job) => job.fixtureName), DEFAULT_SHOWCASE_FIXTURES);
  assert.deepEqual(jobs.map((job) => job.screenshotPath), [
    path.join(rootDir, 'examples', 'screenshots', '03-embeds.png'),
    path.join(rootDir, 'examples', 'screenshots', '04-callouts.png'),
    path.join(rootDir, 'examples', 'screenshots', '06-extensions.png'),
  ]);
});

test('resolveScreenshotJobs accepts explicit fixture targets', () => {
  const rootDir = '/tmp/vaultpress';
  const outputDir = '/tmp/screens';
  const jobs = resolveScreenshotJobs(['fixtures/01-basic-layout.md', '05-print-stress'], {
    rootDir,
    outputDir,
  });

  assert.deepEqual(jobs, [
    {
      fixtureName: '01-basic-layout',
      notePath: '/tmp/vaultpress/fixtures/01-basic-layout.md',
      screenshotPath: '/tmp/screens/01-basic-layout.png',
    },
    {
      fixtureName: '05-print-stress',
      notePath: '/tmp/vaultpress/fixtures/05-print-stress.md',
      screenshotPath: '/tmp/screens/05-print-stress.png',
    },
  ]);
});
