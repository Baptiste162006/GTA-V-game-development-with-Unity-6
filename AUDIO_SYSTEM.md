# AUDIO_SYSTEM

Architecture proposée le 2026-09-24. **Rien n'est codé** : ce document
attend ta validation (étape 4 de la feuille de route, `MILESTONES.md`).
Contrainte conservée : **aucun fichier son** — tout reste synthétisé en
WebAudio (oscillateurs + bruit filtré), comme aujourd'hui. Le jeu reste
léger, sans licence à gérer.

## 1. Ce qui existe (`game/audio.js`, vérifié dans le code)

- Un seul nœud `master` (curseur « Volume général »), et deux niveaux
  séparés dans les options : moteurs et sirènes.
- Sons en place : moteur du véhicule du joueur, sirène, klaxon, chocs,
  crissement de pneus, pluie (boucle), tonnerre retardé par la distance,
  tir par arme (6 profils), clic à vide, marqueur de touche, jingles de
  réussite/échec/étoile.
- **Problèmes relevés en lisant le code :**
  - chaque tir crée 2 sources branchées directement sur `master`, sans
    limiteur ni plafond : une rafale d'UZI (14 tirs/s, chaque bruit dure
    0,6 s) empile une vingtaine de sources — risque réel de saturation ;
  - aucun son de rechargement, de pas, d'impact, d'ambiance de ville ;
  - les sons d'interface réutilisent le « blip » générique ;
  - le contexte audio n'est relancé qu'au premier clic, pas au retour
    sur l'onglet.

## 2. Architecture cible

### 2.1 Bus

```
sources ─┬─> bus Véhicules ─┐
         ├─> bus Effets ────┤
         ├─> bus Ambiance ──┼─> Master ─> limiteur (DynamicsCompressor) ─> sortie
         ├─> bus Interface ─┤
         └─> bus Musique ───┘
```

- Un `GainNode` par bus, piloté par un curseur d'options.
- **Limiteur** sur la sortie (compresseur à seuil haut, ratio élevé) :
  plus aucune saturation, quel que soit l'empilement.
- En pause : Véhicules, Effets et Ambiance baissent en fondu
  (≈ 150 ms) ; Interface reste audible. À la mort : même chose.
- Réglages : `volume` (général) conservé ; nouveaux `musicVolume`,
  `sfxVolume`, `ambienceVolume`, `vehicleVolume`, `uiVolume`.
  `engineVolume` et `sirenVolume` restent comme sous-niveaux du bus
  Véhicules (les sauvegardes de réglages existantes restent valides).

### 2.2 Voix : pool et plafonds

Une seule porte d'entrée : `audio.play(kind, bus, build, { priority })`.
- **Plafond global** : 24 voix actives.
- **Plafond par type** : tir 6, impact 6, pas 2, UI 3, explosion 2.
- Au-delà : la voix la plus ancienne de plus faible priorité est coupée
  en fondu de 20 ms (pas de clic).
- Chaque voix est arrêtée explicitement (`stop()` à la fin de son
  enveloppe) et déconnectée : aucune source qui traîne.
- Compteur de voix actives exposé → affiché dans le panneau de
  performance et vérifié par un script de test.

### 2.3 Véhicules (bus Véhicules)

- **Profil sonore par gabarit** dans `VEHICLE_SPECS` (données) :
  `sound: 'petit' | 'berline' | 'sport' | 'lourd' | 'deux-roues'`.
  Chaque profil = fréquence de base, forme d'onde, grain (bruit), pente
  du régime. V1 : 3 profils (petit/berline, sport, lourd — police
  comprise).
- Démarrage (montée de régime courte) en montant, arrêt (descente +
  fondu) en descendant.
- Roulement : bruit filtré dont le volume et la coupure suivent la
  vitesse ; crissement (existe) ; **bosse** sur les petits chocs, en plus
  du choc fort existant.
- Klaxon par gabarit (fréquence), sirène (existe) sur le bus.
- Règle : un seul moteur joué en continu, celui du joueur ; les
  véhicules proches (police en poursuite) ont un moteur simplifié,
  2 au maximum, atténué par la distance.

