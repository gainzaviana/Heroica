import { describe, expect, it } from "vitest";
import { act, allyStats, answer, canPlay, resourceSources, handSize, runVillain, heroOf, heroStats, mainPlan, mainPlanStages, minionStats, newGame, pcard, planLimit, resourcesOf, villainStats, villainTraits } from "../engine/game";
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
  // Back to the identity to draw more (small hero hand) or to recover when badly hurt.
  const hurt = p.damage >= heroStats(s, i).vidaMax * 0.6;
  if (!s.result && p.form === "heroe" && !p.flippedThisTurn && (hurt || heroOf(p).identity.mano > handSize(s, i) + 1)) { act(s, { a: "flip", player: i }); settle(); }
  if (!s.result && p.form === "identidad" && heroOf(p).identityAbility && !p.identityAbilityUsed) { act(s, { a: "identityAbility", player: i }); settle(); }
  if (!s.result) act(s, { a: "endTurn", player: i, discard: [] });
  settle();
}

function play(heroes: string[], seed: number, scenario = "asalto-arsenal") {
  const s = newGame(scenario, heroes, seed, seed % 3 === 0 ? "experto" : "normal");
  const total = Object.keys(s.cards).length;
  let turns = 0;
  while (!s.result && turns++ < 400) botTurn(s);
  return { s, total, turns };
}

/** Every card is in exactly one place. */
function cardsAccounted(s: GameState): number {
  let n = s.encounterDeck.length + s.encounterDiscard.length + s.villain.attachments.length + s.plans.filter((p) => p.def !== "main").length;
  n += Object.values(s.sideDecks ?? {}).reduce((a, d) => a + d.length, 0) + (s.setAside?.length ?? 0) + (s.environment ? 1 : 0) + (s.captives?.cards.length ?? 0);
  for (const p of s.players) n += p.deck.length + p.hand.length + p.discard.length + p.play.length + p.engaged.length + (p.nemesis?.length ?? 0);
  // Player cards attached to allies, minions or the villain.
  for (const p of s.players) n += p.play.reduce((a, c) => a + (c.attached?.length ?? 0), 0) + p.engaged.reduce((a, m) => a + (m.attached?.length ?? 0), 0);
  n += s.villain.playerAttached?.length ?? 0;
  return n;
}

