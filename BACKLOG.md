# BACKLOG

Organisé le 2026-09-24 selon l'**ordre de travail V1** (étapes 0 à 12 de
`MILESTONES.md`) : on ne passe pas à l'étape suivante tant que la
précédente n'est pas validée. Priorité P0 (bloquant V1) à P3 (confort).
Effort S (< 1 session), M (1-2), L (plusieurs). Modèle : Sonnet = un
fichier ou un système ; Opus = plusieurs systèmes à faire tenir ensemble.
Statut « À faire » sauf mention contraire.

## Étape 0 — Stabilisation

| Item | P | Effort | Dépendances | Statut | Modèle | Description |
|---|---|---|---|---|---|---|
| Collision joueur/véhicules à pied | — | — | — | ✅ Fait v0.23 | — | Rectangle au sol orienté pour chaque voiture (garée, en circulation, police) ; deuxième passe après le déplacement du trafic ; on monte en mesurant depuis la carrosserie (bus par l'avant possible). |
| Origine du tir | **P0** | M | `weapons.js` | À faire (vérifié : `camera.position + 1,2 m`) | Sonnet | Viser depuis la caméra, mais vérifier le trajet réel depuis l'arme : dos à un angle de mur, la balle ne doit plus passer. |
| Sauvegarde corrompue | **P0** | S | `main.js`, `index.html` | À faire (vérifié : ignorée puis écrasée) | Sonnet | Message clair, sauvegarde illisible mise de côté (pas écrasée), choix de repartir à zéro. |
| Voitures de police coincées | P3 | S | `police.js` | Ouvert | Sonnet | Se débloquent seules en 2,5 s. |
| Voitures PNJ qui se chevauchent aux carrefours | P3 | M | `traffic.js` | Ouvert (V2 avec les feux) | Sonnet | Cosmétique. |
| Job Livraison qui plantait ; voiture garée impossible à reprendre ; tutoriel rejoué à chaque lancement | — | — | — | ✅ Corrigés v0.22 | — | — |

## Étape 1 — Audit et documentation

| Item | P | Effort | Statut | Description |
|---|---|---|---|---|
| PROJECT_STATUS, V1_SCOPE, VERTICAL_SLICE, MILESTONES, BACKLOG | — | — | ✅ Fait | Tenus à jour à chaque version. |
| MISSIONS, AUDIO_SYSTEM, CUSTOMIZATION | — | — | ✅ Fait 2026-09-24 | Architectures proposées, à valider. |

## Étape 2 — Missions (`MISSIONS.md`)

| Item | P | Effort | Dépendances | Statut | Modèle | Description |
|---|---|---|---|---|---|---|
| Système de missions + 6 missions | — | — | — | ✅ Fait v0.22 | — | Prérequis, contacts, étapes, échecs, nettoyage, réessai, sauvegarde. |
| Confirmation « Appuie sur E » au contact | P1 | S | `missions.js`, `hud.js` | À faire | Sonnet | Aujourd'hui la mission part dès qu'on entre dans la zone : on peut la lancer par accident. E est libre. |
| Missions verrouillées affichées grisées + raison | P1 | S | `menu.js` | À faire | Sonnet | « Verrouillée — termine “Dette impayée” » dans le menu Missions. |
| Bouton « Réessayer » sur l'écran d'échec | P2 | S | `missions.js`, `main.js` | À faire | Sonnet | Relance la mission sans retourner au contact. |
| Échec par détection police (`wanted ≥ X`) | P2 | S | `story.js` | À faire | Sonnet | Une ligne par mission de discrétion. |
| Étape `survivre` (X s ou vagues) | P2 | S | `missions.js` | À faire | Sonnet | Un chrono qui réussit au lieu d'échouer. |
| Étape `proteger` (PNJ allié) | P2 | M | `enemies.js`, `missions.js` | À faire | Opus | Aucun allié n'existe : PNJ avec vie, ciblé par les ennemis, échec narratif prioritaire s'il meurt. |
| Étape `dialogue` | P3 | M | `hud.js`, `missions.js` | À faire | Sonnet | Boîte de texte, commandes figées le temps de lire. |
| 2 missions de plus (vers 8) | P2 | M | `story.js` | À faire | Sonnet | Contenu seul. |
| Checkpoints / reprise en pleine mission | V1.1 | L | sauvegarde, `story.js` | Reporté | Opus | Choix assumé pour la V1 : on repart du contact (`MISSIONS.md` §6). |
| Réputation par quartier, téléphone | V2 | L | — | Reporté | Opus | Systèmes inexistants ; le téléphone est SHOULD HAVE après la V1. |

## Étape 3 — UI / HUD / mini-carte / menus

| Item | P | Effort | Dépendances | Statut | Modèle | Description |
|---|---|---|---|---|---|---|
| Options en sections (Vidéo/Audio/Contrôles/Accessibilité/À propos) + réinitialiser | P1 | M | `menu.js`, `settings.js` | À faire | Sonnet | Les 20 réglages existent, seule l'organisation manque. |
| Vérification HUD multi-ratios et tailles | P1 | S | `hud.js` | À faire | Sonnet | Script 16:9 / 16:10 / 21:9 / étroit, `hudScale` 75 et 150 %, aucune valeur NaN. |
| Remappage des touches | P1 | M | `input.js`, `menu.js` | À faire | Sonnet | Action → touche, conflits signalés, persisté. |
| Texte d'accueil « huit quartiers » | P1 | S | `index.html` | À faire | Sonnet | Il y en a 6. |
| Écran de chargement avec progression | P2 | S | `main.js`, `index.html` | À faire | Sonnet | — |
| Flèche 3D « suivez le point » (style GPS) | P2 | M | `hud.js`, `missions.js` | À faire | Sonnet | Quand l'objectif est loin ou masqué. |
| Lisibilité des icônes à `hudScale` 75 % | P2 | S | `hud.js` | À faire | Sonnet | — |
| Zoom mini-carte | P3 | S | `hud.js` | À faire | Sonnet | Échelle fixe aujourd'hui. |
| Icônes par type de véhicule sur la mini-carte | P3 | M | `hud.js`, `traffic.js` | À faire | Sonnet | Seule la police a une forme dédiée. |
| Raccourci pour rappeler l'objectif | P3 | S | `input.js`, `hud.js` | À faire | Sonnet | — |
| Distinguer « recherché » et « poursuite active » | P3 | S | `hud.js`, `police.js` | À faire | Sonnet | — |
| Menu pause complet (Sauvegarder, Réinitialiser, Quitter), sauvegarde complète | — | — | — | ✅ Fait v0.19 | — | — |
| Distance à l'objectif, barre de rechargement | — | — | — | ✅ Fait v0.20 | — | — |
| Mini-carte « suit le cap », boussole | — | — | — | ✅ Fait v0.21 | — | — |
| Contacts d'histoire sur les cartes | — | — | — | ✅ Fait v0.22 | — | — |

## Étape 4 — Audio de base (`AUDIO_SYSTEM.md`)

| Item | P | Effort | Dépendances | Statut | Modèle | Description |
|---|---|---|---|---|---|---|
| Architecture audio : bus + limiteur + pool de voix | **P0** | L | `audio.js` | À faire | Opus | Master → Musique/Effets/Ambiance/Véhicules/Interface, compresseur de sortie, plafond 24 voix et par type, `stop()` explicite. Corrige le risque de saturation actuel (tirs branchés sans limite sur `master`). |
| Curseurs de volume par bus | P1 | S | Bus, `settings.js`, `menu.js` | À faire | Sonnet | `engineVolume`/`sirenVolume` gardés en sous-niveaux ; réglages existants valides. |
| Fondu des bus en pause et à la mort | P1 | S | Bus | À faire | Sonnet | Interface seule reste audible. |
| Armes : variation de tir, rechargement | P1 | S | Pool, `weapons.js` | À faire | Sonnet | Rechargement muet aujourd'hui ; 2 clics calés sur `spec.reload`. |
| Impacts chair / béton | P1 | S | Pool, `weapons.js` | À faire | Sonnet | Le code distingue déjà cible touchée et mur. |
| Véhicules : 3 profils, démarrage/arrêt, roulement, bosse, klaxon par gabarit | P1 | M | Bus, `vehicle.js` | À faire | Sonnet | Profil `sound` dans `VEHICLE_SPECS`. |
| Ambiance ville + vent | P1 | M | Bus | À faire | Sonnet | Plus dense à Downtown, plus calme la nuit ; vent lié à `weather.wind`. |
| Pas du joueur (asphalte / trottoir) | P1 | S | Pool, `player.js` | À faire | Sonnet | Sur la phase de marche existante, un son par pas. |
| Sons d'interface | P2 | S | Bus Interface, `menu.js` | À faire | Sonnet | Survol, validation, retour, sauvegarde, argent. |
| Relance audio au retour sur l'onglet | P2 | S | `audio.js` | À faire | Sonnet | `visibilitychange`. |
| Script `audiotest` | P1 | S | Bus + pool | À faire | Sonnet | Plafond de voix, pause, curseurs à 0, aucune source qui traîne. |
| Impacts métal (tirs sur véhicules) | V1.1 | M | détection de tir sur véhicule | Reporté | Sonnet | — |
| Moteurs des PNJ proches, 5 profils | V1.1 | M | — | Reporté | Sonnet | — |
| Boucle musicale de menu | V1.1 | M | Bus Musique | Reporté | Sonnet | — |
| Impacts bois / verre, radios | V2 | — | surfaces et contenu musical inexistants | Reporté | — | — |

## Étape 5 — Direction artistique environnement

| Item | P | Effort | Dépendances | Statut | Modèle | Description |
|---|---|---|---|---|---|---|
| Arbres et végétation (LOT 1) | P1 | M | `world.js`, `seasons.js` | À faire (essai abandonné, rien de commité) | Sonnet | 4 silhouettes, 3 tailles, teintes, buissons, herbe près du joueur, types par quartier, vent lié à la météo. |
| Façades 3 → 6-8 styles + mobilier (LOT 2) | P1 | M | `world.js` | À faire | Sonnet | Vitrines, enseignes, panneaux, abribus, bornes incendie, lampadaires variés. |
| Zone vitrine 200 × 200 m + garage/station-service | P1 | L | LOT 1 et 2 | À faire | Sonnet (Opus si la zone touche trafic et missions) | `VERTICAL_SLICE.md`. |

## Étape 6 — Personnage et caméra

| Item | P | Effort | Dépendances | Statut | Modèle | Description |
|---|---|---|---|---|---|---|
| Inventaire des animations manquantes | P1 | S | `player.js` | À faire | Sonnet | Vérifier dans le code : atterrissage, geste de rechargement, entrée/sortie de véhicule. |
| Animations manquantes | P2 | M | inventaire | À faire | Sonnet | Celles que l'inventaire confirmera. |
| Réaction du joueur aux dégâts, arme visible, visée | — | — | — | ✅ Fait v0.13-v0.18 | — | — |
| Personnage GLB/glTF | Hors séquence | L | fichier `.glb` sous licence | Bloqué | Opus | Rien à l'écran sans asset fourni. |

## Étape 7 — Véhicules et conduite

| Item | P | Effort | Dépendances | Statut | Modèle | Description |
|---|---|---|---|---|---|---|
| Choisir les 5 véhicules de la démo (camion ou taxi) | P1 | S | — | À décider par toi | — | Les deux existent. |
| Jantes distinctes du pneu | P1 | S | `vehicle.js` | À faire | Sonnet | — |
| Véhicule détruit (feu puis explosion) | P2 | M | `vehicle.js`, `main.js`, audio | À faire | Sonnet | Seule source d'explosion possible du jeu. |
| Vitres avec reflet | P2 | S | `vehicle.js` | À faire | Sonnet | — |
| Garage / couleurs de véhicules | P3 | M | `VEHICLE_SPECS` | À faire | Sonnet | SHOULD HAVE. |

## Étape 8 — Combat et ennemis

| Item | P | Effort | Dépendances | Statut | Modèle | Description |
|---|---|---|---|---|---|---|
| 3-5 profils d'ennemis | P1 | S | `enemies.js` | À faire | Sonnet | Portée, arme, agressivité, vie. |
| Couvertures simples | P2 | M | `enemies.js`, `world.js` | À faire (remonté de V2 par ton ordre) | Opus | Murs et voitures. |
| Ramassage d'arme au sol | P2 | M | `weapons.js`, `enemies.js` | À faire | Sonnet | — |

## Étape 9 — Personnalisation (`CUSTOMIZATION.md`)

| Item | P | Effort | Dépendances | Statut | Modèle | Description |
|---|---|---|---|---|---|---|
| Architecture : catalogue + `applyAppearance` en place + 5ᵉ matériau (chaussures) | **P0** de l'étape | L | `player.js`, nouveau `appearance.js`, sauvegarde | À faire | Opus | Ne jamais reconstruire le joueur (arme, caméra, estompage) ; formes partagées. |
| Menu Garde-robe (pause, caméra en orbite) | P1 | M | architecture | À faire | Sonnet | Essayer / Confirmer / Annuler / Réinitialiser, verrouillés grisés. |
| Contenus V1 | P1 | M | architecture | À faire | Sonnet | 4 coiffures × 6 couleurs, 6 hauts, 4 bas, 3 chaussures, lunettes/casquette/sac. |
| Prix et récompenses de mission | P2 | S | menu, `story.js` | À faire | Sonnet | — |
| Variété des PNJ par le catalogue | P2 | S | architecture | À faire | Sonnet | Gain visible immédiat sur les piétons. |
| Magasins dans la ville, miroir en planque | V1.1 | M | menu, contacts | Reporté | Opus | Même mécanique de zone que les missions. |
| Barbe, formes de tête, bonnet/masque/bijoux | V1.1 | M | — | Reporté | Sonnet | — |
| Tatouages, éditeur de visage, effets de jeu des vêtements | V2 | L | — | Reporté | Opus | Champ `effects` prévu dans les données. |

## Étape 10 — Vertical slice

| Item | P | Effort | Dépendances | Statut | Modèle | Description |
|---|---|---|---|---|---|---|
| Mission « vitrine » (boucle en 9 étapes) | **P0** de l'étape | M | zone vitrine (étape 5) | À faire | Opus | Écrite dans `story.js`. |
| Validation : script de bout en bout + mesures par étape | P0 | M | mission vitrine | À faire | Sonnet | Draw calls/FPS pendant chaque étape, zéro erreur console. |

## Étape 11 — Optimisation et tests amis

| Item | P | Effort | Dépendances | Statut | Modèle | Description |
|---|---|---|---|---|---|---|
| Déploiement statique partageable | P1 | S | — | À faire | Sonnet | GitHub Pages ou équivalent. |
| Mesure sur GPU réel | P1 | S | ta machine | À faire | — | Hors de cet environnement. |
| Tests par 2-3 personnes extérieures | P1 | M | déploiement | À faire | — | Compréhension, plaisir, bugs, lisibilité. |

## Étape 12 — V1 release

| Item | P | Effort | Statut | Description |
|---|---|---|---|---|
| Page de présentation (contrôles, objectifs, bugs connus, changelog) | P0 | S | À faire | — |

## Checklist de tests manuels avant chaque push

**Gameplay** — entrer/sortir de chaque gabarit de véhicule, y remonter ;
tir, visée, changement d'arme, rechargement, munitions à zéro ; mort et
réapparition (à pied et en véhicule) ; arrestation ; perte d'étoiles ;
mission réussie, échouée, relancée ; argent jamais négatif.
**HUD/menus** — aucun chevauchement sur 4 ratios ; navigation clavier et
souris sans oscillation ; Échap ferme toujours le niveau courant ;
réglages appliqués en direct et conservés après rechargement.
**Sauvegarde** — sauvegarder, recharger, tout est là ; ancienne
sauvegarde lisible ; réinitialiser puis annuler ne change rien.
**Audio** — aucun son en pause ou après la mort ; volumes à zéro muets ;
aucune saturation en fusillade ; reprise après changement d'onglet.
**Performance** — draw calls < 500 dans les 6 quartiers, jour/nuit, sous
orage ; `renderer.info.memory` stable après 10 min.
**Visuel** — personnage jamais invisible en rue dégagée ; caméra jamais
dans un mur ; pas de « Pluie » affichée quand il neige.

Règle : **un bug introduit par une modification est corrigé avant toute
autre chose**, ou la modification est annulée.

## V2 / hors V1

Liste et raisons : `V1_SCOPE.md`, « Reporté en V2 ».
