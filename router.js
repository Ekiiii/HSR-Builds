// Client-side router for clean '/:slug' and '/personnages/:slug' URLs on static hosting (e.g., GitHub Pages)
(function(){
  var BASE = (typeof window !== "undefined" && window.BASE_URL != null ? window.BASE_URL : "/");

  function go(url){ location.replace(url); }

  function exists(url){
    return fetch(url, {method:"HEAD"}).then(function(r){ return r.ok; }).catch(function(){ return false; });
  }

  function getSlugFromPath(){
    var parts = location.pathname.split("/").filter(Boolean);
    // Accept /firefly, /firefly/, /personnages/firefly, /personnages/firefly/index.html
    if(parts[0] === "personnages") parts.shift();
    if(parts[parts.length-1] === "index.html") parts.pop();
    return parts.length === 1 ? parts[0] : (parts.length > 1 ? parts[parts.length-1] : "");
  }

  // If we're already on the homepage, nothing to do
  if(location.pathname === "/" || location.pathname === "") return;

  // Normalize legacy links:
  // /personnages/foo.html -> /personnages/foo/
  var legacy = location.pathname.match(/^\/personnages\/([A-Za-z0-9\-\_]+)\.html$/);
  if(legacy){ go("/personnages/" + legacy[1] + "/"); return; }

  // Clean redundant index: /personnages/foo/index.html -> /personnages/foo/
  var idx = location.pathname.match(/^\/personnages\/([A-Za-z0-9\-\_]+)\/index\.html$/);
  if(idx){ go("/personnages/" + idx[1] + "/"); return; }

  // Pretty URL -> physical page (404 handler path)
  var slug = getSlugFromPath();
  if(!slug) return;

  // Validate slug against data/characters.json to avoid bad redirects
  fetch((BASE.replace(/\/+$/,"")) + "/data/characters.json")
    .then(function(r){ return r.json(); })
    .then(function(list){
      var ok = Array.isArray(list) && list.some(function(x){ return (x && (x.slug||"").toLowerCase() === slug.toLowerCase()); });
      if(!ok) return;

      var cand = [
        "/personnages/" + slug.toLowerCase() + "/index.html",
        "/personnages/" + slug.toLowerCase() + ".html",
        "/" + slug.toLowerCase() + ".html"
      ];

      (function tryNext(i){
        if(i >= cand.length){ return; }
        exists(cand[i]).then(function(found){
          if(found){ go(cand[i]); }
          else { tryNext(i+1); }
        });
      })(0);
    })
    .catch(function(){ /* silent */ });
})();