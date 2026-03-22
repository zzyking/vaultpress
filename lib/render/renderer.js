const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { mathjax } = require('mathjax-full/js/mathjax.js');
const { TeX } = require('mathjax-full/js/input/tex.js');
const { SVG } = require('mathjax-full/js/output/svg.js');
const { liteAdaptor } = require('mathjax-full/js/adaptors/liteAdaptor.js');
const { RegisterHTMLHandler } = require('mathjax-full/js/handlers/html.js');
const { AllPackages } = require('mathjax-full/js/input/tex/AllPackages.js');

const { escapeHtml, exists, slugify } = require('./utils');

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const tex = new TeX({ packages: AllPackages });
const svg = new SVG({ fontCache: 'none' });
const mjDocument = mathjax.document('', { InputJax: tex, OutputJax: svg });

function markdownToHtml(src) {
  return marked.parse(src, {
    gfm: true,
    headerIds: false,
    mangle: false,
  });
}

function renderMath(expr, display = false) {
  try {
    const node = mjDocument.convert(expr, { display });
    const out = adaptor.outerHTML(node);
    return display ? `<div class="mathjax-wrap math-display">${out}</div>` : `<span class="mathjax-wrap math-inline">${out}</span>`;
  } catch {
    return display ? `<div class="math math-display"><code>${escapeHtml(expr.trim())}</code></div>` : `<span class="math math-inline"><code>${escapeHtml(expr.trim())}</code></span>`;
  }
}

function extractBlock(text, blockId) {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (new RegExp(`\\^${blockId}\\s*$`).test(lines[i])) {
      let start = i;
      while (start > 0 && lines[start - 1].trim() !== '') start--;
      let end = i;
      while (end + 1 < lines.length && lines[end + 1].trim() !== '') end++;
      return lines.slice(start, end + 1).join('\n').replace(new RegExp(`\\s*\\^${blockId}\\s*$`), '');
    }
  }
  return null;
}

function extractHeadingSection(text, heading) {
  const lines = text.split(/\r?\n/);
  const wanted = heading.trim().toLowerCase();
  let start = -1;
  let level = 0;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,6})\s+(.*)$/);
    if (!match) continue;
    if (match[2].trim().toLowerCase() === wanted) {
      start = i;
      level = match[1].length;
      break;
    }
  }

  if (start === -1) return null;

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,6})\s+(.*)$/);
    if (match && match[1].length <= level) {
      end = i;
      break;
    }
  }

  return lines.slice(start, end).join('\n');
}

function extractFootnotes(src) {
  const defs = new Map();
  const lines = src.split(/\r?\n/);
  const kept = [];

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^\[\^([^\]]+)\]:\s*(.*)$/);
    if (!match) {
      kept.push(lines[i]);
      continue;
    }

    const id = match[1];
    const body = [match[2]];
    i++;
    while (i < lines.length && (/^\s{2,}\S/.test(lines[i]) || lines[i].trim() === '')) {
      body.push(lines[i].replace(/^\s{2,}/, ''));
      i++;
    }
    i--;
    defs.set(id, body.join('\n').trim());
  }

  return { body: kept.join('\n'), footnotes: defs };
}

function applyFootnotes(src, footnotes) {
  return src.replace(/\[\^([^\]]+)\]/g, (_, id) => (
    footnotes.has(id)
      ? `<sup class="footnote-ref"><a href="#fn-${slugify(id)}" id="fnref-${slugify(id)}">[${escapeHtml(id)}]</a></sup>`
      : `[^${id}]`
  ));
}

function buildFootnotesSection(footnotes) {
  if (!footnotes.size) return '';
  let out = '\n\n<hr>\n<section class="footnotes">\n<h2>Footnotes</h2>\n<ol>\n';
  for (const [id, text] of footnotes.entries()) out += `<li id="fn-${slugify(id)}">${escapeHtml(text)} <a href="#fnref-${slugify(id)}" class="footnote-backref">↩</a></li>\n`;
  return `${out}</ol>\n</section>\n`;
}

