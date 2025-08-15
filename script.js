// script.js — affichage dynamique + filtres + détail
import { registerRoute, navigate } from './router.js';

const PATHS = {
  characters: 'data/index_min/fr/characters.json',
  characterDir: (name) => `personnages/${name}`,
};

// Helpers
const $ = (s) => document.querySelector(s);
const norm = (s='') => s.toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const slugify = (s='') => s.toString().trim().toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-_]/g,'');
const PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="140" fill="#9ca3af" font-family="system-ui,Segoe UI,Arial,sans-serif">?</text></svg>";

async function fetchJSON(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
  return res.json();
}
async function fetchOptionalJSON(url) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// Unifier le schéma du JSON de personnages (quelle que soit la forme)
function normalizeCharacters(data) {
  let arr = [];
  if (Array.isArray(data)) arr = data;
  else if (data && Array.isArray(data.characters)) arr = data.characters;
  else if (data && Array.isArray(data.personnages)) arr = data.personnages;
  else if (data && typeof data === 'object') arr = Object.values(data);
  return arr.map((raw) => ({ 
    raw,
    name: raw.name || raw.nom || raw.id || raw.slug || 'Inconnu',
    slug: raw.slug || slugify(raw.name || raw.nom || raw.id || ''),
    element: raw.element || raw.élément || raw.elem || '',
    path: raw.path || raw.voie || raw.route || '',
    rarity: Number(raw.rarity || raw.rarete || raw['rareté'] || raw.stars || 0),
    image: raw.image || raw.img || null,
  }));
}

// Global state
let ALL = [];
let VIEW = [];

// Render card (garde tes classes .card, .avatar, .name, .meta)
function makeCard(c) {
  const a = document.createElement('a');
  a.className = 'card';
  a.href = `#/personnages/${encodeURIComponent(c.name)}`;
  a.setAttribute('role','gridcell');
  a.dataset.name = c.name;
  a.dataset.path = c.path;
  a.dataset.element = c.element;
  a.dataset.rarity = String(c.rarity || '');

  const img = document.createElement('img');
  img.className = 'avatar';
  img.alt = c.name;
  img.loading = 'lazy';

  const imgCandidates = [
    c.image,
    `personnages/${c.name}/${c.name}.webp`,
    `personnages/${c.name}/${c.name}.png`,
    `assets/${c.slug}.webp`,
    `assets/${c.slug}.png`,
  ].filter(Boolean);

  let setOnce = false;
  (async () => {
    for (const u of imgCandidates) {
      try {
        const r = await fetch(u, { method: 'HEAD' });
        if (r.ok) { img.src = u; setOnce = true; break; }
      } catch (e) { /* ignore */ }
    }
    if (!setOnce) img.src = PLACEHOLDER;
  })();

  const info = document.createElement('div');
  info.className = 'card-info';
  const nameEl = document.createElement('span');
  nameEl.className = 'name';
  nameEl.textContent = c.name;
  const metaEl = document.createElement('span');
  metaEl.className = 'meta';
  const badge = [ c.rarity ? `${c.rarity}★` : null, c.element || null, c.path || null ].filter(Boolean).join(' • ');
  metaEl.textContent = badge;

  info.append(nameEl, metaEl);
  a.append(img, info);

  a.addEventListener('click', (e) => { e.preventDefault(); navigate(`#/personnages/${encodeURIComponent(c.name)}`); });
  return a;
}

function renderGrid() {
  const grid = $('#grid');
  grid.innerHTML = '';
  if (!VIEW.length) { grid.innerHTML = '<p>Aucun résultat.</p>'; return; }
  for (const c of VIEW) grid.appendChild(makeCard(c));
  $('#count').textContent = VIEW.length + (VIEW.length > 1 ? ' résultats' : ' résultat');
}

