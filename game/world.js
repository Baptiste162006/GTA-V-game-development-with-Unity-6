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
  hills: { name: 'Mirador Hills', color: 0xd9c9a8, min: 6, max: 12, park: 0.3, tint: '#9a8c6e' },
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

// Trois styles de façade, pour que deux immeubles voisins ne soient pas de
// simples copies l'un de l'autre. `variant` : 0 = bureaux (fenêtres larges en
// bandeaux), 1 = tours étroites (fenêtres hautes et resserrées), 2 = brique
// (petites fenêtres carrées, joints visibles).
function facadeTexture(variant = 0) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');

  if (variant === 1) {
    // Tour étroite : fenêtres hautes, séparées par de fins meneaux verticaux.
    g.fillStyle = '#cfcfcf';
    g.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 32) {
      g.fillStyle = '#b2b2b2';
      g.fillRect(0, y, 128, 3);
      for (let x = 0; x < 128; x += 16) {
        const shade = 85 + Math.floor(Math.random() * 45);
        g.fillStyle = `rgb(${shade},${shade + 6},${shade + 14})`;
        g.fillRect(x + 3, y + 6, 9, 24);
      }
    }
  } else if (variant === 2) {
    // Brique : petites fenêtres carrées, appareillage visible entre les rangs.
    g.fillStyle = '#b9846a';
    g.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 4) {
      g.fillStyle = y % 8 === 0 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)';
      g.fillRect(0, y, 128, 1);
    }
    for (let y = 8; y < 128; y += 32) {
      for (let x = 6; x < 128; x += 32) {
        const shade = 70 + Math.floor(Math.random() * 40);
        g.fillStyle = `rgb(${shade},${shade + 4},${shade + 6})`;
        g.fillRect(x, y, 14, 14);
        g.fillStyle = 'rgba(0,0,0,0.25)';
        g.strokeRect(x, y, 14, 14);
      }
    }
  } else {
    // Bureaux : bandeaux larges, le style d'origine.
    g.fillStyle = '#d8d8d8';
    g.fillRect(0, 0, 128, 128);
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
  }

  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

