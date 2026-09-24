# MILESTONES

Réécrit le 2026-09-23 à partir de `PROJECT_STATUS.md`. Remplace l'ancien
découpage par étapes numérotées 0-10, qui mélangeait des étapes déjà
terminées avec des étapes jamais commencées sans dire clairement lesquelles.
Chaque jalon liste : objectif, fichiers concernés, critères d'acceptation,
risques, modèle conseillé, test à effectuer, condition de passage au
suivant.

## 0. Stabilisation du prototype — ✅ TERMINÉE

**Objectif.** Aucun bug de contrôle, caméra, arme ou collision ne devait
rester avant d'ajouter du contenu.

**Ce qui a été fait**, avec la version où c'est arrivé : caméra rapprochée
et abaissée à hauteur d'épaule (v0.12) ; régression du mécanisme anti-mur
trouvée en testant ce même changement, puis corrigée avec un ratio
géométrique indépendant des réglages (v0.12) ; personnage qui visait dos à
la cible au lieu de face (v0.13) ; arme invisible en visée, corrigée par le
contraste et non la taille (v0.13) ; assiette des véhicules inversée par
rapport à la physique, corrigée (v0.14) ; menu pause qui oscillait entre
deux entrées au survol (correctif post-v0.9).

**Condition de passage** (remplie) : six scripts de régression automatisés
passent sans erreur console à chaque version.

## 1. Direction artistique — environnement — EN COURS

**Objectif.** Arbres variés, façades variées, mobilier, une zone vitrine,
éclairage — dans cet ordre de rentabilité (`ART_DIRECTION.md`).

**Fichiers concernés.** `game/world.js` essentiellement ; `game/seasons.js`
pour la compatibilité des teintes saisonnières avec toute nouvelle matière
première (feuillage, tronc).

**Fait.** 3 styles de façade, bancs, poubelles (v0.15), fusionnés par style
pour ne pas dégrader les draw calls (mesuré 226-301, budget 500).

**Pas fait.** Variété d'arbres (une seule forme dans tout le jeu — le
travail préparé ce cycle a été abandonné avant d'être branché, aucune
régression n'a donc pu en venir, mais rien n'a atterri) ; façades 3→6-8 ;
vitrines/enseignes ; garage/station-service fonctionnels pour la zone
vitrine.

**Critères d'acceptation.** Au moins 3 silhouettes d'arbre distinctes,
choisies selon le quartier ; draw calls mesurés avant/après, toujours sous
500 ; zéro erreur console sur les six scripts de régression existants plus
un nouveau script dédié à la végétation.

**Risques.** Refaire une passe de matériaux/instancing qui redéfait le
travail de fusion par îlot de la v0.9/v0.15 — chaque ajout doit être
mesuré, pas supposé neutre.

**Modèle conseillé.** Sonnet — un seul fichier à la fois, pas de système
à faire tenir avec un autre.

**Test.** Script Playwright qui compte les draw calls/géométries avant et
après, sur au moins trois quartiers différents, plus une capture visuelle
par quartier.

**Condition de passage au jalon 2.** Au moins 3 formes d'arbre visibles en
jeu, façades étendues à 5 styles minimum, zéro régression de performance
mesurée.

## 2. Personnage et caméra — PARTIELLEMENT FAITE (réaction aux dégâts livrée en v0.18)

**Objectif.** Proportions, animations, visée, arme visible, réactions à la
mort/aux chutes.

**Fait** (v0.12, v0.13) : caméra à hauteur d'épaule, animation de
respiration à l'arrêt, marche/course par oscillation, visée alignée à 3,8°
de l'axe réel, arme visible et contrastée.

**Fait depuis (v0.18)** : flash + écart directionnel du buste sur les
dégâts encaissés, symétrique à celui des ennemis.

**Pas fait.** Accroupissement. Pose d'entrée/sortie de véhicule.

**Critères d'acceptation.** Le joueur qui encaisse un tir a une réaction
visible (flash et/ou recul), symétrique à celle des ennemis. Aucune
régression sur la visée ni la caméra (scripts existants).

**Risques.** Faible — ajout localisé à `player.js`/`main.js`, ne touche
pas les systèmes déjà stabilisés.

**Modèle conseillé.** Sonnet.

**Test.** Script dédié : dégâts encaissés → vérifier un changement d'état
visuel mesurable (matériau, rotation) dans les N images suivantes.

