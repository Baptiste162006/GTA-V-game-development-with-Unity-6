import * as THREE from 'three';

const WALK = 2.3;
const RUN = 6.6;
const SNEAK = 1.1;
const GRAVITY = -16;
const JUMP = 5.4;

// Silhouette humaine en volumes galbés (capsules, cylindres coniques, sphères) :
// aucun modèle à télécharger, et ça ne ressemble pas à un empilement de cubes.
// Hauteur totale ≈ 1,85 m. Les hanches, genoux et épaules sont de vrais pivots.
// Les formes sont identiques d'un personnage à l'autre : on les construit une
// seule fois et tout le monde les partage. Seules les couleurs changent, donc
// seuls les matériaux restent propres à chaque personnage.
let SHAPES = null;
function characterShapes() {
  if (SHAPES) return SHAPES;
  SHAPES = {
    torso: new THREE.CylinderGeometry(0.205, 0.15, 0.54, 12),
    hips: new THREE.CylinderGeometry(0.16, 0.185, 0.2, 12),
    head: new THREE.SphereGeometry(0.13, 14, 12),
    cap: new THREE.SphereGeometry(0.134, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58),
    arm: new THREE.CapsuleGeometry(0.062, 0.34, 4, 8),
    hand: new THREE.SphereGeometry(0.068, 10, 8),
    thigh: new THREE.CapsuleGeometry(0.093, 0.24, 4, 8),
    shin: new THREE.CapsuleGeometry(0.078, 0.25, 4, 8),
    shoe: new THREE.BoxGeometry(0.135, 0.085, 0.28),
  };
  return SHAPES;
}

export function buildCharacter({ shirt = 0x2f4f6f, pants = 0x232730, skin = 0xd6a07a, hair = 0x2a211c } = {}) {
  const g = new THREE.Group();
  const S = characterShapes();
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

  // Buste : cône tronqué large aux épaules, resserré à la taille, aplati de profil.
  const torso = add(g, S.torso, matShirt, 0, 1.32, 0);
  torso.scale.z = 0.62;
  add(g, S.hips, matPants, 0, 0.99, 0).scale.z = 0.72;

  const head = add(g, S.head, matSkin, 0, 1.73, 0);
  head.scale.set(1, 1.2, 1.06);
  // Calotte de cheveux : demi-sphère posée sur le crâne.
  const cap = add(head, S.cap, matHair, 0, 0.012, -0.008);
  cap.scale.set(1, 1.05, 1.02);

  // Bras : capsule + main. Pivot à l'épaule.
  const armL = new THREE.Group();
  armL.position.set(-0.213, 1.53, 0);
  add(armL, S.arm, matShirt, 0, -0.232, 0);
  add(armL, S.hand, matSkin, 0, -0.5, 0);
  const armR = armL.clone();
  armR.position.x = 0.213;

  // Jambes : cuisse, puis genou articulé portant le mollet et la chaussure.
  const legL = new THREE.Group();
  legL.position.set(-0.105, 0.9, 0);
  add(legL, S.thigh, matPants, 0, -0.21, 0);
  const kneeL = new THREE.Group();
  kneeL.position.y = -0.42;
  add(kneeL, S.shin, matPants, 0, -0.2, 0);
  add(kneeL, S.shoe, matHair, 0, -0.395, 0.045);
  legL.add(kneeL);
  const legR = legL.clone();
  legR.position.x = 0.105;

  g.add(armL, armR, legL, legR);
  // Propres à ce personnage (seules les formes sont partagées) : on peut donc
  // les rendre translucides sans toucher aux autres.
  g.userData.materials = [matShirt, matPants, matSkin, matHair];
  g.userData.rig = {
    torso,
    head,
    armL,
    armR,
    legL,
    legR,
    kneeL: legL.children[1],
    kneeR: legR.children[1],
  };
  return g;
}

