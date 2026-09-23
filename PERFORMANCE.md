# Performance — San Felipe City

Ce document n'est pas une liste d'intentions : chaque chiffre vient d'une
mesure reproductible, décrite plus bas. Il sert à deux choses — vérifier
qu'une optimisation a vraiment servi, et repérer tout de suite la frame qui
coûte trop cher.

## Mesurer soi-même, en jeu

| Commande | Effet |
| --- | --- |
| `perf` | Ouvre le panneau de compteurs en direct |
| `mesure` | Le même instantané en JSON, pour le noter ou le comparer |
| `quality faible \| moyen \| eleve \| auto` | Change le preset sans passer par le menu |
| `stress traffic \| police \| weather \| combat` | Charge la scène pour voir le pire cas |
| `fps` | Le petit compteur discret en haut de l'écran |

Le panneau ne se réécrit que 5 fois par seconde et n'alloue rien par frame :
l'ouvrir ne fausse pas la mesure.

## Ce qui est mesurable ici, et ce qui ne l'est pas

Le banc d'essai tourne dans Chromium **en rendu logiciel** (SwiftShader), sans
GPU. Conséquence importante et assumée : **les millisecondes de rendu ne
veulent rien dire**. Le pilote logiciel regroupe et diffère le travail, au
point qu'une même scène rendue sans ombres s'est mesurée *plus lente* qu'avec
— c'est un artefact de l'outil, pas du jeu. Les chiffres ci-dessous sont donc
ceux qui ne dépendent pas de la carte graphique :

- **draw calls** et **triangles** par frame — la charge envoyée au GPU ;
- **géométries** et **meshes** — ce qui occupe la mémoire graphique ;
- **temps de logique** (ms de JavaScript pur, hors rendu) ;
- **mémoire JS**.

Ce sont exactement les compteurs sur lesquels on peut agir depuis le code.

## Protocole

Scène **figée** et identique d'une version à l'autre : ville générée avec la
graine fixe `20260921`, heure bloquée à 14 h, circulation et piétons vidés,
caméra placée au degré près, aucune mise à jour du jeu entre les images. Les
compteurs sont cumulés sur 12 images puis divisés, jamais lus sur une seule.
Sans ce gel, la circulation aléatoire faisait varier les draw calls de ±40 %
d'une exécution à l'autre, ce qui rendait toute comparaison inutilisable.

Deux emplacements : le carrefour central de **Downtown** (le pire cas, tours
partout) et la **périphérie de Mirador Hills** (pavillons bas, cas léger).

## Résultats : avant / après la passe d'optimisation

Scène figée, qualité **élevée** :

| Compteur | Avant | Après | Gain |
| --- | ---: | ---: | ---: |
| Draw calls — Downtown | 153 | **97** | −37 % |
| Draw calls — Mirador Hills | 94 | **67** | −29 % |
| Géométries en mémoire | 321 | **94** | −71 % |
| Meshes dans la scène | 233 | **113** | −52 % |
| Triangles — Downtown | 50 162 | 50 482 | inchangé |
| Mémoire JS | 15 Mo | **13 Mo** | −13 % |

Le nombre de triangles ne bouge pas, et c'est voulu : on dessine exactement la
même ville, en moins d'envois.

Coût d'un objet supplémentaire, mesuré en ajoutant dix exemplaires puis en
relisant le compteur de géométries **après** rendu :

| Ajout | Avant | Après |
| --- | ---: | ---: |
| 10 berlines | +50 géométries | **+0** |
| 10 personnages | +90 géométries | **+0** |

C'est le cœur du gain : une voiture ou un passant de plus ne coûte désormais
plus une seule géométrie.

## Ce qui a été changé, et pourquoi

1. **Formes partagées entre personnages** (`game/player.js`). Chaque appel à
   `buildCharacter` allouait neuf géométries neuves — torse, bassin, tête,
   cheveux, bras, main, cuisse, mollet, chaussure. Elles sont désormais
   construites une seule fois et partagées par tout le monde ; seules les
   couleurs, donc les matériaux, restent propres à chaque personnage.
2. **Formes partagées entre véhicules** (`game/vehicle.js`). Les dimensions
   d'une carrosserie ne dépendent que du modèle : quinze jeux de géométries
   suffisent pour toute la circulation, au lieu d'un jeu par exemplaire.
   Corollaire indispensable : `Vehicle.dispose()` ne libère plus les
   géométries — elles appartiennent à tous les exemplaires du modèle — mais
   uniquement les matériaux, qui sont bien les siens.
3. **Îlots fusionnés** (`game/world.js`). Les immeubles d'un même îlot et
   leurs corniches sont fusionnés en un seul mesh par îlot. Les UV étant déjà
   cuites par `scaleBoxUV`, l'image est identique au pixel près.
4. **Trottoirs, mâts et balises instanciés** (`game/world.js`). Une
   `InstancedMesh` pour les trottoirs, une pour les pelouses, une pour les
   mâts, une pour les balises rouges — au lieu d'un mesh, et parfois d'un
   matériau neuf, par élément.
5. **Carte d'ombres dimensionnée** (`game/performance.js`). Elle couvre une
   boîte de 170 m : 1024² donne déjà six texels par mètre. On ne paie 2048²
   qu'en qualité élevée, soit quatre fois moins de surface à remplir en
   qualité moyenne.

## Les presets

| | Faible | Moyen | Élevé |
| --- | ---: | ---: | ---: |
| Résolution de rendu | 60 % | 85 % | 100 % |
| Ombres | non | oui | oui |
| Carte d'ombres | 1024² | 1024² | 2048² |
| Véhicules en circulation | 6 | 10 | 14 |
| Piétons (plafond) | 6 | 10 | 14 |
| Gouttes de pluie | 900 | 2 000 | 3 600 |
| Distance de vue | 380 m | 600 m | 1 000 m |

Valeurs vérifiées par test automatisé : chaque preset applique bien les sept
réglages, et le plafond de piétons résiste à la météo — la pluie peut vider
les trottoirs sous le plafond, jamais le dépasser.

En **auto**, le jeu descend d'un cran si les FPS restent sous 45, remonte
au-dessus de 75, au plus une fois toutes les six secondes, et jamais pendant
une poursuite : la qualité ne change pas sous le nez du joueur au pire moment.

## Règles tenues dans le code

- Aucune allocation dans la boucle de rendu : traceurs, impacts, traces de
  pneus, bouffées de fumée et gouttes de pluie sont des réservoirs
  pré-alloués, réutilisés en tampon circulaire.
- Les éléments répétés (marquage au sol, arbres, lampadaires, trottoirs,
  mâts, balises) sont des `InstancedMesh`, pas des meshes individuels.
- Les géométries et matériaux communs sont créés une fois et partagés.
- Le budget de gouttes de pluie passe par `setDrawRange` : on garde un seul
  tampon et on en dessine une partie, sans jamais réallouer.
- Le compteur de FPS lit le temps réel, pas le `dt` plafonné, sinon il
  annoncerait 20 FPS en permanence dès que l'affichage rame.

## Refaire les mesures

```sh
npx http-server -p 8123 -c-1 --silent .
node bench.mjs    # scène figée, écrit bench.json
```

Pour comparer deux versions, mesurer la seconde **sans relancer le
navigateur entre les deux emplacements** : c'est le gel de la scène, pas la
répétition, qui rend les chiffres comparables.
