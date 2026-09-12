export interface ScoreEntry {
  id: string;
  winner: 0 | 1;
  scores: [number, number];
  time: number;
  date: number;
}

const KEY = "loverush.scores.v1";
const MUTE_KEY = "loverush.muted.v1";

export function loadScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScoreEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, 10) : [];
  } catch {
    return [];
  }
}

export function saveScore(entry: Omit<ScoreEntry, "id" | "date">): ScoreEntry[] {
  const list = loadScores();
  const full: ScoreEntry = {
    ...entry,
    id: Math.random().toString(36).slice(2),
    date: Date.now(),
  };
  list.unshift(full);
  const trimmed = list.slice(0, 10);
  try {
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    /* storage unavailable */
  }
  return trimmed;
}

export function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function storeMuted(m: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, m ? "1" : "0");
  } catch {
    /* noop */
  }
}

export function fmtClock(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function timeAgo(ts: number) {
  const d = Date.now() - ts;
  const min = Math.floor(d / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ts).toLocaleDateString();
}

export const ROMANTIC_LINES = [
  "Love always wins! 💕",
  "A match made in the Secret Garden! 🌸",
  "You didn't just collect hearts — you stole one too. 💘",
  "Heartbreaker, party of one! 💔➡️❤️",
  "Roses are red, violets are blue, 20 hearts means victory for you! 🌹",
  "Cuteness overload — play again for love! 🥰",
  "Somebody's getting a kiss tonight! 😘",
  "Two hearts raced, but one raced faster! 💓",
];
