import * as THREE from 'three';
import { buildCharacter } from './player.js';
import { CITY, districtAt } from './world.js';

const GANG_DISTRICTS = ['industrial', 'oldtown'];
const MAX_GANG = 8;
const SIGHT = 42;

const OUTFITS = [
  { shirt: 0x7a2f2f, pants: 0x1c1f26, hair: 0x14100d },
  { shirt: 0x2f5a3a, pants: 0x23262d, hair: 0x2a211c },
  { shirt: 0x4a3a6b, pants: 0x191c22, hair: 0x120f0c },
];

export class Enemies {
  constructor(scene, world, traffic) {
    this.scene = scene;
    this.world = world;
    this.traffic = traffic;
    this.list = [];
    this.onKill = null;
    this.onShoot = null;
    this.hostileEverywhere = false; // basculé par certaines missions
  }

  inGangZone(pos) {
    const i = Math.floor(pos.x / CITY.CELL);
    const j = Math.floor(pos.z / CITY.CELL);
    return GANG_DISTRICTS.includes(districtAt(i, j));
  }

  spawn(at, hostile = false) {
    const outfit = OUTFITS[Math.floor(Math.random() * OUTFITS.length)];
    const mesh = buildCharacter(outfit);
    mesh.position.copy(at);
    this.scene.add(mesh);
    const enemy = {
      mesh,
      position: mesh.position,
      radius: 0.5,
      kind: 'enemy',
      health: 100,
      state: hostile ? 'chase' : 'idle',
      phase: Math.random() * 6,
      yaw: Math.random() * Math.PI * 2,
      cooldown: 1 + Math.random(),
      wander: null,
      dead: 0,
    };
    enemy.applyDamage = (amount) => this.hurt(enemy, amount);
    this.list.push(enemy);
    return enemy;
  }

  // Groupe posté autour d'un point : utilisé par les missions.
  spawnSquad(center, count = 3, hostile = true) {
    const squad = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const p = new THREE.Vector3(center.x + Math.cos(a) * 4, 0, center.z + Math.sin(a) * 4);
      this.world.collideCircle(p, 0.5);
      squad.push(this.spawn(p, hostile));
    }
    return squad;
  }

  hurt(enemy, amount) {
    if (enemy.dead > 0) return;
    enemy.health -= amount;
    enemy.state = 'chase';
    // Ses copains proches réagissent aussi.
    for (const other of this.list) {
      if (other !== enemy && other.dead <= 0 && other.position.distanceTo(enemy.position) < 28) {
        other.state = 'chase';
      }
    }
    if (enemy.health <= 0) this.kill(enemy);
  }

  kill(enemy) {
    enemy.dead = 7;
    enemy.mesh.rotation.z = Math.PI / 2 - 0.15;
    enemy.mesh.position.y = 0.35;
    if (this.onKill) this.onKill(enemy);
  }

  alive() {
    return this.list.filter((e) => e.dead <= 0);
  }

  update(dt, player, playerPos) {
    for (let k = this.list.length - 1; k >= 0; k--) {
      const e = this.list[k];

      if (e.dead > 0) {
        e.dead -= dt;
        if (e.dead <= 0) {
          this.scene.remove(e.mesh);
          this.list.splice(k, 1);
        }
        continue;
      }

      const dist = e.position.distanceTo(playerPos);
      if (dist > 220) {
        this.scene.remove(e.mesh);
        this.list.splice(k, 1);
        continue;
      }

      if (e.state === 'idle' && dist < SIGHT && (this.hostileEverywhere || this.inGangZone(e.position))) {
        e.state = 'chase';
      }

      let moveDir = null;
      let speed = 0;

      if (e.state === 'chase') {
        const to = playerPos.clone().sub(e.position);
        to.y = 0;
        // On garde ses distances : on approche jusqu'à 14 m, puis on tire.
        if (to.length() > 14) {
          moveDir = to.clone().normalize();
          speed = 4.6;
        } else if (to.length() < 7) {
          moveDir = to.clone().normalize().multiplyScalar(-1);
          speed = 2.4;
        }
        e.yaw = Math.atan2(to.x, to.z);

        if (dist < 40) {
          e.cooldown -= dt;
          if (e.cooldown <= 0) {
            e.cooldown = 1.7 + Math.random() * 1.3;
            if (!this.blocked(e.position, playerPos)) {
              // Ils ratent souvent de loin : trois tireurs ne doivent pas
              // vider la barre de vie en dix secondes.
              const accuracy = THREE.MathUtils.clamp(1 - (dist - 12) / 34, 0.3, 0.9);
              if (Math.random() < accuracy) player.damage(3 + Math.random() * 4);
              if (this.onShoot) this.onShoot(e.position);
            }
          }
        }
      } else {
        if (!e.wander || e.position.distanceTo(e.wander) < 2) {
          e.wander = new THREE.Vector3(
            e.position.x + (Math.random() - 0.5) * 24,
            0,
            e.position.z + (Math.random() - 0.5) * 24
          );
        }
        moveDir = e.wander.clone().sub(e.position);
        moveDir.y = 0;
        if (moveDir.lengthSq() > 0.01) {
          moveDir.normalize();
          speed = 1.2;
          e.yaw = Math.atan2(moveDir.x, moveDir.z);
        }
      }

      if (moveDir && speed > 0) {
        e.position.addScaledVector(moveDir, speed * dt);
        this.world.collideCircle(e.position, 0.45);
      }
      e.mesh.rotation.y = e.yaw;

      const rig = e.mesh.userData.rig;
      e.phase += dt * (4 + speed * 1.8);
      const swing = Math.sin(e.phase) * (speed > 0 ? 0.85 : 0.06);
      rig.legL.rotation.x = swing;
      rig.legR.rotation.x = -swing;
      rig.kneeL.rotation.x = Math.max(0, -swing) * 1.1;
      rig.kneeR.rotation.x = Math.max(0, swing) * 1.1;
      // Bras tendu quand il tire, sinon balancier.
      const aiming = e.state === 'chase' && dist < 40;
      rig.armR.rotation.x = aiming ? -1.5 : swing * 0.7;
      rig.armL.rotation.x = aiming ? -1.2 : -swing * 0.7;
    }

    // Peuplement des quartiers chauds.
    if (this.alive().length < MAX_GANG && this.inGangZone(playerPos)) {
      const a = Math.random() * Math.PI * 2;
      const d = 55 + Math.random() * 45;
      const p = new THREE.Vector3(playerPos.x + Math.cos(a) * d, 0, playerPos.z + Math.sin(a) * d);
      if (this.inGangZone(p)) {
        this.world.collideCircle(p, 0.5);
        this.spawn(p);
      }
    }
  }

  // Mur entre les deux points ?
  blocked(from, to) {
    const dir = to.clone().sub(from);
    const len = dir.length();
    dir.normalize();
    for (let d = 2; d < len; d += 2.5) {
      const p = from.clone().addScaledVector(dir, d);
      for (const b of this.world.nearbyBoxes(p.x, p.z)) {
        if (p.x > b.minX && p.x < b.maxX && p.z > b.minZ && p.z < b.maxZ) return true;
      }
    }
    return false;
  }
}
