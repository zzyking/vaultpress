# Changelog

All notable changes to this project will be documented in this file.

## 0.1.3 - 2026-03-22

CI compatibility follow-up for the public release line.

### Fixed

- Made browser fallback assertions platform-aware so GitHub Actions on Ubuntu no longer assumes a macOS-specific default browser path.

## 0.1.2 - 2026-03-22

Release tooling and maintenance improvements.

### Added

- GitHub Actions CI for `npm test` and `npm run pack:check`.
- `--version` support for the published CLI.
- A public `CHANGELOG.md` for release tracking.

### Fixed

- Global npm installs now resolve the package root correctly when `vaultpress` or `vp` is invoked through a symlinked bin path.

## 0.1.1 - 2026-03-22

Public release hardening and documentation polish.

### Added

- Cross-platform browser auto-detection for Chrome, Chromium, and Edge installs.
- PDF page breaks and browser-driven header/footer support.
- Repeatable screenshot generation for public showcase examples.
- Automated tests for CLI path handling, temp/log lifecycle, package manifest rules, and screenshot planning.

### Changed

- Reworked the PDF print pipeline around `puppeteer-core`.
- Split public-facing documentation out of the README into dedicated docs pages.
- Tightened published package contents to runtime files only.
- Improved failure diagnostics so export errors preserve temp files and browser logs automatically.
