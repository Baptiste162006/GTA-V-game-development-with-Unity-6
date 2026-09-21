import { GameEvents, EVENTS } from './events.js';
import { CITY, MAX_LINE } from './world.js';

const MAP_SCALE = 1.45; // pixels par mètre

export class HUD {
  constructor() {
    this.el = {
      health: document.getElementById('health-fill'),
      armor: document.getElementById('armor-fill'),
      money: document.getElementById('money'),
      stars: document.getElementById('stars'),
      clock: document.getElementById('clock'),
      district: document.getElementById('district'),
      weather: document.getElementById('weather'),
      weaponBox: document.getElementById('weapon-box'),
      weaponName: document.getElementById('weapon-name'),
      ammo: document.getElementById('ammo'),
      crosshair: document.getElementById('crosshair'),
      hitmarker: document.getElementById('hitmarker'),
      damageArc: document.getElementById('damage-arc'),
      speedBox: document.getElementById('speed-box'),
      speed: document.getElementById('speed'),
      gear: document.getElementById('gear'),
      objective: document.getElementById('objective'),
      objectiveText: document.getElementById('objective-text'),
      objectiveTimer: document.getElementById('objective-timer'),
      prompt: document.getElementById('prompt'),
      notifications: document.getElementById('notifications'),
      big: document.getElementById('big-message'),
      bigTitle: document.getElementById('big-title'),
      bigSub: document.getElementById('big-sub'),
      damage: document.getElementById('damage-vignette'),
      minimap: document.getElementById('minimap'),
    };
    this.ctx2d = this.el.minimap.getContext('2d');
    this.bigTimer = 0;

    GameEvents.on(EVENTS.NOTIFY, ({ text }) => this.notify(text));
    GameEvents.on(EVENTS.MONEY, (money) => this.setMoney(money));
    GameEvents.on(EVENTS.BIG_MESSAGE, (payload) => this.bigMessage(payload));
    GameEvents.on(EVENTS.OBJECTIVE, ({ text, time }) => this.setObjective(text, time));
  }

  setMoney(money) {
    this.el.money.textContent = `$ ${money.toLocaleString('fr-FR')}`;
    this.el.money.classList.remove('flash');
    // Relance l'animation en forçant un reflow.
    void this.el.money.offsetWidth;
    this.el.money.classList.add('flash');
  }

  setObjective(text, time = 0) {
    this.el.objective.hidden = !text;
    this.el.objectiveText.textContent = text || '';
    if (time > 0) {
      const m = Math.floor(time / 60);
      const s = Math.floor(time % 60);
      this.el.objectiveTimer.hidden = false;
      this.el.objectiveTimer.textContent = `${m}:${String(s).padStart(2, '0')}`;
    } else {
      this.el.objectiveTimer.hidden = true;
    }
  }

  notify(text) {
    const div = document.createElement('div');
    div.className = 'notif';
    div.textContent = text;
    this.el.notifications.appendChild(div);
    setTimeout(() => div.classList.add('out'), 3200);
    setTimeout(() => div.remove(), 3900);
  }

  bigMessage({ title, sub = '', tone = 'good' }) {
    this.el.big.hidden = false;
    this.el.big.dataset.tone = tone;
    this.el.bigTitle.textContent = title;
    this.el.bigSub.textContent = sub;
    this.bigTimer = 2.8;
  }

  // Confirmation de touche : croix brève au centre, plus large et rouge à la tête.
  hitMarker(critical) {
    const el = this.el.hitmarker;
    el.hidden = false;
    el.classList.toggle('crit', !!critical);
    el.style.animation = 'none';
    void el.offsetWidth; // relance l'animation
    el.style.animation = '';
    clearTimeout(this.hitTimer);
    this.hitTimer = setTimeout(() => { el.hidden = true; }, 240);
  }

  // angle en radians : 0 = le tir vient de devant, positif = de la droite.
  damageFrom(angle) {
    const el = this.el.damageArc;
    el.hidden = false;
    el.style.transform = `translate(-50%, -50%) rotate(${(angle * 180) / Math.PI - 90}deg)`;
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
    clearTimeout(this.arcTimer);
    this.arcTimer = setTimeout(() => { el.hidden = true; }, 780);
  }

  setPrompt(text) {
    this.el.prompt.hidden = !text;
    this.el.prompt.textContent = text || '';
  }

  update(dt, state) {
    const { player, world, police, vehicle, weather, weapons } = state;

    this.el.health.style.width = `${Math.max(0, player.health)}%`;
    this.el.armor.style.width = `${Math.max(0, player.armor)}%`;
    this.el.clock.textContent = world.clock;
    this.el.district.textContent = world.districtName(player.pos.x, player.pos.z);
    if (weather) this.el.weather.textContent = weather.label;

    if (this.stars !== police.wanted) {
      this.stars = police.wanted;
      this.el.stars.innerHTML = '';
      for (let i = 0; i < 5; i++) {
        const s = document.createElement('span');
        s.className = i < police.wanted ? 'star on' : 'star';
        s.textContent = '★';
        this.el.stars.appendChild(s);
      }
    }

    this.el.speedBox.hidden = !vehicle;
    if (vehicle) {
      this.el.speed.textContent = Math.round(vehicle.speedKmh);
      const ratio = vehicle.speedKmh / (vehicle.spec.top * 3.6);
      this.el.gear.textContent = vehicle.speed < -0.5 ? 'R' : Math.max(1, Math.ceil(ratio * 6));
    }

    if (weapons) {
      this.el.weaponBox.hidden = !!vehicle;
      this.el.crosshair.hidden = !!vehicle || weapons.spec.melee;
      this.el.crosshair.dataset.aim = weapons.aiming ? 'on' : 'off';
      this.el.weaponName.textContent = weapons.spec.label;
      const empty = !weapons.spec.melee && weapons.magazine === 0 && weapons.reloading <= 0;
      this.el.ammo.textContent = empty ? 'RECHARGER' : weapons.hudAmmo;
      this.el.ammo.classList.toggle('low', !weapons.spec.melee && weapons.magazine <= 3);
      this.el.ammo.classList.toggle('reloading', weapons.reloading > 0);
    }

    const hurt = 1 - player.health / 100;
    this.el.damage.style.opacity = (hurt * hurt * 0.75).toFixed(3);

    if (this.bigTimer > 0) {
      this.bigTimer -= dt;
      if (this.bigTimer <= 0) this.el.big.hidden = true;
    }

    this.drawMinimap(state);
  }

