# VERTICAL_SLICE

Une démo de 5 à 10 minutes, au niveau de qualité visé pour toute la V1 —
pas un brouillon qu'on améliorera plus tard. Le but : que quelqu'un qui ne
connaît pas le projet la joue une fois et comprenne ce qu'est San Felipe
City, sans explication.

## Zone

Un quartier de 200 m × 200 m, à choisir dans **Downtown** (le plus dense,
le plus rapide à rendre spectaculaire) ou **Mirador Hills** (le plus
dégagé, plus facile à équilibrer en performance). Recommandation : Downtown
— c'est le quartier qui a déjà le plus de variété de style de façade
depuis la v0.15, donc le moins de travail neuf pour arriver à « vitrine ».

Contenu de la zone, ce qui existe déjà vs. ce qui manque :

| Élément | État |
|---|---|
| Une avenue + une rue secondaire | Existe (trame de rues procédurale) |
| Un petit parc | Existe (blocs `isPark`) |
| Un garage ou une station-service | **N'existe pas** — aucun bâtiment n'a de fonction, seulement une silhouette |
| 6 à 10 façades différentes | 3 styles existent (v0.15) ; en ajouter 3 à 7 est le travail le plus rentable identifié dans `ART_DIRECTION.md` |
| Mobilier urbain | Bancs et poubelles existent (v0.15) ; panneaux, abribus, bornes incendie n'existent pas |
| Arbres variés | **N'existe pas** — une seule forme dans tout le jeu |
| Circulation | Existe |
| PNJ | Existent, une seule silhouette |
| Éclairage jour/nuit | Existe |
| Pluie/orage testables | Existent (v0.10) |

## Boucle de jeu

1. Le joueur démarre sur un trottoir de la zone vitrine.
2. Il reçoit un objectif (mécanique déjà là : `missions.js`, marqueur +
   texte HUD).
3. Il rejoint une voiture garée et monte.
4. Il conduit vers un lieu de la zone.
5. Il rencontre une situation de combat simple (un gang, `enemies.js`
   existe déjà).
6. Il échappe à la police ou atteint une zone de fuite (`police.js` existe
   déjà, jusqu'à 5 étoiles).
7. Il reçoit une récompense (argent — déjà câblé dans `missions.js`).
8. Il sauvegarde depuis le menu pause — **à faire** : aujourd'hui la
   sauvegarde est automatique et ne garde qu'argent, statistiques et heure.
9. Il revient en exploration libre.

**Mise à jour v0.22 : le système de missions scénarisées existe** (`story.js`,
six missions ; fonctionnement, écarts et règles : `MISSIONS.md`). La
mission dédiée à cette zone est l'étape 10 de `MILESTONES.md`. Paragraphe d'origine conservé ci-dessous pour l'historique.

**Ce qui manquait pour que cette boucle soit une vraie mission** plutôt qu'une
suite d'actions libres déjà possibles aujourd'hui : un enchaînement avec
étapes, prérequis et échec possible — c'est exactement le travail de
« missions scénarisées » identifié comme P0 dans `BACKLOG.md`. Sans
lui, la boucle ci-dessus se joue déjà telle quelle, mais sans fil rouge.

## Qualité cible

- Personnage lisible — acquis (v0.12).
- Arme visible — acquis (v0.13).
- Visée correcte — acquis (v0.12, v0.13).
- Voiture avec pneus/feux/dégâts simples — acquis (v0.14).
- Audio — partiel : pas de pas, de rechargement ni d'ambiance de ville (`V1_SCOPE.md` § Audio).
- HUD cohérent — acquis (v0.11).
- Menu pause — partiel : manquent Sauvegarder, Réinitialiser, Quitter, options en sections.
- Pas de bugs bloquants — vrai aujourd'hui (voir `PROJECT_STATUS.md` §3).
- FPS cible : 60 sur un PC moyen avec accélération matérielle réelle — **non
  mesuré**, seul le rendu logiciel (SwiftShader) a été testé jusqu'ici.

## Critères de validation

- [ ] La boucle des 9 étapes se termine sans blocage, en une seule prise.
- [ ] Zéro erreur console pendant toute la boucle (script Playwright dédié
      à écrire, sur le modèle des six existants).
- [ ] Mesure des draw calls/triangles/FPS pendant chaque étape de la boucle
      (pas seulement à l'arrêt).
- [ ] Test par une personne qui ne connaît pas le projet — **à faire hors
      de cet environnement**, aucune tierce personne n'y a accès depuis
      ici.
- [ ] Capture vidéo de 30 secondes — **à faire hors de cet environnement**,
      cette session ne peut produire que des captures d'écran fixes.

Ces deux derniers points ne peuvent pas être cochés depuis une session
Claude Code seule : ils demandent une personne et un enregistreur d'écran
sur ta machine.
