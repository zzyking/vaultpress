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
- [Path resolution](#path-resolution)
- [Frontmatter config](#frontmatter-config)
- [Development](#development)
- [Page Breaks](#page-breaks)
- [Headers And Footers](#headers-and-footers)
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

VaultPress currently expects:
- Node.js 18+
- Microsoft Edge on macOS by default, or an explicit browser path via `--browser`

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
- `--browser <path>`
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

Use a custom browser binary instead of the default Edge path:

```bash
vaultpress --browser "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
  --output out.pdf \
  notes/overview.md
```

## Path resolution

VaultPress now resolves CLI paths relative to the directory where you run the command, not the repository root.

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

## Frontmatter config

VaultPress supports note-level frontmatter via `gray-matter`.

```yaml
---
title: Exported PDF title
paper-size: Letter
margin: 16mm 14mm 18mm 14mm
print-background: true
extra-css: path/to/custom.css
---
```

It also accepts the same values inside a nested `pdf` or `pdf_options` object:

```yaml
---
title: Exported PDF title
pdf:
  format: Letter
  margin: 16mm 14mm 18mm 14mm
  print_background: true
---
```

Currently supported fields:
- `title`
- `paper-size`
- `margin`
- `print-background`
- `extra-css`

Accepted aliases currently include:
- `paper-size`, `paper_size`, `paperSize`, `format`
- `print-background`, `print_background`
- `document-title`, `document_title`
- `extra-css`, `extra_css`

Notes:
- `format` maps to the print paper size
- `extra-css` is resolved relative to the current note first, then the CLI working directory
- frontmatter is intentionally still lightweight; this is not a full generic config system yet

## Development

Run the regression suite:

```bash
npm test
```

Current automated coverage focuses on:
- render pipeline regression checks
- frontmatter parsing
- CLI path resolution
- browser path resolution

## Page Breaks

VaultPress supports explicit PDF page breaks.

Supported forms:

```markdown
\pagebreak
```

```markdown
---page-break---
```

```html
<div class="page-break"></div>
```

All three forms render as a forced page break in the generated PDF.

## Headers And Footers

VaultPress now supports browser-level PDF headers and footers via frontmatter.

Example:

```yaml
---
pdf:
  margin: 20mm 14mm 20mm 14mm
  headerTemplate: |
    <div style="width:100%; font-size:10px; padding:0 10mm; color:#666;">
      <span class="title"></span>
    </div>
  footerTemplate: |
    <div style="width:100%; font-size:10px; padding:0 10mm; color:#666; text-align:right;">
      Page <span class="pageNumber"></span> / <span class="totalPages"></span>
    </div>
---
```

Notes:
- `headerTemplate` and `footerTemplate` are passed to the browser PDF engine
- if either template is present, header/footer display is enabled automatically
- you usually want a larger top/bottom `margin` when using them
- browser-supported placeholders such as `pageNumber`, `totalPages`, `title`, and `date` can be used inside the template HTML

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
- page breaks
- configurable PDF headers and footers
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
- `lib/` — implementation scripts and render pipeline modules
- `test/` — regression tests
- `docs/obsidian-export-pdf/` — internal design notes and readiness checklist
- `examples/` — example notes and comparison notes
- `fixtures/` — local regression samples and exported outputs

## Known limitations

Current limitations worth being explicit about:
- not a full Obsidian renderer
- Dataview / DataviewJS blocks are displayed, not executed
- plugin compatibility is intentionally limited
- custom themes and full Obsidian styling are not reproduced 1:1
- current PDF backend depends on a locally installed Chromium-family browser

## What still needs work

Before a clean public release, the biggest gaps are still:
- screenshot-based examples
- temp/log behavior cleanup
- packaging / installation polish
- broader browser/platform support

## Roadmap (near-term)

Near-term priorities:
1. screenshot-based examples
2. cleaner logging/temp-file behavior
3. more polished installation and packaging story
4. broader browser/platform support

## License

MIT
