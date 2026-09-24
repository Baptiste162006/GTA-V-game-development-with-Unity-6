# V1_SCOPE

Objectif de la V1 : un jeu **complet sur une petite zone**, jouable dans un
navigateur, que tu peux envoyer à des amis sans avoir à l'expliquer. Pas une
copie de GTA V, pas un monde entièrement détaillé — un style cohérent et
assumé, jusqu'au bout. Règle : **aucun système à moitié fait** en V1. Tout
ce qui n'est pas en V1 est listé explicitement en bas (« Reporté en V2 »),
avec la raison — rien n'est mis de côté en silence.

Mis à jour le 2026-09-23 après vérification dans le code. Plusieurs
affirmations de la version précédente de ce fichier étaient trop
optimistes (« menu/options/audio/sauvegarde : déjà là ») ; elles sont
corrigées ci-dessous, élément par élément.

## Corrections du récapitulatif (le code fait foi)

| Affirmation | Réalité dans le code |
|---|---|
| Lance-roquettes parmi les armes | N'existe pas. 6 armes : poings, pistolet, UZI, pompe, fusil d'assaut, sniper (`weapons.js`). |
| Quartier « banlieue » | N'existe pas. 6 quartiers : Downtown, Little Tokyo, Mirador Hills, Zone Industrielle, Beachside, Vieille Ville (`world.js`). La page d'accueil dit « huit quartiers » — faux, à corriger (BACKLOG). |
| Saisons/neige « à faire » | Déjà faites (v0.10) : 4 saisons, neige qui s'accumule et réduit l'adhérence. |
| Sauvegarde complète | **Corrigé en v0.19** : garde maintenant position, véhicule, armes/munitions, météo, saison, missions, en plus de l'argent/stats/heure ; entrées « Sauvegarder », « Réinitialiser la sauvegarde » et « Quitter » ajoutées au menu. |
| Menu pause complet | **Corrigé en v0.19** : Sauvegarder, Réinitialiser la sauvegarde et Quitter ajoutés (10 entrées). Reste en une seule liste sans onglets — voir Options ci-dessous, toujours ❌. |
| Audio avec bus Musique/Effets/Ambiance | Un seul `master` + des gains par canal (moteur, sirène, pluie, crissement). Pas de musique, pas de pas, pas de son de rechargement, pas d'impact par matériau, pas d'ambiance de ville ; les sons d'interface réutilisent `blip()`. |
| Clignotants, ronds-points | N'existent pas. Aucun carrefour avec priorité ni feu tricolore. |
| Écran de chargement | N'existe pas (la génération est quasi instantanée, mais rien ne s'affiche pendant ce temps). |
| Réaction du joueur aux dégâts, arme visible | **Déjà faites** (v0.18 et v0.13) — ne plus les lister comme manquantes. |

## MUST HAVE — sans ça, ce n'est pas une V1

État : ✅ fait · 🟡 partiel · ❌ absent.

### Monde et contenu
- 🟡 Une zone vitrine détaillée (`VERTICAL_SLICE.md`) : manquent arbres
  variés, façades 6-8 styles, mobilier complet, garage/station-service.
- ✅ Personnage procédural (le rendu final de la V1 : aucun `.glb`
  disponible ici), caméra, visée, arme visible, réaction aux dégâts.
- ✅ 5 véhicules jouables propres parmi les 16 (citadine, berline, sportive,
  taxi, police) ; 🟡 jantes et vitres encore basiques.
- ✅ 6 armes. 🟡 1 seul profil d'ennemi → 3 à 5 profils.
- ✅ 6 missions scénarisées (v0.22) : tutoriel + 5 missions enchaînées, avec
  contacts dans la ville, prérequis, échec/réessai, récompenses et
  progression sauvegardée. Les 2 jobs répétables restent en plus.
- ✅ Météo 5 états + saisons.

### HUD (règles de mise en page)
- ✅ Argent, étoiles, vie/armure, arme + munitions, mini-carte, objectif,
  notifications en fondu — thème centralisé.
- 🟡 À vérifier et figer : rien ne se chevauche en 16:9, 16:10, 21:9 et
  fenêtre étroite ; tout reste lisible à `hudScale` min et max ; HUD masqué
  en menu, en mort et en cinématique ; aucun élément n'est centré sur la
  croix de visée.

### Mini-carte et HUD — classement des améliorations proposées

Liste complète avec description, priorité, effort et modèle dans
`BACKLOG.md` § « Mini-carte et HUD ». Rien n'est codé, à valider avant de
lancer le travail.

**MUST HAVE (V1)** — ✅ **faites en v0.20** : distance chiffrée jusqu'à
l'objectif (sous le texte d'objectif, « 240 m » / « 1.2 km ») et barre de
progression pour le rechargement (sous les munitions, largeur
proportionnelle au temps restant).

**SHOULD HAVE (V1)** — ✅ **faites en v0.21** : rotation de la
mini-carte façon « suivant le joueur » (réglage dans Options, nord fixe
restant le défaut) et boussole (cardinal + degrés, sous le nom de
quartier). Deux corrections d'audit au passage : le nom de quartier
était **déjà** affiché en continu en jeu avant cette liste (erreur du
23/09), et un réglage pour masquer la mini-carte existait **déjà** aussi
— ni l'un ni l'autre n'avait besoin d'être « fait ».

