<div align="center">
  
  # VaultPress

  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/platform-macOS-lightgrey?style=for-the-badge" alt="Platform" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/cli-vaultpress%20%7C%20vp-blue?style=for-the-badge" alt="CLI" />

  **Export Obsidian-style Markdown notes to high-quality PDFs**
</div>

VaultPress is an **Obsidian-aware Markdown to PDF exporter** for note-heavy documents, research notes, embeds, callouts, equations, and mixed Chinese/English technical writing.

It is built for people whose Markdown actually looks like Obsidian notes.
It is **not** trying to be the most generic Markdown-to-PDF CLI.

## At a glance

VaultPress is for:
- Obsidian-style notes with `[[wikilink]]`, embeds, callouts, footnotes, math, and mixed technical writing
- people who care more about note export quality than generic Markdown feature breadth
- browser-quality PDF export with practical debugging hooks

VaultPress is not for:
- full Obsidian theme/plugin fidelity
- arbitrary browser automation workflows
- being the broadest general-purpose Markdown PDF product

Compared with a generic Markdown-to-PDF tool, VaultPress is already strong at:
- Obsidian-specific syntax
- note embeds and callouts
- page breaks and PDF headers/footers
- Chinese technical notes and research-style layouts
- browser-print output tuned around real reading notes

## Quick Start

Install globally:

```bash
npm install -g vaultpress
```

Export one note:

```bash
vp -o out.pdf path/to/note.md
```

If you are working from a cloned repository instead:

```bash
bin/vaultpress --output out.pdf path/to/note.md
```


## Documentation

- [Getting started](docs/getting-started.md)
- [CLI reference](docs/cli.md)
- [Frontmatter config](docs/frontmatter.md)
- [Features and examples](docs/features.md)
- [Troubleshooting](docs/troubleshooting.md)

## Repository layout

- [`bin/`](bin/) — CLI entrypoints
- [`lib/`](lib/) — implementation scripts and render pipeline modules
- [`test/`](test/) — regression tests
- `docs/obsidian-export-pdf/` — internal design notes and readiness checklist
- [`docs/getting-started.md`](docs/getting-started.md) — installation and first-run guide
- [`docs/cli.md`](docs/cli.md) — CLI options and path behavior
- [`docs/frontmatter.md`](docs/frontmatter.md) — frontmatter, page breaks, headers and footers
- [`docs/features.md`](docs/features.md) — feature overview and example showcase
- [`docs/troubleshooting.md`](docs/troubleshooting.md) — debugging and failure handling
- [`examples/`](examples/) — example notes and comparison notes
- [`examples/screenshots/`](examples/screenshots/) — generated showcase screenshots

## Known limitations

Current limitations worth being explicit about:
- not a full Obsidian renderer
- Dataview / DataviewJS blocks are displayed, not executed
- plugin compatibility is intentionally limited
- custom themes and full Obsidian styling are not reproduced 1:1
- current PDF backend depends on a locally installed Chromium-family browser
- browser auto-detection is pragmatic, not exhaustive

## What still needs work

Before a clean public release, the biggest gaps are still:
- broader browser/platform support

## Roadmap (near-term)

Near-term priorities:
1. broader browser/platform support

## License

MIT
