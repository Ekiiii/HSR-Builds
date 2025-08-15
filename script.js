// script.js — data loading + views + search
import { registerRoute, navigate } from './router.js';

const APP = {
  dataUrl: './data/characters.json', // ajuste si besoin
  cacheKey: 'hsr-builds:data:v1',
};

async function getData() {
  const cached = localStorage.getItem(APP.cacheKey);
  if (cached) {
    try { return JSON.parse(cached); } catch (_) {}
  }
  const res = await fetch(APP.dataUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error('Impossible de charger les données');
  const json = await res.json();
  localStorage.setItem(APP.cacheKey, JSON.stringify(json));
  return json;
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) node.setAttribute(k, String(v));
  }
  for (const c of children.flat()) {
    if (c == null) continue;
    node.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

function renderApp(node) {
  const mount = document.getElementById('app');
  mount.innerHTML = '';
  mount.appendChild(node);
  // Focus pour l’accessibilité
  mount.focus({ preventScroll: true });
}

function normalize(str) {
  return (str || '').toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function cardFromCharacter(c) {
  const name = c.name || c.nom || c.slug || 'Inconnu';
  const slug = (c.slug || name).toString().toLowerCase().replace(/\s+/g, '-');
  const img = c.image || c.img || `assets/${slug}.webp`;
  return el('article', { class: 'card', role: 'article' },
    el('button', { class: 'card-button', onClick: () => navigate(`#/personnages/${encodeURIComponent(slug)}`), 'aria-label': `Voir la fiche de ${name}` },
      el('img', { src: img, alt: name, loading: 'lazy' }),
      el('h3', {}, name),
      c.path ? el('p', { class: 'muted' }, String(c.path)) : null,
    ),
  );
}

function tableFromObject(obj) {
  const wrapper = el('div', { class: 'kv' });
  for (const [k, v] of Object.entries(obj)) {
    const key = el('div', { class: 'kv-key' }, k);
    const val = el('div', { class: 'kv-val' }, typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v));
    wrapper.append(key, val);
  }
  return wrapper;
}

// Home / Personnages listing
registerRoute('/', async () => {
  const data = await getData();
  const list = Array.isArray(data) ? data : (data.characters || data.personnages || []);

  let filtered = list;

  const search = el('input', {
    id: 'search', type: 'search', placeholder: 'Rechercher un personnage…',
    'aria-label': 'Rechercher un personnage',
    onInput: (e) => applySearch(e.target.value)
  });

  function applySearch(q) {
    const qn = normalize(q);
    filtered = list.filter(c => normalize(c.name || c.nom || c.slug).includes(qn));
    renderGrid();
  }

  const grid = el('section', { class: 'grid' });

  function renderGrid() {
    grid.innerHTML = '';
    if (!filtered.length) grid.append(el('p', { class: 'muted' }, 'Aucun résultat.'));
    for (const c of filtered) grid.append(cardFromCharacter(c));
  }

  renderGrid();

  renderApp(el('section', {},
    el('h2', {}, 'Personnages'),
    el('div', { class: 'toolbar' }, search),
    grid,
  ));
});

// Character detail
registerRoute('/personnages/:slug', async ({ slug }) => {
  const data = await getData();
  const list = Array.isArray(data) ? data : (data.characters || data.personnages || []);
  const c = list.find(x => (x.slug || normalize(x.name || x.nom)).toLowerCase() === slug.toLowerCase());

  if (!c) return window.renderNotFound?.(`/personnages/${slug}`);

  const header = el('div', { class: 'detail-header' },
    el('img', { src: c.image || c.img || `../assets/${slug}.webp`, alt: c.name || c.nom || slug, loading: 'lazy' }),
    el('div', { class: 'detail-meta' },
      el('h2', {}, c.name || c.nom || slug),
      c.path ? el('p', { class: 'muted' }, String(c.path)) : null,
    )
  );

  const build = el('section', {},
    el('h3', {}, 'Build recommandé'),
    tableFromObject(c.build || c),
  );

  const back = el('p', {}, el('a', { href: '#/' }, '← Retour'));

  renderApp(el('article', { class: 'detail' }, header, build, back));
});

// 404 fallback renderer used by router
window.renderNotFound = (path) => {
  renderApp(el('section', {},
    el('h2', {}, 'Page introuvable'),
    el('p', {}, `Aucune page pour « ${path} ». `, el('a', { href: '#/' }, 'Retour à l'accueil')),
  ))
};
