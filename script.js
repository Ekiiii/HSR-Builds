
// ===== Config & fetch =====
const BASE = (typeof window !== "undefined" && window.BASE_URL != null ? window.BASE_URL : "").replace(/\/+$/,"");

async function fetchCharacters(){
  const url = `${BASE}/data/characters.json`;
  const res = await fetch(url);
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  const raw = await res.json();
  // Map to UI model; strip french articles from voie for filtering labels
  const stripArticle = (s) => s.replace(/^L['’]/,'').replace(/^La\s/,'').replace(/^Le\s/,'').trim();
  return raw.map(x=>({
    id: x.slug,
    slug: x.slug,
    name: x.name,
    element: x.element,
    // UI "path" without articles to match your <select> options
    path: stripArticle(x.voie),
    voieRaw: x.voie,
    rarity: x.rarity,
    href: `personnages/${x.slug}`,
    img: x.hh_img
  }));
}

// ===== DOM =====
const $grid = document.getElementById('grid');
const $q = document.getElementById('q');
const $path = document.getElementById('path');
const $element = document.getElementById('element');
const $rarity = document.getElementById('rarity');
const $sort = document.getElementById('sort');
const $count = document.getElementById('count');
const $activeFilters = document.getElementById('activeFilters');
const $reset = document.getElementById('reset');

// ===== Helpers =====
const FALLBACK_IMG = 'https://starrail.honeyhunterworld.com/img/character/march-7th-character_icon.webp';

function renderCard(ch){
  const a = document.createElement('a');
  a.href = ch.href || '#';
  a.className = 'card char';
  a.setAttribute('data-element', ch.element);
  a.setAttribute('role', 'gridcell');
  a.setAttribute('tabindex', '0');

  a.innerHTML = `
    <div class="thumb">
      <img loading="lazy" decoding="async" width="128" height="128" src="${ch.img}" alt="${ch.name}">
    </div>
    <div class="name">
      ${ch.name} ${ch.rarity === 5 ? '<span class="rar-5">5★</span>' : '<span class="rar-4">4★</span>'}
    </div>
    <div class="tags" aria-hidden="true">
      <span class="t">${ch.path}</span>
      <span class="t">${ch.element}</span>
    </div>
  `;

  const img = a.querySelector('img');
  img.addEventListener('error', () => { img.src = FALLBACK_IMG; });

  return a;
}

function renderList(list){
  $grid.innerHTML = '';
  if(!list.length){
    const empty = document.createElement('div');
    empty.className = 'no-result';
    empty.textContent = 'Aucun résultat. Modifiez vos filtres.';
    $grid.appendChild(empty);
    $count.textContent = '0 résultat';
    $activeFilters.hidden = true;
    return;
  }
  const frag = document.createDocumentFragment();
  list.forEach(ch => frag.appendChild(renderCard(ch)));
  $grid.appendChild(frag);
  $count.textContent = `${list.length} ${list.length>1?'résultats':'résultat'}`;
}

function getFilters(){
  return {
    q: ($q.value || '').trim().toLowerCase(),
    path: $path.value,
    element: $element.value,
    rarity: $rarity.value,
    sort: $sort.value
  };
}

function applyFiltersSort(list){
  const f = getFilters();
  let out = list.filter(ch=>{
    if(f.q && !ch.name.toLowerCase().includes(f.q)) return false;
    if(f.path && ch.path !== f.path) return false;
    if(f.element && ch.element !== f.element) return false;
    if(f.rarity && String(ch.rarity) !== f.rarity) return false;
    return true;
  });

  switch(f.sort){
    case 'name-asc': out.sort((a,b)=>a.name.localeCompare(b.name,'fr')); break;
    case 'name-desc': out.sort((a,b)=>b.name.localeCompare(a.name,'fr')); break;
    case 'rarity-desc': out.sort((a,b)=>b.rarity-a.rarity || a.name.localeCompare(b.name,'fr')); break;
    case 'rarity-asc': out.sort((a,b)=>a.rarity-b.rarity || a.name.localeCompare(b.name,'fr')); break;
  }

  // Chips récap
  const chips = [];
  if(f.path) chips.push(`Voie: ${f.path}`);
  if(f.element) chips.push(`Élément: ${f.element}`);
  if(f.rarity) chips.push(`Rareté: ${f.rarity}★`);
  if(f.q) chips.push(`Recherche: “${$q.value.trim()}”`);
  if(chips.length){ 
  $activeFilters.hidden = false; 
  $activeFilters.textContent = chips.join(' · '); 
} else { 
  $activeFilters.hidden = true; 
  $activeFilters.textContent = ''; // 🔹 vider le tag visuel
}

  renderList(out);
  syncURL();
}

function syncURL(){
  const f = getFilters();
  const p = new URLSearchParams();
  if(f.q) p.set('q', f.q);
  if(f.path) p.set('path', f.path);
  if(f.element) p.set('element', f.element);
  if(f.rarity) p.set('rarity', f.rarity);
  if(f.sort && f.sort !== 'name-asc') p.set('sort', f.sort);
  const q = p.toString();
  history.replaceState(null, '', q ? `?${q}` : location.pathname);
}

(function initFromURL(){
  const p = new URLSearchParams(location.search);
  if(p.has('q')) $q.value = p.get('q');
  if(p.has('path')) $path.value = p.get('path');
  if(p.has('element')) $element.value = p.get('element');
  if(p.has('rarity')) $rarity.value = p.get('rarity');
  if(p.has('sort')) $sort.value = p.get('sort');
})();

(async function init(){
  try {
    const data = await fetchCharacters();
    // Events
    let t; // debounce
    $q.addEventListener('input', ()=>{ clearTimeout(t); t = setTimeout(()=>applyFiltersSort(data), 120); });
    [$path,$element,$rarity,$sort].forEach(el=> el.addEventListener('change', ()=>applyFiltersSort(data)));
    $reset.addEventListener('click', ()=>{
	$q.value=''; 
	$path.value=''; 
	$element.value=''; 
	$rarity.value=''; 
	$sort.value='name-asc';
	$activeFilters.textContent = ''; // 🔹 force reset visuel
	$activeFilters.hidden = true;
	applyFiltersSort();
	});
    // First render
    applyFiltersSort(data);
  } catch(e){
    console.error("Erreur de chargement des personnages:", e);
    $grid.innerHTML = '<div class="no-result">Impossible de charger les personnages (JSON). Lance un petit serveur local pour éviter CORS (ex. Live Server).</div>';
  }
})();
