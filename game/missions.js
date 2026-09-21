import * as THREE from 'three';
import { Vehicle } from './vehicle.js';
import { GameEvents, EVENTS } from './events.js';

const COLORS = { goto: 0x4aa8ff, vehicle: 0xffd166, deliver: 0x5cd97a, escape: 0xff5a4a };

// Cylindre lumineux posé au sol : le repère visuel des objectifs.
function buildMarker(color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.32, depthWrite: false });
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 14, 18, 1, true), mat);
  pillar.position.y = 7;
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(2.6, 20),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, depthWrite: false })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.08;
  g.add(pillar, disc);
  return g;
}

export class MissionManager {
  constructor(scene, ctx) {
    this.scene = scene;
    this.ctx = ctx; // { player, police, traffic, world, audio }
    this.marker = null;
    this.markerPos = null;
    this.markerColor = COLORS.goto;
    this.steps = [];
    this.index = -1;
    this.timeLeft = 0;
    this.objective = '';
    this.missionName = '';
    this.missionCar = null;
    this.completed = 0;
    this.tutorialDone = false;
  }

  // --- rendu du marqueur ---

  setMarker(pos, colorKey = 'goto') {
    this.clearMarker();
    if (!pos) return;
    this.markerColor = COLORS[colorKey];
    this.markerPos = pos.clone();
    this.marker = buildMarker(this.markerColor);
    this.marker.position.set(pos.x, 0, pos.z);
    this.scene.add(this.marker);
  }

  clearMarker() {
    if (this.marker) {
      this.scene.remove(this.marker);
      this.marker = null;
    }
    this.markerPos = null;
  }

  // --- pilotage des étapes ---

  start(name, steps) {
    this.missionName = name;
    this.steps = steps;
    this.index = -1;
    this.next();
  }

  next() {
    this.index++;
    if (this.index >= this.steps.length) {
      this.finish();
      return;
    }
    const step = this.steps[this.index];
    this.timeLeft = step.time ?? 0;
    this.objective = typeof step.text === 'function' ? step.text(this.ctx) : step.text;
    if (step.enter) step.enter(this.ctx, this);
    if (step.marker) this.setMarker(step.marker(this.ctx, this), step.color || 'goto');
    else this.clearMarker();
    GameEvents.emit(EVENTS.OBJECTIVE, { text: this.objective, time: this.timeLeft });
  }

  finish() {
    const reward = this.reward || 0;
    this.clearMarker();
    this.objective = '';
    this.steps = [];
    this.index = -1;
    this.completed++;
    if (reward) {
      this.ctx.player.money += reward;
      GameEvents.emit(EVENTS.MONEY, this.ctx.player.money);
    }
    GameEvents.emit(EVENTS.BIG_MESSAGE, { title: 'MISSION TERMINÉE', sub: reward ? `+ ${reward} $` : '', tone: 'good' });
    GameEvents.emit(EVENTS.MISSION_DONE, { name: this.missionName, reward });
    GameEvents.emit(EVENTS.OBJECTIVE, { text: '', time: 0 });
    this.ctx.audio.success();
    this.reward = 0;
    if (this.missionCar) this.missionCar = null;
    // Un job de plus disponible peu après.
    this.cooldown = 6;
  }

  fail(reason) {
    this.clearMarker();
    this.objective = '';
    this.steps = [];
    this.index = -1;
    GameEvents.emit(EVENTS.BIG_MESSAGE, { title: 'MISSION ÉCHOUÉE', sub: reason || '', tone: 'bad' });
    GameEvents.emit(EVENTS.OBJECTIVE, { text: '', time: 0 });
    this.ctx.audio.fail();
    this.cooldown = 8;
  }

  get active() {
    return this.index >= 0 && this.index < this.steps.length;
  }

  update(dt) {
    if (this.marker) {
      // Petite pulsation pour attirer l'oeil.
      const s = 1 + Math.sin(performance.now() / 320) * 0.06;
      this.marker.scale.set(s, 1, s);
      this.marker.rotation.y += dt * 0.4;
    }

    if (!this.active) {
      if (this.cooldown > 0) {
        this.cooldown -= dt;
        if (this.cooldown <= 0) this.offerJob();
      }
      return;
    }

    const step = this.steps[this.index];
    if (this.timeLeft > 0) {
      this.timeLeft -= dt;
      GameEvents.emit(EVENTS.OBJECTIVE, { text: this.objective, time: Math.max(0, this.timeLeft) });
      if (this.timeLeft <= 0) {
        this.fail('Temps écoulé');
        return;
      }
    }

    if (step.failIf && step.failIf(this.ctx, this)) {
      this.fail(step.failReason || '');
      return;
    }
    if (step.check(this.ctx, this)) this.next();
  }

  // --- contenu ---

