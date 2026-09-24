// Clavier physique (e.code) : marche en AZERTY comme en QWERTY.
const FORWARD = ['KeyW', 'KeyZ', 'ArrowUp'];
const BACK = ['KeyS', 'ArrowDown'];
const LEFT = ['KeyA', 'KeyQ', 'ArrowLeft'];
const RIGHT = ['KeyD', 'ArrowRight'];

const BINDS_KEY = 'san-felipe-keybinds-v1';

// Actions à touche unique qu'on laisse remapper depuis le menu Commandes.
// Le déplacement (multi-touches AZERTY/QWERTY), la course/marche (Maj/Ctrl)
// et la console de triche (fixe, documentée à part) restent en dehors :
// remapper une touche qui en recouvre déjà plusieurs ajouterait de
// l'ambiguïté sans gain réel.
export const DEFAULT_BINDS = {
  jump: 'Space',
  enterVehicle: 'KeyF',
  horn: 'KeyH',
  reload: 'KeyR',
  pause: 'KeyP',
};

export const REBINDABLE = [
  { id: 'jump', label: 'Sauter / frein à main' },
  { id: 'enterVehicle', label: 'Monter / sortir du véhicule' },
  { id: 'horn', label: 'Klaxon' },
  { id: 'reload', label: 'Recharger' },
  { id: 'pause', label: 'Pause' },
];

// Réservées : jamais assignables à une action remappable, pour ne pas casser
// le déplacement, les modificateurs, ou la fermeture du menu par Échap.
const RESERVED_CODES = new Set([...FORWARD, ...BACK, ...LEFT, ...RIGHT, 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'Escape', 'Backquote']);

const NAMED_CODES = {
  Space: 'Espace', Escape: 'Échap', Enter: 'Entrée', Tab: 'Tab',
  ShiftLeft: 'Maj (g)', ShiftRight: 'Maj (d)', ControlLeft: 'Ctrl (g)', ControlRight: 'Ctrl (d)',
  AltLeft: 'Alt', AltRight: 'Alt (d)',
  ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
  Backquote: '² / `', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']',
  Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/', Backslash: '\\',
};

// Libellé court d'un code clavier, pour l'afficher dans le menu Commandes.
export function codeLabel(code) {
  if (!code) return '?';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return `Pavé ${code.slice(6)}`;
  return NAMED_CODES[code] || code;
}

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set();
    this.mouse = { dx: 0, dy: 0, wheel: 0 };
    this.buttons = new Set();
    this.buttonsPressed = new Set();
    this.locked = false;
    this.enabled = true;

    this.binds = { ...DEFAULT_BINDS };
    this.loadBinds();

    addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      this.pressed.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());

    canvas.addEventListener('click', () => {
      if (this.enabled && !this.locked) canvas.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
    });
    addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.mouse.dx += e.movementX;
      this.mouse.dy += e.movementY;
    });
    addEventListener('wheel', (e) => {
      if (this.locked) {
        this.mouse.wheel += Math.sign(e.deltaY);
        e.preventDefault();
      }
    }, { passive: false });

    addEventListener('mousedown', (e) => {
      if (!this.locked) return;
      this.buttons.add(e.button);
      this.buttonsPressed.add(e.button);
    });
    addEventListener('mouseup', (e) => this.buttons.delete(e.button));
    addEventListener('contextmenu', (e) => this.locked && e.preventDefault());
  }

  get firing() { return this.buttons.has(0); }
  get aiming() { return this.buttons.has(2); }
  justClicked(button = 0) { return this.buttonsPressed.has(button); }

  any(codes) {
    return codes.some((c) => this.keys.has(c));
  }

  get forward() { return this.any(FORWARD); }
  get back() { return this.any(BACK); }
  get left() { return this.any(LEFT); }
  get right() { return this.any(RIGHT); }
  get run() { return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'); }
  get slow() { return this.keys.has('ControlLeft') || this.keys.has('ControlRight'); }
  get handbrake() { return this.keys.has(this.code('jump')); }

  // Axe -1..1 : gauche/droite et avant/arrière.
  get axisX() { return (this.right ? 1 : 0) - (this.left ? 1 : 0); }
  get axisY() { return (this.forward ? 1 : 0) - (this.back ? 1 : 0); }

  justPressed(code) {
    return this.pressed.has(code);
  }

  // --- remappage des touches ---

  code(action) {
    return this.binds[action] || DEFAULT_BINDS[action];
  }

  // `justPressedAction('jump')` plutôt que `justPressed(input.code('jump'))`
  // partout dans le reste du jeu.
  justPressedAction(action) {
    return this.pressed.has(this.code(action));
  }

  rebind(action, keyCode) {
    if (!(action in DEFAULT_BINDS)) return { ok: false, reason: 'Action inconnue' };
    if (RESERVED_CODES.has(keyCode)) {
      return { ok: false, reason: 'Réservée au déplacement, à Maj/Ctrl, à Échap ou à la console' };
    }
    for (const [id, bound] of Object.entries(this.binds)) {
      if (id !== action && bound === keyCode) {
        const label = REBINDABLE.find((r) => r.id === id)?.label || id;
        return { ok: false, reason: `Déjà utilisée pour « ${label} »` };
      }
    }
    this.binds[action] = keyCode;
    this.saveBinds();
    return { ok: true };
  }

  resetBinds() {
    this.binds = { ...DEFAULT_BINDS };
    this.saveBinds();
  }

  loadBinds() {
    try {
      const raw = localStorage.getItem(BINDS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      for (const { id } of REBINDABLE) {
        if (typeof parsed[id] === 'string') this.binds[id] = parsed[id];
      }
    } catch {
      /* stockage indisponible : on reste sur les touches par défaut */
    }
  }

  saveBinds() {
    try {
      localStorage.setItem(BINDS_KEY, JSON.stringify(this.binds));
    } catch {
      /* rien à faire : les touches ne seront simplement pas conservées */
    }
  }

  // Consomme les entrées transitoires : à appeler en fin de frame.
  endFrame() {
    this.pressed.clear();
    this.buttonsPressed.clear();
    this.mouse.dx = 0;
    this.mouse.dy = 0;
    this.mouse.wheel = 0;
  }

  release() {
    if (this.locked) document.exitPointerLock();
  }
}
