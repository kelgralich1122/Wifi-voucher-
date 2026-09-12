import { useMemo, type ReactNode } from "react";
import type { MatchResult } from "../game/engine";
import { GOAL } from "../game/engine";
import {
  type ScoreEntry,
  fmtClock,
  timeAgo,
  ROMANTIC_LINES,
} from "../game/storage";

/* ---------- Decorative floating hearts ---------- */
function FloatingHearts() {
  const hearts = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: `${(i * 37 + 6) % 96}%`,
        top: `${(i * 53 + 10) % 90}%`,
        delay: `${(i % 7) * 0.5}s`,
        dur: `${2.8 + (i % 5) * 0.6}s`,
        size: 16 + ((i * 7) % 22),
        emoji: ["❤️", "💕", "💖", "💘", "💗"][i % 5],
      })),
    []
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {hearts.map((h, i) => (
        <span
          key={i}
          className="absolute anim-floaty opacity-60"
          style={{
            left: h.left,
            top: h.top,
            fontSize: h.size,
            animationDelay: h.delay,
            animationDuration: h.dur,
          }}
        >
          {h.emoji}
        </span>
      ))}
    </div>
  );
}

function BigButton({
  children,
  onClick,
  color = "#ff4d80",
  dark = "#c91e58",
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  color?: string;
  dark?: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`btn-juicy font-game font-bold text-white rounded-full px-7 py-3 text-lg shadow-lg ${className}`}
      style={{
        background: `linear-gradient(180deg, ${color}, ${dark})`,
        boxShadow: `0 5px 0 ${dark}, 0 8px 16px rgba(0,0,0,0.35)`,
        border: "2px solid rgba(255,255,255,0.35)",
      }}
    >
      {children}
    </button>
  );
}

/* ---------- Start screen ---------- */
function Key({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center min-w-7 h-7 px-1.5 rounded-md bg-white/90 text-purple-900 font-bold text-sm shadow border-b-2 border-purple-300">
      {children}
    </span>
  );
}

const LEGEND = [
  { icon: "⚡", name: "Speed Boost", desc: "Zoom for 5s" },
  { icon: "🛡️", name: "Shield", desc: "Blocks steals & freeze" },
  { icon: "🧲", name: "Heart Magnet", desc: "Pulls hearts to you" },
  { icon: "❄️", name: "Freeze", desc: "Ice your rival!" },
  { icon: "💔", name: "Steal", desc: "Bump rivals to steal" },
  { icon: "🌹", name: "Thorn Traps", desc: "Stun & drop hearts" },
  { icon: "💕", name: "Team Pads", desc: "Both stand to open" },
  { icon: "❤️", name: `First to ${GOAL}`, desc: "Wins the date!" },
];

