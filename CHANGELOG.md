# CHANGELOG

## v0.16 — 2026-09-23

### Ajouté — audit de direction artistique
- **`ART_DIRECTION.md`** : ce qui, dans le rendu actuel, vient de
  primitives Three.js plutôt que d'un vrai modèle — personnage, véhicules,
  bâtiments, arbres — avec pour chacun ce qui existe déjà (animation,
  variété), ce qui manque, ce qui peut rester procédural, un coût mesuré
  (draw calls, géométries), et un ordre de migration classé par rapport
  effort/résultat plutôt que par intuition.
- Point posé explicitement : cet environnement n'a accès à aucun fichier
  `.glb`/`.gltf` externe. L'architecture de chargement (`GLTFLoader`,
  `AnimationMixer`, secours procédural) peut être construite, mais tant
  qu'aucun modèle n'est fourni, le secours procédural **est** le rendu
  final — jamais présenté comme un simple filet en attendant mieux.
- Deux lacunes trouvées en relisant le code, pas supposées : le personnage
  joueur n'a aucune réaction visuelle à ses propres dégâts (contrairement
  aux ennemis, qui ont un flash et un recul depuis la v0.8) ; les arbres
  n'ont qu'une seule forme de feuillage, seules l'échelle et la rotation
  varient.

## v0.15 — 2026-09-23

### Ajouté — variété des façades et mobilier urbain
- **Trois styles de façade** au lieu d'un seul : bureaux (bandeaux larges,
  le style d'origine), tour étroite (fenêtres hautes et resserrées), brique
  (petites fenêtres carrées, joints visibles). Chaque immeuble tire le sien
  au hasard, dans la teinte de son quartier — deux immeubles voisins ne sont
  plus des copies l'un de l'autre. Vérifié en jeu : deux styles différents
  visibles dans le même cadre.
- Les immeubles d'un îlot restent fusionnés **par style de façade présent**
  (un seul mesh la plupart du temps, jamais plus de trois), pour ne pas
  défaire l'optimisation de la v0.9 : draw calls mesurés entre 226 et 301
  selon la scène, toujours sous le budget de 500.
- **Bancs et poubelles**, en `InstancedMesh` comme le reste du mobilier
  urbain (aucune géométrie créée par élément). Placés sur un trottoir
  différent de la voiture garée, pour ne pas s'entasser toujours au même
  endroit du bloc.

### Note
La génération de la ville est déterministe par graine, mais ajouter de
nouveaux tirages aléatoires (style de façade, mobilier) déplace le nombre de
subdivisions choisi pour chaque îlot par rapport aux versions précédentes :
c'est une ville différente, pas une ville cassée.

## v0.14 — 2026-09-23

