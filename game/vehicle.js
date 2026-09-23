import * as THREE from 'three';

// accel en m/s², top en m/s (× 3.6 pour des km/h).
export const VEHICLE_SPECS = {
  citadine: { label: 'Citadine', accel: 9, top: 34, turn: 2.2, mass: 1, value: 1200, colors: [0xb8c0c8, 0x6b8fa8, 0xc86b5a, 0xd9c26b], size: [1.85, 1.3, 4.1] },
  berline: { label: 'Berline', accel: 11, top: 44, turn: 2.0, mass: 1.15, value: 3500, colors: [0x2f3b4a, 0x8a8f96, 0x1f2430, 0x53616f], size: [1.95, 1.38, 4.7] },
  sportive: { label: 'Sportive', accel: 16.5, top: 61, turn: 2.35, mass: 0.95, value: 24000, colors: [0xd93a2b, 0xf0c000, 0x111418, 0x2ba3c8], size: [1.98, 1.12, 4.45] },
  taxi: { label: 'Taxi', accel: 10.5, top: 41, turn: 2.0, mass: 1.15, value: 2800, colors: [0xf0b429], size: [1.95, 1.4, 4.7] },
  van: { label: 'Camionnette', accel: 7.5, top: 31, turn: 1.7, mass: 1.6, value: 5200, colors: [0xe6e6e6, 0x5a6b7a, 0x7a6a58], size: [2.15, 2.0, 5.3] },
  police: { label: 'Police', accel: 14.5, top: 55, turn: 2.15, mass: 1.25, value: 0, colors: [0x1c2530], size: [1.98, 1.42, 4.8] },

  muscle: { label: 'Muscle car', accel: 14, top: 53, turn: 1.9, mass: 1.3, value: 18000, colors: [0x8c1f1f, 0x1f2d5c, 0x2a2a2a, 0xd9821f], size: [2.05, 1.32, 4.95] },
  luxe: { label: 'Berline de luxe', accel: 12.5, top: 51, turn: 1.95, mass: 1.25, value: 48000, colors: [0x101318, 0xe8e6e1, 0x2b3b52], size: [2.0, 1.4, 5.1] },
  suv: { label: '4×4', accel: 10, top: 42, turn: 1.8, mass: 1.45, value: 9500, colors: [0x2f3a2f, 0x53565c, 0x1b2430, 0xa8a49b], size: [2.1, 1.85, 4.9] },
  pickup: { label: 'Pick-up', accel: 9.2, top: 39, turn: 1.75, mass: 1.5, value: 7200, colors: [0x3b5a7a, 0x7a3b3b, 0xd6cfc0], size: [2.05, 1.7, 5.2] },
  camion: { label: 'Camion', accel: 6, top: 30, turn: 1.45, mass: 2.2, value: 26000, colors: [0xd8d4cc, 0x2f4f6f, 0x7a6a58], size: [2.45, 3.0, 8.2] },
  bus: { label: 'Bus', accel: 5.5, top: 27, turn: 1.3, mass: 2.6, value: 38000, colors: [0xe0a12c, 0x3f6f9f], size: [2.55, 3.1, 9.6] },
  ambulance: { label: 'Ambulance', accel: 9.5, top: 41, turn: 1.7, mass: 1.6, value: 0, colors: [0xf2f2f2], size: [2.2, 2.35, 5.6] },
  pompiers: { label: 'Camion de pompiers', accel: 7, top: 34, turn: 1.4, mass: 2.4, value: 0, colors: [0xc0241f], size: [2.5, 2.9, 7.8] },

  // Deux-roues : plus vifs, ils se couchent dans les virages et n'offrent aucune protection.
  scooter: { label: 'Scooter', accel: 8.5, top: 23, turn: 2.8, mass: 0.4, value: 900, colors: [0xe8e2d5, 0x5aa2ff, 0xff6b3d], size: [0.72, 1.15, 1.85], bike: true },
  moto: { label: 'Moto', accel: 18.5, top: 59, turn: 3.0, mass: 0.5, value: 16000, colors: [0x14181f, 0xb8232b, 0x2b6fb8, 0xe0e0e0], size: [0.8, 1.2, 2.15], bike: true },
};

