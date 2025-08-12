
async function loadChars(){
  const res = await fetch(`${window.BASE_URL}/data/characters.json`);
  return res.json();
}
function h(el, html){ el.innerHTML = html; }
(async function(){
  const data = await loadChars();
  const slug = window.CHAR_SLUG;
  const c = data.find(x=>x.slug===slug);
  try{ if(c && location.pathname !== "/" + c.slug){ history.replaceState(null, "", "/" + c.slug); } }catch(_){}
  const hero = document.getElementById('hero');
  if(!c){ h(hero, `<p>Personnage introuvable.</p>`); return; }
  h(hero, `<img src="${c.hh_img}" alt="${c.name}">
    <div>
      <div class="name" style="font-size:1.3rem;font-weight:700">${c.name}</div>
      <div class="tags" style="margin-top:6px">
        <span class="tag">${"★".repeat(c.rarity)}</span>
        <span class="tag">${c.element}</span>
        <span class="tag">${c.voie}</span>
      </div>
      <p style="color:var(--muted);margin-top:10px">Fiche locale « /personnages/${c.slug}.html ». Ajoutez vos sections (build, reliques, cônes) ici.</p>
    </div>`);
})();
