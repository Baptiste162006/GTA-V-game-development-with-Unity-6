# MILESTONES

Ordre de travail. Une étape = une livraison testable. Les étapes sont livrées dans l'ordre
qui sert le plus le jeu, pas forcément dans l'ordre numérique : le combat (étape 4) est passé
devant l'orage et le téléphone parce que c'était le plus gros manque de gameplay.

## ✅ Étape 0 — Fondations (terminée)
- [x] Page, thème, HUD, boucle de rendu Three.js
- [x] Ville procédurale : 8 quartiers, ~100 immeubles, rues, trottoirs, parcs, lampadaires
- [x] Cycle jour/nuit 24 h en 12 min (ciel, étoiles, fenêtres allumées, phares)
- [x] Personnage low-poly animé + caméra 3e personne anti-mur
- [x] Véhicules : 6 types, physique arcade, dégâts, entrée/sortie, carjacking
- [x] Circulation PNJ, piétons, voitures garées
- [x] Police 5 étoiles : poursuite, agents à pied, arrestation, évasion
- [x] Missions : tutoriel + jobs répétables, marqueurs, récompenses
- [x] Argent, statistiques, sauvegarde navigateur
- [x] Son synthétisé, console de triche, test automatisé Chromium

## ✅ Étape 1 — Météo dynamique (terminée)
- [x] 4 états : clair, nuageux, pluie, brouillard, transitions de 18 s
- [x] Pluie en `Points` GPU (3 600 gouttes qui suivent le joueur)
- [x] Brouillard = densité de `FogExp2` + ciel qui se couvre
- [x] Impact conduite : freinage +38 % sous la pluie (mesuré : 12,6 m → 17,4 m)
- [x] Impact IA : trottoirs qui se vident, police qui voit à 40 % dans le brouillard
- [x] Son de pluie synthétisé
- [ ] Reste à faire : flaques et éclaboussures, essuie-glaces visibles

## ⏳ Étape 2 — Orage et saisons
- [ ] Orage : éclairs (flash de lumière + ombre portée), tonnerre décalé, vent
- [ ] Automne : feuilles qui tombent, arbres qui se dénudent, palette orangée
- [ ] Hiver : neige qui tombe, accumulation progressive au sol, adhérence 40 %
- [ ] Saison qui change la palette de l'herbe, des arbres et du ciel

## ⏳ Étape 3 — Téléphone
- [ ] Ouverture à la touche `K`, interface en bas à droite
- [ ] Carte plein écran avec marqueurs et filtres
- [ ] Contacts : mécanicien (réparation payante), taxi (téléportation payante), jobs
- [ ] Messages : briefings de mission, alertes météo, virements
- [ ] Banque : solde, historique des transactions
- [ ] Réglages : volume, qualité graphique

## ✅ Étape 4 — Combat (terminée, livrée avant les étapes 2 et 3)
- [x] Visée à l'épaule, tir au raycast avec dispersion
- [x] 6 armes + munitions et rechargement
- [x] Dégâts par zone (tête ×3), impacts et traçantes, recul caméra
- [x] Ennemis de gang avec IA (approche, distance de sécurité, riposte, alerte du groupe)
- [x] Riposte armée de la police à 3 étoiles et plus
- [ ] Reste à faire : ramassage d'armes au sol, tir depuis un véhicule, couvertures

## ⏳ Étape 5 — Contenu et économie
- [ ] 10 véhicules de plus + customisation (couleur, performances) au garage
- [ ] Achat de propriétés, revenus passifs
- [ ] Courses de rue chronométrées, chasse aux primes
- [ ] Stations-service, magasins, hôpital et commissariat comme vrais lieux

## ⏳ Étape 6 — Missions scénarisées
- [ ] Chaîne principale en actes, avec prérequis entre missions
- [ ] Objectifs variés : protéger, détruire, voler discrètement, survivre
- [ ] Écran de fin avec statistiques de partie

## ⏳ Étape 7 — Personnages multiples
- [ ] 3 personnages jouables, bascule aux touches `1` `2` `3`
- [ ] Compétences et argent propres à chacun
- [ ] Missions à deux ou trois personnages

## ⏳ Étape 8 — Corps et forme physique
- [ ] 4 stats qui évoluent : musculation, cardio, poids, forme générale
- [ ] Le corps change visiblement : largeur d'épaules, torse et ventre pilotés par les stats
      (le personnage est assemblé en boîtes, donc c'est une mise à l'échelle — pas de morph target)
- [ ] Salle de sport : un lieu, une séance = temps qui passe + gain de stats
- [ ] Nourriture : quelques points de vente, calories, effet sur poids et forme
- [ ] Impact réel : vitesse de course, endurance, PV max, dégâts au corps à corps
- [ ] Écran de suivi (dans le téléphone de l'étape 3)

## 🚧 Étape 9 — Menus et réglages (en grande partie livrée)
- [x] Menu pause : navigation clavier et souris, carte, missions, stats, commandes
- [x] Options graphiques : ombres, résolution de rendu, FOV, mini-carte
- [x] Options audio : volume général, moteurs, sirènes
- [x] Options contrôles : sensibilité souris, inversion de l'axe Y, secousses
- [x] Réglages conservés d'une partie à l'autre
- [x] Confirmation avant de recommencer
- [ ] Reste : menu principal avec 3 emplacements de sauvegarde, remappage des touches,
      limite de FPS
- Note : pas de traduction multilingue ni de doublage en v1 — le jeu reste en français.

## ⏳ Étape 10 — Finitions
- [ ] Musique procédurale par ambiance
- [ ] Équilibrage économique, passe de bugs, tests sur plusieurs machines

## Hors périmètre v1
Multijoueur, avions et bateaux, intérieurs visitables, cinématiques doublées, monde de 4 km²,
bourse, réseaux sociaux. Ces idées vont dans la section « Idées » de `PROGRESS.md`.
