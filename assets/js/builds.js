import { resolveDataPaths, loadJSON, normalizeCharacter, normalizeDict, rarityStars, DATA_FILES, makeSlug, resolveAsset } from './common.js';

const els = {
  grid: document.getElementById('cardsGrid'),
  tpl: document.getElementById('cardTpl'),
  search: document.getElementById('searchName'),
  sort: document.getElementById('sortBy'),
  elements: document.getElementById('filterElements'),
  paths: document.getElementById('filterPaths'),
  rarityWrap: document.getElementById('filterRarity'),
  reset: document.getElementById('resetFilters')
};

const EXCLUDE_IDS = new Set(['8001','8003','8005','8007']); // trailblazer male

let STATE = {
  ready:false,
  characters: [], elements: {}, paths: {}, avatars: {}, nicknames: {},
  filters: { name:'', element:null, path:null, rarity:null },
  sortBy: 'name'
};

init().catch(err=>{
  console.error(err);
  if(els.grid){ els.grid.innerHTML = `<div class="tile">Erreur : ${err.message}</div>`; }
});

async function init(){
  await resolveDataPaths();
  const [chars, avatars, elements, paths, nicks] = await Promise.all([
    loadJSON(DATA_FILES.characters),
    safeLoad(DATA_FILES.avatars, {}),
    loadJSON(DATA_FILES.elements),
    loadJSON(DATA_FILES.paths),
    safeLoad(DATA_FILES.nicknames, {})
  ]);

  STATE.avatars = normalizeIndex(avatars);
  STATE.elements = normalizeIndex(elements);
  STATE.paths = normalizeIndex(paths);
  STATE.nicknames = normalizeIndex(nicks);

  const rawList = Array.isArray(chars) ? chars : (chars.characters || chars.data || chars.list || Object.values(chars));
  STATE.characters = rawList.map(normalizeCharacter).map(enrichWithLookups).filter(c=>!EXCLUDE_IDS.has(String(c.id)));
  STATE.ready = true;

  buildChips(els.elements, STATE.elements, 'element');
  buildChips(els.paths, STATE.paths, 'path');

  // Listeners
  els.search.addEventListener('input', e => { STATE.filters.name = e.target.value.toLowerCase(); render(); });
  els.sort.addEventListener('change', e => { STATE.sortBy = e.target.value; render(); });
  els.elements.addEventListener('click', onChipClick('element'));
  els.paths.addEventListener('click', onChipClick('path'));
  els.rarityWrap.addEventListener('click', e=>{
    const btn = e.target.closest('.chip'); if(!btn) return;
    const was = btn.classList.contains('active'); clearGroup(els.rarityWrap);
    if(!was){ btn.classList.add('active'); STATE.filters.rarity = Number(btn.dataset.rarity); }
    else { STATE.filters.rarity = null; }
    render();
  });
  els.reset.addEventListener('click', resetFilters);

  render();
}

function safeLoad(path, fallback){
  return fetch(path, {cache:'no-store'}).then(r=> r.ok ? r.json() : fallback).catch(()=>fallback);
}

function normalizeIndex(data){
  if(Array.isArray(data)){
    const map = {};
    for(const it of data){
      const id = it.id ?? it.key ?? it.value ?? it.name ?? it.text;
      map[id] = it;
    }
    return map;
  }
  return data || {};
}

