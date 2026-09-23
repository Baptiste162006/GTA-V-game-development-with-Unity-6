# Architecture

## Vue d'ensemble

```
index.html          page + HUD + thème (aucun framework)
vendor/             Three.js r160 embarqué (MIT)
game/
  main.js           boucle de jeu, états, entrée/sortie de véhicule, crimes, respawn, sauvegarde
  world.js          génération de la ville, quartiers, cycle jour/nuit, collisions
  player.js         personnage (mesh + animation procédurale) et caméra 3e personne
  vehicle.js        carrosseries, physique arcade, dégâts, suspension, gyrophares
  vehicleEffects.js traces de pneus et fumée, recyclées en anneau
  traffic.js        circulation PNJ, piétons, voitures garées
  police.js         niveau de recherche, poursuite, agents à pied, arrestation
  weapons.js        armes, visée, dégâts par zone, impacts
  enemies.js        gangs de quartier, IA de tir, réactions aux coups
  missions.js       machine à étapes, tutoriel, jobs répétables, marqueurs
  weather.js        météo (clair/nuageux/pluie/brouillard/orage), éclairs, vent
  seasons.js        4 saisons, neige, accumulation et adhérence
  particles.js      champ de particules partagé (pluie, neige, feuilles)
  hud.js            HUD DOM + mini-carte canvas 2D
  uiTheme.js        tokens de couleur centralisés, 3 thèmes (dont daltonisme)
  menu.js           menu pause, navigation clavier/souris
  settings.js       réglages persistés (19), appliqués en direct
  performance.js    compteurs en direct, presets graphiques
  audio.js          synthèse sonore WebAudio (moteur, sirène, chocs, tonnerre, jingles)
  input.js          clavier physique (AZERTY/QWERTY) et souris
  events.js         bus d'événements (découple le jeu de l'interface)
  debug.js          console de triche
```

Cette liste a été mise à jour le 2026-09-23 — elle avait pris du retard sur
le code (10 fichiers manquaient). Voir `PROJECT_STATUS.md` pour l'état
détaillé de chaque système.

## Principes

**Aucun asset externe.** Tout est généré : les façades et les fenêtres allumées sont des textures
canvas, les personnages et les véhicules sont assemblés en boîtes, les sons sont des oscillateurs.
Conséquence : le dépôt fait quelques centaines de kilo-octets et il n'y a rien à télécharger.

**Bus d'événements.** `events.js` sert de point de rencontre : le jeu émet `money`, `wanted`,
`notify`, `objective`, `big-message`, le HUD écoute. Aucun système de jeu ne connaît le DOM.

**Recyclage plutôt que création.** Voitures, piétons et voitures de police sont réutilisés dans un
budget fixe (14 / 18 / 12 + 6 unités) : ceux qui s'éloignent sont supprimés, d'autres apparaissent
autour du joueur. C'est l'équivalent ici de l'object pooling.

**Collisions.** Les immeubles sont stockés en AABB dans une grille spatiale indexée par îlot
(`world.grid`). Un piéton ou un joueur est un cercle qu'on repousse ; un véhicule est testé par
deux cercles (avant / arrière) pour glisser le long des murs au lieu de s'y coller.

**Budget de rendu.** Un seul matériau de façade partagé par quartier, `InstancedMesh` pour le
marquage au sol, les arbres, les lampadaires et leurs halos. Mesuré : ~380 draw calls,
~48 000 triangles.

## Correspondance avec les scripts Unity prévus

| Script Unity du plan | Équivalent ici |
|---|---|
| `PlayerController.cs` | `game/player.js` (classe `Player`) |
| `CameraController.cs` | `game/player.js` (classe `ThirdPersonCamera`) |
| `VehicleController.cs` | `game/vehicle.js` (classe `Vehicle`) |
| `MissionManager.cs` | `game/missions.js` |
| `PoliceSystem.cs` | `game/police.js` |
| `WorldManager.cs` | `game/world.js` |
| `UIManager.cs` | `game/hud.js` |
| `AudioManager.cs` | `game/audio.js` |
| `GameEvents.cs` | `game/events.js` |
| `EconomyManager.cs` | dans `main.js` (argent, amendes) et `missions.js` (primes) |
| `SaveSystem.cs` | `main.js` (`save` / `loadSave`, localStorage) |

Les ScriptableObjects deviennent ici de simples objets de données : `VEHICLE_SPECS` dans
`vehicle.js`, `DISTRICTS` dans `world.js`, les définitions d'étapes dans `missions.js`.
Ajouter un véhicule ou un job ne demande aucune nouvelle classe.

## Ajouter du contenu

**Un véhicule** — une entrée dans `VEHICLE_SPECS` (accélération, vitesse de pointe, braquage,
masse, couleurs, dimensions). Il apparaîtra dans la circulation et au stationnement.

**Un quartier** — une entrée dans `DISTRICTS` (couleur, hauteurs min/max, proportion de parcs) et
une règle dans `districtAt()`.

**Un job** — un appel à `start(nom, étapes)` dans `missions.js`. Une étape = `{ text, marker,
check, time?, failIf? }`. `check` est évalué à chaque frame, `marker` pose le cylindre lumineux
et le point sur la mini-carte.
