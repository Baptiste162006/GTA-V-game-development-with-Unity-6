// Banc d'essai : scène figée, compteurs cumulés sur douze images.
// Usage : npx http-server -p 8123 -c-1 --silent .  puis  node bench.mjs
// Playwright n'est pas une dépendance du jeu : on le charge où il se trouve.
import pw from 'playwright';
import { writeFileSync } from 'node:fs';
const OUT = process.env.BENCH_OUT || 'bench.json';
const errors = [];
const b = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
p.on('console', (m) => m.type() === 'error' && !m.text().includes('CERT') && errors.push(m.text()));
await p.goto('http://127.0.0.1:8123/', { waitUntil: 'load' });
await p.waitForSelector('#start-button');
await p.waitForTimeout(3000);
await p.click('#start-button');
await p.waitForTimeout(1500);

const rows = await p.evaluate(() => {
  const g = window.game;
  const THREE_V3 = g.player.pos.constructor;
  g.godMode = true;
  g.renderer.info.autoReset = false;
  g.world.hour = 14;

  // Scène figée : aucune circulation, aucun piéton, caméra et position fixées.
  // Deux exécutions successives donnent alors exactement les mêmes compteurs.
  const freeze = (x, z) => {
    for (const c of [...g.traffic.cars]) c.vehicle.dispose(), c.driver && g.scene.remove(c.driver);
    g.traffic.cars.length = 0;
    for (const v of [...g.traffic.parked]) v.dispose();
    g.traffic.parked.length = 0;
    for (const ped of [...g.traffic.peds]) g.scene.remove(ped.mesh);
    g.traffic.peds.length = 0;
    g.traffic.maxCars = 0;
    g.traffic.pedBudget = 0;
    g.pedCap = 0;
    g.police.clear();
    g.enemies.list.length = 0;
    g.weather.set('clear', true);
    if (g.player.inVehicle) g.exitVehicle();
    g.player.pos.set(x, 0, z);
    g.camera3p.yaw = 0.8;
    g.camera3p.pitch = -0.08;
    g.camera3p.update(0.016, g.player.pos, 1.5);
    g.camera3p.update(0.016, g.player.pos, 1.5);
  };

  const measure = (label, x, z, quality) => {
    freeze(x, z);
    g.settings.set('quality', quality);
    // Pas de g.update() : la scène ne doit pas bouger entre les deux versions.
    g.renderer.render(g.scene, g.camera);
    const info = g.renderer.info;
    info.reset();
    let ms = 0;
    for (let i = 0; i < 12; i++) {
      const a = performance.now();
      g.renderer.render(g.scene, g.camera);
      ms += performance.now() - a;
    }
    let meshes = 0;
    g.scene.traverse((o) => { if (o.isMesh && o.visible) meshes++; });
    return {
      label, quality,
      drawCalls: Math.round(info.render.calls / 12),
      triangles: Math.round(info.render.triangles / 12),
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      programmes: info.programs ? info.programs.length : 0,
      meshesScene: meshes,
      shadowMap: g.world.sun.shadow.mapSize.x,
      renduMs: +(ms / 12).toFixed(1),
      memoireMo: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
    };
  };

  const out = [];
  for (const q of ['eleve', 'moyen', 'faible']) {
    out.push(measure('Centre dense (Downtown)', 0, 0, q));
    out.push(measure('Peripherie (Mirador Hills)', -260, -260, q));
  }

  // Coût d'un véhicule et d'un personnage, mesuré à l'unité.
  const before = { geo: g.renderer.info.memory.geometries };
  const cars = [];
  for (let i = 0; i < 10; i++) {
    g.debug.commands.spawn('berline');
    cars.push(g.traffic.parked[g.traffic.parked.length - 1]);
  }
  // Il faut dessiner avant de compter : Three.js n'enregistre une géométrie
  // qu'au moment où elle part vraiment sur la carte graphique.
  for (const car of cars) car.pos.set(g.player.pos.x + 4, 0, g.player.pos.z + 4);
  g.renderer.render(g.scene, g.camera);
  const afterCars = g.renderer.info.memory.geometries;
  out.push({ label: '10 berlines ajoutees', quality: '-', geometriesAjoutees: afterCars - before.geo, geometries: afterCars });

  const peds = [];
  for (let i = 0; i < 10; i++) peds.push(g.enemies.spawnSquad(new THREE_V3(g.player.pos.x + 6 + i, 0, g.player.pos.z + 6), 1, false)[0]);
  g.renderer.render(g.scene, g.camera);
  out.push({ label: '10 personnages ajoutes', quality: '-', geometriesAjoutees: g.renderer.info.memory.geometries - afterCars, geometries: g.renderer.info.memory.geometries });

  return out;
});

console.log(JSON.stringify(rows, null, 1));
if (OUT) writeFileSync(OUT, JSON.stringify(rows, null, 1));
console.log('erreurs', errors.length, errors.slice(0, 5).join(' | '));
await b.close();
