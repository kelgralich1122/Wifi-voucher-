import { useEffect, useRef, useState, useCallback } from "react";
import { createGame, type GameApi, type HudState, type MatchResult } from "./game/engine";
import { AudioEngine } from "./game/audio";
import {
  loadScores,
  saveScore,
  loadMuted,
  storeMuted,
  type ScoreEntry,
} from "./game/storage";
import Hud from "./components/Hud";
import { StartScreen, PauseScreen, GameOverScreen } from "./components/Screens";

type Screen = "menu" | "play" | "paused" | "over";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameApi | null>(null);
  const audioRef = useRef<AudioEngine | null>(null);
  const screenRef = useRef<Screen>("menu");
  const overTimer = useRef<number | null>(null);

  const [screen, setScreen] = useState<Screen>("menu");
  const [hud, setHud] = useState<HudState | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [scores, setScores] = useState<ScoreEntry[]>(() => loadScores());
  const [muted, setMuted] = useState(() => loadMuted());
  const [touchHint, setTouchHint] = useState(true);
  const [rotateHint, setRotateHint] = useState(true);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const audio = new AudioEngine();
    audio.muted = loadMuted();
    audioRef.current = audio;
    const game = createGame(canvasRef.current, audio, {
      onHud: (h) => setHud(h),
      onGameOver: (r) => {
        setResult(r);
        setScores(saveScore({ winner: r.winner, scores: r.scores, time: Math.floor(r.time) }));
        if (overTimer.current) window.clearTimeout(overTimer.current);
        overTimer.current = window.setTimeout(() => setScreen("over"), 1700);
      },
      onTogglePause: () => {
        const s = screenRef.current;
        if (s === "play") {
          game.pause();
          setScreen("paused");
        } else if (s === "paused") {
          game.resume();
          setScreen("play");
        }
      },
    });
    gameRef.current = game;
    return () => {
      game.destroy();
      if (overTimer.current) window.clearTimeout(overTimer.current);
    };
  }, []);

  const startMatch = useCallback(() => {
    const audio = audioRef.current;
    const game = gameRef.current;
    if (!audio || !game) return;
    audio.ensure();
    audio.click();
    audio.startMusic();
    if (overTimer.current) window.clearTimeout(overTimer.current);
    setResult(null);
    setHud(null);
    setTouchHint(true);
    game.startMatch();
    setScreen("play");
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.setTimeout(() => setTouchHint(false), 7000);
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.click();
    gameRef.current?.resume();
    setScreen("play");
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.click();
    gameRef.current?.pause();
    setScreen("paused");
  }, []);

  const goMenu = useCallback(() => {
    audioRef.current?.click();
    if (overTimer.current) window.clearTimeout(overTimer.current);
    gameRef.current?.toIdle();
    setResult(null);
    setScreen("menu");
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      const audio = audioRef.current;
      if (audio) {
        audio.ensure();
        audio.setMuted(next);
      }
      storeMuted(next);
      return next;
    });
  }, []);

  // global menu shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const s = screenRef.current;
      if (k === "enter" && s === "menu") startMatch();
      if ((k === "r" && (s === "over" || s === "paused")) || (k === "enter" && s === "over"))
        startMatch();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [startMatch]);

  return (
    <div
      className="fixed inset-0 overflow-hidden select-none"
      style={{
        background:
          "radial-gradient(130% 100% at 50% 0%, #b13d8a 0%, #6b1f6e 45%, #2a0a2e 100%)",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {(screen === "play" || screen === "paused") && (
        <Hud hud={hud} muted={muted} onPause={pause} onMute={toggleMute} />
      )}

      {/* touch discoverability hint */}
      {screen === "play" && touchHint && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-between px-6 sm:hidden">
          <span className="glass rounded-full px-3 py-1 text-[11px] font-semibold text-pink-100">
            👈 drag here — P1
          </span>
          <span className="glass rounded-full px-3 py-1 text-[11px] font-semibold text-sky-100">
            P2 — drag here 👉
          </span>
        </div>
      )}

      {(screen === "menu" || screen === "over") && (
        <button
          onClick={toggleMute}
          className="btn-juicy absolute top-3 right-3 z-30 w-10 h-10 rounded-full glass text-lg flex items-center justify-center"
          aria-label="Toggle sound"
        >
          {muted ? "🔇" : "🔊"}
        </button>
      )}

      {screen === "menu" && <StartScreen onStart={startMatch} scores={scores} />}
      {screen === "paused" && (
        <PauseScreen onResume={resume} onRestart={startMatch} onMenu={goMenu} />
      )}
      {screen === "over" && result && (
        <GameOverScreen result={result} onRematch={startMatch} onMenu={goMenu} />
      )}

      {/* rotate hint (portrait phones) */}
      {rotateHint && (
        <div className="hidden portrait:pointer-coarse:flex absolute bottom-2 left-1/2 -translate-x-1/2 z-30 items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-semibold text-white">
          <span className="anim-wiggle inline-block">📱↺</span>
          Rotate for the best date (landscape)!
          <button
            className="ml-1 text-white/70"
            onClick={() => setRotateHint(false)}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
