<div align="center">
  
  # VaultPress

  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/status-pre--release-orange?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/platform-macOS-lightgrey?style=for-the-badge" alt="Platform" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/cli-vaultpress%20%7C%20vp-blue?style=for-the-badge" alt="CLI" />

  **Export Obsidian-style Markdown notes to high-quality PDFs**
</div>

VaultPress is an **Obsidian-aware Markdown to PDF exporter** for note-heavy documents, research notes, embeds, callouts, equations, and mixed Chinese/English technical writing.

It is **not** trying to be the most generic Markdown-to-PDF CLI.
It is trying to be a better fit for people whose documents actually look like Obsidian notes.

> Status: already usable, now being polished into a public-facing project.

## Table of contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [CLI options](#cli-options)
- [CLI examples](#cli-examples)
- [Frontmatter config](#frontmatter-config)
- [Why VaultPress exists](#why-vaultpress-exists)
- [Positioning](#positioning)
- [Current pipeline](#current-pipeline)
- [Supported features](#supported-features)
- [What VaultPress is already good at](#what-vaultpress-is-already-good-at)
- [Examples](#examples)
- [Repository layout](#repository-layout)
- [Known limitations](#known-limitations)
- [What still needs work](#what-still-needs-work)
- [Roadmap (near-term)](#roadmap-near-term)
- [License](#license)

## Installation

Install dependencies:

```bash
npm install
```

For local CLI usage during development, you can link the package:

```bash
npm link
```

After that, the intended CLI usage is:

```bash
vaultpress --output out.pdf path/to/note.md
# or
vp --output out.pdf path/to/note.md
```

## Quick start

Export one note from the repository root:

```bash
npm run export -- --output out.pdf path/to/note.md
```

Or call the repository entrypoint directly:

```bash
bin/vaultpress --output out.pdf path/to/note.md
```

## CLI options

Current options:
- `--output <file.pdf>`
- `--debug-html <file>`
- `--keep-temp`
- `--paper-size <size>`
- `--help`

## CLI examples

Export a note to a specific output path:

```bash
vaultpress --output out.pdf notes/overview.md
```

Export while keeping temporary render files for debugging:

```bash
vaultpress --keep-temp --output out.pdf notes/overview.md
```

Save the intermediate HTML for inspection:

```bash
vaultpress --debug-html debug/rendered.html --output out.pdf notes/overview.md
```

Use a different paper size:

```bash
vaultpress --paper-size Letter --output out.pdf notes/overview.md
```

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

## Why VaultPress exists

Generic Markdown-to-PDF tools are fine for standard Markdown.

But real Obsidian notes often contain things like:
- `[[wikilink]]`
- `[[note#heading]]`
- `[[note#^block]]`
- `![[note]]`
- `![[note#heading]]`
- `![[note#^block]]`
- callouts
- task lists
- footnotes
- math
- Dataview / DataviewJS code blocks

VaultPress adds an **Obsidian-aware preprocessing layer** before browser printing, so the final PDF is closer to how note-heavy documents are actually written and read.

## Positioning

VaultPress should be thought of as:
- an **Obsidian-aware Markdown to PDF exporter**
- a tool for **high-quality PDF export of Obsidian-style notes**
- a browser-print-based pipeline tuned for **real note content**, not just generic Markdown samples

It should **not** be framed as:
- “another md-to-pdf clone”
- “the most generic Markdown PDF CLI”

## Current pipeline

1. Markdown / Obsidian note
2. Obsidian-aware preprocessing → HTML
3. Microsoft Edge headless print-to-pdf
4. PDF output

This gives the project a practical balance of:
- browser-quality rendering
- strong Chinese mixed-text output
- good handling for research-note style documents

## Supported features

### Standard Markdown
- headings
- paragraphs
- lists
- tables
- code blocks
- images

### Obsidian-aware features
- wikilinks
- heading refs
- block refs
- note embeds
- heading embeds
- block embeds
- callouts

### Other useful features
- task lists
- footnotes
- MathJax-based math rendering
- Dataview / DataviewJS code-block display (non-executing)
- lightweight frontmatter-based export config

## What VaultPress is already good at

Compared with a generic Markdown-to-PDF tool, VaultPress is already strong at:
- Obsidian-specific syntax
- Obsidian-style embeds
- callout rendering
- math in note-heavy documents
- Chinese technical notes and research-style content
- browser-print output tuned around real reading notes

## Examples

See:
- `examples/EXAMPLES.md`
- `examples/COMPARISON-NOTES.md`

Recommended showcase set for this project:
- `fixtures/03-embeds.pdf`
- `fixtures/04-callouts.pdf`
- `fixtures/06-extensions.pdf`

Those cover:
- Obsidian-aware syntax
- embed handling
- callouts
- math rendering
- realistic technical-note export quality

## Repository layout

- `bin/` — CLI entrypoints
- `lib/` — implementation scripts
- `docs/obsidian-export-pdf/` — internal design notes and readiness checklist
- `examples/` — example notes and comparison notes
- `fixtures/` — local regression samples and outputs (kept out of git for now)

## Known limitations

Current limitations worth being explicit about:
- not a full Obsidian renderer
- Dataview / DataviewJS blocks are displayed, not executed
- plugin compatibility is intentionally limited
- custom themes and full Obsidian styling are not reproduced 1:1
- current PDF backend depends on Microsoft Edge headless print
- page-break / header-footer support is not finished yet

## What still needs work

Before a clean public release, the biggest gaps are still:
- stronger CLI/config documentation
- screenshot-based examples
- page-break support
- header/footer support
- more systematic tests
- temp/log behavior cleanup
- packaging / installation polish

## Roadmap (near-term)

Near-term priorities:
1. page-break support
2. header/footer support
3. screenshot-based examples
4. cleaner logging/temp-file behavior
5. more polished installation and packaging story

## License

MIT
