import * as THREE from 'three';
import { ParticleField, streakTexture } from './particles.js';

// Cinq temps possibles. Les valeurs sont des cibles : tout est interpolé
// en continu, donc le ciel ne saute jamais d'un état à l'autre.
export const WEATHER = {
  clear: { label: 'Clair', clouds: 0.0, rain: 0.0, fog: 0.0, wet: 0.0, grip: 1.0, sight: 1.0, wind: 0.1, storm: 0 },
  cloudy: { label: 'Nuageux', clouds: 0.55, rain: 0.0, fog: 0.12, wet: 0.1, grip: 0.97, sight: 0.92, wind: 0.3, storm: 0 },
  rain: { label: 'Pluie', clouds: 0.85, rain: 1.0, fog: 0.35, wet: 1.0, grip: 0.7, sight: 0.75, wind: 0.45, storm: 0 },
  fog: { label: 'Brouillard', clouds: 0.5, rain: 0.0, fog: 1.0, wet: 0.25, grip: 0.95, sight: 0.4, wind: 0.05, storm: 0 },
  storm: { label: 'Orage', clouds: 0.98, rain: 1.0, fog: 0.45, wet: 1.0, grip: 0.62, sight: 0.6, wind: 1.0, storm: 1 },
};

const ORDER = ['clear', 'cloudy', 'rain', 'fog', 'storm'];
const WEIGHTS = [36, 27, 18, 9, 10];
const MIN_DURATION = 150; // 2 min 30 minimum par météo
const MAX_DURATION = 330;
const TRANSITION = 18; // secondes pour passer d'un temps à l'autre

const DROP_COUNT = 3600;
const FIELD = 90; // arête de la boîte de pluie qui suit le joueur

// Un éclair toutes les 4 à 14 s pendant un orage.
const STRIKE_MIN = 4;
const STRIKE_MAX = 14;
const SOUND_SPEED = 343; // m/s : le tonnerre arrive après la lumière

export class WeatherSystem {
  constructor(scene, world, audio = null) {
    this.scene = scene;
    this.world = world;
    this.audio = audio;

    this.current = 'clear';
    this.next = 'clear';
    this.blend = 1; // 1 = transition terminée
    this.timer = 0;
    this.duration = 200;

    // Valeurs effectives, lues par le reste du jeu.
    this.clouds = 0;
    this.rain = 0;
    this.fog = 0;
    this.wet = 0;
    this.grip = 1;
    this.sight = 1;
    this.wind = 0.1;
    this.storm = 0;
    this.windAngle = Math.random() * Math.PI * 2;

    // Éclairs.
    this.flash = 0;
    this.strikeTimer = STRIKE_MIN;
    this.pendingThunder = [];
    this.doubleFlash = 0;
    this.lastStrike = null;

    this.field = new ParticleField(scene, {
      count: DROP_COUNT,
      field: FIELD,
      height: 45,
      texture: streakTexture(),
      color: 0x9fb6cf,
      // Fines : à 0,85 les gouttes proches devenaient de gros flocons blancs.
      size: 0.26,
      fallMin: 26,
      fallMax: 42,
      opacityMax: 0.75,
    });
    // Noms conservés : le reste du jeu et les tests les utilisent.
    this.rainMesh = this.field.mesh;
    this.rainMat = this.field.material;
  }

  get dropBudget() {
    return this.field.budget;
  }

  set dropBudget(n) {
    this.field.budget = n;
  }