  drawMinimap({ player, police, traffic, missions, world }) {
    const c = this.ctx2d;
    const size = this.el.minimap.width;
    const half = size / 2;
    const px = player.inVehicle ? player.inVehicle.pos.x : player.pos.x;
    const pz = player.inVehicle ? player.inVehicle.pos.z : player.pos.z;

    const toMap = (x, z) => [half + (x - px) * MAP_SCALE, half + (z - pz) * MAP_SCALE];

    c.clearRect(0, 0, size, size);
    c.save();
    c.beginPath();
    c.arc(half, half, half - 1, 0, Math.PI * 2);
    c.clip();

    c.fillStyle = '#1b1f27';
    c.fillRect(0, 0, size, size);

    // Îlots (donc les rues restent en négatif).
    c.fillStyle = '#2b313c';
    const range = Math.ceil(half / MAP_SCALE / CITY.CELL) + 1;
    const ci = Math.round(px / CITY.CELL);
    const cj = Math.round(pz / CITY.CELL);
    for (let i = ci - range; i <= ci + range; i++) {
      for (let j = cj - range; j <= cj + range; j++) {
        if (Math.abs(i) > CITY.RINGS || Math.abs(j) > CITY.RINGS) continue;
        const bx = i * CITY.CELL + CITY.CELL / 2;
        const bz = j * CITY.CELL + CITY.CELL / 2;
        const [mx, my] = toMap(bx - CITY.BLOCK / 2, bz - CITY.BLOCK / 2);
        c.fillRect(mx, my, CITY.BLOCK * MAP_SCALE, CITY.BLOCK * MAP_SCALE);
      }
    }

    // Zone de recherche policière.
    if (police.searching && police.searchRadius > 0) {
      const [sx, sy] = toMap(police.searchCenter.x, police.searchCenter.z);
      c.beginPath();
      c.arc(sx, sy, police.searchRadius * MAP_SCALE, 0, Math.PI * 2);
      c.fillStyle = 'rgba(255, 70, 60, 0.16)';
      c.fill();
      c.strokeStyle = 'rgba(255, 90, 74, 0.85)';
      c.lineWidth = 2;
      c.stroke();
    }

    // Circulation puis police, pour que les bleus passent au-dessus.
    c.fillStyle = '#7d8592';
    for (const car of traffic.cars) {
      const [x, y] = toMap(car.vehicle.pos.x, car.vehicle.pos.z);
      c.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
    c.fillStyle = '#e8e2d5';
    for (const v of traffic.parked) {
      const [x, y] = toMap(v.pos.x, v.pos.z);
      c.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
    for (const unit of police.units) {
      const [x, y] = toMap(unit.vehicle.pos.x, unit.vehicle.pos.z);
      c.fillStyle = Math.sin(performance.now() / 120) > 0 ? '#5aa2ff' : '#ff5a4a';
      c.beginPath();
      c.arc(x, y, 3, 0, Math.PI * 2);
      c.fill();
    }

    // Objectif : point plein si à l'écran, flèche au bord sinon.
    if (missions.markerPos) {
      const [mx, my] = toMap(missions.markerPos.x, missions.markerPos.z);
      const dx = mx - half;
      const dy = my - half;
      const d = Math.hypot(dx, dy);
      const color = `#${missions.markerColor.toString(16).padStart(6, '0')}`;
      c.fillStyle = color;
      if (d < half - 8) {
        c.beginPath();
        c.arc(mx, my, 4.5, 0, Math.PI * 2);
        c.fill();
      } else {
        const k = (half - 9) / d;
        const ex = half + dx * k;
        const ey = half + dy * k;
        const ang = Math.atan2(dy, dx);
        c.save();
        c.translate(ex, ey);
        c.rotate(ang);
        c.beginPath();
        c.moveTo(6, 0);
        c.lineTo(-4, 4);
        c.lineTo(-4, -4);
        c.closePath();
        c.fill();
        c.restore();
      }
    }

    // Joueur : triangle orienté.
    const yaw = player.inVehicle ? player.inVehicle.yaw : player.yaw;
    c.save();
    c.translate(half, half);
    c.rotate(-yaw + Math.PI);
    c.fillStyle = '#ff7a45';
    c.beginPath();
    c.moveTo(0, -7);
    c.lineTo(5, 6);
    c.lineTo(0, 3.5);
    c.lineTo(-5, 6);
    c.closePath();
    c.fill();
    c.restore();

    // Bord de carte.
    const [bx0, by0] = toMap(-MAX_LINE - CITY.CELL / 2, -MAX_LINE - CITY.CELL / 2);
    const span = (MAX_LINE * 2 + CITY.CELL) * MAP_SCALE;
    c.strokeStyle = 'rgba(232, 226, 213, 0.25)';
    c.lineWidth = 1;
    c.strokeRect(bx0, by0, span, span);

    c.restore();
  }
}
