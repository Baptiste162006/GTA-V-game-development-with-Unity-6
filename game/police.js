import * as THREE from 'three';
import { Vehicle } from './vehicle.js';
import { buildCharacter } from './player.js';
import { CITY } from './world.js';

const MAX_UNITS = 6;
const ESCAPE_DELAY = 11; // secondes hors de vue avant de perdre une étoile
const SIGHT = 95;

// Nombre de voitures envoyées par niveau de recherche.
const UNITS_BY_STAR = [0, 1, 2, 3, 5, 6];

export class Police {
  constructor(scene, world, traffic) {
    this.scene = scene;
    this.world = world;
    this.traffic = traffic;
    this.wanted = 0;
    this.units = [];
    this.officers = [];
    this.searchCenter = new THREE.Vector3();
    this.searchRadius = 0;
    this.outOfSight = 0;
    this.arrestTimer = 0;
    this.nearestDistance = Infinity;
    this.sightMul = 1; // réduit par la pluie et surtout le brouillard

    this.onBusted = null;
    this.onStarChange = null;
    this.onShot = null;
  }

  get searching() {
    return this.wanted > 0;
  }

  addCrime(stars, at) {
    const before = this.wanted;
    this.wanted = Math.min(5, this.wanted + stars);
    this.searchCenter.copy(at);
    this.searchRadius = 70 + this.wanted * 26;
    this.outOfSight = 0;
    if (this.wanted !== before && this.onStarChange) this.onStarChange(this.wanted, before);
  }

  clear() {
    const before = this.wanted;
    this.wanted = 0;
    this.searchRadius = 0;
    this.outOfSight = 0;
    this.arrestTimer = 0;
    for (const u of this.units) {
      u.vehicle.dispose();
      if (u.driver) this.scene.remove(u.driver);
    }
    this.units = [];
    for (const o of this.officers) this.scene.remove(o.mesh);
    this.officers = [];
    if (before && this.onStarChange) this.onStarChange(0, before);
  }

  spawnUnit(playerPos) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 85 + Math.random() * 55;
    const raw = new THREE.Vector3(playerPos.x + Math.cos(angle) * dist, 0, playerPos.z + Math.sin(angle) * dist);
    // On pose la voiture sur la route la plus proche.
    const onX = Math.abs(raw.x - Math.round(raw.x / CITY.CELL) * CITY.CELL);
    const onZ = Math.abs(raw.z - Math.round(raw.z / CITY.CELL) * CITY.CELL);
    if (onX < onZ) raw.x = Math.round(raw.x / CITY.CELL) * CITY.CELL + 3.4;
    else raw.z = Math.round(raw.z / CITY.CELL) * CITY.CELL + 3.4;
    raw.x = THREE.MathUtils.clamp(raw.x, -CITY.EXTENT, CITY.EXTENT);
    raw.z = THREE.MathUtils.clamp(raw.z, -CITY.EXTENT, CITY.EXTENT);