  pickNext() {
    const total = WEIGHTS.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < ORDER.length; i++) {
      roll -= WEIGHTS[i];
      if (roll <= 0) return ORDER[i];
    }
    return 'clear';
  }

  // Forcé par la console de debug ou par une mission.
  set(name, instant = false) {
    if (!WEATHER[name]) return false;
    this.current = instant ? name : this.current;
    this.next = name;
    this.blend = instant ? 1 : 0;
    this.timer = 0;
    this.duration = MIN_DURATION + Math.random() * (MAX_DURATION - MIN_DURATION);
    if (instant) this.applyBlend();
    return true;
  }

  applyBlend() {
    const a = WEATHER[this.current];
    const b = WEATHER[this.next];
    const t = this.blend;
    this.clouds = THREE.MathUtils.lerp(a.clouds, b.clouds, t);
    this.rain = THREE.MathUtils.lerp(a.rain, b.rain, t);
    this.fog = THREE.MathUtils.lerp(a.fog, b.fog, t);
    this.wet = THREE.MathUtils.lerp(a.wet, b.wet, t);
    this.grip = THREE.MathUtils.lerp(a.grip, b.grip, t);
    this.sight = THREE.MathUtils.lerp(a.sight, b.sight, t);
    this.wind = THREE.MathUtils.lerp(a.wind, b.wind, t);
    this.storm = THREE.MathUtils.lerp(a.storm, b.storm, t);
  }

  get label() {
    // Pendant une transition, on annonce déjà la météo qui arrive.
    const base = WEATHER[this.blend > 0.5 ? this.next : this.current];
    // En hiver la pluie tombe en neige : autant le dire au joueur.
    if (this.seasons && this.seasons.snowfall > 0.35) return 'Neige';
    return base.label;
  }

  // Un éclair : double flash lumineux, puis tonnerre après le temps qu'il faut
  // au son pour parcourir la distance. C'est ce décalage qui rend l'orage
  // crédible — on voit d'abord, on entend ensuite.
  strike(distance = 300 + Math.random() * 2900) {
    this.flash = 1;
    this.doubleFlash = 0.09;
    this.lastStrike = { distance: Math.round(distance), delay: +(distance / SOUND_SPEED).toFixed(2) };
    this.pendingThunder.push({ delay: distance / SOUND_SPEED, distance });
    return this.lastStrike;
  }

  updateLightning(dt) {
    // Décroissance rapide : un éclair dure moins d'un dixième de seconde.
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 9);
    if (this.doubleFlash > 0) {
      this.doubleFlash -= dt;
      if (this.doubleFlash <= 0) this.flash = Math.max(this.flash, 0.55);
    }

    for (let i = this.pendingThunder.length - 1; i >= 0; i--) {
      const t = this.pendingThunder[i];
      t.delay -= dt;
      if (t.delay <= 0) {
        this.audio?.thunder(t.distance);
        this.pendingThunder.splice(i, 1);
      }
    }

    if (this.storm < 0.35) return;
    this.strikeTimer -= dt * this.storm;
    if (this.strikeTimer <= 0) {
      this.strikeTimer = STRIKE_MIN + Math.random() * (STRIKE_MAX - STRIKE_MIN);
      this.strike();
    }
  }

  update(dt, focus) {
    if (this.blend < 1) {
      this.blend = Math.min(1, this.blend + dt / TRANSITION);
      if (this.blend >= 1) this.current = this.next;
    } else {
      this.timer += dt;
      if (this.timer >= this.duration) {
        let candidate = this.pickNext();
        if (candidate === this.current) candidate = this.current === 'clear' ? 'cloudy' : 'clear';
        this.set(candidate);
      }
    }
    this.applyBlend();
    this.updateLightning(dt);

    // Le vent tourne lentement : la pluie ne dérive pas toujours du même côté.
    this.windAngle += dt * 0.05;

    // Le monde lit ces modificateurs dans son cycle jour/nuit.
    this.world.weatherMods.sunMul = 1 - this.clouds * 0.72;
    this.world.weatherMods.fogAdd = this.fog * 0.022;
    this.world.weatherMods.fogGrey = Math.min(1, this.clouds * 0.75 + this.fog * 0.5);
    this.world.weatherMods.wet = this.wet;
    this.world.weatherMods.flash = this.flash;

    // La saison décide si la précipitation tombe en pluie ou en neige ; sans
    // saisons branchées, tout tombe en pluie.
    const asRain = this.seasons ? this.seasons.rainfall : this.rain;
    this.field.update(dt, focus, asRain ?? this.rain, this.wind, this.windAngle);
  }
}