function protectCodeSpansAndBlocks(src) {
  const store = [];
  const put = (text) => {
    const token = `@@CODETOKEN_${store.length}@@`;
    store.push(text);
    return token;
  };

  src = src.replace(/```[\s\S]*?```/g, (match) => put(match));
  src = src.replace(/`[^`\n]+`/g, (match) => put(match));

  return {
    body: src,
    restore(text) {
      return text.replace(/@@CODETOKEN_(\d+)@@/g, (_, n) => store[Number(n)] || '');
    },
    restoreHtml(html) {
      html = html.replace(/<p>\s*@@CODETOKEN_(\d+)@@\s*<\/p>/g, (_, n) => {
        const raw = store[Number(n)] || '';
        if (raw.startsWith('```')) {
          const match = raw.match(/^```([^\n]*)\n([\s\S]*?)\n?```$/);
          const lang = (match?.[1] || '').trim();
          const body = match?.[2] ?? '';
          const cls = lang ? ` class="language-${escapeHtml(lang)}"` : '';
          return `<pre><code${cls}>${escapeHtml(body)}</code></pre>`;
        }
        return `<p><code>${escapeHtml(raw.slice(1, -1))}</code></p>`;
      });

      return html.replace(/@@CODETOKEN_(\d+)@@/g, (_, n) => {
        const raw = store[Number(n)] || '';
        if (raw.startsWith('```')) {
          const match = raw.match(/^```([^\n]*)\n([\s\S]*?)\n?```$/);
          const lang = (match?.[1] || '').trim();
          const body = match?.[2] ?? '';
          const cls = lang ? ` class="language-${escapeHtml(lang)}"` : '';
          return `<pre><code${cls}>${escapeHtml(body)}</code></pre>`;
        }
        return `<code>${escapeHtml(raw.slice(1, -1))}</code>`;
      });
    },
  };
}

