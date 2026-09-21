# CHANGELOG

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
