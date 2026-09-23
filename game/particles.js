import * as THREE from 'three';

// Champ de particules qui suit le joueur : pluie, neige, feuilles. Tout est
// pré-alloué une fois ; une particule qui touche le sol est recyclée en haut
// de la boîte, jamais recréée. Le budget graphique règle le nombre réellement
// dessiné via `setDrawRange`, sans toucher au tampon.
export class ParticleField {
  constructor(scene, options) {
    const {
      count,
      field = 90,
      height = 45,
      texture,
      color = 0xffffff,
      size = 0.26,
      fallMin = 26,
      fallMax = 42,
      sway = 0,
      opacityMax = 0.75,
    } = options;

    this.count = count;
    this.field = field;
    this.height = height;
    this.fallMin = fallMin;
    this.fallSpan = fallMax - fallMin;
    this.sway = sway;
    this.opacityMax = opacityMax;
    this.budget = count;

    const positions = new Float32Array(count * 3);
    this.speeds = new Float32Array(count);
    this.phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * field;
      positions[i * 3 + 1] = Math.random() * height;
      positions[i * 3 + 2] = (Math.random() - 0.5) * field;
      this.speeds[i] = fallMin + Math.random() * this.fallSpan;
      this.phases[i] = Math.random() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.material = new THREE.PointsMaterial({
      map: texture,
      color,
      size,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false,
    });
    this.mesh = new THREE.Points(geo, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    scene.add(this.mesh);
    this.time = 0;
  }

  // `intensity` 0-1 pilote l'opacité, `wind` la dérive horizontale.
  update(dt, focus, intensity, wind = 0, windAngle = 0) {
    const visible = intensity > 0.02;
    this.mesh.visible = visible;
    if (!visible) return;

    const drawn = Math.min(this.count, this.budget);
    this.mesh.geometry.setDrawRange(0, drawn);
    this.material.opacity = intensity * this.opacityMax;

    this.time += dt;
    const driftX = Math.cos(windAngle) * wind * 12;
    const driftZ = Math.sin(windAngle) * wind * 12;
    const pos = this.mesh.geometry.attributes.position;
    const arr = pos.array;

    for (let i = 0; i < drawn; i++) {
      const i3 = i * 3;
      arr[i3 + 1] -= this.speeds[i] * dt;
      arr[i3] += driftX * dt;
      arr[i3 + 2] += driftZ * dt;
      if (this.sway) {
        // Balancement propre à chaque particule : les flocons et les feuilles
        // ne tombent pas droit.
        arr[i3] += Math.cos(this.time * 1.7 + this.phases[i]) * this.sway * dt;
        arr[i3 + 2] += Math.sin(this.time * 1.3 + this.phases[i]) * this.sway * dt;
      }
      if (arr[i3 + 1] < 0) {
        arr[i3] = (Math.random() - 0.5) * this.field;
        arr[i3 + 1] = this.height * 0.88 + Math.random() * 8;
        arr[i3 + 2] = (Math.random() - 0.5) * this.field;
      }
    }
    pos.needsUpdate = true;
    this.mesh.position.set(focus.x, 0, focus.z);
  }
}

// --- textures générées au canvas, aucun fichier externe ---

export function streakTexture() {
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

export function flakeTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(8, 8, 0, 8, 8, 8);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.85)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 16, 16);
  return new THREE.CanvasTexture(c);
}

export function leafTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const g = c.getContext('2d');
  // Une feuille simple : deux arcs qui se rejoignent en pointe.
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.moveTo(8, 1);
  g.quadraticCurveTo(15, 8, 8, 15);
  g.quadraticCurveTo(1, 8, 8, 1);
  g.fill();
  return new THREE.CanvasTexture(c);
}
