# BACKLOG

Un endroit où noter une idée sans qu'elle interrompe le jalon en cours dans
`MILESTONES.md`. Priorité P0 (bloquant) à P3 (confort). Effort S/M/L.

## Bugs

| Item | Priorité | Effort | Dépendances | Statut | Modèle | Description |
|---|---|---|---|---|---|---|
| Tir depuis la caméra, pas le canon | P2 | M | `weapons.js` | Ouvert | Sonnet | À bout portant contre un mur, la balle traverse l'angle. Corriger l'origine du rayon. |
| Pas de collision joueur/véhicule à pied | P2 | M | `player.js`, `traffic.js` | Ouvert | Sonnet | On traverse une voiture à l'arrêt. |
| Voitures de police coincées | P3 | S | `police.js` | Ouvert | Sonnet | Contournement à 3 sondages, se débloquent en 2,5 s, visible. |
| Voitures PNJ qui se chevauchent aux carrefours | P3 | M | `traffic.js` | Ouvert, lié aux feux tricolores | Sonnet | Cosmétique, pas de priorité aux carrefours. |

## Gameplay

| Item | Priorité | Effort | Dépendances | Statut | Modèle | Description |
|---|---|---|---|---|---|---|
| Missions scénarisées (5-8, jalon 7) | P0 | L | Moteur d'étapes existant (`missions.js`) | Non commencé | Sonnet/Opus | Le plus gros manque de contenu du projet aujourd'hui. |
| Réaction visuelle du joueur aux dégâts | P0 | S | `player.js` | Non commencé | Sonnet | Symétrique à celle des ennemis, absente aujourd'hui. |
| 3-5 profils d'ennemis | P1 | S | `enemies.js` | Non commencé | Sonnet | Travail de données sur un système déjà en place. |
| Ramassage d'arme au sol | P2 | M | `weapons.js`, `enemies.js` | Non commencé | Sonnet | — |
| Tir depuis un véhicule | P3 | L | `weapons.js`, `vehicle.js` | Non commencé | Sonnet | — |
| Feux tricolores et priorité aux carrefours | P3 | L | `traffic.js`, `world.js` | Non commencé | Opus (touche plusieurs systèmes) | — |
| Téléphone limité (carte, missions, contacts, réglages) | P2 (si V1) | L | Missions scénarisées d'abord | Non commencé | Opus | N'aurait rien à afficher avant les missions. |
| Garage / couleurs de véhicules | P3 | M | `VEHICLE_SPECS` a déjà les couleurs | Non commencé | Sonnet | Surtout une interface. |

## Art

| Item | Priorité | Effort | Dépendances | Statut | Modèle | Description |
|---|---|---|---|---|---|---|
| Variété d'arbres (3+ formes) | P0 | M | `world.js` | Travail préparé puis abandonné ce cycle, à refaire | Sonnet | Le meilleur rapport effort/résultat identifié dans `ART_DIRECTION.md`. |
| Façades 3→6-8 styles | P1 | M | `world.js`, suite logique de la v0.15 | Non commencé | Sonnet | — |
| Vitrines et enseignes | P1 | M | Façades étendues | Non commencé | Sonnet | Textures, pas de nouveau volume. |
| Panneaux, abribus, bornes incendie | P2 | S | Suite du mobilier v0.15 | Non commencé | Sonnet | Même pipeline `InstancedMesh` que bancs/poubelles. |
| Jantes distinctes du pneu | P1 | S | `vehicle.js` | Non commencé | Sonnet | — |
| Vitres de véhicule avec reflet | P2 | S | `vehicle.js` | Non commencé | Sonnet | — |
| Déformation de carrosserie après choc | P3 | M | `vehicle.js` | Non commencé | Sonnet | Aujourd'hui seule la teinte change avec les dégâts. |
| Architecture de personnage GLB/glTF | P2 | L | Aucun asset `.glb` disponible dans cet environnement | Non commencé | Opus | Ne changera rien à l'écran sans fichier fourni — voir `MILESTONES.md` « Hors séquence ». |

## Audio

| Item | Priorité | Effort | Dépendances | Statut | Modèle | Description |
|---|---|---|---|---|---|---|
| Musique/ambiance de fond en boucle | P3 | M | `audio.js` | Non commencé | Sonnet | Tout le reste est déjà synthétisé et fonctionnel. |

## UI

| Item | Priorité | Effort | Dépendances | Statut | Modèle | Description |
|---|---|---|---|---|---|---|
| Remappage des touches | P3 | M | `input.js`, `menu.js` | Non commencé | Sonnet | — |
| 3 emplacements de sauvegarde | P3 | S | `main.js` | Non commencé | Sonnet | Un seul aujourd'hui, suffisant pour la V1. |

## Performance

| Item | Priorité | Effort | Dépendances | Statut | Modèle | Description |
|---|---|---|---|---|---|---|
| Mesure sur GPU réel (hors SwiftShader) | P1 | S | Nécessite un navigateur avec accélération matérielle — hors de cet environnement | Non commencé | — | Tout ce qui a été mesuré jusqu'ici l'a été en rendu logiciel. |
| Déploiement statique partageable | P0 | S | Aucune | Non commencé | Sonnet | Condition du jalon 8 (test avec des amis). |

## Missions

Voir « Gameplay » ci-dessus — pas de sous-catégorie séparée tant que le
système de missions scénarisées n'existe pas.

## V1.1

| Item | Priorité | Effort | Description |
|---|---|---|---|
| Congères et neige sur les surfaces autres que le sol | P3 | M | La mécanique de neige existe déjà (accumulation, adhérence) ; ce qui resterait est décoratif. |
| Vraie économie/business/propriétés | P3 | L | — |
| Personnage alternatif | P3 | L | Deuxième silhouette jouable. |

## V2 / hors scope

69 missions principales, 50 secondaires, 100 véhicules, 35 armes, 30
stations de radio, plusieurs histoires complètes, des dizaines d'intérieurs
visitables, multijoueur, rendu photoréaliste façon GTA V/VI, ville de 4 km²
entièrement détaillée. Voir `V1_SCOPE.md` pour la justification.
