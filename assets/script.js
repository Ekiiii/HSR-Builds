// TOC actif au scroll
const tocLinks = Array.from(document.querySelectorAll('.toc a'));
const sections = tocLinks
  .map(a => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);

const obs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      const id = '#' + entry.target.id;
      tocLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === id));
    }
  });
}, { rootMargin: "-30% 0px -60% 0px", threshold: 0 });

sections.forEach(s => obs.observe(s));

// Navigation douce via TOC
document.querySelector('.toc').addEventListener('click', (e)=>{
  if(e.target.tagName === 'A'){
    e.preventDefault();
    const id = e.target.getAttribute('href');
    const target = document.querySelector(id);
    if(target) {
      target.scrollIntoView({behavior:'smooth', block:'start'});
      history.replaceState(null,'',id);
    }
  }
});

// Bouton remonter
document.getElementById('backtop')?.addEventListener('click', ()=>{
  window.scrollTo({ top:0, behavior:'smooth' });
});
