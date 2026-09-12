/* ============================================================
   LOVE RUSH ❤️ — 2-player same-screen heart chase engine
   Canvas2D, fixed-timestep-ish rAF loop, 60fps juice machine.
   ============================================================ */

import type { AudioEngine } from "./audio";

export const WORLD = { w: 960, h: 600 };
export const GOAL = 20;
const R = 17; // player radius
const BASE_SPEED = 240;

export type Phase = "idle" | "countdown" | "running" | "paused" | "over";
export type PowerType = "speed" | "shield" | "magnet" | "freeze";

export const POWER_META: Record<
  PowerType,
  { emoji: string; label: string; color: string; duration: number }
> = {
  speed: { emoji: "⚡", label: "Speed Boost", color: "#ffd166", duration: 5 },
  shield: { emoji: "🛡️", label: "Shield", color: "#7be0ff", duration: 7 },
  magnet: { emoji: "🧲", label: "Heart Magnet", color: "#c79bff", duration: 6 },
  freeze: { emoji: "❄️", label: "Freeze!", color: "#a8f0ff", duration: 0 },
};

export interface HudState {
  scores: [number, number];
  goal: number;
  time: number;
  effects: [
    { speed: number; shield: number; magnet: number; frozen: number },
    { speed: number; shield: number; magnet: number; frozen: number }
  ];
  doorOpen: boolean;
  doorProgress: number;
}

export interface MatchResult {
  winner: 0 | 1;
  scores: [number, number];
  time: number;
}

