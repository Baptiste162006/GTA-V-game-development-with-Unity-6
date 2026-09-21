import * as THREE from 'three';
import { CITY, MAX_LINE } from './world.js';
import { Vehicle } from './vehicle.js';
import { buildCharacter } from './player.js';

const LANE = 3.4; // décalage à droite de l'axe de la route
const CIVILIAN_TYPES = ['citadine', 'berline', 'sportive', 'taxi', 'van'];
const MAX_CARS = 14;
const MAX_PEDS = 18;
const MAX_PARKED = 12;

const UP = new THREE.Vector3(0, 1, 0);

function rightOf(dir) {
  return new THREE.Vector3(dir.z, 0, -dir.x);
}

// Noeud de trame le plus proche, en indices entiers.
function nodeIndex(v) {
  return THREE.MathUtils.clamp(Math.round(v / CITY.CELL), -CITY.RINGS, CITY.RINGS);
}

function nodePos(i, j) {
  return new THREE.Vector3(i * CITY.CELL, 0, j * CITY.CELL);
}

export class Traffic {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.cars = [];
    this.peds = [];
    this.parked = [];
    this.onPedHit = null;
    this.onCarHit = null;
  }

  // --- circulation ---

  spawnCar(playerPos) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 90 + Math.random() * 70;
    const near = new THREE.Vector3(playerPos.x + Math.cos(angle) * dist, 0, playerPos.z + Math.sin(angle) * dist);
    const i = nodeIndex(near.x);
    const j = nodeIndex(near.z);

    const horizontal = Math.random() < 0.5;
    const sign = Math.random() < 0.5 ? 1 : -1;
    const dir = horizontal ? new THREE.Vector3(sign, 0, 0) : new THREE.Vector3(0, 0, sign);
    const from = nodePos(i, j).addScaledVector(rightOf(dir), LANE);
    if (Math.abs(from.x) > MAX_LINE + 2 || Math.abs(from.z) > MAX_LINE + 2) return;

    const type = CIVILIAN_TYPES[Math.floor(Math.random() * CIVILIAN_TYPES.length)];
    const vehicle = new Vehicle(this.scene, type, from, Math.atan2(dir.x, dir.z));
    const driver = buildCharacter({ shirt: Math.random() * 0xffffff });
    driver.scale.setScalar(0.92);
    driver.position.copy(vehicle.seatPosition());
    this.scene.add(driver);

    const car = {
      vehicle,
      driver,
      i,
      j,
      dir,
      desired: 9 + Math.random() * 5,
      target: null,
      waiting: 0,
    };
    this.pickNextNode(car);
    this.cars.push(car);
  }

  pickNextNode(car) {
    // Tout droit en priorité, sinon virage ; jamais de demi-tour.
    const r = Math.random();
    let dir = car.dir.clone();
    if (r > 0.62) {
      const turnLeft = r > 0.81;
      dir = turnLeft
        ? new THREE.Vector3(-car.dir.z, 0, car.dir.x)
        : new THREE.Vector3(car.dir.z, 0, -car.dir.x);
    }
    let ni = car.i + Math.round(dir.x);
    let nj = car.j + Math.round(dir.z);
    if (Math.abs(ni) > CITY.RINGS || Math.abs(nj) > CITY.RINGS) {
      // Bord de carte : on repart vers l'intérieur.
      dir.multiplyScalar(-1);
      ni = car.i + Math.round(dir.x);
      nj = car.j + Math.round(dir.z);
    }
    car.dir = dir;
    car.i = ni;
    car.j = nj;
    car.target = nodePos(ni, nj).addScaledVector(rightOf(dir), LANE);
  }

  // Distance au premier obstacle devant ce véhicule (Infinity si voie libre).
  obstacleAhead(vehicle, others, playerVehicle) {
    const fwd = vehicle.forward;
    let best = Infinity;
    const check = (other) => {
      if (other === vehicle) return;
      const to = other.pos.clone().sub(vehicle.pos);
      const along = to.dot(fwd);
      if (along < 0.5 || along > 18) return;
      const lateral = Math.abs(to.clone().addScaledVector(fwd, -along).length());
      if (lateral > 2.6) return;
      best = Math.min(best, along);
    };
    for (const o of others) check(o.vehicle);
    if (playerVehicle) check(playerVehicle);
    return best;
  }

  updateCars(dt, playerPos, playerVehicle) {
    for (let k = this.cars.length - 1; k >= 0; k--) {
      const car = this.cars[k];
      const v = car.vehicle;

      if (!car.driver) {
        // Voiture volée : elle reste sur place, plus de PNJ dedans.
        if (v.pos.distanceTo(playerPos) > 340 && v !== playerVehicle) {
          v.dispose();
          this.cars.splice(k, 1);
        }
        continue;
      }

      if (v.pos.distanceTo(playerPos) > 300) {
        v.dispose();
        this.scene.remove(car.driver);
        this.cars.splice(k, 1);
        continue;
      }

      const toTarget = car.target.clone().sub(v.pos);
      toTarget.y = 0;
      if (toTarget.length() < 7) this.pickNextNode(car);

      const desiredYaw = Math.atan2(toTarget.x, toTarget.z);
      let err = desiredYaw - v.yaw;
      while (err > Math.PI) err -= Math.PI * 2;
      while (err < -Math.PI) err += Math.PI * 2;
      const steer = THREE.MathUtils.clamp(err * 1.6, -1, 1);

      const gap = this.obstacleAhead(v, this.cars, playerVehicle);
      let throttle;
      if (gap < 7) {
        throttle = -1;
        car.waiting += dt;
      } else {
        const desired = gap < 14 ? car.desired * 0.45 : car.desired;
        throttle = THREE.MathUtils.clamp((desired - v.speed) / 3, -1, 1);
        car.waiting = 0;
      }
      // Bloqué trop longtemps (coin, embouteillage) : on le remet dans sa voie.
      if (car.waiting > 6) {
        car.waiting = 0;
        this.pickNextNode(car);
      }

      v.update(dt, { throttle, steer, handbrake: false }, this.world);
      v.setLights(this.world.night > 0.35);
      car.driver.position.copy(v.seatPosition());
      car.driver.rotation.y = v.yaw;

      // Renversement de piéton par un PNJ : on le fait tomber aussi.
      this.hitPedestrians(v, false);
    }

    while (this.cars.length < MAX_CARS) {
      const before = this.cars.length;
      this.spawnCar(playerPos);
      if (this.cars.length === before) break; // position refusée, on réessaiera
    }
  }

  // Le joueur prend le volant d'une voiture occupée : le conducteur est éjecté.
  ejectDriver(vehicle) {
    const car = this.cars.find((c) => c.vehicle === vehicle);
    if (!car || !car.driver) return false;
    this.scene.remove(car.driver);
    car.driver = null;
    const spot = vehicle.exitPosition();
    this.spawnPed(spot, true);
    return true;
  }

  // --- piétons ---

  spawnPed(at = null, panicked = false) {
    const pos = at ? at.clone() : this.randomSidewalkPoint();
    if (!pos) return;
    const mesh = buildCharacter({
      shirt: new THREE.Color().setHSL(Math.random(), 0.4, 0.45).getHex(),
      pants: new THREE.Color().setHSL(Math.random(), 0.2, 0.25).getHex(),
      skin: [0xd6a07a, 0x8d5a3b, 0xf0cba8, 0x5c3a24][Math.floor(Math.random() * 4)],
    });
    mesh.position.copy(pos);
    mesh.scale.setScalar(0.95 + Math.random() * 0.1);
    this.scene.add(mesh);
    this.peds.push({
      mesh,
      target: this.randomSidewalkPoint(),
      speed: 1.1 + Math.random() * 0.6,
      phase: Math.random() * 6,
      panic: panicked ? 5 : 0,
      down: 0,
      yaw: Math.random() * Math.PI * 2,
    });
  }

  randomSidewalkPoint() {
    const i = Math.floor(Math.random() * CITY.RINGS * 2) - CITY.RINGS;
    const j = Math.floor(Math.random() * CITY.RINGS * 2) - CITY.RINGS;
    const cx = i * CITY.CELL + CITY.CELL / 2;
    const cz = j * CITY.CELL + CITY.CELL / 2;
    const edge = Math.floor(Math.random() * 4);
    const off = CITY.BLOCK / 2 - 1.6;
    const along = (Math.random() - 0.5) * (CITY.BLOCK - 6);
    if (edge === 0) return new THREE.Vector3(cx + along, 0, cz - off);
    if (edge === 1) return new THREE.Vector3(cx + along, 0, cz + off);
    if (edge === 2) return new THREE.Vector3(cx - off, 0, cz + along);
    return new THREE.Vector3(cx + off, 0, cz + along);
  }

  hitPedestrians(vehicle, byPlayer) {
    if (Math.abs(vehicle.speed) < 3.5) return;
    for (const ped of this.peds) {
      if (ped.down > 0) continue;
      if (ped.mesh.position.distanceTo(vehicle.pos) > 2.9) continue;
      ped.down = 6;
      ped.mesh.rotation.z = Math.PI / 2 - 0.2;
      ped.mesh.position.y = 0.35;
      if (byPlayer && this.onPedHit) this.onPedHit(ped, vehicle);
      // Les autres piétons paniquent.
      for (const other of this.peds) {
        if (other.mesh.position.distanceTo(ped.mesh.position) < 22) other.panic = Math.max(other.panic, 4);
      }
    }
  }

  scarePedestrians(at, radius = 26) {
    for (const ped of this.peds) {
      if (ped.down > 0) continue;
      if (ped.mesh.position.distanceTo(at) < radius) ped.panic = Math.max(ped.panic, 4.5);
    }
  }

  updatePeds(dt, playerPos, threat) {
    for (let k = this.peds.length - 1; k >= 0; k--) {
      const ped = this.peds[k];

      if (ped.down > 0) {
        ped.down -= dt;
        if (ped.down <= 0) {
          this.scene.remove(ped.mesh);
          this.peds.splice(k, 1);
        }
        continue;
      }

      if (ped.mesh.position.distanceTo(playerPos) > 180) {
        this.scene.remove(ped.mesh);
        this.peds.splice(k, 1);
        continue;
      }

      let dir;
      if (ped.panic > 0) {
        ped.panic -= dt;
        const away = ped.mesh.position.clone().sub(threat || playerPos);
        away.y = 0;
        dir = away.lengthSq() > 0.01 ? away.normalize() : new THREE.Vector3(1, 0, 0);
      } else {
        if (!ped.target || ped.mesh.position.distanceTo(ped.target) < 2) {
          ped.target = this.randomSidewalkPoint();
        }
        dir = ped.target.clone().sub(ped.mesh.position);
        dir.y = 0;
        if (dir.lengthSq() < 0.01) continue;
        dir.normalize();
      }

      const speed = ped.panic > 0 ? ped.speed * 2.6 : ped.speed;
      ped.mesh.position.addScaledVector(dir, speed * dt);
      this.world.collideCircle(ped.mesh.position, 0.4);

      const targetYaw = Math.atan2(dir.x, dir.z);
      let err = targetYaw - ped.yaw;
      while (err > Math.PI) err -= Math.PI * 2;
      while (err < -Math.PI) err += Math.PI * 2;
      ped.yaw += THREE.MathUtils.clamp(err, -6 * dt, 6 * dt);
      ped.mesh.rotation.y = ped.yaw;

      // Même animation procédurale que le joueur.
      const rig = ped.mesh.userData.rig;
      ped.phase += dt * (4 + speed * 2.4);
      const swing = Math.sin(ped.phase) * (ped.panic > 0 ? 1 : 0.55);
      rig.legL.rotation.x = swing;
      rig.legR.rotation.x = -swing;
      rig.armL.rotation.x = -swing * 0.7;
      rig.armR.rotation.x = swing * 0.7;
    }

    while (this.peds.length < MAX_PEDS) {
      const before = this.peds.length;
      this.spawnPed();
      if (this.peds.length === before) break;
    }
  }

  // --- voitures garées (volables) ---

  updateParked(dt, playerPos) {
    for (let k = this.parked.length - 1; k >= 0; k--) {
      const v = this.parked[k];
      if (v.claimed) {
        this.parked.splice(k, 1); // passée sous contrôle du joueur
        continue;
      }
      if (v.pos.distanceTo(playerPos) > 260) {
        v.dispose();
        this.parked.splice(k, 1);
      }
    }

    let attempts = 0;
    while (this.parked.length < MAX_PARKED && attempts < 12) {
      attempts++;
      const spot = this.world.parkedSpots[Math.floor(Math.random() * this.world.parkedSpots.length)];
      const p = new THREE.Vector3(spot.x, 0, spot.z);
      const d = p.distanceTo(playerPos);
      if (d < 22 || d > 150) continue;
      if (this.parked.some((v) => v.pos.distanceTo(p) < 8)) continue;
      const type = CIVILIAN_TYPES[Math.floor(Math.random() * CIVILIAN_TYPES.length)];
      const v = new Vehicle(this.scene, type, p, spot.rot);
      this.parked.push(v);
    }
  }

  update(dt, playerPos, playerVehicle, threat) {
    this.updateCars(dt, playerPos, playerVehicle);
    this.updatePeds(dt, playerPos, threat);
    this.updateParked(dt, playerPos);
  }

  // Véhicule volable le plus proche (garé ou en circulation).
  nearestVehicle(pos, maxDist = 4) {
    let best = null;
    let bestD = maxDist;
    for (const v of this.parked) {
      const d = v.pos.distanceTo(pos);
      if (d < bestD) {
        best = v;
        bestD = d;
      }
    }
    for (const car of this.cars) {
      const d = car.vehicle.pos.distanceTo(pos);
      if (d < bestD) {
        best = car.vehicle;
        bestD = d;
      }
    }
    return best;
  }

  isOccupied(vehicle) {
    const car = this.cars.find((c) => c.vehicle === vehicle);
    return !!(car && car.driver);
  }

  allVehicles() {
    return [...this.parked, ...this.cars.map((c) => c.vehicle)];
  }
}
