
/* ============================================================
   HSR — Firefly (Luciole) — script.js (local images robust)
   Data root: ../../data/index_min/fr/
   ============================================================ */

const ROOT = '../../';
const INDEX_FR = ROOT + 'data/index_min/fr/';
const FILES = {
  characters: INDEX_FR + 'characters.json',
  skills: INDEX_FR + 'character_skills.json',
  ranks: INDEX_FR + 'character_ranks.json',
  trees: INDEX_FR + 'character_skill_trees.json',
  nick: INDEX_FR + 'nickname.json',
  properties: INDEX_FR + 'properties.json',
  cones: INDEX_FR + 'light_cones.json',
  lc_ranks: INDEX_FR + 'light_cone_ranks.json',
  relics: INDEX_FR + 'relic_sets.json',
  paths: INDEX_FR + 'paths.json',
  override: (cid)=> INDEX_FR + `overrides/characters/${cid}.json`
};

// ---------- utils ----------
const h = (html)=>{ const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstElementChild; };
async function loadJSON(url){ const res=await fetch(url,{cache:'no-store'}); if(!res.ok) throw new Error(`HTTP ${res.status} ${url}`); return res.json(); }
function asMap(objOrArr, key='id'){ if(!objOrArr) return {}; if(Array.isArray(objOrArr)){ const m={}; objOrArr.forEach(o=>{ if(o && o[key]!=null) m[String(o[key])] = o; }); return m; } return objOrArr; }

