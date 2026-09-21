import * as THREE from 'three';

// Trame urbaine : routes sur les lignes x = i*CELL et z = j*CELL.
export const CITY = {
  CELL: 62,
  ROAD: 14,
  HALF_ROAD: 7,
  RINGS: 4, // routes de -4*CELL à +4*CELL
};
CITY.EXTENT = CITY.RINGS * CITY.CELL + CITY.HALF_ROAD;
CITY.BLOCK = CITY.CELL - CITY.ROAD;

const DAY_LENGTH = 720; // 24 h de jeu en 12 min réelles

export function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MAX_LINE = CITY.RINGS * CITY.CELL;

export function nearestRoadLine(v) {
  return THREE.MathUtils.clamp(Math.round(v / CITY.CELL) * CITY.CELL, -MAX_LINE, MAX_LINE);
}

export function isOnRoad(x, z) {
  return (
    Math.abs(x - nearestRoadLine(x)) < CITY.HALF_ROAD ||
    Math.abs(z - nearestRoadLine(z)) < CITY.HALF_ROAD
  );
}

const DISTRICTS = {
  downtown: { name: 'Downtown', color: 0x8d99ae, min: 34, max: 74, park: 0.04, tint: '#6f7890' },
  tokyo: { name: 'Little Tokyo', color: 0xb85c6b, min: 14, max: 30, park: 0.08, tint: '#8c4a57' },
  hills: { name: 'Vinewood Hills', color: 0xd9c9a8, min: 6, max: 12, park: 0.3, tint: '#9a8c6e' },
  industrial: { name: 'Zone Industrielle', color: 0x7a7f74, min: 7, max: 16, park: 0.05, tint: '#5f6459' },
  beach: { name: 'Beachside', color: 0xe0b48a, min: 9, max: 22, park: 0.18, tint: '#a8845f' },
  oldtown: { name: 'Vieille Ville', color: 0xc08860, min: 11, max: 26, park: 0.12, tint: '#8a6244' },
};

function districtAt(i, j) {
  if (Math.abs(i) <= 1 && Math.abs(j) <= 1) return 'downtown';
  if (i < -1 && j < -1) return 'hills';
  if (i > 1 && j < -1) return 'tokyo';
  if (i < -1 && j > 1) return 'industrial';
  if (i > 1 && j > 1) return 'beach';
  return 'oldtown';
}