interface Callbacks {
  onHud: (h: HudState) => void;
  onGameOver: (r: MatchResult) => void;
  onTogglePause: () => void;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  gate?: boolean;
}
interface Circle {
  x: number;
  y: number;
  r: number;
}
interface Player {
  id: 0 | 1;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ix: number;
  iy: number;
  dirX: number;
  dirY: number;
  color: string;
  colorDark: string;
  colorLight: string;
  score: number;
  speedT: number;
  shieldT: number;
  magnetT: number;
  frozenT: number;
  stunT: number;
  invulnT: number;
  stealCd: number;
  hop: number;
  squash: number;
  blink: number;
  blinkT: number;
  combo: number;
  comboT: number;
  dustT: number;
  mood: "normal" | "win" | "lose";
  inMud: boolean;
}
interface Heart {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
  phase: number;
  moving: boolean;
}
interface PowerUp {
  x: number;
  y: number;
  type: PowerType;
  born: number;
  phase: number;
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  shape: "circle" | "heart" | "spark" | "snow" | "petal";
  rot: number;
  vr: number;
  grav: number;
  sway: number;
}
interface Floater {
  x: number;
  y: number;
  text: string;
  life: number;
  max: number;
  color: string;
  size: number;
}
interface Plate {
  x: number;
  y: number;
  r: number;
  pressed: number; // player id or -1
}
interface Joystick {
  bx: number;
  by: number;
  x: number;
  y: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const dist2 = (x1: number, y1: number, x2: number, y2: number) => {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy;
};

function circleRect(cx: number, cy: number, r: number, rc: Rect) {
  const nx = clamp(cx, rc.x, rc.x + rc.w);
  const ny = clamp(cy, rc.y, rc.y + rc.h);
  const dx = cx - nx;
  const dy = cy - ny;
  const d2 = dx * dx + dy * dy;
  if (d2 < r * r) {
    const d = Math.sqrt(d2) || 0.0001;
    if (d2 > 0.0001) {
      const push = r - d;
      return { x: (dx / d) * push, y: (dy / d) * push };
    }
    // center inside rect: push out along smallest axis
    const left = cx - rc.x;
    const right = rc.x + rc.w - cx;
    const top = cy - rc.y;
    const bottom = rc.y + rc.h - cy;
    const m = Math.min(left, right, top, bottom);
    if (m === left) return { x: -r - left, y: 0 };
    if (m === right) return { x: r + right, y: 0 };
    if (m === top) return { x: 0, y: -r - top };
    return { x: 0, y: r + bottom };
  }
  return null;
}

export function createGame(canvas: HTMLCanvasElement, audio: AudioEngine, cb: Callbacks) {
  const ctx = canvas.getContext("2d")!;

  /* ---------------- Map ---------------- */
  const solids: Rect[] = [
    // secret garden alcove walls (gate segments flagged)
    { x: 330, y: 92, w: 122, h: 18, gate: true },
    { x: 508, y: 92, w: 122, h: 18, gate: true },
    { x: 330, y: 0, w: 18, h: 110 },
    { x: 612, y: 0, w: 18, h: 110 },
    // hedges
    { x: 64, y: 150, w: 118, h: 58 },
    { x: 778, y: 140, w: 120, h: 60 },
    { x: 118, y: 392, w: 132, h: 62 },
    { x: 710, y: 410, w: 132, h: 60 },
    { x: 246, y: 272, w: 96, h: 68 },
    { x: 618, y: 262, w: 96, h: 68 },
  ];
  const ponds: Circle[] = [
    { x: 120, y: 300, r: 38 },
    { x: 884, y: 300, r: 32 },
  ];
  const mud: Circle[] = [
    { x: 300, y: 470, r: 34 },
    { x: 666, y: 150, r: 32 },
    { x: 480, y: 210, r: 27 },
  ];
  const thorns: Circle[] = [
    { x: 108, y: 98, r: 22 },
    { x: 480, y: 552, r: 24 },
    { x: 690, y: 540, r: 22 },
  ];
  const plates: Plate[] = [
    { x: 400, y: 190, r: 26, pressed: -1 },
    { x: 560, y: 190, r: 26, pressed: -1 },
  ];
  const pedestals = [
    { x: 180, y: 250 },
    { x: 780, y: 250 },
    { x: 330, y: 560 },
    { x: 630, y: 560 },
  ];
  const secretSpots = [
    { x: 480, y: 44 },
    { x: 444, y: 72 },
    { x: 516, y: 72 },
  ];
  const startSpots = [
    { x: 110, y: 545 },
    { x: 850, y: 545 },
  ];

  const decorations: { x: number; y: number; c: string; s: number; f: boolean }[] = [];
  {
    for (let i = 0; i < 70; i++) {
      const x = rand(20, WORLD.w - 20);
      const y = rand(120, WORLD.h - 18);
      if (x > 348 && x < 612 && y < 110) continue;
      decorations.push({
        x,
        y,
        c: ["#ff9ec4", "#fff3b0", "#ffffff", "#ffd6e8"][i % 4],
        s: rand(1.6, 3.4),
        f: Math.random() < 0.45,
      });
    }
  }

  const heartSpots: { x: number; y: number }[] = [];
  {
    const clear = (x: number, y: number, need: number) => {
      if (x < 36 || x > WORLD.w - 36 || y < 122 || y > WORLD.h - 30) return false;
      for (const rc of solids) if (circleRect(x, y, need, rc)) return false;
      for (const p of ponds) if (dist2(x, y, p.x, p.y) < (p.r + need - 4) ** 2) return false;
      for (const m of mud) if (dist2(x, y, m.x, m.y) < (m.r + need - 8) ** 2) return false;
      for (const t of thorns) if (dist2(x, y, t.x, t.y) < (t.r + need) ** 2) return false;
      for (const pe of pedestals) if (dist2(x, y, pe.x, pe.y) < (need + 18) ** 2) return false;
      for (const s of startSpots) if (dist2(x, y, s.x, s.y) < 130 ** 2) return false;
      return true;
    };
    for (let gy = 0; gy < 5; gy++) {
      for (let gx = 0; gx < 8; gx++) {
        const x = 70 + gx * 117 + rand(-20, 20);
        const y = 150 + gy * 92 + rand(-16, 16);
        if (clear(x, y, 30)) heartSpots.push({ x, y });
      }
    }
  }

  /* ---------------- State ---------------- */
  let phase: Phase = "idle";
  let players: Player[] = [];
  let hearts: Heart[] = [];
  let powerups: PowerUp[] = [];
  let particles: Particle[] = [];
  let floaters: Floater[] = [];
  let time = 0; // match clock
  let elapsed = 0; // total anim clock
  let countdownT = 0;
  let countdownTick = -1;
  let heartTimer = 1;
  let powerTimer = 5;
  let doorProgress = 0;
  let doorOpen = false;
  let openAnim = 0;
  let shake = 0;
  let hitStop = 0;
  let confettiT = 0;
  let confettiLeft = 0;
  let flashColor = "";
  let flashA = 0;
  let hudT = 0;
  let raf = 0;
  let lastTs = 0;
  let overFired = false;
  let winnerId: 0 | 1 = 0;

  const keys = new Set<string>();
  const joys = new Map<number, Joystick>();
  const sidePointer = new Map<0 | 1, number>();

  /* ---------------- Sizing ---------------- */
  let vw = 0;
  let vh = 0;
  let dpr = 1;
  let viewScale = 1;
  let offX = 0;
  let offY = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    vw = rect.width;
    vh = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    viewScale = Math.min(vw / WORLD.w, vh / WORLD.h);
    offX = (vw - WORLD.w * viewScale) / 2;
    offY = (vh - WORLD.h * viewScale) / 2;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  /* ---------------- Factory ---------------- */
  function makePlayer(id: 0 | 1): Player {
    const s = startSpots[id];
    return {
      id,
      x: s.x,
      y: s.y,
      vx: 0,
      vy: 0,
      ix: 0,
      iy: 0,
      dirX: 0,
      dirY: id === 0 ? -1 : -1,
      color: id === 0 ? "#ff4d80" : "#3d8bfd",
      colorDark: id === 0 ? "#c91e58" : "#1c5cc4",
      colorLight: id === 0 ? "#ffb0c8" : "#a9d0ff",
      score: 0,
      speedT: 0,
      shieldT: 0,
      magnetT: 0,
      frozenT: 0,
      stunT: 0,
      invulnT: 0,
      stealCd: 0,
      hop: rand(0, 6),
      squash: 0,
      blink: 0,
      blinkT: rand(1, 3),
      combo: 0,
      comboT: 0,
      dustT: 0,
      mood: "normal",
      inMud: false,
    };
  }

  function spawnHeartAt(x: number, y: number, dropped = false) {
    hearts.push({
      x,
      y,
      vx: dropped ? rand(-160, 160) : 0,
      vy: dropped ? rand(-220, -100) : 0,
      born: elapsed,
      phase: rand(0, Math.PI * 2),
      moving: dropped,
    });
  }

  function spawnHeart() {
    if (hearts.length >= 7) return;
    const spots = [...heartSpots].sort(() => Math.random() - 0.5);
    for (const s of spots) {
      let ok = true;
      for (const p of players) if (dist2(s.x, s.y, p.x, p.y) < 70 ** 2) ok = false;
      for (const h of hearts) if (dist2(s.x, s.y, h.x, h.y) < 75 ** 2) ok = false;
      for (const pu of powerups) if (dist2(s.x, s.y, pu.x, pu.y) < 45 ** 2) ok = false;
      if (ok) {
        spawnHeartAt(s.x, s.y);
        return;
      }
    }
  }

  function spawnPower() {
    if (powerups.length >= 2) return;
    const free = pedestals.filter(
      (p) => !powerups.some((pu) => dist2(pu.x, pu.y, p.x, p.y) < 40)
    );
    if (!free.length) return;
    const spot = free[Math.floor(Math.random() * free.length)];
    const types: PowerType[] = ["speed", "shield", "magnet", "freeze"];
    powerups.push({
      x: spot.x,
      y: spot.y,
      type: types[Math.floor(Math.random() * types.length)],
      born: elapsed,
      phase: rand(0, 6),
    });
  }

  function resetWorld() {
    players = [makePlayer(0), makePlayer(1)];
    hearts = [];
    powerups = [];
    particles = [];
    floaters = [];
    time = 0;
    heartTimer = 0.5;
    powerTimer = 3.5;
    doorProgress = 0;
    doorOpen = false;
    openAnim = 0;
    shake = 0;
    hitStop = 0;
    confettiLeft = 0;
    flashA = 0;
    overFired = false;
    plates[0].pressed = -1;
    plates[1].pressed = -1;
    for (let i = 0; i < 6; i++) spawnHeart();
  }

  /* ---------------- Particles ---------------- */
  function burst(
    x: number,
    y: number,
    color: string,
    count: number,
    speed: number,
    shape: Particle["shape"] = "circle",
    life = 0.6,
    size = 5
  ) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(speed * 0.3, speed);
      particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - (shape === "heart" ? 40 : 0),
        life: rand(life * 0.6, life),
        max: life,
        size: rand(size * 0.7, size * 1.3),
        color,
        shape,
        rot: rand(0, Math.PI * 2),
        vr: rand(-6, 6),
        grav: shape === "heart" ? 260 : shape === "snow" ? 18 : 500,
        sway: rand(0, 4),
      });
    }
  }

  function floatText(x: number, y: number, text: string, color = "#fff", size = 22) {
    floaters.push({ x, y, text, life: 1.1, max: 1.1, color, size });
  }

  function confettiBurst(x: number, y: number, n: number) {
    const colors = ["#ff4d80", "#ffd166", "#7be0ff", "#c79bff", "#ff8fb1", "#9bf6a5"];
    for (let i = 0; i < n; i++) {
      particles.push({
        x: x + rand(-60, 60),
        y: y + rand(-40, 40),
        vx: rand(-260, 260),
        vy: rand(-420, -120),
        life: rand(1.2, 2.2),
        max: 2.2,
        size: rand(7, 13),
        color: colors[i % colors.length],
        shape: Math.random() < 0.75 ? "heart" : "spark",
        rot: rand(0, 6.28),
        vr: rand(-8, 8),
        grav: 340,
        sway: rand(1, 5),
      });
    }
  }

  /* ---------------- Input ---------------- */
  function onKeyDown(e: KeyboardEvent) {
    const k = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) {
      e.preventDefault();
    }
    if (
      (k === "p" || k === "escape") &&
      (phase === "running" || phase === "countdown" || phase === "paused")
    ) {
      cb.onTogglePause();
      return;
    }
    keys.add(k);
  }
  function onKeyUp(e: KeyboardEvent) {
    keys.delete(e.key.toLowerCase());
  }

  function pointerPos(e: PointerEvent) {
    return { x: e.clientX, y: e.clientY };
  }
  function onPointerDown(e: PointerEvent) {
    if (phase !== "running" && phase !== "countdown") return;
    e.preventDefault();
    const side: 0 | 1 = e.clientX < window.innerWidth / 2 ? 0 : 1;
    const old = sidePointer.get(side);
    if (old !== undefined) {
      joys.delete(old);
      sidePointer.delete(side);
    }
    const { x, y } = pointerPos(e);
    joys.set(e.pointerId, { bx: x, by: y, x, y });
    sidePointer.set(side, e.pointerId);
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  }
  function onPointerMove(e: PointerEvent) {
    const j = joys.get(e.pointerId);
    if (!j) return;
    e.preventDefault();
    const { x, y } = pointerPos(e);
    j.x = x;
    j.y = y;
  }
  function onPointerUp(e: PointerEvent) {
    if (joys.has(e.pointerId)) {
      const side: 0 | 1 = e.clientX < window.innerWidth / 2 ? 0 : 1;
      joys.delete(e.pointerId);
      if (sidePointer.get(side) === e.pointerId) sidePointer.delete(side);
    }
  }
  function clearPointers() {
    joys.clear();
    sidePointer.clear();
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("blur", clearPointers);

  function readInput(p: Player) {
    let kx = 0;
    let ky = 0;
    if (p.id === 0) {
      if (keys.has("a")) kx -= 1;
      if (keys.has("d")) kx += 1;
      if (keys.has("w")) ky -= 1;
      if (keys.has("s")) ky += 1;
    } else {
      if (keys.has("arrowleft")) kx -= 1;
      if (keys.has("arrowright")) kx += 1;
      if (keys.has("arrowup")) ky -= 1;
      if (keys.has("arrowdown")) ky += 1;
    }
    let tx = 0;
    let ty = 0;
    const pid = sidePointer.get(p.id);
    if (pid !== undefined) {
      const j = joys.get(pid);
      if (j) {
        let dx = j.x - j.bx;
        let dy = j.y - j.by;
        const d = Math.hypot(dx, dy);
        const max = 52;
        if (d > max) {
          dx = (dx / d) * max;
          dy = (dy / d) * max;
        }
        if (d > 12) {
          tx = dx / max;
          ty = dy / max;
        }
      }
    }
    p.ix = clamp(kx + tx, -1, 1);
    p.iy = clamp(ky + ty, -1, 1);
    const m = Math.hypot(p.ix, p.iy);
    if (m > 1) {
      p.ix /= m;
      p.iy /= m;
    }
  }

  /* ---------------- Match flow ---------------- */
  function startMatch() {
    resetWorld();
    phase = "countdown";
    countdownT = 3.4;
    countdownTick = 4;
  }
  function toIdle() {
    resetWorld();
    phase = "idle";
    powerups = [];
    for (let i = 0; i < 2; i++) spawnPower();
  }
  let pauseReturn: Phase = "running";
  function pause() {
    if (phase === "running" || phase === "countdown") {
      pauseReturn = phase;
      phase = "paused";
    }
  }
  function resume() {
    if (phase === "paused") phase = pauseReturn;
  }

  function finishMatch(winner: 0 | 1) {
    if (overFired) return;
    phase = "over";
    winnerId = winner;
    players[winner].mood = "win";
    players[winner === 0 ? 1 : 0].mood = "lose";
    overFired = true;
    shake = 16;
    confettiLeft = 6;
    players.forEach((p) => {
      p.vx = 0;
      p.vy = 0;
      p.ix = 0;
      p.iy = 0;
    });
    confettiBurst(players[winner].x, players[winner].y - 20, 90);
    floatText(players[winner].x, players[winner].y - 46, "I LOVE THIS! 💘", "#ffe9f2", 26);
    audio.win();
    cb.onGameOver({
      winner,
      scores: [players[0].score, players[1].score],
      time,
    });
  }

  /* ---------------- Update ---------------- */
  // prevents magnets from sucking hearts through hedges / the closed garden gate
  function segmentBlocked(x1: number, y1: number, x2: number, y2: number) {
    for (let i = 1; i < 8; i++) {
      const t = i / 8;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      for (const rc of solids) {
        if (rc.gate && doorOpen) continue;
        if (circleRect(x, y, 8, rc)) return true;
      }
    }
    return false;
  }

  function collideEntity(ent: { x: number; y: number; vx: number; vy: number }, r: number) {
    for (const rc of solids) {
      if (rc.gate && doorOpen) continue;
      const hit = circleRect(ent.x, ent.y, r, rc);
      if (hit) {
        ent.x += hit.x;
        ent.y += hit.y;
        const dot = ent.vx * hit.x + ent.vy * hit.y;
        if (dot < 0) {
          ent.vx -= (1.3 * dot * hit.x) / (hit.x * hit.x + hit.y * hit.y || 1);
          ent.vy -= (1.3 * dot * hit.y) / (hit.x * hit.x + hit.y * hit.y || 1);
        }
      }
    }
    for (const pn of ponds) {
      const dx = ent.x - pn.x;
      const dy = ent.y - pn.y;
      const d = Math.hypot(dx, dy);
      const min = pn.r + r;
      if (d < min && d > 0.001) {
        const push = min - d;
        ent.x += (dx / d) * push;
        ent.y += (dy / d) * push;
        const dot = ent.vx * dx + ent.vy * dy;
        if (dot < 0) {
          ent.vx -= (1.4 * dot * dx) / (d * d);
          ent.vy -= (1.4 * dot * dy) / (d * d);
        }
      }
    }
    ent.x = clamp(ent.x, r + 8, WORLD.w - r - 8);
    ent.y = clamp(ent.y, r + 8, WORLD.h - r - 8);
  }

  function applyPower(p: Player, type: PowerType) {
    const meta = POWER_META[type];
    audio.power();
    burst(p.x, p.y - 10, meta.color, 18, 220, "spark", 0.6, 5);
    floatText(p.x, p.y - 40, `${meta.emoji} ${meta.label}`, meta.color, 20);
    if (type === "freeze") {
      const v = players[p.id === 0 ? 1 : 0];
      if (v.shieldT > 0) {
        v.shieldT = 0;
        burst(v.x, v.y - 10, "#7be0ff", 22, 200, "spark", 0.7, 5);
        floatText(v.x, v.y - 42, "BLOCKED! 🛡️", "#7be0ff", 20);
        audio.blocked();
      } else {
        v.frozenT = 2.6;
        burst(v.x, v.y - 8, "#a8f0ff", 26, 170, "snow", 1, 7);
        floatText(v.x, v.y - 44, "❄️ FROZEN!", "#a8f0ff", 22);
        audio.freeze();
        flashColor = "#bfeaff";
        flashA = 0.35;
        shake = Math.max(shake, 5);
      }
    } else if (type === "speed") {
      p.speedT = meta.duration;
    } else if (type === "shield") {
      p.shieldT = meta.duration;
    } else {
      p.magnetT = meta.duration;
    }
  }

  function updatePlayer(p: Player, dt: number) {
    // timers
    p.stealCd = Math.max(0, p.stealCd - dt);
    p.squash = Math.max(0, p.squash - dt * 2.4);
    p.invulnT = Math.max(0, p.invulnT - dt);
    p.comboT = Math.max(0, p.comboT - dt);
    if (p.comboT <= 0) p.combo = 0;
    p.blinkT -= dt;
    if (p.blinkT < 0) {
      p.blink = 0.14;
      p.blinkT = rand(1.4, 3.6);
    }
    p.blink = Math.max(0, p.blink - dt);

    if (p.frozenT > 0) {
      p.frozenT -= dt;
      p.vx *= Math.pow(0.001, dt);
      p.vy *= Math.pow(0.001, dt);
      if (Math.random() < dt * 8) {
        particles.push({
          x: p.x + rand(-14, 14),
          y: p.y - 18 + rand(-10, 6),
          vx: rand(-12, 12),
          vy: rand(-34, -12),
          life: 0.9,
          max: 0.9,
          size: rand(3, 6),
          color: "#d8f6ff",
          shape: "snow",
          rot: rand(0, 6),
          vr: rand(-4, 4),
          grav: 8,
          sway: rand(1, 3),
        });
      }
      if (p.frozenT <= 0) burst(p.x, p.y - 10, "#cdeffd", 14, 150, "snow", 0.5, 5);
    } else {
      p.speedT = Math.max(0, p.speedT - dt);
      p.shieldT = Math.max(0, p.shieldT - dt);
      p.magnetT = Math.max(0, p.magnetT - dt);
      p.stunT = Math.max(0, p.stunT - dt);
    }

    const control = p.frozenT > 0 || p.stunT > 0 ? 0 : 1;
    // mud check
    p.inMud = false;
    for (const m of mud) {
      if (dist2(p.x, p.y, m.x, m.y) < (m.r + R * 0.55) ** 2) p.inMud = true;
    }
    let speed = BASE_SPEED;
    if (p.speedT > 0) speed *= 1.5;
    if (p.inMud) speed *= 0.45;

    const tvx = p.ix * speed * control;
    const tvy = p.iy * speed * control;
    const accel = p.inMud ? 8 : 16;
    const k = Math.min(1, dt * accel);
    p.vx += (tvx - p.vx) * k;
    p.vy += (tvy - p.vy) * k;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    collideEntity(p, R);

    const sp = Math.hypot(p.vx, p.vy);
    if (sp > 30) {
      p.dirX = p.vx / sp;
      p.dirY = p.vy / sp;
      p.hop += dt * (sp / 22);
      const wasUp = Math.sin(p.hop) > 0.6;
      if (!wasUp && Math.sin(p.hop + dt * (sp / 22)) > 0.6) p.squash = 0.16;
      // dust
      p.dustT -= dt;
      if (p.dustT <= 0 && (p.inMud || p.speedT > 0 || Math.random() < 0.5)) {
        p.dustT = p.inMud ? 0.05 : 0.14;
        particles.push({
          x: p.x - p.dirX * 12 + rand(-4, 4),
          y: p.y + 10,
          vx: -p.dirX * rand(30, 80) + rand(-20, 20),
          vy: rand(-50, -18),
          life: 0.45,
          max: 0.45,
          size: rand(3, 6),
          color: p.inMud ? "#b98e6b" : p.speedT > 0 ? "#ffe27a" : "#ffffff",
          shape: "circle",
          rot: 0,
          vr: 0,
          grav: 60,
          sway: 0,
        });
      }
    }
    if (p.speedT > 0 && Math.random() < dt * 26) {
      particles.push({
        x: p.x - p.dirX * 16,
        y: p.y - 6 + rand(-8, 8),
        vx: -p.dirX * 160,
        vy: rand(-30, 30),
        life: 0.3,
        max: 0.3,
        size: rand(4, 7),
        color: "#ffd166",
        shape: "spark",
        rot: 0,
        vr: 0,
        grav: 0,
        sway: 0,
      });
    }

    // thorns
    if (p.invulnT <= 0 && p.frozenT <= 0) {
      for (const t of thorns) {
        if (dist2(p.x, p.y, t.x, t.y) < (t.r + R * 0.5) ** 2) {
          p.stunT = 0.85;
          p.invulnT = 1.3;
          p.vx = -p.dirX * 220;
          p.vy = -p.dirY * 220;
          shake = Math.max(shake, 7);
          audio.trap();
          burst(p.x, p.y - 8, "#ff5c8a", 16, 180, "petal", 0.7, 6);
          floatText(p.x, p.y - 42, "OUCH! 🌹", "#ff9ec4", 19);
          if (p.score > 0) {
            p.score--;
            spawnHeartAt(p.x + rand(-8, 8), p.y - 10, true);
            audio.drop();
          }
          break;
        }
      }
    }
  }

  function update(dt: number) {
    elapsed += dt;
    // ambient particles always
    if (phase !== "paused") {
      shake = Math.max(0, shake - dt * 26);
      flashA = Math.max(0, flashA - dt * 1.4);
    }

    if (phase === "idle") {
      heartTimer -= dt;
      if (heartTimer <= 0) {
        heartTimer = 1.2;
        if (hearts.length < 6) spawnHeart();
      }
      if (powerups.length < 2 && Math.random() < dt * 0.25) spawnPower();
      updateFx(dt, false);
      return;
    }

    if (phase === "paused") return;

    if (phase === "countdown") {
      countdownT -= dt;
      const tick = Math.ceil(countdownT - 0.4);
      if (tick !== countdownTick && tick >= 1 && tick <= 3) {
        countdownTick = tick;
        audio.count(false);
      }
      if (countdownT <= 0.4 && countdownTick !== 0) {
        countdownTick = 0;
        audio.count(true);
      }
      players.forEach((p) => readInput(p));
      updateFx(dt, true);
      if (countdownT <= 0) phase = "running";
      emitHud(dt);
      return;
    }

    if (phase === "over") {
      // ambient celebration
      confettiLeft -= dt;
      confettiT -= dt;
      if (confettiLeft > 0 && confettiT <= 0) {
        confettiT = 0.09;
        const colors = ["#ff4d80", "#ffd166", "#7be0ff", "#c79bff", "#ff8fb1"];
        particles.push({
          x: rand(0, WORLD.w),
          y: -10,
          vx: rand(-40, 40),
          vy: rand(90, 180),
          life: rand(2, 3.4),
          max: 3.4,
          size: rand(7, 12),
          color: colors[Math.floor(Math.random() * colors.length)],
          shape: "heart",
          rot: rand(0, 6.28),
          vr: rand(-5, 5),
          grav: 16,
          sway: rand(2, 6),
        });
      }
      players.forEach((p, i) => {
        if (i === winnerId) p.hop += dt * 9;
      });
      updateFx(dt, true);
      return;
    }

    // running
    const worldDt = hitStop > 0 ? dt * 0.08 : dt;
    hitStop = Math.max(0, hitStop - dt);
    time += worldDt;

    players.forEach((p) => {
      readInput(p);
      updatePlayer(p, worldDt);
    });

    // steal check runs BEFORE separation so overlapping bumps always register
    stealCheck(players[0], players[1]);

    // player-player separation
    {
      const [a, b] = players;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 0.001;
      const min = R * 2 - 2;
      if (d < min) {
        const push = (min - d) / 2;
        a.x -= (dx / d) * push;
        a.y -= (dy / d) * push;
        b.x += (dx / d) * push;
        b.y += (dy / d) * push;
      }
    }

    // plates & door
    {
      plates.forEach((pl) => {
        pl.pressed = -1;
        for (const p of players) {
          if (p.frozenT <= 0 && dist2(p.x, p.y, pl.x, pl.y) < (pl.r + R * 0.6) ** 2) {
            pl.pressed = p.id;
            break;
          }
        }
      });
      if (!doorOpen) {
        const both = plates[0].pressed !== -1 && plates[1].pressed !== -1 &&
          plates[0].pressed !== plates[1].pressed;
        if (both) {
          if (doorProgress === 0) audio.plate();
          doorProgress += dt / 1.25;
          if (Math.random() < dt * 14) {
            particles.push({
              x: 480 + rand(-16, 16),
              y: 190 + rand(-16, 16),
              vx: rand(-30, 30),
              vy: rand(-70, -30),
              life: 0.6,
              max: 0.6,
              size: rand(3, 6),
              color: "#fff3b0",
              shape: "spark",
              rot: 0,
              vr: 4,
              grav: -20,
              sway: 0,
            });
          }
        } else {
          doorProgress = Math.max(0, doorProgress - dt * 0.5);
        }
        if (doorProgress >= 1) {
          doorOpen = true;
          openAnim = 0;
          audio.door();
          shake = Math.max(shake, 6);
          floatText(480, 132, "SECRET GARDEN! 💕", "#ff7eb3", 22);
          burst(480, 100, "#ff9ec4", 40, 240, "heart", 1.1, 8);
          secretSpots.forEach((s, i) =>
            setTimeout(() => {
              if (doorOpen && (phase === "running" || phase === "over")) {
                spawnHeartAt(s.x, s.y);
                burst(s.x, s.y, "#ff9ec4", 10, 120, "heart", 0.8, 6);
              }
            }, i * 220)
          );
        }
      } else {
        openAnim = Math.min(1, openAnim + dt * 1.6);
      }
    }

    // hearts
    for (let i = hearts.length - 1; i >= 0; i--) {
      const h = hearts[i];
      // magnet
      let pulled: Player | null = null;
      let bestD = 150;
      for (const p of players) {
        if (p.magnetT > 0) {
          const d = Math.hypot(p.x - h.x, p.y - (h.y - 6));
          if (d < bestD && !segmentBlocked(h.x, h.y, p.x, p.y - 6)) {
            bestD = d;
            pulled = p;
          }
        }
      }
      if (pulled) {
        const dx = pulled.x - h.x;
        const dy = pulled.y - 8 - h.y;
        const d = Math.hypot(dx, dy) || 1;
        h.vx += (dx / d) * 1500 * worldDt;
        h.vy += (dy / d) * 1500 * worldDt;
        const cap = 640;
        const sp = Math.hypot(h.vx, h.vy);
        if (sp > cap) {
          h.vx = (h.vx / sp) * cap;
          h.vy = (h.vy / sp) * cap;
        }
        h.moving = true;
        if (Math.random() < dt * 20) {
          particles.push({
            x: h.x,
            y: h.y,
            vx: rand(-20, 20),
            vy: rand(-20, 20),
            life: 0.35,
            max: 0.35,
            size: 3,
            color: "#e6c4ff",
            shape: "circle",
            rot: 0, vr: 0, grav: 0, sway: 0,
          });
        }
      }
      if (h.moving) {
        h.x += h.vx * worldDt;
        h.y += h.vy * worldDt;
        const f = Math.exp(-(pulled ? 1.2 : 7) * worldDt);
        h.vx *= f;
        h.vy *= f;
        if (!pulled) collideEntity(h, 10);
        if (Math.hypot(h.vx, h.vy) < 12 && !pulled) {
          h.moving = false;
          h.vx = 0;
          h.vy = 0;
        }
      }
      // pickup
      for (const p of players) {
        const pickR = p.magnetT > 0 ? 32 : 25;
        if (dist2(h.x, h.y, p.x, p.y - 6) < pickR * pickR) {
          p.score++;
          p.combo = p.comboT > 0 ? p.combo + 1 : 1;
          p.comboT = 1.2;
          audio.collect(p.combo);
          burst(h.x, h.y, "#ff5c8a", 12, 170, "heart", 0.7, 6);
          burst(h.x, h.y, "#ffd6e8", 6, 90, "circle", 0.4, 3);
          floatText(
            p.x,
            p.y - 38,
            p.combo >= 3 ? `+1 x${p.combo}!` : "+1",
            p.id === 0 ? "#ffd6e8" : "#d8e8ff",
            p.combo >= 3 ? 22 : 18
          );
          p.squash = Math.max(p.squash, 0.12);
          hearts.splice(i, 1);
          if (p.score >= GOAL) {
            confettiBurst(h.x, h.y, 30);
            finishMatch(p.id);
          }
          break;
        }
      }
    }

    // powerup pickups
    for (let i = powerups.length - 1; i >= 0; i--) {
      const pu = powerups[i];
      for (const p of players) {
        if (dist2(pu.x, pu.y, p.x, p.y - 6) < 26 * 26) {
          applyPower(p, pu.type);
          powerups.splice(i, 1);
          break;
        }
      }
    }

    // spawners
    heartTimer -= dt;
    if (heartTimer <= 0) {
      heartTimer = 0.85;
      spawnHeart();
    }
    powerTimer -= dt;
    if (powerTimer <= 0) {
      powerTimer = rand(7, 11);
      spawnPower();
    }

    updateFx(dt, true);
    emitHud(dt);
  }

  function stealCheck(a: Player, b: Player) {
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    if (d >= R * 2 + 4) return;
    const pairs: [Player, Player][] = [
      [a, b],
      [b, a],
    ];
    for (const [thief, victim] of pairs) {
      if (thief.stealCd > 0) continue;
      if (victim.shieldT > 0) {
        thief.stealCd = 0.5;
        audio.blocked();
        burst(victim.x, victim.y - 12, "#7be0ff", 8, 120, "spark", 0.4, 4);
        floatText(victim.x, victim.y - 40, "BLOCKED! 🛡️", "#7be0ff", 17);
        continue;
      }
      if (victim.score > 0) {
        victim.score--;
        thief.score++;
        thief.stealCd = 1.4;
        victim.stealCd = Math.max(victim.stealCd, 0.5);
        const dx = thief.x - victim.x;
        const dy = thief.y - victim.y;
        const dd = Math.hypot(dx, dy) || 1;
        thief.x += (dx / dd) * 10;
        thief.y += (dy / dd) * 10;
        victim.x -= (dx / dd) * 12;
        victim.y -= (dy / dd) * 12;
        thief.squash = 0.22;
        shake = 10;
        hitStop = 0.07;
        audio.steal();
        // flying hearts victim -> thief
        for (let i = 0; i < 10; i++) {
          const t = i / 10;
          particles.push({
            x: victim.x + (thief.x - victim.x) * t,
            y: victim.y - 14 + (thief.y - victim.y) * t - Math.sin(t * Math.PI) * 34,
            vx: rand(-20, 20),
            vy: rand(-40, 0),
            life: 0.7,
            max: 0.7,
            size: 6,
            color: "#ff4d6d",
            shape: "heart",
            rot: rand(0, 6),
            vr: rand(-6, 6),
            grav: 120,
            sway: 1,
          });
        }
        burst(thief.x, thief.y - 14, thief.color, 10, 160, "spark", 0.5, 5);
        floatText(thief.x, thief.y - 44, "STOLE! 💔", "#ffe27a", 21);
        if (thief.score >= GOAL) finishMatch(thief.id);
        return;
      }
    }
  }

  function updateFx(dt: number, heartsFly: boolean) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.life -= dt;
      if (pt.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      pt.vy += pt.grav * dt;
      pt.x += pt.vx * dt + Math.sin(elapsed * 3 + pt.rot) * pt.sway;
      pt.y += pt.vy * dt;
      pt.rot += pt.vr * dt;
      if (heartsFly && pt.shape === "heart" && pt.y > WORLD.h - 14) {
        pt.y = WORLD.h - 14;
        pt.vy *= -0.4;
      }
    }
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.life -= dt;
      f.y -= 34 * dt;
      if (f.life <= 0) floaters.splice(i, 1);
    }
  }

  /* ---------------- HUD ---------------- */
  function emitHud(dt: number) {
    hudT -= dt;
    if (hudT > 0) return;
    hudT = 0.08;
    cb.onHud({
      scores: [players[0].score, players[1].score],
      goal: GOAL,
      time,
      effects: [
        {
          speed: players[0].speedT,
          shield: players[0].shieldT,
          magnet: players[0].magnetT,
          frozen: players[0].frozenT,
        },
        {
          speed: players[1].speedT,
          shield: players[1].shieldT,
          magnet: players[1].magnetT,
          frozen: players[1].frozenT,
        },
      ],
      doorOpen,
      doorProgress,
    });
  }

  /* ============================================================
     RENDER
     ============================================================ */
  function heartPath(c: CanvasRenderingContext2D, s: number) {
    c.beginPath();
    c.moveTo(0, s * 0.42);
    c.bezierCurveTo(-s * 1.15, -s * 0.32, -s * 0.58, -s * 1.15, 0, -s * 0.5);
    c.bezierCurveTo(s * 0.58, -s * 1.15, s * 1.15, -s * 0.32, 0, s * 0.42);
    c.closePath();
  }

  function drawHeart(x: number, y: number, s: number, color: string, rot = 0, glow = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
    }
    const g = ctx.createLinearGradient(0, -s, 0, s);
    g.addColorStop(0, color);
    g.addColorStop(1, "#d61f57");
    heartPath(ctx, s);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.ellipse(-s * 0.32, -s * 0.42, s * 0.16, s * 0.1, -0.5, 0, 6.28);
    ctx.fill();
    ctx.restore();
  }

  function roundRect(x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBackground() {
    // checker grass
    const tile = 60;
    for (let y = 0; y < WORLD.h; y += tile) {
      for (let x = 0; x < WORLD.w; x += tile) {
        const odd = ((x / tile) + (y / tile)) % 2;
        ctx.fillStyle = odd === 0 ? "#c9f2be" : "#bdeab4";
        ctx.fillRect(x, y, tile, tile);
      }
    }
    // secret garden carpet
    ctx.fillStyle = "#ffd9e8";
    ctx.fillRect(348, 0, 264, 110);
    ctx.fillStyle = "#ffc9de";
    for (let y = 0; y < 110; y += tile) {
      for (let x = 360; x < 600; x += tile) {
        const odd = ((x / tile) + (y / tile)) % 2;
        if (odd === 0) ctx.fillRect(x, y, tile, tile);
      }
    }
    // flowers / sparkles
    for (const d of decorations) {
      const tw = 0.6 + 0.4 * Math.sin(elapsed * 2 + d.x);
      ctx.globalAlpha = tw;
      if (d.f) {
        ctx.fillStyle = d.c;
        for (let a = 0; a < 5; a++) {
          const ang = (a / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(d.x + Math.cos(ang) * d.s, d.y + Math.sin(ang) * d.s, d.s * 0.6, 0, 6.28);
          ctx.fill();
        }
        ctx.fillStyle = "#ffd166";
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.s * 0.55, 0, 6.28);
        ctx.fill();
      } else {
        ctx.fillStyle = d.c;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.s, 0, 6.28);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawMap() {
    // mud
    for (const m of mud) {
      ctx.save();
      const g = ctx.createRadialGradient(m.x, m.y, 4, m.x, m.y, m.r);
      g.addColorStop(0, "rgba(150,105,70,0.55)");
      g.addColorStop(1, "rgba(150,105,70,0.25)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, 6.28);
      ctx.fill();
      ctx.strokeStyle = "rgba(120,80,50,0.35)";
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 7]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(90,60,35,0.5)";
      for (let i = 0; i < 5; i++) {
        const a = i * 1.3 + m.x;
        ctx.beginPath();
        ctx.arc(m.x + Math.cos(a) * m.r * 0.5, m.y + Math.sin(a * 1.7) * m.r * 0.45, 2.5 + Math.sin(elapsed * 2 + i) * 1, 0, 6.28);
        ctx.fill();
      }
      ctx.restore();
    }

    // thorns
    for (const t of thorns) {
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.fillStyle = "#8e2a4d";
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a - 0.18) * t.r * 0.6, Math.sin(a - 0.18) * t.r * 0.6);
        ctx.lineTo(Math.cos(a) * (t.r + 5), Math.sin(a) * (t.r + 5));
        ctx.lineTo(Math.cos(a + 0.18) * t.r * 0.6, Math.sin(a + 0.18) * t.r * 0.6);
        ctx.closePath();
        ctx.fill();
      }
      const g = ctx.createRadialGradient(-4, -5, 2, 0, 0, t.r);
      g.addColorStop(0, "#c0457a");
      g.addColorStop(1, "#6e1d3e");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, t.r * 0.72, 0, 6.28);
      ctx.fill();
      // little skull-ish rose bud
      ctx.fillStyle = "#ff7eb3";
      ctx.beginPath();
      ctx.arc(0, 0, t.r * 0.28 + Math.sin(elapsed * 3) * 1, 0, 6.28);
      ctx.fill();
      ctx.restore();
    }

    // plates
    plates.forEach((pl, i) => {
      ctx.save();
      ctx.translate(pl.x, pl.y);
      const pressed = pl.pressed !== -1;
      const col = pressed ? players[pl.pressed].color : "#ffffff";
      ctx.fillStyle = "rgba(80,40,90,0.25)";
      ctx.beginPath();
      ctx.ellipse(0, 5, pl.r + 6, pl.r * 0.6 + 4, 0, 0, 6.28);
      ctx.fill();
      ctx.fillStyle = pressed ? col : "#f3e6ff";
      ctx.strokeStyle = "#b388d8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, pl.r, 0, 6.28);
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 0.85;
      drawHeartLocal(0, -1, pressed ? 13 : 11, pressed ? "#ffffff" : "#d18acb");
      ctx.globalAlpha = 1;
      if (pressed) {
        ctx.strokeStyle = col;
        ctx.globalAlpha = 0.5 + 0.3 * Math.sin(elapsed * 6);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, pl.r + 5, 0, 6.28);
        ctx.stroke();
      }
      ctx.restore();
      // label
      ctx.fillStyle = "rgba(90,40,110,0.75)";
      ctx.font = "600 11px Fredoka, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(i === 0 ? "PAD A" : "PAD B", pl.x, pl.y + pl.r + 15);
    });

    // gate progress ring between plates
    if (!doorOpen && doorProgress > 0) {
      ctx.save();
      ctx.translate(480, 190);
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, 6.28);
      ctx.stroke();
      ctx.strokeStyle = "#ff5c8a";
      ctx.beginPath();
      ctx.arc(0, 0, 15, -Math.PI / 2, -Math.PI / 2 + doorProgress * Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // ponds
    for (const pn of ponds) {
      ctx.save();
      const g = ctx.createRadialGradient(pn.x - 8, pn.y - 10, 4, pn.x, pn.y, pn.r);
      g.addColorStop(0, "#9fe3ff");
      g.addColorStop(1, "#4fb4e8");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(pn.x, pn.y + 3, pn.r, pn.r * 0.82, 0, 0, 6.28);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 2; i++) {
        const rr = ((elapsed * 14 + i * 14) % (pn.r * 1.4));
        ctx.globalAlpha = 1 - rr / (pn.r * 1.4);
        ctx.beginPath();
        ctx.ellipse(pn.x, pn.y + 3, rr, rr * 0.82, 0, 0, 6.28);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#7ed957";
      ctx.beginPath();
      ctx.ellipse(pn.x + pn.r * 0.4, pn.y - pn.r * 0.3, 8, 5, 0.4, 0, 6.28);
      ctx.fill();
      ctx.restore();
    }

    // hedges + walls
    for (const rc of solids) {
      if (rc.gate) continue;
      const isWall = rc.y < 110 && (rc.x < 360 || rc.x > 600);
      ctx.save();
      if (isWall) {
        // cream brick garden wall
        ctx.fillStyle = "#e8c9a0";
        roundRect(rc.x - 4, rc.y - 4, rc.w + 8, rc.h + 8, 8);
        ctx.fill();
        ctx.fillStyle = "#f7e3c4";
        roundRect(rc.x - 4, rc.y - 4, rc.w + 8, 9, 5);
        ctx.fill();
        ctx.strokeStyle = "rgba(160,110,70,0.35)";
        ctx.lineWidth = 1.5;
        for (let bx = rc.x + 8; bx < rc.x + rc.w; bx += 22) {
          ctx.beginPath();
          ctx.moveTo(bx, rc.y);
          ctx.lineTo(bx, rc.y + rc.h);
          ctx.stroke();
        }
      } else {
        // hedge
        ctx.fillStyle = "#57a84a";
        roundRect(rc.x, rc.y + 8, rc.w, rc.h - 6, rc.h / 2);
        ctx.fill();
        const blobs = Math.max(3, Math.round(rc.w / 26));
        for (let i = 0; i < blobs; i++) {
          const bx = rc.x + 14 + (i * (rc.w - 28)) / (blobs - 1);
          ctx.fillStyle = i % 2 ? "#66bd56" : "#72cc62";
          ctx.beginPath();
          ctx.arc(bx, rc.y + rc.h / 2 - 2, rc.h * 0.46, 0, 6.28);
          ctx.fill();
        }
        ctx.fillStyle = "#89dc77";
        for (let i = 0; i < blobs; i++) {
          const bx = rc.x + 14 + (i * (rc.w - 28)) / (blobs - 1);
          ctx.beginPath();
          ctx.arc(bx - 4, rc.y + rc.h / 2 - 8, rc.h * 0.2, 0, 6.28);
          ctx.fill();
        }
        // flowers
        for (let i = 0; i < 3; i++) {
          const fx = rc.x + 16 + ((i * 53 + rc.x) % (rc.w - 28));
          const fy = rc.y + 10 + (i % 2) * 12;
          ctx.fillStyle = ["#ff9ec4", "#fff3b0", "#ffffff"][i % 3];
          ctx.beginPath();
          ctx.arc(fx, fy, 3, 0, 6.28);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // gate walls (closed segments) + door
    if (!doorOpen) {
      for (const seg of [
        { x: 330, w: 122 },
        { x: 508, w: 122 },
      ]) {
        ctx.fillStyle = "#e8c9a0";
        roundRect(seg.x - 4, 88, seg.w + 8, 26, 8);
        ctx.fill();
        ctx.fillStyle = "#f7e3c4";
        roundRect(seg.x - 4, 88, seg.w + 8, 8, 5);
        ctx.fill();
      }
    }
    // arch
    ctx.save();
    ctx.fillStyle = "#b388d8";
    roundRect(438, 66, 84, 30, 12);
    ctx.fill();
    ctx.fillStyle = "#8e5bb8";
    ctx.font = "700 13px Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SECRET GARDEN", 480, 85);
    // double doors swinging
    const swing = openAnim;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(480 + side * 28, 100);
      ctx.rotate(side * swing * 1.35);
      ctx.fillStyle = "#d98a5f";
      roundRect(side < 0 ? -28 : 0, -2, 28, 24, 6);
      ctx.fill();
      ctx.strokeStyle = "#a85e38";
      ctx.lineWidth = 2;
      ctx.stroke();
      drawHeartLocal(side < 0 ? -14 : 14, 10, 6, "#ffb3cd");
      ctx.restore();
    }
    if (!doorOpen) {
      ctx.fillStyle = "#ffe9a8";
      ctx.beginPath();
      ctx.arc(474, 108, 3, 0, 6.28);
      ctx.arc(486, 108, 3, 0, 6.28);
      ctx.fill();
    }
    ctx.restore();

    // pedestals
    for (const pe of pedestals) {
      ctx.fillStyle = "rgba(80,40,90,0.18)";
      ctx.beginPath();
      ctx.ellipse(pe.x, pe.y + 8, 20, 9, 0, 0, 6.28);
      ctx.fill();
      ctx.fillStyle = "#fff1c9";
      ctx.beginPath();
      ctx.ellipse(pe.x, pe.y + 5, 17, 8, 0, 0, 6.28);
      ctx.fill();
      ctx.strokeStyle = "#e8b04b";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawHeartLocal(x: number, y: number, s: number, color: string) {
    ctx.save();
    ctx.translate(x, y);
    heartPath(ctx, s);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function drawHearts() {
    for (const h of hearts) {
      const age = elapsed - h.born;
      const pop = Math.min(1, age * 5);
      const s = 11 * (0.6 + 0.4 * pop) * (1 + Math.sin(elapsed * 4 + h.phase) * 0.07);
      const bob = Math.sin(elapsed * 2.6 + h.phase) * 3;
      // shadow
      ctx.fillStyle = "rgba(80,30,60,0.13)";
      ctx.beginPath();
      ctx.ellipse(h.x, h.y + 13, 9, 4, 0, 0, 6.28);
      ctx.fill();
      drawHeart(h.x, h.y + bob - 4, s, "#ff4d77", Math.sin(elapsed * 1.6 + h.phase) * 0.12, true);
    }
  }

  function drawPowerups() {
    for (const pu of powerups) {
      const meta = POWER_META[pu.type];
      const bob = Math.sin(elapsed * 2.4 + pu.phase) * 4;
      const age = Math.min(1, (elapsed - pu.born) * 4);
      const s = 17 * (0.5 + 0.5 * age);
      ctx.save();
      ctx.translate(pu.x, pu.y + bob - 6);
      ctx.shadowColor = meta.color;
      ctx.shadowBlur = 16 + Math.sin(elapsed * 5) * 4;
      ctx.rotate(Math.sin(elapsed * 1.8 + pu.phase) * 0.12);
      const g = ctx.createLinearGradient(-s, -s, s, s);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(1, meta.color);
      ctx.fillStyle = g;
      roundRect(-s, -s, s * 2, s * 2, 9);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(120,60,120,0.25)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = `${Math.round(s * 1.25)}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(meta.emoji, 0, 1);
      ctx.restore();
    }
  }

  function drawPlayer(p: Player) {
    const t = elapsed;
    const sp = Math.hypot(p.vx, p.vy);
    const moving = sp > 30 && p.frozenT <= 0 && p.stunT <= 0;
    const hopH = moving ? Math.abs(Math.sin(p.hop)) : p.mood === "win" ? Math.abs(Math.sin(t * 7)) * 1.2 : 0;
    const yOff = -hopH * 7;
    const breath = phase === "idle" ? Math.sin(t * 2 + p.id) * 1.5 : 0;

    ctx.save();
    ctx.translate(p.x, p.y + 2);
    // shadow
    ctx.fillStyle = "rgba(70,20,50,0.22)";
    ctx.beginPath();
    ctx.ellipse(0, 14 - yOff * 0.2, 16 - hopH * 3, 6 - hopH, 0, 0, 6.28);
    ctx.fill();
    ctx.translate(0, yOff + breath);

    const sx = 1 - hopH * 0.08 + p.squash;
    const sy = 1 + hopH * 0.1 - p.squash;
    ctx.rotate(moving ? Math.sin(p.hop) * 0.07 : 0);
    ctx.scale(sx, sy);

    // invuln blink
    if (p.invulnT > 0 && Math.sin(t * 30) > 0.2) ctx.globalAlpha = 0.45;

    // ears
    const earWob = moving ? Math.sin(p.hop) * 0.12 : 0;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * 8, -15);
      ctx.rotate(side * (0.18 + earWob));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, -8, 5.5, 12, 0, 0, 6.28);
      ctx.fill();
      ctx.fillStyle = p.colorLight;
      ctx.beginPath();
      ctx.ellipse(0, -7, 2.6, 7, 0, 0, 6.28);
      ctx.fill();
      ctx.restore();
    }

    // body
    const g = ctx.createRadialGradient(-5, -8, 4, 0, 0, 22);
    g.addColorStop(0, p.colorLight);
    g.addColorStop(0.45, p.color);
    g.addColorStop(1, p.colorDark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, -2, R, 0, 6.28);
    ctx.fill();

    // belly
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.beginPath();
    ctx.ellipse(0, 5, 9, 7, 0, 0, 6.28);
    ctx.fill();

    // cheeks
    ctx.fillStyle = "rgba(255,90,130,0.4)";
    ctx.beginPath();
    ctx.ellipse(-9, 3, 3.4, 2.3, 0, 0, 6.28);
    ctx.ellipse(9, 3, 3.4, 2.3, 0, 0, 6.28);
    ctx.fill();

    // eyes
    const lookX = clamp(p.dirX, -1, 1) * 1.8;
    const lookY = clamp(p.dirY, -1, 1) * 1.2;
    ctx.fillStyle = "#3a1626";
    if (p.stunT > 0) {
      // dizzy x eyes
      ctx.strokeStyle = "#3a1626";
      ctx.lineWidth = 1.6;
      for (const ex of [-6, 6]) {
        ctx.beginPath();
        ctx.moveTo(ex - 2.4, -7);
        ctx.lineTo(ex + 2.4, -3);
        ctx.moveTo(ex + 2.4, -7);
        ctx.lineTo(ex - 2.4, -3);
        ctx.stroke();
      }
    } else if (p.frozenT > 0 || p.mood === "lose" || p.blink > 0) {
      // happy / sad closed eyes
      ctx.strokeStyle = "#3a1626";
      ctx.lineWidth = 1.8;
      ctx.lineCap = "round";
      for (const ex of [-6, 6]) {
        ctx.beginPath();
        if (p.mood === "lose" && p.blink <= 0 && p.frozenT <= 0) {
          ctx.arc(ex, -3.5, 2.6, Math.PI * 1.15, Math.PI * 1.85);
        } else {
          ctx.arc(ex, -5.5, 2.6, Math.PI * 0.15, Math.PI * 0.85);
        }
        ctx.stroke();
      }
    } else {
      for (const ex of [-6, 6]) {
        ctx.beginPath();
        ctx.arc(ex + lookX, -5 + lookY, 3.1, 0, 6.28);
        ctx.fill();
      }
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-6 + lookX + 1, -6 + lookY, 1, 0, 6.28);
      ctx.arc(6 + lookX + 1, -6 + lookY, 1, 0, 6.28);
      ctx.fill();
    }

    // mouth
    ctx.strokeStyle = "#8a1d40";
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    if (p.mood === "win" || p.frozenT > 0) {
      ctx.arc(0, 0, 3.2, 0.1, Math.PI - 0.1);
    } else if (p.mood === "lose") {
      ctx.arc(0, 5, 3, Math.PI + 0.2, Math.PI * 2 - 0.2);
    } else {
      ctx.arc(0, 1.4, 2.2, 0.3, Math.PI - 0.3);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // frozen ice cube
    if (p.frozenT > 0) {
      ctx.fillStyle = "rgba(150,225,255,0.5)";
      roundRect(-19, -24, 38, 42, 9);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath();
      ctx.moveTo(-12, -14);
      ctx.lineTo(-6, -8);
      ctx.moveTo(8, 4);
      ctx.lineTo(14, 10);
      ctx.stroke();
    }
    ctx.restore();

    // shield bubble (outside squash transform)
    if (p.shieldT > 0) {
      ctx.save();
      ctx.translate(p.x, p.y - 4);
      const a = 0.4 + 0.18 * Math.sin(t * 5);
      ctx.strokeStyle = `rgba(123,224,255,${a + 0.3})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 7]);
      ctx.lineDashOffset = -t * 30;
      ctx.beginPath();
      ctx.arc(0, 0, 25 + Math.sin(t * 4) * 1.2, 0, 6.28);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = `rgba(123,224,255,${a * 0.35})`;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, 6.28);
      ctx.fill();
      ctx.restore();
    }

    // magnet field
    if (p.magnetT > 0) {
      ctx.save();
      ctx.translate(p.x, p.y - 4);
      ctx.strokeStyle = `rgba(199,155,255,${0.35 + 0.15 * Math.sin(t * 5)})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const a = t * 2 + (i * Math.PI * 2) / 3;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 24, Math.sin(a) * 24, 3, 0, 6.28);
        ctx.stroke();
        drawHeartLocal(Math.cos(a) * 26, Math.sin(a) * 26, 3.4, "#c79bff");
      }
      ctx.beginPath();
      ctx.arc(0, 0, 30 + Math.sin(t * 3) * 2, 0, 6.28);
      ctx.strokeStyle = "rgba(199,155,255,0.25)";
      ctx.stroke();
      ctx.restore();
    }

    // stun stars
    if (p.stunT > 0) {
      for (let i = 0; i < 3; i++) {
        const a = t * 5 + (i * Math.PI * 2) / 3;
        const sx = p.x + Math.cos(a) * 18;
        const sy = p.y - 26 + Math.sin(a) * 6;
        ctx.fillStyle = "#ffd166";
        drawStar(sx, sy, 4, 2);
      }
    }

    // name tag
    ctx.save();
    const tagW = 26;
    ctx.fillStyle = p.colorDark;
    roundRect(p.x - tagW / 2, p.y - 40, tagW, 14, 7);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "700 10px Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(p.id === 0 ? "P1" : "P2", p.x, p.y - 33);
    ctx.restore();
  }

  function drawStar(x: number, y: number, r: number, points: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const rr = i % 2 === 0 ? r : r * 0.45;
      const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawParticles() {
    for (const p of particles) {
      const a = clamp(p.life / p.max, 0, 1);
      ctx.globalAlpha = a;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === "heart") {
        heartPath(ctx, p.size * 0.8);
        ctx.fill();
      } else if (p.shape === "spark") {
        ctx.fillRect(-p.size * 0.18, -p.size, p.size * 0.36, p.size * 2);
        ctx.fillRect(-p.size, -p.size * 0.18, p.size * 2, p.size * 0.36);
      } else if (p.shape === "snow") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.4;
        for (let i = 0; i < 3; i++) {
          const ang = (i * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(-Math.cos(ang) * p.size, -Math.sin(ang) * p.size);
          ctx.lineTo(Math.cos(ang) * p.size, Math.sin(ang) * p.size);
          ctx.stroke();
        }
      } else if (p.shape === "petal") {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, 6.28);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * (0.5 + a * 0.5), 0, 6.28);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    for (const f of floaters) {
      const a = clamp(f.life / f.max, 0, 1);
      ctx.globalAlpha = a;
      ctx.font = `700 ${f.size}px Fredoka, sans-serif`;
      ctx.textAlign = "center";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(90,20,60,0.7)";
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawCountdown() {
    if (phase !== "countdown") return;
    let text = "";
    let sub = "";
    if (countdownT > 2.4) text = "3";
    else if (countdownT > 1.4) text = "2";
    else if (countdownT > 0.4) text = "1";
    else {
      text = "GO!";
      sub = "collect my heart ❤️";
    }
    const frac = countdownT % 1;
    const scale = text === "GO!" ? 1.2 + Math.max(0, 0.3 - frac * 0.3) : 1 + (1 - frac) * 0.15;
    ctx.save();
    ctx.translate(WORLD.w / 2, WORLD.h / 2 - 30);
    ctx.scale(scale, scale);
    ctx.globalAlpha = 0.95;
    ctx.font = "700 110px Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 10;
    ctx.strokeStyle = "rgba(120,20,70,0.55)";
    ctx.strokeText(text, 0, 0);
    const grad = ctx.createLinearGradient(-120, -60, 120, 60);
    grad.addColorStop(0, "#ff9ec4");
    grad.addColorStop(1, "#ff4d80");
    ctx.fillStyle = grad;
    ctx.fillText(text, 0, 0);
    if (sub) {
      ctx.font = "600 22px Fredoka, sans-serif";
      ctx.lineWidth = 5;
      ctx.strokeText(sub, 0, 78);
      ctx.fillStyle = "#fff";
      ctx.fillText(sub, 0, 78);
    }
    ctx.restore();
  }

  function drawJoysticks() {
    if (phase !== "running" && phase !== "countdown") return;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    joys.forEach((j, pid) => {
      const side: 0 | 1 = sidePointer.get(0) === pid ? 0 : 1;
      const c = side === 0 ? "#ff4d80" : "#3d8bfd";
      let dx = j.x - j.bx;
      let dy = j.y - j.by;
      const d = Math.hypot(dx, dy);
      const max = 52;
      if (d > max) {
        dx = (dx / d) * max;
        dy = (dy / d) * max;
      }
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(j.bx, j.by, 62, 0, 6.28);
      ctx.fill();
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = c;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(j.bx + dx, j.by + dy, 26, 0, 6.28);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff";
      ctx.font = "700 16px Fredoka, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(side === 0 ? "P1" : "P2", j.bx + dx, j.by + dy + 1);
    });
    ctx.restore();
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    const now = performance.now();
    let dt = (now - lastTs) / 1000;
    lastTs = now;
    if (!lastTs) dt = 0;
    dt = Math.min(dt, 0.033);
    if (phase !== "paused") update(dt);

    // ---- draw ----
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);
    const shx = shake > 0 ? rand(-shake, shake) * 0.5 : 0;
    const shy = shake > 0 ? rand(-shake, shake) * 0.5 : 0;
    ctx.setTransform(
      dpr * viewScale,
      0,
      0,
      dpr * viewScale,
      dpr * (offX + shx),
      dpr * (offY + shy)
    );
    // world panel shadow/border
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, WORLD.w, WORLD.h);
    ctx.clip();
    drawBackground();
    drawMap();
    drawHearts();
    drawPowerups();
    if (players.length) {
      drawPlayer(players[0]);
      drawPlayer(players[1]);
    }
    drawParticles();
    drawCountdown();
    // flash
    if (flashA > 0) {
      ctx.fillStyle = flashColor;
      ctx.globalAlpha = flashA;
      ctx.fillRect(0, 0, WORLD.w, WORLD.h);
      ctx.globalAlpha = 1;
    }
    // vignette
    const vg = ctx.createRadialGradient(
      WORLD.w / 2,
      WORLD.h / 2,
      WORLD.h * 0.35,
      WORLD.w / 2,
      WORLD.h / 2,
      WORLD.h * 0.85
    );
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(90,10,60,0.18)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, WORLD.w, WORLD.h);
    ctx.restore();

    // frame
    ctx.setTransform(
      dpr * viewScale,
      0,
      0,
      dpr * viewScale,
      dpr * offX,
      dpr * offY
    );
    ctx.strokeStyle = "rgba(255,180,215,0.9)";
    ctx.lineWidth = 6 / viewScale;
    ctx.strokeRect(3, 3, WORLD.w - 6, WORLD.h - 6);

    drawJoysticks();
  }

  // init idle
  resetWorld();
  phase = "idle";
  spawnPower();
  spawnPower();
  lastTs = performance.now();
  raf = requestAnimationFrame(frame);

  const onVisibility = () => {
    if (document.hidden && phase === "running") cb.onTogglePause();
  };
  document.addEventListener("visibilitychange", onVisibility);

  return {
    startMatch,
    toIdle,
    pause,
    resume,
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("blur", clearPointers);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}

export type GameApi = ReturnType<typeof createGame>;
