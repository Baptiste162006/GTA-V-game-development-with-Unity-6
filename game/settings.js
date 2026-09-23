const KEY = 'san-felipe-settings-v1';

// Chaque réglage déclare ses bornes et la façon de l'appliquer au jeu : le menu
// se construit tout seul à partir de cette table.
export const DEFINITIONS = {
  quality: { label: 'Qualité', group: 'Affichage', type: 'choice', options: ['faible', 'moyen', 'eleve', 'auto'], def: 'eleve' },
  fov: { label: 'Champ de vision', group: 'Affichage', type: 'range', min: 55, max: 95, step: 1, unit: '°', def: 64 },
  renderScale: { label: 'Résolution de rendu', group: 'Affichage', type: 'range', min: 60, max: 100, step: 5, unit: '%', def: 100 },
  shadows: { label: 'Ombres', group: 'Affichage', type: 'toggle', def: true },
  minimap: { label: 'Mini-carte', group: 'Affichage', type: 'toggle', def: true },

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

    game.camera.fov = v.fov;
    game.camera.updateProjectionMatrix();
    game.baseFov = v.fov;

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
