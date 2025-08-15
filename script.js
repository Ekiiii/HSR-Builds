// script.js — Index FR + images + filtres + remplacement {NICKNAME}
// Lit data/index_min/fr/{characters, nickname, avatars, elements, paths}.json
// Garde la structure de ton index.html + styles.css existants.

const BASE = 'data/index_min/fr';
const PATHS = {
  characters: `${BASE}/characters.json`,
  nickname:   `${BASE}/nickname.json`,
  avatars:    `${BASE}/avatars.json`,
  elements:   `${BASE}/elements.json`,
  paths:      `${BASE}/paths.json`,
  iconAvatar: (id) => `${BASE}/icon/avatar/${id}.png`
};

// Utils
const by = (sel)=>document.querySelector(sel);
const $ = (tag, attrs={}, ...kids)=>{
  const el = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs||{})) {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) el.setAttribute(k, String(v));
  }
  for (const k of kids.flat()) el.append(k?.nodeType ? k : document.createTextNode(k ?? ''));
  return el;
};
const normalize = (s)=> (s??'').toString().normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();

// Fetch with in-memory cache
const mem = new Map();
async function fetchJSON(url) {
  if (mem.has(url)) return mem.get(url);
  const res = await fetch(url, { cache:'no-store' });
  if (!res.ok) throw new Error(`Fetch raté: ${url}`);
  const json = await res.json();
  mem.set(url, json);
  return json;
}

// Field pickers (schema tolerant)
function pickId(c)        { return c.id ?? c.avatarId ?? c.AvatarId ?? c.baseId ?? c.BaseID ?? c.characterId ?? c.CharacterID; }
function pickRarity(c)    { return c.rarity ?? c.Rarity ?? c.star ?? c.Star ?? c.Quality ?? c.quality; }
function pickElement(c)   { return c.element ?? c.Element ?? c.damageType ?? c.DamageType ?? c.ElementType; }
function pickPath(c)      { return c.path ?? c.Path ?? c.baseType ?? c.BaseType ?? c.class ?? c.Class ?? c.role ?? c.Role; }

// Name resolver: replaces {NICKNAME} using nickname.json; fallback via avatars.json names
function resolveNameFR(c, nicknameMap, avatarsMap) {
  const raw = c.name ?? c.Name ?? c.avatarName ?? c.AvatarName ?? c.displayName ?? c.DisplayName ?? '';
  if (raw && !/\{NICKNAME\}/.test(raw)) return String(raw);
  const id = pickId(c);
  const nick = (id != null) ? nicknameMap.get(String(id)) : null;
  if (nick) return raw ? String(raw).replace('{NICKNAME}', nick) : nick;
  const av = (id != null) ? avatarsMap.get(String(id)) : null;
  if (av?.name) return String(av.name);
  if (raw) return String(raw).replace('{NICKNAME}', '').trim() || `Inconnu ${id??''}`.trim();
  return `Inconnu ${id??''}`.trim();
}

// Icon resolver
function resolveIcon(c, avatarsMap) {
  const direct = c.icon ?? c.Icon ?? c.image ?? c.Image ?? c.avatarIcon ?? c.AvatarIcon;
  if (typeof direct === 'string') return direct;
  const id = pickId(c);
  const av = (id != null) ? avatarsMap.get(String(id)) : null;
  if (av?.icon) return av.icon;
  if (id != null) return PATHS.iconAvatar(id);
  return 'assets/hsr_avatar_placeholder.svg';
}

