import * as THREE from 'three';

// accel en m/s², top en m/s (× 3.6 pour des km/h).
export const VEHICLE_SPECS = {
  citadine: { label: 'Citadine', accel: 9, top: 34, turn: 2.2, mass: 1, value: 1200, colors: [0xb8c0c8, 0x6b8fa8, 0xc86b5a, 0xd9c26b], size: [1.85, 1.3, 4.1] },
  berline: { label: 'Berline', accel: 11, top: 44, turn: 2.0, mass: 1.15, value: 3500, colors: [0x2f3b4a, 0x8a8f96, 0x1f2430, 0x53616f], size: [1.95, 1.38, 4.7] },
  sportive: { label: 'Sportive', accel: 16.5, top: 61, turn: 2.35, mass: 0.95, value: 24000, colors: [0xd93a2b, 0xf0c000, 0x111418, 0x2ba3c8], size: [1.98, 1.12, 4.45] },
  taxi: { label: 'Taxi', accel: 10.5, top: 41, turn: 2.0, mass: 1.15, value: 2800, colors: [0xf0b429], size: [1.95, 1.4, 4.7] },
  van: { label: 'Camionnette', accel: 7.5, top: 31, turn: 1.7, mass: 1.6, value: 5200, colors: [0xe6e6e6, 0x5a6b7a, 0x7a6a58], size: [2.15, 2.0, 5.3] },
  police: { label: 'Police', accel: 14.5, top: 55, turn: 2.15, mass: 1.25, value: 0, colors: [0x1c2530], size: [1.98, 1.42, 4.8] },
};

export function buildVehicleMesh(specName, colorOverride) {
  const spec = VEHICLE_SPECS[specName];
  const [w, h, l] = spec.size;
  const g = new THREE.Group();
  const color = colorOverride ?? spec.colors[Math.floor(Math.random() * spec.colors.length)];
  const bodyMat = new THREE.MeshLambertMaterial({ color });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x141a22 });
  const trimMat = new THREE.MeshLambertMaterial({ color: 0x1a1d22 });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.55, l), bodyMat);
  chassis.position.y = h * 0.42;
  chassis.castShadow = true;
  g.add(chassis);

  const cabinLen = specName === 'van' ? l * 0.6 : l * 0.46;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, h * 0.5, cabinLen), glassMat);
  cabin.position.set(0, h * 0.86, specName === 'van' ? l * 0.06 : -l * 0.04);
  cabin.castShadow = true;
  g.add(cabin);

  // Toit de la teinte de la caisse, pour ne pas avoir une bulle de verre.
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w * 0.82, h * 0.12, cabinLen * 0.8), bodyMat);
  roof.position.set(0, h * 1.08, cabin.position.z);
  g.add(roof);

  const wheelGeo = new THREE.CylinderGeometry(h * 0.33, h * 0.33, 0.28, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheels = [];
  const wx = w / 2 - 0.05;
  const wz = l * 0.33;
  for (const [x, z] of [[-wx, wz], [wx, wz], [-wx, -wz], [wx, -wz]]) {
    const wheel = new THREE.Mesh(wheelGeo, trimMat);
    wheel.position.set(x, h * 0.33, z);
    wheel.castShadow = true;
    g.add(wheel);
    wheels.push(wheel);
  }

  const headMat = new THREE.MeshBasicMaterial({ color: 0x2a2a26 });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0x3a1512 });
  const headGeo = new THREE.BoxGeometry(w * 0.22, 0.16, 0.1);
  const heads = [];
  for (const x of [-w * 0.32, w * 0.32]) {
    const lamp = new THREE.Mesh(headGeo, headMat);
    lamp.position.set(x, h * 0.5, l / 2 + 0.02);
    g.add(lamp);
    heads.push(lamp);
    const tail = new THREE.Mesh(headGeo, tailMat);
    tail.position.set(x, h * 0.55, -l / 2 - 0.02);
    g.add(tail);
  }

  let lightbar = null;
  if (specName === 'police') {
    // Livrée noir et blanc + rampe lumineuse.
    for (const side of [-1, 1]) {
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.04, h * 0.34, l * 0.42), new THREE.MeshLambertMaterial({ color: 0xf2f2f2 }));
      door.position.set((side * w) / 2, h * 0.42, 0);
      g.add(door);
    }
    lightbar = new THREE.Group();
    const barBase = new THREE.Mesh(new THREE.BoxGeometry(w * 0.66, 0.1, 0.34), trimMat);
    lightbar.add(barBase);
    const blue = new THREE.Mesh(new THREE.BoxGeometry(w * 0.3, 0.16, 0.3), new THREE.MeshBasicMaterial({ color: 0x1a4fd0 }));
    blue.position.x = -w * 0.17;
    const red = new THREE.Mesh(new THREE.BoxGeometry(w * 0.3, 0.16, 0.3), new THREE.MeshBasicMaterial({ color: 0xd01a1a }));
    red.position.x = w * 0.17;
    lightbar.add(blue, red);
    lightbar.position.set(0, h * 1.2, cabin.position.z);
    g.add(lightbar);
    lightbar.userData = { blue, red };
  }

  g.userData.parts = { wheels, heads, headMat, tailMat, lightbar, bodyMat };
  return g;
}

export class Vehicle {
  constructor(scene, specName, pos, yaw = 0, colorOverride) {
    this.scene = scene;
    this.specName = specName;
    this.spec = VEHICLE_SPECS[specName];
    this.mesh = buildVehicleMesh(specName, colorOverride);
    this.mesh.position.copy(pos);
    this.mesh.rotation.y = yaw;
    scene.add(this.mesh);

    this.pos = this.mesh.position;
    this.yaw = yaw;
    this.speed = 0;
    this.steer = 0;
    this.damage = 0;
    this.wheelSpin = 0;
    this.roll = 0;
    this.isPolice = specName === 'police';
    this.driver = null; // occupant PNJ éventuel
    this.locked = false;
    this.sirenOn = false;
    this.onCrash = null;
    this.gripMul = 1; // < 1 par temps de pluie : freinage plus long, virages plus mous
  }