// Estompe un personnage quand la caméra lui rentre dedans. Sans ça, dos au
// mur, le corps occupe le centre de l'écran et on ne voit plus où on vise.
export function fadeCharacter(mesh, alpha) {
  const mats = mesh.userData.materials;
  if (!mats) return;
  const a = Math.max(0, Math.min(1, alpha));
  if (mesh.userData.fade === a) return;
  mesh.userData.fade = a;
  mesh.visible = a > 0.02;
  for (const m of mats) {
    m.transparent = a < 0.999;
    m.opacity = a;
    m.depthWrite = a > 0.6;
  }
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
    this.idlePhase = 0; // tourne toujours, même immobile : c'est la respiration
    this.radius = 0.45;

    this.health = 100;
    this.armor = 0;
    this.money = 250;
    this.inVehicle = null;
    this.alive = true;
    this.invulnerable = 0;
    this.hitFlash = 0; // repris par animate() : flash + écart du buste au tir
    this.hitSide = 1;
  }

  get headPos() {
    return new THREE.Vector3(this.pos.x, this.pos.y + 1.7, this.pos.z);
  }

  // `from` : position du tireur, pour l'indicateur de direction du HUD.
  damage(amount, from, cause) {
    if (!this.alive || this.invulnerable > 0) return;
    const toArmor = Math.min(this.armor, amount * 0.6);
    this.armor -= toArmor;
    this.health -= amount - toArmor;
    // Le joueur encaisse comme les ennemis : un flash et un écart directionnel
    // du buste, repris dans animate(). Rien n'existait ici avant — seul le
    // HUD (arc rouge, vignette) réagissait, jamais le personnage lui-même.
    this.hitFlash = 1;
    if (from) {
      const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
      const to = from.clone().sub(this.pos);
      this.hitSide = Math.sign(right.dot(to)) || 1;
    }
    if (this.onDamage) this.onDamage(amount, from, cause);
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

    if (input.justPressedAction('jump') && this.onGround) {
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

    // Respiration et léger transfert de poids, actifs à l'arrêt : sans eux le
    // personnage restait un mannequin figé dès qu'il ne marchait plus.
    // `idleAmt` s'éteint dès que `amp` grandit, pour ne jamais lutter avec la
    // démarche — les deux ne s'additionnent jamais à pleine intensité.
    this.idlePhase += dt;
    const idleAmt = 1 - THREE.MathUtils.clamp(amp * 4, 0, 1);
    const breathe = Math.sin(this.idlePhase * 1.1);
    const sway = Math.sin(this.idlePhase * 0.4);

    rig.legL.rotation.x = swing;
    rig.legR.rotation.x = -swing;
    // Le genou ne plie que quand la jambe part en arrière : ça suffit à effacer
    // la démarche « pantin raide ».
    rig.kneeL.rotation.x = Math.max(0, -swing) * 1.15;
    rig.kneeR.rotation.x = Math.max(0, swing) * 1.15;
    rig.armL.rotation.x = -swing * 0.8 + breathe * 0.035 * idleAmt;
    rig.armR.rotation.x = swing * 0.8 - breathe * 0.035 * idleAmt;
    rig.torso.rotation.z = Math.sin(this.phase) * 0.04 * amp + sway * 0.02 * idleAmt;
    rig.torso.position.y = 1.32 + Math.abs(Math.sin(this.phase)) * 0.045 * amp + breathe * 0.012 * idleAmt;
    rig.head.rotation.y = Math.sin(this.phase * 0.5) * 0.06 * amp + sway * 0.05 * idleAmt;

    // Réaction aux dégâts : flash blanc sur les mêmes quatre matériaux que
    // colore le personnage, et écart du buste à l'opposé du tir. Toujours
    // recalculé, jamais gardé sous condition, sinon l'émissif reste bloqué
    // sur un résidu au lieu de revenir pile à zéro.
    this.hitFlash = Math.max(0, this.hitFlash - dt * 6);
    const flashOn = this.hitFlash * 0.6;
    for (const m of this.mesh.userData.materials) m.emissive.setScalar(flashOn);
    if (this.hitFlash > 0) {
      rig.torso.rotation.z += this.hitSide * this.hitFlash * 0.12;
      rig.head.rotation.z = -this.hitSide * this.hitFlash * 0.08;
    } else {
      rig.head.rotation.z = 0;
    }

    if (!this.onGround) {
      rig.legL.rotation.x = 0.45;
      rig.legR.rotation.x = -0.2;
      rig.kneeL.rotation.x = 0.9;
      rig.kneeR.rotation.x = 0.3;
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
    const dy = this.invertY ? -mouse.dy : mouse.dy;
    this.pitch = THREE.MathUtils.clamp(this.pitch + dy * this.sensitivity, -0.35, 1.15);
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

  // shoulder : décalage latéral en mètres. En visée on dégage la caméra sur le
  // côté, sinon le personnage masque exactement ce qu'on vise.
  update(dt, targetPos, targetHeight = 1.6, extraDistance = 0, shoulder = 0) {
    this.distance = THREE.MathUtils.lerp(this.distance, this.targetDistance + extraDistance, 1 - Math.exp(-6 * dt));
    this.shoulder = THREE.MathUtils.lerp(this.shoulder || 0, shoulder, 1 - Math.exp(-10 * dt));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).multiplyScalar(this.shoulder);
    // L'axe de visée passe par le joueur ; seule la caméra se décale de côté,
    // sinon tout reste aligné et le personnage masque le viseur.
    const target = new THREE.Vector3(targetPos.x, targetPos.y + targetHeight, targetPos.z);
    // La composante verticale n'est plus multipliée par la distance en entier :
    // avant, dézoomer levait la caméra bien au-dessus de la tête. Le décalage
    // fixe (0.35 m) la maintient proche de la hauteur d'épaule quel que soit
    // le zoom ; seule la rotation de la souris (pitch) continue d'agir sur la
    // distance, pour pouvoir regarder le sol ou le ciel.
    const offset = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch) * this.distance,
      Math.sin(this.pitch) * this.distance + 0.35,
      Math.cos(this.yaw) * Math.cos(this.pitch) * this.distance
    );

    let desired = target.clone().add(offset);
    // Distance réellement obtenue après anti-mur, comparée à celle voulue
    // avant obstruction : le ratio dit si la caméra est coincée, sans
    // dépendre du FOV ni de la distance choisis dans les options. `fadePlayer`
    // (main.js) s'en sert pour savoir quand estomper le joueur.
    this.naturalDistance = offset.length();
    const allowed = this.clearObstruction(target, desired);
    this.clampedDistance = allowed;
    desired = target.clone().addScaledVector(offset.clone().normalize(), allowed).add(right);
    desired.y = Math.max(desired.y, 0.8);

    this.current.lerp(desired, 1 - Math.exp(-11 * dt));
    this.camera.position.copy(this.current);

    // En visée, on regarde loin devant plutôt que le personnage : sinon décaler
    // la caméra ET sa cible du même vecteur le laisse pile au centre de l'écran.
    const aimPoint = this.shoulder > 0.05
      ? target.clone().addScaledVector(offset.clone().normalize(), -28)
      : target;
    this.lookAt.lerp(aimPoint, 1 - Math.exp(-14 * dt));
    this.camera.lookAt(this.lookAt);
  }
}
