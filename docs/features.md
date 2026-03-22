# Features And Examples

## Why VaultPress Exists

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

## Current Pipeline

1. Markdown / Obsidian note
2. Obsidian-aware preprocessing → HTML
3. Chromium-family browser print pipeline
4. PDF output

This gives the project a practical balance of:
- browser-quality rendering
- strong Chinese mixed-text output
- good handling for research-note style documents

## Supported Features

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

## What VaultPress Is Already Good At

Compared with a generic Markdown-to-PDF tool, VaultPress is already strong at:
- Obsidian-specific syntax
- Obsidian-style embeds
- callout rendering
- math in note-heavy documents
- Chinese technical notes and research-style content
- browser-print output tuned around real reading notes

## Screenshot Showcase

Generated with:

```bash
npm run screenshots
```

![Embeds screenshot](../examples/screenshots/03-embeds.png)
![Callouts screenshot](../examples/screenshots/04-callouts.png)
![Extensions screenshot](../examples/screenshots/06-extensions.png)

## Example Files

See:
- [Example outputs](../examples/EXAMPLES.md)
- [Comparison notes](../examples/COMPARISON-NOTES.md)
