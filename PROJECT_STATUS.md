# PROJECT_STATUS

Dernière mise à jour : 2026-09-23. Chaque ligne de ce document vient d'une
lecture du code au moment de l'écrire, ou d'une mesure automatisée — pas
d'une intuition sur ce qui « devrait » exister.

## 1. État global

- **Version** : v0.16.
- **Lancer le jeu** : `npx http-server -p 8123 -c-1 --silent .` puis ouvrir
  `http://127.0.0.1:8123/`. Aucune installation, aucun build — un seul
  `index.html`, `vendor/three.module.js` embarqué (Three.js r160), 22
  fichiers dans `game/`, 6 004 lignes au total.
- **Navigateur testé** : Chromium (Playwright), rendu logiciel SwiftShader —
  donc les FPS mesurés dans ce mode ne reflètent pas un GPU réel ; voir
  `PERFORMANCE.md` pour l'explication complète. Jamais testé sur un
  navigateur avec accélération matérielle réelle, ni sur mobile.
- **Résolutions de test** : 1280×720 et 1920×1080.
- **Compteurs mesurés** (scène figée, qualité élevée, carrefour de
  Downtown) : 97 draw calls, 94 géométries, 50 482 triangles. En jeu,
  circulation et piétons compris : 226 à 301 draw calls selon la scène,
  toujours sous le budget de 500 posé dans `PERFORMANCE.md`.
- **Systèmes réellement jouables de bout en bout, aujourd'hui** : marcher,
  courir, sauter, monter/sortir d'un véhicule et conduire, tirer et
  recharger six armes, se faire rechercher par la police jusqu'à cinq
  étoiles puis échapper ou se faire arrêter, mourir et respawn à l'hôpital,
  faire le tutoriel puis deux jobs répétables, changer la météo et
  traverser un cycle jour/nuit de 12 minutes, ouvrir le menu pause et
  changer 19 réglages qui s'appliquent en direct et sont sauvegardés.

## 2. Tableau par système

Statuts : **FONCTIONNEL** (marche de bout en bout, testé), **PARTIEL**
(marche mais avec des trous connus), **PROVISOIRE** (marche, mais le rendu
ou le contenu est un substitut assumé — typiquement les formes en
primitives), **NON COMMENCÉ**.

