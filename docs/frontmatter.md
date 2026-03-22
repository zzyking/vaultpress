# Frontmatter

VaultPress supports note-level frontmatter via `gray-matter`.

## Basic Example

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

## Supported Fields

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

VaultPress supports browser-level PDF headers and footers via frontmatter.

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