### 2.4 Armes et combat (bus Effets)

- Tir : les 6 profils existants + **variation de hauteur ±4 %** et de
  volume ±8 % à chaque tir (fin de l'effet « machine »).
- **Rechargement** : 2 clics (sortie / entrée du chargeur) calés sur la
  durée réelle `spec.reload`, + culasse pour le pompe et le sniper.
- Clic à vide : existe.
- **Impacts par matériau** : le code sait déjà si une balle touche un
  corps (cible) ou un mur (`wallDistance`) → *chair* et *béton* en V1.
  *Métal* demande de détecter les tirs sur les véhicules (pas le cas
  aujourd'hui) → V1.1. *Bois* et *verre* : aucune surface de ce type
  n'existe dans la ville → V2.
- Explosion : **aucune source d'explosion dans le jeu** (pas de
  lance-roquettes, les voitures ne sont pas détruites). Le son est prévu
  dans le catalogue, joué seulement quand « Véhicule détruit » existera
  (BACKLOG, étape 7).

### 2.5 Ambiance (bus Ambiance)

- **Ville** : lit de bruit filtré grave (circulation lointaine) + rares
  événements (klaxon lointain, porte, voix étouffées) ; plus dense à
  Downtown, calme à Mirador Hills ; plus faible la nuit.
- **Météo** : pluie (existe) ; vent lié à `weather.wind` (bruit
  modulé) ; orage (tonnerre existe) ; brouillard = filtre passe-bas
  léger sur l'ambiance.
- **Pas** (bus Effets) : déclenchés par la phase de marche existante
  (`player.js`, un son par pas, pas de répétition) ; asphalte si
  `isOnRoad`, trottoir sinon, herbe dans les parcs ; atténués en
  véhicule (aucun).

### 2.6 Interface (bus Interface)

Survol, validation, retour/annulation, ouverture/fermeture du menu,
changement d'onglet, « Partie sauvegardée », argent gagné, notification.
Courts (< 120 ms), discrets, une seule famille de timbres.

### 2.7 Autoplay et onglet

Contexte créé et relancé au premier clic (existe) ; relancé aussi sur
`visibilitychange` quand l'onglet redevient visible ; aucun son ne joue
pendant que l'onglet est caché.

### 2.8 Musique (bus Musique)

V1 : aucune musique imposée — le bus et le curseur existent pour que
l'ajout soit une donnée, pas un chantier. Une boucle d'ambiance
synthétisée courte (menu/titre) est un COULD HAVE. Radios en voiture :
V2 (demandent du contenu musical que ce projet ne produit pas).

## 3. Périmètre

| | V1 (vertical slice) | V1.1 | V2 |
|---|---|---|---|
| Bus + limiteur + pool | ✅ | — | — |
| Curseurs d'options par bus | ✅ | — | — |
| Moteurs | 3 profils, démarrage/arrêt, roulement, bosse | 5 profils, moteurs PNJ proches | — |
| Armes | 6 armes (existantes) + variation, rechargement | — | lance-roquettes (arme à ajouter) |
| Impacts | chair, béton | métal (tirs sur véhicules) | bois, verre |
| Explosion | — (pas de source) | avec « véhicule détruit » | — |
| Ambiance | ville de base, vent, pluie, orage | variation par quartier et jour/nuit fine | — |
| Pas | asphalte, trottoir | herbe, PNJ proches | — |
| Interface | clic, survol, retour, sauvegarde | tous les écrans | — |
| Musique | bus vide + curseur | boucle de menu | radios |

## 4. Tests prévus

Script `audiotest` : compter les voix actives pendant une rafale d'UZI de
5 s (≤ plafond), en pause et après la mort (0 hors bus Interface),
vérifier que chaque curseur à 0 coupe réellement son bus, qu'un
rechargement déclenche ses deux clics, qu'aucune source ne reste active
10 s après la fin d'un combat.
