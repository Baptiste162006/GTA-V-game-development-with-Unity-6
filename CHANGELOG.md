# CHANGELOG

## v0.5 — 2026-09-21

### Corrigé
- **Le pistolet avait la taille d'un fusil** : la longueur du modèle se déduisait de la portée,
  et un pistolet porte à 90 m. Chaque arme a désormais une longueur explicite (22 cm pour le
  pistolet, 92 cm pour le fusil de précision), avec crosse sur les armes d'épaule.

### Ajouté — retour d'impact
- **Ennemi touché** : flash blanc de 90 ms sur le corps, recul directionnel (limité à une
  réaction toutes les 280 ms pour qu'une rafale ne le secoue pas en continu), et barre de vie
  flottante qui apparaît 3 s au-dessus de sa tête, orientée face caméra.
- **Marqueur de touche** au centre du viseur, plus large et rouge pour un tir à la tête,
  avec un son distinct.
- **Indicateur de direction des tirs reçus** : un arc rouge s'allume du côté d'où vient le
  coup, calculé dans le repère de la caméra.
- **« RECHARGER »** s'affiche à la place des munitions quand le chargeur est vide.

## v0.4 — 2026-09-21

### Corrigé
- **Visée inutilisable** : le clic droit rapprochait la caméra dans le dos du personnage,
  qui masquait exactement la cible. La caméra passe maintenant **par-dessus l'épaule droite**
  (décalage latéral de 0,85 m, distance 2,8 m) et regarde parallèlement à l'axe de tir, donc
  le joueur se place à gauche de l'écran et le viseur tombe sur la cible.
  Deux tentatives ont échoué avant : décaler la caméra *et* son point de visée du même vecteur
  ne change rien, puisque caméra, joueur et cible restent alignés.

### Ajouté
- **Arme visible** : elle est accrochée à la main droite et suit l'animation du bras. Au repos
  elle pend le long du corps, en visée le bras droit se lève et le gauche vient en soutien.
- **Éclair de bouche** à chaque tir, et recul qui remonte visiblement l'épaule.
- **9 véhicules de plus** : muscle car, berline de luxe, 4×4, pick-up, camion, bus, ambulance,
  camion de pompiers — et deux **deux-roues** (scooter, moto) avec un modèle dédié et une
  inclinaison marquée en virage.
- Livrée et rampe lumineuse étendues à l'ambulance et aux pompiers.

## v0.3 — 2026-09-21

### Ajouté
- **Combat** (`game/weapons.js`) : 6 armes réglées par une table de stats — poings, pistolet,
  UZI, fusil à pompe (8 plombs par tir), fusil d'assaut, fusil de précision.
  - Clic gauche pour tirer (maintenu sur les automatiques), clic droit pour viser (caméra
    épaule, champ resserré, dispersion ÷3, lunette au sniper), `R` pour recharger,
    molette ou touches `1`-`6` pour changer d'arme.
  - Dégâts par zone : **tête ×3**. Traçantes et impacts réutilisés dans un pool, recul qui
    pousse la caméra, détonation synthétisée propre à chaque arme.
- **Ennemis** (`game/enemies.js`) : gangs qui peuplent la Zone Industrielle et la Vieille Ville.
  Ils approchent jusqu'à 14 m, tiennent leur distance, ripostent, alertent leurs voisins quand
  l'un d'eux est touché et laissent 60 à 200 $ en mourant.
- Piétons et agents de police deviennent des cibles : abattre un civil coûte 2 étoiles,
  un agent 1 de plus.
- Console : `give all` pour l'arsenal, `gang 3` pour faire apparaître des hostiles.

### Corrigé
- Le compteur de statistiques suit maintenant les éliminations et la précision au tir.

## v0.2 — 2026-09-21

### Ajouté
- **Météo dynamique** (`game/weather.js`) : clair, nuageux, pluie et brouillard, tirés au sort
  toutes les 2 min 30 à 5 min 30 et enchaînés par des transitions de 18 s.
  - Visuel : ciel qui se couvre, 3 600 gouttes qui suivent le joueur, bitume qui fonce et
    prend un reflet, brouillard qui referme la distance, étoiles masquées quand c'est couvert.
  - Gameplay : adhérence réduite (freinage +38 % sous la pluie), champ de vision de la police
    ramené à 40 % dans le brouillard, trottoirs qui se vident et piétons qui pressent le pas.
  - Son : pluie synthétisée (bruit blanc filtré en boucle).
  - Météo affichée dans le HUD, et forçable avec `weather clear|cloudy|rain|fog`.

### Corrigé
- **Direction inversée en voiture** : `D` braquait à gauche et `Q` à droite. En repère Three.js,
  augmenter le cap fait tourner vers la gauche de l'écran ; le signe manquait. Les roues avant,
  l'IA de circulation et celle de la police ont été alignées sur la même convention.
- **Compteur de FPS mensonger** : il utilisait le `dt` plafonné à 50 ms et affichait donc 20 FPS
  quoi qu'il arrive dès que l'affichage ramait. Il mesure maintenant le temps réel.
- **Trottoirs qui ne se vidaient pas** sous la pluie : le quota ne bloquait que les apparitions.

### Modifié
- **Personnages entièrement redessinés** : capsules, buste galbé, tête sphérique et calotte de
  cheveux, mains, chaussures, et surtout des **genoux articulés** — fini l'empilement de boîtes.
  Les conducteurs sont assis à hauteur de vitre au lieu de traverser le toit.
- Piétons ramenés de 18 à 14 pour compenser le coût des nouveaux personnages.

## v0.1 — 2026-09-21

Première version jouable, de bout en bout.

### Ajouté
- Ville procédurale de 0,5 km² : 8 quartiers, ~100 immeubles, rues, trottoirs, parcs,
  lampadaires, marquage au sol.
- Cycle jour/nuit complet : ciel en dégradé shader, étoiles, fenêtres qui s'allument,
  halos de lampadaires, phares automatiques.
- Personnage jouable low-poly avec animation procédurale et caméra 3e personne qui évite
  les immeubles.
- 6 types de véhicules avec physique arcade, frein à main, dégâts de carrosserie, roulis.
- Entrée/sortie de véhicule, vol de voiture garée et carjacking avec éjection du conducteur.
- Circulation PNJ suivant la trame des rues, piétons avec panique et renversement.
- Police à 5 étoiles : poursuites, agents à pied, tirs à partir de 3 étoiles, arrestation,
  zone de recherche et mécanique d'évasion.
- Missions : tutoriel en 4 étapes, puis jobs répétables (livraison chronométrée, commande
  de véhicule).
- Économie : argent, primes, frais d'hôpital, amende d'arrestation.
- HUD complet avec mini-carte canvas, notifications et écran de statistiques.
- Son entièrement synthétisé en WebAudio (aucun fichier audio).
- Console de triche (14 commandes) et sauvegarde navigateur.
- Three.js r160 embarqué : le jeu fonctionne hors ligne.

### Corrigé
- L'attribut `hidden` était écrasé par `.screen { display: grid }` : l'écran de pause invisible
  interceptait les clics et empêchait de lancer la partie. Trouvé par le test automatisé.
- Bitume trop sombre et caméra trop haute au premier rendu.
