import * as THREE from 'three';

// Catalogue : ajouter une arme = ajouter une entrée ici, rien d'autre.
export const WEAPONS = {
  poings: { label: 'Poings', damage: 12, rpm: 110, mag: 0, reserve: 0, range: 1.8, spread: 0, reload: 0, auto: false, melee: true, price: 0 },
  pistolet: { label: 'Pistolet 9 mm', damage: 26, rpm: 320, mag: 12, reserve: 60, range: 90, spread: 0.014, reload: 1.5, auto: false, price: 500 },
  uzi: { label: 'UZI', damage: 17, rpm: 850, mag: 32, reserve: 160, range: 70, spread: 0.045, reload: 2.1, auto: true, price: 1800 },
  pompe: { label: 'Fusil à pompe', damage: 20, pellets: 8, rpm: 70, mag: 6, reserve: 32, range: 32, spread: 0.075, reload: 2.8, auto: false, price: 1500 },
  fusil: { label: "Fusil d'assaut", damage: 31, rpm: 620, mag: 30, reserve: 180, range: 140, spread: 0.022, reload: 2.4, auto: true, price: 2200 },
  sniper: { label: 'Fusil de précision', damage: 115, rpm: 40, mag: 5, reserve: 25, range: 400, spread: 0.002, reload: 3.2, auto: false, scope: true, price: 3000 },
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
  const long = spec.range > 60 ? 0.62 : 0.26;

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, long), metal);
  body.position.z = long * 0.3;
  g.add(body);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.07), grip);
  handle.position.set(0, -0.11, 0);
  g.add(handle);
  if (spec.scope) {
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.2, 8), grip);
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.08, 0.15);
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

    this.held = new THREE.Group();
    this.player.mesh.add(this.held);
    this.held.position.set(0.24, 1.32, 0.12);
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
    const mesh = buildWeaponMesh(this.name);
    mesh.rotation.y = Math.PI;
    this.held.add(mesh);
    this.held.visible = !this.spec.melee && !this.player.inVehicle;
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
  }

  get hudAmmo() {
    if (this.spec.melee) return '—';
    return `${this.magazine} / ${this.reserve}`;
  }
}
