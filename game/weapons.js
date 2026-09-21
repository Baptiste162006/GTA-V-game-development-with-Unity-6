import * as THREE from 'three';

// Catalogue : ajouter une arme = ajouter une entrée ici, rien d'autre.
export const WEAPONS = {
  // `length` est la longueur du modèle tenu en main, en mètres. Elle n'a rien à
  // voir avec la portée : un pistolet porte loin mais reste court.
  poings: { label: 'Poings', damage: 12, rpm: 110, mag: 0, reserve: 0, range: 1.8, spread: 0, reload: 0, auto: false, melee: true, price: 0, length: 0 },
  pistolet: { label: 'Pistolet 9 mm', damage: 26, rpm: 320, mag: 12, reserve: 60, range: 90, spread: 0.014, reload: 1.5, auto: false, price: 500, length: 0.22 },
  uzi: { label: 'UZI', damage: 17, rpm: 850, mag: 32, reserve: 160, range: 70, spread: 0.045, reload: 2.1, auto: true, price: 1800, length: 0.3 },
  pompe: { label: 'Fusil à pompe', damage: 20, pellets: 8, rpm: 70, mag: 6, reserve: 32, range: 32, spread: 0.075, reload: 2.8, auto: false, price: 1500, length: 0.68 },
  fusil: { label: "Fusil d'assaut", damage: 31, rpm: 620, mag: 30, reserve: 180, range: 140, spread: 0.022, reload: 2.4, auto: true, price: 2200, length: 0.72 },
  sniper: { label: 'Fusil de précision', damage: 115, rpm: 40, mag: 5, reserve: 25, range: 400, spread: 0.002, reload: 3.2, auto: false, scope: true, price: 3000, length: 0.92 },
};

const ORDER = ['poings', 'pistolet', 'uzi', 'pompe', 'fusil', 'sniper'];
const HEAD_Y = 1.5; // au-dessus : tir à la tête

// Petit modèle d'arme tenu en main, assemblé en boîtes sombres.
function buildWeaponMesh(name) {
  const g = new THREE.Group();
  if (name === 'poings') return g;
  const metal = new THREE.MeshLambertMaterial({ color: 0x23262b });
  const grip = new THREE.MeshLambertMaterial({ color: 0x14161a });
  const spec = WEAPONS[name];
  const long = spec.length;
  const thick = long > 0.5 ? 0.055 : 0.042;

  const body = new THREE.Mesh(new THREE.BoxGeometry(thick, long > 0.5 ? 0.075 : 0.095, long), metal);
  body.position.z = long * 0.24;
  g.add(body);

  // Crosse pour les armes d'épaule, poignée seule pour les armes de poing.
  const handle = new THREE.Mesh(new THREE.BoxGeometry(thick, 0.13, 0.06), grip);
  handle.position.set(0, -0.09, long > 0.5 ? -long * 0.12 : 0);
  g.add(handle);
  if (long > 0.5) {
    const stock = new THREE.Mesh(new THREE.BoxGeometry(thick, 0.085, long * 0.3), grip);
    stock.position.set(0, -0.03, -long * 0.32);
    g.add(stock);
  }
  if (spec.scope) {
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.18, 8), grip);
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.07, long * 0.12);
    g.add(scope);
  }
  return g;
}

export class WeaponSystem {
  constructor(scene, camera, player) {
    this.scene = scene;
    this.camera = camera;
    this.player = player;

    this.owned = { poings: true, pistolet: true };
    this.ammo = { pistolet: { mag: 12, reserve: 48 } };
    this.index = 1;
    this.cooldown = 0;
    this.reloading = 0;
    this.aiming = false;
    this.recoil = 0;

    this.onHit = null; // (cible, dégâts, tête) -> void
    this.onShot = null; // (nom de l'arme) -> void
    this.onDry = null;

    // L'arme est accrochée à la main droite : elle suit l'animation du bras,
    // pointe vers le sol au repos et vers l'avant dès que le bras se lève.
    this.held = new THREE.Group();
    this.player.mesh.userData.rig.armR.add(this.held);
    this.held.position.set(0, -0.52, 0.03);
    this.held.rotation.x = Math.PI / 2;
    this.refreshHeld();

    this.buildTracers();
  }

