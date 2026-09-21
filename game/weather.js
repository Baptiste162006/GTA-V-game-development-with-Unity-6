import * as THREE from 'three';

// Quatre temps possibles. Les valeurs sont des cibles : tout est interpolé
// en continu, donc le ciel ne saute jamais d'un état à l'autre.
export const WEATHER = {
  clear: { label: 'Clair', clouds: 0.0, rain: 0.0, fog: 0.0, wet: 0.0, grip: 1.0, sight: 1.0 },
  cloudy: { label: 'Nuageux', clouds: 0.55, rain: 0.0, fog: 0.12, wet: 0.1, grip: 0.97, sight: 0.92 },
  rain: { label: 'Pluie', clouds: 0.85, rain: 1.0, fog: 0.35, wet: 1.0, grip: 0.7, sight: 0.75 },
  fog: { label: 'Brouillard', clouds: 0.5, rain: 0.0, fog: 1.0, wet: 0.25, grip: 0.95, sight: 0.4 },
};

const ORDER = ['clear', 'cloudy', 'rain', 'fog'];
const WEIGHTS = [40, 30, 20, 10];
const MIN_DURATION = 150; // 2 min 30 minimum par météo
const MAX_DURATION = 330;
const TRANSITION = 18; // secondes pour passer d'un temps à l'autre

const DROP_COUNT = 3600;
const FIELD = 90; // arête de la boîte de pluie qui suit le joueur

function streakTexture() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 16;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 16);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.9)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 16);
  return new THREE.CanvasTexture(c);
}

export class WeatherSystem {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;

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

    this.buildRain();
  }

  buildRain() {
    const positions = new Float32Array(DROP_COUNT * 3);
    this.speeds = new Float32Array(DROP_COUNT);
    for (let i = 0; i < DROP_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * FIELD;
      positions[i * 3 + 1] = Math.random() * 45;
      positions[i * 3 + 2] = (Math.random() - 0.5) * FIELD;
      this.speeds[i] = 26 + Math.random() * 16;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.rainMat = new THREE.PointsMaterial({
      map: streakTexture(),
      color: 0x9fb6cf,
      // Fines : à 0,85 les gouttes proches devenaient de gros flocons blancs.
      size: 0.26,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false,
    });
    this.rainMesh = new THREE.Points(geo, this.rainMat);
    this.rainMesh.frustumCulled = false;
    this.rainMesh.visible = false;
    this.scene.add(this.rainMesh);
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
  }

  get label() {
    // Pendant une transition, on annonce déjà la météo qui arrive.
    return WEATHER[this.blend > 0.5 ? this.next : this.current].label;
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

    // Le monde lit ces modificateurs dans son cycle jour/nuit.
    this.world.weatherMods.sunMul = 1 - this.clouds * 0.72;
    this.world.weatherMods.fogAdd = this.fog * 0.022;
    this.world.weatherMods.fogGrey = Math.min(1, this.clouds * 0.75 + this.fog * 0.5);
    this.world.weatherMods.wet = this.wet;

    this.updateRain(dt, focus);
  }

  updateRain(dt, focus) {
    const visible = this.rain > 0.02;
    this.rainMesh.visible = visible;
    if (!visible) return;

    this.rainMat.opacity = this.rain * 0.75;
    const pos = this.rainMesh.geometry.attributes.position;
    const drift = 3.5 * this.rain;

    for (let i = 0; i < DROP_COUNT; i++) {
      const i3 = i * 3;
      pos.array[i3 + 1] -= this.speeds[i] * dt;
      pos.array[i3] += drift * dt;
      if (pos.array[i3 + 1] < 0) {
        // On recycle la goutte en haut de la boîte.
        pos.array[i3] = (Math.random() - 0.5) * FIELD;
        pos.array[i3 + 1] = 40 + Math.random() * 8;
        pos.array[i3 + 2] = (Math.random() - 0.5) * FIELD;
      }
    }
    pos.needsUpdate = true;
    this.rainMesh.position.set(focus.x, 0, focus.z);
  }
}
