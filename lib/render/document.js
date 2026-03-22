const { escapeHtml, slugify } = require('./utils');

function buildDocumentHtml(options) {
  const {
    body,
    documentTitle,
    extraCss,
    extraCssPathRaw,
    inputBasename,
    pageMargin,
    paperSize,
    printBackground,
  } = options;

  const css = `
:root { --bg:#fff; --fg:#1f2328; --muted:#57606a; --border:#d0d7de; --soft-border:#e6ebf1; --code-bg:#eef2f6; --embed-bg:#fcfcfd; --quote:#656d76; --accent:#7c3aed; --accent-2:#0969da; --callout-note:#eef5ff; --callout-note-border:#7cb3ff; --callout-tip:#ebfff4; --callout-tip-border:#55c28a; --callout-warning:#fff7e8; --callout-warning-border:#f0b429; --callout-danger:#ffefef; --callout-danger-border:#e5534b; }
@page { size:${paperSize}; margin:${pageMargin}; }
html, body { margin:0; padding:0; background:var(--bg); color:var(--fg); }
*, *::before, *::after { box-sizing:border-box; }
body { font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", sans-serif; line-height:1.72; font-size:15.5px; text-rendering:optimizeLegibility; }
body.no-print-background .callout, body.no-print-background .embed.note-embed, body.no-print-background .embed.file-embed, body.no-print-background .plugin-block, body.no-print-background pre, body.no-print-background code { background:#fff !important; }
.main { max-width:860px; margin:0 auto; padding:34px 42px 56px; }
h1,h2,h3,h4,h5,h6 { line-height:1.28; margin:1.35em 0 0.6em; break-after:avoid-page; font-weight:700; }
h1 { font-size:2em; border-bottom:1px solid var(--soft-border); padding-bottom:.28em; letter-spacing:-0.02em; }
h2 { font-size:1.45em; border-bottom:1px solid var(--soft-border); padding-bottom:.24em; letter-spacing:-0.01em; }
h3 { font-size:1.2em; }
p, ul, ol, blockquote, pre, table { margin:0 0 1em; }
ul, ol { padding-left:1.55em; }
li + li { margin-top:.24em; }
a { color:var(--accent-2); text-decoration:none; }
a.wikilink { color:var(--accent); }
img { display:block; max-width:100%; height:auto; margin:1.15em auto; border-radius:8px; box-shadow:0 1px 2px rgba(0,0,0,.06); }
pre, code { font-family:"SFMono-Regular", ui-monospace, Menlo, Monaco, Consolas, monospace; }
code { display:inline; background:var(--code-bg); padding:.12em .34em; border-radius:6px; font-size:.92em; border:1px solid #d8e0e8; box-decoration-break:clone; -webkit-box-decoration-break:clone; }
pre { background:var(--code-bg); padding:1em; border-radius:10px; white-space:pre-wrap; word-break:break-word; border:1px solid #d8e0e8; overflow-wrap:anywhere; }
pre code { display:block; background:transparent !important; border:none !important; border-radius:0; padding:0 !important; margin:0; font-size:inherit; box-decoration-break:slice; -webkit-box-decoration-break:slice; }
blockquote { position:relative; margin-left:0; padding:.08em 1em .02em 1.1em; color:var(--quote); }
blockquote::before { content:""; position:absolute; left:0; top:.22em; bottom:.32em; width:4px; border-radius:999px; background:var(--border); }
.callout { border-left:4px solid var(--callout-note-border); background:var(--callout-note); padding:12px 14px; border-radius:10px; margin:0 0 1em; break-inside:avoid; }
.callout-title { display:flex; align-items:center; gap:.45em; font-weight:700; margin-bottom:.45em; }
.callout-body > :last-child { margin-bottom:0; }
.callout-body ul, .callout-body ol { margin-bottom:.2em; }
.callout-body pre { margin-top:.3em; }
.callout-icon { width:.72em; height:.72em; border-radius:999px; background:currentColor; opacity:.6; display:inline-block; }
.callout-tip { background:var(--callout-tip); border-left-color:var(--callout-tip-border); }
.callout-note, .callout-info { background:var(--callout-note); border-left-color:var(--callout-note-border); }
.callout-warning, .callout-caution { background:var(--callout-warning); border-left-color:var(--callout-warning-border); }
.callout-danger, .callout-error, .callout-failure { background:var(--callout-danger); border-left-color:var(--callout-danger-border); }
.embed.note-embed, .embed.file-embed, .plugin-block { border:1px solid var(--soft-border); border-radius:10px; padding:12px 14px; margin:0 0 1em; background:var(--embed-bg); }
.embed.note-embed > :last-child, .embed.file-embed > :last-child, .plugin-block > :last-child { margin-bottom:0; }
.embed-title, .plugin-title { font-size:.92em; color:var(--muted); margin-bottom:.5em; font-weight:600; }
.embed img, .embed pre, .embed table, .embed .callout, .embed .math-display, .plugin-block pre { break-inside:avoid; }
.math-inline, .math-display { color:var(--fg); }
.math-inline mjx-container, .math-display mjx-container, .math-inline svg, .math-display svg { max-width:100%; }
.math-inline svg { display:inline-block; vertical-align:middle; }
.math-inline mjx-container { display:inline-block !important; }
.math-display { display:block; margin:1.15em 0 1.2em; padding:0; background:transparent; border:none; border-radius:0; text-align:center; }
.math-display mjx-container { display:block !important; margin:0 auto !important; text-align:center; }
.math-display svg { display:block; margin:0 auto; }
.footnote-ref a { color:var(--accent); font-size:.82em; }
.footnotes { margin-top:2em; padding-top:.5em; }
.footnotes ol { padding-left:1.4em; }
.footnote-backref { margin-left:.4em; }
input[type="checkbox"] { width:.95em; height:.95em; vertical-align:-0.1em; margin-right:.45em; }
ul.contains-task-list { list-style:none; padding-left:.2em; }
li.task-list-item { list-style:none; }
.block-anchor { display:inline-block; width:0; height:0; overflow:hidden; }
table { border-collapse:collapse; width:100%; }
th, td { border:1px solid var(--soft-border); padding:.5em .75em; text-align:left; }
hr { border:none; border-top:1px solid var(--soft-border); margin:2em 0; }
@media print {
  html, body { width:auto; }
  .main { max-width:none; padding:0 1.5mm 0 0.5mm; }
  pre, .embed, .plugin-block, table, blockquote, .callout { width:100%; max-width:100%; }
  img, table, pre, blockquote, .callout, .plugin-block, .math-display { break-inside:avoid; }
  .embed { break-inside:auto; }
}
${extraCss ? `
/* extra-css: ${escapeHtml(extraCssPathRaw)} */
${extraCss}
` : ''}`;

  const bodyClass = printBackground ? '' : ' class="no-print-background"';
  return `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escapeHtml(documentTitle)}</title><style>${css}</style></head><body${bodyClass}><main class="main markdown-body" id="${slugify(inputBasename)}">${body}</main></body></html>`;
}

module.exports = {
  buildDocumentHtml,
};
