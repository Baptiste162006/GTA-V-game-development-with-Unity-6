# Direction artistique — audit

Ce document répond à une question précise : **qu'est-ce qui, dans le rendu
actuel, vient de primitives Three.js plutôt que d'un vrai modèle**, et que
faut-il en faire. Chaque chiffre vient d'une mesure sur ce dépôt (le
protocole est celui de `PERFORMANCE.md`), pas d'une estimation.

**Contrainte à poser tout de suite, sans détour :** cet environnement n'a
accès à aucun fichier `.glb`/`.gltf` externe — pas de téléchargement, pas de
dépôt d'assets tiers. Tout ce qui suit distingue donc explicitement
« l'architecture qui saurait charger un vrai modèle » de « ce qui sera
réellement affiché tant qu'aucun fichier n'existe ». Construire le
`GLTFLoader` sans jamais pouvoir le nourrir ne change rien à l'écran ; je ne
présenterai jamais un fallback amélioré comme autre chose que le rendu final
actuel.

## 1. Personnage (`game/player.js`)

**Fait de primitives, en totalité.** `characterShapes()` construit neuf
formes (cylindre buste, cylindre bassin, sphère tête, calotte de cheveux,
capsule bras, sphère main, capsule cuisse, capsule mollet, boîte chaussure),
partagées par tous les personnages du jeu — joueur, piétons, PNJ de gang,
police. Aucun visage, aucune main articulée, aucun pli de vêtement : une
silhouette, pas un modèle.

**Animation existante** (`animate(dt)`, ajoutée v0.10-v0.12) : marche/course
par oscillation sinusoïdale des jambes et bras opposés, genou qui plie côté
jambe arrière, respiration et léger transfert de poids à l'arrêt (fondu avec
la marche), pose de saut figée, mort par rotation rigide du buste au sol
(`beginDown` dans `main.js`). **Ce qui manque, vérifié en lisant le code —
pas de suppositions** : aucune réaction visuelle du personnage joueur quand
il encaisse des dégâts (`Player.damage()` ne touche que la vie/l'armure et
un callback HUD, jamais le maillage) ; pas d'accroupissement ; pas de
transition idle→marche→course au-delà du fondu d'amplitude déjà en place ;
pas de pose d'entrée/sortie de véhicule (le maillage est juste caché/montré).

**À remplacer en priorité si un vrai modèle devient disponible** : c'est
l'élément qui se voit le plus, en permanence, à l'écran — la plus mauvaise
approximation actuelle par rapport à ce qu'un joueur regarde le plus.

**Peut rester procédural sans dégrader l'image, à condition d'être visé
explicitement** : les PNJ très éloignés (silhouette suffisante à distance),
et tout fallback de secours si un modèle échoue à charger.

**Coût mesuré** : 9 géométries partagées, quel que soit le nombre de
personnages simultanés (vérifié v0.9 : dix personnages de plus coûtent
0 géométrie). Ce n'est pas un poste de performance qui justifie de garder
les primitives — le choix est purement visuel.

## 2. Véhicules (`game/vehicle.js`)

**Fait de primitives**, avec une variété réelle : 15 fiches
(`VEHICLE_SPECS`), chacune avec ses propres proportions, et les formes
partagées par modèle (pas par exemplaire) via `shapes(specName)`. Une
voiture : châssis (boîte), cabine vitrée (boîte), toit (boîte), 4 roues
(cylindre), phares/feux (boîtes), plus des ajouts spécifiques (rampe
lumineuse police/ambulance/pompiers, guidon/selle/réservoir pour les
deux-roues).

**Animation existante**, déjà solide et vérifiée par mesure : rotation des
roues asservie à la vitesse réelle, pivot de direction séparé (v0.7),
suspension ressort-amortisseur avec assiette correcte (nez qui plonge au
freinage — corrigé en v0.14 après avoir trouvé le signe inversé), roulis en
virage, feux stop/phares/gyrophares fonctionnels, carrosserie qui ternit et
fumée moteur au-delà de 55 % de dégâts (v0.14).

**Ce qui manque** : pas de jantes détaillées (le cylindre de roue est un
disque plein), pas de vitres teintées avec reflet, pas de déformation de
carrosserie après un choc (seule la teinte change), un seul jeu de
proportions par catégorie (pas de variantes de carrosserie au sein d'un même
modèle).

**Peut rester procédural** : les véhicules garés/en circulation à distance,
où la silhouette suffit largement — c'est déjà le même maillage que ceux
conduits de près, donc aucun changement à faire ici, juste à ne pas prioriser
un remplacement sur cette catégorie.

**Coût mesuré** : géométries partagées par modèle (v0.9 : dix berlines de
plus coûtent 0 géométrie). Même constat que le personnage — la primitive
n'est pas là pour la performance, elle est là faute d'alternative.

## 3. Bâtiments (`game/world.js`)

**Fait de primitives**, mais avec une vraie variété depuis la v0.15 :
3 styles de façade (bureaux à bandeaux, tour étroite, brique), chacun dans
la teinte de son quartier (6 quartiers), tiré au hasard par immeuble. La
géométrie reste une boîte simple ; la variété vient de la **texture**
(générée par canvas, jamais chargée) posée dessus, pas du volume.

