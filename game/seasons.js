import * as THREE from 'three';
import { ParticleField, flakeTexture, leafTexture } from './particles.js';

// Quatre saisons qui tournent en continu. Chacune décrit une palette et un
// climat ; tout est interpolé, donc l'automne devient l'hiver sans que rien
// ne saute à l'image.
export const SEASONS = {
  printemps: {
    label: 'Printemps',
    grass: 0x5c9a4c, // herbe vive
    leaf: 0x4f9a42,
    leafScale: 1.0,
    fall: 0, // feuilles qui tombent
    cold: 0, // 1 = la pluie devient neige
    warmth: 0.18, // teinte chaude ajoutée au soleil
  },
  ete: {
    label: 'Été',
    grass: 0x4a7a44,
    leaf: 0x3f7a3a,
    leafScale: 1.08,
    fall: 0,
    cold: 0,
    warmth: 0.32,
  },
  automne: {
    label: 'Automne',
    grass: 0x6d7540,
    leaf: 0xb5762c, // feuillage roux
    leafScale: 0.92,
    fall: 1,
    cold: 0.3,
    warmth: 0.24,
  },
  hiver: {
    label: 'Hiver',
    grass: 0x6a6f63,
    leaf: 0x5a4b38, // branches presque nues
    leafScale: 0.42,
    fall: 0.15,
    cold: 1,
    warmth: 0,
  },
};

const ORDER = ['printemps', 'ete', 'automne', 'hiver'];
const DAYS_PER_SEASON = 2; // une saison dure deux journées de jeu (24 min réelles)
const BLEND_DAYS = 0.6; // la bascule s'étale sur les dernières heures

const SNOW_COUNT = 2600;
const LEAF_COUNT = 420;

export class SeasonSystem {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;

    this.index = 0;
    this.dayInSeason = 0;
    this.blend = 0;

    // Valeurs effectives lues par le monde et la conduite.
    this.grass = new THREE.Color(SEASONS.printemps.grass);
    this.leaf = new THREE.Color(SEASONS.printemps.leaf);
    this.leafScale = 1;
    this.fall = 0;
    this.cold = 0;
    this.warmth = 0.18;

    // Couche de neige au sol : monte quand il neige, fond lentement ensuite.
    this.cover = 0;

    this.snow = new ParticleField(scene, {
      count: SNOW_COUNT,
      field: 80,
      height: 38,
      texture: flakeTexture(),
      color: 0xf2f6fb,
      size: 0.34,
      fallMin: 3.2,
      fallMax: 7.5,
      sway: 2.4,
      opacityMax: 0.9,
    });
    this.leaves = new ParticleField(scene, {
      count: LEAF_COUNT,
      field: 70,
      height: 18,
      texture: leafTexture(),
      color: 0xc07a2e,
      size: 0.42,
      fallMin: 1.4,
      fallMax: 3.2,
      sway: 3.6,
      opacityMax: 0.85,
    });
    this.leaves.material.color.setHex(0xc07a2e);
  }

  get name() {
    return ORDER[this.index];
  }

  get label() {
    // Pendant la bascule, on annonce déjà la saison qui arrive.
    return SEASONS[ORDER[this.blend > 0.5 ? (this.index + 1) % ORDER.length : this.index]].label;
  }

  // Forcée par la console de debug ou par une mission.
  set(name) {
    const i = ORDER.indexOf(name);
    if (i < 0) return false;
    this.index = i;
    this.dayInSeason = 0;
    this.blend = 0;
    this.applyBlend();
    return true;
  }

  applyBlend() {
    const a = SEASONS[ORDER[this.index]];
    const b = SEASONS[ORDER[(this.index + 1) % ORDER.length]];
    const t = this.blend;
    this.grass.setHex(a.grass).lerp(new THREE.Color(b.grass), t);
    this.leaf.setHex(a.leaf).lerp(new THREE.Color(b.leaf), t);
    this.leafScale = THREE.MathUtils.lerp(a.leafScale, b.leafScale, t);
    this.fall = THREE.MathUtils.lerp(a.fall, b.fall, t);
    this.cold = THREE.MathUtils.lerp(a.cold, b.cold, t);
    this.warmth = THREE.MathUtils.lerp(a.warmth, b.warmth, t);
  }

  // `days` : fraction de journée écoulée depuis la dernière image.
  update(dt, days, focus, weather) {
    this.dayInSeason += days;
    if (this.dayInSeason >= DAYS_PER_SEASON) {
      this.dayInSeason -= DAYS_PER_SEASON;
      this.index = (this.index + 1) % ORDER.length;
    }
    const remaining = DAYS_PER_SEASON - this.dayInSeason;
    this.blend = remaining < BLEND_DAYS ? 1 - remaining / BLEND_DAYS : 0;
    this.applyBlend();

    // Quand il fait froid, la précipitation tombe en neige plutôt qu'en pluie.
    const snowing = weather.rain * this.cold;
    const raining = weather.rain * (1 - this.cold);
    this.snowfall = snowing;
    this.rainfall = raining;

    // Accumulation : ~40 s de neige pour couvrir le sol, fonte bien plus lente.
    if (snowing > 0.05) this.cover = Math.min(1, this.cover + dt * snowing * 0.025);
    else this.cover = Math.max(0, this.cover - dt * (0.004 + this.warmth * 0.02));

    this.snow.update(dt, focus, snowing, weather.wind * 0.35, weather.windAngle);
    this.leaves.update(dt, focus, this.fall * 0.8, weather.wind * 0.5, weather.windAngle);

    this.applyToWorld();
  }

  // Palette : herbe, feuillage, et la neige qui blanchit sol et trottoirs.
  applyToWorld() {
    const w = this.world;
    if (!w.grassMat) return;

    const snow = this.cover;
    const white = new THREE.Color(0xe8eef5);

    w.grassMat.color.copy(this.grass).lerp(white, snow * 0.9);
    w.leafMat.color.copy(this.leaf).lerp(white, snow * 0.55);
    if (w.leaves) w.leaves.scale.setScalar(this.leafScale);

    w.seasonMods.snow = snow;
    w.seasonMods.warmth = this.warmth;
    w.seasonMods.sidewalk = snow;
  }

  // Adhérence : la neige au sol est bien pire que la pluie.
  get gripMul() {
    return 1 - this.cover * 0.6;
  }
}
