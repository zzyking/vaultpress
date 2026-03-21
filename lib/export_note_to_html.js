#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {mathjax} = require('mathjax-full/js/mathjax.js');
const {TeX} = require('mathjax-full/js/input/tex.js');
const {SVG} = require('mathjax-full/js/output/svg.js');
const {liteAdaptor} = require('mathjax-full/js/adaptors/liteAdaptor.js');
const {RegisterHTMLHandler} = require('mathjax-full/js/handlers/html.js');
const {AllPackages} = require('mathjax-full/js/input/tex/AllPackages.js');

if (process.argv.length < 4) {
  console.error('Usage: node export_note_to_html.js <input.md> <output.html>');
  process.exit(2);
}

const input = path.resolve(process.argv[2]);
const output = path.resolve(process.argv[3]);
const noteDir = path.dirname(input);
const rootDir = process.cwd();
let md = fs.readFileSync(input, 'utf8');

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const tex = new TeX({packages: AllPackages});
const svg = new SVG({fontCache: 'none'});
const mjDocument = mathjax.document('', {InputJax: tex, OutputJax: svg});

function stripWrappingQuotes(value) {
  const s = String(value).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1);
  return s;
}
function parseBoolean(value) {
  const s = String(value).trim().toLowerCase();
  if (['true', 'yes', 'on', '1'].includes(s)) return true;
  if (['false', 'no', 'off', '0'].includes(s)) return false;
  return null;
}
function extractFrontmatter(src) {
  if (!src.startsWith('---\n')) return { body: src, data: {} };
  const end = src.indexOf('\n---\n', 4);
  if (end === -1) return { body: src, data: {} };
  const raw = src.slice(4, end);
  const body = src.slice(end + 5);
  const data = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const m = line.match(/^([A-Za-z0-9_.-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    data[m[1].trim()] = stripWrappingQuotes(m[2]);
  }
  return { body, data };
}
function getFrontmatterValue(data, keys, fallback = '') {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(data, key) && String(data[key]).trim() !== '') return String(data[key]).trim();
  }
  return fallback;
}
const frontmatter = extractFrontmatter(md);
md = frontmatter.body;
const fm = frontmatter.data;
const paperSize = getFrontmatterValue(fm, ['paper-size', 'paper_size', 'pdf-paper-size', 'pdf_paper_size'], process.env.OPENCLAW_OBS_PDF_PAPER_SIZE || 'A4').trim();
const documentTitle = getFrontmatterValue(fm, ['title', 'pdf-title', 'pdf_title'], path.basename(input, path.extname(input)));
const pageMargin = getFrontmatterValue(fm, ['margin', 'pdf-margin', 'pdf_margin'], '14mm 12mm 16mm 12mm');
const extraCssPathRaw = getFrontmatterValue(fm, ['extra-css', 'extra_css', 'pdf-extra-css', 'pdf_extra_css'], '');
const printBackground = parseBoolean(getFrontmatterValue(fm, ['print-background', 'print_background', 'pdf-print-background', 'pdf_print_background'], 'true')) !== false;