// Les formes d'un véhicule ne dépendent que de son modèle : quinze jeux de
// géométries suffisent pour toute la circulation. Seules les couleurs, donc les
// matériaux, restent propres à chaque exemplaire.
const SHAPE_CACHE = new Map();
function shapes(specName) {
  let set = SHAPE_CACHE.get(specName);
  if (!set) {
    set = {};
    SHAPE_CACHE.set(specName, set);
  }
  return (key, make) => (set[key] ||= make());
}

// Deux-roues : cadre étroit, selle, guidon, deux roues alignées.
function buildBikeMesh(spec, color, geo) {
  const [w, h, l] = spec.size;
  const g = new THREE.Group();
  // La caisse est un groupe séparé des roues : elle seule plonge et roule.
  const body = new THREE.Group();
  g.add(body);
  const bodyMat = new THREE.MeshLambertMaterial({ color });
  const trimMat = new THREE.MeshLambertMaterial({ color: 0x1a1d22 });

  const frame = new THREE.Mesh(geo('frame', () => new THREE.BoxGeometry(w * 0.55, h * 0.3, l * 0.62)), bodyMat);
  frame.position.y = h * 0.52;
  frame.castShadow = true;
  body.add(frame);

  const seat = new THREE.Mesh(geo('seat', () => new THREE.BoxGeometry(w * 0.6, h * 0.14, l * 0.3)), trimMat);
  seat.position.set(0, h * 0.72, -l * 0.12);
  body.add(seat);

  const tank = new THREE.Mesh(geo('tank', () => new THREE.SphereGeometry(w * 0.34, 10, 8)), bodyMat);
  tank.scale.set(1, 0.8, 1.5);
  tank.position.set(0, h * 0.7, l * 0.14);
  body.add(tank);

  const bar = new THREE.Mesh(geo('bar', () => new THREE.BoxGeometry(w * 1.05, 0.05, 0.05)), trimMat);
  bar.position.set(0, h * 0.95, l * 0.36);
  body.add(bar);

  const wheelGeo = geo('wheel', () => new THREE.CylinderGeometry(h * 0.36, h * 0.36, 0.14, 12));
  wheelGeo.rotateZ(Math.PI / 2);
  const wheels = [];
  const steerPivots = [];
  for (const [i, z] of [l * 0.38, -l * 0.38].entries()) {
    const pivot = new THREE.Group();
    pivot.position.set(0, h * 0.36, z);
    const wheel = new THREE.Mesh(wheelGeo, trimMat);
    wheel.castShadow = true;
    pivot.add(wheel);
    g.add(pivot);
    wheels.push(wheel);
    if (i === 0) steerPivots.push(pivot); // seule la roue avant braque
  }
  wheels.push(wheels[0], wheels[1]);

  const headMat = new THREE.MeshBasicMaterial({ color: 0x2a2a26 });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0x3a1512 });
  const lamp = new THREE.Mesh(geo('lamp', () => new THREE.BoxGeometry(w * 0.4, 0.12, 0.08)), headMat);
  lamp.position.set(0, h * 0.78, l / 2);
  body.add(lamp);
  const tail = new THREE.Mesh(geo('tail', () => new THREE.BoxGeometry(w * 0.35, 0.1, 0.06)), tailMat);
  tail.position.set(0, h * 0.75, -l / 2);
  body.add(tail);

  g.userData.parts = { wheels, steerPivots, body, heads: [lamp], headMat, tailMat, lightbar: null, bodyMat, wheelRadius: h * 0.36 };
  return g;
}