function escapeHtml(s){
  const map = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#039;'};
  return String(s||'').replace(/[&<>"']/g, function(m){ return map[m]; });
}

function normStr(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function words(s){ return normStr(s).split(/[^a-z0-9]+/).filter(Boolean); }
function ensureGrid(id, sectionId, classes){ let el=document.getElementById(id); if(!el){ const sec=document.getElementById(sectionId); if(sec){ el=document.createElement('div'); el.id=id; if(classes) el.className=classes; sec.appendChild(el);} } return el; }
function uniq(arr){ return [...new Set(arr)]; }

// ---------- image helpers (force local + multi-fallback) ----------
function toLocalPath(p){
  if(!p) return null;
  let s = String(p).trim();
  s = s.replace(/^https?:\/\/[^/]+\/+/i, '');      // drop domain if any
  s = s.replace(/^(\.\/)+/, '');                   // strip leading ./
  if(!/^(icon|image|data)\//i.test(s)){            // plain filename -> leave as is, will be combined later
    return INDEX_FR + s;
  }
  return INDEX_FR + s;
}
function imgWithFallback(sources, alt, className){
  const list = sources.filter(Boolean).map(toLocalPath);
  const first = list.shift() || '';
  const data = list.length ? ` data-fallback='${JSON.stringify(list)}'` : '';
  const cls = className ? ` class="${className}"` : '';
  const a = escapeHtml(alt||'');
  return first ? `<img${cls} src="${first}" alt="${a}"${data}>` : '';
}
function installImgFallbackHandler(){
  if(installImgFallbackHandler._installed) return;
  document.addEventListener('error', (ev)=>{
    const el = ev.target;
    if(el && el.tagName === 'IMG' && el.dataset.fallback){
      try{
        const arr = JSON.parse(el.dataset.fallback);
        if(Array.isArray(arr) && arr.length){
          const next = arr.shift();
          el.dataset.fallback = JSON.stringify(arr);
          el.src = next;
          return;
        }
      }catch(_){}
      el.removeAttribute('data-fallback');
      el.style.display='none';
    }
  }, true);
  installImgFallbackHandler._installed = true;
}

// ---------- FR labels ----------
const ELEMENT_FR = { Fire:'Feu', Ice:'Glace', Wind:'Vent', Lightning:'Foudre', Physical:'Physique', Quantum:'Quantique', Imaginary:'Imaginaire', Thunder:'Foudre' };
const PATH_FR_FALLBACK = { Warrior:'La Destruction', Destruction:'La Destruction', Rogue:'La Chasse', Hunt:'La Chasse', Mage:'L\'Érudition', Erudition:'L\'Érudition', Shaman:'L\'Harmonie', Harmony:'L\'Harmonie', Warlock:'La Nihilité', Nihility:'La Nihilité', Knight:'La Préservation', Preservation:'La Préservation', Priest:'L\'Abondance', Abundance:'L\'Abondance' };

// ---------- formatters (tooltips) ----------
function replaceParams(text, params, idx){
  try{
    if(!params || !Array.isArray(params)) return text||'';
    const pick = (k)=>{
      const arr = params[k];
      if(Array.isArray(arr)){
        const v = arr[Math.max(0, Math.min(idx, arr.length-1))];
        return (v!=null ? Number(v) : null);
      }
      return null;
    };
    let out = String(text||'');
    // handle % aware replacement
    out = out.replace(/#(\d+)\[i\](%?)/g, (_m, p1, pct)=>{
      const k = Math.max(0, parseInt(p1,10)-1);
      let v = pick(k);
      if(v==null) return '';
      if(pct){ v = v * 100; }
      // nice format: integers as 50, otherwise 50.1 etc.
      const s = (Math.abs(v - Math.round(v)) < 1e-8) ? String(Math.round(v)) : String(Number(v.toFixed(2)));
      return s;
    });
    return out;
  }catch(e){ return text||''; }
}
function highlightNumbers(html){
  return html
    .replace(/([+\-]?\d+(?:[.,]\d+)?\s*%)/g, '<span class="hl">$1</span>')
    .replace(/(\b\d+\s*(?:tours?|tour)\b)/gi, '<span class="hl">$1</span>')
    .replace(/(\b\d+\s*(?:PV|ATQ|DÉF|DEF|VIT|Énergie|Energie|points?)\b)/gi, '<span class="hl">$1</span>');
}
function emphasizeProperties(html, propertiesDB){
  try{
    const names = Object.values(propertiesDB||{}).map(p=>p.name).filter(Boolean).sort((a,b)=> b.length-a.length);
    for(const n of names){
      const re = new RegExp('(?<![\\wÀ-ÿ])(' + n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')(?![\\wÀ-ÿ])','g');
      html = html.replace(re, '<strong>$1</strong>');
    }


function highlightAndNormalizeNumbers(html){
  // Split by tags, process only text nodes
  const parts = String(html||'').split(/(<[^>]+>)/g);
  for(let i=0;i<parts.length;i++){
    const seg = parts[i];
    if(!seg || /^<[^>]+>$/.test(seg)) continue;
    let t = seg;
    // Round values preceding 'tour'/'tours'
    t = t.replace(/(\d+(?:[.,]\d+)?)\s*(tours?)/gi, (_m, num, unit)=>{
      const v = parseFloat(String(num).replace(',', '.'));
      if(!isFinite(v)) return _m;
      const iv = Math.round(v);
      return iv + ' ' + unit;
    });
    // Wrap all numeric tokens
    t = t.replace(/(\d+(?:[.,]\d+)?)/g, '<span class="hl">$1</span>');
    parts[i] = t;
  }
  return parts.join('');
}
  }catch(e){}
  return html;
}
function formatTooltip(text, propertiesDB){
  let html = escapeHtml(text).replace(/\n/g,'<br>');
  if (typeof highlightAndNormalizeNumbers === 'function') {
    html = emphasizeProperties(html, propertiesDB);
    html = highlightAndNormalizeNumbers(html);
  } else {
    html = emphasizeProperties(html, propertiesDB);
    html = html.replace(/(\d+(?:[.,]\d+)?)/g, '<span class="hl">$1</span>');
  }
  return html;
}


// ---------- character resolver ----------
function resolveCharacter(chars, nicks){
  const bodyId = document.body?.getAttribute('data-char-id');
  if(bodyId && chars[bodyId]) return chars[bodyId];
  const parts = decodeURIComponent(location.pathname).split('/').filter(Boolean);
  const i = parts.lastIndexOf('personnages');
  const folder = i>=0 && i+1<parts.length ? words(parts[i+1])[0] : null;
  const raw = (document.querySelector('#personnage .title')?.textContent || document.title || '');
  const tset = new Set(words(raw)); if(folder) tset.add(folder);
  const preferred = new Set(['firefly','luciole']);
  for(const c of Object.values(chars)){
    const ns = new Set(words(c.name||''));
    for(const w of preferred){ if(tset.has(w) && ns.has(w)) return c; }
  }
  if(folder){
    for(const c of Object.values(chars)){
      const ns = new Set(words(c.name||''));
      if(ns.has(folder)) return c;
    }
  }
  if(chars['1310']) return chars['1310'];
  return Object.values(chars)[0];
}

// ---------- image resolvers (by type) ----------
function elementImg(elementCode){
  const name = ELEMENT_FR[elementCode] || elementCode;
  const candidates = [
    `icon/element/${elementCode}.png`,
    `image/element/${elementCode}.png`
  ];
  return imgWithFallback(candidates, name, 'chip-icon');
}
function pathImg(pathInfo, pathKey){
  const name = (pathInfo?.name || PATH_FR_FALLBACK[pathKey] || pathKey);
  const src = pathInfo?.icon_small || pathInfo?.icon;
  const candidates = [];
  if(src) candidates.push(src);
  // generic fallbacks
  candidates.push(`icon/path/${pathKey}Small.png`, `icon/path/${pathKey}.png`);
  return imgWithFallback(candidates, name, 'chip-icon');
}
function portraitImg(char){
  const candidates = [];
  if(char.portrait) candidates.push(char.portrait);
  if(char.preview) candidates.push(char.preview);
  if(char.icon) candidates.push(char.icon);
  candidates.push(`image/character_portrait/${char.id}.png`);
  return imgWithFallback(candidates, char.name||'', '');
}
function skillIconCandidates(char, skill){
  const list = [];
  if(skill.icon) list.push(skill.icon);
  const base = `${char.id}`;
  const t = (skill.type||'').toLowerCase();
  if(/normal|basic/.test(t)) list.push(`image/character_skill/${base}_basic_atk.png`);
  if(/bpskill|skill/.test(t)) list.push(`image/character_skill/${base}_skill.png`);
  if(/ultra|ultimate/.test(t)) list.push(`image/character_skill/${base}_ultimate.png`);
  if(/talent/.test(t)) list.push(`image/character_skill/${base}_talent.png`);
  if(/maze|technique/.test(t)) list.push(`image/character_skill/${base}_technique.png`);
  // generic folder
  list.push(`image/character_skill/${skill.icon||''}`);
  return list;
}
function rankIconCandidates(char, e){
  const list = [];
  if(e.icon) list.push(e.icon);
  if(e.rank!=null) list.push(`image/character_rank/${char.id}_rank${e.rank}.png`);
  list.push(`image/character_rank/${e.icon||''}`);
  return list;
}
function traceIconCandidates(char, node, idx){
  const list = [];
  if(node.icon) list.push(node.icon);
  list.push(`image/character_skilltree/${char.id}_skilltree${(idx||1)}.png`);
  list.push(`image/character_skilltree/${node.icon||''}`);
  return list;
}
function relicIconCandidates(rec){
  const list = [];
  if(rec.icon) list.push(rec.icon);
  const id = rec.id || rec.set_id || rec.eid;
  if(id!=null){
    list.push(`icon/relic/${id}.png`, `image/relic/${id}.png`, `image/relic_set/${id}.png`);
  }
  return list;
}
function coneIconCandidates(cone){
  const list = [];
  if(cone.icon) list.push(cone.icon);
  const id = cone.id || cone.eid;
  if(id!=null){
    list.push(`image/light_cone/${id}.png`, `icon/light_cone/${id}.png`);
  }
  return list;
}

// ---------- header ----------
function renderHeader(char, pathsDB){
  const tagsEl = document.querySelector('.tags'); if(tagsEl){
    tagsEl.innerHTML='';
    if(char.element){
      tagsEl.insertAdjacentHTML('beforeend', `<span class="tag">${elementImg(char.element)} ${ELEMENT_FR[char.element]||char.element}</span>`);
    }
    if(char.path){
      const pinfo = (pathsDB||{})[char.path];
      tagsEl.insertAdjacentHTML('beforeend', `<span class="tag">${pathImg(pinfo, char.path)} ${(pinfo?.name || PATH_FR_FALLBACK[char.path] || char.path)}</span>`);
    }
  }
  const sub = document.querySelector('.subtitle'); if(sub) sub.style.display='none';
  const portrait = document.getElementById('char-portrait');
  if(portrait){
    const wrapper = h(`<span class="imgwrap">${portraitImg(char)}</span>`);
    portrait.replaceWith(wrapper.firstElementChild);
  }
}

// ---------- skills (auto) ----------

function renderSkills(char, skillsDB){
  const grid = ensureGrid('skills-grid','skills','grid-2'); if(!grid) return;
  grid.innerHTML='';
  // Collect declared skills for this character
  let list = Object.values(skillsDB).filter(s => String(s.character_id||s.avatar_id||'')===String(char.id));
  if(!list.length && Array.isArray(char.skills)){ list = char.skills.map(id=> skillsDB[String(id)]).filter(Boolean); }
  // Sort by our base order
  const order = { Normal:1, BasicATK:1, BPSkill:2, Skill:2, Ultra:3, Ultimate:3, Talent:4, Maze:5, Technique:5, MazeNormal:99 };
  list.sort((a,b)=> (order[a.type]||99) - (order[b.type]||99));
  // Keep only 5 core entries: ATQ, Compétence, Ultime, Talent, Technique
  const groupKey = (t)=> {
    if(t==='MazeNormal') return 'IGNORE';
    if(t==='Normal' || t==='BasicATK') return 'ATQ';
    if(t==='BPSkill' || t==='Skill') return 'SKILL';
    if(t==='Ultra' || t==='Ultimate') return 'ULT';
    if(t==='Talent') return 'TALENT';
    if(t==='Maze' || t==='Technique') return 'TECH';
    return t;
  };
  const seen = new Set();
  const filtered = [];
  for(const s of list){
    const g = groupKey(s.type||'');
    if(g==='IGNORE') continue;
    if(seen.has(g)) continue; // keep first occurrence per group (base version)
    seen.add(g);
    filtered.push(s);
  }
  console.log('[skills] char', char.id, 'found', filtered.length, 'core entries');
  if(!filtered.length){
    grid.innerHTML = `<div class="note">Aucune compétence trouvée (id ${char.id}).</div>`;
    return;
  }
  filtered.forEach(skill => {
    const candidates = skillIconCandidates(char, skill);
    const tip = formatTooltip(replaceParams(skill.desc, skill.params, 0), window.__propertiesDB||{});
    grid.append(h(`<div class="item">
      ${imgWithFallback(candidates, skill.name, '')}
      <div class="t"><h4>${skill.name}</h4><p class="muted">${skill.type_text||skill.type||''}</p></div>
      <div class="tooltip">${tip}</div>
    </div>`));
  });
}


// ---------- eidolons (auto) ----------
function renderEidolonsFromRanks(char, ranksDB){
  const grid = ensureGrid('eidolons-grid','eidolons','grid-3'); if(!grid) return;
  grid.innerHTML='';
  let list = Object.values(ranksDB).filter(r => String(r.character_id||r.avatar_id||'')===String(char.id));
  if(!list.length && Array.isArray(char.ranks)){ list = char.ranks.map(id=> ranksDB[String(id)]).filter(Boolean); }
  list.sort((a,b)=> (a.rank||0)-(b.rank||0));
  console.log('[eidolons] char', char.id, 'found', list.length, 'entries via characters.json');
  if(!list.length){
    grid.innerHTML = `<div class="note">Aucun eidolon trouvé (id ${char.id}).</div>`;
    return;
  }
  list.forEach(e => {
    const candidates = rankIconCandidates(char, e);
    const desc = formatTooltip(replaceParams(e.desc, e.params, 0), window.__propertiesDB||{});
    grid.append(h(`<div class="item">
      ${imgWithFallback(candidates, e.name, '')}
      <div class="t"><h4>${e.name}</h4><p class="eid-rank">E${e.rank||''}</p></div>
      <div class="tooltip">${desc}</div>
    </div>`));
  });
}

// ---------- major traces (A2/A4/A6) ----------
function isMinorTrace(node){
  const icon = String(node.icon||'').toLowerCase();
  const base = icon.split('/').pop();
  if(/^icon/i.test(base)) return true;                  // IconBreakUp, IconSpeed...
  if(/(property|stat)/i.test(icon)) return true;        // icon/property/
  const n = String(node.name||'').toLowerCase();
  if(/^augmentation/.test(n)) return true;              // "Augmentation de ..."
  return false;
}

function renderMajorTraces(char, treesDB){
  const grid = ensureGrid('traces-major-grid','traces','grid-2'); if(!grid) return;
  grid.innerHTML='';
  let nodes = Object.values(treesDB).filter(n => String(n.character_id||n.avatar_id||'')===String(char.id) || String(n.id||'').startsWith(String(char.id)));
  let majors = nodes.filter(n => {
    const levels = Array.isArray(n.levels)? n.levels: [];
    const promos = levels.map(l=> l.promotion).filter(v=> v!=null);
    const promoOK = promos.some(p => p===2 || p===4 || p===6);
    return promoOK && (n.name||'').trim().length>0 && !isMinorTrace(n);
  }).sort((a,b)=> {
    const pa = (a.levels?.find(l=>[2,4,6].includes(l.promotion))?.promotion)||99;
    const pb = (b.levels?.find(l=>[2,4,6].includes(l.promotion))?.promotion)||99;
    return pa - pb;
  });
  // dédoublonnage: garder 1 node par palier (2/4/6)
  const byPromo = {};
  majors.forEach(n => { const promo=(n.levels?.find(l=>[2,4,6].includes(l.promotion))?.promotion)||0; if(promo && !byPromo[promo]) byPromo[promo]=n; });
  majors = [2,4,6].map(p=>byPromo[p]).filter(Boolean);
  majors.forEach((node, idx) => {
    const candidates = traceIconCandidates(char, node, idx+1);
    const tip = formatTooltip(replaceParams(node.desc, node.params, 0), window.__propertiesDB||{});
    grid.append(h(`<div class="item">
      ${imgWithFallback(candidates, node.name, '')}
      <div class="t"><h4>${(node.levels?.find(l=>[2,4,6].includes(l.promotion))?.promotion ? 'A'+node.levels.find(l=>[2,4,6].includes(l.promotion)).promotion+' — ' : '')}${node.name}</h4></div>
      <div class="tooltip">${tip}</div>
    </div>`));
  });
}


// ---------- traces priority (order) ----------
function renderTracePriority(char, skillsDB, override){
  // override: traces_priority can be strings: "Talent","Compétence","Ultime","ATQ normale"
  const human = override?.traces_priority || override?.traces?.priority || ["Talent","Compétence","Ultime","ATQ normale"];
  const map = {
    "ATQ normale": ["Normal","BasicATK"],
    "Compétence": ["BPSkill","Skill"],
    "Ultime": ["Ultra","Ultimate"],
    "Talent": ["Talent"]
  };
  const grid = document.getElementById('traces-major-grid');
  if(!grid) return;
  // construire la carte de droite et l'injecter à la fin du grid
  const card = document.createElement('div');
  card.className = 'card trace-order-card';
  card.innerHTML = `<h3>Priorité des traces</h3><div class="trace-order-list"></div>`;
  const list = card.querySelector('.trace-order-list');
  human.forEach((label, i)=>{
    // trouver l'icône correspondante via les skills
    let sk = null;
    const wanted = map[label]||[];
    if(wanted.length){
      sk = Object.values(skillsDB).find(s => String(s.character_id||s.avatar_id||'')===String(char.id) && wanted.includes(s.type));
      if(!sk && Array.isArray(char.skills)){ sk = char.skills.map(id=> skillsDB[String(id)]).find(s=> s && wanted.includes(s.type)); }
    }
    const iconCandidates = sk ? skillIconCandidates(char, sk) : [];
    list.insertAdjacentHTML('beforeend',
      `<div class="trace-order"><span class="order-dot">${i+1}</span>${imgWithFallback(iconCandidates, label, 'trace-type-icon')}<span class="label">${label}</span></div>`
    );
  });
  grid.appendChild(card);
}
// ---------- cones (auto list) with S1..S5 tooltip ----------
window.__coneS = window.__coneS || 1;
function computeConeTooltip(cone, lcRanks, propertiesDB){
  const rec = (lcRanks||{})[String(cone.id)] || (lcRanks||{})[String(cone.rank_id||'')] || (lcRanks||{})[String(cone.eid||'')];
  if(rec){
    const idx = Math.max(1, Math.min(5, window.__coneS)) - 1;
    const head = rec.skill ? `<strong>${rec.skill}</strong><br>` : '';
    return head + formatTooltip(replaceParams(rec.desc, rec.params, idx), propertiesDB||{});
  }
  return formatTooltip(cone.desc||'', propertiesDB||{});
}
function coneLabelPath(pathKey){ return (window.__pathsDB?.[pathKey]?.name || PATH_FR_FALLBACK[pathKey] || pathKey); }
function renderCones(conesDB, char){
  const grid = ensureGrid('cones-grid','equipment','grid-2'); if(!grid) return;
  grid.innerHTML='';
  const list = Object.values(conesDB).filter(c => String(c.path||'').toLowerCase() === String(char.path||'').toLowerCase());
  list.sort((a,b)=> (b.rarity||0)-(a.rarity||0));
  list.slice(0, 6).forEach(c => {
    const candidates = coneIconCandidates(c);
    const tip = computeConeTooltip(c, window.__lcRanks, window.__propertiesDB||{});
    grid.append(h(`<div class="item" data-cone-id="${c.id}">
      ${imgWithFallback(candidates, c.name, '')}
      <div class="t"><h4>${c.name} (${c.rarity}★)</h4><p class="muted">${coneLabelPath(c.path)}</p></div>
      <div class="tooltip">${tip}</div>
    </div>`));
  });
}
function updateConeTooltips(){
  const grid = document.getElementById('cones-grid'); if(!grid) return;
  grid.querySelectorAll('.item[data-cone-id]').forEach(el => {
    const id = el.getAttribute('data-cone-id');
    const cone = (window.__conesDB||{})[id]; if(!cone) return;
    const tipEl = el.querySelector('.tooltip'); if(tipEl){
      tipEl.innerHTML = computeConeTooltip(cone, window.__lcRanks, window.__propertiesDB||{});
    }
  });
}
function mountConesControls(){
  const grid = document.getElementById('cones-grid'); if(!grid) return;
  const parent = grid.parentElement;
  if(!parent || parent.querySelector('.cones-ctrl')) return;
  const box = h(`<div class="cones-ctrl" role="group" aria-label="Superposition des cônes (S1 à S5)">
    <span class="label">Superposition</span>
    <div class="seg">${[1,2,3,4,5].map(i=>`<button type="button" data-s="${i}" ${i===window.__coneS?'class="active"':''}>S${i}</button>`).join('')}</div>
  </div>`);
  parent.insertBefore(box, grid);
  box.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-s]'); if(!btn) return;
    window.__coneS = parseInt(btn.dataset.s,10) || 1;
    box.querySelectorAll('button').forEach(b=>b.classList.toggle('active', b===btn));
    updateConeTooltips();
  });
}