| Système | Statut | Fichiers | Ce qui marche | Ce qui manque | Bugs connus | Dépendances | Modèle | Priorité |
|---|---|---|---|---|---|---|---|---|
| Monde / carte / quartiers | PARTIEL | `world.js` | Ville procédurale ~0,5 km², 6 quartiers, 3 styles de façade (v0.15), cycle jour/nuit, mobilier urbain de base | Façades 3→6-8 stylés, vitrines/enseignes, volumes de bâtiment non rectangulaires | Aucun bloquant | — | Sonnet | P1 |
| Collision | FONCTIONNEL | `world.js` | AABB en grille spatiale, cercle repoussé pour piéton/joueur, deux cercles pour véhicule | Joueur à pied traverse un véhicule à l'arrêt (bug connu, non corrigé) | Voir ci-contre | — | Sonnet | P2 |
| Déplacement | FONCTIONNEL | `player.js` | Marche/course/marche lente/saut, collisions, orientation par la direction de mouvement | — | Aucun | — | — | — |
| Caméra | FONCTIONNEL | `player.js`, `main.js` | Épaule, anti-mur par ratio distance obtenue/voulue (v0.12, corrigé après une régression trouvée en testant), FOV par contexte (à pied/véhicule/visée/lunette) | Peut encore paraître basse dos à un mur extrême | Aucun bloquant connu | — | — | — |
| Personnage joueur | PROVISOIRE | `player.js` | Silhouette en 9 primitives partagées, marche/course/respiration à l'arrêt/saut/mort | Pas de visage, mains, vêtements détaillés ; **aucune réaction visuelle aux dégâts** (vérifié : `Player.damage()` ne touche que la vie/l'armure) | Aucun | — | Sonnet (réaction dégâts) / Opus (vrai modèle) | P0 |
| PNJ | PROVISOIRE | `traffic.js`, `enemies.js` | Même silhouette partagée, panique/renversement, gangs avec IA de tir | Pas de variété de silhouette, pas d'animation idle propre en dehors du joueur | Traversent sans regarder (volontaire, documenté) | Personnage joueur | Sonnet | P2 |
| Véhicules | PARTIEL | `vehicle.js` | 16 modèles, physique arcade, dégâts visibles + fumée (v0.14), suspension corrigée (v0.14), roulis, gyrophares | Vitres sans reflet, jantes = disque plein, pas de déformation de carrosserie | Aucun bloquant | — | Sonnet | P1 |
| Pneus / physique véhicule | FONCTIONNEL | `vehicle.js` | Rotation asservie à la vitesse réelle, pivot de direction, adhérence liée à la météo, patinage | — | Aucun | Météo | — | — |
| Trafic | PARTIEL | `traffic.js` | 14 voitures, 18 piétons, 12 garées, recyclage en budget fixe | Pas de feux tricolores ni de priorité aux carrefours | Voitures qui se chevauchent aux carrefours (documenté) | — | Sonnet | P2 |
| Police | FONCTIONNEL | `police.js` | 5 étoiles, poursuite, agents à pied, tirs dès 3 étoiles, arrestation, évasion | Arrestation sans animation ni sommation | Voitures de police qui se coincent (documenté, contournement à 3 sondages) | — | Sonnet | P2 |
| Combat | FONCTIONNEL | `weapons.js` | 6 armes, visée épaule, arme visible et contrastée (v0.13), recul, dégâts par zone (tête ×3, vérifié 78/26), flash, impacts | Pas de ramassage d'arme au sol, pas de tir depuis un véhicule | Le tir part de la caméra, pas du canon (bug documenté, visible collé à un mur) | Personnage | Sonnet | P2 |
| Ennemis | FONCTIONNEL | `enemies.js` | Gangs de quartier (max 8), flash + recul directionnel + barre de vie au coup, butin en argent | Pas de couverture, pas de variété de silhouette | Aucun bloquant | Combat | — | — |
| Visée / arme visible | FONCTIONNEL | `weapons.js`, `main.js` | Alignement canon/visée vérifié à 3,8°, personnage tourné dans le bon sens (v0.13), matériau contrasté + guidon lumineux (v0.13) | — | Aucun connu | — | — | — |
| Santé / mort / respawn | FONCTIONNEL | `main.js`, `player.js` | Écran de conséquence, invulnérabilité 3 s au respawn, perte d'argent, hôpital | Mort = rotation rigide du buste, pas une vraie animation | Aucun | — | — | — |
| Arrestation | FONCTIONNEL | `main.js`, `police.js` | Même séquence que la mort, point d'arrivée au commissariat | Sans animation ni sommation (documenté) | — | Police | — | — |
| Météo | FONCTIONNEL | `weather.js` | 5 temps (clair/nuageux/pluie/brouillard/**orage**), transitions 18 s, éclairs à double flash + tonnerre retardé par la distance (v0.10, vérifié : 1 372 m → 5 s), vent | Pas d'essuie-glace, pas de flaques/éclaboussures | Gouttes un peu pointillistes de près (documenté) | — | — | — |
| Saisons | FONCTIONNEL | `seasons.js` | 4 saisons en continu, palette d'herbe/feuillage, neige avec accumulation et adhérence à 40 % (v0.10) | Pas de variété de silhouette d'arbre à saisonner (une seule forme existe) | Aucun | Monde | — | — |
| Cycle jour/nuit | FONCTIONNEL | `world.js` | Ciel dégradé shader, étoiles, fenêtres qui s'allument, halos de lampadaires | — | Aucun | — | — | — |
| HUD | FONCTIONNEL | `hud.js`, `uiTheme.js` | Thème « Nocturne urbain » centralisé + 2 variantes (contraste, daltonisme) depuis la v0.11, vie/armure avec icône + segments + valeur chiffrée (jamais la couleur seule) | — | Aucun | — | — | — |
| Mini-carte | FONCTIONNEL | `hud.js` | Marqueurs à forme distincte par catégorie (flèche/hexagone/losange, v0.11), grande carte au menu pause | — | Aucun | — | — | — |
| Pause / options | FONCTIONNEL | `menu.js`, `settings.js` | 19 réglages appliqués en direct et persistés, bug d'oscillation du menu corrigé (v0.9→correctif), navigation clavier | Pas de remappage de touches | Aucun bloquant | — | — | — |
| Sauvegarde | PARTIEL | `main.js` | Un seul emplacement localStorage (argent, stats, heure) | Pas de 3 emplacements de sauvegarde (prévu MILESTONES étape 9) | Best-effort si localStorage bloqué (documenté, pas un bug) | — | Sonnet | P3 |
| Audio | FONCTIONNEL | `audio.js` | Tout synthétisé (WebAudio) : moteur, sirène, klaxon, chocs, tir par arme, tonnerre, jingles | Pas de musique ni d'ambiance de fond en boucle | Aucun | — | Sonnet | P3 |
| Missions | PARTIEL | `missions.js` | Tutoriel 4 étapes + 2 jobs répétables (livraison, commande garage) | **Aucune mission scénarisée avec progression/prérequis** — c'est la plus grosse case vide du gameplay | Aucun | — | Sonnet/Opus selon ampleur | P1 |
| Économie | PROVISOIRE | `main.js`, `missions.js` | Argent, primes de job, frais d'hôpital/amende d'arrestation | Pas de business, propriété, revenu passif | — | — | Sonnet | P3 |
| Téléphone | NON COMMENCÉ | — | — | Carte plein écran, contacts, messages, banque — rien n'existe | — | — | — | P2 (si retenu en V1) |
| Personnages multiples | NON COMMENCÉ | — | — | Un seul personnage jouable | — | — | — | Hors V1 |
| Corps / musculation | NON COMMENCÉ | — | — | Aucune stat physique | — | — | — | Hors V1 |
| Performance | FONCTIONNEL | `performance.js` | Panneau de mesures en direct, 4 presets (faible/moyen/élevé/auto), commandes `perf`/`quality`/`stress` | — | Aucun | — | — | — |
| Partage / déploiement | NON COMMENCÉ | — | — | Pas de page de présentation, pas d'hébergement statique choisi, pas d'instructions pour un tiers | — | — | Sonnet | P1 (avant tout partage à des amis) |

## 3. Bugs bloquants

Aucun bug ne rend le jeu injouable ou fait planter la boucle : les six
scripts de régression (jeu, météo, menu, mort, visée, combat) passent sans
erreur console à chaque version depuis la v0.9. Les bugs listés ci-dessous
sont réels mais **non bloquants** :

| Bug | Reproduction | Impact | Priorité | Fichier suspect |
|---|---|---|---|---|
| Le tir part de la caméra, pas du canon | Viser collé à un angle de mur, tirer | La balle peut traverser l'angle à bout portant | P2 | `weapons.js` (raycast depuis `camera.position`) |
| Pas de collision joueur/véhicule à pied | Marcher dans une voiture à l'arrêt | On la traverse | P2 | `player.js` / `traffic.js` |
| Voitures de police qui se coincent | Poursuite longue en zone dense | Se débloquent seules après 2,5 s, visible | P3 | `police.js` |
| Voitures PNJ qui se chevauchent aux carrefours | Trafic dense, pas de feux | Cosmétique | P3 | `traffic.js` |

## 4. Dette technique

- **`ARCHITECTURE.md` est périmé** : il liste 11 fichiers `game/` alors
  qu'il y en a 22 aujourd'hui (`seasons.js`, `weather.js`, `weapons.js`,
  `enemies.js`, `uiTheme.js`, `particles.js`, `performance.js`,
  `settings.js`, `menu.js`, `vehicleEffects.js` manquent). À réécrire dans
  la foulée de ce document.
- **Toutes les silhouettes de personnage partagent 9 primitives** — c'est
  un choix de performance délibéré (documenté dans `ART_DIRECTION.md`),
  mais ça veut dire qu'un futur remplacement par un modèle GLB touchera
  `player.js`, `traffic.js` et `enemies.js` à la fois : les trois
  construisent leur mesh via `buildCharacter()`.
- **Les arbres n'ont qu'une seule forme** (`ART_DIRECTION.md`, déjà noté) :
  tout le travail préparé sur les silhouettes multiples a été annulé en
  cours de route ce cycle (code non testé, aucune régression n'a donc pu
  se produire, mais rien n'a atterri non plus).
- **Aucune ressource de test partagée** : chaque script Playwright de ce
  dépôt vit dans un répertoire de travail temporaire (`scratchpad`), pas
  dans le dépôt lui-même. Un futur repreneur du projet ne les a pas.
- **Presets graphiques et réglages caméra se chevauchent un peu** :
  `camDistance`/`camHeight` (Options → Caméra) et les FOV par contexte sont
  deux familles de réglages ajoutées à des moments différents (v0.10,
  v0.12) ; pas de bug, mais pas unifiées visuellement dans le menu.
