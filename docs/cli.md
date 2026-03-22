# CLI Reference

## Options

Current options:
- `--output <file.pdf>`
- `--debug-html <file>`
- `--keep-temp`
- `--browser <path>`
- `--paper-size <size>`
- `--help`

## Examples

Export a note to a specific output path:

```bash
vaultpress --output out.pdf notes/overview.md
```

Export while keeping temporary render files for debugging:

```bash
vaultpress --keep-temp --output out.pdf notes/overview.md
```

When an export fails, VaultPress keeps the temp directory automatically even without `--keep-temp`, so the browser log and rendered HTML remain available for inspection.

Save the intermediate HTML for inspection:

```bash
vaultpress --debug-html debug/rendered.html --output out.pdf notes/overview.md
```

Use a different paper size:

```bash
vaultpress --paper-size Letter --output out.pdf notes/overview.md
```

Use a custom browser binary instead of auto-detection:

```bash
vaultpress --browser "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
  --output out.pdf \
  notes/overview.md
```

## Path Resolution

VaultPress resolves CLI paths relative to the directory where you run the command, not the repository root.

That applies to:
- the input note path
- `--output`
- `--debug-html`
- `--browser`

Example:

```bash
cd ~/Documents/my-vault
vaultpress --output exports/weekly.pdf notes/weekly.md
```

In that case:
- `notes/weekly.md` resolves inside `~/Documents/my-vault`
- `exports/weekly.pdf` is written inside `~/Documents/my-vault/exports`
