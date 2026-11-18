import { describe, expect, it } from "vitest";
import { act, answer, canPlay, handSize, runVillain, heroOf, heroStats, mainPlan, newGame, pcard, planLimit, resourcesOf, villainStats } from "../engine/game";
import type { GameState } from "../engine/types";
import { ENCOUNTER_CARDS, ENCOUNTER_SETS, HEROES, PLAYER_CARDS, SCENARIOS } from "../data/content";

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
    const ab = pcard(s, c.uid).ability;
    if (ab?.timing === "action" && !c.exhausted && !c.usedThisRound && p.play.includes(c)) { act(s, { a: "useCard", player: i, card: c.uid }); settle(); }
  }
  // A hero whose hand is small in hero form goes back to its identity to draw more.
  if (!s.result && p.form === "heroe" && !p.flippedThisTurn && heroOf(p).identity.mano > handSize(s, i) + 1) { act(s, { a: "flip", player: i }); settle(); }
  if (!s.result && p.form === "identidad" && heroOf(p).identityAbility && !p.identityAbilityUsed) { act(s, { a: "identityAbility", player: i }); settle(); }
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
  for (const p of s.players) n += p.deck.length + p.hand.length + p.discard.length + p.play.length + p.engaged.length + (p.nemesis?.length ?? 0);
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
      for (const heroes of [["brasa"], ["vigia"], ["guardian"], ["sombra"], ["celeste"], ["vanguardia"], ["brasa", "vigia"], ["guardian", "sombra"], ["celeste", "brasa"], ["vanguardia", "guardian"]]) {
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

describe("Vanguardia de Titanio vs. Mazagón (El Asalto al Arsenal)", () => {
  const SC = "asalto-arsenal";

  it("every hero deck and encounter set only uses cards that exist", () => {
    for (const h of HEROES) {
      for (const id of h.deck) expect(PLAYER_CARDS.has(id), `${h.id}: ${id}`).toBe(true);
      for (const id of [...(h.nemesis ?? []), ...(h.obligation ? [h.obligation] : [])]) expect(ENCOUNTER_CARDS.has(id), `${h.id}: ${id}`).toBe(true);
    }
    for (const [set, ids] of Object.entries(ENCOUNTER_SETS)) for (const id of ids) expect(ENCOUNTER_CARDS.has(id), `${set}: ${id}`).toBe(true);
  });

  it("has a 40-card deck: 15 signature cards and 25 others", () => {
    const h = HEROES.find((x) => x.id === "vanguardia")!;
    expect(h.deck).toHaveLength(40);
    const signature = ["guantelete-plasma", "visor-tactico", "nucleo-fusion", "propulsores-dorsales", "canon-hombro", "lumen-ia", "forja-tecnologica", "pulso-ionico", "impacto-supersonico"];
    expect(h.deck.filter((id) => signature.includes(id))).toHaveLength(15);
    expect(h.deck.filter((id) => PLAYER_CARDS.get(id)!.type === "recurso")).toHaveLength(6);
  });

  it("hand size: 6 as Iria, 1 as Vanguardia +1 per Tecnología, up to 7", () => {
    const s = newGame(SC, ["vanguardia"], 7);
    expect(s.players[0].hand).toHaveLength(6);
    expect(handSize(s, 0)).toBe(6);
    act(s, { a: "flip", player: 0 });
    expect(handSize(s, 0)).toBe(1);
    const tech = Object.entries(s.cards).filter(([, d]) => PLAYER_CARDS.get(d)?.traits?.includes("tecnologia")).map(([u]) => u);
    for (const uid of tech.slice(0, 3)) s.players[0].play.push({ uid, def: s.cards[uid], exhausted: false, damage: 0 });
    expect(handSize(s, 0)).toBe(4);
    for (const uid of tech.slice(3)) s.players[0].play.push({ uid, def: s.cards[uid], exhausted: false, damage: 0 });
    expect(tech.length).toBeGreaterThan(6);
    expect(handSize(s, 0)).toBe(7);
    const st = heroStats(s, 0);
    expect([heroOf(s.players[0]).hero.fuerza, heroOf(s.players[0]).hero.ingenio, heroOf(s.players[0]).hero.aguante, heroOf(s.players[0]).vida]).toEqual([1, 1, 1, 9]);
    expect(st.vidaMax).toBeGreaterThan(9); // Propulsores add +1 each
  });

  it("I+D nocturno: look at 3, keep 1, discard 2; once per round, identity only", () => {
    const s = newGame(SC, ["vanguardia"], 8);
    const p = s.players[0];
    const top = p.deck.slice(0, 3);
    expect(act(s, { a: "identityAbility", player: 0 })).toBeUndefined();
    expect(s.prompt?.options.map((o) => o.id)).toEqual(top);
    answer(s, top[1]);
    expect(p.hand).toContain(top[1]);
    expect(p.discard).toEqual([top[0], top[2]]);
    expect(p.deck).not.toContain(top[0]);
    expect(act(s, { a: "identityAbility", player: 0 })).toBe("Ya la usaste esta ronda.");
    act(s, { a: "flip", player: 0 });
    expect(act(s, { a: "identityAbility", player: 0 })).toBe("Solo en forma de identidad.");
  });

  it("Normal uses stages I-II; Expert uses II-III with Embestida attached and the 3 expert cards", () => {
    const n = newGame(SC, ["vanguardia"], 9, "normal");
    expect(villainStats(n)).toMatchObject({ name: "Mazagón I", fuerza: 2, plan: 1, vidaMax: 14 });
    expect(n.villain.attachments).toHaveLength(0);
    expect(planLimit(n)).toBe(14);
    // 11 villain + 5 bomb + 2 standard + 1 obligation
    expect(n.encounterDeck).toHaveLength(19);
    expect(Object.values(n.cards).filter((d) => ["silas-corven", "opa-hostil", "sabotaje-industrial"].includes(d))).toHaveLength(3);
    expect(n.players[0].nemesis).toHaveLength(3);

    const x = newGame(SC, ["vanguardia"], 9, "experto");
    expect(villainStats(x)).toMatchObject({ name: "Mazagón II", fuerza: 3 + 2, plan: 1, vidaMax: 15 });
    expect(x.villain.attachments.map((u) => x.cards[u])).toEqual(["embestida"]);
    expect(x.encounterDeck).toHaveLength(19 + 3 - 1);
    expect(x.encounterDeck.some((u) => x.cards[u] === "furia-desatada")).toBe(false);
    expect(x.encounterDeck.filter((u) => ["carga-brutal", "bramido", "mercenario-veterano"].includes(x.cards[u]))).toHaveLength(3);

    // Beating stage II in Expert reveals stage III, which is Duro.
    x.villain.damage = 14;
    x.villain.attachments = [];
    x.players[0].form = "heroe";
    act(x, { a: "attack", player: 0 });
    while (x.prompt) answer(x, x.prompt.options[0].id);
    expect(villainStats(x)).toMatchObject({ name: "Mazagón III", fuerza: 4, vidaMax: 16 });
    expect(x.villain.tough).toBe(true);
    // Duro cancels the next damage, then it's gone.
    x.players[0].heroExhausted = false;
    act(x, { a: "attack", player: 0 });
    expect(x.villain.damage).toBe(0);
    expect(x.villain.tough).toBe(false);
  });

  it("Normal: beating stage I attaches Embestida, which goes after the villain's next attack", () => {
    const s = newGame(SC, ["vanguardia"], 10, "normal");
    s.villain.damage = 13;
    s.players[0].form = "heroe";
    act(s, { a: "attack", player: 0 });
    expect(villainStats(s)).toMatchObject({ name: "Mazagón II", fuerza: 5 });
    expect(s.villain.attachments.map((u) => s.cards[u])).toEqual(["embestida"]);
    act(s, { a: "endTurn", player: 0, discard: [] });
    expect(s.prompt?.kind).toBe("defense");
    expect(s.prompt?.text).toMatch(/ataca con (5|6|7|8)\b/);
    answer(s, "none");
    while (s.prompt?.kind === "optional") answer(s, "no");
    expect(s.villain.attachments.some((u) => s.cards[u] === "embestida")).toBe(false);
  });

  it("obligation: the owner chooses between losing the next action and +2 threat", () => {
    for (const [choice, check] of [["0", (s: GameState) => expect(s.players[0].heroExhausted).toBe(true)], ["1", (s: GameState) => expect(mainPlan(s).threat).toBe(2)]] as const) {
      const s = newGame(SC, ["vanguardia"], 13);
      const uid = Object.keys(s.cards).find((u) => s.cards[u] === "junta-accionistas")!;
      s.encounterDeck = s.encounterDeck.filter((u) => u !== uid);
      s.phase = "villano";
      s.villainQueue = [{ s: "reveal", player: 0, card: uid }, { s: "endRound" }];
      runVillain(s);
      expect(s.prompt?.text).toBe("Junta de Accionistas: ¿acudes?");
      answer(s, choice);
      check(s);
      expect(s.phase).toBe("jugadores");
    }
  });

  it("nemesis comes in once; bomb treacheries arm and detonate the side plan", () => {
    const s = newGame(SC, ["vanguardia"], 12);
    const p = s.players[0];
    const uidOf = (def: string) => Object.keys(s.cards).find((u) => s.cards[u] === def)!;
    const reveal = (def: string) => {
      const uid = uidOf(def);
      s.encounterDeck = s.encounterDeck.filter((u) => u !== uid);
      s.encounterDiscard = s.encounterDiscard.filter((u) => u !== uid);
      s.phase = "villano";
      s.villainQueue = [{ s: "reveal", player: 0, card: uid }, { s: "endRound" }];
      runVillain(s);
    };
    reveal("viejas-cuentas");
    expect(p.engaged.map((m) => m.def)).toContain("silas-corven");
    expect(s.plans.map((x) => x.def)).toContain("opa-hostil");
    expect(p.nemesis).toEqual([]);
    expect(s.encounterDeck.some((u) => s.cards[u] === "sabotaje-industrial")).toBe(true);

    reveal("falsa-alarma");
    const bomb = () => s.plans.find((x) => x.def === "artefacto-explosivo");
    expect(bomb()?.threat).toBe(3);
    const second = Object.keys(s.cards).filter((u) => s.cards[u] === "falsa-alarma")[1];
    s.encounterDeck = s.encounterDeck.filter((u) => u !== second);
    s.phase = "villano";
    s.villainQueue = [{ s: "reveal", player: 0, card: second }, { s: "endRound" }];
    runVillain(s);
    expect(bomb()?.threat).toBe(5);
    const before = p.damage;
    reveal("detonacion");
    expect(p.damage - before).toBe(5);
    expect(bomb()).toBeUndefined();
  });

  it("plays complete Normal and Expert games without losing cards", () => {
    for (const difficulty of ["normal", "experto"] as const) {
      let wins = 0, rounds = 0;
      const N = 60;
      for (let seed = 1; seed <= N; seed++) {
        const s = newGame(SC, ["vanguardia"], seed * 7919, difficulty);
        const total = Object.keys(s.cards).length;
        let turns = 0;
        while (!s.result && turns++ < 400) botTurn(s);
        expect(s.result, `${difficulty} seed ${seed}`).toBeDefined();
        expect(cardsAccounted(s), `${difficulty} seed ${seed}: cartas`).toBe(total);
        if (s.result === "victoria") wins++;
        rounds += s.round;
      }
      console.log(`Vanguardia vs Mazagón (${difficulty}): bot ${wins}/${N} victorias, ${(rounds / N).toFixed(1)} rondas de media`);
    }
  });
});