// ---------- overview/equipment from override (JSON control) ----------
function formatTooltipText(t){ return formatTooltip(t, window.__propertiesDB||{}); }
function makeEquipCard(iconCandidates, title, subtitle, tipHtml){
  const el = h(`<div class="item">
    ${imgWithFallback(iconCandidates, title, '')}
    <div class="t"><h4>${title}</h4>${subtitle?`<p class="muted">${subtitle}</p>`:''}</div>
    <div class="tooltip">${tipHtml||''}</div>
  </div>`);
  return el;
}
function renderOverviewFromOverride(ovr, relicsDB, propertiesDB){
  if(!ovr) return false;
  let did = false;

  // Sets conseillés (reliques 4pc)
  const row = document.getElementById('relics-row');
  if(row && Array.isArray(ovr.overview?.relics4) && ovr.overview.relics4.length){
    row.innerHTML=''; did=true;
    ovr.overview.relics4.forEach((ref, idx)=>{
      const id = (typeof ref==='object') ? ref.id : ref;
      const tag = (typeof ref==='object') ? (ref.tag||ref.label||null) : null;
      const r = relicsDB[id]; if(!r) return;
      const tip = formatTooltipText(`2 pièces : ${r.desc?.[0]||''}\n4 pièces : ${r.desc?.[1]||''}`);
      row.append(h(`<span class="badge has-order ${tag?'has-tag':''}" style="width:100%">
        <span class="order-dot">${idx+1}</span>
        <span class="badge-body">
          <span class="badge-left">${imgWithFallback(relicIconCandidates(r), r.name, 'picon')}${r.name}</span>
          <span class="badge-right">${tag?`<span class="mini-tag mini-tag--badge" data-tag="${tag}"><span class="dot"></span>${tag}</span>`:''}</span>
        </span>
        <div class="tooltip">${tip}</div>
      </span>`));
    });
  }

  // Ornement planaire (2pc)
  const pg = document.getElementById('planars-grid');
  if(pg && Array.isArray(ovr.overview?.planars2) && ovr.overview.planars2.length){
    pg.innerHTML=''; did=true;
    ovr.overview.planars2.forEach(id => {
      const r = relicsDB[id]; if(!r) return;
      const tip = formatTooltipText(r.desc?.[0]||'');
      pg.append(makeEquipCard(relicIconCandidates(r), r.name + " (2PC)", null, tip));
    });
  }

  // Substats & stats cibles
  const substats = Array.isArray(ovr.substats)?ovr.substats:[];
  const statsKV = Array.isArray(ovr.target_stats)?ovr.target_stats:[];
  const subGrid = document.getElementById('substats-grid');
  if(subGrid && substats.length){ subGrid.innerHTML = substats.map(s=>`<span class="badge" style="width:100%">${s}</span>`).join(''); did = true; }
  const statSec = document.getElementById('statsrecap');
  if(statSec && statsKV.length){
    const dest = statSec.querySelector('.kv-wrap') || statSec;
    statsKV.forEach(([k,v])=> dest.insertAdjacentHTML('beforeend', `<div class="kv"><label>${k}</label><div class="v">${v}</div></div>`));
    did = true;
  }

  // Teams (optionnel)
  const teams = Array.isArray(ovr.teams)?ovr.teams:[];
  const tgrid = ensureGrid('teams-grid','teams','grid-2');
  if(tgrid && teams.length){
    tgrid.innerHTML='';
    teams.forEach(t => {
      const name = t.name || 'Équipe';
      const members = (t.members||[]).map(label => `<span class="member">${label}</span>`).join('');
      tgrid.append(h(`<div class="team-card card"><h3>${name}</h3><div class="members">${members}</div>${t.note?`<p class="muted">${t.note}</p>`:''}</div>`));
    });
    did = true;
  }

  return did;
}

