# MILESTONES

Ordre de travail. Une étape = une livraison testable. Rien ne part en code avant que l'étape
précédente soit validée.

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

## 🚧 Étape 1 — Météo dynamique (suivante)
- [ ] 4 états : clair, nuageux, pluie, brouillard (transitions progressives, pas de saut brutal)
- [ ] Pluie en `Points` GPU, flaques et reflets simples sur le bitume
- [ ] Brouillard = densité de `FogExp2` + portée de rendu réduite
- [ ] Impact conduite : adhérence -30 % sous la pluie, braquage plus mou
- [ ] Impact IA : moins de piétons dehors, circulation ralentie, police qui voit moins loin
- [ ] Son de pluie synthétisé (bruit filtré), essuie-glaces visibles
- **Test** : les 4 états s'enchaînent sans coupure, la voiture glisse sous la pluie, 60 FPS tenus

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

## ⏳ Étape 4 — Combat
- [ ] Visée à l'épaule, tir au raycast avec dispersion
- [ ] 3 armes (pistolet, fusil à pompe, fusil d'assaut) + munitions et rechargement
- [ ] Dégâts par zone (tête ×3), impacts visibles, recul caméra
- [ ] Ennemis de gang avec IA simple (approche, couverture, tir)
- [ ] Riposte armée de la police à 3 étoiles et plus

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

## ⏳ Étape 9 — Finitions
- [ ] Menu principal, réglages de qualité (ombres, distance de rendu)
- [ ] Musique procédurale par ambiance
- [ ] Équilibrage économique, passe de bugs, tests sur plusieurs machines

## Hors périmètre v1
Multijoueur, avions et bateaux, intérieurs visitables, cinématiques doublées, monde de 4 km²,
bourse, réseaux sociaux. Ces idées vont dans la section « Idées » de `PROGRESS.md`.