function applyFilters() {
  const q = norm($('#q').value);
  const pathF = $('#path').value;
  const elF = $('#element').value;
  const rarF = $('#rarity').value;
  const sort = $('#sort').value;

  VIEW = ALL.filter(c => {
    const passQ = !q || norm(c.name).includes(q);
    const passPath = !pathF || norm(c.path) === norm(pathF);
    const passEl = !elF || norm(c.element) === norm(elF);
    const passRar = !rarF || String(c.rarity||'').startsWith(String(rarF));
    return passQ && passPath && passEl && passRar;
  });

  const cmp = {
    'name-asc': (a,b) => a.name.localeCompare(b.name),
    'name-desc': (a,b) => b.name.localeCompare(a.name),
    'rarity-desc': (a,b) => (Number(b.rarity)-Number(a.rarity)) || a.name.localeCompare(b.name),
    'rarity-asc': (a,b) => (Number(a.rarity)-Number(b.rarity)) || a.name.localeCompare(b.name),
  }[sort] || ((a,b)=>0);
  VIEW.sort(cmp);

  const active = [];
  if (q) active.push(`« ${$('#q').value} »`);
  if (pathF) active.push(pathF);
  if (elF) active.push(elF);
  if (rarF) active.push(`${rarF}★`);
  const pill = $('#activeFilters');
  if (active.length) { pill.hidden = false; pill.textContent = 'Filtres: ' + active.join(' · '); }
  else pill.hidden = true;

  renderGrid();
}

function wireFilters() {
  $('#q').addEventListener('input', applyFilters);
  $('#path').addEventListener('change', applyFilters);
  $('#element').addEventListener('change', applyFilters);
  $('#rarity').addEventListener('change', applyFilters);
  $('#sort').addEventListener('change', applyFilters);
  $('#reset').addEventListener('click', () => {
    $('#q').value = ''; $('#path').value = ''; $('#element').value = '';
    $('#rarity').value = ''; $('#sort').value = 'name-asc'; applyFilters();
  });
}

// Views
function showList() {
  $('#hero').hidden = false;
  $('#filters').hidden = false;
  $('#listView').hidden = false;
  $('#detailView').hidden = true;
  $('#detailView').innerHTML = '';
}

async function loadDetail(name) {
  const container = $('#detailView');
  container.innerHTML = '';
  $('#hero').hidden = true;
  $('#filters').hidden = true;
  $('#listView').hidden = true;
  container.hidden = false;

  const dir = PATHS.characterDir(name);
  const [builds, skills, eidolons, traces, stats, notes] = await Promise.all([
    fetchOptionalJSON(`${dir}/builds.json`),
    fetchOptionalJSON(`${dir}/skills.json`),
    fetchOptionalJSON(`${dir}/eidolons.json`),
    fetchOptionalJSON(`${dir}/traces.json`),
    fetchOptionalJSON(`${dir}/stats.json`),
    fetchOptionalJSON(`${dir}/notes.json`),
  ]);

  const c = ALL.find(x => x.name === name) || {
    name, rarity: '', element: '', path: ''
  };

  const head = document.createElement('div');
  head.className = 'character-header';
  head.innerHTML = `<h2>${name}</h2><p class="meta">${[c.rarity?`${c.rarity}★`:null,c.element,c.path].filter(Boolean).join(' • ')}</p>`;

  const sec = (title, data) => {
    const s = document.createElement('section');
    s.className = 'panel';
    const h = document.createElement('h3'); h.textContent = title; s.appendChild(h);
    if (data) s.appendChild(Object.prototype.toString.call(data)==='[object Object]'||Array.isArray(data) ?
      Object.assign(document.createElement('pre'),{textContent: JSON.stringify(data,null,2)}) :
      Object.assign(document.createElement('p'),{textContent: String(data)}));
    else s.appendChild(Object.assign(document.createElement('p'),{className:'meta',textContent:`Aucune donnée`}));
    return s;
  };

  const back = document.createElement('p');
  const a = document.createElement('a'); a.href = '#/'; a.textContent = '← Retour aux personnages';
  back.appendChild(a);

  container.append(head,
    sec('Builds', builds),
    sec('Compétences', skills),
    sec('Eidolons', eidolons),
    sec('Traces', traces),
    sec('Stats', stats),
    sec('Notes', notes),
    back);
}

// Routes
registerRoute('/', async () => {
  if (!ALL.length) {
    const data = await fetchJSON(PATHS.characters);
    ALL = normalizeCharacters(data);
  }
  showList();
  wireFilters();
  applyFilters();
});

registerRoute('/personnages/:name', async ({ name }) => {
  if (!ALL.length) {
    try { ALL = normalizeCharacters(await fetchJSON(PATHS.characters)); } catch {}
  }
  await loadDetail(name);
});
