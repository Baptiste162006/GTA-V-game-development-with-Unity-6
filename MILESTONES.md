# MILESTONES

Réorganisé le 2026-09-24 selon l'**ordre de travail V1** que tu as fixé
(étapes 0 à 12). Règle : **on ne passe pas à l'étape N+1 tant que
l'étape N n'est pas validée par toi.** Chaque étape indique son état réel
(vérifié dans le code), ce qui reste, les critères d'acceptation, le
modèle conseillé et la condition de passage.

Plusieurs étapes ont déjà été faites avant cet ordre (0, 1, 2, une bonne
partie de 3). Elles sont marquées « faite — à valider » : c'est à toi de
les accepter pour débloquer la suite.

Détails par système : `MISSIONS.md`, `AUDIO_SYSTEM.md`,
`CUSTOMIZATION.md`, `VERTICAL_SLICE.md`, `ART_DIRECTION.md`. Tâches :
`BACKLOG.md` (mêmes numéros d'étape).

| Étape | Sujet | État | Modèle |
|---|---|---|---|
| 0 | Stabilisation du prototype | ✅ faite, à valider (4 bugs corrigés) | Sonnet |
| 1 | Audit et documentation | ✅ faite — à valider | Opus |
| 2 | Système de missions | ✅ faite (v0.22) — écarts listés, à valider | Opus |
| 3 | UI / HUD / mini-carte / menus | 🟡 largement faite | Sonnet |
| 4 | Audio de base | ❌ architecture écrite, rien codé | Opus puis Sonnet |
| 5 | Direction artistique environnement | 🟡 façades 3 styles, mobilier de base | Sonnet |
| 6 | Personnage et caméra | 🟡 largement faite | Sonnet |
| 7 | Véhicules et conduite | 🟡 largement faite | Sonnet |
| 8 | Combat et ennemis | 🟡 1 seul profil d'ennemi | Sonnet |
| 9 | Personnalisation du personnage | ❌ architecture écrite, rien codé | Opus puis Sonnet |
| 10 | Vertical slice — mission complète | ❌ dépend de 5 | Opus |
| 11 | Optimisation et tests amis | 🟡 mesuré en rendu logiciel seulement | Sonnet |
| 12 | V1 release | ❌ | Sonnet |

---

## 0. Stabilisation du prototype — ✅ FAITE, À VALIDER (Sonnet)

**Objectif.** Aucun bug bloquant : contrôles, caméra, arme/visée,
collisions, sauvegarde.

**Fait.** Caméra à hauteur d'épaule et anti-mur par ratio (v0.12) ;
visée face à la cible, arme visible (v0.13) ; assiette des véhicules
(v0.14) ; oscillation du menu pause (post-v0.9) ; job Livraison qui
plantait, voiture garée impossible à reprendre, tutoriel rejoué à chaque
lancement (v0.22). Checklist de tests manuels : `BACKLOG.md` ; 13 scripts
de régression automatiques lancés avant chaque push.

**Les 4 bugs trouvés (3 à l'audit, 1 en jouant), tous corrigés :**
1. ~~**Collisions joueur/véhicules**~~ — ✅ corrigé en v0.23 (rectangle au
   sol orienté, deuxième passe après le trafic, entrée mesurée depuis la
   carrosserie). Script `collisiontest`.
2. ~~**Origine du tir**~~ — ✅ corrigé en v0.24 (origine au canon,
   `wallDistance` testé dès d=0). Script `muzzletest`.
3. ~~**Sauvegarde corrompue**~~ — ✅ corrigée en v0.25 (mise de côté,
   message, jamais écrasée). Script `corruptsavetest`.
4. ~~**Personnage collé à un mur pendant le tutoriel**~~ — repéré en
   jouant le 24/09 (capture d'écran) : le marqueur de l'étape 1 et le
   point d'apparition de la voiture de l'étape 2 (`story.js`, mission
   `intro`) étaient des décalages fixes depuis la position du joueur,
   sans vérifier qu'un bâtiment ne s'y trouve pas — contrairement aux
   missions suivantes, qui utilisent `roadPointAround()`. ✅ Corrigé en
   v0.26 (point de rue pour le marqueur, place de stationnement la plus
   proche pour la voiture). Script `tutowalltest`, 49 points de départ
   différents vérifiés.

**Critères d'acceptation.** On ne traverse plus une voiture à l'arrêt ni
en mouvement ; un tir contre un mur à bout portant ne le traverse pas ;
une sauvegarde volontairement corrompue affiche un message, est mise de
côté et n'est pas écrasée ; le tutoriel ne place plus jamais son marqueur
ou sa voiture dans un bâtiment ; les 13 scripts passent.

**Test.** Un script dédié par bug + régression complète.

**Condition de passage.** Les 4 bugs corrigés et testés — reste ta
validation.

## 1. Audit complet et documentation — ✅ FAITE, À VALIDER (Opus)

`PROJECT_STATUS.md`, `V1_SCOPE.md`, `VERTICAL_SLICE.md`,
`MILESTONES.md`, `BACKLOG.md` écrits le 2026-09-23 et tenus à jour
depuis ; `MISSIONS.md`, `AUDIO_SYSTEM.md`, `CUSTOMIZATION.md` ajoutés le
2026-09-24. **Condition de passage :** ta validation.

## 2. Système de missions — ✅ FAITE (v0.22), À VALIDER (Opus)

**Fait.** Six missions (le cahier des charges en demandait une) :
prérequis, points de départ (contacts), étapes, échecs, nettoyage,
réessai, progression sauvegardée. Détail et comparaison point par point
avec ton cahier des charges : `MISSIONS.md`.

**Écarts (BACKLOG étape 2).** Confirmation « Appuie sur E » au contact
(P1) ; missions verrouillées affichées grisées avec la raison (P1) ;
bouton « Réessayer » sur l'écran d'échec (P2) ; types d'étape
`survivre` / `proteger` / `dialogue` (P2-P3) ; échec par détection
police (P2) ; checkpoints et reprise en pleine mission (V1.1 — choix
assumé, voir `MISSIONS.md` §6) ; 2 missions de plus (P2).

**Condition de passage.** Ta validation (avec ou sans les deux P1).

## 3. UI / HUD / mini-carte / menus — 🟡 LARGEMENT FAITE (Sonnet)

**Fait.** HUD complet (objectif + distance + chrono, heure, quartier,
boussole, météo, argent, vie/armure chiffrées, arme + munitions + barre
de rechargement, étoiles, mini-carte) ; menu pause (Reprendre, Carte,
Missions, Statistiques, Options, Commandes, Sauvegarder, Réinitialiser,
Recommencer, Quitter) ; 20 réglages ; mini-carte nord fixe ou « suit le
cap », contacts d'histoire en étoile.

**Reste.** Options en sections (Vidéo/Audio/Contrôles/Accessibilité/À
propos) + réinitialiser les options ; remappage des touches ;
vérification HUD sur 4 ratios et aux tailles min/max ; écran de
chargement ; texte d'accueil « huit quartiers » (il y en a 6).

**Condition de passage.** Options en sections et vérification
multi-ratios faites ; le remappage peut suivre en parallèle de l'étape 4.

## 4. Audio de base — ❌ ARCHITECTURE ÉCRITE (Opus, puis Sonnet)

`AUDIO_SYSTEM.md`. Ordre : bus + limiteur + pool de voix (Opus, c'est la
fondation) → curseurs par bus → armes (variation, rechargement, impacts
chair/béton) → véhicules (3 profils, démarrage/arrêt, roulement, bosse)
→ ambiance (ville, vent) → pas → interface.

**Critères.** Une rafale d'UZI de 5 s ne dépasse pas le plafond de voix ;
aucun son en pause/après la mort hors interface ; chaque curseur à 0
coupe son bus ; script `audiotest`.

## 5. Direction artistique environnement — 🟡 (Sonnet)

**Fait.** 3 styles de façade, bancs, poubelles (v0.15), fusion par îlot.
**Reste.** Arbres (4 silhouettes, tailles, teintes, buissons, herbe,
vent), façades 6-8 styles + vitrines/enseignes, mobilier (panneaux,
abribus, bornes, lampadaires variés), zone vitrine 200 × 200 m avec
garage/station-service. Draw calls mesurés, < 500.
Détail : `ART_DIRECTION.md`, `VERTICAL_SLICE.md`.

## 6. Personnage et caméra — 🟡 LARGEMENT FAITE (Sonnet)

**Fait.** Proportions, marche/course/respiration/saut/mort, visée alignée,
arme visible, réaction aux dégâts (v0.18), caméra épaule anti-mur, FOV par
contexte. **Reste (à vérifier pièce par pièce avant d'affirmer quoi que
ce soit) :** pose d'atterrissage, geste de rechargement, pose
d'entrée/sortie de véhicule, accroupissement.

## 7. Véhicules et conduite — 🟡 LARGEMENT FAITE (Sonnet)

**Fait.** 16 modèles, physique arcade, roues asservies, feux, dégâts +
fumée, suspension. **Reste.** Jantes distinctes, vitres, véhicule
détruit (feu puis explosion). Le cahier des charges cite le **camion**
parmi les 5 véhicules de la démo, `V1_SCOPE.md` citait le **taxi** : à
trancher (les deux existent).

## 8. Combat et ennemis — 🟡 (Sonnet)

**Fait.** 6 armes, dégâts par zone, gangs qui tirent, police armée.
**Reste.** 3-5 profils d'ennemis (P1) ; couvertures simples (P2 — était
classé V2, remonté ici par ton ordre de travail) ; ramassage d'arme (P2).

## 9. Personnalisation du personnage — ❌ ARCHITECTURE ÉCRITE (Opus, puis Sonnet)

`CUSTOMIZATION.md`. Ordre : 5ᵉ matériau (chaussures) + catalogue +
`applyAppearance` en place (Opus) → menu Garde-robe dans la pause →
contenus (coiffures, hauts, bas, chaussures, accessoires) → prix et
récompenses → variété des PNJ.

## 10. Vertical slice — mission complète — ❌ (Opus)

Boucle de 9 étapes dans la zone vitrine (`VERTICAL_SLICE.md`). Le moteur
de missions est prêt ; il manque la zone vitrine (étape 5). Une mission
dédiée « vitrine » sera écrite dans `story.js` une fois la zone en place.

## 11. Optimisation et tests amis — 🟡 (Sonnet)

**Fait.** Presets, panneau de mesures, instancing, fusion par îlot.
**Reste.** Déploiement statique, mesure sur GPU réel (sur ta machine),
test par 2-3 personnes extérieures.

## 12. V1 release — ❌ (Sonnet)

Build stable, page de présentation (contrôles, objectifs, bugs connus,
changelog), sauvegarde fiable, aucun bug bloquant.

## Hors séquence — dépend d'une ressource externe

**Personnage GLB/glTF** : ne change rien à l'écran sans fichier `.glb`
sous licence claire, indisponible ici. Opus, uniquement si tu fournis un
modèle.
