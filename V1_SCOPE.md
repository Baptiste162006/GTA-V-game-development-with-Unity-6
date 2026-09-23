# V1_SCOPE

Objectif de la V1 : une démo solo, jouable dans un navigateur, que tu peux
envoyer à des amis sans avoir à l'expliquer. Pas une copie de GTA V, pas un
monde entièrement détaillé — un style cohérent et assumé, jusqu'au bout.

## MUST HAVE — sans ça, ce n'est pas une V1

- Une zone vitrine détaillée (voir `VERTICAL_SLICE.md`).
- Personnage propre, animations procédurales (le fallback documenté dans
  `ART_DIRECTION.md` **est** le rendu final de la V1 — aucun `.glb` n'est
  disponible dans cet environnement).
- Caméra, visée et arme fiables — déjà acquis (v0.12, v0.13), à ne pas
  régresser.
- 5 véhicules propres, choisis dans les 16 existants : citadine, berline,
  sportive, taxi, police — ce sont les seuls qui apparaissent dans la boucle
  de jeu décrite dans `VERTICAL_SLICE.md`.
- Conduite/pneus/police fiables — déjà acquis.
- 3 à 6 armes sur les 6 existantes (poings, pistolet, UZI, pompe, fusil,
  sniper) — déjà là, rien à ajouter.
- 3 à 5 profils d'ennemis — aujourd'hui un seul profil de gang existe
  (`enemies.js`) ; en ajouter 2 à 4 variantes (portée d'IA, arme, agressivité)
  est un travail de données, pas un nouveau système.
- 5 à 8 missions scénarisées courtes — **non commencées**, c'est le plus
  gros chantier MUST HAVE. Le tutoriel et les 2 jobs actuels ne comptent pas
  comme « scénarisées » (pas de prérequis, pas de progression).
- Météo clair/pluie/brouillard/orage — déjà là (v0.10).
- HUD/menu/options essentiels — déjà là (v0.9-v0.12).
- Audio minimal solide — déjà là, entièrement synthétisé.
- Sauvegarde — déjà là (un emplacement, suffisant pour une V1).
- Optimisation — déjà là, mesurée (`PERFORMANCE.md`).
- Build web partageable — **non commencé** : pas de page de présentation,
  pas d'hébergement choisi.

## SHOULD HAVE — améliore la V1 sans la bloquer

- Saisons visuelles simples — **déjà fait et dépasse la demande** (4
  saisons, neige avec accumulation, depuis la v0.10). Rien à ajouter ici.
- Téléphone limité (carte, missions, contacts, réglages) — non commencé ;
  à ne considérer qu'après les missions scénarisées, sinon il n'aurait
  rien à afficher.
- Garage/couleurs de véhicules — non commencé, mais `VEHICLE_SPECS` a déjà
  une liste de couleurs par modèle (`colors: [...]`), donc un garage serait
  surtout une interface, pas un nouveau système de données.
- Petit système d'argent — déjà là (argent, primes, amendes).
- Quelques activités répétables — déjà là (2 jobs).
- 10 à 15 véhicules — déjà dépassé (16 existent).

## COULD HAVE — v1.1

- Neige et feuilles d'automne comme *contenu visuel supplémentaire* — la
  neige existe déjà comme mécanique (adhérence, accumulation) ; ce qui
  resterait en v1.1 est purement décoratif (accumulation sur les surfaces
  autres que le sol, congères).
- Vraie économie/business/propriétés.
- Davantage de missions.
- Plus de quartiers détaillés dans le style de la zone vitrine.
- Personnage alternatif (deuxième silhouette jouable).

## HORS SCOPE — v2 ou jamais dans ce projet

69 missions principales, 50 missions secondaires, 100 véhicules, 35 armes,
30 stations de radio, plusieurs histoires complètes, des dizaines
d'intérieurs visitables, le multijoueur, un rendu photoréaliste façon
GTA V/VI, une ville de 4 km² entièrement détaillée. Rien de tout cela n'est
compatible avec un projet mené par une personne assistée d'un modèle de
langage, dans Three.js, sans pipeline d'assets. Ce n'est pas un manque
d'ambition : c'est un choix pour que la V1 sorte réellement.