**COULD HAVE (v1.1)** :
- Flèche 3D « suivez le point » façon GPS.
- Zoom mini-carte.
- Icônes distinctes par type de véhicule sur la mini-carte.
- Raccourci pour rappeler le texte d'objectif.
- Distinguer visuellement « recherché » et « poursuite active ».
- Lisibilité des icônes HUD à `hudScale` minimal — à vérifier avant tout
  (c'est un test, pas une fonctionnalité), mais toute correction qu'il
  révélerait passe dans ce lot.

### Menu pause (contenu cible)
- ✅ Reprendre · ✅ Statistiques · ✅ Carte · ✅ Missions · ✅ Commandes.
- ✅ **Sauvegarder** — avec message de confirmation « Partie sauvegardée » (v0.19).
- ✅ **Réinitialiser la sauvegarde** — avec confirmation explicite (v0.19).
- 🟡 **Options** — existe en liste unique, à organiser en sections.
- ✅ **Quitter** — sauvegarde puis retour à l'écran-titre (v0.19).
- ✅ La sauvegarde inclut désormais : position, véhicule courant, armes et
  munitions, progression des missions, argent, statistiques, heure, météo,
  saison (v0.19).

### Options (sections cibles)
- 🟡 **Vidéo** : qualité, échelle de rendu, ombres, FOV ×4 — existent.
- 🟡 **Audio** : volume général, moteur, sirène existent ; manquent
  Musique, Effets, Ambiance, Interface (un curseur par bus).
- 🟡 **Contrôles** : sensibilité, inversion Y existent ; ❌ remappage des
  touches (structure : action → touche, conflit signalé, sauvegardé).
- 🟡 **Accessibilité** : thème daltonisme, taille et opacité du HUD, secousses
  existent ; à regrouper dans cette section.
- ❌ **À propos / Crédits** : version, licences (Three.js MIT), auteur.
- ❌ **Réinitialiser les options** par défaut, avec confirmation.

### Écran de chargement
- ❌ Écran affiché pendant la génération de la ville, avec progression
  réelle (étapes : ville, végétation, circulation), puis fondu vers le jeu.

### Audio (cible)
- Architecture : ❌ bus **Master → Musique / Effets / Ambiance / UI**,
  chaque bus relié à un curseur d'options ; ❌ pool de sources avec limite
  simultanée (ex. 24 voix) pour qu'une fusillade ne sature pas ; 🟡 gestion
  de l'autoplay (le contexte démarre au premier clic — à vérifier aussi
  après un changement d'onglet).
- Véhicules : ✅ moteur, ✅ sirène, ✅ klaxon, ✅ chocs, ✅ crissement ;
  ❌ démarrage/arrêt moteur, ❌ roulement selon la vitesse, ❌ bosses.
- Armes : ✅ tir par arme, ✅ clic à vide ; ❌ rechargement ; ❌ impacts par
  matériau (béton, métal, chair, sol) ; ❌ explosion (aucune source
  d'explosion aujourd'hui — liée aux véhicules détruits, voir BACKLOG).
- Monde : ✅ pluie, ✅ tonnerre ; ❌ ambiance de ville (circulation
  lointaine, vent, oiseaux le jour), ❌ pas du joueur et des PNJ.
- Interface : ❌ sons dédiés (navigation, validation, retour, argent) —
  aujourd'hui `blip()` générique.

### Technique
- 🟡 Optimisation : mesurée en rendu logiciel (226-301 draw calls,
  budget 500) ; jamais sur GPU réel.
- ❌ Build web partageable (hébergement, page de présentation).
- ✅ Zéro erreur console sur les scripts de régression.

## SHOULD HAVE — améliore la V1 sans la bloquer

- ✅ Saisons (dépasse la demande).
- ❌ Téléphone limité — après les missions, sinon rien à afficher.
- ❌ Garage/couleurs (les couleurs existent déjà dans `VEHICLE_SPECS`).
- ✅ Argent, primes, amendes. ✅ 2 jobs répétables. ✅ 16 véhicules.

## Reporté en V2 — liste explicite, avec la raison

| Élément | Raison du report |
|---|---|
| Personnage GLB animé | Aucun fichier `.glb` sous licence claire disponible ; l'architecture seule ne change rien à l'écran. |
| Plusieurs emplacements de sauvegarde | Un seul suffit pour une démo de 5-10 min ; le réinitialiser couvre le besoin. |
| Feux tricolores, priorités, clignotants, ronds-points | Touche trafic + monde + police ; aucun impact sur la boucle de la tranche verticale. |
| Tir depuis un véhicule | Nouveau mode caméra/visée complet, risque de régression sur la visée stabilisée. |
| Déformation de carrosserie | Géométrie par véhicule ; la teinte + fumée suffisent à lire les dégâts en V1. |
| Musique composée (plusieurs pistes/radios) | En V1 : une boucle d'ambiance synthétisée. Les radios demandent du contenu musical que ce projet ne produit pas. |
| Congères, neige sur les toits | Décoratif ; la mécanique de neige existe. |
| Économie/propriétés, personnage alternatif | Systèmes entiers sans lien avec la boucle V1. |
| Couvertures pour l'IA ennemie | Nouveau système d'IA ; 3-5 profils suffisent à varier les combats en V1. |
| Intérieurs visitables, multijoueur, ville de 4 km², 69 missions, 100 véhicules, 35 armes, 30 radios, photoréalisme | Incompatibles avec un projet Three.js sans pipeline d'assets mené par une personne. |
