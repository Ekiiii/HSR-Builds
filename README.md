# HSR-Builds
Un site web contenant des builds pour les personnages du jeu Honkai: Star Rail

# README — Ajouts suggérés

## Développement local

Servez en local pour tester les fetch/routers (les fichiers locaux via `file://` peuvent bloquer `fetch`).

```bash
# depuis la racine du repo
python3 -m http.server 5173
# puis ouvrez http://localhost:5173/
```

## Déploiement

- Activez **Settings ▸ Pages ▸ Build and deployment ▸ GitHub Actions**.
- Laissez la CI déployer automatiquement via `.github/workflows/pages.yml`.
- Si vos routes profondes (`/personnages/<slug>`) renvoient 404, vérifiez `404.html` et la variable `base` (mettez `/` si vous utilisez un User/Org Pages).