    const yaw = Math.atan2(playerPos.x - raw.x, playerPos.z - raw.z);
    const vehicle = new Vehicle(this.scene, 'police', raw, yaw);
    vehicle.sirenOn = true;
    const driver = buildCharacter({ shirt: 0x1f3a63, pants: 0x1a1d24 });
    driver.scale.setScalar(0.8);
    this.scene.add(driver);
    this.units.push({ vehicle, driver, stuck: 0, shootCooldown: 1 + Math.random() });
  }

  // Évitement grossier : on sonde devant, à gauche et à droite.
  avoidance(vehicle) {
    const probe = (angle) => {
      const dir = vehicle.forward.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      const p = vehicle.pos.clone().addScaledVector(dir, 11);
      for (const b of this.world.nearbyBoxes(p.x, p.z)) {
        if (p.x > b.minX - 2 && p.x < b.maxX + 2 && p.z > b.minZ - 2 && p.z < b.maxZ + 2) return 1;
      }
      return 0;
    };
    if (!probe(0)) return 0;
    // Un angle positif regarde vers la gauche de l'écran ; on renvoie le sens
    // de braquage à prendre (positif = droite).
    const leftBlocked = probe(0.7);
    const rightBlocked = probe(-0.7);
    if (leftBlocked && !rightBlocked) return 1;
    if (rightBlocked && !leftBlocked) return -1;
    return Math.random() < 0.5 ? 1 : -1;
  }

  updateUnits(dt, target, player) {
    for (let k = this.units.length - 1; k >= 0; k--) {
      const unit = this.units[k];
      const v = unit.vehicle;
      const dist = v.pos.distanceTo(target);

      if (!this.searching || dist > 320) {
        v.dispose();
        this.scene.remove(unit.driver);
        this.units.splice(k, 1);
        continue;
      }

      const to = target.clone().sub(v.pos);
      to.y = 0;
      const desiredYaw = Math.atan2(to.x, to.z);
      let err = desiredYaw - v.yaw;
      while (err > Math.PI) err -= Math.PI * 2;
      while (err < -Math.PI) err += Math.PI * 2;

      const dodge = this.avoidance(v);
      const steer = THREE.MathUtils.clamp(-err * 1.5 + dodge * 0.85, -1, 1);

      // On lève le pied en approche pour ne pas tourner en rond autour du joueur.
      let throttle = 1;
      if (dist < 12) throttle = 0.25;
      if (dist < 6) throttle = -0.4;
      if (Math.abs(err) > 1.9 && v.speed > 8) throttle = -0.6;

      if (Math.abs(v.speed) < 1 && dist > 14) {
        unit.stuck += dt;
        if (unit.stuck > 2.5) {
          throttle = -1; // on se dégage en marche arrière
          if (unit.stuck > 4.5) unit.stuck = 0;
        }
      } else {
        unit.stuck = 0;
      }

      v.update(dt, { throttle, steer, handbrake: false }, this.world);
      v.setLights(this.world.night > 0.3);
      unit.driver.position.copy(v.seatPosition());
      unit.driver.rotation.y = v.yaw;
      this.traffic.hitPedestrians(v, false);

      // Contact avec le joueur en voiture : ça cogne.
      if (player.inVehicle) {
        const pv = player.inVehicle;
        if (pv.pos.distanceTo(v.pos) < 4.4 && Math.abs(v.speed) > 6) {
          player.damage(Math.abs(v.speed) * 0.12 * dt * 60 * 0.06);
          pv.damage = Math.min(100, pv.damage + Math.abs(v.speed) * 0.08);
        }
      } else if (dist < 26) {
        // Joueur à pied : on débarque un agent.
        if (this.officers.length < 4 && Math.abs(v.speed) < 3) {
          this.deployOfficer(v);
        }
      }

      // À partir de 3 étoiles, les agents ouvrent le feu depuis le véhicule.
      if (this.wanted >= 3 && dist < 45) {
        unit.shootCooldown -= dt;
        if (unit.shootCooldown <= 0) {
          unit.shootCooldown = 0.9 + Math.random() * 0.8;
          player.damage(2.5 + this.wanted);
          if (this.onShot) this.onShot(v.pos);
        }
      }
    }

    const wantedUnits = Math.min(MAX_UNITS, UNITS_BY_STAR[this.wanted]);
    if (this.searching && this.units.length < wantedUnits) this.spawnUnit(target);
  }

  deployOfficer(fromVehicle) {
    const mesh = buildCharacter({ shirt: 0x1f3a63, pants: 0x1a1d24, hair: 0x14181f });
    mesh.position.copy(fromVehicle.exitPosition());
    this.scene.add(mesh);
    this.officers.push({ mesh, phase: 0, yaw: fromVehicle.yaw, shootCooldown: 1.5 });
  }

  updateOfficers(dt, player) {
    const playerPos = player.inVehicle ? player.inVehicle.pos : player.pos;
    let arresting = false;

    for (let k = this.officers.length - 1; k >= 0; k--) {
      const off = this.officers[k];
      const dist = off.mesh.position.distanceTo(playerPos);

      if (!this.searching || dist > 160) {
        this.scene.remove(off.mesh);
        this.officers.splice(k, 1);
        continue;
      }

      const to = playerPos.clone().sub(off.mesh.position);
      to.y = 0;
      const dir = to.lengthSq() > 0.01 ? to.normalize() : new THREE.Vector3(0, 0, 1);
      const speed = dist > 2.2 ? 5.6 : 0;
      off.mesh.position.addScaledVector(dir, speed * dt);
      this.world.collideCircle(off.mesh.position, 0.45);

      off.yaw = Math.atan2(dir.x, dir.z);
      off.mesh.rotation.y = off.yaw;
      const rig = off.mesh.userData.rig;
      off.phase += dt * (4 + speed * 1.6);
      const swing = Math.sin(off.phase) * (speed > 0 ? 0.9 : 0.05);
      rig.legL.rotation.x = swing;
      rig.legR.rotation.x = -swing;
      rig.kneeL.rotation.x = Math.max(0, -swing) * 1.1;
      rig.kneeR.rotation.x = Math.max(0, swing) * 1.1;
      rig.armL.rotation.x = -swing * 0.5;
      rig.armR.rotation.x = swing * 0.5;

      if (!player.inVehicle && dist < 2.4) arresting = true;

      if (this.wanted >= 3 && dist < 30) {
        off.shootCooldown -= dt;
        if (off.shootCooldown <= 0) {
          off.shootCooldown = 1.1 + Math.random();
          player.damage(3 + this.wanted * 0.8);
          if (this.onShot) this.onShot(off.mesh.position);
        }
      }
    }

    // Immobile au contact d'un agent : arrestation.
    if (arresting && !player.inVehicle) {
      this.arrestTimer += dt;
      if (this.arrestTimer > 1.2 && this.onBusted) {
        this.arrestTimer = 0;
        this.onBusted();
      }
    } else {
      this.arrestTimer = Math.max(0, this.arrestTimer - dt);
    }
  }

  update(dt, player) {
    const playerPos = player.inVehicle ? player.inVehicle.pos : player.pos;

    if (this.searching) {
      this.nearestDistance = Math.min(
        ...this.units.map((u) => u.vehicle.pos.distanceTo(playerPos)),
        ...this.officers.map((o) => o.mesh.position.distanceTo(playerPos)),
        Infinity
      );

      const seen = this.nearestDistance < SIGHT * this.sightMul;
      const insideZone = playerPos.distanceTo(this.searchCenter) < this.searchRadius;
      if (seen) {
        this.searchCenter.copy(playerPos);
        this.outOfSight = 0;
      } else if (insideZone) {
        this.outOfSight += dt * 0.45; // repéré dans la zone : ça descend lentement
      } else {
        this.outOfSight += dt;
      }

      if (this.outOfSight >= ESCAPE_DELAY) {
        const before = this.wanted;
        this.wanted--;
        this.outOfSight = 0;
        this.searchRadius = Math.max(0, this.searchRadius - 26);
        if (this.onStarChange) this.onStarChange(this.wanted, before);
        if (this.wanted <= 0) this.clear();
      }
    } else {
      this.nearestDistance = Infinity;
    }

    const target = this.searching && this.outOfSight > 1 ? this.searchCenter : playerPos;
    this.updateUnits(dt, target, player);
    this.updateOfficers(dt, player);
  }

  // 0..1 pour le volume de sirène.
  get sirenProximity() {
    if (!this.searching || !this.units.length) return 0;
    return THREE.MathUtils.clamp(1 - this.nearestDistance / 120, 0, 1);
  }
}
