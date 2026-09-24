# CUSTOMIZATION — personnalisation du personnage

Architecture proposée le 2026-09-24. **Rien n'est codé** : ce document
attend ta validation (étape 9 de la feuille de route, `MILESTONES.md`).

## 1. Point de départ : ce que le code permet déjà

Le personnage (`buildCharacter` dans `game/player.js`) est fait de 9
formes géométriques **partagées** par tous les personnages (buste,
hanches, tête, calotte de cheveux, bras, main, cuisse, mollet, chaussure)
et de 4 matériaux **propres** à chacun : haut, bas, peau, cheveux. Tout le
monde l'utilise : joueur, piétons, conducteurs, gangs, policiers.

Trois contraintes que l'architecture doit respecter :
1. **On ne reconstruit jamais le personnage du joueur.** L'arme est
   accrochée à son bras droit, la caméra, l'estompage anti-mur
   (`fadeCharacter`) et les animations tiennent des références vers ses
   pièces. Changer de tenue = changer des couleurs et échanger des
   pièces *accrochées* au squelette, en place.
2. **Les formes restent partagées.** Chaque nouvelle coiffure ou
   vêtement est une géométrie construite une fois et réutilisée — sinon
   les piétons multiplient les draw calls (budget 500).
3. **Aujourd'hui les chaussures utilisent la couleur des cheveux**
   (matériau commun). Un 5ᵉ matériau « chaussures » est le tout premier
   changement nécessaire.

## 2. Architecture

### 2.1 Catalogue (`game/appearance.js`, nouveau)

Un seul fichier de données, lu par le joueur, le menu et les PNJ :

```js
CATALOG = {
  hair:   [{ id: 'court', label: 'Court', price: 0 }, { id: 'crete', label: 'Crête', price: 150 }, …],
  hairColor: [{ id: 'brun', hex: 0x2a211c }, { id: 'blond', hex: 0xc9a25f }, …],
  top:    [{ id: 'tshirt', label: 'T-shirt', price: 0, parts: [] }, { id: 'veste', parts: ['col', 'pans'], price: 300 }, …],
  bottom: [{ id: 'jean' }, { id: 'short', legScale: 0.55 }, { id: 'cargo', parts: ['poches'] }, …],
  shoes:  [{ id: 'baskets' }, { id: 'bottes', scale: [1, 1.6, 1] }, …],
  glasses:[{ id: null }, { id: 'soleil' }, …],
  hat:    [{ id: null }, { id: 'casquette' }, { id: 'bonnet' }, …],
  bag:    [{ id: null }, { id: 'sac-dos' }, …],
  palette: [ …12 couleurs de vêtements… ],
}
```

Chaque variante ne contient que des **données** (id, libellé, prix,
pièces à accrocher, échelles). Ajouter un vêtement = une ligne.

### 2.2 Apparence (données sauvegardées)

```js
appearance = {
  skin: 'moyen',
  hair: { style: 'court', color: 'brun' },
  top: { id: 'tshirt', color: '#8c2f2f' },
  bottom: { id: 'jean', color: '#23304a' },
  shoes: { id: 'baskets', color: '#e8e4dc' },
  glasses: null, hat: 'casquette', bag: null,
}
```

### 2.3 Application : `applyAppearance(mesh, appearance)`

Dans `player.js`, à côté de `buildCharacter` :
- couleurs → les 5 matériaux existants (instantané, aucun coût) ;
- coiffure → la calotte est remplacée par la forme partagée choisie,
  accrochée à la tête ;
- accessoires / pièces de vêtements → petits groupes accrochés à la tête
  (lunettes, chapeau), au buste (col, sac) ou aux jambes (short =
  mollet à nu, couleur peau) ;
- leurs matériaux sont ajoutés à `mesh.userData.materials`, pour que
  l'estompage anti-mur les traite aussi (sinon un chapeau resterait
  opaque devant la caméra).

La même fonction habille les **PNJ** : un tirage dans le catalogue donne
des piétons variés (aujourd'hui une seule silhouette, couleurs
aléatoires). Gain visible immédiat, sans coût de modélisation en plus.

### 2.4 Menu « Garde-robe »

- **V1 : entrée du menu pause.** Le jeu est déjà figé en pause ; la
  caméra tourne autour du joueur (la caméra 3ᵉ personne existe, on force
  un mode orbite). Pas de scène d'aperçu séparée : l'aperçu **est** le
  joueur, donc toujours fidèle.
- Onglets : Cheveux · Haut · Bas · Chaussures · Accessoires.
  Pour chaque élément : liste (verrouillés grisés avec prix ou mission),
  palette de couleurs, flèches clavier + souris comme le reste du menu.
- Boutons : **Essayer** (aperçu immédiat) · **Confirmer** (applique et
  sauvegarde) · **Annuler** (revient à la tenue d'avant) ·
  **Réinitialiser** (tenue par défaut).
- Plus tard (V1.1) : un **miroir** dans une planque et des **magasins**
  (vêtements, coiffeur) posés comme des contacts de mission — même
  mécanique de zone que `story.js`.

### 2.5 Déblocage et économie

- Gratuit par défaut : 2 coiffures, 2 hauts, 1 bas, 1 paire de
  chaussures, toutes les couleurs.
- Le reste a un prix (achat direct depuis la Garde-robe en V1, depuis
  les magasins en V1.1) ou est **récompense de mission** (ex. la veste
  de Kenji après « Le mouchard » — `reward` accepte déjà n'importe quoi
  d'autre que de l'argent si on l'étend).
- Sauvegarde : `appearance` + `unlocked: [ids]` dans la sauvegarde v2
  (champs ajoutés, une ancienne sauvegarde reste lisible et donne la
  tenue par défaut).

### 2.6 Effets de jeu des vêtements

Pour la V1 : **purement cosmétique**. Prévu dans les données (champ
`effects` optionnel) pour V2 : gilet pare-balles (armure), tenue de gang
(réaction des gangs), tenue discrète (vue de la police réduite).

## 3. Périmètre

| | V1 (vertical slice) | V1.1 | V2 |
|---|---|---|---|
| Corps | 1 corps, 3 teintes de peau | — | 2ᵉ silhouette |
| Cheveux | 4 coiffures × 6 couleurs | barbe (3) | coiffures longues animées |
| Haut | 6 (t-shirt, chemise, sweat, veste, débardeur, blouson) | motifs | gilet pare-balles avec effet |
| Bas | 4 (jean, cargo, short, jogging) | — | — |
| Chaussures | 3 (baskets, bottes, ville) | — | — |
| Accessoires | lunettes, casquette, sac à dos | bonnet, masque, chaîne, montre | — |
| Menu | Garde-robe dans le menu pause, orbite caméra | miroir en planque | — |
| Économie | prix + récompenses de mission | magasins dans la ville | — |
| PNJ | tirage dans le catalogue | tenues par quartier | — |
| Visage | — | 3 formes de tête | éditeur de visage, tatouages |
| Modèle GLB | — | — | si un asset sous licence est fourni |

## 4. Risques

- **Performance** : chaque accessoire = un mesh de plus par personnage,
  multiplié par les piétons (14), les gangsters (8), les conducteurs et
  les policiers à l'écran. Mesurer les draw calls avant/
  après ; au besoin, pas d'accessoires sur les PNJ lointains.
- **Estompage** : tout nouveau matériau doit passer par
  `userData.materials`, sinon régression du correctif v0.12.
- **Arme** : ne jamais recréer le bras droit (l'arme y est accrochée).
- **Sauvegarde** : ajouter des champs, ne jamais en renommer.
