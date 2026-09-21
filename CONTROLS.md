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
| Molette | Zoom caméra | 3 m à 14 m |

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
| `spawn sportive` | Fait apparaître un véhicule (`citadine`, `berline`, `sportive`, `taxi`, `van`, `police`) |
| `tp 120 -60` | Téléporte en x / z |
| `time 22` | Change l'heure du jeu |
| `weather rain` | Force la météo (`clear`, `cloudy`, `rain`, `fog`) |
| `job` | Propose un nouveau job |
| `fps` | Affiche le compteur d'images par seconde |
| `stats` | Dump des statistiques de la partie |