function exists(p) {
  try { return fs.existsSync(p); } catch { return false; }
}
function resolveExistingPath(raw, baseDir = noteDir) {
  const target = String(raw || '').trim();
  if (!target) return null;
  const candidates = [
    path.resolve(baseDir, target),
    path.resolve(rootDir, target),
    path.resolve(rootDir, 'obsidian-vault', target),
  ];
  for (const c of candidates) if (exists(c)) return c;
  return null;
}
function markdownToHtml(src) {
  return execFileSync('npx', ['--yes', 'marked', '--gfm'], { input: src, encoding: 'utf8' });
}
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function slugify(s) {
  return String(s).trim().toLowerCase().replace(/[`~!@#$%^&*()+=<>?,./:;"'\\|\[\]{}]/g, '').replace(/\s+/g, '-');
}
function renderMath(expr, display = false) {
  try {
    const node = mjDocument.convert(expr, {display});
    const out = adaptor.outerHTML(node);
    return display ? `<div class="mathjax-wrap math-display">${out}</div>` : `<span class="mathjax-wrap math-inline">${out}</span>`;
  } catch {
    return display ? `<div class="math math-display"><code>${escapeHtml(expr.trim())}</code></div>` : `<span class="math math-inline"><code>${escapeHtml(expr.trim())}</code></span>`;
  }
}
function resolveTarget(raw, baseDir = noteDir) {
  const target = raw.trim();
  if (!target) return target;
  if (/^(https?:|data:|file:)/i.test(target)) return target;
  const candidates = [
    path.resolve(baseDir, target), path.resolve(baseDir, `${target}.md`),
    path.resolve(rootDir, target), path.resolve(rootDir, `${target}.md`),
    path.resolve(rootDir, 'obsidian-vault', target), path.resolve(rootDir, 'obsidian-vault', `${target}.md`),
  ];
  for (const c of candidates) if (exists(c)) return c;
  return null;
}
const extraCssPath = resolveExistingPath(extraCssPathRaw, noteDir);
const extraCss = extraCssPath ? fs.readFileSync(extraCssPath, 'utf8') : '';
function relForOutput(absPath) { return path.relative(path.dirname(output), absPath); }
function extractBlock(text, blockId) {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (new RegExp(`\\^${blockId}\\s*$`).test(lines[i])) {
      let start = i; while (start > 0 && lines[start - 1].trim() !== '') start--;
      let end = i; while (end + 1 < lines.length && lines[end + 1].trim() !== '') end++;
      return lines.slice(start, end + 1).join('\n').replace(new RegExp(`\\s*\\^${blockId}\\s*$`), '');
    }
  }
  return null;
}
function extractHeadingSection(text, heading) {
  const lines = text.split(/\r?\n/); const wanted = heading.trim().toLowerCase(); let start = -1; let level = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6})\s+(.*)$/); if (!m) continue;
    if (m[2].trim().toLowerCase() === wanted) { start = i; level = m[1].length; break; }
  }
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6})\s+(.*)$/);
    if (m && m[1].length <= level) { end = i; break; }
  }
  return lines.slice(start, end).join('\n');
}
function extractFootnotes(src) {
  const defs = new Map(); const lines = src.split(/\r?\n/); const kept = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\[\^([^\]]+)\]:\s*(.*)$/);
    if (!m) { kept.push(lines[i]); continue; }
    const id = m[1]; const body = [m[2]]; i++;
    while (i < lines.length && (/^\s{2,}\S/.test(lines[i]) || lines[i].trim() === '')) { body.push(lines[i].replace(/^\s{2,}/, '')); i++; }
    i--; defs.set(id, body.join('\n').trim());
  }
  return { body: kept.join('\n'), footnotes: defs };
}
function applyFootnotes(src, footnotes) {
  return src.replace(/\[\^([^\]]+)\]/g, (_, id) => footnotes.has(id) ? `<sup class="footnote-ref"><a href="#fn-${slugify(id)}" id="fnref-${slugify(id)}">[${escapeHtml(id)}]</a></sup>` : `[^${id}]`);
}
function buildFootnotesSection(footnotes) {
  if (!footnotes.size) return '';
  let out = '\n\n<hr>\n<section class="footnotes">\n<h2>Footnotes</h2>\n<ol>\n';
  for (const [id, text] of footnotes.entries()) out += `<li id="fn-${slugify(id)}">${escapeHtml(text)} <a href="#fnref-${slugify(id)}" class="footnote-backref">↩</a></li>\n`;
  return out + '</ol>\n</section>\n';
}
function protectCodeSpansAndBlocks(src) {
  const store = []; const put = (text) => { const token = `@@CODETOKEN_${store.length}@@`; store.push(text); return token; };
  src = src.replace(/```[\s\S]*?```/g, (m) => put(m));
  src = src.replace(/`[^`\n]+`/g, (m) => put(m));
  return {
    body: src,
    restore(text) { return text.replace(/@@CODETOKEN_(\d+)@@/g, (_, n) => store[Number(n)] || ''); },
    restoreHtml(html) {
      html = html.replace(/<p>\s*@@CODETOKEN_(\d+)@@\s*<\/p>/g, (_, n) => {
        const raw = store[Number(n)] || '';
        if (raw.startsWith('```')) {
          const m = raw.match(/^```([^\n]*)\n([\s\S]*?)\n?```$/);
          const lang = (m?.[1] || '').trim();
          const body = m?.[2] ?? '';
          const cls = lang ? ` class="language-${escapeHtml(lang)}"` : '';
          return `<pre><code${cls}>${escapeHtml(body)}</code></pre>`;
        }
        return `<p><code>${escapeHtml(raw.slice(1, -1))}</code></p>`;
      });
      return html.replace(/@@CODETOKEN_(\d+)@@/g, (_, n) => {
        const raw = store[Number(n)] || '';
        if (raw.startsWith('```')) {
          const m = raw.match(/^```([^\n]*)\n([\s\S]*?)\n?```$/);
          const lang = (m?.[1] || '').trim();
          const body = m?.[2] ?? '';
          const cls = lang ? ` class="language-${escapeHtml(lang)}"` : '';
          return `<pre><code${cls}>${escapeHtml(body)}</code></pre>`;
        }
        return `<code>${escapeHtml(raw.slice(1, -1))}</code>`;
      });
    }
  };
}
function makeHtmlTokenStore(prefix) {
  const store = [];
  return {
    put(html) { const token = `@@${prefix}_${store.length}@@`; store.push(html); return `\n\n${token}\n\n`; },
    restore(text) {
      return text
        .replace(new RegExp(`<p>\\s*@@${prefix}_(\\d+)@@\\s*<\\/p>`, 'g'), (_, n) => store[Number(n)] || '')
        .replace(new RegExp(`@@${prefix}_(\\d+)@@`, 'g'), (_, n) => store[Number(n)] || '');
    }
  };
}
function protectSpecialBlocks(src) {
  const store = makeHtmlTokenStore('HTMLBLOCK');
  src = src.replace(/```dataviewjs\n([\s\S]*?)```/gi, (_, code) => store.put(`<div class="plugin-block dataview-block"><div class="plugin-title">DataviewJS</div><pre><code>${escapeHtml(code.trim())}</code></pre></div>`));
  src = src.replace(/```dataview\n([\s\S]*?)```/gi, (_, code) => store.put(`<div class="plugin-block dataview-block"><div class="plugin-title">Dataview</div><pre><code>${escapeHtml(code.trim())}</code></pre></div>`));
  src = src.replace(/\$\$\n?([\s\S]*?)\n?\$\$/g, (_, expr) => store.put(renderMath(expr.trim(), true)));
  src = src.replace(/(?<!\$)\$([^\n$]+)\$(?!\$)/g, (_, expr) => renderMath(expr.trim(), false));
  return { body: src, restore: store.restore };
}
function addBlockAnchors(src, noteName) {
  return src.replace(/(.*?)(\s*\^([A-Za-z0-9_-]+)\s*)$/gm, (_, line, _full, blockId) => line.trim() ? `${line} <span class="block-anchor" id="${slugify(`${noteName}-${blockId}`)}"></span>` : '');
}
function renderWikiLinks(src, currentDir = noteDir) {
  src = src.replace(/\[\[([^\]|#]+?)#\^([^\]|]+?)(?:\|([^\]]+))?\]\]/g, (_, note, blockId, alias) => {
    const abs = resolveTarget(note, currentDir); const label = alias || `${note}#^${blockId}`; if (!abs) return label;
    return `<a href="#${slugify(`${path.basename(abs)}-${blockId}`)}" class="wikilink" data-note="${escapeHtml(path.basename(abs))}" data-block="${escapeHtml(blockId)}">${escapeHtml(label)}</a>`;
  });
  src = src.replace(/\[\[([^\]|#]+?)#([^\]|]+?)(?:\|([^\]]+))?\]\]/g, (_, note, heading, alias) => {
    const abs = resolveTarget(note, currentDir); const label = alias || `${note} > ${heading}`; if (!abs) return label;
    return `<a href="#${slugify(`${path.basename(abs)}-${heading}`)}" class="wikilink" data-note="${escapeHtml(path.basename(abs))}" data-heading="${escapeHtml(heading)}">${escapeHtml(label)}</a>`;
  });
  src = src.replace(/\[\[([^\]]+?)\]\]/g, (_, inner) => {
    const [target, alias] = inner.split('|'); const abs = resolveTarget(target.trim(), currentDir); const label = (alias || target).trim(); if (!abs) return label;
    return `<a href="#${slugify(path.basename(abs))}" class="wikilink" data-note="${escapeHtml(path.basename(abs))}">${escapeHtml(label)}</a>`;
  });
  return src;
}
function renderCallouts(src) {
  const lines = src.split(/\r?\n/); const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^>\s*\[!(\w+)([+-])?\]\s*(.*)$/);
    if (!m) { out.push(lines[i]); continue; }
    const kind = m[1].toLowerCase(); const fold = m[2] || ''; const title = m[3] || kind; const body = []; i++;
    while (i < lines.length && /^> ?/.test(lines[i])) { body.push(lines[i].replace(/^> ?/, '')); i++; }
    i--;
    let local = body.join('\n');
    const special = protectSpecialBlocks(local);
    local = special.body;
    let renderedBody = markdownToHtml(local).trim();
    renderedBody = special.restore(renderedBody);
    renderedBody = postProcessHtml(renderedBody);
    out.push(`<div class="callout callout-${kind}" data-fold="${fold}"><div class="callout-title"><span class="callout-icon"></span>${escapeHtml(title || kind)}</div><div class="callout-body">${renderedBody}</div></div>`);
  }
  return out.join('\n');
}
function addHeadingAnchors(html, noteName) {
  const seen = new Map();
  return html.replace(/<(h[1-6])>(.*?)<\/\1>/g, (m, tag, content) => {
    const text = content.replace(/<[^>]+>/g, '').trim(); const base = slugify(`${noteName}-${text}`); const n = (seen.get(base) || 0) + 1; seen.set(base, n);
    return `<${tag} id="${n === 1 ? base : `${base}-${n}`}">${content}</${tag}>`;
  });
}
function postProcessHtml(html) {
  html = html.replace(/<p>\s*(<div class="(?:math|plugin-block|mathjax-wrap|embed)[\s\S]*?<\/div>)\s*<\/p>/g, '$1');
  html = html.replace(/<ul>([\s\S]*?<input[^>]*type="checkbox"[^>]*>[\s\S]*?)<\/ul>/g, (m) => m.replace('<ul>', '<ul class="contains-task-list">').replace(/<li>/g, '<li class="task-list-item">'));
  html = html.replace(/<div class="callout-body">\s*<p>([\s\S]*?)<\/p>\s*<\/div>/g, (m, inner) => (/(<ul|<ol|<pre|<div|<img|<p>|<figure|<mjx-container|<svg)/.test(inner) ? m : `<div class="callout-body"><p>${inner}</p></div>`));
  return html;
}
function buildRenderPipeline(options = {}) {
  const { disableEmbeds = false, visited = new Set() } = options;
  function processMarkdown(src, currentDir, noteName) {
    let local = src;
    const codeProtected = protectCodeSpansAndBlocks(local); local = codeProtected.body;
    const footnoteData = extractFootnotes(local); local = footnoteData.body;
    local = addBlockAnchors(local, noteName); local = applyFootnotes(local, footnoteData.footnotes);
    const special = protectSpecialBlocks(local); local = special.body;
    const embedStore = makeHtmlTokenStore('EMBED');
    if (!disableEmbeds) local = renderEmbeds(local, currentDir, visited, embedStore);
    local = renderWikiLinks(local, currentDir);
    local = codeProtected.restore(local);
    local = renderCallouts(local);
    local += buildFootnotesSection(footnoteData.footnotes);
    let html = markdownToHtml(local); html = special.restore(html); html = embedStore.restore(html); html = codeProtected.restoreHtml(html); html = addHeadingAnchors(html, noteName); html = postProcessHtml(html);
    return html;
  }
  function renderEmbeds(src, currentDir, visitedSet, embedStore) {
    return src.replace(/!\[\[([^\]]+?)\]\]/g, (_, inner) => {
      const raw = inner.split('|')[0].trim(); let targetPart = raw; let heading = null; let blockId = null;
      if (raw.includes('#^')) [targetPart, blockId] = raw.split('#^'); else if (raw.includes('#')) [targetPart, heading] = raw.split('#');
      const abs = resolveTarget(targetPart, currentDir); if (!abs) return `> [!missing] Missing embed: ${raw}`;
      const ext = path.extname(abs).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) return `![](${relForOutput(abs)})`;
      if (ext !== '.md') return embedStore.put(`<div class="embed file-embed"><a href="${escapeHtml(relForOutput(abs))}">附件：${escapeHtml(path.basename(abs))}</a></div>`);
      const embedKey = `${abs}#${heading || ''}#^${blockId || ''}`;
      if (visitedSet.has(embedKey)) {
        const label = blockId ? `${path.basename(targetPart)}#^${blockId}` : heading ? `${path.basename(targetPart)}#${heading}` : path.basename(targetPart);
        return embedStore.put(`<div class="embed file-embed"><div class="embed-title">嵌入引用</div><p>${escapeHtml(label)}</p></div>`);
      }
      let child = fs.readFileSync(abs, 'utf8');
      if (blockId) child = extractBlock(child, blockId) || `> [!missing] Missing block: ${raw}`;
      if (heading) child = extractHeadingSection(child, heading) || `> [!missing] Missing heading: ${raw}`;
      const nextVisited = new Set(visitedSet); nextVisited.add(embedKey);
      const childHtml = buildRenderPipeline({ disableEmbeds: true, visited: nextVisited }).processMarkdown(child, path.dirname(abs), path.basename(abs));
      const label = blockId ? `${path.basename(targetPart)}#^${blockId}` : heading ? `${path.basename(targetPart)}#${heading}` : path.basename(targetPart);
      return embedStore.put(`<div class="embed note-embed"><div class="embed-title">嵌入：${escapeHtml(label)}</div>${childHtml}</div>`);
    });
  }
  return { processMarkdown };
}

const body = buildRenderPipeline().processMarkdown(md, noteDir, path.basename(input));
const title = documentTitle;
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
const html = `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escapeHtml(title)}</title><style>${css}</style></head><body${bodyClass}><main class="main markdown-body" id="${slugify(path.basename(input))}">${body}</main></body></html>`;
fs.writeFileSync(output, html);
console.error(output);