function makeHtmlTokenStore(prefix) {
  const store = [];
  return {
    put(html) {
      const token = `@@${prefix}_${store.length}@@`;
      store.push(html);
      return `\n\n${token}\n\n`;
    },
    restore(text) {
      return text
        .replace(new RegExp(`<p>\\s*@@${prefix}_(\\d+)@@\\s*<\\/p>`, 'g'), (_, n) => store[Number(n)] || '')
        .replace(new RegExp(`@@${prefix}_(\\d+)@@`, 'g'), (_, n) => store[Number(n)] || '');
    },
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
  return src.replace(
    /(.*?)(\s*\^([A-Za-z0-9_-]+)\s*)$/gm,
    (_, line, _full, blockId) => (line.trim() ? `${line} <span class="block-anchor" id="${slugify(`${noteName}-${blockId}`)}"></span>` : ''),
  );
}

function addHeadingAnchors(html, noteName) {
  const seen = new Map();
  return html.replace(/<(h[1-6])>(.*?)<\/\1>/g, (_, tag, content) => {
    const text = content.replace(/<[^>]+>/g, '').trim();
    const base = slugify(`${noteName}-${text}`);
    const count = (seen.get(base) || 0) + 1;
    seen.set(base, count);
    return `<${tag} id="${count === 1 ? base : `${base}-${count}`}">${content}</${tag}>`;
  });
}

function postProcessHtml(html) {
  html = html.replace(/<p>\s*(<div class="(?:math|plugin-block|mathjax-wrap|embed)[\s\S]*?<\/div>)\s*<\/p>/g, '$1');
  html = html.replace(/<ul>([\s\S]*?<input[^>]*type="checkbox"[^>]*>[\s\S]*?)<\/ul>/g, (match) => match.replace('<ul>', '<ul class="contains-task-list">').replace(/<li>/g, '<li class="task-list-item">'));
  html = html.replace(/<div class="callout-body">\s*<p>([\s\S]*?)<\/p>\s*<\/div>/g, (match, inner) => (/(<ul|<ol|<pre|<div|<img|<p>|<figure|<mjx-container|<svg)/.test(inner) ? match : `<div class="callout-body"><p>${inner}</p></div>`));
  return html;
}

function createPathResolvers(context) {
  const { noteDir, rootDir, outputPath } = context;

  function relForOutput(absPath) {
    return path.relative(path.dirname(outputPath), absPath);
  }

  function resolveExistingPath(raw, baseDir = noteDir) {
    const target = String(raw || '').trim();
    if (!target) return null;
    const candidates = [
      path.resolve(baseDir, target),
      path.resolve(rootDir, target),
      path.resolve(rootDir, 'obsidian-vault', target),
    ];
    for (const candidate of candidates) if (exists(candidate)) return candidate;
    return null;
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
    for (const candidate of candidates) if (exists(candidate)) return candidate;
    return null;
  }

  return {
    relForOutput,
    resolveExistingPath,
    resolveTarget,
  };
}

function createRenderer(context) {
  const { resolveTarget, relForOutput } = createPathResolvers(context);

  function renderWikiLinks(src, currentDir = context.noteDir) {
    src = src.replace(/\[\[([^\]|#]+?)#\^([^\]|]+?)(?:\|([^\]]+))?\]\]/g, (_, note, blockId, alias) => {
      const abs = resolveTarget(note, currentDir);
      const label = alias || `${note}#^${blockId}`;
      if (!abs) return label;
      return `<a href="#${slugify(`${path.basename(abs)}-${blockId}`)}" class="wikilink" data-note="${escapeHtml(path.basename(abs))}" data-block="${escapeHtml(blockId)}">${escapeHtml(label)}</a>`;
    });
    src = src.replace(/\[\[([^\]|#]+?)#([^\]|]+?)(?:\|([^\]]+))?\]\]/g, (_, note, heading, alias) => {
      const abs = resolveTarget(note, currentDir);
      const label = alias || `${note} > ${heading}`;
      if (!abs) return label;
      return `<a href="#${slugify(`${path.basename(abs)}-${heading}`)}" class="wikilink" data-note="${escapeHtml(path.basename(abs))}" data-heading="${escapeHtml(heading)}">${escapeHtml(label)}</a>`;
    });
    src = src.replace(/\[\[([^\]]+?)\]\]/g, (_, inner) => {
      const [target, alias] = inner.split('|');
      const abs = resolveTarget(target.trim(), currentDir);
      const label = (alias || target).trim();
      if (!abs) return label;
      return `<a href="#${slugify(path.basename(abs))}" class="wikilink" data-note="${escapeHtml(path.basename(abs))}">${escapeHtml(label)}</a>`;
    });
    return src;
  }

  function renderCallouts(src) {
    const lines = src.split(/\r?\n/);
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^>\s*\[!(\w+)([+-])?\]\s*(.*)$/);
      if (!match) {
        out.push(lines[i]);
        continue;
      }
      const kind = match[1].toLowerCase();
      const fold = match[2] || '';
      const title = match[3] || kind;
      const body = [];
      i++;
      while (i < lines.length && /^> ?/.test(lines[i])) {
        body.push(lines[i].replace(/^> ?/, ''));
        i++;
      }
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

  function buildRenderPipeline(options = {}) {
    const { disableEmbeds = false, visited = new Set() } = options;

    function renderEmbeds(src, currentDir, visitedSet, embedStore) {
      return src.replace(/!\[\[([^\]]+?)\]\]/g, (_, inner) => {
        const raw = inner.split('|')[0].trim();
        let targetPart = raw;
        let heading = null;
        let blockId = null;

        if (raw.includes('#^')) [targetPart, blockId] = raw.split('#^');
        else if (raw.includes('#')) [targetPart, heading] = raw.split('#');

        const abs = resolveTarget(targetPart, currentDir);
        if (!abs) return `> [!missing] Missing embed: ${raw}`;

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

        const nextVisited = new Set(visitedSet);
        nextVisited.add(embedKey);
        const childHtml = buildRenderPipeline({ disableEmbeds: true, visited: nextVisited }).processMarkdown(child, path.dirname(abs), path.basename(abs));
        const label = blockId ? `${path.basename(targetPart)}#^${blockId}` : heading ? `${path.basename(targetPart)}#${heading}` : path.basename(targetPart);
        return embedStore.put(`<div class="embed note-embed"><div class="embed-title">嵌入：${escapeHtml(label)}</div>${childHtml}</div>`);
      });
    }

    function processMarkdown(src, currentDir, noteName) {
      let local = src;
      const codeProtected = protectCodeSpansAndBlocks(local);
      local = codeProtected.body;
      const footnoteData = extractFootnotes(local);
      local = footnoteData.body;
      local = addBlockAnchors(local, noteName);
      local = applyFootnotes(local, footnoteData.footnotes);
      const special = protectSpecialBlocks(local);
      local = special.body;
      const embedStore = makeHtmlTokenStore('EMBED');
      if (!disableEmbeds) local = renderEmbeds(local, currentDir, visited, embedStore);
      local = renderWikiLinks(local, currentDir);
      local = codeProtected.restore(local);
      local = renderCallouts(local);
      local += buildFootnotesSection(footnoteData.footnotes);
      let html = markdownToHtml(local);
      html = special.restore(html);
      html = embedStore.restore(html);
      html = codeProtected.restoreHtml(html);
      html = addHeadingAnchors(html, noteName);
      html = postProcessHtml(html);
      return html;
    }

    return { processMarkdown };
  }

  return {
    buildRenderPipeline,
    resolveExistingPath: createPathResolvers(context).resolveExistingPath,
  };
}

module.exports = {
  createRenderer,
};
