import type { GameState } from "../engine/types";

/**
 * Campaign progress, saved on this device: for each hero and each scenario, how many games were
 * won and lost on each difficulty and the fastest win (in rounds). A two-handed game counts for
 * both heroes.
 */
export type Difficulty = "normal" | "experto";
export interface Record_ { wins: number; losses: number; bestRound?: number; lastWin?: string }
export type Progress = Record<string, Record<string, Partial<Record<Difficulty, Record_>>>>;

const KEY = "heroica.progreso";

export function loadProgress(): Progress {
  try {
    const t = localStorage.getItem(KEY);
    const p = t ? (JSON.parse(t) as Progress) : {};
    return p && typeof p === "object" ? p : {};
  } catch { return {}; }
}

function saveProgress(p: Progress) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage full or blocked */ } }

/** Adds a finished game to the progress (once per game). Returns the updated progress. */
export function recordResult(s: GameState, p: Progress = loadProgress()): Progress {
  if (!s.result) return p;
  for (const pl of s.players) {
    const byScenario = (p[pl.hero] ??= {});
    const byDiff = (byScenario[s.scenario] ??= {});
    const r = (byDiff[s.difficulty] ??= { wins: 0, losses: 0 });
    if (s.result === "victoria") {
      r.wins++;
      r.bestRound = Math.min(r.bestRound ?? Infinity, s.round);
      r.lastWin = new Date().toISOString().slice(0, 10);
    } else r.losses++;
  }
  saveProgress(p);
  return p;
}

export function resetProgress() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }

/** The best result of a hero against a scenario: "experto" beats "normal". */
export function beaten(p: Progress, hero: string, scenario: string): Difficulty | undefined {
  const d = p[hero]?.[scenario];
  if (d?.experto?.wins) return "experto";
  if (d?.normal?.wins) return "normal";
  return undefined;
}

export function tried(p: Progress, hero: string, scenario: string): boolean {
  const d = p[hero]?.[scenario];
  return !!d && Object.values(d).some((r) => r && r.wins + r.losses > 0);
}

/**
 * A full save file: hero progress, every campaign and the game in progress. Moves your adventure
 * to another device or browser, or keeps a copy in case the browser clears its data.
 * Old files (version 1, progress only) still load.
 */
const SAVE_KEYS = (k: string) => k === KEY || k === "heroica.partida" || k.startsWith("heroica.campana.");

export function exportProgress(): string {
  const datos: Record<string, unknown> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (SAVE_KEYS(k)) datos[k] = JSON.parse(localStorage.getItem(k)!);
    }
  } catch { /* storage blocked */ }
  return JSON.stringify({ heroica: 2, fecha: new Date().toISOString().slice(0, 10), datos }, null, 1);
}

export function importProgress(text: string): string | undefined {
  try {
    const data = JSON.parse(text) as { heroica?: number; progreso?: Progress; datos?: Record<string, unknown> };
    if (data?.heroica === 1 && data.progreso && typeof data.progreso === "object") { saveProgress(data.progreso); return undefined; }
    if (data?.heroica !== 2 || !data.datos || typeof data.datos !== "object") return "Ese archivo no es una partida guardada de Heroica.";
    const entries = Object.entries(data.datos).filter(([k, v]) => SAVE_KEYS(k) && v && typeof v === "object");
    if (!entries.length) return "Ese archivo está vacío.";
    // Replace the whole save, so nothing from the old one is mixed in.
    for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i)!; if (SAVE_KEYS(k)) localStorage.removeItem(k); }
    for (const [k, v] of entries) localStorage.setItem(k, JSON.stringify(v));
    return undefined;
  } catch { return "No se pudo leer el archivo."; }
}