**Ce qui manque** : aucune porte, aucune vitrine en rez-de-chaussée, aucune
enseigne, pas de volume qui casse le pavé rectangulaire (avancée, retrait,
toit en pente) au-delà de la corniche déjà en place sur certains immeubles.

**Peut largement rester procédural** — c'est le poste où le rapport
effort/résultat est le meilleur : une texture de façade détaillée (vitrine,
porte, enseigne peinte) coûte le même prix en draw calls qu'une texture
simple, et l'essentiel de « ça ressemble à une vraie rue » vient de la
variété des surfaces, pas du nombre de polygones. Un quartier vitrine doit
d'abord ajouter des **styles de texture supplémentaires** (5 à 10, contre 3
aujourd'hui) et du mobilier, avant d'envisager de vrais volumes de bâtiment.

**Coût mesuré** : les immeubles d'un îlot sont fusionnés en un seul mesh par
style de façade réellement présent (v0.9, préservé en v0.15). Scène figée,
qualité élevée, carrefour de Downtown : 97 draw calls, 94 géométries.
En jeu, circulation comprise, entre 226 et 301 draw calls selon la scène —
sous le budget de 500 posé dans `PERFORMANCE.md`.

## 4. Arbres (`game/world.js`, `plantTrees`)

**Fait de primitives, une seule forme.** Un tronc (cylindre) et un feuillage
(icosaèdre à 20 faces, `flatShading`), à l'échelle et l'orientation aléatoires
— c'est tout. Deux arbres côte à côte n'ont que leur taille et leur rotation
pour se distinguer.

**À corriger en priorité, avant les bâtiments** : c'est le poste où l'effort
est le plus faible pour le gain le plus visible — ajouter 2 ou 3 formes de
feuillage (icosaèdre actuel + une forme plus étirée pour un conifère + une
forme aplatie) coûte une InstancedMesh supplémentaire par forme, pas un
système nouveau.

**Coût mesuré** : deux géométries partagées (`InstancedMesh`), quel que soit
le nombre d'arbres plantés.

## Tableau récapitulatif

| Élément | Primitives actuelles | Animation/variété déjà en place | À remplacer en priorité | Coût mesuré |
|---|---|---|---|---|
| Personnage | 9 formes (capsules/sphères/cylindres) | Marche, course, respiration, saut, mort (rotation rigide) | **1 — le plus visible en permanence** | 9 géométries, indépendant du nombre de personnages |
| Véhicules | ~8-11 formes par modèle, 15 modèles | Roues, direction, suspension, dégâts visibles, feux | 3 — déjà le plus abouti des trois | Géométries partagées par modèle |
| Bâtiments | Boîtes + 3 textures de façade | Variété de style depuis v0.15 | 4 — la texture prime sur le volume | 97-301 draw calls selon la scène |
| Arbres | 1 forme de feuillage, 1 tronc | Échelle/rotation aléatoires seulement | **2 — gain maximal pour l'effort minimal** | 2 géométries, indépendant du nombre d'arbres |

## Plan de migration, sans rien casser

L'ordre proposé n'est pas celui du prompt d'origine (personnage d'abord) :
il suit le rapport effort/résultat mesuré ci-dessus, en commençant par ce
qui coûte le moins et se voit le plus.

1. **Formes d'arbres supplémentaires** (Sonnet, un seul fichier, quelques
   heures) : 2-3 formes de feuillage en plus de l'icosaèdre, choisies au
   hasard à la plantation. Aucun risque pour le gameplay — les arbres ne
   sont pas dans la grille de collision au-delà de leur tronc, déjà géré.
2. **Styles de façade supplémentaires + mobilier étendu** (Sonnet) :
   porter les 3 styles actuels à 6-8, ajouter vitrines/enseignes en texture,
   étendre bancs/poubelles à panneaux et arrêts de bus. Continue le travail
   de la v0.15 sans changer son architecture.
3. **Architecture de chargement de personnage** (Opus — plusieurs fichiers
   qui doivent s'accorder) : `game/characterLoader.js` (`GLTFLoader` +
   `AnimationMixer`), avec le personnage procédural actuel comme *seul*
   contenu réel tant qu'aucun `.glb` n'est fourni. Le distinguo fallback/
   final sera documenté à chaque étape, jamais présenté comme équivalent.
4. **Réaction du personnage joueur aux dégâts** (Sonnet, peut se faire
   indépendamment de l'étape 3) : un flash/recul similaire à celui déjà
   fait pour les ennemis (`enemies.js`), sur le maillage procédural actuel.
   Corrige une vraie lacune sans attendre un modèle externe.
5. **Vitres/jantes des véhicules** (Sonnet) : matériau vitre avec un peu de
   réflexion (`envMap` ou simple `metalness`), jante distincte du pneu.

Chaque étape se livre, se teste et se documente séparément — comme les
lots précédents (v0.9 à v0.15) — pour ne jamais se retrouver avec un système
à moitié migré.
