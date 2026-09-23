# BACKLOG

Priorité P0 (bloquant V1) à P3 (confort). Effort S (< 1 session), M (1-2),
L (plusieurs). Modèle : Sonnet = un fichier/un système ; Opus = plusieurs
systèmes à faire tenir ensemble. Mis à jour le 2026-09-23 après
vérification dans le code (voir `V1_SCOPE.md`, « Corrections »).

## Bugs connus

| Item | P | Effort | Dépendances | Statut | Modèle | Description |
|---|---|---|---|---|---|---|
| Texte d'accueil « huit quartiers » | P1 | S | `index.html` | Ouvert | Sonnet | Il y en a 6. Correction de texte. |
| Tir depuis la caméra, pas le canon | P2 | M | `weapons.js` | Ouvert | Sonnet | À bout portant contre un angle de mur, la balle passe. |
| Pas de collision joueur/véhicule à pied | P2 | M | `player.js`, `traffic.js` | Ouvert | Sonnet | On traverse une voiture à l'arrêt. |
| Voitures de police coincées | P3 | S | `police.js` | Ouvert | Sonnet | Se débloquent seules en 2,5 s. |
| Voitures PNJ qui se chevauchent aux carrefours | P3 | M | `traffic.js` | Ouvert (V2 avec les feux) | Sonnet | Cosmétique. |

## Gameplay

| Item | P | Effort | Dépendances | Statut | Modèle | Description |
|---|---|---|---|---|---|---|
| Sauvegarde complète + menu Sauvegarder / Réinitialiser | — | — | — | ✅ Fait v0.19 | — | Position, véhicule, armes/munitions, missions, météo, saison ; message « Partie sauvegardée » ; réinitialisation avec confirmation ; entrée Quitter ajoutée aussi. |
| Missions scénarisées (5-8) | **P0** | L | Sauvegarde complète | Non commencé | Opus pour le système de prérequis, Sonnet par mission ensuite | Le plus gros manque de contenu. |
| 3-5 profils d'ennemis | P1 | S | `enemies.js` | Non commencé | Sonnet | Données (portée, arme, agressivité, vie). |
| Ramassage d'arme au sol | P2 | M | `weapons.js`, `enemies.js` | Non commencé | Sonnet | — |
| Véhicule détruit (feu puis explosion) | P2 | M | `vehicle.js`, `main.js`, audio | Non commencé | Sonnet | Aujourd'hui les dégâts plafonnent à fumée + teinte ; aucune explosion n'existe. |
| Garage / couleurs | P3 | M | `VEHICLE_SPECS` | Non commencé | Sonnet | SHOULD HAVE. |
| Téléphone limité | P3 | L | Missions | Non commencé | Opus | SHOULD HAVE. |
| Réaction visuelle du joueur aux dégâts | — | — | — | ✅ Fait v0.18 | — | — |

## Art

| Item | P | Effort | Dépendances | Statut | Modèle | Description |
|---|---|---|---|---|---|---|
| Variété d'arbres (LOT 1) | P1 | M | `world.js`, `seasons.js` | Non commencé (essai abandonné, rien de commité) | Sonnet | 4 silhouettes, 3 tailles, variantes de teinte, buissons, herbe près du joueur, types par quartier, vent lié à la météo, draw calls mesurés. |
| Façades 3→6-8 styles + mobilier (LOT 2) | P1 | M | `world.js` | Non commencé | Sonnet | Vitrines, enseignes, panneaux, abribus, bornes incendie, lampadaires variés. |
| Garage / station-service de la zone vitrine | P1 | M | Façades | Non commencé | Sonnet | Nécessaire à `VERTICAL_SLICE.md`. |
| Jantes distinctes du pneu | P1 | S | `vehicle.js` | Non commencé | Sonnet | — |
| Vitres de véhicule avec reflet | P2 | S | `vehicle.js` | Non commencé | Sonnet | — |

## Audio

