# Contrôles

Le jeu lit les touches **physiques** (`event.code`) : les dispositions AZERTY et QWERTY
fonctionnent toutes les deux sans réglage.

## À pied

| Touche | Action | Détail |
|---|---|---|
| `Z` / `W` / `↑` | Avancer | |
| `S` / `↓` | Reculer | |
| `Q` / `A` / `←` | Gauche | |
| `D` / `→` | Droite | |
| `Maj` | Courir | 6,6 m/s au lieu de 2,3 |
| `Ctrl` | Marcher lentement | 1,1 m/s |
| `Espace` | Sauter | |
| `F` | Monter dans le véhicule le plus proche | Moins de 4,2 m ; sur un véhicule occupé, éjecte le conducteur (+1 étoile) |
| Souris | Orienter la caméra | Le curseur est capturé au clic |
| Molette | Zoom caméra (ou changer d'arme si une arme est sortie) | |

## Combat

| Touche | Action | Détail |
|---|---|---|
| Clic gauche | Tirer | Maintenir pour les armes automatiques (UZI, fusil d'assaut) |
| Clic droit | Viser | Caméra épaule, champ resserré, dispersion divisée par 3 (lunette pour le sniper) |
| `R` | Recharger | Automatique quand le chargeur est vide |
| Molette | Arme suivante / précédente | |
| `1` à `6` | Arme directe | Poings, pistolet, UZI, pompe, fusil, sniper |

Dégâts par zone : **tête ×3**, torse ×1. Tirer sur un civil déclenche 2 étoiles,
abattre un agent en ajoute une.

## En véhicule

| Touche | Action | Détail |
|---|---|---|
| `Z` / `W` | Accélérer | |
| `S` | Freiner puis marche arrière | |
| `Q` / `D` | Diriger | Le braquage diminue avec la vitesse |
| `Espace` | Frein à main | Fait pivoter et ralentit fort |
| `F` | Sortir | Le personnage descend côté gauche |
| `H` | Klaxon | |

Les phares s'allument tout seuls à la tombée de la nuit.

## Interface

| Touche | Action |
|---|---|
| `P` ou `Échap` | Pause + écran de statistiques |
| `²` ou `` ` `` | Ouvrir/fermer la console de triche |
| `↑` `↓` dans la console | Historique des commandes |

## Console de triche

| Commande | Effet |
|---|---|
| `help` | Liste des commandes |
| `god` | Invincibilité (bascule) |
| `noclip` | Le véhicule traverse les immeubles (bascule) |
| `heal` | Vie et armure au maximum |
| `money 5000` | Ajoute 5 000 $ |
| `setmoney 100000` | Fixe le montant |
| `stars 4` | Fixe le niveau de recherche (0-5) |
| `clearwanted` | Efface la recherche |
| `spawn sportive` | Fait apparaître un véhicule : `citadine`, `berline`, `sportive`, `taxi`, `van`, `police`, `muscle`, `luxe`, `suv`, `pickup`, `camion`, `bus`, `ambulance`, `pompiers`, `scooter`, `moto` |
| `tp 120 -60` | Téléporte en x / z |
| `time 22` | Change l'heure du jeu |
| `weather rain` | Force la météo (`clear`, `cloudy`, `rain`, `fog`) |
| `give all` | Débloque tout l'arsenal (ou `give sniper`) |
| `gang 3` | Fait apparaître 3 ennemis hostiles devant toi |
| `job` | Propose un nouveau job |
| `fps` | Affiche le compteur d'images par seconde |
| `perf` | Panneau de mesures en direct (draw calls, triangles, mémoire…) |
| `mesure` | Le même instantané en JSON |
| `quality moyen` | Preset graphique (`faible`, `moyen`, `eleve`, `auto`) |
| `stress combat` | Charge la scène (`traffic`, `police`, `weather`, `combat`) |
| `stats` | Dump des statistiques de la partie |