export function StartScreen({
  onStart,
  scores,
}: {
  onStart: () => void;
  scores: ScoreEntry[];
}) {
  const wins = [scores.filter((s) => s.winner === 0).length, scores.filter((s) => s.winner === 1).length];
  return (
    <div className="absolute inset-0 z-20 overflow-y-auto scrollbar-cute">
      <FloatingHearts />
      <div
        className="min-h-full flex flex-col items-center px-4 py-5"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, rgba(255,120,170,0.55), rgba(60,15,70,0.92) 70%)",
        }}
      >
        <div className="anim-pop flex flex-col items-center text-center mt-1">
          <div className="text-5xl anim-heartbeat">❤️</div>
          <h1 className="title-gradient font-game font-bold text-5xl sm:text-6xl leading-none tracking-wide mt-1">
            LOVE RUSH
          </h1>
          <p className="text-pink-100 font-semibold mt-1 text-sm sm:text-base">
            A 2-player heart chase — steal, dash &amp; smooch your way to {GOAL}!
          </p>
        </div>

        <BigButton onClick={onStart} className="mt-4 text-2xl px-10 py-4 anim-bounce-soft">
          PLAY ❤️
        </BigButton>

        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl mt-4">
          <div className="glass rounded-2xl p-3" style={{ borderColor: "rgba(255,77,128,0.6)" }}>
            <div className="font-bold text-pink-200 text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs">
                P1
              </span>
              Player 1 — Strawberry
            </div>
            <div className="flex gap-1 mt-2">
              <Key>W</Key>
              <Key>A</Key>
              <Key>S</Key>
              <Key>D</Key>
            </div>
            <div className="text-pink-100/80 text-xs mt-1.5">
              📱 Touch: drag the <b>left half</b> of the screen
            </div>
          </div>
          <div className="glass rounded-2xl p-3" style={{ borderColor: "rgba(61,139,253,0.6)" }}>
            <div className="font-bold text-sky-200 text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center text-white text-xs">
                P2
              </span>
              Player 2 — Blueberry
            </div>
            <div className="flex gap-1 mt-2">
              <Key>↑</Key>
              <Key>←</Key>
              <Key>↓</Key>
              <Key>→</Key>
            </div>
            <div className="text-sky-100/80 text-xs mt-1.5">
              📱 Touch: drag the <b>right half</b> of the screen
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full max-w-2xl mt-2">
          {LEGEND.map((l) => (
            <div
              key={l.name}
              className="glass rounded-xl px-2 py-1.5 text-center"
            >
              <div className="text-xl leading-none">{l.icon}</div>
              <div className="text-white text-xs font-bold leading-tight mt-0.5">{l.name}</div>
              <div className="text-pink-100/70 text-[10px] leading-tight">{l.desc}</div>
            </div>
          ))}
        </div>

        {/* Hall of hearts */}
        <div className="w-full max-w-2xl glass rounded-2xl p-3 mt-3 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="font-game font-bold text-pink-200">🏆 Hall of Hearts</h2>
            <div className="text-xs font-bold text-white/90">
              <span className="text-pink-300">P1 {wins[0]}💗</span>
              <span className="mx-1 text-white/50">vs</span>
              <span className="text-sky-300">💙{wins[1]} P2</span>
            </div>
          </div>
          {scores.length === 0 ? (
            <p className="text-pink-100/70 text-xs text-center py-3">
              No love stories yet — play the first match! 💌
            </p>
          ) : (
            <div className="mt-1.5 space-y-1 max-h-40 overflow-y-auto scrollbar-cute pr-1">
              {scores.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs"
                  style={{
                    background:
                      s.winner === 0
                        ? "rgba(255,77,128,0.16)"
                        : "rgba(61,139,253,0.16)",
                  }}
                >
                  <span className="w-5 text-center">
                    {i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <span
                    className="font-bold"
                    style={{ color: s.winner === 0 ? "#ff9ec4" : "#9ec8ff" }}
                  >
                    P{s.winner + 1} wins
                  </span>
                  <span className="text-white font-semibold ml-auto">
                    <span className="text-pink-300">{s.scores[0]} ❤️</span>
                    <span className="mx-1 text-white/50">–</span>
                    <span className="text-sky-300">❤️ {s.scores[1]}</span>
                  </span>
                  <span className="text-white/60 w-10 text-right">{fmtClock(s.time)}</span>
                  <span className="text-white/40 w-14 text-right">{timeAgo(s.date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="text-pink-100/60 text-[11px] pb-3">
          Tip: pause with <Key>P</Key> or <Key>Esc</Key> · instant rematch with <Key>R</Key>
        </p>
      </div>
    </div>
  );
}

/* ---------- Pause ---------- */
export function PauseScreen({
  onResume,
  onRestart,
  onMenu,
}: {
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center px-4"
      style={{ background: "rgba(40,10,50,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div className="anim-pop glass rounded-3xl p-6 flex flex-col items-center gap-3 w-full max-w-xs">
        <div className="text-4xl">💔</div>
        <h2 className="font-game font-bold text-3xl text-white">Paused</h2>
        <p className="text-pink-100/80 text-xs text-center">
          Take a breath — the hearts can wait.
        </p>
        <BigButton onClick={onResume} className="w-full">
          ▶ Resume
        </BigButton>
        <BigButton onClick={onRestart} color="#8e5bb8" dark="#6d3f96" className="w-full">
          🔄 Restart
        </BigButton>
        <BigButton
          onClick={onMenu}
          color="#6c7a93"
          dark="#4a5568"
          className="w-full text-base py-2.5"
        >
          🏠 Main Menu
        </BigButton>
        <p className="text-white/50 text-[11px]">Press P or Esc to resume</p>
      </div>
    </div>
  );
}

/* ---------- Game over ---------- */
export function GameOverScreen({
  result,
  onRematch,
  onMenu,
}: {
  result: MatchResult;
  onRematch: () => void;
  onMenu: () => void;
}) {
  const winColor = result.winner === 0 ? "#ff4d80" : "#3d8bfd";
  const winDark = result.winner === 0 ? "#c91e58" : "#1c5cc4";
  const line = useMemo(
    () => ROMANTIC_LINES[Math.floor(Math.random() * ROMANTIC_LINES.length)],
    []
  );
  const total = result.scores[0] + result.scores[1];
  const margin = Math.abs(result.scores[0] - result.scores[1]);
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center px-4 overflow-y-auto"
      style={{
        background:
          "radial-gradient(120% 100% at 50% 20%, rgba(255,110,160,0.5), rgba(45,10,55,0.82))",
      }}
    >
      <FloatingHearts />
      <div className="anim-pop glass rounded-3xl px-5 py-6 flex flex-col items-center gap-2 w-full max-w-sm my-4">
        <div className="text-5xl anim-heartbeat">🏆❤️</div>
        <div className="text-pink-100 font-semibold text-sm tracking-widest">WINNER</div>
        <h2
          className="font-game font-bold text-4xl"
          style={{
            color: winColor,
            textShadow: "0 3px 0 rgba(0,0,0,0.25)",
          }}
        >
          PLAYER {result.winner + 1}
        </h2>
        <p className="text-white/90 text-sm text-center font-semibold">{line}</p>

        <div className="flex items-stretch gap-3 mt-2 w-full">
          <div
            className="flex-1 rounded-2xl py-3 flex flex-col items-center"
            style={{
              background: result.winner === 0 ? "rgba(255,77,128,0.3)" : "rgba(255,255,255,0.08)",
              border: `2px solid ${result.winner === 0 ? winColor : "rgba(255,255,255,0.2)"}`,
            }}
          >
            <span className="text-xs font-bold text-pink-200">PLAYER 1</span>
            <span className="text-4xl font-bold text-white anim-pop" key={`a${result.scores[0]}`}>
              {result.scores[0]}
            </span>
            <span className="text-lg">❤️</span>
          </div>
          <div className="flex items-center text-white/70 font-bold">vs</div>
          <div
            className="flex-1 rounded-2xl py-3 flex flex-col items-center"
            style={{
              background: result.winner === 1 ? "rgba(61,139,253,0.3)" : "rgba(255,255,255,0.08)",
              border: `2px solid ${result.winner === 1 ? winColor : "rgba(255,255,255,0.2)"}`,
            }}
          >
            <span className="text-xs font-bold text-sky-200">PLAYER 2</span>
            <span className="text-4xl font-bold text-white anim-pop" key={`b${result.scores[1]}`}>
              {result.scores[1]}
            </span>
            <span className="text-lg">❤️</span>
          </div>
        </div>

        <div className="flex gap-2 text-[11px] text-white/80 font-semibold mt-1">
          <span className="glass rounded-full px-2.5 py-1">⏱ {fmtClock(result.time)}</span>
          <span className="glass rounded-full px-2.5 py-1">💕 {total} hearts collected</span>
          <span className="glass rounded-full px-2.5 py-1">
            {margin === 0 ? "Tied!" : `Won by ${margin}`}
          </span>
        </div>

        <BigButton
          onClick={onRematch}
          color={winColor}
          dark={winDark}
          className="mt-3 w-full text-xl"
        >
          🔁 REMATCH! <span className="text-sm opacity-80">(R)</span>
        </BigButton>
        <BigButton
          onClick={onMenu}
          color="#6c7a93"
          dark="#4a5568"
          className="w-full text-base py-2.5"
        >
          🏠 Main Menu
        </BigButton>
        <p className="text-pink-100/60 text-[11px] text-center">
          …and remember: in love and heart racing, everything is fair 😘
        </p>
      </div>
    </div>
  );
}
