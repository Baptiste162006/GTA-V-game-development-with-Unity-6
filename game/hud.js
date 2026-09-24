import { GameEvents, EVENTS } from './events.js';
import { CITY, MAX_LINE } from './world.js';
import { color, healthColor } from './uiTheme.js';

const MAP_SCALE = 1.45; // pixels par mètre

const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

// Angle de cap (0-2π, sens horaire depuis le nord = haut de la mini-carte
// nord fixe) à partir du yaw du jeu. C'est exactement l'angle déjà utilisé
// pour orienter le triangle du joueur sur la mini-carte (`c.rotate(heading)`
// fait pointer un repère "haut" vers l'avant réel) — on le réutilise ici
// pour la boussole et pour faire tourner la carte en mode « suit le cap ».
export function compassHeading(yaw) {
  const twoPi = Math.PI * 2;
  const rad = (((-yaw + Math.PI) % twoPi) + twoPi) % twoPi;
  const deg = Math.round((rad * 180) / Math.PI);
  const cardinal = CARDINALS[Math.round(deg / 45) % 8];
  return { rad, deg, cardinal };
}

// Polygone régulier : sert à donner une forme propre à chaque marqueur de la
// carte — hexagone pour un objectif, losange pour la police.
function polygon(c, x, y, r, sides, rotation = 0) {
  c.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = rotation + (i / sides) * Math.PI * 2;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
}

// Étoile à cinq branches : contacts de l'histoire, une forme qu'aucun autre
// repère de la carte n'utilise.
function star(c, x, y, r) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
}

function drawContact(c, x, y, r) {
  c.fillStyle = color('money');
  star(c, x, y, r);
  c.fill();
  c.strokeStyle = color('ground');
  c.lineWidth = 1;
  c.stroke();
}