| Item | P | Effort | Dépendances | Statut | Modèle | Description |
|---|---|---|---|---|---|---|
| Bus Master/Musique/Effets/Ambiance/UI + curseurs | P1 | M | `audio.js`, `settings.js` | Non commencé | Sonnet | Base de tout le reste de l'audio. |
| Pool de voix + limite simultanée | P1 | S | Bus | Non commencé | Sonnet | Évite la saturation en fusillade. |
| Rechargement, impacts par matériau | P1 | S | `weapons.js` | Non commencé | Sonnet | Le rechargement est muet aujourd'hui. |
| Pas du joueur et des PNJ | P1 | S | `player.js` | Non commencé | Sonnet | Rythmés sur la phase de marche existante. |
| Démarrage/arrêt, roulement, bosses | P2 | S | `vehicle.js` | Non commencé | Sonnet | — |
| Ambiance de ville (jour/nuit, météo) | P2 | M | Bus | Non commencé | Sonnet | — |
| Sons d'interface dédiés | P2 | S | Bus UI | Non commencé | Sonnet | Navigation, validation, retour, argent. |
| Boucle musicale synthétisée | P2 | M | Bus Musique | Non commencé | Sonnet | Une seule boucle en V1 (radios = V2). |
| Explosion | P2 | S | Véhicule détruit | Non commencé | Sonnet | — |
| Reprise après changement d'onglet | P2 | S | `audio.js` | À vérifier | Sonnet | `resume()` n'est appelé qu'au premier clic. |

## UI

| Item | P | Effort | Dépendances | Statut | Modèle | Description |
|---|---|---|---|---|---|---|
| Options en sections (Vidéo/Audio/Contrôles/Accessibilité/À propos) + réinitialiser | P1 | M | `menu.js`, `settings.js` | Non commencé | Sonnet | Les 19 réglages existent, seule l'organisation manque. |
| Remappage des touches | P1 | M | `input.js`, `menu.js` | Non commencé | Sonnet | Action → touche, conflits signalés, persisté. |
| Entrée Quitter (retour écran titre) | — | — | — | ✅ Fait v0.19 | — | — |
| Écran de chargement avec progression | P2 | S | `main.js`, `index.html` | Non commencé | Sonnet | — |
| Vérification HUD multi-ratios et échelles | P1 | S | `hud.js` | Non commencé | Sonnet | Script Playwright 16:9/16:10/21:9/étroit. |

### Mini-carte et HUD — améliorations proposées (aucune codée, à valider)

Vérifié dans le code le 2026-09-23 (`game/hud.js`, `drawMinimap`) : la
mini-carte est toujours nord fixe (aucune rotation) ; seul le triangle du
joueur pivote sur place. Aucune boussole, aucune distance chiffrée,
aucun nom de rue affiché en jeu, aucun zoom, une seule échelle fixe.