  playerPos() {
    const p = this.ctx.player;
    return p.inVehicle ? p.inVehicle.pos : p.pos;
  }

  reachedMarker(radius = 5) {
    if (!this.markerPos) return false;
    const p = this.playerPos();
    return Math.hypot(p.x - this.markerPos.x, p.z - this.markerPos.z) < radius;
  }

  startTutorial() {
    const { world, traffic, scene } = this.ctx;
    this.reward = 500;
    let car = null;
    let dropPoint = null;

    this.start('Bienvenue à San Felipe', [
      {
        text: 'Rejoins le marqueur bleu à pied — ZQSD pour marcher, Maj pour courir',
        color: 'goto',
        marker: () => {
          const p = this.playerPos();
          return new THREE.Vector3(p.x + 26, 0, p.z + 18);
        },
        check: () => this.reachedMarker(5) && !this.ctx.player.inVehicle,
      },
      {
        text: 'Monte dans la voiture — approche-toi et appuie sur F',
        color: 'vehicle',
        enter: () => {
          const p = this.playerPos();
          const spot = new THREE.Vector3(p.x + 9, 0, p.z + 4);
          car = new Vehicle(scene, 'berline', spot, Math.PI / 2, 0x9c2f2f);
          traffic.parked.push(car);
          this.missionCar = car;
        },
        marker: () => car.pos,
        check: (ctx) => ctx.player.inVehicle === car,
      },
      {
        text: 'Conduis jusqu’au point vert',
        color: 'deliver',
        enter: () => {
          dropPoint = world.randomRoadPoint();
          const p = this.playerPos();
          // Assez loin pour prendre de la vitesse, assez près pour rester lisible.
          for (let i = 0; i < 12 && dropPoint.distanceTo(p) < 140; i++) dropPoint = world.randomRoadPoint();
        },
        marker: () => dropPoint,
        check: () => this.reachedMarker(8),
      },
      {
        text: 'La police t’a repéré ! Sors du cercle rouge et perds-la',
        color: 'escape',
        enter: (ctx) => {
          ctx.police.addCrime(1, this.playerPos());
          GameEvents.emit(EVENTS.BIG_MESSAGE, { title: 'RECHERCHÉ', sub: 'Sème la police', tone: 'warn' });
        },
        marker: () => null,
        check: (ctx) => ctx.police.wanted === 0,
      },
    ]);
    this.tutorialDone = true;
  }

  offerJob() {
    if (this.active) return;
    const { world, traffic, scene, player } = this.ctx;
    const kind = Math.random() < 0.55 ? 'livraison' : 'vol';

    if (kind === 'livraison') {
      const reward = 350 + Math.floor(Math.random() * 450);
      this.reward = reward;
      let pickup = world.randomRoadPoint();
      let drop = world.randomRoadPoint();
      for (let i = 0; i < 12 && drop.distanceTo(pickup) < 180; i++) drop = world.randomRoadPoint();

      this.start('Livraison express', [
        {
          text: `Livraison — récupère le colis (${reward} $ à la clé)`,
          color: 'goto',
          marker: () => pickup,
          check: () => this.reachedMarker(7),
        },
        {
          text: 'Livre le colis avant la fin du chrono',
          color: 'deliver',
          time: Math.max(50, Math.round(drop.distance(pickup) ?? 0) || Math.round(pickup.distanceTo(drop) / 9)),
          marker: () => drop,
          check: () => this.reachedMarker(8),
        },
      ]);
      GameEvents.emit(EVENTS.NOTIFY, { text: `Nouveau job : Livraison express — ${reward} $` });
    } else {
      const wanted = ['sportive', 'van', 'taxi'][Math.floor(Math.random() * 3)];
      const reward = wanted === 'sportive' ? 1200 : 650;
      this.reward = reward;
      let garage = world.randomRoadPoint();
      const label = { sportive: 'une sportive', van: 'une camionnette', taxi: 'un taxi' }[wanted];

      this.start('Commande du garage', [
        {
          text: `Le garage veut ${label}. Trouve-en une et prends le volant`,
          color: 'vehicle',
          marker: () => null,
          check: (ctx) => ctx.player.inVehicle && ctx.player.inVehicle.specName === wanted,
        },
        {
          text: `Amène ${label} au garage`,
          color: 'deliver',
          marker: () => garage,
          failIf: (ctx) => !ctx.player.inVehicle || ctx.player.inVehicle.specName !== wanted,
          failReason: 'Tu as abandonné le véhicule',
          check: () => this.reachedMarker(9),
        },
      ]);
      GameEvents.emit(EVENTS.NOTIFY, { text: `Nouveau job : Commande du garage — ${reward} $` });
    }
    this.ctx.audio.blip(880, 0.12, 'triangle', 0.09);
  }
}