// Ciel dégradé + étoiles, tout en shader : aucune texture à charger.
const SKY_VERT = `
varying vec3 vWorld;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const SKY_FRAG = `
uniform vec3 topColor;
uniform vec3 midColor;
uniform vec3 bottomColor;
varying vec3 vWorld;
void main() {
  float h = normalize(vWorld).y;
  vec3 c = mix(bottomColor, midColor, smoothstep(-0.15, 0.18, h));
  c = mix(c, topColor, smoothstep(0.12, 0.75, h));
  gl_FragColor = vec4(c, 1.0);
}`;

// Paliers du cycle : heure -> ambiance.
const SKY_KEYS = [
  { h: 0, top: 0x0a1030, mid: 0x131a3c, bot: 0x1d2145, sun: 0x2a3560, sunI: 0.05, hemi: 0.22, fog: 0x141a38 },
  { h: 5.5, top: 0x243a6b, mid: 0x6b5f85, bot: 0xc2775f, sun: 0xff9a5c, sunI: 0.5, hemi: 0.5, fog: 0x8e7488 },
  { h: 8, top: 0x4a86c8, mid: 0x8fb6dc, bot: 0xd7e3ee, sun: 0xfff1d9, sunI: 1.35, hemi: 0.95, fog: 0xc3d6e6 },
  { h: 13, top: 0x3f7fd0, mid: 0x86b4e2, bot: 0xd2e2f0, sun: 0xffffff, sunI: 1.55, hemi: 1.05, fog: 0xc9dcec },
  { h: 18.5, top: 0x2f5f9e, mid: 0xd08a5a, bot: 0xf0a86a, sun: 0xffb066, sunI: 0.95, hemi: 0.7, fog: 0xd79a72 },
  { h: 20.5, top: 0x16214f, mid: 0x4a3a66, bot: 0x8a4f55, sun: 0xff7a4a, sunI: 0.28, hemi: 0.38, fog: 0x584061 },
  { h: 22.5, top: 0x0a1030, mid: 0x131a3c, bot: 0x1d2145, sun: 0x2a3560, sunI: 0.06, hemi: 0.24, fog: 0x141a38 },
  { h: 24, top: 0x0a1030, mid: 0x131a3c, bot: 0x1d2145, sun: 0x2a3560, sunI: 0.05, hemi: 0.22, fog: 0x141a38 },
];

function lerpKeys(hour) {
  let a = SKY_KEYS[0];
  let b = SKY_KEYS[SKY_KEYS.length - 1];
  for (let i = 0; i < SKY_KEYS.length - 1; i++) {
    if (hour >= SKY_KEYS[i].h && hour <= SKY_KEYS[i + 1].h) {
      a = SKY_KEYS[i];
      b = SKY_KEYS[i + 1];
      break;
    }
  }
  const t = b.h === a.h ? 0 : (hour - a.h) / (b.h - a.h);
  return { a, b, t };
}

function facadeTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#d8d8d8';
  g.fillRect(0, 0, 128, 128);
  // Bandeau d'étage + fenêtres.
  for (let y = 0; y < 128; y += 32) {
    g.fillStyle = '#bcbcbc';
    g.fillRect(0, y, 128, 4);
    for (let x = 0; x < 128; x += 32) {
      const shade = 90 + Math.floor(Math.random() * 50);
      g.fillStyle = `rgb(${shade},${shade + 6},${shade + 12})`;
      g.fillRect(x + 7, y + 11, 18, 15);
      g.fillStyle = 'rgba(255,255,255,0.18)';
      g.fillRect(x + 7, y + 11, 18, 4);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function windowLightTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, 128, 128);
  const warm = ['#ffd9a0', '#ffc46b', '#fff0cc', '#9fd8ff'];
  for (let y = 0; y < 128; y += 32) {
    for (let x = 0; x < 128; x += 32) {
      if (Math.random() < 0.45) continue; // fenêtre éteinte
      g.fillStyle = warm[Math.floor(Math.random() * warm.length)];
      g.fillRect(x + 7, y + 11, 18, 15);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// UV par face : les fenêtres gardent la même taille quelle que soit la façade.
function scaleBoxUV(geo, w, h, d, unit = 3.2) {
  const uv = geo.attributes.uv;
  const faces = [
    [d, h], [d, h], // +x, -x
    [w, d], [w, d], // +y, -y
    [w, h], [w, h], // +z, -z
  ];
  for (let f = 0; f < 6; f++) {
    const [su, sv] = faces[f];
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, uv.getX(i) * Math.max(1, Math.round(su / unit)), uv.getY(i) * Math.max(1, Math.round(sv / unit)));
    }
  }
  uv.needsUpdate = true;
}

export class World {
  constructor(scene, seed = 20260921) {
    this.scene = scene;
    this.rng = mulberry32(seed);
    this.hour = 8.5;
    this.buildings = [];
    this.grid = new Map();
    this.parkedSpots = [];
    this.intersections = [];

    this.buildSky();
    this.buildLights();
    this.buildGround();
    this.buildCity();
    this.buildStreetFurniture();
    this.applyTimeOfDay(0);
  }

  // --- construction ---

  buildSky() {
    this.skyUniforms = {
      topColor: { value: new THREE.Color(0x4a86c8) },
      midColor: { value: new THREE.Color(0x8fb6dc) },
      bottomColor: { value: new THREE.Color(0xd7e3ee) },
    };
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(900, 24, 16),
      new THREE.ShaderMaterial({
        uniforms: this.skyUniforms,
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      })
    );
    sky.frustumCulled = false;
    this.scene.add(sky);
    this.sky = sky;

    const pos = [];
    for (let i = 0; i < 700; i++) {
      const v = new THREE.Vector3().setFromSphericalCoords(
        860,
        Math.acos(this.rng() * 0.9),
        this.rng() * Math.PI * 2
      );
      pos.push(v.x, v.y, v.z);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    this.starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 3.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
    this.stars = new THREE.Points(starGeo, this.starMat);
    this.stars.frustumCulled = false;
    this.scene.add(this.stars);
  }

  buildLights() {
    this.hemi = new THREE.HemisphereLight(0xcfe3f5, 0x4a4438, 1);
    this.scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(0xffffff, 1.4);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const cam = this.sun.shadow.camera;
    cam.near = 1;
    cam.far = 420;
    cam.left = cam.bottom = -85;
    cam.right = cam.top = 85;
    this.sun.shadow.bias = -0.0008;
    this.sun.shadow.normalBias = 0.035;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);
  }

  buildGround() {
    const asphalt = new THREE.MeshLambertMaterial({ color: 0x41464f });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), asphalt);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Marquage axial des routes (une seule InstancedMesh pour les deux axes).
    const dashGeo = new THREE.PlaneGeometry(0.35, 3.2);
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xd9d2b8, transparent: true, opacity: 0.55 });
    const step = 8;
    const count = (CITY.RINGS * 2 + 1) * Math.ceil((MAX_LINE * 2 + CITY.CELL) / step) * 2;
    const dashes = new THREE.InstancedMesh(dashGeo, dashMat, count);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const flat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
    const turned = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, Math.PI / 2));
    const s = new THREE.Vector3(1, 1, 1);
    let n = 0;
    for (let i = -CITY.RINGS; i <= CITY.RINGS; i++) {
      const line = i * CITY.CELL;
      for (let v = -MAX_LINE - CITY.CELL / 2; v <= MAX_LINE + CITY.CELL / 2; v += step) {
        if (Math.abs(v - nearestRoadLine(v)) < CITY.HALF_ROAD) continue; // pas de marquage en carrefour
        q.copy(flat);
        m.compose(new THREE.Vector3(line, 0.03, v), q, s);
        dashes.setMatrixAt(n++, m);
        q.copy(turned);
        m.compose(new THREE.Vector3(v, 0.03, line), q, s);
        dashes.setMatrixAt(n++, m);
      }
    }
    dashes.count = n;
    dashes.instanceMatrix.needsUpdate = true;
    this.scene.add(dashes);
  }

  addBuilding(x, z, w, d, h, materialIndex) {
    const geo = new THREE.BoxGeometry(w, h, d);
    scaleBoxUV(geo, w, h, d);
    const mesh = new THREE.Mesh(geo, this.buildingMats[materialIndex]);
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    const box = { minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, h };
    this.buildings.push(box);
    const key = `${Math.floor(x / CITY.CELL)},${Math.floor(z / CITY.CELL)}`;
    if (!this.grid.has(key)) this.grid.set(key, []);
    this.grid.get(key).push(box);
    return mesh;
  }

  buildCity() {
    const facade = facadeTexture();
    const windows = windowLightTexture();
    this.buildingMats = Object.values(DISTRICTS).map(
      (d) =>
        new THREE.MeshLambertMaterial({
          color: d.color,
          map: facade,
          emissive: 0xffffff,
          emissiveMap: windows,
          emissiveIntensity: 0,
        })
    );
    const districtKeys = Object.keys(DISTRICTS);

    const sidewalkMat = new THREE.MeshLambertMaterial({ color: 0x9a9a92 });
    const grassMat = new THREE.MeshLambertMaterial({ color: 0x4a7a44 });
    const sidewalkGeo = new THREE.PlaneGeometry(CITY.BLOCK, CITY.BLOCK);
    const trees = [];

    for (let i = -CITY.RINGS; i < CITY.RINGS; i++) {
      for (let j = -CITY.RINGS; j < CITY.RINGS; j++) {
        const cx = i * CITY.CELL + CITY.CELL / 2;
        const cz = j * CITY.CELL + CITY.CELL / 2;
        const key = districtAt(i, j);
        const d = DISTRICTS[key];
        const matIndex = districtKeys.indexOf(key);
        const isPark = this.rng() < d.park;

        const plate = new THREE.Mesh(sidewalkGeo, isPark ? grassMat : sidewalkMat);
        plate.rotation.x = -Math.PI / 2;
        plate.position.set(cx, 0.04, cz);
        plate.receiveShadow = true;
        this.scene.add(plate);

        if (isPark) {
          for (let t = 0; t < 7; t++) {
            trees.push(new THREE.Vector3(cx + (this.rng() - 0.5) * 38, 0, cz + (this.rng() - 0.5) * 38));
          }
          continue;
        }

        // 1 à 4 immeubles par îlot, dans une emprise de 40 m.
        const splits = this.rng() < 0.35 ? 1 : this.rng() < 0.7 ? 2 : 4;
        const area = 40;
        const cells = splits === 1 ? [[0, 0, area, area]]
          : splits === 2
            ? this.rng() < 0.5
              ? [[-area / 4, 0, area / 2, area], [area / 4, 0, area / 2, area]]
              : [[0, -area / 4, area, area / 2], [0, area / 4, area, area / 2]]
            : [
                [-area / 4, -area / 4, area / 2, area / 2],
                [area / 4, -area / 4, area / 2, area / 2],
                [-area / 4, area / 4, area / 2, area / 2],
                [area / 4, area / 4, area / 2, area / 2],
              ];

        for (const [ox, oz, cw, cd] of cells) {
          const gap = 1.6 + this.rng() * 2;
          const w = Math.max(6, cw - gap);
          const dd = Math.max(6, cd - gap);
          const h = d.min + this.rng() * (d.max - d.min);
          const b = this.addBuilding(cx + ox, cz + oz, w, dd, h, matIndex);

          if (h > 30 && this.rng() < 0.5) {
            const mast = new THREE.Mesh(
              new THREE.CylinderGeometry(0.25, 0.25, 8, 6),
              new THREE.MeshLambertMaterial({ color: 0x3a3f47 })
            );
            mast.position.set(b.position.x, h + 4, b.position.z);
            this.scene.add(mast);
            const lamp = new THREE.Mesh(
              new THREE.SphereGeometry(0.5, 8, 6),
              new THREE.MeshBasicMaterial({ color: 0xff3b30 })
            );
            lamp.position.set(b.position.x, h + 8.4, b.position.z);
            this.scene.add(lamp);
            (this.beacons ||= []).push(lamp);
          } else if (this.rng() < 0.4) {
            const cornice = new THREE.Mesh(
              new THREE.BoxGeometry(w + 1.2, 0.8, dd + 1.2),
              new THREE.MeshLambertMaterial({ color: 0x5c5c58 })
            );
            cornice.position.set(b.position.x, h + 0.4, b.position.z);
            cornice.castShadow = true;
            this.scene.add(cornice);
          }
        }

        // Places de stationnement le long du trottoir.
        const side = Math.floor(this.rng() * 4);
        const off = CITY.BLOCK / 2 + 3.2;
        const along = (this.rng() - 0.5) * 30;
        const spot =
          side === 0 ? { x: cx + along, z: cz - off, rot: 0 }
          : side === 1 ? { x: cx + along, z: cz + off, rot: Math.PI }
          : side === 2 ? { x: cx - off, z: cz + along, rot: -Math.PI / 2 }
          : { x: cx + off, z: cz + along, rot: Math.PI / 2 };
        this.parkedSpots.push(spot);
      }
    }

    this.plantTrees(trees);

    for (let i = -CITY.RINGS; i <= CITY.RINGS; i++) {
      for (let j = -CITY.RINGS; j <= CITY.RINGS; j++) {
        this.intersections.push(new THREE.Vector3(i * CITY.CELL, 0, j * CITY.CELL));
      }
    }
  }

  plantTrees(positions) {
    if (!positions.length) return;
    const trunkGeo = new THREE.CylinderGeometry(0.28, 0.38, 3, 6);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5b4330 });
    const leafGeo = new THREE.IcosahedronGeometry(2.1, 0);
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x3f7a3a, flatShading: true });
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, positions.length);
    const leaves = new THREE.InstancedMesh(leafGeo, leafMat, positions.length);
    leaves.castShadow = true;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    positions.forEach((p, i) => {
      const s = 0.8 + this.rng() * 0.6;
      q.setFromEuler(new THREE.Euler(0, this.rng() * Math.PI, 0));
      m.compose(new THREE.Vector3(p.x, 1.5 * s, p.z), q, new THREE.Vector3(s, s, s));
      trunks.setMatrixAt(i, m);
      m.compose(new THREE.Vector3(p.x, 3.6 * s, p.z), q, new THREE.Vector3(s, s * 0.9, s));
      leaves.setMatrixAt(i, m);
    });
    this.scene.add(trunks, leaves);
  }

  buildStreetFurniture() {
    const spots = [];
    for (let i = -CITY.RINGS; i <= CITY.RINGS; i++) {
      for (let v = -MAX_LINE; v <= MAX_LINE; v += CITY.CELL / 2) {
        spots.push([i * CITY.CELL + CITY.HALF_ROAD + 1.2, v]);
        spots.push([v, i * CITY.CELL + CITY.HALF_ROAD + 1.2]);
      }
    }
    const poleGeo = new THREE.CylinderGeometry(0.16, 0.2, 7, 6);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x40454d });
    const poles = new THREE.InstancedMesh(poleGeo, poleMat, spots.length);
    const headGeo = new THREE.SphereGeometry(0.45, 8, 6);
    this.lampMat = new THREE.MeshBasicMaterial({ color: 0x2a2d33 });
    const heads = new THREE.InstancedMesh(headGeo, this.lampMat, spots.length);

    // Flaque de lumière au sol : bien moins cher qu'une vraie PointLight par lampadaire.
    const poolGeo = new THREE.CircleGeometry(5, 14);
    poolGeo.rotateX(-Math.PI / 2);
    this.lampPoolMat = new THREE.MeshBasicMaterial({
      color: 0xffd9a0,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const pools = new THREE.InstancedMesh(poolGeo, this.lampPoolMat, spots.length);

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(1, 1, 1);
    spots.forEach(([x, z], i) => {
      m.compose(new THREE.Vector3(x, 3.5, z), q, s);
      poles.setMatrixAt(i, m);
      m.compose(new THREE.Vector3(x, 7.1, z), q, s);
      heads.setMatrixAt(i, m);
      m.compose(new THREE.Vector3(x, 0.07, z), q, s);
      pools.setMatrixAt(i, m);
    });
    this.scene.add(poles, heads, pools);
  }

  // --- runtime ---

  applyTimeOfDay(dt) {
    this.hour = (this.hour + (dt / DAY_LENGTH) * 24) % 24;
    const { a, b, t } = lerpKeys(this.hour);

    this.skyUniforms.topColor.value.setHex(a.top).lerp(new THREE.Color(b.top), t);
    this.skyUniforms.midColor.value.setHex(a.mid).lerp(new THREE.Color(b.mid), t);
    this.skyUniforms.bottomColor.value.setHex(a.bot).lerp(new THREE.Color(b.bot), t);

    this.sun.color.setHex(a.sun).lerp(new THREE.Color(b.sun), t);
    this.sun.intensity = THREE.MathUtils.lerp(a.sunI, b.sunI, t);
    this.hemi.intensity = THREE.MathUtils.lerp(a.hemi, b.hemi, t);

    const fog = new THREE.Color(a.fog).lerp(new THREE.Color(b.fog), t);
    if (!this.scene.fog) this.scene.fog = new THREE.FogExp2(fog.getHex(), 0.0032);
    this.scene.fog.color.copy(fog);

    // Nuit : fenêtres et lampadaires s'allument, étoiles apparaissent.
    const night = THREE.MathUtils.clamp((0.55 - this.sun.intensity) / 0.5, 0, 1);
    this.night = night;
    this.scene.fog.density = 0.0030 + night * 0.0016;
    for (const mat of this.buildingMats) mat.emissiveIntensity = night * 0.95;
    this.lampMat.color.setRGB(0.16 + night * 0.84, 0.17 + night * 0.72, 0.2 + night * 0.4);
    this.lampPoolMat.opacity = night * 0.16;
    this.starMat.opacity = night * 0.85;
    if (this.beacons) {
      const on = Math.sin(performance.now() / 500) > 0;
      for (const bcn of this.beacons) bcn.visible = on;
    }

    const ang = ((this.hour - 6) / 24) * Math.PI * 2;
    this.sunDir = new THREE.Vector3(Math.cos(ang), Math.max(0.05, Math.sin(ang)), 0.35).normalize();
  }

  update(dt, focus) {
    this.applyTimeOfDay(dt);
    this.sky.position.copy(focus);
    this.stars.position.copy(focus);
    this.sun.target.position.copy(focus);
    this.sun.position.copy(focus).addScaledVector(this.sunDir, 140);
  }

  get clock() {
    const h = Math.floor(this.hour);
    const m = Math.floor((this.hour - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  nearbyBoxes(x, z) {
    const out = [];
    const ci = Math.floor(x / CITY.CELL);
    const cj = Math.floor(z / CITY.CELL);
    for (let i = ci - 1; i <= ci + 1; i++) {
      for (let j = cj - 1; j <= cj + 1; j++) {
        const arr = this.grid.get(`${i},${j}`);
        if (arr) out.push(...arr);
      }
    }
    return out;
  }

  // Repousse un cercle hors des immeubles. Renvoie la pénétration max rencontrée.
  collideCircle(pos, radius) {
    let hit = 0;
    for (const b of this.nearbyBoxes(pos.x, pos.z)) {
      const cx = THREE.MathUtils.clamp(pos.x, b.minX, b.maxX);
      const cz = THREE.MathUtils.clamp(pos.z, b.minZ, b.maxZ);
      const dx = pos.x - cx;
      const dz = pos.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 > radius * radius) continue;
      const d = Math.sqrt(d2);
      if (d > 0.0001) {
        const push = radius - d;
        pos.x += (dx / d) * push;
        pos.z += (dz / d) * push;
        hit = Math.max(hit, push);
      } else {
        // Centre à l'intérieur : on sort par la face la plus proche.
        const toLeft = pos.x - b.minX;
        const toRight = b.maxX - pos.x;
        const toBack = pos.z - b.minZ;
        const toFront = b.maxZ - pos.z;
        const min = Math.min(toLeft, toRight, toBack, toFront);
        if (min === toLeft) pos.x = b.minX - radius;
        else if (min === toRight) pos.x = b.maxX + radius;
        else if (min === toBack) pos.z = b.minZ - radius;
        else pos.z = b.maxZ + radius;
        hit = Math.max(hit, radius);
      }
    }
    return hit;
  }

  randomRoadPoint(rng = Math.random) {
    const i = Math.floor(rng() * (CITY.RINGS * 2 + 1)) - CITY.RINGS;
    const along = (rng() * 2 - 1) * MAX_LINE;
    return rng() < 0.5
      ? new THREE.Vector3(i * CITY.CELL, 0, along)
      : new THREE.Vector3(along, 0, i * CITY.CELL);
  }

  districtName(x, z) {
    const i = Math.floor(x / CITY.CELL);
    const j = Math.floor(z / CITY.CELL);
    if (Math.abs(x) > CITY.EXTENT || Math.abs(z) > CITY.EXTENT) return 'Périphérie';
    return DISTRICTS[districtAt(i, j)].name;
  }
}

export { DISTRICTS, districtAt, MAX_LINE };
