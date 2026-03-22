# Getting Started

## Requirements

- Node.js 18+
- A locally installed Chromium-family browser

Browser auto-detection checks:
- an explicit `--browser` path first
- browser executables on `PATH`
- common install locations for Google Chrome, Chromium, and Microsoft Edge

## Install

Install dependencies:

```bash
npm install
```

For local CLI usage during development:

```bash
npm link
```

After that, the intended CLI usage is:

```bash
vaultpress --output out.pdf path/to/note.md
# or
vp --output out.pdf path/to/note.md
```

## Quick Start

Export one note:

```bash
bin/vaultpress --output out.pdf path/to/note.md
```

## First Run Check

After `npm install`, this is the fastest way to verify the whole toolchain:

1. Check the CLI surface:

```bash
bin/vaultpress --help
```

2. Run the automated suite:

```bash
npm test
```

3. Run one real export:

```bash
tmpdir=$(mktemp -d /tmp/vaultpress-smoke.XXXXXX)
cat > "$tmpdir/note.md" <<'EOF'
# Smoke Test

- hello
- world
EOF

bin/vaultpress --output /tmp/vaultpress-smoke.pdf "$tmpdir/note.md"
ls -lh /tmp/vaultpress-smoke.pdf
```

4. If you want to inspect the rendered HTML too:

```bash
tmpdir=$(mktemp -d /tmp/vaultpress-smoke.XXXXXX)
cat > "$tmpdir/note.md" <<'EOF'
# Debug HTML Test

Equation: $x^2 + 1$
EOF

bin/vaultpress --debug-html /tmp/vaultpress-smoke.html \
  --output /tmp/vaultpress-smoke.pdf \
  "$tmpdir/note.md"
```

5. If you are checking publish contents locally:

```bash
npm run pack:check
```

6. If you want to regenerate the showcase screenshots:

```bash
npm run screenshots
```

## Development

Useful development commands:

```bash
npm test
npm run screenshots
npm run pack:check
```

Current automated coverage focuses on:
- render pipeline regression checks
- frontmatter parsing
- CLI path resolution
- browser path resolution
- temp/log lifecycle behavior
- package manifest/runtime packaging rules
