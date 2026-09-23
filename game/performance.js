// Compteurs de performance. Rien n'est alloué par frame : le panneau n'est
// réécrit que cinq fois par seconde, et seulement quand il est visible.
export class Performance {
  constructor(game) {
    this.game = game;
    this.panel = document.getElementById('perf');
    this.visible = false;

    this.frames = 0;
    this.elapsed = 0;
    this.refresh = 0;
    this.fps = 0;
    this.worst = 0;
    this.frameMs = 0;
  }

  toggle(on) {
    this.visible = on === undefined ? !this.visible : on;
    this.panel.hidden = !this.visible;
    this.worst = 0;
    return this.visible;
  }

  sample(rawDt) {
    this.frames++;
    this.elapsed += rawDt;
    this.refresh += rawDt;
    const ms = rawDt * 1000;
    if (ms > this.worst) this.worst = ms;

    if (this.elapsed >= 0.5) {
      this.fps = Math.round(this.frames / this.elapsed);
      this.frameMs = (this.elapsed / this.frames) * 1000;
      this.frames = 0;
      this.elapsed = 0;
    }
    if (this.visible && this.refresh >= 0.2) {
      this.refresh = 0;
      this.render();
    }
  }

  // Instantané des compteurs, aussi utilisé par les mesures automatisées.
  snapshot() {
    const g = this.game;
    const info = g.renderer.info;
    return {
      fps: this.fps,
      frameMs: +this.frameMs.toFixed(1),
      pireFrameMs: +this.worst.toFixed(1),
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      vehicules: g.traffic.cars.length + g.traffic.parked.length + g.police.units.length,
      pietons: g.traffic.peds.length,
      ennemis: g.enemies.list.length,
      // Ce qui est réellement dessiné, pas la taille du tampon.
      gouttes: g.weather.rainMesh.visible
        ? Math.min(g.weather.dropBudget, g.weather.rainMesh.geometry.attributes.position.count)
        : 0,
      traces: g.vehicleFx.marks.count,
      fumee: g.vehicleFx.puffs.filter((p) => p.life > 0).length,
      qualite: g.settings.get('quality'),
      resolution: `${Math.round(g.renderer.getPixelRatio() * 100) / 100}×`,
      memoireMo: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
    };
  }

  render() {
    const s = this.snapshot();
    this.panel.innerHTML = [
      ['FPS', `${s.fps} · ${s.frameMs} ms (pire ${s.pireFrameMs})`],
      ['Draw calls', s.drawCalls],
      ['Triangles', s.triangles.toLocaleString('fr-FR')],
      ['Géométries · textures', `${s.geometries} · ${s.textures}`],
      ['Véhicules · piétons', `${s.vehicules} · ${s.pietons}`],
      ['Ennemis', s.ennemis],
      ['Gouttes · traces · fumée', `${s.gouttes} · ${s.traces} · ${s.fumee}`],
      ['Qualité · rendu', `${s.qualite} · ${s.resolution}`],
      ['Mémoire JS', s.memoireMo === null ? 'n/d' : `${s.memoireMo} Mo`],
    ]
      .map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`)
      .join('');
  }
}

// Presets : chaque niveau fixe la résolution, les ombres, la densité de monde
// et la portée de vue. `auto` choisit selon les FPS réellement mesurés.
export const PRESETS = {
  faible: { renderScale: 60, shadows: false, shadowMap: 1024, traffic: 6, peds: 6, drops: 900, far: 380 },
  moyen: { renderScale: 85, shadows: true, shadowMap: 1024, traffic: 10, peds: 10, drops: 2000, far: 600 },
  eleve: { renderScale: 100, shadows: true, shadowMap: 2048, traffic: 14, peds: 14, drops: 3600, far: 1000 },
};

export function applyPreset(game, name) {
  const preset = PRESETS[name] || PRESETS.moyen;
  game.settings.set('renderScale', preset.renderScale);
  game.settings.set('shadows', preset.shadows);
  game.traffic.maxCars = preset.traffic;
  // La boucle recalcule pedBudget chaque frame selon la météo : le preset
  // fixe le plafond, pas la valeur, sinon il serait écrasé aussitôt.
  game.pedCap = preset.peds;
  game.traffic.pedBudget = Math.min(game.traffic.pedBudget, preset.peds);
  game.weather.dropBudget = preset.drops;
  game.camera.far = preset.far;
  game.camera.updateProjectionMatrix();

  // La carte d'ombres couvre une boîte de 170 m : 1024 donne déjà 6 texels par
  // mètre. On ne paie 2048 qu'en qualité élevée, et il faut jeter l'ancienne
  // cible pour que Three.js en réalloue une à la bonne taille.
  const sun = game.world.sun;
  if (sun.shadow.mapSize.x !== preset.shadowMap) {
    sun.shadow.mapSize.set(preset.shadowMap, preset.shadowMap);
    sun.shadow.map?.dispose();
    sun.shadow.map = null;
  }
  return preset;
}
