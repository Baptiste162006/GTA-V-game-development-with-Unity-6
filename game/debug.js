import * as THREE from 'three';
import { Vehicle, VEHICLE_SPECS } from './vehicle.js';
import { GameEvents, EVENTS } from './events.js';

// Console de triche / debug : touche ² ou ` pour ouvrir.
export class DebugConsole {
  constructor(game) {
    this.game = game;
    this.el = document.getElementById('console');
    this.input = document.getElementById('console-input');
    this.log = document.getElementById('console-log');
    this.history = [];
    this.historyIndex = -1;

    this.commands = {
      help: () => `Commandes : ${Object.keys(this.commands).join(', ')}`,
      god: () => {
        game.godMode = !game.godMode;
        if (game.godMode) game.player.health = 100;
        return `Mode dieu : ${game.godMode ? 'ON' : 'OFF'}`;
      },
      noclip: () => {
        game.noclip = !game.noclip;
        return `Noclip véhicule : ${game.noclip ? 'ON' : 'OFF'}`;
      },
      money: (n) => this.setMoney(Number(n) || 0, true),
      setmoney: (n) => this.setMoney(Number(n) || 0, false),
      heal: () => {
        game.player.health = 100;
        game.player.armor = 100;
        return 'Vie et armure au max';
      },
      stars: (n) => {
        const target = THREE.MathUtils.clamp(parseInt(n, 10) || 0, 0, 5);
        game.police.clear();
        if (target > 0) game.police.addCrime(target, game.playerPos());
        return `Niveau de recherche : ${target}`;
      },
      clearwanted: () => {
        game.police.clear();
        return 'Recherche effacée';
      },
      spawn: (type = 'sportive') => {
        if (!VEHICLE_SPECS[type]) return `Types : ${Object.keys(VEHICLE_SPECS).join(', ')}`;
        const p = game.playerPos();
        const spot = new THREE.Vector3(p.x + 6, 0, p.z + 6);
        game.traffic.parked.push(new Vehicle(game.scene, type, spot, 0));
        return `${VEHICLE_SPECS[type].label} apparue à côté de toi`;
      },
      tp: (x, z) => {
        const pos = game.player.inVehicle ? game.player.inVehicle.pos : game.player.pos;
        pos.set(Number(x) || 0, 0, Number(z) || 0);
        return `Téléporté en ${pos.x}, ${pos.z}`;
      },
      time: (h) => {
        game.world.hour = THREE.MathUtils.clamp(Number(h) || 0, 0, 24);
        return `Heure : ${game.world.clock}`;
      },
      weather: (name) => {
        if (!name) return `Météo actuelle : ${game.weather.label}`;
        return game.weather.set(name, true)
          ? `Météo : ${game.weather.label}`
          : 'Météos : clear, cloudy, rain, fog';
      },
      job: () => {
        game.missions.offerJob();
        return 'Nouveau job proposé';
      },
      fps: () => {
        const el = document.getElementById('fps');
        el.hidden = !el.hidden;
        return `Compteur FPS : ${el.hidden ? 'OFF' : 'ON'}`;
      },
      stats: () => JSON.stringify(game.stats, null, 1),
    };

    addEventListener('keydown', (e) => {
      if (e.code === 'Backquote' || e.key === '²') {
        e.preventDefault();
        this.toggle();
        return;
      }
      if (this.el.hidden) return;
      if (e.code === 'Enter') this.submit();
      if (e.code === 'ArrowUp') this.recall(-1);
      if (e.code === 'ArrowDown') this.recall(1);
    });
  }

  setMoney(amount, relative) {
    const p = this.game.player;
    p.money = Math.max(0, relative ? p.money + amount : amount);
    GameEvents.emit(EVENTS.MONEY, p.money);
    return `Argent : ${p.money} $`;
  }

  toggle() {
    this.el.hidden = !this.el.hidden;
    if (this.el.hidden) {
      this.game.input.enabled = true;
      if (this.game.state === 'playing') this.game.renderer.domElement.requestPointerLock();
    } else {
      this.game.input.enabled = false;
      this.game.input.release();
      this.input.value = '';
      this.input.focus();
      this.print('Tape "help" pour la liste des commandes.');
    }
  }

  recall(dir) {
    if (!this.history.length) return;
    this.historyIndex = THREE.MathUtils.clamp(this.historyIndex + dir, 0, this.history.length - 1);
    this.input.value = this.history[this.historyIndex];
  }

  submit() {
    const raw = this.input.value.trim();
    if (!raw) return;
    this.history.push(raw);
    this.historyIndex = this.history.length;
    this.input.value = '';
    this.print(`> ${raw}`);

    const [name, ...args] = raw.split(/\s+/);
    const fn = this.commands[name.toLowerCase()];
    if (!fn) {
      this.print(`Commande inconnue : ${name}`);
      return;
    }
    try {
      this.print(String(fn(...args)));
    } catch (err) {
      this.print(`Erreur : ${err.message}`);
    }
  }

  print(text) {
    const line = document.createElement('div');
    line.textContent = text;
    this.log.appendChild(line);
    this.log.scrollTop = this.log.scrollHeight;
    while (this.log.childElementCount > 40) this.log.firstChild.remove();
  }
}