// Build translator (EN->FR) from elements.json and paths.json + common aliases
function buildTranslator(elementsJson, pathsJson) {
  const map = new Map();
  const add = (k,v)=>{ if(k&&v) map.set(normalize(k), v); };

  // elements
  if (Array.isArray(elementsJson)) {
    for (const e of elementsJson) add(e.name??e.Name, e.text??e.Text??e.name??e.Name);
  } else if (elementsJson && typeof elementsJson === 'object') {
    for (const [k,v] of Object.entries(elementsJson)) add(k, v?.text??v?.name??v);
  }
  // paths
  if (Array.isArray(pathsJson)) {
    for (const p of pathsJson) add(p.name??p.Name, p.text??p.Text??p.name??p.Name);
  } else if (pathsJson && typeof pathsJson === 'object') {
    for (const [k,v] of Object.entries(pathsJson)) add(k, v?.text??v?.name??v);
  }

  const aliases = {
    // Elements
    physical: 'Physique', fire: 'Feu', ice: 'Glace', thunder: 'Foudre', wind: 'Vent', quantum: 'Quantique', imaginary: 'Imaginaire',
    // Paths
    hunt: 'Chasse', harmony: 'Harmonie', preservation: 'Préservation', nihility: 'Nihilité', destruction: 'Destruction', erudition: 'Érudition', abundance: 'Abondance', remembrance: 'Souvenir', memory: 'Souvenir',
    // Some dumps use role/class terms
    warrior: 'Destruction', shaman: 'Harmonie', knight: 'Préservation', priest: 'Abondance', rogue: 'Nihilité', mage: 'Érudition'
  };
  for (const [k,v] of Object.entries(aliases)) add(k, v);

  return (str)=> map.get(normalize(str)) ?? str;
}

// Target href: Firefly opens its HTML page, others stay as '#' for now
function buildHrefFor(nameFR) {
  const slug = String(nameFR).normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-+|-+$/g,'').toLowerCase();
  if (/^firefly$/.test(slug)) return 'personnages/Firefly/index.html';
  return '#';
}

