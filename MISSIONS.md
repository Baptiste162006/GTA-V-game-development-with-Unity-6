# MISSIONS

Système de missions de San Felipe City : ce qui existe dans le code (v0.22),
comparé point par point au cahier des charges « système de missions /
étapes » fourni le 2026-09-24. Chaque écart est soit une décision assumée
(avec la raison), soit une tâche dans `BACKLOG.md` (étape 2 de la feuille de
route). Code : `game/story.js` (données), `game/missions.js` (moteur).

## 1. Structure d'une mission

| Champ du cahier des charges | Dans le code (`STORY` dans `story.js`) | État |
|---|---|---|
| `id` | `id` (`'intro'`, `'premier-contrat'`…) | ✅ |
| `titre` | `title` (affiché en grand au lancement) | ✅ |
| `description` | `brief` (réplique du contact, en notification) | ✅ |
| `quartier` | implicite via `where` (le HUD affiche le quartier) | ✅ implicite |
| `prerequis` | `requires: ['id', …]` | ✅ missions seulement (voir §2) |
| `pointDeDepart` | `where` + `contact` | ✅ type « zone » seulement (voir §3) |
| `etapes` | `steps(mm, ctx)` → liste ordonnée | ✅ |
| `conditionEchec` | `failIf` + `failReason` par étape, `time` pour le chrono ; mort/arrestation globales | ✅ |
| `conditionSucces` | `check` par étape ; mission réussie quand la dernière étape passe | ✅ |
| `recompenses` | `reward` (argent) | ✅ argent seul (voir §7) |
| `sauvegarde` | liste des missions terminées | 🟡 voir §6 |

