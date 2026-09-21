// Tout le son est synthétisé à la volée : aucun fichier audio à télécharger.
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.engineOn = false;
  }

  // Doit être appelé depuis un geste utilisateur (clic sur "Jouer").
  start() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();

    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);

    // Moteur : deux dents de scie désaccordées dans un passe-bas.
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0;
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 900;
    this.engineFilter.Q.value = 6;
    this.engineGain.connect(this.engineFilter).connect(this.master);
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = 'sawtooth';
    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = 'square';
    this.osc1.connect(this.engineGain);
    this.osc2.connect(this.engineGain);
    this.osc1.frequency.value = 60;
    this.osc2.frequency.value = 30;
    this.osc1.start();
    this.osc2.start();

    // Sirène : porteuse carrée modulée en deux tons.
    this.sirenGain = this.ctx.createGain();
    this.sirenGain.gain.value = 0;
    this.sirenGain.connect(this.master);
    this.siren = this.ctx.createOscillator();
    this.siren.type = 'square';
    this.siren.frequency.value = 700;
    this.siren.connect(this.sirenGain);
    this.siren.start();

    this.noiseBuffer = this.makeNoise();
  }

  makeNoise() {
    const len = this.ctx.sampleRate * 0.6;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    return buf;
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.5;
  }

  // rpm01 : régime normalisé 0..1. load : accélérateur enfoncé.
  updateEngine(inCar, rpm01, load) {
    if (!this.ctx) return;
    const target = inCar ? 0.09 + load * 0.05 : 0;
    const f = 55 + rpm01 * 320;
    const now = this.ctx.currentTime;
    this.engineGain.gain.setTargetAtTime(target, now, 0.08);
    this.osc1.frequency.setTargetAtTime(f, now, 0.05);
    this.osc2.frequency.setTargetAtTime(f * 0.5, now, 0.05);
    this.engineFilter.frequency.setTargetAtTime(500 + rpm01 * 2200, now, 0.08);
  }

  // proximity 0..1 : 0 = pas de police audible.
  updateSiren(proximity, t) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.sirenGain.gain.setTargetAtTime(proximity * 0.05, now, 0.15);
    if (proximity > 0.01) {
      this.siren.frequency.setTargetAtTime(Math.sin(t * 6) > 0 ? 780 : 560, now, 0.04);
    }
  }

  blip(freq = 660, dur = 0.08, type = 'square', vol = 0.12) {
    if (!this.ctx || this.muted) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
    o.connect(g).connect(this.master);
    o.start();
    o.stop(this.ctx.currentTime + dur);
  }

  crash(force = 1) {
    if (!this.ctx || this.muted) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const g = this.ctx.createGain();
    g.gain.value = Math.min(0.35, 0.1 + force * 0.25);
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 400 + force * 900;
    src.connect(f).connect(g).connect(this.master);
    src.start();
  }

  success() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.blip(f, 0.18, 'triangle', 0.1), i * 90));
  }

  fail() {
    [400, 300, 200].forEach((f, i) => setTimeout(() => this.blip(f, 0.25, 'sawtooth', 0.09), i * 130));
  }

  star() {
    this.blip(1200, 0.12, 'square', 0.1);
    setTimeout(() => this.blip(1600, 0.12, 'square', 0.1), 110);
  }
}