async function main() {
  const grid = by('#grid');
  const q = by('#q'), selPath = by('#path'), selEl = by('#element'), selR = by('#rarity'), selSort = by('#sort'), resetBtn = by('#reset'), count = by('#count'), active = by('#activeFilters');

  const [characters, nicknameRaw, avatarsRaw, elementsJson, pathsJson] = await Promise.all([
    fetchJSON(PATHS.characters),
    fetchJSON(PATHS.nickname).catch(()=>null),
    fetchJSON(PATHS.avatars).catch(()=>null),
    fetchJSON(PATHS.elements).catch(()=>({})),
    fetchJSON(PATHS.paths).catch(()=>({})),
  ]);

  // nickname.json -> Map<id, nameFR>
  const nicknameMap = new Map();
  if (nicknameRaw) {
    if (Array.isArray(nicknameRaw)) {
      for (const x of nicknameRaw) {
        const id = x.id ?? x.characterId ?? x.avatarId ?? x.AvatarId ?? x.CharacterID;
        const name = x.name ?? x.text ?? x.value ?? x.Nickname ?? x.Nom;
        if (id != null && name) nicknameMap.set(String(id), name);
      }
    } else {
      for (const [k,v] of Object.entries(nicknameRaw)) {
        const name = v?.name ?? v?.text ?? v ?? null;
        if (name) nicknameMap.set(String(k), name);
      }
    }
  }

  // avatars.json -> Map<id, {name?, icon?}>
  const avatarsMap = new Map();
  if (avatarsRaw) {
    if (Array.isArray(avatarsRaw)) {
      for (const a of avatarsRaw) {
        const id = a.id ?? a.avatarId ?? a.AvatarId ?? a.CharacterID ?? a.baseId;
        const name = a.name ?? a.text ?? a.Nom;
        const icon = a.icon ?? a.Icon ?? a.image ?? a.Image;
        if (id != null) avatarsMap.set(String(id), { name, icon });
      }
    } else {
      for (const [k,v] of Object.entries(avatarsRaw)) {
        const name = v?.name ?? v?.text;
        const icon = v?.icon ?? v?.image;
        avatarsMap.set(String(k), { name, icon });
      }
    }
  }

  const tr = buildTranslator(elementsJson, pathsJson);

  // Characters list normalization
  const arrayLike = Array.isArray(characters)
    ? characters
    : (characters.characters ?? characters.personnages ?? Object.values(characters));

  const items = arrayLike.map(c => {
    const id = pickId(c);
    const nameFR = resolveNameFR(c, nicknameMap, avatarsMap);
    const rarity = Number(pickRarity(c)) || 0;
    const el = pickElement(c);
    const path = pickPath(c);
    const elementFR = el ? tr(String(el)) : '';
    const pathFR    = path ? tr(String(path)) : '';
    const icon = resolveIcon(c, avatarsMap);
    return {
      id: id ?? nameFR,
      name: nameFR,
      rarity,
      element: elementFR,
      path: pathFR,
      icon,
      href: buildHrefFor(nameFR),
      _norm: {
        name: normalize(nameFR),
        el: normalize(elementFR),
        path: normalize(pathFR),
        rarity: String(rarity)
      }
    };
  });

  // Renderer (garde ta structure visuelle de carte)
  function render(rows) {
    grid.innerHTML = '';
    for (const it of rows) {
      const card =
        $('a', { class: 'card', href: it.href, role:'button', 'aria-label': `Ouvrir ${it.name}` },
          $('img', { class:'avatar', src: it.icon, alt: it.name, loading:'lazy',
                     onerror:(e)=>{ e.target.src = 'assets/hsr_avatar_placeholder.svg'; }}),
          $('div', { class:'card-info' },
            $('span', { class:'name' }, it.name),
            $('span', { class:'meta' }, [
              it.rarity ? `${it.rarity}★` : '—',
              it.element ? ` • ${it.element}` : '',
              it.path ? ` • ${it.path}` : ''
            ].join(''))
          )
        );
      grid.append(card);
    }
    count.textContent = `${rows.length} ${rows.length > 1 ? 'résultats' : 'résultat'}`;
  }

  function apply() {
    const qv = normalize(q.value);
    const pv = normalize(selPath.value);
    const ev = normalize(selEl.value);
    const rv = String(selR.value || '');

    let rows = items.filter(it =>
      (!qv || it._norm.name.includes(qv)) &&
      (!pv || it._norm.path === pv) &&
      (!ev || it._norm.el === ev) &&
      (!rv || it._norm.rarity === rv)
    );

    switch (selSort.value) {
      case 'name-desc': rows.sort((a,b)=>b.name.localeCompare(a.name)); break;
      case 'rarity-desc': rows.sort((a,b)=>(b.rarity-a.rarity)||a.name.localeCompare(b.name)); break;
      case 'rarity-asc': rows.sort((a,b)=>(a.rarity-b.rarity)||a.name.localeCompare(b.name)); break;
      default: rows.sort((a,b)=>a.name.localeCompare(b.name));
    }

    const chips = [];
    if (selPath.value) chips.push(`Voie: ${selPath.value}`);
    if (selEl.value)   chips.push(`Élément: ${selEl.value}`);
    if (selR.value)    chips.push(`Rareté: ${selR.value}★`);
    const pill = by('#activeFilters');
    if (chips.length) { pill.hidden = false; pill.textContent = chips.join(' • '); }
    else { pill.hidden = true; pill.textContent = ''; }

    render(rows);
  }

  // Events
  q.addEventListener('input', apply);
  [selPath, selEl, selR, selSort].forEach(sel => sel.addEventListener('change', apply));
  by('#reset').addEventListener('click', ()=>{
    q.value=''; selPath.value=''; selEl.value=''; selR.value=''; selSort.value='name-asc'; apply();
  });

  // First render
  apply();
}

main().catch(err=>{
  console.error(err);
  const grid = document.querySelector('#grid');
  if (grid) grid.innerHTML = `<p style="opacity:.8">Impossible de charger les personnages. Vérifie les fichiers dans <code>${BASE}</code>.</p>`;
});