  buildTracers() {
    // Un pool de 12 traits réutilisés : aucun objet créé pendant le tir.
    this.tracers = [];
    const mat = new THREE.LineBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.9 });
    for (let i = 0; i < 12; i++) {
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const line = new THREE.Line(geo, mat.clone());
      line.visible = false;
      line.frustumCulled = false;
      this.scene.add(line);
      this.tracers.push({ line, life: 0 });
    }
    this.impacts = [];
    const impactGeo = new THREE.SphereGeometry(0.07, 6, 5);
    for (let i = 0; i < 12; i++) {
      const m = new THREE.Mesh(impactGeo, new THREE.MeshBasicMaterial({ color: 0xffd08a }));
      m.visible = false;
      this.scene.add(m);
      this.impacts.push({ mesh: m, life: 0 });
    }
  }

  get name() {
    return ORDER[this.index];
  }

  get spec() {
    return WEAPONS[this.name];
  }

  get magazine() {
    return this.ammo[this.name]?.mag ?? 0;
  }

  get reserve() {
    return this.ammo[this.name]?.reserve ?? 0;
  }

  give(name, rounds = 0) {
    if (!WEAPONS[name]) return false;
    this.owned[name] = true;
    if (WEAPONS[name].mag > 0) {
      if (!this.ammo[name]) this.ammo[name] = { mag: WEAPONS[name].mag, reserve: 0 };
      this.ammo[name].reserve += rounds || WEAPONS[name].reserve;
    }
    return true;
  }

  refreshHeld() {
    this.held.clear();
    this.held.add(buildWeaponMesh(this.name));
    if (!this.spec.melee) {
      // Éclair de bouche, montré 50 ms à chaque tir.
      this.flash = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0.85 })
      );
      this.flash.scale.set(1, 0.7, 1.8);
      this.flash.position.z = this.spec.length * 0.78;
      this.flash.visible = false;
      this.held.add(this.flash);
    } else {
      this.flash = null;
    }
    this.held.visible = !this.spec.melee && !this.player.inVehicle;
  }

  // Pose de tir : bras droit tendu vers l'avant, gauche en soutien.
  applyPose() {
    const rig = this.player.mesh.userData.rig;
    if (this.spec.melee || this.player.inVehicle) return;
    const kick = this.recoil * 4;
    if (this.aiming) {
      rig.armR.rotation.x = -1.4 + kick;
      rig.armL.rotation.x = -1.2 + kick;
      rig.armL.rotation.z = 0.24;
    } else {
      rig.armR.rotation.x = Math.min(rig.armR.rotation.x, -0.35) + kick;
      rig.armL.rotation.z = 0;
    }
  }

  cycle(dir) {
    const available = ORDER.filter((n) => this.owned[n]);
    const here = available.indexOf(this.name);
    const next = available[(here + dir + available.length) % available.length];
    this.index = ORDER.indexOf(next);
    this.reloading = 0;
    this.refreshHeld();
    return this.spec.label;
  }

  select(slot) {
    const name = ORDER[slot];
    if (!name || !this.owned[name]) return false;
    this.index = slot;
    this.reloading = 0;
    this.refreshHeld();
    return true;
  }

  reload() {
    const spec = this.spec;
    if (spec.melee || this.reloading > 0) return;
    const box = this.ammo[this.name];
    if (!box || box.mag >= spec.mag || box.reserve <= 0) return;
    this.reloading = spec.reload;
  }

  // Direction du tir : au centre de l'écran, avec dispersion.
  aimRay() {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const spread = this.spec.spread * (this.aiming ? 0.35 : 1);
    if (spread > 0) {
      dir.x += (Math.random() - 0.5) * spread;
      dir.y += (Math.random() - 0.5) * spread;
      dir.z += (Math.random() - 0.5) * spread;
      dir.normalize();
    }
    const origin = this.camera.position.clone().addScaledVector(dir, 1.2);
    return { origin, dir };
  }

  // targets : [{ mesh|position, health, radius, kind }]
  fire(targets, world) {
    if (this.cooldown > 0 || this.reloading > 0) return false;
    const spec = this.spec;
    this.cooldown = 60 / spec.rpm;

    if (spec.melee) {
      this.meleeHit(targets);
      if (this.onShot) this.onShot(this.name);
      return true;
    }

    const box = this.ammo[this.name];
    if (!box || box.mag <= 0) {
      if (this.onDry) this.onDry();
      this.reload();
      return false;
    }
    box.mag--;
    this.recoil = Math.min(0.09, 0.012 + spec.damage * 0.0006);
    if (this.flash) {
      this.flash.visible = true;
      this.flashLife = 0.05;
    }
    if (this.onShot) this.onShot(this.name);

    const shots = spec.pellets || 1;
    for (let i = 0; i < shots; i++) {
      const { origin, dir } = this.aimRay();
      this.castOne(origin, dir, spec, targets, world);
    }
    return true;
  }

  castOne(origin, dir, spec, targets, world) {
    let best = null;
    let bestDist = spec.range;

    for (const t of targets) {
      const p = t.position;
      const to = p.clone().sub(origin);
      const along = to.dot(dir);
      if (along < 0.5 || along > bestDist) continue;
      const closest = origin.clone().addScaledVector(dir, along);
      // Cylindre grossier autour de la cible : rapide et suffisant ici.
      const lateral = Math.hypot(closest.x - p.x, closest.z - p.z);
      const vertical = closest.y - p.y;
      if (lateral > (t.radius || 0.45) || vertical < 0 || vertical > 1.9) continue;
      best = { target: t, point: closest, head: vertical > HEAD_Y };
      bestDist = along;
    }

    // Un mur plus proche bloque la balle.
    const wall = this.wallDistance(origin, dir, Math.min(bestDist, spec.range), world);
    if (wall < bestDist) {
      this.showImpact(origin.clone().addScaledVector(dir, wall));
      this.showTracer(origin, origin.clone().addScaledVector(dir, wall));
      return;
    }

    if (best) {
      const mult = best.head ? 3 : 1;
      this.showImpact(best.point);
      this.showTracer(origin, best.point);
      if (this.onHit) this.onHit(best.target, spec.damage * mult, best.head);
    } else {
      this.showTracer(origin, origin.clone().addScaledVector(dir, spec.range));
    }
  }

  wallDistance(origin, dir, maxDist, world) {
    if (!world) return Infinity;
    const step = 1.6;
    for (let d = step; d < maxDist; d += step) {
      const p = origin.clone().addScaledVector(dir, d);
      if (p.y < 0) return d;
      for (const b of world.nearbyBoxes(p.x, p.z)) {
        if (p.x > b.minX && p.x < b.maxX && p.z > b.minZ && p.z < b.maxZ && p.y < b.h) return d;
      }
    }
    return Infinity;
  }

  meleeHit(targets) {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    const from = this.player.pos;
    for (const t of targets) {
      const to = t.position.clone().sub(from);
      to.y = 0;
      if (to.length() > this.spec.range + 0.6) continue;
      if (to.normalize().dot(dir) < 0.5) continue;
      if (this.onHit) this.onHit(t, this.spec.damage, false);
      return;
    }
  }

  showTracer(from, to) {
    const slot = this.tracers.find((t) => t.life <= 0) || this.tracers[0];
    const pos = slot.line.geometry.attributes.position;
    pos.setXYZ(0, from.x, from.y - 0.1, from.z);
    pos.setXYZ(1, to.x, to.y, to.z);
    pos.needsUpdate = true;
    slot.line.visible = true;
    slot.life = 0.06;
  }

  showImpact(point) {
    const slot = this.impacts.find((i) => i.life <= 0) || this.impacts[0];
    slot.mesh.position.copy(point);
    slot.mesh.visible = true;
    slot.life = 0.12;
  }

  update(dt) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.recoil *= Math.exp(-9 * dt);

    if (this.flashLife > 0) {
      this.flashLife -= dt;
      if (this.flashLife <= 0 && this.flash) this.flash.visible = false;
    }

    if (this.reloading > 0) {
      this.reloading -= dt;
      if (this.reloading <= 0) {
        const spec = this.spec;
        const box = this.ammo[this.name];
        const need = spec.mag - box.mag;
        const taken = Math.min(need, box.reserve);
        box.mag += taken;
        box.reserve -= taken;
      }
    }

    for (const t of this.tracers) {
      if (t.life > 0) {
        t.life -= dt;
        if (t.life <= 0) t.line.visible = false;
      }
    }
    for (const i of this.impacts) {
      if (i.life > 0) {
        i.life -= dt;
        if (i.life <= 0) i.mesh.visible = false;
      }
    }

    this.held.visible = !this.spec.melee && !this.player.inVehicle;
    this.applyPose();
  }

  get hudAmmo() {
    if (this.spec.melee) return '—';
    return `${this.magazine} / ${this.reserve}`;
  }
}
