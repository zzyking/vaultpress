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

function marginValueToCss(value, fallback) {
  if (typeof value === 'string' && value.trim() !== '') return value.trim();
  if (value && typeof value === 'object') {
    const top = value.top ?? value.vertical ?? fallback;
    const right = value.right ?? value.horizontal ?? top;
    const bottom = value.bottom ?? value.vertical ?? top;
    const left = value.left ?? value.horizontal ?? right;
    return [top, right, bottom, left].map((part) => String(part).trim()).join(' ');
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
  const rawMargin = firstDefinedValue(
    sources,
    ['margin', 'pdf-margin', 'pdf_margin'],
    context.defaultMargin,
  );
  const margin = marginValueToCss(rawMargin, context.defaultMargin);
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
  const headerTemplate = String(firstDefinedValue(
    sources,
    ['header-template', 'header_template', 'headerTemplate'],
    '',
  ));
  const footerTemplate = String(firstDefinedValue(
    sources,
    ['footer-template', 'footer_template', 'footerTemplate'],
    '',
  ));
  const headerFooterBoolean = parseBoolean(firstDefinedValue(
    sources,
    ['display-header-footer', 'display_header_footer', 'displayHeaderFooter'],
    headerTemplate || footerTemplate ? 'true' : '',
  ));
  const displayHeaderFooter = headerFooterBoolean === true || ((headerTemplate || footerTemplate) && headerFooterBoolean !== false);

  return {
    body: parsed.content,
    frontmatter,
    options: {
      extraCssPath,
      footerTemplate,
      headerTemplate,
      margin,
      paperSize,
      displayHeaderFooter,
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
  marginValueToCss,
};
