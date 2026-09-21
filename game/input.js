// Clavier physique (e.code) : marche en AZERTY comme en QWERTY.
const FORWARD = ['KeyW', 'KeyZ', 'ArrowUp'];
const BACK = ['KeyS', 'ArrowDown'];
const LEFT = ['KeyA', 'KeyQ', 'ArrowLeft'];
const RIGHT = ['KeyD', 'ArrowRight'];

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
  get handbrake() { return this.keys.has('Space'); }

  // Axe -1..1 : gauche/droite et avant/arrière.
  get axisX() { return (this.right ? 1 : 0) - (this.left ? 1 : 0); }
  get axisY() { return (this.forward ? 1 : 0) - (this.back ? 1 : 0); }

  justPressed(code) {
    return this.pressed.has(code);
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