### Corrigé — l'assiette des véhicules était inversée
- Mesuré avec la position réelle des phares : le nez **plongeait à
  l'accélération** et **se relevait au freinage** — l'inverse de la physique
  et du commentaire du code lui-même (« plongée au freinage, léger cabrage à
  l'accélération »). Signe corrigé. Vérifié : accélération 0,56 → 0,63 m
  (nez qui se relève), freinage 0,56 → 0,50 m (nez qui plonge).

### Ajouté — suspension et dégâts visibles
- **Compression de suspension** : un ressort-amortisseur simple fait plonger
  la caisse sous une forte accélération, un freinage franc ou un choc, puis
  la ramène en oscillant. Les roues ne bougent jamais — seule la caisse
  (chassis, cabine, toit, feux) est concernée. Mesuré : ~1 cm en conduite
  normale, jusqu'à 2,3 cm sur un choc simulé à 22 m/s.
- **Dégâts visibles** : la carrosserie ternit progressivement avec les
  dégâts (0 à 100), sans allocation par image. Le véhicule du joueur, une
  fois bien abîmé (au-delà de 55 %), laisse échapper une fumée de moteur
  occasionnelle — de plus en plus fréquente à mesure que les dégâts
  augmentent — réutilisant le même réservoir de fumée que les traces de
  drift, sans pool supplémentaire.

## v0.13 — 2026-09-23

### Corrigé — arme invisible en visée
- L'arme tenue en main était pratiquement invisible en visée : mesurée à
  10×22 px sur 1280×720 pour le pistolet, dans un métal presque noir
  (`0x23262b`) sur une silhouette déjà sombre. Le vrai problème n'était pas
  la taille mais le **contraste** — même en plein jour, elle disparaissait
  dans l'ombre du personnage.
- **Métal éclairci** (gris acier `0x767e8c`), **guidon lumineux** au bout du
  canon en corail non éclairé (`MeshBasicMaterial`, donc visible même de
  nuit ou à l'ombre — vérifié aux deux), et **épaisseur agrandie de 35 %**
  (la longueur ne l'est que de 15 %, pour ne pas déformer la pose de tir).
  Mesuré : pistolet 10×22 px → 13×30 px ; le fusil d'assaut, plus long,
  devient clairement lisible le long du bras.
- Écarté en cours de route : une « arme mal orientée » qui s'est révélée être
  un artefact de mon script de test (matrices de transformation non mises à
  jour avant la mesure) — vérifié avec la vraie boucle du jeu, l'alignement
  entre le canon et l'axe de visée est correct à 3,8° près.

## v0.12 — 2026-09-23

### Ajouté — caméra à pied et vie du personnage
- **Caméra rapprochée de 15 %** (5,4 m → 4,6 m par défaut) et **abaissée à
  hauteur d'épaule** au lieu de planer 1,5 m au-dessus. Le décalage vertical
  n'est plus multiplié par la distance : dézoomer ne lève plus la caméra
  au-dessus de la tête. Mesuré : hauteur de caméra 3,06 m → 2,54 m, taille du
  personnage à l'écran 17,0 % → 20,7 %.
- **Respiration et transfert de poids à l'arrêt** : le personnage restait un
  mannequin figé dès qu'il ne marchait plus. Une deuxième horloge d'animation
  tourne en continu et s'éteint dès que la marche reprend, pour ne jamais
  lutter avec la démarche.
- **Notifications en fondu** : apparition en fondu + léger glissement,
  affichage 2,6 s, disparition progressive — au lieu d'apparaître et
  disparaître d'un coup.

### Corrigé — une régression trouvée en testant le lot ci-dessus
- Rapprocher la caméra a cassé la détection « personnage coincé contre un
  mur » ajoutée en v0.9 : elle se fiait à une taille apparente calculée à la
  main (distance × FOV), qui se déréglait à chaque changement de ces valeurs.
  Conséquence mesurée : le joueur s'effaçait à moitié **en pleine rue**
  (opacité 0,71 au lieu de 1) simplement parce que la caméra était plus
  proche par défaut.
- Remplacé par un **ratio géométrique** : distance de caméra réellement
  obtenue après anti-mur, divisée par la distance voulue avant obstruction.
  Ce ratio ne dépend d'aucun réglage de FOV, de distance ou de hauteur — il
  ne peut donc plus se dérégler quand ces valeurs changent. Recalibré sur
  quatre mesures : dos à un immeuble en visée (ratio 0,775 → invisible),
  pleine rue en visée (ratio 1 → opaque à 100 %), dos au mur à pied dans un
  angle extrême (ratio 0,344 → **reste opaque**, contrairement à un premier
  réglage qui l'effaçait complètement), pleine rue à pied (ratio 1 → opaque).

## v0.11 — 2026-09-23

### Ajouté — identité visuelle « Nocturne urbain »
- **Toutes les couleurs dans un seul fichier** (`game/uiTheme.js`). Le CSS les
  lit par variables, le canvas de la carte par une fonction : une seule table à
  changer pour repeindre le jeu. Plus aucune couleur écrite en dur ailleurs.
- **Trois thèmes** : Nocturne urbain (défaut), Contraste élevé, Daltonisme.
  Changeables dans Options → Interface, conservés d'une partie à l'autre.
- Palette : fond bleu nuit, panneaux anthracite bleuté, **corail** en accent,
  **bleu électrique** en secondaire, **or doux pour l'argent** (il était vert
  vif), **cyan pour les objectifs**, bleu glacier pour l'armure.
- **Taille du HUD** (75 à 150 %) et **opacité** (40 à 100 %) réglables. Mesuré :
  la mini-carte passe de 145 à 291 px entre les deux extrêmes.

### Accessibilité — une couleur ne dit jamais rien toute seule
- **Vie** : icône cœur, **valeur chiffrée**, segments visibles, et couleur par
  palier — menthe au-dessus de 55 %, ambre au-dessus de 25 %, corail en
  dessous. Plus de dégradé rouge/vert, l'opposition la moins lisible pour un
  daltonien.
- **Armure** : icône losange, valeur chiffrée, segments, bleu glacier.
- **Marqueurs de carte** : chaque catégorie a sa forme — flèche pour le joueur,
  **hexagone cerclé** pour l'objectif, **losange** pour la police.
- **Munitions faibles** : pictogramme d'alerte en plus de la couleur.
- **Étoiles de recherche** : texte clair avec halo, plutôt qu'un simple jaune.
- Vérifié à 1280×720 et 1920×1080, de jour, de nuit, sous orage et sous neige.

### Corrigé
- L'icône d'armure tombait sur un caractère de repli qui ressemblait à celle de
  la vie : les deux jauges se confondaient.
- Une variable locale `color` masquait la fonction de thème du même nom dans le
  dessin de la mini-carte.

## v0.10 — 2026-09-23

### Ajouté — orage, saisons et neige
- **Orage** : cinquième météo. Éclairs irréguliers (toutes les 4 à 14 s), en
  double flash qui éclaire réellement la scène — le soleil et le ciel prennent
  le flash, donc les ombres portées suivent. **Tonnerre retardé par la
  distance** : le son part après `distance / 343 m/s`, et il est d'autant plus
  sourd et long que l'éclair est tombé loin. Vérifié : éclair à 1 372 m,
  silence à 3 s, tonnerre à 5 s.
- **Quatre saisons** qui tournent en continu (deux journées de jeu chacune,
  bascule étalée sur les dernières heures) : printemps, été, automne, hiver.
  Chacune a sa palette d'herbe et de feuillage, et sa taille de feuillage —
  les arbres se dénudent en hiver.
- **Feuilles mortes** qui tombent et dérivent au vent en automne.
- **Neige** : en hiver, la pluie tombe en neige. Flocons qui se balancent,
  **accumulation progressive au sol** (sol et trottoirs qui blanchissent), et
  **adhérence réduite à 40 %**. La neige fond ensuite, bien plus lentement
  qu'elle ne tombe, et d'autant plus vite que la saison est chaude.
- **Vent** : il fait dériver la pluie, la neige et les feuilles, et tourne
  lentement — la pluie ne tombe pas toujours du même côté.
- **Champ de particules commun** (`game/particles.js`) : pluie, neige et
  feuilles partagent le même réservoir pré-alloué, recyclé en tampon
  circulaire, avec budget par preset graphique.
- Commandes : `season`, `neige`, `eclair`, et `storm` pour `weather`.

### Ajouté — un champ de vision par situation
- **Quatre champs de vision réglables** au lieu d'un seul : à pied 80° (70-90),
  véhicule 88° (75-100), visée 60° (50-70), lunette 35° (20-45). Un seul
  réglage ne pouvait pas convenir aux quatre : large en voiture pour la
  sensation de vitesse, resserré en visée pour la précision.
- **Distance et hauteur de caméra réglables**. La distance par défaut passe de
  6,5 m à 5,4 m : le personnage occupait 12,7 % de la hauteur d'écran à 95° de
  champ, il en occupe 20,9 %.
- Transition mesurée à **0,22 s** entre deux champs de vision, et
  `updateProjectionMatrix()` n'est appelé que lorsque la valeur change
  vraiment.
- Le champ de vision revient correctement à sa valeur après une visée, une
  sortie de véhicule et une pause — vérifié par test.

### Corrigé
- Le bandeau météo annonçait « Pluie » alors qu'il neigeait.
- Le tonnerre partait dans le vide : la météo était construite **avant** le
  moteur audio et en recevait donc une référence vide. Aucun tonnerre n'a
  jamais retenti avant cette version.

## v0.9 — 2026-09-23

### Ajouté — outils et presets de performance
- **Panneau de compteurs en direct** (`game/performance.js`, commande `perf`) : FPS réel et
  temps par image, pire image, draw calls, triangles, géométries, textures, véhicules,
  piétons, ennemis, gouttes, traces, fumée, qualité, résolution et mémoire JS. Il ne se
  réécrit que 5 fois par seconde et n'alloue rien par image.
- **Quatre presets graphiques** — Faible, Moyen, Élevé, Auto — qui pilotent d'un coup la
  résolution de rendu, les ombres et la taille de leur carte, la densité de circulation et de
  piétons, le nombre de gouttes de pluie et la distance de vue. Réglables au menu pause
  (pastilles) ou par la commande `quality`.
- **Mode Auto** : descend d'un cran sous 45 FPS, remonte au-dessus de 75, au plus une fois
  toutes les 6 secondes, et jamais pendant une poursuite.
- **Commandes de mesure** : `perf`, `mesure` (instantané JSON), `quality`, `stress traffic |
  police | weather | combat`.
- **Banc d'essai reproductible** (`bench.mjs`) sur scène figée, et **`PERFORMANCE.md`** avec
  le protocole et les chiffres avant/après.

### Optimisé
- **Formes partagées entre personnages** : `buildCharacter` allouait neuf géométries neuves à
  chaque passant. Elles sont construites une fois pour toutes ; seules les couleurs restent
  propres à chacun. **Dix personnages de plus coûtaient 90 géométries, ils en coûtent 0.**
- **Formes partagées entre véhicules** : les dimensions ne dépendent que du modèle, donc
  quinze jeux de géométries suffisent pour toute la circulation. **Dix berlines de plus
  coûtaient 50 géométries, elles en coûtent 0.**
- **Îlots fusionnés** : les immeubles d'un même îlot et leurs corniches ne font plus qu'un
  seul mesh. Les UV étant déjà cuites, l'image est identique.
- **Trottoirs, pelouses, mâts et balises instanciés** au lieu d'un mesh — et parfois d'un
  matériau neuf — par élément.
- **Carte d'ombres dimensionnée** : 1024² en qualité faible et moyenne (elle couvre une boîte
  de 170 m, soit déjà six texels par mètre), 2048² réservé à la qualité élevée.
- Résultat sur scène figée, qualité élevée : **draw calls 153 → 97** à Downtown (−37 %),
  **géométries 321 → 94** (−71 %), **meshes 233 → 113** (−52 %), mémoire JS 15 → 13 Mo,
  pour exactement le même nombre de triangles.

### Corrigé
- Le plafond de piétons d'un preset était écrasé à chaque image par le calcul météo : la
  qualité faible gardait 18 piétons. La météo réduit maintenant ce plafond sans le dépasser.
- `Vehicle.dispose()` libérait des géométries désormais partagées par tous les exemplaires du
  même modèle ; il ne libère plus que les matériaux, qui lui appartiennent vraiment.
- Le compteur de gouttes annonçait la taille du tampon (3 600) au lieu du nombre réellement
  dessiné.
- Le panneau de mesures se superposait à la bannière d'objectif.

## v0.8 — 2026-09-21

### Ajouté — menu pause complet
- Colonne de navigation à gauche, contenu à droite : **Reprendre, Carte, Missions,
  Statistiques, Options, Commandes, Recommencer**.
- **Navigation clavier** (flèches, Entrée, Échap) et souris, avec de vrais `<button>` et un
  état de focus visible — pas des `div` cliquables.
- **Carte de la ville en grand**, avec les îlots, la circulation, la zone de recherche et
  l'objectif en cours.
- **Confirmation** avant de recommencer une partie.
- **10 réglages qui agissent vraiment** (`game/settings.js`) : champ de vision, résolution de
  rendu, ombres, mini-carte, sensibilité souris, inversion de l'axe Y, intensité des
  secousses, volume général, moteurs, sirènes. Ils sont appliqués en direct et conservés
  d'une partie à l'autre.

## v0.7 — 2026-09-21

### Ajouté — mort et arrestation
- **Séquence de mort lisible** : le personnage s'effondre, le jeu se fige, et un écran
  annonce ce qui s'est passé — cause réelle (gang, police, accident de voiture), frais,
  argent restant et lieu de réapparition.
- Bouton « Réapparaître » déverrouillé après 1,6 s, réapparition automatique à 4,5 s.
- **Invulnérabilité de 3 secondes** au retour, avec un halo bleuté qui pulse : on ne remeurt
  plus à peine relevé.
- **Arrestation** distincte de la mort : mêmes mécaniques, texte et amende propres (250 $
  contre 500 $ à l'hôpital).
- Les commandes sont réellement coupées pendant la séquence, et `die()` est idempotent :
  une seconde mort pendant la chute ne relance rien.

### Corrigé
- **L'écran de mort mettait le jeu en pause.** Il relâche le curseur pour afficher son
  interface, ce que le jeu interprétait comme un appui sur Échap : le compte à rebours se
  figeait et le menu pause se superposait à l'écran de mort. La pause ne se déclenche plus
  que si le curseur était réellement capturé et qu'aucune séquence n'est en cours.

## v0.6 — 2026-09-21

### Ajouté — sensation de conduite
- **Vraies roues** : chaque roue avant est portée par un pivot de direction, et le roulement
  se fait sur l'essieu. Avant, braquage et rotation partageaient le même objet, donc la roue
  tournait autour d'un axe incliné dès qu'elle était braquée.
- La rotation vient de la **distance réellement parcourue** et du rayon de roue : à l'arrêt
  les roues s'arrêtent, en marche arrière elles tournent à l'envers (vérifié : +84,8 rad en
  avançant, −6,3 en reculant).
- **Assiette** : la caisse plonge au freinage (−0,039 rad mesuré) et se cabre à
  l'accélération (+0,034). Elle est désormais un groupe distinct des roues.
- **Feux stop** rouge vif au freinage, prioritaires sur les feux de position.
- **Traces de pneus et fumée** au frein à main et au gros freinage : 180 traces et 28 bouffées
  recyclées en anneau, aucune allocation en jeu (`game/vehicleEffects.js`).
- **Crissement de pneus** synthétisé, dosé sur le patinage.

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