export class HUD {
  constructor() {
    this.el = {
      health: document.getElementById('health-fill'),
      healthValue: document.getElementById('health-value'),
      healthLabel: document.getElementById('health-label'),
      armor: document.getElementById('armor-fill'),
      armorValue: document.getElementById('armor-value'),
      money: document.getElementById('money'),
      stars: document.getElementById('stars'),
      clock: document.getElementById('clock'),
      district: document.getElementById('district'),
      compass: document.getElementById('compass'),
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
      objectiveDistance: document.getElementById('objective-distance'),
      objectiveTimer: document.getElementById('objective-timer'),
      reloadBar: document.getElementById('reload-bar'),
      reloadFill: document.getElementById('reload-fill'),
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

  // Fondu à l'entrée et à la sortie, ~2,6 s affichée : le réticule (au centre)
  // n'est jamais couvert, et rien ici ne bloque les commandes — le panneau
  // hérite de `pointer-events: none` du HUD.
  notify(text) {
    const div = document.createElement('div');
    div.className = 'notif';
    div.textContent = text;
    this.el.notifications.appendChild(div);
    // Un frame de retard : sans ça, le navigateur applique l'état final
    // directement et la transition n'a rien à animer.
    requestAnimationFrame(() => requestAnimationFrame(() => div.classList.add('in')));
    setTimeout(() => { div.classList.remove('in'); div.classList.add('out'); }, 2600);
    setTimeout(() => div.remove(), 3100);
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
    const { player, world, police, vehicle, weather, weapons, settings } = state;

    // La jauge dit trois choses à la fois : longueur, couleur par palier et
    // valeur chiffrée. Qui ne distingue pas la teinte lit le nombre.
    const vie = Math.max(0, Math.round(player.health));
    const armure = Math.max(0, Math.round(player.armor));
    this.el.health.style.width = `${vie}%`;
    this.el.health.style.background = healthColor(vie / 100);
    this.el.armor.style.width = `${armure}%`;
    if (this.el.healthValue) this.el.healthValue.textContent = vie;
    if (this.el.armorValue) this.el.armorValue.textContent = armure;
    if (this.el.healthLabel) this.el.healthLabel.classList.toggle('low', vie <= 25);
    this.el.clock.textContent = world.clock;
    this.el.district.textContent = world.districtName(player.pos.x, player.pos.z);
    if (weather) this.el.weather.textContent = weather.label;

    const yaw = vehicle ? vehicle.yaw : player.yaw;
    const heading = compassHeading(yaw);
    if (this.el.compass) {
      this.el.compass.textContent = `${heading.cardinal} ${String(heading.deg).padStart(3, '0')}°`;
    }
    this.minimapFollow = settings ? !!settings.get('minimapFollow') : false;

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
      const reloadRatio = weapons.reloading > 0 ? 1 - weapons.reloading / weapons.spec.reload : 0;
      this.el.reloadBar.hidden = weapons.reloading <= 0;
      this.el.reloadFill.style.width = `${Math.round(reloadRatio * 100)}%`;
    }

    const marker = state.missions?.markerPos;
    if (marker && !this.el.objective.hidden) {
      const from = vehicle ? vehicle.pos : player.pos;
      const dist = Math.hypot(marker.x - from.x, marker.z - from.z);
      this.el.objectiveDistance.hidden = false;
      this.el.objectiveDistance.textContent = dist < 1000 ? `${Math.round(dist)} m` : `${(dist / 1000).toFixed(1)} km`;
    } else {
      this.el.objectiveDistance.hidden = true;
    }

    const hurt = 1 - player.health / 100;
    this.el.damage.style.opacity = (hurt * hurt * 0.75).toFixed(3);

    if (this.bigTimer > 0) {
      this.bigTimer -= dt;
      if (this.bigTimer <= 0) this.el.big.hidden = true;
    }

    this.drawMinimap(state);
  }

  // Carte du menu pause : toute la ville d'un coup, pas une fenêtre glissante.
  drawBigMap(canvas, { player, police, traffic, missions }) {
    const c = canvas.getContext('2d');
    const size = canvas.width;
    const span = MAX_LINE * 2 + CITY.CELL;
    const scale = size / span;
    const toMap = (x, z) => [(x + span / 2) * scale, (z + span / 2) * scale];

    c.fillStyle = color('map-bg');
    c.fillRect(0, 0, size, size);

    c.fillStyle = color('map-road');
    for (let i = -CITY.RINGS; i < CITY.RINGS; i++) {
      for (let j = -CITY.RINGS; j < CITY.RINGS; j++) {
        const [mx, my] = toMap(i * CITY.CELL + CITY.CELL / 2 - CITY.BLOCK / 2, j * CITY.CELL + CITY.CELL / 2 - CITY.BLOCK / 2);
        c.fillRect(mx, my, CITY.BLOCK * scale, CITY.BLOCK * scale);
      }
    }

    if (police.searching && police.searchRadius > 0) {
      const [sx, sy] = toMap(police.searchCenter.x, police.searchCenter.z);
      c.beginPath();
      c.arc(sx, sy, police.searchRadius * scale, 0, Math.PI * 2);
      c.fillStyle = color('danger') + '2e';
      c.fill();
      c.strokeStyle = color('danger');
      c.stroke();
    }

    c.fillStyle = color('map-block');
    for (const car of traffic.cars) {
      const [x, y] = toMap(car.vehicle.pos.x, car.vehicle.pos.z);
      c.fillRect(x - 1, y - 1, 2, 2);
    }

    for (const contact of missions.contacts || []) {
      const [cx, cy] = toMap(contact.pos.x, contact.pos.z);
      drawContact(c, cx, cy, 8);
    }

    if (missions.markerPos) {
      const [mx, my] = toMap(missions.markerPos.x, missions.markerPos.z);
      c.fillStyle = color('objective');
      polygon(c, mx, my, 6, 6, Math.PI / 6);
      c.fill();
      c.strokeStyle = color('ink');
      c.lineWidth = 1;
      c.stroke();
    }

    const pos = player.inVehicle ? player.inVehicle.pos : player.pos;
    const [px, py] = toMap(pos.x, pos.z);
    const yaw = player.inVehicle ? player.inVehicle.yaw : player.yaw;
    c.save();
    c.translate(px, py);
    c.rotate(-yaw + Math.PI);
    c.fillStyle = color('accent');
    c.beginPath();
    c.moveTo(0, -8);
    c.lineTo(6, 7);
    c.lineTo(0, 4);
    c.lineTo(-6, 7);
    c.closePath();
    c.fill();
    c.restore();
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

    c.fillStyle = color('map-bg');
    c.fillRect(0, 0, size, size);

    // Mode « suit le cap » : tout le contenu (îlots, véhicules, objectif,
    // bord de carte) tourne pour que l'avant du joueur pointe vers le haut ;
    // seul le triangle du joueur compense cette rotation pour rester vertical.
    // Le cercle de découpe ci-dessus n'a pas besoin d'être dans ce bloc : il
    // est symétrique par rotation, donc inchangé quel que soit le mode.
    const yaw = player.inVehicle ? player.inVehicle.yaw : player.yaw;
    const heading = compassHeading(yaw).rad;
    const mapRotation = this.minimapFollow ? -heading : 0;
    c.save();
    c.translate(half, half);
    c.rotate(mapRotation);
    c.translate(-half, -half);

    // Îlots (donc les rues restent en négatif).
    c.fillStyle = color('map-road');
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
      c.fillStyle = color('danger') + '29';
      c.fill();
      c.strokeStyle = color('danger');
      c.lineWidth = 2;
      c.stroke();
    }

    // Circulation puis police, pour que les bleus passent au-dessus.
    c.fillStyle = color('map-block');
    for (const car of traffic.cars) {
      const [x, y] = toMap(car.vehicle.pos.x, car.vehicle.pos.z);
      c.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
    c.fillStyle = color('ink');
    for (const v of traffic.parked) {
      const [x, y] = toMap(v.pos.x, v.pos.z);
      c.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
    // Police : losange, et non un rond — la forme suffit à la reconnaître.
    for (const unit of police.units) {
      const [x, y] = toMap(unit.vehicle.pos.x, unit.vehicle.pos.z);
      c.fillStyle = Math.sin(performance.now() / 120) > 0 ? color('police') : color('danger');
      polygon(c, x, y, 4, 4, 0);
      c.fill();
    }

    // Contacts de l'histoire : épinglés au bord quand ils sont hors champ,
    // pour qu'on sache toujours dans quelle direction chercher.
    for (const contact of missions.contacts || []) {
      let [cx, cy] = toMap(contact.pos.x, contact.pos.z);
      const d = Math.hypot(cx - half, cy - half);
      const edge = half - 10;
      if (d > edge) {
        cx = half + ((cx - half) * edge) / d;
        cy = half + ((cy - half) * edge) / d;
      }
      drawContact(c, cx, cy, d > edge ? 5 : 6.5);
    }

    // Objectif : point plein si à l'écran, flèche au bord sinon.
    if (missions.markerPos) {
      const [mx, my] = toMap(missions.markerPos.x, missions.markerPos.z);
      const dx = mx - half;
      const dy = my - half;
      const d = Math.hypot(dx, dy);
      // Hexagone, pas un rond : sur la carte chaque catégorie a sa forme, pour
      // rester distinguable sans compter sur la couleur seule.
      c.fillStyle = color('objective');
      if (d < half - 8) {
        polygon(c, mx, my, 5, 6, Math.PI / 6);
        c.fill();
        c.strokeStyle = color('ink');
        c.lineWidth = 1;
        c.stroke();
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

    // Bord de carte.
    const [bx0, by0] = toMap(-MAX_LINE - CITY.CELL / 2, -MAX_LINE - CITY.CELL / 2);
    const span = (MAX_LINE * 2 + CITY.CELL) * MAP_SCALE;
    c.strokeStyle = color('map-edge');
    c.lineWidth = 1;
    c.strokeRect(bx0, by0, span, span);

    c.restore(); // fin du bloc tourné (mapRotation)

    // Joueur : triangle orienté. En mode « suit le cap », `heading` et
    // `mapRotation` s'annulent : le triangle pointe toujours vers le haut.
    c.save();
    c.translate(half, half);
    c.rotate(heading + mapRotation);
    c.fillStyle = color('accent');
    c.beginPath();
    c.moveTo(0, -7);
    c.lineTo(5, 6);
    c.lineTo(0, 3.5);
    c.lineTo(-5, 6);
    c.closePath();
    c.fill();
    c.restore();

    // Repère de nord, utile seulement quand la carte tourne : en mode nord
    // fixe, « en haut » veut déjà dire nord, pas besoin de le répéter.
    if (this.minimapFollow) {
      const r = half - 10;
      const nx = half + r * Math.sin(mapRotation);
      const ny = half - r * Math.cos(mapRotation);
      c.fillStyle = color('ink-dim');
      c.font = 'bold 11px sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('N', nx, ny);
    }

    c.restore(); // fin du cercle de découpe
  }
}