// Fenêtres allumées de nuit, assorties à chaque style de façade ci-dessus —
// même disposition de grille, pour que le calque lumineux tombe pile sur les
// fenêtres du jour.
function windowLightTexture(variant = 0) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, 128, 128);
  const warm = ['#ffd9a0', '#ffc46b', '#fff0cc', '#9fd8ff'];

  if (variant === 1) {
    for (let y = 0; y < 128; y += 32) {
      for (let x = 0; x < 128; x += 16) {
        if (Math.random() < 0.45) continue;
        g.fillStyle = warm[Math.floor(Math.random() * warm.length)];
        g.fillRect(x + 3, y + 6, 9, 24);
      }
    }
  } else if (variant === 2) {
    for (let y = 8; y < 128; y += 32) {
      for (let x = 6; x < 128; x += 32) {
        if (Math.random() < 0.45) continue;
        g.fillStyle = warm[Math.floor(Math.random() * warm.length)];
        g.fillRect(x, y, 14, 14);
      }
    }
  } else {
    for (let y = 0; y < 128; y += 32) {
      for (let x = 0; x < 128; x += 32) {
        if (Math.random() < 0.45) continue;
        g.fillStyle = warm[Math.floor(Math.random() * warm.length)];
        g.fillRect(x + 7, y + 11, 18, 15);
      }
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

// Fusionne des géométries statiques (position / normale / uv, indexées) en une
// seule. Les immeubles d'un îlot deviennent un seul draw call, sans rien
// changer à l'image : les UV sont déjà cuites par scaleBoxUV.
function mergeGeometries(list) {
  let vertices = 0;
  let indices = 0;
  for (const g of list) {
    vertices += g.attributes.position.count;
    indices += g.index ? g.index.count : g.attributes.position.count;
  }
  const pos = new Float32Array(vertices * 3);
  const nor = new Float32Array(vertices * 3);
  const uvs = new Float32Array(vertices * 2);
  const index = vertices > 65535 ? new Uint32Array(indices) : new Uint16Array(indices);

  let vo = 0;
  let io = 0;
  for (const g of list) {
    const p = g.attributes.position;
    pos.set(p.array, vo * 3);
    nor.set(g.attributes.normal.array, vo * 3);
    uvs.set(g.attributes.uv.array, vo * 2);
    if (g.index) {
      const a = g.index.array;
      for (let k = 0; k < a.length; k++) index[io++] = a[k] + vo;
    } else {
      for (let k = 0; k < p.count; k++) index[io++] = k + vo;
    }
    vo += p.count;
    g.dispose();
  }

  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  out.setIndex(new THREE.BufferAttribute(index, 1));
  out.computeBoundingSphere();
  return out;
}

export class World {
  constructor(scene, seed = 20260921) {
    this.scene = scene;
    this.rng = mulberry32(seed);
    this.hour = 8.5;
    // Renseignés par WeatherSystem ; neutres tant qu'il n'existe pas.
    this.weatherMods = { sunMul: 1, fogAdd: 0, fogGrey: 0, wet: 0, flash: 0 };
    this.seasonMods = { snow: 0, warmth: 0, sidewalk: 0 };
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
    // Phong plutôt que Lambert : le reflet spéculaire donne le bitume mouillé.
    this.groundMat = new THREE.MeshPhongMaterial({ color: 0x41464f, shininess: 0, specular: 0x000000 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), this.groundMat);
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

  // Enregistre la collision et renvoie la géométrie déjà placée, relativement
  // au centre de l'îlot : l'appelant fusionne tout l'îlot en un seul mesh.
  addBuilding(x, z, w, d, h, originX, originZ) {
    const geo = new THREE.BoxGeometry(w, h, d);
    scaleBoxUV(geo, w, h, d);
    geo.translate(x - originX, h / 2, z - originZ);

    const box = { minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, h };
    this.buildings.push(box);
    const key = `${Math.floor(x / CITY.CELL)},${Math.floor(z / CITY.CELL)}`;
    if (!this.grid.has(key)) this.grid.set(key, []);
    this.grid.get(key).push(box);
    return geo;
  }

  buildCity() {
    // Trois styles de façade partagés par toute la ville ; chaque quartier les
    // reçoit dans sa propre teinte. `buildingMats[districtIndex][variant]`.
    const VARIANTS = 3;
    const facades = [facadeTexture(0), facadeTexture(1), facadeTexture(2)];
    const windowSets = [windowLightTexture(0), windowLightTexture(1), windowLightTexture(2)];
    this.buildingMats = Object.values(DISTRICTS).map((d) =>
      facades.map(
        (facade, v) =>
          new THREE.MeshLambertMaterial({
            color: d.color,
            map: facade,
            emissive: 0xffffff,
            emissiveMap: windowSets[v],
            emissiveIntensity: 0,
          })
      )
    );
    const districtKeys = Object.keys(DISTRICTS);

    // Gardés sur l'instance : les saisons repeignent l'herbe et la neige
    // blanchit les trottoirs.
    const sidewalkMat = (this.sidewalkMat = new THREE.MeshLambertMaterial({ color: 0x9a9a92 }));
    const grassMat = (this.grassMat = new THREE.MeshLambertMaterial({ color: 0x4a7a44 }));
    const sidewalkGeo = new THREE.PlaneGeometry(CITY.BLOCK, CITY.BLOCK);
    sidewalkGeo.rotateX(-Math.PI / 2);
    const trees = [];

    // Tout ce qui est statique est regroupé : deux InstancedMesh pour les
    // trottoirs et les pelouses, un mât et une balise instanciés, et un mesh
    // fusionné par îlot pour les immeubles et leurs corniches.
    const blocks = (CITY.RINGS * 2) * (CITY.RINGS * 2);
    const plates = [
      new THREE.InstancedMesh(sidewalkGeo, sidewalkMat, blocks),
      new THREE.InstancedMesh(sidewalkGeo, grassMat, blocks),
    ];
    for (const mesh of plates) {
      mesh.receiveShadow = true;
      mesh.count = 0;
    }
    const plateMatrix = new THREE.Matrix4();

    const mastGeo = new THREE.CylinderGeometry(0.25, 0.25, 8, 6);
    const mastMat = new THREE.MeshLambertMaterial({ color: 0x3a3f47 });
    const beaconGeo = new THREE.SphereGeometry(0.5, 8, 6);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
    const masts = new THREE.InstancedMesh(mastGeo, mastMat, blocks * 4);
    const beacons = new THREE.InstancedMesh(beaconGeo, beaconMat, blocks * 4);
    masts.count = 0;
    beacons.count = 0;
    this.beacons = [beacons];

    const corniceMat = new THREE.MeshLambertMaterial({ color: 0x5c5c58 });

    // Mobilier urbain : un banc et une poubelle, chacun une géométrie unique
    // fusionnée une fois puis instanciée — un banc à trois pièces (assise,
    // dossier, pieds) ne coûte pas plus qu'un simple cube une fois placé en
    // InstancedMesh.
    const benchMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2c });
    const benchSeat = new THREE.BoxGeometry(1.5, 0.06, 0.5);
    benchSeat.translate(0, 0.46, 0);
    const benchBack = new THREE.BoxGeometry(1.5, 0.5, 0.05);
    benchBack.translate(0, 0.72, -0.24);
    const benchLegs = new THREE.BoxGeometry(1.42, 0.44, 0.44);
    benchLegs.translate(0, 0.22, 0);
    const benchGeo = mergeGeometries([benchSeat, benchBack, benchLegs]);
    const benches = new THREE.InstancedMesh(benchGeo, benchMat, blocks);
    benches.count = 0;

    const binMat = new THREE.MeshLambertMaterial({ color: 0x3d4a3e });
    const binGeo = new THREE.CylinderGeometry(0.28, 0.24, 0.75, 8);
    binGeo.translate(0, 0.375, 0);
    const bins = new THREE.InstancedMesh(binGeo, binMat, blocks);
    bins.count = 0;

    for (let i = -CITY.RINGS; i < CITY.RINGS; i++) {
      for (let j = -CITY.RINGS; j < CITY.RINGS; j++) {
        const cx = i * CITY.CELL + CITY.CELL / 2;
        const cz = j * CITY.CELL + CITY.CELL / 2;
        const key = districtAt(i, j);
        const d = DISTRICTS[key];
        const matIndex = districtKeys.indexOf(key);
        const isPark = this.rng() < d.park;

        const plate = plates[isPark ? 1 : 0];
        plateMatrix.makeTranslation(cx, 0.04, cz);
        plate.setMatrixAt(plate.count++, plateMatrix);

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

        // Un immeuble par style de façade, regroupé séparément : ça reste un
        // mesh par style effectivement présent dans l'îlot (un seul la plupart
        // du temps, jamais plus de trois), pas un par immeuble.
        const shellsByVariant = [[], [], []];
        const cornices = [];
        for (const [ox, oz, cw, cd] of cells) {
          const gap = 1.6 + this.rng() * 2;
          const w = Math.max(6, cw - gap);
          const dd = Math.max(6, cd - gap);
          const h = d.min + this.rng() * (d.max - d.min);
          const bx = cx + ox;
          const bz = cz + oz;
          const variant = Math.floor(this.rng() * VARIANTS);
          shellsByVariant[variant].push(this.addBuilding(bx, bz, w, dd, h, cx, cz));

          if (h > 30 && this.rng() < 0.5) {
            plateMatrix.makeTranslation(bx, h + 4, bz);
            masts.setMatrixAt(masts.count++, plateMatrix);
            plateMatrix.makeTranslation(bx, h + 8.4, bz);
            beacons.setMatrixAt(beacons.count++, plateMatrix);
          } else if (this.rng() < 0.4) {
            const cornice = new THREE.BoxGeometry(w + 1.2, 0.8, dd + 1.2);
            cornice.translate(bx - cx, h + 0.4, bz - cz);
            cornices.push(cornice);
          }
        }

        for (let v = 0; v < VARIANTS; v++) {
          const shells = shellsByVariant[v];
          if (!shells.length) continue;
          const mesh = new THREE.Mesh(mergeGeometries(shells), this.buildingMats[matIndex][v]);
          mesh.position.set(cx, 0, cz);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          this.scene.add(mesh);
        }
        if (cornices.length) {
          const mesh = new THREE.Mesh(mergeGeometries(cornices), corniceMat);
          mesh.position.set(cx, 0, cz);
          mesh.castShadow = true;
          this.scene.add(mesh);
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

        // Banc et poubelle : sur un autre côté que la voiture garée, avec le
        // même schéma de position par côté, pour ne pas s'entasser toujours
        // au même endroit du trottoir.
        const furnitureSide = (side + 1 + Math.floor(this.rng() * 3)) % 4;
        const along2 = (this.rng() - 0.5) * 30;
        const furniture =
          furnitureSide === 0 ? { x: cx + along2, z: cz - off, rot: 0 }
          : furnitureSide === 1 ? { x: cx + along2, z: cz + off, rot: Math.PI }
          : furnitureSide === 2 ? { x: cx - off, z: cz + along2, rot: -Math.PI / 2 }
          : { x: cx + off, z: cz + along2, rot: Math.PI / 2 };
        const roll = this.rng();
        if (roll < 0.55) {
          plateMatrix.compose(
            new THREE.Vector3(furniture.x, 0, furniture.z),
            new THREE.Quaternion().setFromEuler(new THREE.Euler(0, furniture.rot, 0)),
            new THREE.Vector3(1, 1, 1)
          );
          benches.setMatrixAt(benches.count++, plateMatrix);
        } else if (roll < 0.75) {
          plateMatrix.makeTranslation(furniture.x, 0, furniture.z);
          bins.setMatrixAt(bins.count++, plateMatrix);
        }
      }
    }

    for (const mesh of plates) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.count) this.scene.add(mesh);
    }
    masts.instanceMatrix.needsUpdate = true;
    beacons.instanceMatrix.needsUpdate = true;
    this.scene.add(masts, beacons);
    benches.instanceMatrix.needsUpdate = true;
    bins.instanceMatrix.needsUpdate = true;
    if (benches.count) this.scene.add(benches);
    if (bins.count) this.scene.add(bins);

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
    const leafMat = (this.leafMat = new THREE.MeshLambertMaterial({ color: 0x3f7a3a, flatShading: true }));
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, positions.length);
    const leaves = (this.leaves = new THREE.InstancedMesh(leafGeo, leafMat, positions.length));
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

    const w = this.weatherMods;

    // Les nuages assombrissent le ciel et éteignent le soleil.
    const overcast = new THREE.Color(0x646a74);
    this.skyUniforms.topColor.value.lerp(overcast, w.fogGrey * 0.92);
    this.skyUniforms.midColor.value.lerp(overcast, w.fogGrey * 0.96);
    this.skyUniforms.bottomColor.value.lerp(overcast, w.fogGrey);

    this.sun.color.setHex(a.sun).lerp(new THREE.Color(b.sun), t);
    this.sun.intensity = THREE.MathUtils.lerp(a.sunI, b.sunI, t) * w.sunMul;
    this.hemi.intensity = THREE.MathUtils.lerp(a.hemi, b.hemi, t) * (1 - w.fogGrey * 0.25);

    const fog = new THREE.Color(a.fog).lerp(new THREE.Color(b.fog), t).lerp(overcast, w.fogGrey * 0.7);
    if (!this.scene.fog) this.scene.fog = new THREE.FogExp2(fog.getHex(), 0.0032);
    this.scene.fog.color.copy(fog);

    // Éclair : il éclaire vraiment la scène, il ne se contente pas de blanchir
    // l'écran. Le soleil et le ciel prennent le flash, donc les ombres portées
    // suivent le temps de l'éclair.
    const flash = w.flash || 0;
    if (flash > 0) {
      this.sun.intensity += flash * 2.6;
      this.hemi.intensity += flash * 1.8;
      const bolt = new THREE.Color(0xdde8ff);
      this.skyUniforms.topColor.value.lerp(bolt, flash * 0.7);
      this.skyUniforms.midColor.value.lerp(bolt, flash * 0.75);
      this.skyUniforms.bottomColor.value.lerp(bolt, flash * 0.6);
    }

    const s = this.seasonMods;

    // Bitume mouillé : il fonce et attrape un reflet. La neige le recouvre.
    this.groundMat.shininess = w.wet * 70 * (1 - s.snow * 0.7);
    this.groundMat.specular.setRGB(w.wet * 0.42, w.wet * 0.45, w.wet * 0.5);
    this.groundMat.color.setHex(0x41464f).multiplyScalar(1 - w.wet * 0.16);
    if (s.snow > 0) this.groundMat.color.lerp(new THREE.Color(0xdfe6ee), s.snow * 0.72);
    if (this.sidewalkMat) {
      this.sidewalkMat.color.setHex(0x9a9a92).lerp(new THREE.Color(0xeef3f8), s.snow * 0.88);
    }

    // Nuit : fenêtres et lampadaires s'allument, étoiles apparaissent.
    const night = THREE.MathUtils.clamp((0.55 - this.sun.intensity) / 0.5, 0, 1);
    this.night = night;
    this.scene.fog.density = 0.0030 + night * 0.0016 + w.fogAdd;
    for (const row of this.buildingMats) for (const mat of row) mat.emissiveIntensity = night * 0.95;
    this.lampMat.color.setRGB(0.16 + night * 0.84, 0.17 + night * 0.72, 0.2 + night * 0.4);
    this.lampPoolMat.opacity = night * 0.16;
    this.starMat.opacity = night * 0.85 * (1 - this.weatherMods.fogGrey);
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