// ---------- init ----------
async function init(){
  try{
    installImgFallbackHandler();

    const [charsRaw, skillsRaw, ranksRaw, treesRaw, nicksRaw, properties, conesRaw, lcRanksRaw, relicsRaw, pathsRaw] = await Promise.all([
      loadJSON(FILES.characters),
      loadJSON(FILES.skills),
      loadJSON(FILES.ranks),
      loadJSON(FILES.trees),
      loadJSON(FILES.nick).catch(()=>({})),
      loadJSON(FILES.properties),
      loadJSON(FILES.cones),
      loadJSON(FILES.lc_ranks).catch(()=>({})),
      loadJSON(FILES.relics),
      loadJSON(FILES.paths)
    ]);
    const chars = asMap(charsRaw,'id');
    const skills = asMap(skillsRaw,'id');
    const ranks = asMap(ranksRaw,'id');
    const trees = asMap(treesRaw,'id');
    const cones = asMap(conesRaw,'id');
    const lcRanks = asMap(lcRanksRaw,'id');
    const relics = asMap(relicsRaw,'id');
    const paths = asMap(pathsRaw,'id');
    window.__propertiesDB = properties;
    window.__lcRanks = lcRanks;
    window.__pathsDB = paths;
    window.__conesDB = cones;

    const char = resolveCharacter(chars, nicksRaw||{});
    if(!char) throw new Error('Personnage introuvable');
    console.log('[char] resolved', char.id, char.name);

    renderHeader(char, paths);
    renderSkills(char, skills);
    renderEidolonsFromRanks(char, ranks);
    renderMajorTraces(char, trees);

    // Priorités des traces
    // (utilise override.traces_priority si dispo, sinon ordre par défaut)
    let __ovrForPriority = null;
    try{ const r0 = await fetch(FILES.override(char.id), {cache:'no-store'}); if(r0.ok) __ovrForPriority = await r0.json(); }catch(_){ }
    renderTracePriority(char, skills, __ovrForPriority||{});

    // Override
    let ovr = null;
    try{
      const r = await fetch(FILES.override(char.id), {cache:'no-store'});
      if(r.ok) ovr = await r.json();
    }catch(_){ /* ignore */ }
    if(!(ovr && renderOverviewFromOverride(ovr, relics, properties))){
      const row = document.getElementById('relics-row'); if(row){ row.innerHTML=''; }
      const pg = document.getElementById('planars-grid'); if(pg){ pg.innerHTML=''; }
    }

    renderCones(cones, char);
    mountConesControls();
  }catch(err){
    console.error('Chargement des données échoué:', err);
    alert('Chargement des données échoué: ' + err.message);
  }
}
document.addEventListener('DOMContentLoaded', init);
document.addEventListener('DOMContentLoaded', () => {
  numberSubstats();
  moveMainStatsIntoOverview();
  harmonizeEquipCards();
});

