
/*!
 * move-equipment.js
 * - Déplace "Sets conseillés" et "Ornement planaire" sous Équipement (après Cônes de lumière)
 * - Les aligne côte à côte en 2 colonnes de largeur égale
 * - Robuste face aux réinjections de contenu (MutationObserver)
 */
(function(){
  function $(sel, root){ return (root||document).querySelector(sel); }
  function $all(sel, root){ return Array.from((root||document).querySelectorAll(sel)); }

  // Insertion d'un petit style complémentaire pour garantir la mise en page
  function injectStyles(){
    if($('#equip-relics-styles')) return;
    var css = `
      #equip-relics-holder{ margin-top:16px; }
      #equip-relics-holder{ display:grid; grid-template-columns: 1fr 1fr; gap:16px; align-items:stretch; }
      @media (max-width: 860px){
        #equip-relics-holder{ grid-template-columns: 1fr; }
      }
      #equip-relics-holder > .card{ height:100%; }
    `.trim();
    var style = document.createElement('style');
    style.id = 'equip-relics-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function findCardByTitle(text){
    text = String(text).trim().toLowerCase();
    // Cherche n'importe quelle .card avec un <h3> correspondant
    var cards = $all('.card');
    for(var i=0;i<cards.length;i++){
      var h3 = cards[i].querySelector('h3');
      if(!h3) continue;
      var t = (h3.textContent||'').trim().toLowerCase();
      if(t.includes(text)) return cards[i];
    }
    return null;
  }

  function ensureHolder(equipmentSection){
    var holder = $('#equip-relics-holder', equipmentSection);
    if(holder) return holder;
    holder = document.createElement('div');
    holder.id = 'equip-relics-holder';

    // Le placer juste après la carte "Cônes de lumière" si elle existe
    var conesCard = $('.card', equipmentSection);
    if(conesCard){
      conesCard.insertAdjacentElement('afterend', holder);
    }else{
      equipmentSection.appendChild(holder);
    }
    return holder;
  }

  function moveAndLayout(){
    var equipment = $('#equipment');
    if(!equipment) return false;

    injectStyles();

    var holder = ensureHolder(equipment);

    // Récupération des cartes par leur titre (peu importe où elles sont actuellement)
    var setsCard = findCardByTitle('sets conseillés');
    var planarCard = findCardByTitle('ornement planaire');

    // Si on n'a pas encore les deux cartes, on retentera via l'observer
    if(!setsCard && !planarCard) return false;

    // Ordre: Sets à gauche, Ornement à droite
    if(setsCard && setsCard.parentNode !== holder){
      holder.appendChild(setsCard);
      setsCard.dataset.movedTo = 'equipment';
    }
    if(planarCard && planarCard.parentNode !== holder){
      holder.appendChild(planarCard);
      planarCard.dataset.movedTo = 'equipment';
    }

    return !!(setsCard || planarCard);
  }

  // Premier essai après DOMContentLoaded (le script est en defer)
  function init(){
    // Essai immédiat
    var ok = moveAndLayout();

    // Observer #overview pour capter d'éventuelles (ré)insertions automatiques
    var overview = $('#overview');
    var equipment = $('#equipment');
    if(!overview || !equipment) return;

    var debounced;
    var observer = new MutationObserver(function(){
      clearTimeout(debounced);
      debounced = setTimeout(function(){
        var done = moveAndLayout();
        // Si tout est en place, on peut laisser l'observer au cas où le script reconstruit plus tard
        // (ne pas disconnect pour rester robuste pendant la session)
      }, 0);
    });

    observer.observe(overview, {childList:true, subtree:true});
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
