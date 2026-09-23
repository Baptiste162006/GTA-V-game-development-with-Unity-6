import * as THREE from 'three';
import { World, CITY } from './world.js';
import { Player, ThirdPersonCamera } from './player.js';
import { Traffic } from './traffic.js';
import { Police } from './police.js';
import { MissionManager } from './missions.js';
import { WeatherSystem } from './weather.js';
import { WeaponSystem, WEAPONS } from './weapons.js';
import { Enemies } from './enemies.js';
import { VehicleEffects } from './vehicleEffects.js';
import { Settings } from './settings.js';
import { PauseMenu } from './menu.js';
import { Performance, applyPreset } from './performance.js';
import { HUD } from './hud.js';
import { Input } from './input.js';
import { AudioEngine } from './audio.js';
import { GameEvents, EVENTS } from './events.js';
import { DebugConsole } from './debug.js';

const SAVE_KEY = 'san-felipe-save-v1';
const HOSPITAL = new THREE.Vector3(-CITY.CELL * 2 + 9, 0, CITY.CELL * 2);
const STATION = new THREE.Vector3(CITY.CELL * 2 + 9, 0, -CITY.CELL * 2);

class Game {
  constructor(restored = {}) {
    this.state = 'menu';
    this.stats = {
      timePlayed: 0,
      distanceDriven: 0,
      vehiclesStolen: 0,
      missionsCompleted: 0,
      escapes: 0,
      moneyEarned: 0,
      busted: 0,
      wasted: 0,
      kills: 0,
      shotsFired: 0,
      shotsHit: 0,
      ...(restored.stats || {}),
    };

    this.setupRenderer();
    this.world = new World(this.scene);
    this.player = new Player(this.scene, this.world, new THREE.Vector3(9, 0, 18));
    this.camera3p = new ThirdPersonCamera(this.camera, this.world);
    this.traffic = new Traffic(this.scene, this.world);
    this.police = new Police(this.scene, this.world, this.traffic);
    this.weather = new WeatherSystem(this.scene, this.world);
    this.enemies = new Enemies(this.scene, this.world, this.traffic);
    this.weapons = new WeaponSystem(this.scene, this.camera, this.player);
    this.vehicleFx = new VehicleEffects(this.scene);
    this.audio = new AudioEngine();
    this.input = new Input(this.renderer.domElement);
    this.hud = new HUD();
    this.missions = new MissionManager(this.scene, {
      player: this.player,
      police: this.police,
      traffic: this.traffic,
      world: this.world,
      scene: this.scene,
      audio: this.audio,
    });
    this.debug = new DebugConsole(this);
    this.settings = new Settings();
    this.menu = new PauseMenu(this);
    this.shakeScale = 1;
    this.baseFov = 64;
    this.perf = new Performance(this);
    this.settings.onChange = (key, value) => {
      this.settings.apply(this);
      if (key === 'quality' && value !== 'auto') applyPreset(this, value);
    };
    this.settings.apply(this);
    if (this.settings.get('quality') !== 'auto') applyPreset(this, this.settings.get('quality'));

    if (restored.money) this.player.money = restored.money;
    if (restored.hour !== undefined) this.world.hour = restored.hour;

    this.wireEvents();
    this.wireUI();
    this.hud.setMoney(this.player.money);

    this.clock = new THREE.Clock();
    this.fpsAccum = 0;
    this.fpsFrames = 0;
    this.respawnTimer = 0;
    this.godMode = false;
    this.noclip = false;

    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  setupRenderer() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(64, innerWidth / innerHeight, 0.4, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    document.getElementById('stage').appendChild(this.renderer.domElement);

    addEventListener('resize', () => {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
    });
  }

  wireEvents() {
    this.police.onStarChange = (now, before) => {
      if (now > before) {
        this.audio.star();
        GameEvents.emit(EVENTS.NOTIFY, { text: `Niveau de recherche : ${now} étoile${now > 1 ? 's' : ''}` });
      } else if (now === 0) {
        this.stats.escapes++;
        GameEvents.emit(EVENTS.NOTIFY, { text: 'Tu as semé la police' });
      }
    };
    this.player.onDamage = (amount, from, cause) => {
      if (cause) this.lastCause = cause;
      if (!from || amount < 1) return;
      // Angle du tir dans le repère de la caméra : 0 = pile devant.
      const to = from.clone().sub(this.playerPos());
      const camYaw = this.camera3p.yaw;
      this.hud.damageFrom(Math.atan2(to.x, to.z) - camYaw - Math.PI);
    };

    this.police.onBusted = () => this.busted();
    this.police.onShot = () => this.audio.blip(180, 0.06, 'sawtooth', 0.08);

    this.traffic.onPedHit = () => {
      this.police.addCrime(1, this.playerPos());
      GameEvents.emit(EVENTS.NOTIFY, { text: 'Délit de fuite' });
    };

    this.police.onOfficerDown = () => {
      this.police.addCrime(1, this.playerPos());
      GameEvents.emit(EVENTS.NOTIFY, { text: 'Agent abattu' });
    };

    this.enemies.onKill = (enemy) => {
      const loot = 60 + Math.floor(Math.random() * 140);
      this.player.money += loot;
      this.stats.moneyEarned += loot;
      this.stats.kills++;
      GameEvents.emit(EVENTS.MONEY, this.player.money);
      GameEvents.emit(EVENTS.NOTIFY, { text: `Ennemi éliminé  ·  + ${loot} $` });
      // Le milieu ne prévient pas la police : pas d'étoile pour un règlement de comptes.
      this.traffic.scarePedestrians(enemy.position, 24);
    };
    this.enemies.onShoot = () => this.audio.blip(190, 0.05, 'sawtooth', 0.07);

    this.weapons.onShot = (name) => {
      this.audio.gunshot(name);
      this.traffic.scarePedestrians(this.player.pos, 26);
      if (this.police.searching) this.police.searchCenter.copy(this.playerPos());
    };
    this.weapons.onDry = () => this.audio.blip(140, 0.05, 'square', 0.06);
    this.weapons.onHit = (target, damage, head) => {
      target.applyDamage(damage, this.player.pos);
      this.stats.shotsHit++;
      this.hud.hitMarker(head);
      this.audio.blip(head ? 900 : 420, 0.05, 'square', 0.07);
      if (head) GameEvents.emit(EVENTS.NOTIFY, { text: 'Tir à la tête' });
      if (target.kind === 'ped') {
        this.police.addCrime(2, this.playerPos());
        GameEvents.emit(EVENTS.NOTIFY, { text: 'Meurtre — témoins' });
      }
    };

    GameEvents.on(EVENTS.MISSION_DONE, ({ reward }) => {
      this.stats.missionsCompleted++;
      this.stats.moneyEarned += reward;
      this.save();
    });
  }

  wireUI() {
    document.getElementById('start-button').addEventListener('click', () => this.startGame());
    document.getElementById('respawn-button').addEventListener('click', () => this.respawn());
    const mute = document.getElementById('mute-toggle');
    mute.addEventListener('change', () => this.audio.setMuted(!mute.checked));

    // On ne met en pause que si le curseur était vraiment capturé : une demande
    // de capture refusée (fenêtre sans focus, respawn) ne doit pas figer le jeu.
    document.addEventListener('pointerlockchange', () => {
      const locked = this.input.locked;
      // Pendant la séquence de mort on relâche le curseur volontairement :
      // ce n'est pas une demande de pause.
      if (!locked && this.hadLock && this.state === 'playing' && !this.down) this.pause();
      this.hadLock = locked;
    });
  }

  // --- cycle de vie ---

  startGame() {
    document.getElementById('start-screen').hidden = true;
    this.audio.start();
    this.state = 'playing';
    this.renderer.domElement.requestPointerLock();
    this.missions.startTutorial();
    GameEvents.emit(EVENTS.NOTIFY, { text: 'Bienvenue à San Felipe' });
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.input.release();
    this.menu.open();
    this.audio.updateEngine(false, 0, 0);
    this.audio.updateSiren(0, 0);
    this.save();
  }

  resume() {
    this.menu.close();
    this.state = 'playing';
    this.renderer.domElement.requestPointerLock();
  }

  statsHtml() {
    const m = Math.floor(this.stats.timePlayed / 60);
    const s = Math.floor(this.stats.timePlayed % 60);
    const rows = [
      ['Temps de jeu', `${m} min ${String(s).padStart(2, '0')} s`],
      ['Missions terminées', this.stats.missionsCompleted],
      ['Véhicules volés', this.stats.vehiclesStolen],
      ['Distance au volant', `${(this.stats.distanceDriven / 1000).toFixed(2)} km`],
      ['Fois semé la police', this.stats.escapes],
      ['Arrestations', this.stats.busted],
      ['Hôpital', this.stats.wasted],
      ['Argent gagné', `${this.stats.moneyEarned.toLocaleString('fr-FR')} $`],
    ];
    return rows.map(([k, v]) => `<div class="stat"><span>${k}</span><b>${v}</b></div>`).join('');
  }

  // --- état joueur ---

  playerPos() {
    return this.player.inVehicle ? this.player.inVehicle.pos : this.player.pos;
  }

  enterVehicle(vehicle) {
    const occupied = this.traffic.isOccupied(vehicle);
    if (occupied) {
      this.traffic.ejectDriver(vehicle);
      this.police.addCrime(1, vehicle.pos);
      this.traffic.scarePedestrians(vehicle.pos, 20);
      GameEvents.emit(EVENTS.NOTIFY, { text: 'Carjacking !' });
    }
    vehicle.claimed = true;
    vehicle.fx = this.vehicleFx;
    this.player.inVehicle = vehicle;
    this.player.setVisible(false);
    this.stats.vehiclesStolen++;
    vehicle.onCrash = (force) => {
      this.audio.crash(force);
      if (force > 0.35 && !this.godMode) this.player.damage(force * 14);
    };
    this.camera3p.targetDistance = 8.5;
    GameEvents.emit(EVENTS.ENTER_VEHICLE, vehicle);
  }

  exitVehicle() {
    const v = this.player.inVehicle;
    if (!v) return;
    const spot = v.exitPosition();
    this.player.pos.set(spot.x, 0, spot.z);
    this.world.collideCircle(this.player.pos, 0.5);
    this.player.inVehicle = null;
    this.player.setVisible(true);
    v.onCrash = null;
    v.fx = null;
    this.camera3p.targetDistance = 6.5;
    GameEvents.emit(EVENTS.EXIT_VEHICLE, v);
  }

  // Mort et arrestation partagent la même séquence : on fige le jeu, on
  // explique ce qui s'est passé, puis on réapparaît. `this.down` garantit
  // qu'elle ne se déclenche jamais deux fois.
  busted() {
    if (this.state !== 'playing' || this.godMode || this.down) return;
    this.stats.busted++;
    this.beginDown({
      eyebrow: 'Interpellation',
      title: 'Arrêté',
      cause: 'La police t’a mis la main dessus.',
      fee: 250,
      point: STATION,
      failText: 'Tu as été arrêté',
    });
  }

  wasted(cause = 'Tu as été abattu.') {
    if (this.down || this.godMode) return;
    this.stats.wasted++;
    this.beginDown({
      eyebrow: 'Conséquence',
      title: 'Vous êtes inconscient',
      cause,
      fee: 500,
      point: HOSPITAL,
      failText: 'Tu es mort',
    });
  }

  beginDown({ eyebrow, title, cause, fee, point, failText }) {
    this.down = { point, timer: 0 };
    this.player.money = Math.max(0, this.player.money - fee);
    GameEvents.emit(EVENTS.MONEY, this.player.money);
    this.audio.fail();
    this.audio.updateEngine(false, 0, 0);
    if (this.missions.active) this.missions.fail(failText);

    // Le personnage s'effondre sur place.
    this.player.setVisible(true);
    this.player.mesh.rotation.z = Math.PI / 2 - 0.15;
    this.player.mesh.position.y = 0.35;

    document.getElementById('death-eyebrow').textContent = eyebrow;
    document.getElementById('death-title').textContent = title;
    document.getElementById('death-cause').textContent = cause;
    document.getElementById('death-list').innerHTML = [
      ['Frais', `- ${fee} $`],
      ['Argent restant', `${this.player.money.toLocaleString('fr-FR')} $`],
      ['Réapparition', point === STATION ? 'Commissariat' : 'Hôpital'],
    ]
      .map(([k, v]) => `<div class="stat"><span>${k}</span><b>${v}</b></div>`)
      .join('');

    document.getElementById('respawn-button').disabled = true;
    document.getElementById('death-screen').hidden = false;
    this.input.release();
    this.save();
  }

  updateDown(dt) {
    this.down.timer += dt;
    const button = document.getElementById('respawn-button');
    if (this.down.timer > 1.6 && button.disabled) button.disabled = false;
    if (this.down.timer > 4.5) this.respawn();
  }

  respawn() {
    if (!this.down) return;
    const point = this.down.point;
    this.down = null;
    document.getElementById('death-screen').hidden = true;

    this.exitVehicle();
    this.police.clear();
    this.player.mesh.rotation.z = 0;
    this.player.mesh.position.y = 0;
    this.player.pos.copy(point);
    this.player.health = 100;
    this.player.armor = 0;
    this.player.alive = true;
    this.player.vy = 0;
    // Trois secondes d'invulnérabilité : on ne remeurt pas à peine relevé.
    this.player.invulnerable = 3;
    document.getElementById('invuln').hidden = false;
    this.renderer.domElement.requestPointerLock();
    this.save();
  }

  // --- sauvegarde (best effort : le localStorage peut être bloqué) ---

  save() {
    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({ money: this.player.money, stats: this.stats, hour: this.world.hour })
      );
    } catch {
      /* stockage indisponible : on joue sans sauvegarde */
    }
  }

  static loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  snapshot() {
    return { money: this.player.money, stats: this.stats, hour: this.world.hour };
  }

  // --- boucle ---

  update(dt) {
    const input = this.input;

    if (input.justPressed('KeyP') || input.justPressed('Escape')) {
      this.state === 'playing' ? this.pause() : this.resume();
      return;
    }
    if (this.state !== 'playing') return;

    if (this.down) {
      this.updateDown(dt);
      this.camera3p.update(dt, this.player.pos, 1.2);
      this.world.update(dt, this.playerPos());
      return; // plus aucune commande pendant la séquence
    }

    if (this.player.invulnerable > 0) {
      this.player.invulnerable -= dt;
      if (this.player.invulnerable <= 0) document.getElementById('invuln').hidden = true;
    }

    this.stats.timePlayed += dt;
    this.camera3p.handleMouse(input.mouse);

    const vehicle = this.player.inVehicle;

    if (input.justPressed('KeyF')) {
      if (vehicle) this.exitVehicle();
      else {
        const near = this.traffic.nearestVehicle(this.player.pos, 4.2);
        if (near) this.enterVehicle(near);
      }
    }
    if (vehicle && input.justPressed('KeyH')) this.audio.blip(330, 0.35, 'square', 0.1);

    if (vehicle) {
      vehicle.gripMul = this.weather.grip;
      vehicle.update(dt, { throttle: input.axisY, steer: input.axisX, handbrake: input.handbrake }, this.noclip ? null : this.world);
      vehicle.setLights(this.world.night > 0.3);
      vehicle.sirenOn = false;
      this.stats.distanceDriven += vehicle.travelled || 0;
      this.traffic.hitPedestrians(vehicle, true);
      this.player.pos.copy(vehicle.pos);
      this.camera3p.update(dt, vehicle.pos, 1.9, Math.min(3, Math.abs(vehicle.speed) / 12));
      this.audio.updateEngine(true, Math.min(1, Math.abs(vehicle.speed) / vehicle.spec.top), Math.max(0, input.axisY));
    } else {
      this.player.update(dt, input, this.camera3p.yaw);
      this.combat(dt, input);
      // Visée : caméra épaule, champ resserré, et le joueur regarde où on vise.
      const aiming = this.weapons.aiming;
      if (aiming) this.player.yaw = this.camera3p.yaw;
      this.camera3p.update(dt, this.player.pos, aiming ? 1.68 : 1.5, aiming ? -4 : 0, aiming ? 0.85 : 0);
      const fov = aiming ? (this.weapons.spec.scope ? this.baseFov * 0.4 : this.baseFov * 0.75) : this.baseFov;
      this.camera.fov += (fov - this.camera.fov) * (1 - Math.exp(-11 * dt));
      this.camera.updateProjectionMatrix();
      this.audio.updateEngine(false, 0, 0);
    }

    // La météo pilote le monde, l'adhérence, la vue de la police et les trottoirs.
    this.weather.update(dt, this.playerPos());
    this.police.sightMul = this.weather.sight;
    this.traffic.pedBudget = Math.round((this.pedCap || 18) * (1 - this.weather.rain * 0.65 - this.weather.fog * 0.2));
    this.traffic.pedHurry = 1 + this.weather.rain * 0.8;

    this.traffic.update(dt, this.playerPos(), vehicle, this.playerPos());
    this.police.update(dt, this.player);
    this.enemies.update(dt, this.player, this.playerPos(), this.camera);
    this.missions.update(dt);
    this.world.update(dt, this.playerPos());
    this.audio.updateSiren(this.police.sirenProximity, performance.now() / 1000);
    this.audio.updateRain(this.weather.rain);
    this.vehicleFx.update(dt);
    // Crissement de pneus quand ça patine vraiment.
    if (vehicle && vehicle.slip > 0.5) this.audio.skid(vehicle.slip);
    else this.audio.skid(0);

    // Régénération lente hors poursuite.
    if (!this.police.searching && this.player.health < 100) this.player.heal(dt * 1.6);
    if (!this.player.alive) {
      this.player.alive = true;
      this.wasted(this.lastCause || 'Tu as été abattu.');
    }

    this.updatePrompt();
    this.hud.update(dt, {
      player: this.player,
      world: this.world,
      police: this.police,
      traffic: this.traffic,
      missions: this.missions,
      weather: this.weather,
      weapons: this.weapons,
      vehicle,
    });
  }

  // Toutes les cibles tirables du moment, dans un format commun.
  combatTargets() {
    return [
      ...this.enemies.alive(),
      ...this.police.officers.filter((o) => o.dead <= 0),
      ...this.traffic.combatTargets(),
    ];
  }

  combat(dt, input) {
    const w = this.weapons;
    w.aiming = input.aiming && !w.spec.melee;

    if (input.justPressed('KeyR')) w.reload();
    if (input.mouse.wheel && !w.aiming) w.cycle(Math.sign(input.mouse.wheel));
    for (let slot = 0; slot < 6; slot++) {
      if (input.justPressed(`Digit${slot + 1}`)) w.select(slot);
    }

    const wantsFire = w.spec.auto ? input.firing : input.justClicked(0);
    if (wantsFire && w.fire(this.combatTargets(), this.world)) {
      this.stats.shotsFired++;
      // Recul : la caméra part vers le haut, le joueur la ramène.
      this.camera3p.pitch = Math.max(-0.35, this.camera3p.pitch - w.recoil * this.shakeScale);
    }

    w.update(dt);
  }

  // Mode auto : on descend d'un cran si ça rame durablement, on remonte si
  // c'est large. Jamais en pleine poursuite, pour ne pas changer sous le nez.
  autoQuality(raw) {
    this.autoTimer = (this.autoTimer || 0) + raw;
    if (this.autoTimer < 6) return;
    this.autoTimer = 0;
    if (this.police.searching) return;
    const levels = ['faible', 'moyen', 'eleve'];
    const current = levels.indexOf(this.autoLevel || 'moyen');
    const fps = this.perf.fps;
    let next = current;
    if (fps && fps < 45 && current > 0) next = current - 1;
    else if (fps > 75 && current < 2) next = current + 1;
    if (next !== current) {
      this.autoLevel = levels[next];
      applyPreset(this, this.autoLevel);
      GameEvents.emit(EVENTS.NOTIFY, { text: `Qualité ajustée : ${this.autoLevel}` });
    }
  }

  mapState() {
    return {
      player: this.player,
      police: this.police,
      traffic: this.traffic,
      missions: this.missions,
      world: this.world,
    };
  }

  updatePrompt() {
    if (this.player.inVehicle) {
      this.hud.setPrompt('F : sortir du véhicule   ·   H : klaxon');
      return;
    }
    const near = this.traffic.nearestVehicle(this.player.pos, 4.2);
    if (near) {
      const occupied = this.traffic.isOccupied(near);
      this.hud.setPrompt(`F : ${occupied ? 'éjecter le conducteur' : 'monter'} — ${near.spec.label}`);
    } else {
      this.hud.setPrompt('');
    }
  }

  loop() {
    requestAnimationFrame(this.loop);
    const raw = this.clock.getDelta();
    const dt = Math.min(0.05, raw);

    // Le compteur utilise le temps réel : avec le dt plafonné il annoncerait
    // toujours 20 FPS dès que l'affichage rame.
    this.perf.sample(raw);
    if (this.settings.get('quality') === 'auto') this.autoQuality(raw);
    this.fpsAccum += raw;
    this.fpsFrames++;
    if (this.fpsAccum > 0.5) {
      this.fps = Math.round(this.fpsFrames / this.fpsAccum);
      this.fpsAccum = 0;
      this.fpsFrames = 0;
      const el = document.getElementById('fps');
      if (el && !el.hidden) el.textContent = `${this.fps} FPS`;
    }

    this.update(dt);
    this.input.endFrame();
    this.renderer.render(this.scene, this.camera);
  }
}

function boot(restored) {
  const game = new Game(restored || Game.loadSave());
  window.game = game; // pratique pour la console de debug
  window.claude?.hot?.snapshot?.(() => game.snapshot());
}

if (window.claude?.hot?.ready) window.claude.hot.ready(boot);
else boot(window.claude?.hot?.data);