/* ---------- 2.1 Substats numérotées ---------- */
/* Remplace ton rendu substats par cet helper (ou appelle-le après ton rendu). 
   Attendu: #substats-grid contient une liste d'items (texte ou <div>) */
function numberSubstats(){
  const grid = document.getElementById('substats-grid');
  if(!grid) return;

  // Récupère les libellés existants (ou adapte si tu as déjà un tableau en mémoire)
  const labels = Array.from(grid.children).map(el => el.textContent.trim()).filter(Boolean);
  if(!labels.length) return;

  grid.innerHTML = '';
  labels.forEach((label, i)=>{
    const item = document.createElement('div');
    item.className = 'substat';
    item.innerHTML = `<span class="prio" aria-hidden="true">${i+1}</span><span class="label">${label}</span>`;
    item.setAttribute('aria-label', `Priorité ${i+1}: ${label}`);
    grid.appendChild(item);
  });
}

/* ---------- 2.2 Déplacer "Stats principales" à gauche des substats dans l’aperçu ---------- */
/* On clone la kv-wrap (#statsrecap) dans une carte insérée AVANT la carte Substats */
function moveMainStatsIntoOverview(){
  const statsSec = document.querySelector('#statsrecap .kv-wrap');
  const overviewGrid = document.querySelector('#overview .grid-3');
  if(!statsSec || !overviewGrid) return;

  // Créer une carte “Stats principales”
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `<h3>Stats principales</h3>`;
  const clone = statsSec.cloneNode(true);
  card.appendChild(clone);

  // Insérer en 1re colonne, juste avant la carte Substats (qui est la 2e carte)
  const substatsCard = overviewGrid.querySelector('.card:nth-of-type(2)');
  overviewGrid.insertBefore(card, substatsCard);

  // Option : masquer la section d’origine pour éviter le doublon
  const statsSection = document.getElementById('statsrecap');
  if(statsSection) statsSection.style.display = 'none';
}

