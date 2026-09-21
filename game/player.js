import * as THREE from 'three';

const WALK = 2.3;
const RUN = 6.6;
const SNEAK = 1.1;
const GRAVITY = -16;
const JUMP = 5.4;

// Bonhomme low-poly assemblé en boîtes : pas de modèle à télécharger, animation procédurale.
export function buildCharacter({ shirt = 0x2f4f6f, pants = 0x232730, skin = 0xd6a07a, hair = 0x2a211c } = {}) {
  const g = new THREE.Group();
  const matShirt = new THREE.MeshLambertMaterial({ color: shirt });
  const matPants = new THREE.MeshLambertMaterial({ color: pants });
  const matSkin = new THREE.MeshLambertMaterial({ color: skin });
  const matHair = new THREE.MeshLambertMaterial({ color: hair });

  const add = (parent, geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
  };

  const torso = add(g, new THREE.BoxGeometry(0.62, 0.74, 0.34), matShirt, 0, 1.24, 0);
  add(g, new THREE.BoxGeometry(0.52, 0.22, 0.32), matPants, 0, 0.86, 0);
  const head = add(g, new THREE.BoxGeometry(0.34, 0.36, 0.32), matSkin, 0, 1.78, 0);
  add(head, new THREE.BoxGeometry(0.37, 0.12, 0.35), matHair, 0, 0.16, 0);
  add(head, new THREE.BoxGeometry(0.36, 0.1, 0.06), matHair, 0, 0.02, -0.16);

  // Pivots aux épaules / hanches pour que la rotation ait l'air d'une articulation.
  const armL = new THREE.Group();
  armL.position.set(-0.4, 1.5, 0);
  add(armL, new THREE.BoxGeometry(0.16, 0.66, 0.2), matShirt, 0, -0.33, 0);
  add(armL, new THREE.BoxGeometry(0.17, 0.14, 0.21), matSkin, 0, -0.71, 0);
  const armR = armL.clone();
  armR.position.x = 0.4;
  const legL = new THREE.Group();
  legL.position.set(-0.17, 0.78, 0);
  add(legL, new THREE.BoxGeometry(0.23, 0.78, 0.26), matPants, 0, -0.39, 0);
  add(legL, new THREE.BoxGeometry(0.25, 0.14, 0.34), matHair, 0, -0.81, 0.04);
  const legR = legL.clone();
  legR.position.x = 0.17;

  g.add(armL, armR, legL, legR);
  g.userData.rig = { torso, head, armL, armR, legL, legR };
  return g;
}

export class Player {
  constructor(scene, world, spawn = new THREE.Vector3(0, 0, 0)) {
    this.world = world;
    this.mesh = buildCharacter();
    this.mesh.position.copy(spawn);
    scene.add(this.mesh);

    this.pos = this.mesh.position;
    this.yaw = 0;
    this.vy = 0;
    this.onGround = true;
    this.speed = 0;
    this.phase = 0;
    this.radius = 0.45;

    this.health = 100;
    this.armor = 0;
    this.money = 250;
    this.inVehicle = null;
    this.alive = true;
  }

  get headPos() {
    return new THREE.Vector3(this.pos.x, this.pos.y + 1.7, this.pos.z);
  }

