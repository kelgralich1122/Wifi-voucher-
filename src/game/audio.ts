/* LOVE RUSH — tiny Web Audio synth: SFX + looping chiptune romance theme. */

type ToneOpts = {
  freq: number;
  freqEnd?: number;
  type?: OscillatorType;
  dur?: number;
  vol?: number;
  delay?: number;
  attack?: number;
};

const N = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0,
  B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0,
  A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46,
  G5: 783.99, A5: 880.0, B5: 987.77, C6: 1046.5,
};

/* Cheerful 32-step melody + bass (one eighth per step, 112 BPM) */
const MELODY: (number | null)[] = [
  N.C5, N.E5, N.G5, N.E5, N.A5, N.G5, N.E5, N.D5,
  N.C5, N.E5, N.G5, N.E5, N.D5, N.E5, N.D5, null,
  N.F5, N.A5, N.C6, N.A5, N.G5, N.F5, N.A5, N.G5,
  N.E5, N.G5, N.C6, N.G5, N.E5, N.D5, N.C5, null,
];
const BASS: (number | null)[] = [
  N.C3, null, null, null, N.G3, null, N.A3, null,
  N.F3, null, N.G3, null, N.C3, null, N.G3, null,
  N.F3, null, null, null, N.C4, null, N.A3, null,
  N.F3, null, N.G3, null, N.C3, null, N.G3, null,
];

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxGain!: GainNode;
  private musicGain!: GainNode;
  private musicTimer: number | null = null;
  private step = 0;
  private nextStepTime = 0;
  muted = false;

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.55;
    this.sfxGain.connect(this.master);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.0;
    this.musicGain.connect(this.master);
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.02);
    }
  }

  private tone(o: ToneOpts) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + (o.delay ?? 0);
    const dur = o.dur ?? 0.15;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = o.type ?? "sine";
    osc.frequency.setValueAtTime(o.freq, t0);
    if (o.freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.freqEnd), t0 + dur);
    }
    const peak = o.vol ?? 0.25;
    const atk = o.attack ?? 0.008;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  private noise(dur: number, vol: number, delay = 0, hp = 600) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = hp;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    src.start(t0);
  }

  /* ---------------- SFX ---------------- */
  click() {
    this.tone({ freq: 720, freqEnd: 900, type: "triangle", dur: 0.08, vol: 0.2 });
  }

  collect(combo = 0) {
    const base = 560 + Math.min(combo, 8) * 28;
    this.tone({ freq: base, freqEnd: base * 1.5, type: "sine", dur: 0.12, vol: 0.28 });
    this.tone({ freq: base * 2, type: "triangle", dur: 0.1, vol: 0.12, delay: 0.04 });
  }

  power() {
    [523, 659, 784, 1047].forEach((f, i) =>
      this.tone({ freq: f, type: "triangle", dur: 0.14, vol: 0.2, delay: i * 0.06 })
    );
  }

  steal() {
    // comedic "boing"
    this.tone({ freq: 480, freqEnd: 110, type: "square", dur: 0.22, vol: 0.16 });
    this.tone({ freq: 140, freqEnd: 320, type: "sine", dur: 0.28, vol: 0.2, delay: 0.06 });
    this.noise(0.08, 0.08, 0, 1200);
  }

  freeze() {
    this.tone({ freq: 1320, freqEnd: 440, type: "sine", dur: 0.55, vol: 0.18 });
    this.tone({ freq: 1760, freqEnd: 660, type: "triangle", dur: 0.5, vol: 0.1, delay: 0.05 });
    this.noise(0.35, 0.05, 0, 3000);
  }

  blocked() {
    this.tone({ freq: 300, freqEnd: 220, type: "square", dur: 0.1, vol: 0.12 });
    this.tone({ freq: 880, type: "triangle", dur: 0.08, vol: 0.1, delay: 0.02 });
  }

  trap() {
    this.tone({ freq: 220, freqEnd: 60, type: "sawtooth", dur: 0.25, vol: 0.18 });
    this.noise(0.15, 0.12, 0, 300);
  }

  drop() {
    this.tone({ freq: 500, freqEnd: 300, type: "triangle", dur: 0.18, vol: 0.16 });
  }

  plate() {
    this.tone({ freq: 880, type: "sine", dur: 0.12, vol: 0.14 });
  }

  door() {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      this.tone({ freq: f, type: "triangle", dur: 0.3, vol: 0.18, delay: i * 0.09 })
    );
  }

  count(final = false) {
    if (final) {
      this.tone({ freq: 1047, type: "triangle", dur: 0.35, vol: 0.28 });
      this.tone({ freq: 1568, type: "sine", dur: 0.4, vol: 0.16, delay: 0.05 });
    } else {
      this.tone({ freq: 440, type: "triangle", dur: 0.16, vol: 0.22 });
    }
  }

  win() {
    const seq = [523, 659, 784, 1047, 784, 1047, 1319];
    seq.forEach((f, i) =>
      this.tone({ freq: f, type: "triangle", dur: 0.22, vol: 0.22, delay: i * 0.11 })
    );
    this.tone({ freq: 262, type: "sine", dur: 0.9, vol: 0.12, delay: 0 });
    this.tone({ freq: 392, type: "sine", dur: 0.9, vol: 0.1, delay: 0.1 });
  }

  /* ---------------- Music ---------------- */
  startMusic() {
    if (!this.ctx || this.musicTimer !== null) return;
    this.musicGain.gain.setTargetAtTime(0.16, this.ctx.currentTime, 0.4);
    this.step = 0;
    this.nextStepTime = this.ctx.currentTime + 0.1;
    const stepDur = 60 / 112 / 2; // eighth notes at 112 bpm
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx) return;
      while (this.nextStepTime < this.ctx.currentTime + 0.25) {
        this.scheduleStep(this.step, this.nextStepTime, stepDur);
        this.nextStepTime += stepDur;
        this.step = (this.step + 1) % 32;
      }
    }, 90);
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.ctx) {
      this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25);
    }
  }

  private scheduleStep(step: number, t: number, stepDur: number) {
    if (!this.ctx) return;
    const mel = MELODY[step];
    if (mel) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = mel;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + stepDur * 1.8);
      osc.connect(g);
      g.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + stepDur * 2);
    }
    const bass = BASS[step];
    if (bass) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = bass;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + stepDur * 3.2);
      osc.connect(g);
      g.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + stepDur * 3.5);
    }
  }
}