Format d'une étape : `{ text, color, marker | track, enter, check, failIf,
failReason, time }`. `track` fait suivre au marqueur une cible mobile (une
voiture en fuite, l'ennemi le plus proche).

## 2. Prérequis

**Fait.** `requires` liste les missions à terminer avant. Une mission dont
les prérequis ne sont pas remplis n'a pas de contact dans le monde et
n'apparaît pas dans la liste « disponibles » du menu Missions.

**Écarts.**
- *Réputation par quartier, systèmes débloqués* (armes de base, véhicule
  perso, téléphone) : aucun de ces systèmes n'existe dans le jeu, donc
  aucun prérequis ne peut s'y appuyer. Décision : non implémenté tant que
  les systèmes eux-mêmes n'existent pas (réputation = V2, téléphone =
  SHOULD HAVE après la V1).
- *Missions verrouillées affichées grisées avec la raison* (« Terminez
  “Premier contrat” ») : **pas fait** → BACKLOG, étape 2, P1 S.

## 3. Point de départ

**Fait.** Type « zone » : colonne lumineuse ambre dans la rue + étoile
jaune sur la mini-carte (épinglée au bord quand hors champ) et sur la
grande carte. Rayon 4,5 m. Refusé tant qu'on a des étoiles (« Sème la
police avant de voir Rosa »). Le contact disparaît pendant la mission et
réapparaît après un échec. Il faut s'éloigner à plus de 15 m avant qu'un
contact puisse relancer une mission (pas de relance involontaire en
réapparaissant dessus).

**Écarts.**
- *« Appuyez sur E pour commencer »* : aujourd'hui la mission part dès
  qu'on entre dans la zone. Une confirmation évite de lancer une mission
  par accident en traversant la rue → BACKLOG, étape 2, P1 S (touche E,
  libre aujourd'hui ; F est pris par les véhicules).
- *PNJ à rencontrer* (un personnage visible sur le contact) : P2 M.
- *Appel / message téléphone* : dépend du téléphone (SHOULD HAVE, après la
  V1).

## 4. Étapes

| Type du cahier des charges | Disponible | Exemple dans l'histoire |
|---|---|---|
| `aller_a` | ✅ `marker` + `reachedMarker(r)` | tutoriel, étape 1 |
| `conduire` | ✅ idem + `ctx.player.inVehicle` | Contre la montre |
| `livrer` | ✅ | Premier contrat, Le mouchard |
| `tuer` | ✅ escouade + compteur « (3 restants) » | Dette impayée, Le grand coup |
| poursuite (en plus du cahier) | ✅ `track` sur une voiture en circulation | Le mouchard |
| fuir la police (en plus) | ✅ | Dette impayée, Le grand coup |
| `proteger` | ❌ | — |
| `survivre` (X s / vagues) | ❌ | — |
| `dialogue` | ❌ (le `brief` en notification en tient lieu) | — |

Les trois types manquants → BACKLOG, étape 2 : `survivre` P2 S (un chrono
qui réussit au lieu d'échouer), `proteger` P2 M (un PNJ allié avec de la
vie, ciblé par les ennemis — il n'existe pas d'allié aujourd'hui),
`dialogue` P3 M (boîte de texte, pause des commandes).

HUD : texte de l'étape, distance à l'objectif, chrono ; marqueur 3D +
mini-carte. Passage automatique à l'étape suivante.

## 5. Échec

**Fait** — toutes ces conditions font échouer la mission en cours :
mort du joueur, arrestation, chrono écoulé, voiture de mission abîmée
(≥ 70 %) ou abandonnée (> 40 m), zone quittée (> 170 m de la planque),
cible perdue (> 250 m ou disparue), descendu du véhicule pendant la
course. Message « MISSION ÉCHOUÉE » + raison, puis « Retourne voir … pour
réessayer ». Tout ce que la mission avait créé (ennemis, voiture) est
retiré (`mm.onCleanup`), donc un nouvel essai repart propre.

**Comportement après échec** (§6.3 du cahier des charges) : le mode
« remettre en disponible » est celui du jeu, pour toutes les missions.
Décision assumée pour la V1 : c'est le comportement de GTA (on revient au
contact) et il ne peut pas laisser d'état incohérent.
- *Recommencer immédiatement* (bouton « Réessayer » sur l'écran d'échec) :
  BACKLOG P2 S — confortable, sans risque.
- *Checkpoint par étape* : BACKLOG, V1.1, L, Opus — voir §6.

**Mort d'une cible importante** : aucune mission n'a encore de cible à
protéger (pas de type `proteger`). Règle retenue pour quand elle
existera : la raison affichée est la plus narrative (« Le témoin est
mort ») même si le joueur meurt dans la même image.

**Autres conditions du cahier** : temps limité ✅, dégâts max ✅ (berline),
détection par la police ❌ → P2 S (`failIf: wanted >= X`, une ligne par
mission ; aucune mission de discrétion n'est prévue dans l'histoire
actuelle).

## 6. Sauvegarde de la progression

**Fait.** `missions.story` (missions terminées), `missions.completed`,
tutoriel fait — écrit à chaque fin de mission, à la pause, à la mort, à la
réapparition et par « Sauvegarder » ; relu au chargement ; une sauvegarde
v1 (sans `story`) reste lisible.

**Écart principal — mission en cours non sauvegardée.** Recharger la page
en pleine mission la fait disparaître ; son contact est de nouveau
disponible. Décision pour la V1 : **c'est voulu**. Reprendre une mission
au milieu demanderait de recréer exactement ses ennemis, sa voiture (avec
ses dégâts), sa cible en circulation et son chrono — un vrai système de
checkpoints (V1.1, L, Opus). Une mission dure 1 à 4 minutes : la
recommencer depuis le contact coûte peu au joueur, et il ne retrouve
jamais une mission à moitié cassée.

**Sauvegarde corrompue** : aujourd'hui une sauvegarde illisible est
**ignorée en silence** — le jeu démarre une partie neuve et la prochaine
sauvegarde automatique **écrase** l'ancienne. C'est une perte de données
possible → BACKLOG, étape 0 (stabilisation), P0 S : message clair,
sauvegarde illisible mise de côté au lieu d'être écrasée, choix de
repartir à zéro.

## 7. Récompenses

Argent seulement (500 à 4 000 $). Armes débloquées, réputation : pas de
système correspondant (les armes s'achètent déjà ; la réputation est V2).
Une récompense « élément de tenue » deviendra possible avec la
personnalisation (`CUSTOMIZATION.md`).

## 8. L'histoire actuelle

| # | Mission | Contact | Prérequis | Étapes | Échecs possibles | Récompense |
|---|---|---|---|---|---|---|
| 0 | Bienvenue à San Felipe | (auto au lancement) | — | marcher, monter en voiture, conduire, semer 1 étoile | mort, arrestation | 500 $ |
| 1 | Premier contrat | Rosa (Vieille Ville) | 0 | récupérer une berline, la livrer au garage | chrono, dégâts ≥ 70 %, abandon | 900 $ |
| 2 | Dette impayée | Kenji (Little Tokyo) | 1 | approcher, 3 hommes de main, butin, 2 étoiles | zone quittée | 1 500 $ |
| 3 | Le mouchard | Kenji | 2 | rattraper une voiture en circulation, l'amener à la casse | cible perdue, chrono, abandon | 1 300 $ |
| 4 | Contre la montre | Kenji | 3 | 5 points de passage chronométrés | chrono par point, descendu du véhicule | 1 100 $ |
| 5 | Le grand coup | Rosa | 4 | entrepôt (5 ennemis), magot, 3 étoiles, retour chez Rosa | zone quittée | 4 000 $ |

## 9. Ajouter une mission

Une entrée dans `STORY` (`story.js`) : `id`, `title`, `contact`, `where`
(sur un axe de rue : x ou z multiple de 62), `requires`, `reward`,
`brief`, `steps(mm, ctx)`. Aides disponibles : `missionCar` (voiture qui
ne sera pas recyclée), `missionSquad` (ennemis retirés en cas d'échec),
`assaultSteps` (approche + élimination + butin), `escapeStep(étoiles)`,
`roadPointAround`. Test : ajouter un bloc au script `storytest`.
