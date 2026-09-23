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

## 2. Personnage et caméra — PARTIELLEMENT FAITE

**Objectif.** Proportions, animations, visée, arme visible, réactions à la
mort/aux chutes.

**Fait** (v0.12, v0.13) : caméra à hauteur d'épaule, animation de
respiration à l'arrêt, marche/course par oscillation, visée alignée à 3,8°
de l'axe réel, arme visible et contrastée.

**Pas fait.** Réaction visuelle du joueur à ses propres dégâts (les
ennemis en ont une depuis la v0.8, pas le joueur — vérifié en lisant
`Player.damage()`). Accroupissement. Pose d'entrée/sortie de véhicule.

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

## 5. Audio et game feel — LARGEMENT FAITE

**Fait.** Moteur, sirène, klaxon, chocs, tir par arme, tonnerre retardé
par la distance (v0.10, vérifié : 1 372 m → 5 s), jingles de réussite/échec,
notifications en fondu (v0.12).

**Pas fait.** Musique ou ambiance de fond en boucle.

**Modèle conseillé.** Sonnet, et seulement si le silence ambiant gêne
réellement en jouant la tranche verticale — ce n'est pas un manque
structurel.

**Condition de passage au jalon 6.** Non bloquant.

## 6. HUD, pause et options — LARGEMENT FAITE

**Fait.** Thème « Nocturne urbain » centralisé + 2 variantes (v0.11), menu
pause navigable sans bug d'oscillation, 19 réglages persistés et appliqués
en direct, FOV séparé par contexte (v0.12).

**Pas fait.** Remappage des touches. Trois emplacements de sauvegarde
(un seul aujourd'hui — suffisant pour la V1, voir `V1_SCOPE.md`).

**Condition de passage au jalon 7.** Déjà remplie — rien ne bloque la
suite depuis ce jalon.

## 7. Mission de la tranche verticale — NON COMMENCÉE

**Objectif.** Voir `VERTICAL_SLICE.md` en détail — 5 à 10 minutes, la
boucle en 9 étapes y est décrite précisément.

**Ce qui manque réellement** : un système de missions scénarisées avec
prérequis et échec possible. Le tutoriel et les jobs actuels
(`missions.js`) n'ont ni l'un ni l'autre.

**Modèle conseillé.** Sonnet pour une seule mission scriptée sur le moteur
d'étapes existant (`start(nom, étapes)` déjà dans `missions.js`) ; Opus si
le système de prérequis/enchaînement lui-même doit être conçu, pas
seulement utilisé.

**Condition de passage au jalon 8.** La boucle en 9 étapes se termine sans
blocage, une fois, en une seule prise, zéro erreur console.

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
