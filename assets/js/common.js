// === COMMUN ===
const PREFIX_CANDIDATES = ['../data/index/', '/data/index/', 'data/index/']; // essaie dans cet ordre

export const DATA_FILES = { characters:null, avatars:null, elements:null, paths:null, nicknames:null };

export async function resolveDataPaths(){
  for(const base of PREFIX_CANDIDATES){
    try{
      const res = await fetch(base + 'characters.json', {cache:'no-store'});
      if(res.ok){
        DATA_FILES.characters = base + 'characters.json';
        DATA_FILES.avatars = base + 'avatars.json';
        DATA_FILES.elements = base + 'elements.json';
        DATA_FILES.paths = base + 'paths.json';
        DATA_FILES.nicknames = base + 'nickname.json';
        return;
      }
    }catch(e){ /* ignore */ }
  }
  // fallback : suppose /data/index/
  DATA_FILES.characters = '/data/index/characters.json';
  DATA_FILES.avatars = '/data/index/avatars.json';
  DATA_FILES.elements = '/data/index/elements.json';
  DATA_FILES.paths = '/data/index/paths.json';
  DATA_FILES.nicknames = '/data/index/nickname.json';
}

export async function loadJSON(path){
  const res = await fetch(path, {cache:'no-store'});
  if(!res.ok) throw new Error('Impossible de charger '+path);
  return res.json();
}

// résout une URL d'image relative à /data
export function resolveAsset(url){
  if(!url) return null;
  let u = String(url).replace(/\\/g,'/');
  if(/^(https?:|data:|\/)/i.test(u)) return u;
  if(/^image\//i.test(u)) return '/data/' + u;
  if(!u.includes('/')) return '/data/image/character_portrait/' + u;
  return '/data/' + u.replace(/^\/?/, '');
}

export function normalizeDict(dict){
  if(Array.isArray(dict)){
    const map = {};
    for(const it of dict){
      const id = it.id ?? it.key ?? it.value ?? it.name?.toLowerCase();
      map[id] = it;
    }
    return map;
  }
  return dict || {};
}

export function rarityStars(n=4){ return '★★★★★'.slice(0, Math.max(0, Math.min(5, n))) }

export function makeSlug(name){
  return String(name||'').toLowerCase()
    .replace(/[^a-z0-9\s_-]/g,'')
    .replace(/\s+/g,'_')
    .replace(/_+/g,'_')
    .replace(/^_|_$/g,'');
}

export function normalizeCharacter(raw){
  const c = {...raw};
  const id = c.id ?? c.characterId ?? c.avatarId ?? c.avatar_id ?? c.avatar ?? c.AvatarId;
  const name = c.name ?? c.Name ?? c.displayName ?? c.display_name ?? c.IdName ?? c.id_name ?? c.title ?? 'Inconnu';
  const elementId = c.element ?? c.elementId ?? c.Element ?? c.element_type ?? c.element_id;
  const pathId = c.path ?? c.pathId ?? c.Path ?? c.path_id ?? c.role;
  const rarity = Number(c.rarity ?? c.Rarity ?? c.star ?? c.stars ?? 4);
  const portrait = c.portrait || c.icon || c.image || c.img || c.avatar || c.iconPath;
  // collecte nom anglais potentiel
  const enName = c.englishName || c.en || c.name_en || c.NameEN || (c.i18n && (c.i18n.en || c.i18n?.EN)) || null;
  return { id, name, elementId, pathId, rarity, portrait, enName, raw:c };
}
