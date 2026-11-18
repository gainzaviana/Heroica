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

/** Download the progress as a file, and read it back (to move it to another device). */
export function exportProgress(): string { return JSON.stringify({ heroica: 1, progreso: loadProgress() }, null, 1); }
export function importProgress(text: string): string | undefined {
  try {
    const data = JSON.parse(text) as { heroica?: number; progreso?: Progress };
    if (data?.heroica !== 1 || typeof data.progreso !== "object") return "Ese archivo no es un progreso de Heroica.";
    saveProgress(data.progreso);
    return undefined;
  } catch { return "No se pudo leer el archivo."; }
}
