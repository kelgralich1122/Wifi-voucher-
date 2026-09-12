import type { HudState } from "../game/engine";
import { POWER_META, GOAL } from "../game/engine";

function fmtTime(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function EffectChips({
  hud,
  slot,
}: {
  hud: HudState;
  slot: 0 | 1;
}) {
  const e = hud.effects[slot];
  const chips: { icon: string; label: string; pct: number; color: string; pulse?: boolean }[] = [];
  if (e.speed > 0)
    chips.push({
      icon: POWER_META.speed.emoji,
      label: POWER_META.speed.label,
      pct: e.speed / POWER_META.speed.duration,
      color: "#ffd166",
    });
  if (e.shield > 0)
    chips.push({
      icon: POWER_META.shield.emoji,
      label: POWER_META.shield.label,
      pct: e.shield / POWER_META.shield.duration,
      color: "#7be0ff",
    });
  if (e.magnet > 0)
    chips.push({
      icon: POWER_META.magnet.emoji,
      label: POWER_META.magnet.label,
      pct: e.magnet / POWER_META.magnet.duration,
      color: "#c79bff",
    });
  if (e.frozen > 0)
    chips.push({
      icon: POWER_META.freeze.emoji,
      label: "FROZEN!",
      pct: 1,
      color: "#a8f0ff",
      pulse: true,
    });
  return (
    <div className={`flex gap-1 mt-1 h-5 ${slot === 1 ? "justify-end" : ""}`}>
      {chips.map((c, i) => (
        <div
          key={i}
          title={c.label}
          className={`relative flex items-center gap-0.5 rounded-full px-1.5 text-[11px] font-semibold overflow-hidden ${
            c.pulse ? "animate-pulse" : ""
          }`}
          style={{ background: "rgba(0,0,0,0.35)", color: c.color }}
        >
          <span className="leading-none">{c.icon}</span>
          {!c.pulse && (
            <span
              className="absolute bottom-0 left-0 h-[2px] opacity-70"
              style={{ width: `${c.pct * 100}%`, background: c.color }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function ScoreCard({
  hud,
  slot,
}: {
  hud: HudState;
  slot: 0 | 1;
}) {
  const score = hud.scores[slot];
  const isP1 = slot === 0;
  const color = isP1 ? "#ff4d80" : "#3d8bfd";
  const dark = isP1 ? "#c91e58" : "#1c5cc4";
  const pct = Math.min(1, score / GOAL);
  return (
    <div
      className="pointer-events-none rounded-2xl px-3 py-1.5 min-w-[104px] shadow-lg"
      style={{
        background: "rgba(30,8,40,0.55)",
        border: `2px solid ${color}`,
        backdropFilter: "blur(6px)",
      }}
    >
      <div className={`flex items-center gap-2 ${isP1 ? "" : "flex-row-reverse"}`}>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ background: `linear-gradient(135deg, ${color}, ${dark})` }}
        >
          {isP1 ? "P1" : "P2"}
        </div>
        <div className={isP1 ? "text-left" : "text-right"}>
          <div
            key={score}
            className="anim-pop text-white font-bold text-xl leading-none flex items-center gap-1"
            style={{ color }}
          >
            {score}
            <span className="text-sm">❤️</span>
          </div>
        </div>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{
            width: `${pct * 100}%`,
            marginLeft: isP1 ? 0 : "auto",
            background: `linear-gradient(90deg, ${color}, #ffd166)`,
          }}
        />
      </div>
      <EffectChips hud={hud} slot={slot} />
    </div>
  );
}

export default function Hud({
  hud,
  muted,
  onPause,
  onMute,
}: {
  hud: HudState | null;
  muted: boolean;
  onPause: () => void;
  onMute: () => void;
}) {
  return (
    <div
      className="pointer-events-none absolute top-0 left-0 right-0 z-10 flex items-start justify-between gap-2 px-2"
      style={{ paddingTop: "max(env(safe-area-inset-top), 6px)" }}
    >
      {hud && <ScoreCard hud={hud} slot={0} />}
      <div className="flex flex-col items-center gap-1 pt-1">
        <div className="rounded-full px-3 py-0.5 text-white font-semibold text-sm glass">
          ⏱ {hud ? fmtTime(hud.time) : "0:00"}
        </div>
        <div className="rounded-full px-2 py-0.5 text-[10px] text-pink-100 font-semibold glass">
          FIRST TO {GOAL} ❤️
        </div>
        <div className="flex gap-1 pointer-events-auto">
          <button
            onClick={onMute}
            className="btn-juicy w-8 h-8 rounded-full glass text-sm flex items-center justify-center"
            aria-label="Toggle sound"
          >
            {muted ? "🔇" : "🔊"}
          </button>
          <button
            onClick={onPause}
            className="btn-juicy w-8 h-8 rounded-full glass text-sm flex items-center justify-center"
            aria-label="Pause"
          >
            ⏸
          </button>
        </div>
      </div>
      {hud && <ScoreCard hud={hud} slot={1} />}
    </div>
  );
}
