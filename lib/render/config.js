const fs = require('fs');
const matter = require('gray-matter');

const { parseBoolean } = require('./utils');

function firstDefinedValue(objects, keys, fallback = '') {
  for (const object of objects) {
    if (!object || typeof object !== 'object') continue;
    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(object, key)) continue;
      const value = object[key];
      if (value === undefined || value === null) continue;
      if (typeof value === 'string' && value.trim() === '') continue;
      return value;
    }
  }
  return fallback;
}

function loadRenderConfig(src, context) {
  const parsed = matter(src);
  const frontmatter = parsed.data && typeof parsed.data === 'object' ? parsed.data : {};
  const pdfConfig = [
    frontmatter.pdf,
    frontmatter.pdf_options,
    frontmatter.pdfOptions,
  ].find((value) => value && typeof value === 'object') || {};

  const sources = [frontmatter, pdfConfig];
  const paperSize = String(firstDefinedValue(
    sources,
    ['paper-size', 'paper_size', 'pdf-paper-size', 'pdf_paper_size', 'paperSize', 'format'],
    context.defaultPaperSize,
  )).trim();
  const title = String(firstDefinedValue(
    sources,
    ['title', 'document-title', 'document_title', 'pdf-title', 'pdf_title'],
    context.defaultTitle,
  )).trim();
  const margin = String(firstDefinedValue(
    sources,
    ['margin', 'pdf-margin', 'pdf_margin'],
    context.defaultMargin,
  )).trim();
  const extraCssPath = String(firstDefinedValue(
    sources,
    ['extra-css', 'extra_css', 'pdf-extra-css', 'pdf_extra_css'],
    '',
  )).trim();
  const printBackground = parseBoolean(firstDefinedValue(
    sources,
    ['print-background', 'print_background', 'pdf-print-background', 'pdf_print_background'],
    'true',
  )) !== false;

  return {
    body: parsed.content,
    frontmatter,
    options: {
      extraCssPath,
      margin,
      paperSize,
      printBackground,
      title,
    },
  };
}

function loadExtraCss(extraCssPath) {
  if (!extraCssPath) return '';
  return fs.readFileSync(extraCssPath, 'utf8');
}

module.exports = {
  loadExtraCss,
  loadRenderConfig,
};
