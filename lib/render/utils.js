const fs = require('fs');
const path = require('path');

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

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function slugify(value) {
  return String(value).trim().toLowerCase().replace(/[`~!@#$%^&*()+=<>?,./:;"'\\|\[\]{}]/g, '').replace(/\s+/g, '-');
}

function exists(targetPath) {
  try {
    return fs.existsSync(targetPath);
  } catch {
    return false;
  }
}

function resolveAbsolutePath(targetPath, cwd) {
  return path.isAbsolute(targetPath) ? targetPath : path.resolve(cwd, targetPath);
}

module.exports = {
  escapeHtml,
  exists,
  parseBoolean,
  resolveAbsolutePath,
  slugify,
  stripWrappingQuotes,
};
