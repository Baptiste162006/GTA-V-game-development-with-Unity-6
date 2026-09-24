# San Felipe City

Prototype de jeu open-world 3D jouable dans le navigateur. Une ville de 0,5 km² en six quartiers,
de la circulation, des piétons, un cycle jour/nuit, du vol de voiture et une police à cinq étoiles.

> **Pourquoi pas Unity 6 ?** Le nom du dépôt vient du plan initial. Unity ne peut pas tourner dans
> l'environnement où ce code a été écrit (pas d'éditeur, pas d'Asset Store, rien de compilable ni de
> testable). Le choix s'est donc porté sur **Three.js / JavaScript**, qui est l'« Alternative 2 » du
> plan B : le résultat est **réellement jouable et testé**, tout de suite, sans installation.
> Voir [ARCHITECTURE.md](ARCHITECTURE.md) pour la correspondance avec les scripts Unity prévus.

## Lancer le jeu

Le jeu a besoin d'un petit serveur HTTP local (les modules ES ne se chargent pas en `file://`) :

```bash
git clone https://github.com/Baptiste162006/GTA-V-game-development-with-Unity-6.git
cd GTA-V-game-development-with-unity-6
npx http-server -p 8080      # ou : python3 -m http.server 8080
```

Puis ouvre <http://localhost:8080>. Aucune dépendance à installer : Three.js r160 est embarqué
dans `vendor/`, et il n'y a **aucun asset à télécharger** — ville, personnages, véhicules,
textures et sons sont tous générés par le code.

## Contrôles

| Touche | Action |
|---|---|
| `Z Q S D` / `W A S D` / flèches | Se déplacer (les deux dispositions clavier fonctionnent) |
| `Maj` | Courir · `Ctrl` : marcher lentement |
| `Espace` | Sauter (à pied) · frein à main (en voiture) |
| `F` | Monter dans un véhicule / en sortir |
| `H` | Klaxon |
| Souris | Caméra · molette : zoom |
| `P` ou `Échap` | Pause et statistiques |
| `²` ou `` ` `` | Console de triche |

Liste complète : [CONTROLS.md](CONTROLS.md).

## Ce qui est jouable aujourd'hui

- **Ville** — 6 quartiers (Downtown, Little Tokyo, Mirador Hills, Zone Industrielle, Beachside,
  Vieille Ville), ~100 immeubles, trottoirs, parcs, lampadaires, marquage au sol.
- **Cycle jour/nuit** — 24 h en 12 min : ciel dégradé, étoiles, fenêtres qui s'allument,
  halos de lampadaires, phares automatiques.
- **Météo dynamique** — clair, nuageux, pluie, brouillard, qui s'enchaînent d'eux-mêmes en
  transitions de 18 s : ciel qui se couvre, pluie, bitume mouillé, brouillard qui mange la
  distance. Et ça se joue : sous la pluie on freine 40 % plus long, dans le brouillard la
  police vous repère de bien moins loin, et les trottoirs se vident.
- **À pied** — marche, course, marche lente, saut, animation procédurale, caméra 3e personne
  qui évite les murs.
- **Véhicules** — 16 types, des deux-roues au bus (citadine, berline, sportive, muscle car,
  luxe, 4×4, pick-up, taxi, camionnette, camion, bus, police, ambulance, pompiers, scooter, moto), physique
  arcade, frein à main, dégâts de carrosserie, roues qui braquent et roulent vraiment,
  plongée au freinage, feux stop, traces de pneus et fumée au drift.
- **Vol de voiture** — voitures garées et carjacking d'un véhicule occupé (le conducteur est
  éjecté, la police est prévenue).
- **Circulation et piétons** — 14 voitures qui suivent la trame des rues, s'arrêtent derrière
  celles qui les précèdent et tournent aux carrefours ; 18 piétons qui marchent, paniquent et
  se font renverser.
- **Combat** — 6 armes (poings, pistolet, UZI, fusil à pompe, fusil d'assaut, fusil de
  précision) avec chargeurs, rechargement, recul, visée à l'épaule et dispersion. Dégâts par
  zone (tête ×3), traçantes et impacts visibles, détonations synthétisées par arme.
- **Ennemis** — des gangs peuplent la Zone Industrielle et la Vieille Ville : ils gardent
  leurs distances, ripostent, se préviennent entre eux quand l'un d'eux est touché, et
  laissent de l'argent en mourant.
- **Police** — 5 niveaux de recherche, voitures qui poursuivent et évitent les immeubles, agents
  qui descendent de voiture et arrêtent le joueur, tirs à partir de 3 étoiles, zone de recherche
  à quitter pour les semer.
- **Missions** — tutoriel en 4 étapes, puis jobs répétables (livraison chronométrée, commande de
  véhicule pour le garage) avec récompenses.
- **Économie** — argent, primes de mission, frais d'hôpital (-500 $) et amende d'arrestation (-250 $).
- **HUD** — mini-carte avec îlots, trafic, police et zone de recherche ; vie, armure, argent,
  étoiles, heure, quartier, objectif, notifications.
- **Son** — moteur, sirène, klaxon, chocs et jingles entièrement synthétisés (WebAudio), aucun fichier.
- **Console de triche** — `god`, `give all`, `gang 3`, `weather rain`, `money`, `stars`,
  `spawn`, `tp`, `time`, `heal`, `noclip`, `fps`…
- **Sauvegarde** — argent, statistiques et heure conservés dans le navigateur.

## Ce qui n'est pas là

Pas d'avion ni de bateau, pas d'intérieurs visitables, pas d'orage ni de neige,
pas de saisons, pas de téléphone, pas de personnages multiples, pas de customisation de
véhicule, pas de missions scénarisées, pas de ramassage d'armes au sol ni de tir en voiture.
Le détail de la suite est dans [MILESTONES.md](MILESTONES.md), l'état exact dans [PROGRESS.md](PROGRESS.md).

## Performance

Testé automatiquement dans Chromium (Playwright) : ~290 draw calls, ~66 000 triangles,
pour un budget de 500 et 100 000. Le test tourne en rendu **logiciel** (SwiftShader, sans GPU)
et ne dit donc rien du framerate réel : c'est le budget de rendu qui est la mesure utile ici.

## Licence

Code du jeu : libre d'usage. Three.js r160 (`vendor/`) est sous licence MIT — voir
`vendor/THREE-LICENSE.txt`.