  get forward() {
    return new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
  }

  get speedKmh() {
    return Math.abs(this.speed) * 3.6;
  }

  get power() {
    return this.damage >= 100 ? 0.35 : 1 - (this.damage / 100) * 0.35;
  }

  // controls : { throttle -1..1, steer -1..1 (positif = vers la droite de l'écran), handbrake bool }
  update(dt, controls, world) {
    const { throttle = 0, steer = 0, handbrake = false } = controls || {};
    const spec = this.spec;
    const top = spec.top * this.power;

    if (throttle > 0) {
      this.speed += spec.accel * this.power * throttle * dt * (0.85 + 0.15 * this.gripMul);
    } else if (throttle < 0) {
      if (this.speed > 0.6) this.speed -= 24 * dt * this.gripMul; // freinage
      else this.speed -= spec.accel * 0.55 * dt; // marche arrière
    } else {
      this.speed -= this.speed * 0.9 * dt;
    }

    if (handbrake) this.speed -= this.speed * 2.4 * dt;

    // Traînée aérodynamique : fixe la vitesse de pointe.
    this.speed -= Math.sign(this.speed) * (this.speed * this.speed) / (top * top) * spec.accel * dt;
    this.speed = THREE.MathUtils.clamp(this.speed, -top * 0.32, top);

    const speedFactor = THREE.MathUtils.clamp(Math.abs(this.speed) / 5, 0, 1);
    const grip = 1 - 0.5 * THREE.MathUtils.clamp(Math.abs(this.speed) / top, 0, 1);
    const turn = spec.turn * grip * (handbrake ? 1.7 : 1) * (0.72 + 0.28 * this.gripMul);
    this.steer = THREE.MathUtils.lerp(this.steer, steer, 1 - Math.exp(-12 * dt));
    // Signe négatif : en repère Three.js, augmenter le yaw fait tourner vers la
    // gauche de l'écran. Sans ça, D braquerait à gauche.
    this.yaw -= this.steer * turn * dt * speedFactor * Math.sign(this.speed || 1);

    const before = this.pos.clone();
    this.pos.addScaledVector(this.forward, this.speed * dt);

    // Collision : deux cercles (avant / arrière) pour glisser le long des murs.
    if (world) {
      const half = this.spec.size[2] * 0.34;
      let worst = 0;
      for (const sign of [1, -1]) {
        const probe = this.pos.clone().addScaledVector(this.forward, half * sign);
        const before = probe.clone();
        const hit = world.collideCircle(probe, 1.25);
        if (hit > 0) {
          worst = Math.max(worst, hit);
          this.pos.add(probe.sub(before)); // on applique le dégagement à toute la caisse
        }
      }
      if (worst > 0.001) {
        const impact = Math.abs(this.speed);
        if (impact > 4) {
          this.damage = Math.min(100, this.damage + impact * 0.55);
          if (this.onCrash) this.onCrash(impact / this.spec.top);
        }
        this.speed *= impact > 12 ? -0.16 : 0.45;
      }
    }

    const limit = 700;
    this.pos.x = THREE.MathUtils.clamp(this.pos.x, -limit, limit);
    this.pos.z = THREE.MathUtils.clamp(this.pos.z, -limit, limit);
    this.travelled = this.pos.distanceTo(before);

    this.mesh.rotation.y = this.yaw;
    this.animate(dt);
  }

  animate(dt) {
    const parts = this.mesh.userData.parts;
    this.wheelSpin += (this.speed * dt) / 0.45;
    parts.wheels.forEach((wheel, i) => {
      wheel.rotation.x = this.wheelSpin;
      if (i < 2) wheel.rotation.y = -this.steer * 0.45;
    });
    // Roulis en virage : lisible et ça suffit à donner du poids.
    this.roll = THREE.MathUtils.lerp(this.roll, -this.steer * THREE.MathUtils.clamp(this.speed / 30, 0, 1) * 0.11, 1 - Math.exp(-8 * dt));
    this.mesh.rotation.z = this.roll;

    if (parts.lightbar) {
      const t = performance.now() / 1000;
      const on = this.sirenOn;
      const phase = Math.sin(t * 9) > 0;
      parts.lightbar.userData.blue.material.color.setHex(on && phase ? 0x6aa8ff : 0x14204a);
      parts.lightbar.userData.red.material.color.setHex(on && !phase ? 0xff5a4a : 0x4a1414);
    }
  }

  setLights(on) {
    const parts = this.mesh.userData.parts;
    parts.headMat.color.setHex(on ? 0xfff2cc : 0x2a2a26);
    parts.tailMat.color.setHex(on ? 0xff3b2f : 0x3a1512);
  }

  // Place un occupant (à l'échelle 0,8) de façon que sa tête arrive à hauteur
  // de vitre : le reste du corps est masqué par la carrosserie.
  seatPosition() {
    const headHeight = 1.73 * 0.8;
    const windowLine = this.spec.size[1] * 0.88;
    return this.pos
      .clone()
      .addScaledVector(this.forward, 0.12)
      .add(new THREE.Vector3(0, windowLine - headHeight, 0));
  }

  exitPosition() {
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    return this.pos.clone().addScaledVector(right, -(this.spec.size[0] / 2 + 0.9));
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
    });
  }
}
