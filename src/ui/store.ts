import { useEffect, useState } from "preact/hooks";
import { act, answer, newGame, type Action } from "../engine/game";
import type { GameState } from "../engine/types";

const KEY = "heroica.partida";

/**
 * The running game: the state, undo history (within the players' phase: once the villain acts,
 * hidden cards have been seen) and saving to this device after every change.
 */
class Store {
  state: GameState | null = load();
  history: string[] = [];
  error?: string;
  private listeners = new Set<() => void>();
  private errorTimer?: ReturnType<typeof setTimeout>;

  subscribe(fn: () => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }
  private changed() {
    if (this.state) save(this.state); else clear();
    for (const fn of this.listeners) fn();
  }

  start(scenario: string, heroes: string[]) {
    this.state = newGame(scenario, heroes);
    this.history = [];
    this.changed();
  }

  /** Runs a player action; returns the reason if it isn't allowed. */
  act(a: Action): string | undefined {
    const s = this.state;
    if (!s) return "No hay partida.";
    const snapshot = JSON.stringify(s);
    const err = act(s, a);
    if (err) { this.flash(err); return err; }
    this.record(snapshot);
    this.changed();
    return undefined;
  }

  answer(option: string) {
    const s = this.state;
    if (!s) return;
    const snapshot = JSON.stringify(s);
    const err = answer(s, option);
    if (err) { this.flash(err); return; }
    this.record(snapshot);
    this.changed();
  }

  private record(snapshot: string) {
    const s = this.state!;
    // Undo only within the players' phase.
    if (s.phase === "jugadores" && JSON.parse(snapshot).phase === "jugadores") {
      this.history.push(snapshot);
      if (this.history.length > 40) this.history.shift();
    } else this.history = [];
  }

  get canUndo() { return this.history.length > 0; }
  undo() {
    const snap = this.history.pop();
    if (!snap) return;
    this.state = JSON.parse(snap);
    this.changed();
  }

  quit() { this.state = null; this.history = []; this.changed(); }

  flash(text: string) {
    this.error = text;
    clearTimeout(this.errorTimer);
    this.errorTimer = setTimeout(() => { this.error = undefined; for (const fn of this.listeners) fn(); }, 2600);
    for (const fn of this.listeners) fn();
  }
}

function load(): GameState | null {
  try { const t = localStorage.getItem(KEY); return t ? (JSON.parse(t) as GameState) : null; } catch { return null; }
}
function save(s: GameState) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage full or blocked */ } }
function clear() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }

export const store = new Store();

export function useStore(): Store {
  const [, set] = useState(0);
  useEffect(() => store.subscribe(() => set((n) => n + 1)), []);
  return store;
}
