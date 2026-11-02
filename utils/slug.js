function slugify(input) {
  if (!input || typeof input !== 'string') return '';
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function unslugify(slug) {
  if (!slug || typeof slug !== 'string') return '';
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function extractIdFromSlug(param) {
  if (!param || typeof param !== 'string') return null;
  const match = param.match(/(?:^|-)([a-fA-F0-9]{24})$/);
  return match ? match[1].toLowerCase() : null;
}

function buildCategoryMatcher(slug) {
  if (!slug || typeof slug !== 'string') return null;
  const sanitized = slug.trim().toLowerCase();
  const escaped = sanitized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = '^' + escaped.replace(/-/g, '[-\\s]') + '$';
  return new RegExp(pattern, 'i');
}

module.exports = {
  slugify,
  unslugify,
  extractIdFromSlug,
  buildCategoryMatcher,
};
