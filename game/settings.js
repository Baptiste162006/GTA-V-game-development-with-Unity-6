import { applyTheme } from './uiTheme.js';

const KEY = 'san-felipe-settings-v1';

// Chaque réglage déclare ses bornes et la façon de l'appliquer au jeu : le menu
// se construit tout seul à partir de cette table.
export const DEFINITIONS = {
  theme: { label: 'Thème', group: 'Interface', type: 'choice', options: ['nocturne', 'contraste', 'daltonisme'], def: 'nocturne' },
  hudScale: { label: 'Taille du HUD', group: 'Interface', type: 'range', min: 75, max: 150, step: 25, unit: '%', def: 100 },
  hudOpacity: { label: 'Opacité du HUD', group: 'Interface', type: 'range', min: 40, max: 100, step: 10, unit: '%', def: 100 },

  quality: { label: 'Qualité', group: 'Affichage', type: 'choice', options: ['faible', 'moyen', 'eleve', 'auto'], def: 'eleve' },
  renderScale: { label: 'Résolution de rendu', group: 'Affichage', type: 'range', min: 60, max: 100, step: 5, unit: '%', def: 100 },
  shadows: { label: 'Ombres', group: 'Affichage', type: 'toggle', def: true },
  minimap: { label: 'Mini-carte', group: 'Affichage', type: 'toggle', def: true },

  // Un seul champ de vision ne peut pas convenir aux quatre situations : large
  // en voiture pour la sensation de vitesse, resserré en visée pour la
  // précision. Valeurs en degrés verticaux, comme les attend Three.js.
  fovFoot: { label: 'Champ — à pied', group: 'Caméra', type: 'range', min: 70, max: 90, step: 1, unit: '°', def: 80 },
  fovVehicle: { label: 'Champ — véhicule', group: 'Caméra', type: 'range', min: 75, max: 100, step: 1, unit: '°', def: 88 },
  fovAim: { label: 'Champ — visée', group: 'Caméra', type: 'range', min: 50, max: 70, step: 1, unit: '°', def: 60 },
  fovSniper: { label: 'Champ — lunette', group: 'Caméra', type: 'range', min: 20, max: 45, step: 1, unit: '°', def: 35 },
  camDistance: { label: 'Distance caméra', group: 'Caméra', type: 'range', min: 40, max: 90, step: 2, unit: ' dm', def: 46 },
  camHeight: { label: 'Hauteur caméra', group: 'Caméra', type: 'range', min: 120, max: 200, step: 5, unit: ' cm', def: 155 },

  sensitivity: { label: 'Sensibilité souris', group: 'Contrôles', type: 'range', min: 10, max: 300, step: 5, unit: '%', def: 100 },
  invertY: { label: 'Inverser l’axe Y', group: 'Contrôles', type: 'toggle', def: false },
  shake: { label: 'Secousses de caméra', group: 'Contrôles', type: 'range', min: 0, max: 150, step: 25, unit: '%', def: 100 },

  volume: { label: 'Volume général', group: 'Audio', type: 'range', min: 0, max: 100, step: 5, unit: '%', def: 50 },
  engineVolume: { label: 'Moteurs', group: 'Audio', type: 'range', min: 0, max: 100, step: 5, unit: '%', def: 100 },
  sirenVolume: { label: 'Sirènes', group: 'Audio', type: 'range', min: 0, max: 100, step: 5, unit: '%', def: 100 },
};

export class Settings {
  constructor() {
    this.values = {};
    for (const [key, def] of Object.entries(DEFINITIONS)) this.values[key] = def.def;
    this.load();
  }

  get(key) {
    return this.values[key];
  }

  set(key, value) {
    const def = DEFINITIONS[key];
    if (!def) return;
    if (def.type === 'toggle') this.values[key] = !!value;
    else if (def.type === 'choice') this.values[key] = def.options.includes(value) ? value : def.def;
    else this.values[key] = Math.min(def.max, Math.max(def.min, value));
    this.save();
    if (this.onChange) this.onChange(key, this.values[key]);
  }

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) Object.assign(this.values, JSON.parse(raw));
    } catch {
      /* stockage indisponible : on reste sur les valeurs par défaut */
    }
  }

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.values));
    } catch {
      /* rien à faire : les réglages ne seront simplement pas conservés */
    }
  }

  // Applique tout au jeu. Appelé au démarrage et à chaque changement.
  apply(game) {
    const v = this.values;

    applyTheme(v.theme);
    // `zoom` plutôt que `font-size` : les tailles du HUD sont en pixels, donc
    // agrandir la police seule ne redimensionnerait ni les jauges ni la carte.
    const hud = document.getElementById('hud');
    if (hud) {
      hud.style.zoom = v.hudScale / 100;
      hud.style.opacity = v.hudOpacity / 100;
    }

    // Le champ de vision est recalculé chaque image selon le contexte (à pied,
    // véhicule, visée, lunette) : rien à poser ici, sinon la distance et la
    // hauteur de la caméra, qui elles sont des réglages directs.
    game.camera3p.baseDistance = v.camDistance / 10;
    game.camera3p.targetDistance = v.camDistance / 10;
    game.camHeight = v.camHeight / 100;

    game.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75) * (v.renderScale / 100));

    game.renderer.shadowMap.enabled = v.shadows;
    game.world.sun.castShadow = v.shadows;
    game.scene.traverse((o) => {
      if (o.isMesh && o.userData.castShadowDefault === undefined) o.userData.castShadowDefault = o.castShadow;
    });

    document.getElementById('minimap').hidden = !v.minimap;

    game.camera3p.sensitivity = 0.0025 * (v.sensitivity / 100);
    game.camera3p.invertY = v.invertY;
    game.shakeScale = v.shake / 100;

    if (game.audio.master) game.audio.master.gain.value = game.audio.muted ? 0 : v.volume / 100;
    game.audio.engineScale = v.engineVolume / 100;
    game.audio.sirenScale = v.sirenVolume / 100;
  }
}