describe("Heroica engine", () => {
  it("sets up a game: hands, main plan, encounter deck", () => {
    const s = newGame("asalto-arsenal", ["vanguardia"], 1);
    expect(s.players[0].hand).toHaveLength(6);
    expect(mainPlan(s).threat).toBe(0);
    expect(s.encounterDeck.length).toBeGreaterThan(10);
    expect(villainStats(s).vidaMax).toBe(14);
    const x = newGame("asalto-arsenal", ["vanguardia"], 1, "experto");
    expect(villainStats(x).vidaMax).toBe(15);
    expect(x.encounterDeck.length).toBe(s.encounterDeck.length + 3 - 1); // +3 expert, −1 Embestida attached
  });

  it("plays complete solo and two-handed games to an end without losing cards", () => {
    const results: string[] = [];
    let rounds = 0;
    for (let seed = 1; seed <= 12; seed++) {
      for (const scenario of SCENARIOS.map((x) => x.id))
      for (const heroes of [...HEROES.map((h) => [h.id]), ["vanguardia", "funambula"], ["mole", "centella"], ["soberano", "vanguardia"]]) {
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
    const s = newGame("asalto-arsenal", ["vanguardia"], 3);
    act(s, { a: "flip", player: 0 });
    act(s, { a: "endTurn", player: 0, discard: [] });
    expect(s.phase).toBe("villano");
    expect(s.prompt?.kind).toBe("defense");
    const before = s.players[0].damage;
    answer(s, "hero");
    // Defended: Aguante 1 against Fuerza 2 + boost.
    while (s.prompt) answer(s, s.prompt.options[s.prompt.options.length - 1].id);
    expect(s.players[0].damage).toBeGreaterThanOrEqual(before);
  });

  it("refuses illegal actions", () => {
    const s = newGame("asalto-arsenal", ["vanguardia"], 4);
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

describe("Recursos, estados y combos", () => {
  const SC = "asalto-arsenal";
  /** A fresh game with Vanguardia in hero form and an empty hand (cards go back to the deck). */
  function setup(seed = 21) {
    const s = newGame(SC, ["vanguardia"], seed);
    const p = s.players[0];
    p.deck.push(...p.hand); p.hand = [];
    p.form = "heroe";
    return { s, p };
  }
  const copies = (s: GameState, def: string) => Object.keys(s.cards).filter((u) => s.cards[u] === def);
  function take(s: GameState, def: string, nth = 0): string {
    const u = copies(s, def)[nth];
    const p = s.players[0];
    p.deck = p.deck.filter((x) => x !== u); p.hand = p.hand.filter((x) => x !== u); p.discard = p.discard.filter((x) => x !== u); p.play = p.play.filter((c) => c.uid !== u);
    return u;
  }
  const toHand = (s: GameState, def: string, nth = 0) => { const u = take(s, def, nth); s.players[0].hand.push(u); return u; };
  const toPlay = (s: GameState, def: string, nth = 0) => { const u = take(s, def, nth); s.players[0].play.push({ uid: u, def, exhausted: false, damage: 0 }); return u; };
  const onTop = (s: GameState, defs: string[]) => { const us = defs.map((d) => take(s, d, copies(s, d).findIndex((u) => !s.players[0].play.some((c) => c.uid === u)))); s.players[0].deck.unshift(...us); return us; };
  function engage(s: GameState, def: string) {
    const u = copies(s, def)[0];
    s.encounterDeck = s.encounterDeck.filter((x) => x !== u);
    s.players[0].engaged.push({ uid: u, def, damage: 0 });
    return u;
  }
  const settleFirst = (s: GameState) => { let g = 0; while (s.prompt && g++ < 20) answer(s, s.prompt.options[0].id); };

  it("Aturdido cancels the next basic attack, Confundido the next thwart, Duro the next damage", () => {
    const { s, p } = setup();
    p.stunned = true;
    act(s, { a: "attack", player: 0 });
    expect(s.villain.damage).toBe(0);
    expect(p.stunned).toBe(false);
    expect(p.heroExhausted).toBe(true);

    p.heroExhausted = false; p.confused = true; mainPlan(s).threat = 3;
    act(s, { a: "thwart", player: 0 });
    expect(mainPlan(s).threat).toBe(3);
    expect(p.confused).toBe(false);

    p.heroExhausted = false; s.villain.tough = true;
    act(s, { a: "attack", player: 0 });
    expect(s.villain.damage).toBe(0);
    expect(s.villain.tough).toBe(false);
    p.heroExhausted = false;
    act(s, { a: "attack", player: 0 });
    expect(s.villain.damage).toBe(1);
  });

  it("the villain: Aturdido cancels its attack, Confundido its scheme; a minion likewise", () => {
    const { s } = setup();
    s.villain.stunned = true;
    act(s, { a: "endTurn", player: 0, discard: [] }); // hero form: the villain would attack
    expect(s.villain.stunned).toBe(false);
    expect(s.log.some((l) => l.text.includes("su ataque se cancela"))).toBe(true);
    settleFirst(s);

    const x = setup(22).s;
    x.players[0].form = "identidad";
    x.villain.confused = true;
    engage(x, "maton-sueldo");
    x.players[0].engaged[0].confused = true;
    act(x, { a: "endTurn", player: 0, discard: [] });
    settleFirst(x);
    // Neither the villain nor the minion schemes.
    expect(x.log.filter((l) => l.text.includes("Confundido: no trama")).length).toBe(2);
  });

  it("no duplicate status: a second Aturdido does nothing", () => {
    const { s } = setup();
    s.villain.stunned = true;
    const toHalcon = toHand(s, "halcon-plateado");
    const pay = [toHand(s, "celula-energia"), toHand(s, "golpe-certero")];
    act(s, { a: "play", player: 0, card: toHalcon, pay });
    expect(s.log.some((l) => l.text.includes("ya está Aturdido"))).toBe(true);
  });

  it("payment is tracked by type: ¡Por Aurelia! removes 3 when paid with 🧠, 2 otherwise", () => {
    // Lumen is printed 🌟 Comodín, which counts as 🧠.
    for (const [res, removed] of [["chispa-genio", 3], ["pulso-fuerza", 2], ["lumen-ia", 3]] as const) {
      const { s } = setup();
      mainPlan(s).threat = 5;
      const card = toHand(s, "por-aurelia");
      act(s, { a: "play", player: 0, card, pay: [toHand(s, res)] });
      expect(mainPlan(s).threat, res).toBe(5 - removed);
    }
  });

  it("Pulso Iónico: 1 damage, then +2 per ⚡ (🌟 counts) among the top 5 cards, shown as a combo", () => {
    const { s, p } = setup();
    const card = toHand(s, "pulso-ionico");
    const pay = [toHand(s, "golpe-certero"), toHand(s, "golpe-certero", 1)];
    // ⚡⚡ + ⚡ + 🧠 + 🌟 + ✊  →  4 energy
    onTop(s, ["celula-energia", "guantelete-plasma", "visor-tactico", "lumen-ia", "canon-hombro"]);
    act(s, { a: "play", player: 0, card, pay });
    expect(s.villain.damage).toBe(1 + 8);
    expect(s.combo?.cards).toEqual(["celula-energia", "guantelete-plasma", "visor-tactico", "lumen-ia", "canon-hombro"]);
    expect(s.combo?.text).toContain("+8");
    expect(p.discard).toEqual(expect.arrayContaining(copies(s, "lumen-ia")));
  });

  it("Torvo reads the top card after attacking: ✊ +2, 🧠 1 to everyone, ⚡ discards him, 🌟 all three", () => {
    const cases: [string, (s: GameState, torvo: string) => void][] = [
      ["pulso-fuerza", (s) => { expect(s.villain.damage).toBe(5); }],
      ["chispa-genio", (s, t) => { expect(s.villain.damage).toBe(4); expect(s.players[0].damage).toBe(1); expect(s.players[0].play.find((c) => c.uid === t)?.damage).toBe(1); }],
      ["celula-energia", (s, t) => { expect(s.villain.damage).toBe(3); expect(s.players[0].play.some((c) => c.uid === t)).toBe(false); expect(s.players[0].discard).toContain(t); }],
      ["lumen-ia", (s, t) => { expect(s.villain.damage).toBe(3 + 2 + 1); expect(s.players[0].damage).toBe(1); expect(s.players[0].play.some((c) => c.uid === t)).toBe(false); }],
    ];
    for (const [top, check] of cases) {
      const { s } = setup();
      const torvo = toPlay(s, "torvo-iracundo");
      onTop(s, [top]);
      act(s, { a: "allyAttack", player: 0, ally: torvo });
      expect(s.combo?.cards, top).toEqual([top]);
      check(s, torvo);
    }
  });

  it("Zarpa heals 2 after her attack defeats an enemy", () => {
    const { s, p } = setup();
    const z = toPlay(s, "zarpa-cazadora");
    p.play.find((c) => c.uid === z)!.damage = 1;
    const m = engage(s, "artificiero");
    act(s, { a: "allyAttack", player: 0, ally: z });
    answer(s, m);
    expect(p.engaged).toHaveLength(0);
    expect(p.play.find((c) => c.uid === z)!.damage).toBe(0); // 1 + 1 (attacking) − 2
  });

  it("Halcón Plateado stuns an enemy when it enters play", () => {
    const { s } = setup();
    const h = toHand(s, "halcon-plateado");
    act(s, { a: "play", player: 0, card: h, pay: [toHand(s, "celula-energia"), toHand(s, "golpe-certero")] });
    expect(s.villain.stunned).toBe(true);
  });

  it("Embate Frontal: overkill to the villain only when paid with ✊", () => {
    for (const [payDef, villainDmg] of [["pulso-fuerza", 3], ["chispa-genio", 0]] as const) {
      const { s, p } = setup();
      const m = engage(s, "artificiero");
      const card = toHand(s, "embate-frontal");
      act(s, { a: "play", player: 0, card, pay: [toHand(s, payDef)] });
      expect(p.engaged.some((x) => x.uid === m)).toBe(false);
      expect(s.villain.damage, payDef).toBe(villainDmg);
    }
  });

  it("Furia Imparable hits two different enemies", () => {
    const { s, p } = setup();
    const m = engage(s, "maton-sueldo");
    const card = toHand(s, "furia-imparable");
    act(s, { a: "play", player: 0, card, pay: [toHand(s, "pulso-fuerza"), toHand(s, "golpe-certero")] });
    expect(s.prompt?.options.map((o) => o.id).sort()).toEqual([m, "villain"].sort());
    answer(s, "villain");
    expect(s.prompt).toBeNull(); // only one other enemy: chosen automatically
    expect(s.villain.damage).toBe(3);
    expect(p.engaged).toHaveLength(0); // Matón has 3 health
  });

  it("Visor Táctico removes 1 from one plan, or from every plan with Aéreo", () => {
    const { s } = setup();
    const side = copies(s, "caos-avenida")[0];
    s.encounterDeck = s.encounterDeck.filter((u) => u !== side);
    s.plans.push({ uid: side, def: "caos-avenida", threat: 4 });
    mainPlan(s).threat = 3;
    const visor = toPlay(s, "visor-tactico");
    act(s, { a: "useCard", player: 0, card: visor });
    expect(s.prompt?.kind).toBe("target");
    answer(s, "main");
    expect(mainPlan(s).threat).toBe(2);
    s.players[0].play.find((c) => c.uid === visor)!.exhausted = false;
    toPlay(s, "propulsores-dorsales");
    act(s, { a: "useCard", player: 0, card: visor });
    expect(s.prompt).toBeNull();
    expect(mainPlan(s).threat).toBe(1);
    expect(s.plans.find((x) => x.uid === side)?.threat).toBe(3);
  });

  it("Núcleo de Fusión needs a ⚡ card; Guantelete deals 2 if you pay ⚡, 1 if not", () => {
    const { s, p } = setup();
    const core = toPlay(s, "nucleo-fusion");
    p.heroExhausted = true;
    expect(act(s, { a: "useCard", player: 0, card: core })).toMatch(/Necesitas descartar una carta con ⚡/);
    const cell = toHand(s, "celula-energia");
    act(s, { a: "useCard", player: 0, card: core });
    expect(s.prompt?.options.map((o) => o.id)).toEqual([cell]); // no "don't pay" option
    answer(s, cell);
    expect(p.heroExhausted).toBe(false);
    expect(p.discard).toContain(cell);

    const g = toPlay(s, "guantelete-plasma");
    act(s, { a: "useCard", player: 0, card: g });
    answer(s, "no");
    expect(s.villain.damage).toBe(1);
    p.play.find((c) => c.uid === g)!.exhausted = false;
    const g2 = toHand(s, "guantelete-plasma", 1);
    act(s, { a: "useCard", player: 0, card: g });
    answer(s, g2);
    expect(s.villain.damage).toBe(3);
  });

  it("Persecución removes 3 after you defeat an enemy this turn, 1 otherwise; Botiquín heals a friend", () => {
    const { s, p } = setup();
    mainPlan(s).threat = 6;
    const card = toHand(s, "persecucion");
    act(s, { a: "play", player: 0, card, pay: [toHand(s, "golpe-certero")] });
    expect(mainPlan(s).threat).toBe(5);
    const m = engage(s, "artificiero");
    s.players[0].engaged[0].damage = 1;
    act(s, { a: "attack", player: 0 });
    answer(s, m);
    const again = toHand(s, "persecucion");
    act(s, { a: "play", player: 0, card: again, pay: [toHand(s, "golpe-certero", 1)] });
    expect(mainPlan(s).threat).toBe(2);

    p.damage = 4;
    const kit = toPlay(s, "botiquin-campo");
    act(s, { a: "useCard", player: 0, card: kit });
    expect(p.damage).toBe(2);
  });
});

describe("Nuevos héroes, escenarios y fase del villano", () => {
  function setup(scenario: string, hero: string, form: "heroe" | "identidad" = "heroe", seed = 31, difficulty: "normal" | "experto" = "normal") {
    const s = newGame(scenario, [hero], seed, difficulty);
    const p = s.players[0];
    p.deck.push(...p.hand); p.hand = [];
    p.form = form;
    return { s, p };
  }
  const copies = (s: GameState, def: string) => Object.keys(s.cards).filter((u) => s.cards[u] === def);
  function take(s: GameState, def: string, nth = 0): string {
    const u = copies(s, def)[nth];
    const p = s.players[0];
    p.deck = p.deck.filter((x) => x !== u); p.hand = p.hand.filter((x) => x !== u); p.discard = p.discard.filter((x) => x !== u); p.play = p.play.filter((c) => c.uid !== u);
    return u;
  }
  const toHand = (s: GameState, def: string, nth = 0) => { const u = take(s, def, nth); s.players[0].hand.push(u); return u; };
  const toPlay = (s: GameState, def: string, nth = 0) => { const u = take(s, def, nth); s.players[0].play.push({ uid: u, def, exhausted: false, damage: 0 }); return u; };
  const villainTurn = (s: GameState) => { act(s, { a: "endTurn", player: 0, discard: [] }); };

  it("Funámbula: Lía generates 🧠 once per round; Sexto sentido draws when the villain attacks", () => {
    const { s, p } = setup("asalto-arsenal", "funambula", "identidad");
    p.damage = 5;
    const card = toHand(s, "vendaje-rapido");
    expect(canPlay(s, 0, card)).toBeUndefined(); // the identity resource pays for it
    act(s, { a: "play", player: 0, card, pay: [], extra: ["identity"] });
    expect(p.damage).toBe(3);
    const again = toHand(s, "vendaje-rapido", 1);
    expect(act(s, { a: "play", player: 0, card: again, pay: [], extra: ["identity"] })).toBeDefined(); // already used this round

    const x = setup("asalto-arsenal", "funambula", "heroe", 32).s;
    const before = x.players[0].hand.length;
    villainTurn(x); // ends with a draw up to hand size, then the villain attacks
    const drew = x.log.some((l) => l.text.includes("Sexto sentido"));
    expect(drew).toBe(true);
    expect(x.players[0].hand.length).toBeGreaterThan(before);
    void p;
  });

  it("Lanzadores de Seda pay 🌟 three times, then are discarded", () => {
    const { s, p } = setup("asalto-arsenal", "funambula");
    const web = take(s, "lanzadores-seda");
    p.play.push({ uid: web, def: "lanzadores-seda", exhausted: false, damage: 0, counters: 3 });
    for (let k = 0; k < 3; k++) {
      p.play.forEach((c) => (c.exhausted = false));
      const card = toHand(s, ["vendaje-rapido", "vendaje-rapido", "abuela-teresa"][k], [0, 1, 0][k]);
      expect(act(s, { a: "play", player: 0, card, pay: [], extra: [web] })).toBeUndefined();
    }
    expect(p.play.some((c) => c.uid === web)).toBe(false);
    expect(p.discard).toContain(web);
  });

  describe("Funámbula: su mazo de 40 cartas", () => {
    /** Moves encounter cards (by definition) to the top of the encounter deck, in order. */
    const stack = (s: GameState, defs: string[]) => {
      const out: string[] = [];
      for (const d of defs) {
        const u = [...s.encounterDeck, ...s.encounterDiscard].find((x) => s.cards[x] === d && !out.includes(x))!;
        s.encounterDeck = s.encounterDeck.filter((x) => x !== u); s.encounterDiscard = s.encounterDiscard.filter((x) => x !== u);
        out.push(u);
      }
      s.encounterDeck.unshift(...out);
    };
    const engage = (s: GameState, def = "maton-sueldo") => {
      const m = s.encounterDeck.find((u) => s.cards[u] === def)!;
      s.encounterDeck = s.encounterDeck.filter((u) => u !== m);
      s.players[0].engaged.push({ uid: m, def, damage: 0 });
      return m;
    };

    it("has 40 cards: 15 hers, 15 Liderazgo, 10 básicas", () => {
      const deck = HEROES.find((h) => h.id === "funambula")!.deck;
      expect(deck).toHaveLength(40);
      expect(deck.filter((d) => PLAYER_CARDS.get(d)!.traits?.includes("liderazgo"))).toHaveLength(15);
    });

    it("Dédalo keeps the 🧠 cards it discards; Patada Pendular deals 8", () => {
      const { s, p } = setup("asalto-arsenal", "funambula");
      const mind = take(s, "chispa-genio"), power = take(s, "celula-energia");
      p.deck.unshift(mind, power);
      act(s, { a: "play", player: 0, card: toHand(s, "dedalo-inventor"), pay: [toHand(s, "pulso-fuerza")] });
      expect(p.hand).toContain(mind);
      expect(p.discard).toContain(power);
      act(s, { a: "play", player: 0, card: toHand(s, "patada-pendular"), pay: [mind, toHand(s, "don-mando")] });
      expect(s.villain.damage).toBe(8);
    });

    it("Hilo Rastreador removes 3 threat when its minion falls; Red Atrapante cancels the next attack and stuns", () => {
      const { s, p } = setup("asalto-arsenal", "funambula");
      mainPlan(s).threat = 5;
      const m = engage(s);
      const hilo = toHand(s, "hilo-rastreador");
      act(s, { a: "play", player: 0, card: hilo, pay: [toHand(s, "vendaje-rapido")] });
      expect(p.engaged[0].attached?.[0].uid).toBe(hilo);
      act(s, { a: "play", player: 0, card: toHand(s, "patada-pendular"), pay: [toHand(s, "pulso-fuerza"), toHand(s, "don-mando")] });
      answer(s, m);
      expect(mainPlan(s).threat).toBe(2);
      expect(p.discard).toContain(hilo);

      const x = setup("asalto-arsenal", "funambula", "heroe", 33);
      const red = toHand(x.s, "red-atrapante");
      act(x.s, { a: "play", player: 0, card: red, pay: [toHand(x.s, "pulso-fuerza"), toHand(x.s, "celula-energia")] });
      expect(x.s.villain.playerAttached?.[0].uid).toBe(red);
      expect(canPlay(x.s, 0, toHand(x.s, "red-atrapante", 1))).toBeDefined(); // one per enemy
      villainTurn(x.s);
      expect(x.s.log.some((l) => l.text.includes("atrapa"))).toBe(true);
      expect(x.s.villain.stunned).toBe(true);
      expect(x.p.discard).toContain(red);
    });

    it("Visión Periférica cancels a treachery; Voltereta prevents a whole attack", () => {
      const { s, p } = setup("asalto-arsenal", "funambula", "heroe", 34);
      toHand(s, "vision-periferica"); toHand(s, "voltereta"); toHand(s, "pulso-fuerza");
      stack(s, ["emboscada", "avance-oscuro"]); // boost, then the dealt card
      const threat = mainPlan(s).threat;
      act(s, { a: "endTurn", player: 0, discard: [] });
      let guard = 0;
      while (s.prompt && guard++ < 20) {
        const pr = s.prompt;
        const pick = pr.kind === "defense" ? "none" : pr.options.find((o) => o.label === "Voltereta" || o.label === "Visión Periférica")?.id ?? "no";
        answer(s, pick);
      }
      expect(p.damage).toBe(0);
      expect(s.log.some((l) => l.text.includes("Avance Oscuro no tiene efecto"))).toBe(true);
      expect(mainPlan(s).threat).toBe(threat + 1); // only the acceleration
    });

    it("Arquero del Campanario shoots each minion that enters play, spending an arrow", () => {
      const { s, p } = setup("asalto-arsenal", "funambula", "identidad", 35);
      act(s, { a: "play", player: 0, card: toHand(s, "arquero-campanario"), pay: [toHand(s, "pulso-fuerza"), toHand(s, "vendaje-rapido")] });
      stack(s, ["emboscada", "maton-sueldo"]);
      villainTurn(s);
      while (s.prompt) answer(s, s.prompt.options[s.prompt.options.length - 1].id);
      const m = p.engaged.find((x) => x.def === "maton-sueldo")!;
      expect(m.damage).toBe(2);
      expect(p.play.find((c) => s.cards[c.uid] === "arquero-campanario")!.counters).toBe(3);
    });

    it("Comisaria Vega, Autómata de Cristal, ¡En Pie!, Al Frente del Grupo and Palabras de Ánimo", () => {
      const { s, p } = setup("asalto-arsenal", "funambula", "heroe", 36);
      const hand = p.hand.length;
      act(s, { a: "play", player: 0, card: toHand(s, "comisaria-vega"), pay: [toHand(s, "pulso-fuerza")] });
      expect(p.hand.length).toBe(hand + 1);
      const golem = toPlay(s, "automata-cristal");
      toHand(s, "celula-energia");
      act(s, { a: "useCard", player: 0, card: golem });
      answer(s, s.prompt!.options.find((o) => o.id !== "no")!.id); // pay with ⚡
      answer(s, "1"); // +2 Fuerza
      const g = p.play.find((c) => c.uid === golem)!;
      expect(allyStats(s, g).fuerza).toBe(4);
      act(s, { a: "allyAttack", player: 0, ally: golem });
      expect(g.exhausted).toBe(true);
      act(s, { a: "play", player: 0, card: toHand(s, "en-pie"), pay: [] });
      expect(g.exhausted).toBe(false);
      act(s, { a: "play", player: 0, card: toHand(s, "al-frente"), pay: [toHand(s, "don-mando")] }); // Don de Mando: 🌟🌟 for Liderazgo
      expect(heroStats(s, 0).fuerza).toBe(2);
      expect(allyStats(s, g).fuerza).toBe(5);
      const words = toHand(s, "palabras-animo");
      act(s, { a: "play", player: 0, card: words, pay: [toHand(s, "vendaje-rapido")] });
      answer(s, golem);
      expect(allyStats(s, g).ingenio).toBe(1 + 1 + 1); // base, Al Frente and Palabras de Ánimo
      villainTurn(s);
      while (s.prompt) answer(s, s.prompt.options[s.prompt.options.length - 1].id);
      const g2 = p.play.find((c) => c.uid === golem);
      if (g2) expect(allyStats(s, g2).fuerza).toBe(3); // temporary bonuses gone, Palabras stays
      expect(heroStats(s, 0).fuerza).toBe(1);
    });

    it("Don de Mando doubles only for Liderazgo; Aeronave de Mando lowers the next card by 1", () => {
      const { s, p } = setup("asalto-arsenal", "funambula", "heroe", 37);
      const punch = toHand(s, "directo-demoledor");
      const don = toHand(s, "don-mando");
      expect(act(s, { a: "play", player: 0, card: punch, pay: [don] })).toBeDefined();
      const ship = toPlay(s, "aeronave-mando");
      act(s, { a: "useCard", player: 0, card: ship });
      expect(p.discount).toBe(1);
      expect(act(s, { a: "play", player: 0, card: punch, pay: [don] })).toBeUndefined();
      expect(s.villain.damage).toBe(3);
      expect(p.discount).toBe(0);
    });

    it("Llamada de Refuerzos pays for an ally in a discard and brings it into play; El Director Umbral leaves at the end of the round", () => {
      const { s, p } = setup("asalto-arsenal", "funambula", "identidad", 38);
      const vega = take(s, "comisaria-vega"); p.discard.push(vega);
      const fuel = toHand(s, "pulso-fuerza");
      act(s, { a: "play", player: 0, card: toHand(s, "llamada-refuerzos"), pay: [] });
      answer(s, vega);
      expect(p.play.some((c) => c.uid === vega)).toBe(true);
      expect(p.discard).toContain(fuel);

      const boss = toHand(s, "director-umbral");
      act(s, { a: "play", player: 0, card: boss, pay: [toHand(s, "celula-energia"), toHand(s, "chispa-genio")] });
      const before = p.hand.length;
      answer(s, "1"); // draw 3
      expect(p.hand.length).toBe(before + 3);
      villainTurn(s);
      while (s.prompt) answer(s, s.prompt.options[s.prompt.options.length - 1].id);
      expect(p.play.some((c) => c.uid === boss)).toBe(false);
      expect(p.discard).toContain(boss);
    });

    it("Lanzadores de Seda only pay in hero form; Abuela Teresa heals 4 in identity", () => {
      const { s, p } = setup("asalto-arsenal", "funambula", "identidad", 39);
      toPlay(s, "lanzadores-seda");
      expect(resourceSources(s, 0).some((r) => s.cards[r.id] === "lanzadores-seda")).toBe(false);
      p.form = "heroe";
      expect(resourceSources(s, 0).some((r) => s.cards[r.id] === "lanzadores-seda")).toBe(true);
      p.form = "identidad"; p.damage = 6;
      act(s, { a: "useCard", player: 0, card: toPlay(s, "abuela-teresa") });
      expect(p.damage).toBe(2);
    });
  });

  it("Mole Tronante: hand discarded at the end of a hero turn; ✊ scaling cards", () => {
    const { s, p } = setup("asalto-arsenal", "mole");
    expect([heroOf(p).hero.fuerza, heroOf(p).vida, handSize(s, 0)]).toEqual([3, 18, 4]);
    const card = toHand(s, "golpe-demoledor");
    act(s, { a: "play", player: 0, card, pay: [toHand(s, "furia-sin-limites")] });
    expect(s.villain.damage).toBe(2 + 2);
    const m = s.encounterDeck.find((u) => s.cards[u] === "maton-sueldo")!;
    s.encounterDeck = s.encounterDeck.filter((u) => u !== m);
    p.engaged.push({ uid: m, def: "maton-sueldo", damage: 0 });
    const clap = toHand(s, "palmada-sismica");
    act(s, { a: "play", player: 0, card: clap, pay: [toHand(s, "pulso-fuerza"), toHand(s, "golpe-certero")] });
    expect(s.villain.damage).toBe(6);
    expect(p.engaged[0].damage).toBe(2);
    const rip = toHand(s, "arrancar-suelo");
    toHand(s, "furia-sin-limites", 1); toHand(s, "golpe-demoledor", 1);
    act(s, { a: "play", player: 0, card: rip, pay: [toHand(s, "vigilancia")] });
    answer(s, "villain");
    expect(s.villain.damage).toBe(6 + 1 + 3); // ✊✊ + ✊ left in hand
    const handBefore = p.hand.slice();
    act(s, { a: "endTurn", player: 0, discard: [] });
    expect(p.discard).toEqual(expect.arrayContaining(handBefore));
  });

  it("Centella: Canal de Energía stores ⚡ and releases 2 damage per charge; Recanalizar needs ⚡", () => {
    const { s, p } = setup("asalto-arsenal", "centella");
    expect(act(s, { a: "heroAbility", player: 0 })).toMatch(/Necesitas descartar una carta con ⚡/);
    const canal = toPlay(s, "canal-energia");
    const cell = toHand(s, "pulso-cosmico");
    act(s, { a: "useCard", player: 0, card: canal, index: 0 });
    answer(s, cell);
    expect(p.play.find((c) => c.uid === canal)?.counters).toBe(2);
    act(s, { a: "useCard", player: 0, card: canal, index: 1 });
    expect(s.villain.damage).toBe(4);
    expect(p.discard).toContain(canal);

    p.damage = 3;
    const bolt = toHand(s, "rafaga-fotonica");
    act(s, { a: "heroAbility", player: 0 });
    answer(s, bolt);
    expect(p.damage).toBe(2);
  });

  it("Vuelo Cósmico can be used from play while defending", () => {
    const { s, p } = setup("asalto-arsenal", "centella", "heroe", 33);
    toPlay(s, "vuelo-cosmico");
    villainTurn(s);
    answer(s, "hero");
    expect(s.prompt?.options.some((o) => o.id.startsWith("play:"))).toBe(true);
    answer(s, s.prompt!.options.find((o) => o.id.startsWith("play:"))!.id);
    expect(p.play.find((c) => s.cards[c.uid] === "vuelo-cosmico")?.exhausted).toBe(true);
  });

  it("Soberano starts with Garras; ¡Por Oricalcia! fires every Oricalco upgrade, the primary one +1", () => {
    const s0 = newGame("asalto-arsenal", ["soberano"], 34);
    expect(s0.players[0].hand.map((u) => s0.cards[u])).toContain("garras-oricalco");
    expect(s0.players[0].hand).toHaveLength(6);
    const { s, p } = setup("asalto-arsenal", "soberano");
    const claws = toPlay(s, "garras-oricalco");
    toPlay(s, "ordenador-tactico");
    mainPlan(s).threat = 5;
    const ev = toHand(s, "por-oricalcia-f");
    act(s, { a: "play", player: 0, card: ev, pay: [toHand(s, "pulso-fuerza")] });
    answer(s, claws); // primary: Garras (+1)
    while (s.prompt) answer(s, s.prompt.options[0].id);
    expect(s.villain.damage).toBe(3);
    expect(mainPlan(s).threat).toBe(4);
    expect(p.play.every((c) => !c.exhausted)).toBe(true);
  });

  it("Liderazgo: Arenga buffs an ally for good, Toque de Reunión readies allies, Hacer la Llamada recalls one", () => {
    const { s, p } = setup("asalto-arsenal", "centella", "identidad");
    const cap = toPlay(s, "capitana-fernandez");
    act(s, { a: "play", player: 0, card: toHand(s, "arenga"), pay: [toHand(s, "golpe-certero")] });
    act(s, { a: "allyAttack", player: 0, ally: cap });
    expect(s.villain.damage).toBe(3);
    act(s, { a: "play", player: 0, card: toHand(s, "toque-reunion"), pay: [toHand(s, "vigilancia", 1)] });
    expect(p.play.find((c) => c.uid === cap)?.exhausted).toBe(false);
    const mage = take(s, "mago-errante"); p.discard.push(mage);
    act(s, { a: "play", player: 0, card: toHand(s, "hacer-llamada"), pay: [] });
    answer(s, mage);
    expect(p.hand).toContain(mage);
  });

  it("Sinfonía: starts with its defence network, deals 2 boost cards, and the main plan has a second stage", () => {
    const { s } = setup("sinfonia", "vanguardia");
    expect(s.plans.map((x) => x.def)).toContain("red-defensa-sonica");
    villainTurn(s);
    const attack = s.phaseReport!.find((e) => e.step === 2)!;
    expect(attack.cards).toHaveLength(2);
    expect(attack.lines.some((l) => l.includes("Carta de refuerzo 2 de 2"))).toBe(true);
    while (s.prompt) answer(s, s.prompt.options[s.prompt.options.length - 1].id);

    const x = setup("sinfonia", "vanguardia", "identidad", 35).s;
    mainPlan(x).threat = 8;
    villainTurn(x);
    while (x.prompt) answer(x, x.prompt.options[0].id);
    expect(x.result).toBeUndefined();
    expect(x.mainStage).toBe(1);
    expect(planLimit(x)).toBe(12);

    const y = setup("sinfonia", "vanguardia", "heroe", 36).s;
    const imm = y.encounterDeck.find((u) => y.cards[u] === "inmortalidad-sonica")!;
    y.encounterDeck = y.encounterDeck.filter((u) => u !== imm);
    y.plans.push({ uid: imm, def: "inmortalidad-sonica", threat: 4 });
    expect(villainStats(y).vidaMax).toBe(12 + 10);
  });

  it("Enjambre: attacks bring Drones from your deck; defeated Drones go back to your discard", () => {
    const { s, p } = setup("enjambre", "vanguardia");
    villainTurn(s);
    const d = p.engaged.find((m) => m.drone);
    expect(d && PLAYER_CARDS.has(s.cards[d.uid])).toBe(true); // a face-down card of her own deck
    while (s.prompt) answer(s, s.prompt.options[s.prompt.options.length - 1].id);
    if (s.result) return;
    const drone = p.engaged.find((m) => m.drone)!;
    const imp = toHand(s, "impacto-supersonico");
    act(s, { a: "play", player: 0, card: imp, pay: [toHand(s, "pulso-fuerza"), toHand(s, "golpe-certero")] });
    if (s.prompt) answer(s, drone.uid);
    expect(p.engaged.some((m) => m.uid === drone.uid)).toBe(false);
    expect(p.discard).toContain(drone.uid);
  });

  it("Enjambre: Drones Mejorados buffs Drones and stage II hits harder per Drone", () => {
    const { s, p } = setup("enjambre", "vanguardia", "heroe", 37);
    const d1 = p.deck.shift()!;
    p.engaged.push({ uid: d1, def: "dron", damage: 0, drone: true });
    const up = s.encounterDeck.find((u) => s.cards[u] === "drones-mejorados")!;
    s.encounterDeck = s.encounterDeck.filter((u) => u !== up);
    s.villain.attachments.push(up);
    expect(minionStats(s, p.engaged[0])).toMatchObject({ vida: 2, fuerza: 2, plan: 2 });
    s.villain.stage = 1; // Nexo II: +1 Fuerza per Drone
    villainTurn(s);
    const step = s.phaseReport!.find((e) => e.title.includes("Nexo II ataca"))!;
    expect(step.lines.some((l) => /por drones/.test(l))).toBe(true);
  });

  it("Enjambre has a three-stage countdown", () => {
    const { s } = setup("enjambre", "vanguardia", "identidad", 38);
    expect(mainPlanStages(s)).toBe(3);
    for (const [stage, limit] of [[0, 6], [1, 7], [2, 8]]) {
      expect(s.mainStage ?? 0).toBe(stage);
      expect(planLimit(s)).toBe(limit);
      mainPlan(s).threat = limit - 1;
      villainTurn(s);
      while (s.prompt) answer(s, s.prompt.options[0].id);
      if (stage < 2) expect(s.result, `stage ${stage}`).toBeUndefined();
    }
    expect(s.result).toBe("derrota");
  });

  it("the villain phase is reported step by step: threat, activation with boost card, encounter card", () => {
    const { s } = setup("asalto-arsenal", "vanguardia", "identidad", 39);
    villainTurn(s);
    while (s.prompt) answer(s, s.prompt.options[0].id);
    const steps = s.phaseReport!.map((e) => e.step);
    expect(steps[0]).toBe(1);
    expect(steps).toContain(2);
    expect(steps).toContain(3);
    const act2 = s.phaseReport!.find((e) => e.step === 2)!;
    expect(act2.cards.length).toBe(1);
    expect(act2.lines.some((l) => /Plan \d+ \+ \d+ ⭐ = \+\d+ amenaza/.test(l))).toBe(true);
    const enc = s.phaseReport!.find((e) => e.step === 3)!;
    expect(enc.cards).toHaveLength(1);
  });

  it("drawing or revealing cards marks the state so undo is dropped", () => {
    const { s } = setup("asalto-arsenal", "vanguardia");
    s.revealed = false;
    act(s, { a: "attack", player: 0 });
    expect(s.revealed).toBe(false);
    const forge = toPlay(s, "forja-tecnologica");
    act(s, { a: "useCard", player: 0, card: forge });
    expect(s.revealed).toBe(true);
  });
});

describe("Aliados con habilidad", () => {
  function setup(hero = "soberano", seed = 41) {
    const s = newGame("asalto-arsenal", [hero], seed);
    const p = s.players[0];
    p.deck.push(...p.hand); p.hand = [];
    p.form = "heroe";
    return { s, p };
  }
  const toPlay = (s: GameState, def: string) => {
    const p = s.players[0];
    const u = Object.keys(s.cards).find((x) => s.cards[x] === def) ?? (() => { const id = `x${s.nextUid++}`; s.cards[id] = def; return id; })();
    p.deck = p.deck.filter((x) => x !== u); p.hand = p.hand.filter((x) => x !== u);
    p.play.push({ uid: u, def, exhausted: false, damage: 0 });
    return u;
  };

  it("every ally in every hero deck has an ability beyond its stats", () => {
    for (const h of HEROES) for (const id of new Set(h.deck)) {
      const c = PLAYER_CARDS.get(id)!;
      if (!c.ally) continue;
      const has = !!(c.onPlay || c.ability || c.abilities || c.ally.onAttack || c.ally.onKill || c.ally.onThwart || c.ally.onBlock || c.ally.onMinionEnters);
      expect(has, `${h.id}: ${c.name}`).toBe(true);
    }
  });

  it("after-thwart abilities: Lumen draws, the Mago confuses the villain", () => {
    const { s, p } = setup("vanguardia");
    mainPlan(s).threat = 5;
    const lumen = toPlay(s, "lumen-ia");
    const hand = p.hand.length;
    act(s, { a: "allyThwart", player: 0, ally: lumen });
    expect(p.hand.length).toBe(hand + 1);
    const mago = toPlay(s, "mago-errante");
    act(s, { a: "allyThwart", player: 0, ally: mago });
    expect(s.villain.confused).toBe(true);
  });

  it("block abilities: Escudero prevents 1, Centinela hits the attacker", () => {
    for (const [ally, check] of [
      ["escudero-fiel", (s: GameState, u: string) => expect(s.players[0].play.find((c) => c.uid === u)?.damage ?? 99).toBeLessThan(3)],
      ["centinela-real", (s: GameState) => expect(s.villain.damage).toBe(1)],
    ] as const) {
      const { s } = setup("soberano", 42);
      const u = toPlay(s, ally);
      act(s, { a: "endTurn", player: 0, discard: [] });
      expect(s.prompt?.kind).toBe("defense");
      const before = s.prompt!.text;
      answer(s, u);
      while (s.prompt?.kind === "optional") answer(s, "no");
      expect(s.log.some((l) => l.text.includes("bloquea el golpe")), before).toBe(true);
      check(s, u);
    }
  });

  it("enter-play and action abilities: Capitana readies allies, Coronel gives Duro, Zola heals without exhausting", () => {
    const { s, p } = setup("centella");
    const mage = toPlay(s, "mago-errante");
    p.play.find((c) => c.uid === mage)!.exhausted = true;
    const cap = Object.keys(s.cards).find((x) => s.cards[x] === "capitana-fernandez")!;
    p.deck = p.deck.filter((x) => x !== cap); p.hand.push(cap);
    const pay = p.deck.splice(0, 4); p.hand.push(...pay);
    act(s, { a: "play", player: 0, card: cap, pay });
    expect(p.play.find((c) => c.uid === mage)?.exhausted).toBe(false);

    const x = setup("mole").s;
    const ruiz = Object.keys(x.cards).find((u) => x.cards[u] === "coronel-ruiz")!;
    const q = x.players[0];
    q.deck = q.deck.filter((u) => u !== ruiz); q.hand.push(ruiz);
    const pay2 = q.deck.splice(0, 3); q.hand.push(...pay2);
    act(x, { a: "play", player: 0, card: ruiz, pay: pay2 });
    expect(q.tough).toBe(true);

    const y = setup("soberano", 43);
    y.p.damage = 4;
    const zola = toPlay(y.s, "zola-ingeniera");
    act(y.s, { a: "useCard", player: 0, card: zola });
    if (y.s.prompt) answer(y.s, `hero:0`);
    expect(y.p.damage).toBe(2);
    expect(y.p.play.find((c) => c.uid === zola)?.exhausted).toBe(false);
    expect(act(y.s, { a: "useCard", player: 0, card: zola })).toBe("Ya la usaste esta ronda.");
  });
});

describe("Progreso por héroe", () => {
  it("cuenta victorias y derrotas por héroe, escenario y dificultad", async () => {
    const { recordResult, beaten, tried } = await import("../ui/progress");
    const s = newGame(SCENARIOS[0].id, [HEROES[0].id, HEROES[1].id], 1, "normal");
    let p = {};
    s.result = "derrota"; s.round = 5;
    p = recordResult(s, p);
    expect(tried(p, HEROES[0].id, SCENARIOS[0].id)).toBe(true);
    expect(beaten(p, HEROES[0].id, SCENARIOS[0].id)).toBeUndefined();
    s.result = "victoria"; s.round = 7;
    p = recordResult(s, p);
    s.round = 4;
    p = recordResult(s, p);
    expect(beaten(p, HEROES[1].id, SCENARIOS[0].id)).toBe("normal");
    s.difficulty = "experto";
    p = recordResult(s, p);
    expect(beaten(p, HEROES[0].id, SCENARIOS[0].id)).toBe("experto");
    expect(beaten(p, HEROES[0].id, SCENARIOS[1].id)).toBeUndefined();
    const r = (p as never as Record<string, Record<string, Record<string, { wins: number; losses: number; bestRound: number }>>>)[HEROES[0].id][SCENARIOS[0].id].normal;
    expect(r).toMatchObject({ wins: 2, losses: 1, bestRound: 4 });
  });

  it("la copia guarda héroes, campañas y la partida en curso, y se recupera entera", async () => {
    const mem = new Map<string, string>();
    const ls = { get length() { return mem.size; }, key: (i: number) => [...mem.keys()][i] ?? null, getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k), clear: () => mem.clear() };
    const prev = (globalThis as { localStorage?: unknown }).localStorage;
    (globalThis as { localStorage?: unknown }).localStorage = ls;
    try {
      const { exportProgress, importProgress, loadProgress } = await import("../ui/progress");
      mem.set("heroica.progreso", JSON.stringify({ vanguardia: { x: { normal: { wins: 1, losses: 0 } } } }));
      mem.set("heroica.campana.ceniza", JSON.stringify({ unlocked: 2, completed: 0 }));
      mem.set("heroica.partida", JSON.stringify({ round: 3 }));
      mem.set("otra.app", "no");
      const file = exportProgress();
      mem.clear();
      mem.set("heroica.campana.vieja", "{}");
      expect(importProgress(file)).toBeUndefined();
      expect(loadProgress()).toMatchObject({ vanguardia: { x: { normal: { wins: 1 } } } });
      expect(JSON.parse(mem.get("heroica.campana.ceniza")!)).toMatchObject({ unlocked: 2 });
      expect(JSON.parse(mem.get("heroica.partida")!)).toMatchObject({ round: 3 });
      expect(mem.has("heroica.campana.vieja")).toBe(false);
      expect(mem.has("otra.app")).toBe(false);
      // Old progress-only files still load.
      expect(importProgress(JSON.stringify({ heroica: 1, progreso: { a: {} } }))).toBeUndefined();
      expect(importProgress("{}")).toBeTruthy();
    } finally { (globalThis as { localStorage?: unknown }).localStorage = prev; }
  });
});

describe("Campaña: El Ascenso del Mariscal de Ceniza", () => {
  function setup(scenario: string, hero = "vanguardia", form: "heroe" | "identidad" = "heroe", seed = 41) {
    const s = newGame(scenario, [hero], seed);
    const p = s.players[0];
    p.deck.push(...p.hand); p.hand = [];
    p.form = form;
    return { s, p };
  }
  /** Ends the turn and answers every prompt with its last option ("No" / "No defender"). */
  const villainPhase = (s: GameState) => {
    act(s, { a: "endTurn", player: 0, discard: [] });
    let g = 0;
    while (s.prompt && g++ < 50) answer(s, s.prompt.options[s.prompt.options.length - 1].id);
  };
  const handOf = (s: GameState, pred: (d: ReturnType<typeof pcard>) => boolean, n: number) => {
    const p = s.players[0];
    const picks = p.deck.filter((u) => pred(pcard(s, u))).slice(0, n);
    p.deck = p.deck.filter((u) => !picks.includes(u));
    p.hand.push(...picks);
    return picks;
  };

  it("Saeta Negra: starts with an experimental weapon that you remove by spending its resource type", () => {
    const { s, p } = setup("saeta-negra");
    expect(s.villain.attachments).toHaveLength(1);
    expect(s.sideDecks!.armas).toHaveLength(4);
    const w = s.villain.attachments[0];
    const rm = ENCOUNTER_CARDS.get(s.cards[w])!.removal!;
    const wrong = handOf(s, (d) => d.resType !== rm.res && d.resType !== "comodin", 3);
    expect(act(s, { a: "removeAttachment", player: 0, attachment: w, pay: wrong })).toMatch(/Necesitas/);
    const right = handOf(s, (d) => d.resType === rm.res, rm.cost);
    expect(act(s, { a: "removeAttachment", player: 0, attachment: w, pay: right })).toBeUndefined();
    expect(s.villain.attachments).toHaveLength(0);
    expect(p.heroExhausted).toBe(false);
    expect(s.sideDecks!.armas).toHaveLength(5); // back under the weapons deck
  });

  it("Keywords: Perforante removes Duro, A distancia ignores Represalia", () => {
    const { s, p } = setup("saeta-negra", "soberano");
    const cannon = Object.keys(s.cards).find((u) => s.cards[u] === "canon-laser")!;
    s.sideDecks!.armas.push(...s.villain.attachments);
    s.sideDecks!.armas = s.sideDecks!.armas.filter((u) => u !== cannon);
    s.villain.attachments = [cannon];
    p.tough = true;
    // Coraza de Púas in play: Represalia that a ranged attacker ignores.
    const spikes = Object.keys(s.cards).find((u) => s.cards[u] === "coraza-puas");
    p.deck = p.deck.filter((u) => u !== spikes);
    p.play.push({ uid: spikes!, def: "coraza-puas", exhausted: false, damage: 0 });
    villainPhase(s);
    expect(p.tough).toBe(false);
    expect(p.damage).toBeGreaterThan(0);
    expect(s.log.some((l) => l.text.includes("Perforante"))).toBe(true);
    // A distancia (Saeta I): Coraza-like retaliation doesn't hit.
    expect(s.log.some((l) => l.text.includes("Represalia:"))).toBe(false);
    expect(s.log.some((l) => l.text.includes("a distancia"))).toBe(true);
  });

  it("Arrollador: damage beyond a blocking ally's life reaches the hero", () => {
    const { s, p } = setup("saeta-negra", "soberano");
    const gloves = Object.keys(s.cards).find((u) => s.cards[u] === "guanteletes-sismicos")!;
    s.sideDecks!.armas.push(...s.villain.attachments);
    s.sideDecks!.armas = s.sideDecks!.armas.filter((u) => u !== gloves);
    s.villain.attachments = [gloves];
    const squire = p.deck.find((u) => s.cards[u] === "escudero-fiel")!;
    p.deck = p.deck.filter((u) => u !== squire);
    p.play.push({ uid: squire, def: "escudero-fiel", exhausted: false, damage: 2 }); // 1 life left
    act(s, { a: "endTurn", player: 0, discard: [] });
    expect(s.prompt?.kind).toBe("defense");
    answer(s, squire);
    while (s.prompt) answer(s, s.prompt.options[s.prompt.options.length - 1].id);
    expect(s.log.some((l) => l.text.startsWith("Arrollador"))).toBe(true);
    expect(p.damage).toBeGreaterThan(0);
  });

  it("Amalgama: absorbs an environment, its cards check the trait, and Retraso counters change it", () => {
    const { s } = setup("amalgama", "vanguardia", "identidad");
    expect(s.environment).toBeDefined();
    const first = s.cards[s.environment!];
    expect(villainTraits(s)).toHaveLength(1);
    // Force Acero and check the bonus.
    const steel = Object.keys(s.cards).find((u) => s.cards[u] === "fabrica-abandonada")!;
    const base = villainStats(s).fuerza - (ENCOUNTER_CARDS.get(first)!.environment!.fuerza ?? 0);
    s.encounterDeck = s.encounterDeck.filter((u) => u !== steel); s.encounterDiscard = s.encounterDiscard.filter((u) => u !== steel);
    if (s.environment !== steel) { s.encounterDiscard.push(s.environment!); s.environment = steel; }
    expect(villainTraits(s)).toEqual(["Acero"]);
    expect(villainStats(s).fuerza).toBe(base + 1);
    for (let k = 0; k < 3 && !s.result; k++) villainPhase(s);
    expect(s.cards[s.environment!]).not.toBe("fabrica-abandonada");
    expect(s.log.some((l) => l.text.includes("contadores de Retraso"))).toBe(true);
  });

  it("Réplica: transforming into a hero hurts, and clearing the cell rescues the captured allies", () => {
    const { s, p } = setup("replica", "vanguardia", "identidad");
    expect(s.captives!.cards).toHaveLength(2);
    act(s, { a: "flip", player: 0 });
    expect(p.damage).toBe(1);
    const cell = s.plans.find((x) => s.cards[x.uid] === "celda-contencion")!;
    cell.threat = 1;
    act(s, { a: "thwart", player: 0 });
    if (s.prompt) answer(s, cell.uid);
    expect(s.plans.some((x) => x.uid === cell.uid)).toBe(false);
    expect(p.play.map((c) => c.def)).toEqual(expect.arrayContaining(["sargento-brisa", "hermano-cobalto"]));
    expect(s.rescued).toHaveLength(2);
  });

  it("Doctor Quimera: Pruebas counters release a Mutant, and Represalia hurts whoever attacks it", () => {
    const { s, p } = setup("quimera", "vanguardia", "identidad");
    s.planCounters = 3;
    s.encounterDeck = s.encounterDeck.filter((u) => ENCOUNTER_CARDS.get(s.cards[u])!.type !== "esbirro" || ENCOUNTER_CARDS.get(s.cards[u])!.traits?.includes("mutante"));
    villainPhase(s);
    const mutants = p.engaged.filter((m) => ENCOUNTER_CARDS.get(m.def)!.traits?.includes("mutante"));
    expect(mutants.length).toBeGreaterThan(0);
    // A Mutante de Laboratorio hits back when the hero attacks it.
    const lab = Object.keys(s.cards).find((u) => s.cards[u] === "mutante-laboratorio" && !p.engaged.some((m) => m.uid === u))!;
    s.encounterDeck = s.encounterDeck.filter((u) => u !== lab); s.encounterDiscard = s.encounterDiscard.filter((u) => u !== lab);
    p.engaged.push({ uid: lab, def: "mutante-laboratorio", damage: 0 });
    p.form = "heroe"; p.heroExhausted = false; p.damage = 0; p.stunned = false;
    act(s, { a: "attack", player: 0 });
    if (s.prompt) answer(s, lab);
    expect(p.damage).toBe(1);
  });

  it("Mariscal: side-plan deck, Crisis blocks the main plan, Peligro deals more, the colossus wakes up", () => {
    const { s, p } = setup("mariscal", "vanguardia", "identidad");
    expect(s.plans.some((x) => s.cards[x.uid] === "coloso-dormido")).toBe(true);
    expect(s.plans.filter((x) => x.def !== "main")).toHaveLength(2);
    // Crisis.
    const camps = s.sideDecks!.planes.find((u) => s.cards[u] === "campos-internamiento");
    if (camps) { s.sideDecks!.planes = s.sideDecks!.planes.filter((u) => u !== camps); s.plans.push({ uid: camps, def: "campos-internamiento", threat: 3 }); }
    mainPlan(s).threat = 3;
    p.form = "heroe";
    act(s, { a: "thwart", player: 0 });
    if (s.prompt) expect(s.prompt.options.some((o) => o.id === "main")).toBe(false);
    while (s.prompt) answer(s, s.prompt.options[0].id);
    expect(mainPlan(s).threat).toBe(3);
    // The colossus wakes up when its plan completes.
    const col = s.plans.find((x) => s.cards[x.uid] === "coloso-dormido")!;
    col.threat = 6;
    p.form = "identidad";
    villainPhase(s);
    expect(s.players[0].engaged.some((m) => m.def === "coloso-despierto")).toBe(true);
  });

  it("Campaign: wounds, rewards, rescued allies and conditions carry into the next mission", async () => {
    const { newCampaign, applyResult, chooseReward, setupFor, missionScenario } = await import("../ui/campaign");
    const c = newCampaign("ceniza", ["vanguardia"], "normal");
    expect(missionScenario(c)).toBe("saeta-negra");
    const s = newGame("saeta-negra", ["vanguardia"], 5, "normal", setupFor(c));
    s.players[0].damage = 5;
    s.result = "victoria";
    const lines = applyResult(c, s);
    expect(c.step).toBe(1);
    expect(c.wounds.vanguardia).toBe(2);
    expect(c.conditions).toContain("arsenal-legion"); // the starting weapon was still on
    expect(c.pendingReward?.options).toEqual(["arma-confiscada", "blindaje-recuperado"]);
    expect(lines.length).toBeGreaterThan(1);
    chooseReward(c, "vanguardia", "blindaje-recuperado");
    expect(c.pendingReward).toBeUndefined();
    const next = newGame(missionScenario(c), ["vanguardia"], 6, "normal", setupFor(c));
    expect(next.scenario).toBe("amalgama");
    expect(next.players[0].damage).toBe(2);
    expect(Object.values(next.cards)).toContain("blindaje-recuperado");
    expect(Object.values(next.cards)).toContain("prototipo-robado");
    expect(next.campaign).toEqual({ id: "ceniza", step: 1 });
    // A defeat doesn't advance.
    next.result = "derrota";
    applyResult(c, next);
    expect(c.step).toBe(1);
    // Rescued allies join the rescuer's deck.
    const r = newGame("replica", ["vanguardia"], 7, "normal", setupFor({ ...c, step: 2 }));
    r.rescued = [{ uid: r.captives!.cards[0], player: 0 }];
    r.result = "victoria";
    const c2 = { ...c, step: 2, boons: { vanguardia: [...c.boons.vanguardia] } };
    applyResult(c2, r);
    expect(c2.boons.vanguardia).toContain("sargento-brisa");
  });
});