function stripArticle(label){
  if(!label) return label;
  let s = String(label).trim();
  s = s.replace(/^(L’|L'|La |Le |Les )/i, '');
  return s.trim();
}

function englishNameFor(c){
  // 1) from character field
  if(c.enName) return c.enName;
  // 2) from nickname.json (could store EN variants). try arrays/strings
  const nick = STATE.nicknames[String(c.id)] || STATE.nicknames[c.name] || STATE.nicknames[makeSlug(c.name)];
  if(Array.isArray(nick)){
    // try to detect known EN names
    for(const n of nick){
      if(/[a-z]/.test(n) && /[A-Z]/.test(n)) return n; // heuristic title case
    }
  } else if(typeof nick === 'string'){
    return nick;
  } else if(nick && typeof nick === 'object'){
    return nick.en || nick.english || nick.display_en || null;
  }
  // 3) hardcoded safe overrides
  const overrides = {
    '1310':'Firefly',
    '1307':'Black Swan'
  };
  return overrides[String(c.id)] || null;
}

function resolveNicknameDisplay(name, c){
  // Replace {NICKNAME} with Pionnière/Pionnier according to kept IDs (we keep female)
  const isFemaleTrail = ['8002','8004','8006','8008'].includes(String(c.id));
  const rep = isFemaleTrail ? 'Pionnière' : 'Pionnier';
  return String(name||'').replaceAll('{NICKNAME}', rep);
}

function enrichWithLookups(c){
  // avatar
  let portrait = c.portrait;
  const candidates = [c.id, String(c.id), c.name, makeSlug(c.name)];
  for(const k of candidates){
    const av = STATE.avatars[k]; if(av){
      portrait = portrait || av.portrait || av.icon || av.url || av.image || av.iconPath;
      break;
    }
  }
  portrait = resolveAsset(portrait) || resolveAsset(`${c.id}.png`);

  // display name with nickname replacement
  let display = resolveNicknameDisplay(c.name, c);

  // english name (for search & slug only)
  const en = englishNameFor(c);
  const slugBase = (en || display);
  const slug = makeSlug(slugBase);

  return { ...c, portrait, name: display, enName: en, slug };
}

function buildChips(container, dict, kind){
  container.innerHTML = '';
  for(const [id, item] of Object.entries(dict)){
    const nameRaw = item.name ?? item.text ?? item.Title ?? id;
    const name = (kind==='path') ? stripArticle(nameRaw) : nameRaw;
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.dataset[kind] = id;
    btn.textContent = name;
    container.appendChild(btn);
  }
}

function onChipClick(kind){
  return (e)=>{
    const btn = e.target.closest('.chip'); if(!btn) return;
    const was = btn.classList.contains('active'); clearGroup(btn.parentElement);
    if(!was){ btn.classList.add('active'); STATE.filters[kind] = btn.dataset[kind]; }
    else { STATE.filters[kind] = null; }
    render();
  };
}

function clearGroup(scope){
  scope.querySelectorAll('.chip.active').forEach(b => b.classList.remove('active'));
}

function resetFilters(){
  STATE.filters = { name:'', element:null, path:null, rarity:null };
  document.querySelectorAll('.chip.active').forEach(b=>b.classList.remove('active'));
  els.search.value='';
  render();
}

function render(){
  if(!STATE.ready){ els.grid.innerHTML=''; return; }
  let list = STATE.characters.filter(c=>c.name && c.name!=='Inconnu');

  // text search (FR + EN)
  if(STATE.filters.name){
    const q = STATE.filters.name;
    list = list.filter(c => (c.name||'').toLowerCase().includes(q) || (c.enName||'').toLowerCase().includes(q));
  }
  if(STATE.filters.element){
    list = list.filter(c => String(c.elementId) === String(STATE.filters.element));
  }
  if(STATE.filters.path){
    list = list.filter(c => String(c.pathId) === String(STATE.filters.path));
  }
  if(STATE.filters.rarity){
    list = list.filter(c => Number(c.rarity) === Number(STATE.filters.rarity));
  }

  list.sort((a,b)=>{
    switch(STATE.sortBy){
      case 'rarity': return (b.rarity||0) - (a.rarity||0) || (a.name||'').localeCompare(b.name||'');
      case 'element': return String(a.elementId).localeCompare(String(b.elementId)) || (a.name||'').localeCompare(b.name||'');
      case 'path': return String(a.pathId).localeCompare(String(b.pathId)) || (a.name||'').localeCompare(b.name||'');
      case 'name':
      default: return (a.name||'').localeCompare(b.name||'');
    }
  });

  els.grid.innerHTML = '';
  const frag = document.createDocumentFragment();
  for(const c of list){
    const node = els.tpl.content.firstElementChild.cloneNode(true);
    node.href = `/personnages/${c.slug}/`;

    const portrait = node.querySelector('.portrait');
    if(c.portrait){ portrait.style.backgroundImage = `url(${c.portrait})`; }

    node.querySelector('.name').textContent = c.name;
    node.querySelector('.rarity').textContent = rarityStars(c.rarity);

    const elName = STATE.elements[c.elementId]?.name ?? STATE.elements[c.elementId]?.text ?? c.elementId ?? 'Élément';
    const pathName = stripArticle(STATE.paths[c.pathId]?.name ?? STATE.paths[c.pathId]?.text ?? c.pathId ?? 'Voie');
    node.querySelector('.tag.element').textContent = elName;
    node.querySelector('.tag.path').textContent = pathName;

    frag.appendChild(node);
  }
  els.grid.appendChild(frag);
}
