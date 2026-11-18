import { describe, expect, it } from "vitest";
import { act, answer, canPlay, heroStats, mainPlan, newGame, pcard, planLimit, resourcesOf, villainStats } from "../engine/game";
import type { GameState } from "../engine/types";
import { SCENARIOS } from "../data/content";

/** A simple bot: plays what it can afford, attacks or thwarts, defends with the hero. */
function botTurn(s: GameState): void {
  const i = s.active;
  const p = s.players[i];
  let guard = 0;
  const settle = () => { while (s.prompt && guard++ < 200) answer(s, s.prompt.options[0].id); };
  settle();
  if (s.result || s.phase !== "jugadores") return;
  if (p.form === "identidad" && p.damage < heroStats(s, i).vidaMax - 3) act(s, { a: "flip", player: i });
  else if (p.form === "identidad") act(s, { a: "recover", player: i });
  settle();
  for (const uid of [...p.hand]) {
    if (s.result || !p.hand.includes(uid) || canPlay(s, i, uid)) continue;
    const c = pcard(s, uid);
    const pay: string[] = [];
    for (const u of p.hand) { if (u === uid) continue; if (resourcesOf(s, pay) >= c.cost) break; pay.push(u); }
    act(s, { a: "play", player: i, card: uid, pay });
    settle();
  }
  if (p.form === "heroe" && !p.heroExhausted && !s.result) {
    const threatening = mainPlan(s).threat >= planLimit(s) * 0.6;
    act(s, { a: threatening ? "thwart" : "attack", player: i });
    settle();
  }
  for (const c of [...p.play]) {
    if (s.result) break;
    if (pcard(s, c.uid).ally && !c.exhausted) { act(s, { a: "allyAttack", player: i, ally: c.uid }); settle(); }
  }
  if (!s.result) act(s, { a: "endTurn", player: i, discard: [] });
  settle();
}

function play(heroes: string[], seed: number, scenario = "eclipse-ceniza") {
  const s = newGame(scenario, heroes, seed, seed % 3 === 0 ? "experto" : "normal");
  const total = Object.keys(s.cards).length;
  let turns = 0;
  while (!s.result && turns++ < 400) botTurn(s);
  return { s, total, turns };
}

/** Every card is in exactly one place. */
function cardsAccounted(s: GameState): number {
  let n = s.encounterDeck.length + s.encounterDiscard.length + s.villain.attachments.length + s.plans.filter((p) => p.def !== "main").length;
  for (const p of s.players) n += p.deck.length + p.hand.length + p.discard.length + p.play.length + p.engaged.length;
  return n;
}

describe("Heroica engine", () => {
  it("sets up a game: hands, main plan, encounter deck", () => {
    const s = newGame("eclipse-ceniza", ["brasa"], 1);
    expect(s.players[0].hand).toHaveLength(6);
    expect(mainPlan(s).threat).toBe(0);
    expect(s.encounterDeck.length).toBeGreaterThan(10);
    expect(villainStats(s).vidaMax).toBe(10);
    const x = newGame("eclipse-ceniza", ["celeste"], 1, "experto");
    expect(villainStats(x).vidaMax).toBe(12);
    expect(x.encounterDeck.length).toBe(s.encounterDeck.length + 2);
  });

  it("plays complete solo and two-handed games to an end without losing cards", () => {
    const results: string[] = [];
    let rounds = 0;
    for (let seed = 1; seed <= 12; seed++) {
      for (const scenario of SCENARIOS.map((x) => x.id))
      for (const heroes of [["brasa"], ["vigia"], ["guardian"], ["sombra"], ["celeste"], ["brasa", "vigia"], ["guardian", "sombra"], ["celeste", "brasa"]]) {
        const { s, total } = play(heroes, seed, scenario);
        expect(s.result, `seed ${seed} ${scenario} ${heroes}`).toBeDefined();
        expect(cardsAccounted(s), `seed ${seed} ${scenario} ${heroes}: cartas`).toBe(total);
        results.push(s.result!);
        rounds += s.round;
      }
    }
    const wins = results.filter((r) => r === "victoria").length;
    console.log(`bot: ${wins}/${results.length} victorias, ${(rounds / results.length).toFixed(1)} rondas de media`);
    expect(wins).toBeGreaterThan(0);
    expect(wins).toBeLessThan(results.length);
  });

  it("asks for a defence when the villain attacks a hero", () => {
    const s = newGame("eclipse-ceniza", ["brasa"], 3);
    act(s, { a: "flip", player: 0 });
    act(s, { a: "endTurn", player: 0, discard: [] });
    expect(s.phase).toBe("villano");
    expect(s.prompt?.kind).toBe("defense");
    const before = s.players[0].damage;
    answer(s, "hero");
    // Defended: Aguante 2 against Fuerza 1 + boost.
    while (s.prompt) answer(s, s.prompt.options[s.prompt.options.length - 1].id);
    expect(s.players[0].damage).toBeGreaterThanOrEqual(before);
  });

  it("refuses illegal actions", () => {
    const s = newGame("eclipse-ceniza", ["brasa"], 4);
    expect(act(s, { a: "attack", player: 0 })).toBe("Solo en forma de héroe.");
    expect(act(s, { a: "recover", player: 1 })).toBe("No es tu turno.");
  });
});
