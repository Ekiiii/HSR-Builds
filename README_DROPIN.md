# HSR FR Drop-in Pack

Ce pack ajoute :
- `script.js` : noms FR (remplacement `{NICKNAME}`), images depuis `data/index_min/fr/icon/avatar/<id>.png` (fallback SVG), filtres/tri/recherche, FR partout (élément/voie), clic Firefly -> `personnages/Firefly/index.html`.
- `assets/hsr_avatar_placeholder.svg` : image de secours.

## Installation
1. Copiez **script.js** à la racine du dépôt (remplacez l'ancien).
2. Copiez **assets/hsr_avatar_placeholder.svg** dans `assets/` à la racine (créez le dossier s'il n'existe pas).
3. Servez le site via HTTP (GitHub Pages ou `python3 -m http.server`).

## Remarques
- Les images des cartes sont prises en priorité depuis vos JSON; sinon `data/index_min/fr/icon/avatar/<id>.png` ; sinon le placeholder.
- Les éléments/voies sont traduits à partir de `elements.json` et `paths.json` (FR).
- Quand vous ajouterez d'autres pages personnage, changez `buildHrefFor()` si besoin pour pointer vers vos routes.