/* ---------- 2.3 Harmoniser l’apparence des Reliques (sets conseillés) et Ornements ---------- */
/* Utilise le même rendu .equip pour les deux. Si tu as déjà un rendu,
   appelle juste "harmonizeEquipCards()" après pour re-styliser les items. */
function equipItem({name, icon, note}){
  const el = document.createElement('div');
  el.className = 'equip';
  el.innerHTML = `
    <img class="equip__icon" src="${icon}" alt="" loading="lazy" decoding="async">
    <div class="equip__body">
      <div class="equip__name">${name}</div>
      ${note ? `<div class="equip__note">${note}</div>` : ''}
    </div>`;
  return el;
}

function harmonizeEquipCards(){
  // ----- Sets conseillés (reliques) -----
  const relicsRow = document.getElementById('relics-row');
  if(relicsRow && relicsRow.children.length){
    const items = Array.from(relicsRow.children).map(el => {
      return {
        name: (el.getAttribute('data-name') || el.textContent || '').trim(),
        icon: el.getAttribute('data-icon') || el.querySelector('img')?.src || '',
        note: el.getAttribute('data-note') || ''
      };
    });
    relicsRow.innerHTML = '';
    items.forEach(x => relicsRow.appendChild(equipItem(x)));
  }

  // ----- Ornement planaire -----
  const planars = document.getElementById('planars-grid');
  if(planars && planars.children.length){
    const items = Array.from(planars.children).map(el => {
      return {
        name: (el.getAttribute('data-name') || el.textContent || '').trim(),
        icon: el.getAttribute('data-icon') || el.querySelector('img')?.src || '',
        note: el.getAttribute('data-note') || ''
      };
    });
    planars.innerHTML = '';
    items.forEach(x => planars.appendChild(equipItem(x)));
  }
}
