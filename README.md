# VaultPress

Export **Obsidian-style Markdown notes** to high-quality PDFs.

VaultPress is an **Obsidian-aware Markdown to PDF exporter** built for note-heavy documents, research notes, callouts, embeds, and mixed Chinese/English technical writing.

> Current status: usable and worth open-sourcing, but still in the polishing stage.

## Why this exists

Generic Markdown-to-PDF tools are fine for standard Markdown.

VaultPress is aimed at a different problem: notes that use **Obsidian-style semantics** and need **browser-quality PDF output**.

That includes things like:
- `[[wikilink]]`
- `[[note#heading]]`
- `[[note#^block]]`
- `![[note]]`
- `![[note#heading]]`
- `![[note#^block]]`
- callouts
- math
- task lists
- footnotes
- Dataview / DataviewJS code blocks

## Current pipeline

1. Markdown / Obsidian note
2. Obsidian-aware preprocessing → HTML
3. Microsoft Edge headless print-to-pdf
4. PDF output

## What it already supports

- Standard Markdown
  - headings
  - paragraphs
  - lists
  - tables
  - code blocks
  - images
- Obsidian-aware features
  - wikilinks
  - heading refs
  - block refs
  - note embeds
  - heading embeds
  - block embeds
  - callouts
- Other useful features
  - task lists
  - footnotes
  - MathJax-based math rendering
  - Dataview / DataviewJS code-block display (non-executing)

## Quick start

Install dependencies:

```bash
npm install
```

Export one note:

```bash
npm run export -- --output out.pdf path/to/note.md
```

Run fixture regression:

```bash
npm run fixtures
```

## CLI

Repository entrypoint:

```bash
bin/vaultpress \
  --output out.pdf \
  path/to/note.md
```

Installed CLI target:

```bash
vaultpress --output out.pdf path/to/note.md
# alias
vp --output out.pdf path/to/note.md
```

Current options:
- `--output <file.pdf>`
- `--debug-html <file>`
- `--keep-temp`
- `--paper-size <size>`
- `--help`

## Frontmatter config

VaultPress also supports lightweight note-level frontmatter config.

```yaml
---
title: Exported PDF title
paper-size: Letter
margin: 16mm 14mm 18mm 14mm
print-background: true
extra-css: path/to/custom.css
---
```

Currently supported fields:
- `title`
- `paper-size`
- `margin`
- `print-background`
- `extra-css`

## Repository layout

- `bin/` — stable CLI wrappers
- `tools/obsidian-export-pdf/` — current entrypoints and compatibility wrappers
- `lib/` — implementation scripts
- `fixtures/` — regression inputs and exported PDFs
- `examples/` — example notes and comparison notes
- `docs/obsidian-export-pdf/` — design notes and readiness checklist

## Good at right now

Compared with a generic Markdown-to-PDF tool, VaultPress is already strong at:
- Obsidian-specific syntax
- Obsidian-style embeds
- callout rendering
- math in note-heavy documents
- Chinese technical notes and research-style content

## Still worth polishing

Before a clean public release, the biggest gaps are:
- project packaging cleanup
- stronger CLI/config documentation
- screenshot-based examples
- page-break / header-footer support
- more systematic tests
- temp/log behavior cleanup

## Docs

- Public draft: `tools/obsidian-export-pdf/README-public-draft.md`
- Internal notes: `docs/obsidian-export-pdf/INTERNAL-DESIGN.md`
- Readiness checklist: `docs/obsidian-export-pdf/READINESS-CHECKLIST.md`
- Current status snapshot: `tools/obsidian-export-pdf/STATUS.md`

## License

MIT
NAL-DESIGN.md`
- Readiness checklist: `docs/obsidian-export-pdf/READINESS-CHECKLIST.md`
- Current status snapshot: `tools/obsidian-export-pdf/STATUS.md`

## License

MIT
