import { useEffect, useState } from "preact/hooks";
import { act, answer, newGame, type Action } from "../engine/game";
import type { GameState } from "../engine/types";
import { beaten, loadProgress, recordResult, type Progress } from "./progress";
import { applyResult, campaignById, CAMPAIGNS, chooseReward, loadCampaign, missionScenario, newCampaign, saveCampaign, setupFor } from "./campaign";

const KEY = "heroica.partida";

/**
 * The running game: the state, a single-step undo and saving to this device after every change.
 *
 * Undo keeps exactly one snapshot: the state before the last player action or decision. Using it
 * restores that snapshot and empties the buffer, so only one mistake can be taken back. The buffer
 * is dropped as soon as hidden cards were seen (draws, shuffles, deck reveals, Drones) or the
 * villain phase starts, so undo can never be used to peek at the deck.
 */
class Store {
  state: GameState | null = load();
  previous: string | null = null;
  /** Saved campaign progress, and the heroes that beat this scenario for the first time in this game. */
  progress: Progress = loadProgress();
  firstWins: string[] = [];
  /** Saved campaigns, and what the last campaign mission changed (for the end screen). */
  campaigns = Object.fromEntries(CAMPAIGNS.map((c) => [c.id, loadCampaign(c.id)]));
  campaignLines: string[] = [];
  error?: string;
  private listeners = new Set<() => void>();
  private errorTimer?: ReturnType<typeof setTimeout>;

  subscribe(fn: () => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }
  private changed() {
    if (this.state) save(this.state); else clear();
    for (const fn of this.listeners) fn();
  }

  start(scenario: string, heroes: string[], difficulty: "normal" | "experto" = "normal") {
    this.state = newGame(scenario, heroes, undefined, difficulty);
    this.previous = null;
    this.firstWins = [];
    this.campaignLines = [];
    this.changed();
  }

  /** Campaign mode: start a new campaign (replacing any in progress) or play its next mission. */
  startCampaign(id: string, heroes: string[], difficulty: "normal" | "experto") {
    const saved = this.campaigns[id];
    saved.active = newCampaign(id, heroes, difficulty);
    saveCampaign(id, saved);
    this.playMission(id);
  }
  playMission(id: string) {
    const c = this.campaigns[id].active;
    if (!c || c.pendingReward || c.step >= campaignById(id)!.scenarios.length) return;
    this.state = newGame(missionScenario(c), c.heroes, undefined, c.difficulty, setupFor(c));
    this.previous = null;
    this.firstWins = [];
    this.campaignLines = [];
    this.changed();
  }
  abandonCampaign(id: string) {
    const saved = this.campaigns[id];
    saved.active = undefined;
    saveCampaign(id, saved);
    for (const fn of this.listeners) fn();
  }
  chooseReward(id: string, hero: string, card: string) {
    const saved = this.campaigns[id];
    if (!saved.active) return;
    chooseReward(saved.active, hero, card);
    saveCampaign(id, saved);
    for (const fn of this.listeners) fn();
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
    const before = JSON.parse(snapshot) as GameState;
    if (!before.result && s.result) this.finish(s);
    const revealed = !!s.revealed;
    s.revealed = false;
    // One step back, only within the players' phase and only if nothing hidden was seen.
    this.previous = s.phase === "jugadores" && before.phase === "jugadores" && !revealed && !s.result ? snapshot : null;
  }

  /** A game just ended: save it to the progress of every hero that played. */
  private finish(s: GameState) {
    const was = s.players.map((pl) => beaten(this.progress, pl.hero, s.scenario));
    this.progress = recordResult(s, this.progress);
    this.firstWins = s.players.filter((pl, i) => {
      const now = beaten(this.progress, pl.hero, s.scenario);
      return now && now !== was[i];
    }).map((pl) => pl.hero);
    // Campaign mission: carry its consequences (only once, and only for the mission in progress).
    const cs = s.campaign;
    const saved = cs && this.campaigns[cs.id];
    if (saved?.active && saved.active.step === cs!.step) {
      this.campaignLines = applyResult(saved.active, s);
      const n = campaignById(cs!.id)!.scenarios.length;
      saved.unlocked = Math.max(saved.unlocked, Math.min(n - 1, saved.active.step));
      if (saved.active.step >= n) saved.completed++;
      saveCampaign(cs!.id, saved);
    }
  }

  reloadProgress() { this.progress = loadProgress(); for (const fn of this.listeners) fn(); }

  get canUndo() { return this.previous !== null; }
  undo() {
    if (!this.previous) return;
    this.state = JSON.parse(this.previous);
    this.previous = null;
    this.changed();
  }

  quit() { this.state = null; this.previous = null; this.firstWins = []; this.campaignLines = []; this.changed(); }

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