**Condition de passage au jalon 3.** Réaction aux dégâts en place et
testée. Le remplacement du personnage procédural par un modèle GLB n'est
**pas** une condition de passage — il dépend d'un asset externe qui n'est
pas disponible dans cet environnement, et reste un jalon à part (voir
« Hors séquence » en bas de ce document).

## 3. Véhicules — PARTIELLEMENT FAITE

**Objectif.** Pneus, roues, feux, sons, dégâts, entrée/sortie, IA trafic.

**Fait.** Roues asservies à la vitesse réelle, direction par pivot, feux
stop/phares/gyrophares, dégâts visibles (carrosserie qui ternit) et fumée
moteur, suspension ressort-amortisseur avec assiette physiquement correcte
(v0.14, après avoir trouvé et corrigé le signe inversé).

**Pas fait.** Jantes distinctes du pneu (aujourd'hui un disque plein).
Vitres avec un matériau qui réfléchit. Déformation de carrosserie après un
choc.

**Critères d'acceptation.** Un véhicule vu de près a une jante visuellement
distincte de son pneu ; les vitres ne sont plus un simple aplat sombre.

**Risques.** Faible — travail de matériau/géométrie, isolé à
`vehicle.js`.

**Modèle conseillé.** Sonnet.

**Test.** Capture rapprochée avant/après sur au moins deux modèles de
gabarits différents (citadine, camion).

**Condition de passage au jalon 4.** Non bloquant pour la suite — peut se
faire en parallèle du jalon 4.

## 4. Combat et ennemis — LARGEMENT FAITE

**Fait.** 6 armes, visée épaule, dégâts par zone (tête ×3, vérifié 78
contre 26), impacts, flash, recul, gangs avec IA de tir, flash + recul +
barre de vie au coup touché, butin en argent, riposte armée de la police
dès 3 étoiles.

**Pas fait.** Ramassage d'arme au sol. Tir depuis un véhicule. Couvertures
pour l'IA ennemie. Variété de profils d'ennemis (un seul aujourd'hui).

**Critères d'acceptation pour clore ce jalon.** Au moins 3 profils
d'ennemis distincts (portée, arme, agressivité) — un travail de données
dans `enemies.js`, pas un nouveau système.

**Modèle conseillé.** Sonnet.

**Condition de passage au jalon 5.** Non bloquant — la mission
scénarisée du jalon 7 peut se construire avec un seul profil d'ennemi.

## 5. Audio et game feel — PARTIELLE

**Fait.** Moteur, sirène, klaxon, chocs, crissement, pluie, tir par arme,
clic à vide, tonnerre retardé par la distance, jingles de réussite/échec.

**Pas fait** (détail dans `V1_SCOPE.md` § Audio) : bus Master/Musique/
Effets/Ambiance/UI, pool de voix, rechargement, impacts par matériau, pas,
démarrage/arrêt/roulement moteur, ambiance de ville, sons d'interface,
boucle musicale, explosion.

**Fichiers.** `audio.js`, `settings.js`, `menu.js` (curseurs), points
d'appel dans `weapons.js`, `player.js`, `vehicle.js`.

**Critères d'acceptation.** Chaque bus a son curseur et le volume 0 est
muet ; aucun son ne continue en pause ; une rafale d'UZI de 5 s ne dépasse
pas la limite de voix ; chaque action de la checklist audio (`BACKLOG.md`)
produit un son.

**Risques.** Saturation/clipping, sons qui fuient en pause, coût CPU de la
synthèse — mesurer le nombre de nœuds actifs.

**Modèle conseillé.** Sonnet (un fichier central + appels ponctuels).

**Test.** Script qui compte les nœuds audio actifs pendant une fusillade,
en pause et après mort.

**Condition de passage.** Non bloquant pour le jalon 7, bloquant pour la
V1 (jalon 10).

## 6. HUD, pause, options, sauvegarde — PARTIELLE

**Fait.** Thème centralisé + 3 variantes, menu pause navigable (Reprendre,
Carte, Missions, Statistiques, Options, Commandes, Recommencer), 19
réglages persistés et appliqués en direct, FOV par contexte.

**Fait depuis (v0.19)** : sauvegarde complète (position, orientation, vie,
armure, véhicule courant, arme et munitions, météo, saison, avancement des
missions) ; entrées de menu Sauvegarder (avec notification), Réinitialiser
la sauvegarde (avec confirmation) et Quitter.

**Pas fait.** Options en sections Vidéo/Audio/Contrôles/Accessibilité/
À propos + réinitialisation des options ; remappage des touches ; écran
de chargement ; vérification HUD multi-ratios.

**Fichiers.** `main.js` (`save`/`loadSave`), `menu.js`, `settings.js`,
`input.js`, `index.html`, `hud.js`.

**Critères d'acceptation.** Sauvegarder → recharger la page → même
position, armes, munitions, argent, heure, météo, saison ; réinitialiser
→ partie neuve après confirmation, annuler ne change rien ; ancienne
sauvegarde (format actuel) toujours lue sans erreur.

**Risques.** Casser les sauvegardes existantes ; restaurer un état
incohérent (joueur dans un mur, véhicule disparu) ; régression de la
navigation du menu (déjà eu un bug d'oscillation).

**Modèle conseillé.** Sonnet.

**Test.** Script aller-retour sauvegarde/rechargement + script de menu
existant (`menutest`).

**Condition de passage au jalon 7.** Remplie depuis v0.19 — la sauvegarde
complète est en place, la progression des missions scénarisées ne sera
donc plus perdue au rechargement.

## 7. Missions scénarisées — ✅ SYSTÈME ET HISTOIRE FAITS (v0.22)

**Fait.** `story.js` : six missions enchaînées (tutoriel, Premier contrat,
Dette impayée, Le mouchard, Contre la montre, Le grand coup) avec deux
contacts dans la ville (Rosa, Vieille Ville ; Kenji, Little Tokyo).
Prérequis entre missions, contact bloqué tant qu'on a des étoiles, échec
(mort, arrestation, voiture abîmée ou abandonnée, zone quittée, chrono)
avec nettoyage et réessai au contact, marqueur qui suit une cible mobile,
progression sauvegardée et relue (y compris depuis une sauvegarde v1).

**Vérifié.** Script de bout en bout : les six missions jouées, deux échecs
provoqués puis réussis au second essai, sauvegarde/rechargement, zéro
erreur console.

**Reste.** Deux missions de plus pour atteindre 8 (contenu seul, Sonnet).
La boucle de `VERTICAL_SLICE.md` (zone vitrine) dépend surtout du jalon 1
(arbres, façades), plus du système de missions.

**Condition de passage au jalon 8.** Remplie côté missions.

## 8. Optimisation et test avec des amis — PARTIELLEMENT FAITE

**Fait.** Presets graphiques (faible/moyen/élevé/auto), panneau de mesures
en direct, InstancedMesh pour tout élément répété, fusion par îlot,
formes de personnage/véhicule partagées (v0.9, v0.15).

**Pas fait.** Aucune mesure sur GPU réel (tout a été testé en rendu
logiciel). Aucun build/déploiement statique choisi. Aucun retour de tiers
recueilli.

**Modèle conseillé.** Sonnet pour le déploiement (une page statique,
GitHub Pages ou équivalent, ne demande pas d'architecture nouvelle).

**Condition de passage au jalon 9.** Un lien fonctionnel, testé par au
moins une personne extérieure à cette session.

## 9. Extension V1 — NON COMMENCÉE

Missions supplémentaires, plus de véhicules dans la boucle de jeu,
téléphone limité, économie légère — voir `V1_SCOPE.md` (SHOULD HAVE).
Ne commence qu'après le jalon 7.

## 10. V1 release — NON COMMENCÉE

Page de présentation, instructions, contrôles, changelog, bugs connus,
build stable. Dépend entièrement des jalons 7 et 8.

## Hors séquence — dépend d'une ressource externe

**Architecture de personnage GLB/glTF.** Peut être construite
(`GLTFLoader`, `AnimationMixer`, secours procédural) à tout moment sans
dépendre des jalons ci-dessus, mais **ne changera rien à l'écran tant
qu'aucun fichier `.glb` n'est fourni** — cet environnement n'a accès à
aucun asset externe. Modèle conseillé : Opus (plusieurs fichiers à faire
tenir ensemble : loader, animator, factory, fallback). À ne lancer que si
tu peux toi-même fournir un modèle avec une licence claire, ou que tu
acceptes que le résultat immédiat soit uniquement l'architecture, pas le
rendu.