  damage(amount) {
    if (!this.alive) return;
    const toArmor = Math.min(this.armor, amount * 0.6);
    this.armor -= toArmor;
    this.health -= amount - toArmor;
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
    }
  }

  heal(amount) {
    this.health = Math.min(100, this.health + amount);
  }

  update(dt, input, camYaw) {
    if (this.inVehicle || !this.alive) {
      this.speed = 0;
      return;
    }

    const ax = input.axisX;
    const ay = input.axisY;
    const moving = ax !== 0 || ay !== 0;
    const maxSpeed = input.slow ? SNEAK : input.run ? RUN : WALK;

    if (moving) {
      // Direction relative à la caméra.
      const dir = new THREE.Vector3(ax, 0, -ay).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), camYaw);
      const targetYaw = Math.atan2(dir.x, dir.z);
      let delta = targetYaw - this.yaw;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      this.yaw += THREE.MathUtils.clamp(delta, -12 * dt, 12 * dt);
      this.speed = THREE.MathUtils.lerp(this.speed, maxSpeed, 1 - Math.exp(-10 * dt));
      this.pos.addScaledVector(dir, this.speed * dt);
    } else {
      this.speed = THREE.MathUtils.lerp(this.speed, 0, 1 - Math.exp(-14 * dt));
    }

    if (input.justPressed('Space') && this.onGround) {
      this.vy = JUMP;
      this.onGround = false;
    }
    this.vy += GRAVITY * dt;
    this.pos.y += this.vy * dt;
    if (this.pos.y <= 0) {
      this.pos.y = 0;
      this.vy = 0;
      this.onGround = true;
    }

    this.world.collideCircle(this.pos, this.radius);
    const limit = 700;
    this.pos.x = THREE.MathUtils.clamp(this.pos.x, -limit, limit);
    this.pos.z = THREE.MathUtils.clamp(this.pos.z, -limit, limit);

    this.mesh.rotation.y = this.yaw;
    this.animate(dt);
  }

  animate(dt) {
    const rig = this.mesh.userData.rig;
    const norm = this.speed / RUN;
    this.phase += dt * (4 + norm * 9);
    const amp = THREE.MathUtils.clamp(this.speed / 2.2, 0, 1.25);
    const swing = Math.sin(this.phase) * 0.85 * amp;

    rig.legL.rotation.x = swing;
    rig.legR.rotation.x = -swing;
    rig.armL.rotation.x = -swing * 0.8;
    rig.armR.rotation.x = swing * 0.8;
    rig.torso.rotation.z = Math.sin(this.phase) * 0.04 * amp;
    rig.torso.position.y = 1.24 + Math.abs(Math.sin(this.phase)) * 0.045 * amp;
    rig.head.rotation.y = Math.sin(this.phase * 0.5) * 0.06 * amp;

    if (!this.onGround) {
      rig.legL.rotation.x = 0.4;
      rig.legR.rotation.x = -0.25;
      rig.armL.rotation.x = -1.6;
      rig.armR.rotation.x = -1.6;
    }
  }

  setVisible(v) {
    this.mesh.visible = v;
  }
}

export class ThirdPersonCamera {
  constructor(camera, world) {
    this.camera = camera;
    this.world = world;
    this.yaw = 0;
    this.pitch = 0.14;
    this.distance = 6.5;
    this.targetDistance = 6.5;
    this.current = new THREE.Vector3(0, 3, 10);
    this.lookAt = new THREE.Vector3();
    this.sensitivity = 0.0025;
  }

  handleMouse(mouse) {
    this.yaw -= mouse.dx * this.sensitivity;
    this.pitch = THREE.MathUtils.clamp(this.pitch + mouse.dy * this.sensitivity, -0.35, 1.15);
    if (mouse.wheel) {
      this.targetDistance = THREE.MathUtils.clamp(this.targetDistance + mouse.wheel * 0.8, 3, 14);
    }
  }

  // Rapproche la caméra si un immeuble s'intercale entre elle et la cible.
  clearObstruction(target, desired) {
    const dir = desired.clone().sub(target);
    const len = dir.length();
    dir.divideScalar(len);
    for (let s = 0.35; s <= 1; s += 0.15) {
      const p = target.clone().addScaledVector(dir, len * s);
      for (const b of this.world.nearbyBoxes(p.x, p.z)) {
        if (p.x > b.minX - 0.4 && p.x < b.maxX + 0.4 && p.z > b.minZ - 0.4 && p.z < b.maxZ + 0.4 && p.y < b.h) {
          return Math.max(1.6, len * (s - 0.15));
        }
      }
    }
    return len;
  }

  update(dt, targetPos, targetHeight = 1.6, extraDistance = 0) {
    this.distance = THREE.MathUtils.lerp(this.distance, this.targetDistance + extraDistance, 1 - Math.exp(-6 * dt));
    const target = new THREE.Vector3(targetPos.x, targetPos.y + targetHeight, targetPos.z);
    const offset = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch) + 0.14,
      Math.cos(this.yaw) * Math.cos(this.pitch)
    ).multiplyScalar(this.distance);

    let desired = target.clone().add(offset);
    const allowed = this.clearObstruction(target, desired);
    desired = target.clone().addScaledVector(offset.clone().normalize(), allowed);
    desired.y = Math.max(desired.y, 0.8);

    this.current.lerp(desired, 1 - Math.exp(-11 * dt));
    this.camera.position.copy(this.current);
    this.lookAt.lerp(target, 1 - Math.exp(-14 * dt));
    this.camera.lookAt(this.lookAt);
  }
}