export function buildVehicleMesh(specName, colorOverride) {
  const spec = VEHICLE_SPECS[specName];
  const [w, h, l] = spec.size;
  const color = colorOverride ?? spec.colors[Math.floor(Math.random() * spec.colors.length)];
  const geo = shapes(specName);
  if (spec.bike) return buildBikeMesh(spec, color, geo);
  const g = new THREE.Group();
  // La caisse est un groupe séparé des roues : elle seule plonge et roule.
  const body = new THREE.Group();
  g.add(body);
  const bodyMat = new THREE.MeshLambertMaterial({ color });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x141a22 });
  const trimMat = new THREE.MeshLambertMaterial({ color: 0x1a1d22 });

  const chassis = new THREE.Mesh(geo('chassis', () => new THREE.BoxGeometry(w, h * 0.55, l)), bodyMat);
  chassis.position.y = h * 0.42;
  chassis.castShadow = true;
  body.add(chassis);

  const cabinLen = specName === 'van' ? l * 0.6 : l * 0.46;
  const cabin = new THREE.Mesh(geo('cabin', () => new THREE.BoxGeometry(w * 0.9, h * 0.5, cabinLen)), glassMat);
  cabin.position.set(0, h * 0.86, specName === 'van' ? l * 0.06 : -l * 0.04);
  cabin.castShadow = true;
  body.add(cabin);

  // Toit de la teinte de la caisse, pour ne pas avoir une bulle de verre.
  const roof = new THREE.Mesh(geo('roof', () => new THREE.BoxGeometry(w * 0.82, h * 0.12, cabinLen * 0.8)), bodyMat);
  roof.position.set(0, h * 1.08, cabin.position.z);
  body.add(roof);

  const wheelGeo = geo('wheel', () => new THREE.CylinderGeometry(h * 0.33, h * 0.33, 0.28, 12));
  wheelGeo.rotateZ(Math.PI / 2);
  const wheels = [];
  const steerPivots = [];
  const wx = w / 2 - 0.05;
  const wz = l * 0.33;
  for (const [i, [x, z]] of [[-wx, wz], [wx, wz], [-wx, -wz], [wx, -wz]].entries()) {
    const pivot = new THREE.Group();
    pivot.position.set(x, h * 0.33, z);
    const wheel = new THREE.Mesh(wheelGeo, trimMat);
    wheel.castShadow = true;
    pivot.add(wheel);
    g.add(pivot);
    wheels.push(wheel);
    if (i < 2) steerPivots.push(pivot);
  }

  const headMat = new THREE.MeshBasicMaterial({ color: 0x2a2a26 });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0x3a1512 });
  const headGeo = geo('head', () => new THREE.BoxGeometry(w * 0.22, 0.16, 0.1));
  const heads = [];
  for (const x of [-w * 0.32, w * 0.32]) {
    const lamp = new THREE.Mesh(headGeo, headMat);
    lamp.position.set(x, h * 0.5, l / 2 + 0.02);
    body.add(lamp);
    heads.push(lamp);
    const tail = new THREE.Mesh(headGeo, tailMat);
    tail.position.set(x, h * 0.55, -l / 2 - 0.02);
    body.add(tail);
  }

  let lightbar = null;
  const emergency = specName === 'police' || specName === 'ambulance' || specName === 'pompiers';
  if (emergency) {
    // Bande latérale de livrée + rampe lumineuse.
    const stripe = { police: 0xf2f2f2, ambulance: 0xd8322c, pompiers: 0xf2f2f2 }[specName];
    for (const side of [-1, 1]) {
      const door = new THREE.Mesh(geo('door', () => new THREE.BoxGeometry(0.04, h * 0.28, l * 0.42)), new THREE.MeshLambertMaterial({ color: stripe }));
      door.position.set((side * w) / 2, h * 0.5, 0);
      body.add(door);
    }
    lightbar = new THREE.Group();
    const barBase = new THREE.Mesh(geo('barBase', () => new THREE.BoxGeometry(w * 0.66, 0.1, 0.34)), trimMat);
    lightbar.add(barBase);
    const blue = new THREE.Mesh(geo('gyro', () => new THREE.BoxGeometry(w * 0.3, 0.16, 0.3)), new THREE.MeshBasicMaterial({ color: 0x1a4fd0 }));
    blue.position.x = -w * 0.17;
    const red = new THREE.Mesh(geo('gyro', () => new THREE.BoxGeometry(w * 0.3, 0.16, 0.3)), new THREE.MeshBasicMaterial({ color: 0xd01a1a }));
    red.position.x = w * 0.17;
    lightbar.add(blue, red);
    lightbar.position.set(0, h * 1.2, cabin.position.z);
    g.add(lightbar);
    lightbar.userData = { blue, red };
  }

  g.userData.parts = { wheels, steerPivots, body, heads, headMat, tailMat, lightbar, bodyMat, wheelRadius: h * 0.33 };
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
    this.lastSpeed = 0;
    this.pitch = 0;
    this.braking = false;
    this.lightsOn = false;
    this.slip = 0; // 0 = adhérence, 1 = les roues patinent
    this.fx = null; // traces et fumée, seulement pour le véhicule du joueur
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

    this.braking = throttle < 0 && this.speed > 1;
    if (handbrake) this.speed -= this.speed * 2.4 * dt;

    // Patinage : frein à main lancé, gros freinage, ou sol glissant.
    const fast = Math.abs(this.speed) > 7;
    const target = fast && (handbrake || (this.braking && Math.abs(this.speed) > 16) || (this.gripMul < 0.8 && Math.abs(steer) > 0.5)) ? 1 : 0;
    this.slip = THREE.MathUtils.lerp(this.slip, target, 1 - Math.exp(-9 * dt));

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
    if (this.fx && this.slip > 0.35) this.emitSkid(dt);
    this.animate(dt);
  }

  // Une trace par roue arrière, et un peu de fumée : rien n'est créé ici, tout
  // vient des réserves de VehicleEffects.
  emitSkid(dt) {
    this.skidTimer = (this.skidTimer || 0) - dt;
    if (this.skidTimer > 0) return;
    this.skidTimer = 0.035;
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const back = this.forward.multiplyScalar(-this.spec.size[2] * 0.33);
    for (const side of [-1, 1]) {
      const x = this.pos.x + back.x + right.x * side * (this.spec.size[0] / 2 - 0.1);
      const z = this.pos.z + back.z + right.z * side * (this.spec.size[0] / 2 - 0.1);
      this.fx.addMark(x, z, this.yaw);
      if (Math.random() < 0.35) this.fx.addPuff(x, z, this.slip);
    }
  }

  animate(dt) {
    const parts = this.mesh.userData.parts;
    // Rotation issue de la distance réellement parcourue : à l'arrêt les roues
    // s'arrêtent, en marche arrière elles tournent à l'envers.
    this.wheelSpin += (this.speed * dt) / parts.wheelRadius;
    for (const wheel of parts.wheels) wheel.rotation.x = this.wheelSpin;
    // Le braquage passe par un pivot, sinon le roulement se ferait autour d'un
    // axe incliné dès que les roues sont tournées.
    for (const pivot of parts.steerPivots) pivot.rotation.y = -this.steer * 0.42;

    // Assiette : plongée au freinage, léger cabrage à l'accélération.
    const accel = (this.speed - this.lastSpeed) / Math.max(dt, 0.001);
    this.lastSpeed = this.speed;
    this.pitch = THREE.MathUtils.lerp(this.pitch, THREE.MathUtils.clamp(accel * 0.0022, -0.05, 0.05), 1 - Math.exp(-7 * dt));
    parts.body.rotation.x = this.pitch;

    // Feux stop, prioritaires sur les feux de position.
    parts.tailMat.color.setHex(this.braking ? 0xff2a1e : this.lightsOn ? 0xff3b2f : 0x3a1512);
    // Roulis en virage. Un deux-roues se couche franchement, une voiture s'incline à peine.
    const lean = this.spec.bike ? 0.5 : 0.11;
    this.roll = THREE.MathUtils.lerp(this.roll, -this.steer * THREE.MathUtils.clamp(this.speed / 30, 0, 1) * lean, 1 - Math.exp(-8 * dt));
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
    this.lightsOn = on;
    this.mesh.userData.parts.headMat.color.setHex(on ? 0xfff2cc : 0x2a2a26);
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
    // Les géométries sont partagées par tous les exemplaires du même modèle :
    // les libérer ici ferait retomber tous les autres. Seuls les matériaux,
    // créés pour cette voiture, lui appartiennent vraiment.
    this.mesh.traverse((o) => {
      if (o.material) o.material.dispose();
    });
  }
}
