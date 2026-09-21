import * as THREE from 'three';

const MAX_MARKS = 180;
const MAX_PUFFS = 28;

// Traces de pneus et fumée, entièrement recyclées : aucun objet créé en jeu.
export class VehicleEffects {
  constructor(scene) {
    this.scene = scene;

    const markGeo = new THREE.PlaneGeometry(0.26, 0.7);
    markGeo.rotateX(-Math.PI / 2);
    this.markMat = new THREE.MeshBasicMaterial({
      color: 0x101216,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    this.marks = new THREE.InstancedMesh(markGeo, this.markMat, MAX_MARKS);
    this.marks.frustumCulled = false;
    this.marks.count = 0;
    this.markIndex = 0;
    scene.add(this.marks);

    this.puffMat = new THREE.MeshBasicMaterial({
      color: 0xb9bcc2,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const puffGeo = new THREE.SphereGeometry(0.42, 6, 5);
    this.puffs = [];
    for (let i = 0; i < MAX_PUFFS; i++) {
      const m = new THREE.Mesh(puffGeo, this.puffMat.clone());
      m.visible = false;
      scene.add(m);
      this.puffs.push({ mesh: m, life: 0, max: 1 });
    }
    this.puffIndex = 0;

    this.matrix = new THREE.Matrix4();
    this.quat = new THREE.Quaternion();
    this.scale = new THREE.Vector3(1, 1, 1);
    this.euler = new THREE.Euler();
  }

  addMark(x, z, yaw) {
    this.euler.set(0, yaw, 0);
    this.quat.setFromEuler(this.euler);
    this.matrix.compose(new THREE.Vector3(x, 0.035, z), this.quat, this.scale);
    this.marks.setMatrixAt(this.markIndex, this.matrix);
    this.markIndex = (this.markIndex + 1) % MAX_MARKS;
    this.marks.count = Math.min(MAX_MARKS, this.marks.count + 1);
    this.marks.instanceMatrix.needsUpdate = true;
  }

  addPuff(x, z, strength = 1) {
    const puff = this.puffs[this.puffIndex];
    this.puffIndex = (this.puffIndex + 1) % MAX_PUFFS;
    puff.mesh.position.set(x, 0.25, z);
    puff.mesh.scale.setScalar(0.5 + strength * 0.4);
    puff.mesh.visible = true;
    puff.max = 0.7 + strength * 0.4;
    puff.life = puff.max;
    puff.drift = (Math.random() - 0.5) * 0.6;
  }

  update(dt) {
    for (const puff of this.puffs) {
      if (puff.life <= 0) continue;
      puff.life -= dt;
      const t = Math.max(0, puff.life / puff.max);
      puff.mesh.material.opacity = t * 0.42;
      puff.mesh.position.y += dt * 0.7;
      puff.mesh.position.x += puff.drift * dt;
      puff.mesh.scale.addScalar(dt * 0.6);
      if (puff.life <= 0) puff.mesh.visible = false;
    }
  }

  clear() {
    this.marks.count = 0;
    this.markIndex = 0;
  }
}
