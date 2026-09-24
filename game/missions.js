import * as THREE from 'three';
import { Vehicle } from './vehicle.js';
import { GameEvents, EVENTS } from './events.js';
import { STORY, STORY_BY_ID } from './story.js';

const COLORS = { goto: 0x4aa8ff, vehicle: 0xffd166, deliver: 0x5cd97a, escape: 0xff5a4a, story: 0xffb020 };
const CONTACT_RADIUS = 4.5;
const CONTACT_REARM = 15; // il faut s'éloigner d'un contact avant qu'il puisse relancer une mission

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
    this.cooldown = 0;
    this.track = null;

    // Histoire : missions terminées, mission en cours, contacts visibles.
    this.storyDone = new Set();
    this.current = null;
    this.contacts = [];
    this.contactsArmed = false;
    this.wantedHint = 0;
    this.cleanups = [];
  }

  get tutorialDone() {
    return this.storyDone.has('intro');
  }

  set tutorialDone(done) {
    if (done) this.storyDone.add('intro');
    else this.storyDone.delete('intro');
  }

  // Appelé au lancement de la partie (neuve ou chargée).
  begin() {
    if (!this.tutorialDone) this.startStory(STORY_BY_ID.intro);
    else this.cooldown = 20;
    this.refreshContacts();
  }

  onCleanup(fn) {
    this.cleanups.push(fn);
  }

  runCleanups() {
    for (const fn of this.cleanups) fn();
    this.cleanups = [];
  }

  setObjective(text) {
    if (text === this.objective) return;
    this.objective = text;
    GameEvents.emit(EVENTS.OBJECTIVE, { text, time: Math.max(0, this.timeLeft) });
  }

  // --- histoire ---

  available() {
    return STORY.filter((d) => !this.storyDone.has(d.id) && d.requires.every((r) => this.storyDone.has(r)));
  }

  refreshContacts() {
    for (const c of this.contacts) this.scene.remove(c.marker);
    this.contacts = [];
    if (this.current) return;
    for (const def of this.available()) {
      // Le tutoriel se relance tout seul au démarrage ; son contact ne sert
      // qu'après un échec.
      const marker = buildMarker(COLORS.story);
      marker.scale.set(0.55, 0.8, 0.55);
      marker.position.set(def.where.x, 0, def.where.z);
      this.scene.add(marker);
      this.contacts.push({ def, pos: def.where, marker });
    }
  }

  startStory(def) {
    if (this.current) return;
    if (this.active) this.abort('Job abandonné');
    this.current = def;
    this.reward = def.reward;
    this.contactsArmed = false;
    this.refreshContacts();
    if (def.id !== 'intro') {
      GameEvents.emit(EVENTS.BIG_MESSAGE, { title: def.title.toUpperCase(), sub: `Contact : ${def.contact}`, tone: 'warn' });
      if (def.brief) GameEvents.emit(EVENTS.NOTIFY, { text: def.brief });
    }
    this.start(def.title, def.steps(this, this.ctx));
  }

  updateContacts(dt) {
    if (!this.contacts.length) return;
    const p = this.playerPos();
    let nearest = null;
    let nearestD = Infinity;
    for (const c of this.contacts) {
      c.marker.rotation.y += dt * 0.6;
      const d = Math.hypot(p.x - c.pos.x, p.z - c.pos.z);
      if (d < nearestD) {
        nearest = c;
        nearestD = d;
      }
    }
    if (!this.contactsArmed) {
      if (nearestD > CONTACT_REARM) this.contactsArmed = true;
      return;
    }
    if (nearestD > CONTACT_RADIUS) return;
    if (this.ctx.police.wanted > 0) {
      this.wantedHint -= dt;
      if (this.wantedHint <= 0) {
        this.wantedHint = 4;
        GameEvents.emit(EVENTS.NOTIFY, { text: `Sème la police avant de voir ${nearest.def.contact}` });
      }
      return;
    }
    this.startStory(nearest.def);
  }

  get storyProgress() {
    return { done: STORY.filter((d) => this.storyDone.has(d.id)).length, total: STORY.length };
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
    this.track = step.track || null;
    if (this.track) this.setMarker(this.track(this.ctx, this), step.color || 'goto');
    else if (step.marker) this.setMarker(step.marker(this.ctx, this), step.color || 'goto');
    else this.clearMarker();
    GameEvents.emit(EVENTS.OBJECTIVE, { text: this.objective, time: this.timeLeft });
  }

  finish() {
    const reward = this.reward || 0;
    const story = this.current;
    const before = new Set(this.available().map((d) => d.id));
    this.clearMarker();
    this.objective = '';
    this.steps = [];
    this.index = -1;
    this.track = null;
    this.completed++;
    this.runCleanups();
    if (story) {
      this.storyDone.add(story.id);
      this.current = null;
      this.contactsArmed = false;
      this.refreshContacts();
    }
    if (reward) {
      this.ctx.player.money += reward;
      GameEvents.emit(EVENTS.MONEY, this.ctx.player.money);
    }
    const title = story?.final ? 'HISTOIRE TERMINÉE' : 'MISSION TERMINÉE';
    GameEvents.emit(EVENTS.BIG_MESSAGE, { title, sub: reward ? `+ ${reward} $` : '', tone: 'good' });
    GameEvents.emit(EVENTS.MISSION_DONE, { name: this.missionName, reward, story: story?.id ?? null });
    for (const def of this.available()) {
      if (!before.has(def.id)) GameEvents.emit(EVENTS.NOTIFY, { text: `Nouvelle mission : ${def.title} — va voir ${def.contact}` });
    }
    GameEvents.emit(EVENTS.OBJECTIVE, { text: '', time: 0 });
    this.ctx.audio.success();
    this.reward = 0;
    if (this.missionCar) this.missionCar = null;
    // Un job de plus disponible peu après.
    this.cooldown = 6;
  }

  fail(reason) {
    const story = this.current;
    this.clearMarker();
    this.objective = '';
    this.steps = [];
    this.index = -1;
    this.track = null;
    this.reward = 0;
    this.runCleanups();
    GameEvents.emit(EVENTS.BIG_MESSAGE, { title: 'MISSION ÉCHOUÉE', sub: reason || '', tone: 'bad' });
    GameEvents.emit(EVENTS.OBJECTIVE, { text: '', time: 0 });
    this.ctx.audio.fail();
    this.cooldown = 8;
    if (story) {
      this.current = null;
      this.contactsArmed = false;
      this.refreshContacts();
      GameEvents.emit(EVENTS.NOTIFY, { text: `Retourne voir ${story.contact} pour réessayer` });
    }
  }

  // Un job (jamais une mission d'histoire) laissé de côté pour en lancer une autre.
  abort(reason) {
    this.clearMarker();
    this.objective = '';
    this.steps = [];
    this.index = -1;
    this.track = null;
    this.reward = 0;
    this.runCleanups();
    GameEvents.emit(EVENTS.OBJECTIVE, { text: '', time: 0 });
    if (reason) GameEvents.emit(EVENTS.NOTIFY, { text: reason });
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

    if (!this.current) this.updateContacts(dt);

    if (this.track && this.marker && this.active) {
      const p = this.track(this.ctx, this);
      if (p) {
        this.markerPos.set(p.x, 0, p.z);
        this.marker.position.set(p.x, 0, p.z);
      }
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
    this.startStory(STORY_BY_ID.intro);
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
          time: Math.max(50, Math.round(pickup.distanceTo(drop) / 9)),
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
