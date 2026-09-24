# PROGRESS

Dernière mise à jour : 2026-09-23 · Version : **v0.27** · Jalon en cours : **6 (sauvegarde complète,
prérequis des missions)** puis 1 (environnement) en parallèle, voir `MILESTONES.md`.

Pour une vue d'ensemble à jour, préférer **`PROJECT_STATUS.md`** (statut système par système,
FONCTIONNEL/PARTIEL/PROVISOIRE/NON COMMENCÉ) et **`V1_SCOPE.md`** (ce qui compte pour la V1).
Ce fichier garde l'historique détaillé et les mesures.

## ✅ Terminé

| Système | Fichier | État |
|---|---|---|
| Ville procédurale, 8 quartiers | `game/world.js` | 115 immeubles en 3 styles de façade, trottoirs, bancs, poubelles, parcs, lampadaires, marquage |
| Cycle jour/nuit (24 h en 12 min) | `game/world.js` | Ciel dégradé, étoiles, fenêtres allumées, halos |
| Collisions | `game/world.js` | AABB en grille spatiale, cercle repoussé |
| Personnage + caméra | `game/player.js` | Marche/course/marche lente/saut, respiration à l'arrêt, caméra épaule anti-mur |
| Effets véhicule | `game/vehicleEffects.js` | Traces et fumée recyclées en anneau |
| Véhicules (16 types) | `game/vehicle.js` | Physique arcade, dégâts visibles, suspension, roulis, gyrophares |
| Circulation et piétons | `game/traffic.js` | 14 voitures, 18 piétons, 12 voitures garées |
| Police 5 étoiles | `game/police.js` | Poursuite, agents à pied, tirs, arrestation, évasion |
| Missions | `game/missions.js` | Tutoriel 4 étapes + 2 jobs répétables |
| HUD et mini-carte | `game/hud.js` | Vie, armure, argent, étoiles, heure, objectif, notifications |
| Son synthétisé | `game/audio.js` | Moteur, sirène, klaxon, chocs, jingles |
| Bus d'événements | `game/events.js` | Découple le jeu de l'interface |
| Console de triche | `game/debug.js` | 14 commandes |
| Menu pause | `game/menu.js` | Navigation clavier, carte, options |
| Réglages | `game/settings.js` | 10 options appliquées en direct et conservées |
| Sauvegarde | `game/main.js` | Argent, stats, heure (localStorage) |
| Combat | `game/weapons.js` | 6 armes, visée épaule, arme en main, recul, dégâts par zone |
| Ennemis | `game/enemies.js` | Gangs de quartier, IA de tir, butin |
| Météo dynamique | `game/weather.js` | 4 temps, transitions 18 s, effets sur conduite, police et piétons |

## 🚧 En cours
Rien — étapes 0 et 1 livrées.

## ⏳ Prévu
Voir `MILESTONES.md`. Prochaine étape : orage (éclairs, tonnerre) et saisons.

## 🐛 Bugs connus

- **Voitures PNJ qui se chevauchent aux carrefours** — pas de gestion de priorité, elles ne
  regardent que ce qui est devant elles. Peu visible, à corriger avec les feux tricolores.
- **Voitures de police qui se coincent** — le contournement d'immeuble est un simple sondage à
  trois directions ; elles se débloquent en marche arrière après 2,5 s, mais ça se voit.
- **Piétons qui traversent la route sans regarder** — comportement volontairement simple ; ils se
  font renverser, ce qui déclenche parfois une étoile « involontaire ».
- **Arrestation un peu brutale** — l'agent attrape le joueur dès 2,4 m pendant 1,2 s, sans
  animation ni sommation.
- **Pas de collision entre le joueur à pied et les véhicules** — on traverse une voiture à l'arrêt.
- **Polices Google non chargées hors ligne** — repli sur les polices système, la mise en page tient.
- **Gouttes de pluie un peu « pointillistes » de près** — ce sont des `Points` texturés, pas de
  vraies traînées ; correct à distance, perfectible au premier plan.
- **Pas de flaques ni d'éclaboussures** — seul le reflet spéculaire du bitume signale le sol mouillé.
- **Caméra qui peut se coincer dans la carrosserie** quand elle est plaquée contre un véhicule.
- **Le tir part de la caméra, pas de l'arme** : à bout portant contre un mur, la balle peut
  traverser l'angle. Visible surtout en visant collé à un obstacle.
- **Pas de ramassage d'arme au sol** : les ennemis ne lâchent que de l'argent.
- **Pas de tir depuis un véhicule.**

## 💡 Idées (hors périmètre v1)
Feux tricolores et priorités · intérieurs visitables · motos · hélicoptère · métro · radio avec
stations · bourse · réseaux sociaux parodiques · multijoueur · easter eggs · succès.

## 📊 Mesures (Chromium, rendu logiciel SwiftShader)
Protocole complet et comparaison avant/après dans **`PERFORMANCE.md`** ; banc d'essai
reproductible dans `bench.mjs`.

Scène figée, qualité élevée, carrefour de Downtown :

| Compteur | Avant | Après | Budget |
| --- | ---: | ---: | ---: |
| Draw calls | 153 | **97** | 500 |
| Triangles | 50 162 | 50 482 | 100 000 |
| Géométries | 321 | **94** | — |
| Meshes dans la scène | 233 | **113** | — |
| Mémoire JS | 15 Mo | **13 Mo** | — |

En jeu, circulation et piétons compris : **≈ 280 draw calls**, **≈ 69 000 triangles**.

- Coût de dix véhicules supplémentaires : **0 géométrie** (50 avant la passe).
- Coût de dix personnages supplémentaires : **0 géométrie** (90 avant la passe).
- Caméra à pied : rapprochée de 15 % (5,4 → 4,6 m), taille du personnage à l'écran
  **17,0 % → 20,7 %**. Le mécanisme anti-blocage (personnage effacé quand la caméra est
  coincée contre un mur) se fie maintenant à un **ratio distance obtenue / distance voulue**,
  indépendant du FOV et de la distance choisis en options — la version précédente, calculée
  à la main, s'était déréglée dès qu'on a rapproché la caméra, effaçant le joueur à moitié
  **en pleine rue**.
- Assiette des véhicules corrigée : le nez plongeait à l'accélération et se relevait au
  freinage — l'inverse de la physique. Vérifié avec la position réelle des phares.
- Trois styles de façade au lieu d'un, fusionnés par style dans chaque îlot : draw calls
  mesurés entre 226 et 301 selon la scène, toujours sous le budget de 500.
- Erreurs console : **0** sur les huit tests automatisés (jeu, météo, menu, mort, visée,
  caméra, saisons, thème).
- Distance de freinage depuis 90 km/h : **12 m** au sec, **17,1 m** sous la pluie.
- Dégâts pistolet : **78 à la tête** (×3), **26 au corps**, **0 au-dessus de la tête**.
- FPS : non mesurable ici faute de GPU — et les millisecondes de rendu du pilote logiciel ne
  veulent rien dire, ce qui est expliqué dans `PERFORMANCE.md`. Le compteur en jeu, lui, lit
  le temps réel et dit la vérité.
