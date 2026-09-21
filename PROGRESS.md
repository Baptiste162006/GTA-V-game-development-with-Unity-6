# PROGRESS

Dernière mise à jour : 2026-09-21 · Version : **v0.2** · Étape en cours : **2 (orage et saisons)**

## ✅ Terminé

| Système | Fichier | État |
|---|---|---|
| Ville procédurale, 8 quartiers | `game/world.js` | 98 immeubles, trottoirs, parcs, lampadaires, marquage |
| Cycle jour/nuit (24 h en 12 min) | `game/world.js` | Ciel dégradé, étoiles, fenêtres allumées, halos |
| Collisions | `game/world.js` | AABB en grille spatiale, cercle repoussé |
| Personnage + caméra | `game/player.js` | Marche/course/marche lente/saut, caméra anti-mur |
| Véhicules (6 types) | `game/vehicle.js` | Physique arcade, dégâts, roulis, gyrophares |
| Circulation et piétons | `game/traffic.js` | 14 voitures, 18 piétons, 12 voitures garées |
| Police 5 étoiles | `game/police.js` | Poursuite, agents à pied, tirs, arrestation, évasion |
| Missions | `game/missions.js` | Tutoriel 4 étapes + 2 jobs répétables |
| HUD et mini-carte | `game/hud.js` | Vie, armure, argent, étoiles, heure, objectif, notifications |
| Son synthétisé | `game/audio.js` | Moteur, sirène, klaxon, chocs, jingles |
| Bus d'événements | `game/events.js` | Découple le jeu de l'interface |
| Console de triche | `game/debug.js` | 14 commandes |
| Sauvegarde | `game/main.js` | Argent, stats, heure (localStorage) |
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

## 💡 Idées (hors périmètre v1)
Feux tricolores et priorités · intérieurs visitables · motos · hélicoptère · métro · radio avec
stations · bourse · réseaux sociaux parodiques · multijoueur · easter eggs · succès.

## 📊 Mesures (Chromium, rendu logiciel SwiftShader)
- Draw calls : **≈ 290** (budget : 500)
- Triangles : **≈ 66 000** (budget : 100 000)
- Erreurs console : **0**
- Distance de freinage depuis 90 km/h : **12,6 m** au sec, **17,4 m** sous la pluie
- FPS : non mesurable ici (pas de GPU) ; le compteur en jeu dit désormais la vérité
