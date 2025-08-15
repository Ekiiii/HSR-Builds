// router.js — mini hash router compatible GitHub Pages
// Usage: registerRoute(pattern, handler). Patterns support ":param" segments.

const routes = [];

export function registerRoute(pattern, handler) {
  const keys = [];
  const regex = new RegExp('^' + pattern
    .replace(/\//g, '\\/')
    .replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
  routes.push({ regex, keys, handler });
}

export function navigate(path) {
  if (!path.startsWith('#/')) path = '#'+ (path.startsWith('/') ? path : '/' + path);
  if (location.hash !== path) location.hash = path;
  else route();
}

function route() {
  const hash = location.hash || '#/';
  const path = hash.replace(/^#/, '');
  for (const r of routes) {
    const m = path.match(r.regex);
    if (m) {
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i+1])]));
      return r.handler(params);
    }
  }
  // 404 interne (si aucune route ne correspond)
  if (typeof window.renderNotFound === 'function') window.renderNotFound(path);
}

window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', route);