| Item | P | Effort | Dépendances | Statut | Modèle | Ce que ça change pour le joueur |
|---|---|---|---|---|---|---|
| Rotation de la mini-carte façon « suivant le joueur » (option, nord fixe par défaut) | P1 | M | `hud.js` (`drawMinimap`) | À faire | Sonnet | L'avant du joueur pointerait toujours vers le haut de la mini-carte en mode « suivant » — la direction à prendre (« tourne à gauche ») devient immédiate à lire, sans conversion mentale nord→cap. Réglage dans Options pour basculer entre les deux modes, avec un repère de nord (« N ») visible dans les deux cas. |
| Boussole/indicateur de cap en haut du HUD | P1 | S | `hud.js`, `index.html` | À faire | Sonnet | Une bande fine N/E/S/O avec l'objectif marqué dessus s'il est hors-champ. Complète surtout une mini-carte restée nord fixe. |
| Flèche 3D « suivez le point » à l'écran (style GPS) | P2 | M | `hud.js`, `main.js`, `missions.js` | À faire | Sonnet | En plus du marqueur cylindrique 3D et de la flèche au bord de la mini-carte déjà là, une flèche discrète en haut de l'écran aide quand l'objectif est loin ou masqué par un bâtiment. |
| Distance chiffrée jusqu'à l'objectif | P2 | S | `hud.js`, `missions.js` | À faire | Sonnet | Aucun chiffre de distance n'est affiché aujourd'hui, seulement la position relative sur la mini-carte. Un « 240 m » sous le texte d'objectif confirme qu'on se rapproche. |
| Nom de rue/quartier affiché en continu en jeu | P2 | M | `hud.js`, `world.js` (`districtName` existe déjà) | À faire | Sonnet | `districtName()` n'est utilisé que dans la grande carte du menu pause. L'afficher aussi en jeu (coin d'écran, discret) donne un repère immédiat sans ouvrir le menu. |
| Zoom mini-carte (2-3 niveaux) | P3 | S | `hud.js` | À faire | Sonnet | L'échelle est fixe (`MAP_SCALE`). Zoomer/dézoomer aide à anticiper un carrefour de loin ou repérer un détail proche. |
| Icônes distinctes par type de véhicule sur la mini-carte (taxi, ambulance, pompiers) | P3 | M | `hud.js`, `traffic.js` | À faire | Sonnet | Tout véhicule civil est aujourd'hui un simple carré ; seule la police a une forme dédiée (losange). Distinguer les autres rendrait la carte plus lisible en zone dense. |
| Raccourci pour masquer/afficher la mini-carte | P2 | S | `input.js`, `hud.js` | À faire | Sonnet | Utile en capture d'écran/vidéo, ou pour un joueur qui préfère une mini-carte discrète en conduite. Persisté comme réglage. |
| Raccourci pour rappeler le texte d'objectif | P3 | S | `input.js`, `hud.js` | À faire | Sonnet | Le texte d'objectif s'efface après un temps (fondu) ; une touche pour le rafficher évite d'ouvrir le menu Missions. |
| Lisibilité des icônes HUD à `hudScale` minimal (75 %) | P2 | S | `hud.js`, `index.html` | À faire | Sonnet | `hudScale` va de 75 % à 150 % ; personne n'a vérifié que les icônes (pas seulement le texte) restent lisibles au minimum, ni le contraste en plein soleil. |
| Barre de progression pour le rechargement | P2 | S | `hud.js`, `weapons.js` | À faire | Sonnet | `#ammo.reloading` ne fait aujourd'hui que changer une couleur CSS. Une barre de progression donnerait un retour clair sur le temps restant. |
| Distinguer visuellement « recherché » (étoiles) et « poursuite active » | P3 | S | `hud.js`, `police.js` | À faire | Sonnet | Les deux états partagent la même zone HUD (étoiles). Un halo ou une bordure d'écran pendant une poursuite active aiderait à les distinguer d'un coup d'œil. |

## Performance

| Item | P | Effort | Dépendances | Statut | Modèle | Description |
|---|---|---|---|---|---|---|
| Déploiement statique partageable | P1 | S | Aucune | Non commencé | Sonnet | Condition du jalon 8. |
| Mesure sur GPU réel | P1 | S | Ta machine | Non commencé | — | Hors de cet environnement. |

## Checklist de bugs à repasser avant chaque version

**Gameplay** — entrer/sortir de chaque gabarit de véhicule ; tir, visée,
changement d'arme, rechargement, munitions à zéro ; mort et réapparition
(à pied et en véhicule) ; arrestation ; perte d'étoiles ; mission réussie,
échouée, abandonnée ; argent jamais négatif.
**HUD/menus** — aucun chevauchement sur 4 ratios ; navigation clavier et
souris sans oscillation ; Échap ferme toujours le niveau courant ;
réglages appliqués en direct et conservés après rechargement de la page.
**Audio** — aucun son qui continue en pause ou après la mort ; volumes à
zéro réellement muets ; aucune saturation en fusillade ; reprise après
changement d'onglet.
**Performance** — draw calls < 500 dans les 6 quartiers, de jour et de
nuit, sous orage ; aucune fuite de géométrie après 10 min (compteur
`renderer.info.memory` stable).
**Visuel** — personnage jamais invisible en rue dégagée ; caméra jamais
dans un mur ; aucun z-fighting sur façades/marquages ; saisons et météo
cohérentes (pas de « Pluie » affichée quand il neige).

## V2 / hors V1

Liste complète et raisons : `V1_SCOPE.md`, « Reporté en V2 ». Rappel :
personnage GLB, emplacements de sauvegarde multiples, feux tricolores/
clignotants/ronds-points, tir depuis un véhicule, déformation de
carrosserie, radios, congères, économie/propriétés, personnage alternatif,
couvertures IA, intérieurs, multijoueur.
