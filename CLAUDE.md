# CLAUDE.md — Contexte du projet

## Vision
Prototype open-world jouable dans le navigateur, inspiré de GTA. Petit mais **fini et fun** :
mieux vaut une ville de 0,5 km² qui tourne qu'une carte de 4 km² vide.

## Stack
- **Three.js r160** embarqué dans `vendor/` (aucun CDN, aucune installation).
- **JavaScript moderne**, modules ES natifs. Pas de bundler, pas de framework, pas de `node_modules`.
- **Zéro asset externe** : géométrie, textures et sons sont générés par le code.

Unity n'est pas utilisé : il n'est ni installable ni testable dans l'environnement de développement
de ce dépôt. Voir `ARCHITECTURE.md` pour la table de correspondance avec les scripts Unity du plan
d'origine.

## Conventions de code
- `camelCase` pour les variables et fonctions, `PascalCase` pour les classes.
- Fonctions courtes, une responsabilité. Pas de `update()` de 200 lignes.
- **Commentaires rares et utiles** : on explique le *pourquoi* (contrainte, astuce, piège),
  jamais le *quoi*. Environ un commentaire pour 15-20 lignes.
- Interface, textes de jeu et commentaires **en français**.
- Pas de singleton global sauf `window.game` (pratique pour la console de debug).
- La communication jeu → interface passe par `GameEvents` (`game/events.js`), jamais par un
  accès direct au DOM depuis un système de jeu.
- Tout accès à `localStorage` est dans un `try/catch` (il peut être bloqué).

## Budget technique
- 60 FPS sur GPU correct. Plafond visé : **500 draw calls**, **100 000 triangles**.
- Effectifs recyclés, jamais créés en boucle : 14 voitures, 18 piétons, 12 voitures garées,
  6 voitures de police maximum.
- Chargement instantané (rien à télécharger).

## Workflow
1. Une étape = une fonctionnalité testable, livrée avec une checklist de test.
2. Le jeu est **lancé pour de vrai** dans Chromium (Playwright) avant chaque livraison :
   0 erreur console, draw calls mesurés, captures d'écran vérifiées.
3. Validation de ta part (« ✅ Validé » / « 🐛 Bug : … ») avant de passer à l'étape suivante.
4. Un commit par étape, `PROGRESS.md` et `CHANGELOG.md` mis à jour dans le même commit.

## Règle de périmètre
Une idée qui n'est pas dans `MILESTONES.md` ne part pas en code : elle est notée dans la section
« Idées » de `PROGRESS.md`. On termine l'étape en cours avant d'ouvrir la suivante.
