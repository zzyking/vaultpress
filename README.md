# VaultPress

**Export Obsidian-style Markdown notes to high-quality PDFs.**

VaultPress is an **Obsidian-aware Markdown to PDF exporter** for note-heavy documents, research notes, embeds, callouts, equations, and mixed Chinese/English technical writing.

It is **not** trying to be the most generic Markdown-to-PDF CLI.
It is trying to be a better fit for people whose documents actually look like Obsidian notes.

> Status: already usable, now being polished into a public-facing project.

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

## Quick start

Install dependencies:

```bash
npm install
```

Export one note from the repository root:

```bash
npm run export -- --output out.pdf path/to/note.md
```

Or call the repository entrypoint directly:

```bash
bin/vaultpress --output out.pdf path/to/note.md
```

If the package is linked or installed as a CLI, the intended usage is:

```bash
vaultpress --output out.pdf path/to/note.md
# or
vp --output out.pdf path/to/note.md
```

## CLI options

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

## What still needs work

Before a clean public release, the biggest gaps are still:
- stronger CLI/config documentation
- screenshot-based examples
- page-break support
- header/footer support
- more systematic tests
- temp/log behavior cleanup
- packaging / installation polish

## Design notes

Useful docs in this repo:
- `docs/obsidian-export-pdf/INTERNAL-DESIGN.md`
- `docs/obsidian-export-pdf/READINESS-CHECKLIST.md`
- `examples/COMPARISON-NOTES.md`

## License

MIT
