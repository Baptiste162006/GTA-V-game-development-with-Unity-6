import { DEFINITIONS } from './settings.js';

const SECTIONS = [
  { id: 'resume', label: 'Reprendre', action: 'resume' },
  { id: 'map', label: 'Carte' },
  { id: 'missions', label: 'Missions' },
  { id: 'stats', label: 'Statistiques' },
  { id: 'options', label: 'Options' },
  { id: 'controls', label: 'Commandes' },
  { id: 'restart', label: 'Recommencer', confirm: 'Recommencer la partie ? La progression non sauvegardée sera perdue.', action: 'restart' },
];

// Menu pause : colonne de navigation à gauche, contenu à droite. Tout est
// construit ici, en vrais <button> pour rester utilisable au clavier.
export class PauseMenu {
  constructor(game) {
    this.game = game;
    this.index = 0;
    this.section = 'stats';

    this.root = document.getElementById('pause-screen');
    this.nav = document.getElementById('pause-nav');
    this.panel = document.getElementById('pause-panel');
    this.title = document.getElementById('pause-title');
    this.confirmBox = document.getElementById('pause-confirm');

    this.buttons = SECTIONS.map((section, i) => {
      const b = document.createElement('button');
      b.className = 'nav-item';
      b.textContent = section.label;
      b.addEventListener('click', () => this.choose(i));
      b.addEventListener('mouseenter', () => this.highlight(i));
      this.nav.appendChild(b);
      return b;
    });

    addEventListener('keydown', (e) => this.onKey(e));
    this.highlight(3); // Statistiques par défaut
  }

  get visible() {
    return !this.root.hidden;
  }

  open() {
    this.root.hidden = false;
    this.confirmBox.hidden = true;
    this.show(this.section);
    this.buttons[this.index].focus();
  }

  close() {
    this.root.hidden = true;
    this.confirmBox.hidden = true;
  }

  onKey(e) {
    if (!this.visible) return;
    if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
      e.preventDefault();
      const dir = e.code === 'ArrowDown' ? 1 : -1;
      this.highlight((this.index + dir + this.buttons.length) % this.buttons.length);
    } else if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      this.choose(this.index);
    }
  }

  highlight(i) {
    this.index = i;
    this.buttons.forEach((b, k) => b.classList.toggle('on', k === i));
    this.buttons[i].focus();
    this.show(SECTIONS[i].id);
  }

  choose(i) {
    this.highlight(i);
    const section = SECTIONS[i];
    if (section.confirm) {
      this.askConfirm(section.confirm, () => this.run(section.action));
      return;
    }
    if (section.action) this.run(section.action);
  }

  run(action) {
    if (action === 'resume') this.game.resume();
    if (action === 'restart') location.reload();
  }

  askConfirm(question, onYes) {
    this.confirmBox.hidden = false;
    this.confirmBox.innerHTML = '';
    const text = document.createElement('p');
    text.textContent = question;
    const row = document.createElement('div');
    row.className = 'row';
    const yes = document.createElement('button');
    yes.textContent = 'Confirmer';
    yes.addEventListener('click', onYes);
    const no = document.createElement('button');
    no.className = 'ghost';
    no.textContent = 'Annuler';
    no.addEventListener('click', () => {
      this.confirmBox.hidden = true;
      this.buttons[this.index].focus();
    });
    row.append(yes, no);
    this.confirmBox.append(text, row);
    yes.focus();
  }

  show(id) {
    this.section = id;
    const g = this.game;
    this.title.textContent = SECTIONS.find((s) => s.id === id)?.label ?? '';
    this.panel.innerHTML = '';

    if (id === 'stats') this.panel.innerHTML = g.statsHtml();
    else if (id === 'missions') this.renderMissions();
    else if (id === 'options') this.renderOptions();
    else if (id === 'controls') this.renderControls();
    else if (id === 'map') this.renderMap();
    else this.panel.innerHTML = '<p class="note">Appuie sur Entrée pour reprendre la partie.</p>';
  }

  row(label, value) {
    return `<div class="stat"><span>${label}</span><b>${value}</b></div>`;
  }

  renderMissions() {
    const g = this.game;
    const objectif = g.missions.objective || 'Aucune mission en cours';
    this.panel.innerHTML =
      this.row('Objectif', objectif) +
      this.row('Missions terminées', g.stats.missionsCompleted) +
      this.row('Argent gagné', `${g.stats.moneyEarned.toLocaleString('fr-FR')} $`) +
      '<p class="note">Les jobs réapparaissent tout seuls. Tape <b>job</b> dans la console pour en relancer un.</p>';
  }

  renderControls() {
    const lines = [
      ['Se déplacer', 'Z Q S D / W A S D'],
      ['Courir · marcher', 'Maj · Ctrl'],
      ['Sauter · frein à main', 'Espace'],
      ['Monter / sortir', 'F'],
      ['Klaxon', 'H'],
      ['Tirer · viser', 'Clic gauche · clic droit'],
      ['Recharger', 'R'],
      ['Changer d’arme', 'Molette ou 1-6'],
      ['Pause', 'P ou Échap'],
      ['Console', '² ou `'],
    ];
    this.panel.innerHTML = lines.map(([a, b]) => this.row(a, b)).join('');
  }

  renderMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 420;
    canvas.height = 420;
    canvas.className = 'bigmap';
    this.panel.appendChild(canvas);
    this.game.hud.drawBigMap(canvas, this.game.mapState());
    const note = document.createElement('p');
    note.className = 'note';
    note.textContent = `Quartier : ${this.game.world.districtName(this.game.player.pos.x, this.game.player.pos.z)}`;
    this.panel.appendChild(note);
  }

  renderOptions() {
    const settings = this.game.settings;
    const groups = {};
    for (const [key, def] of Object.entries(DEFINITIONS)) {
      (groups[def.group] ||= []).push([key, def]);
    }

    for (const [group, entries] of Object.entries(groups)) {
      const h = document.createElement('p');
      h.className = 'eyebrow';
      h.textContent = group;
      this.panel.appendChild(h);

      for (const [key, def] of entries) {
        const line = document.createElement('label');
        line.className = 'option';
        const name = document.createElement('span');
        name.textContent = def.label;
        line.appendChild(name);

        if (def.type === 'toggle') {
          const input = document.createElement('input');
          input.type = 'checkbox';
          input.id = `opt-${key}`;
          input.checked = settings.get(key);
          input.addEventListener('change', () => settings.set(key, input.checked));
          line.appendChild(input);
        } else {
          const input = document.createElement('input');
          input.type = 'range';
          input.id = `opt-${key}`;
          input.min = def.min;
          input.max = def.max;
          input.step = def.step;
          input.value = settings.get(key);
          const out = document.createElement('b');
          out.textContent = `${settings.get(key)}${def.unit || ''}`;
          input.addEventListener('input', () => {
            settings.set(key, Number(input.value));
            out.textContent = `${input.value}${def.unit || ''}`;
          });
          line.append(input, out);
        }
        this.panel.appendChild(line);
      }
    }
  }
}
