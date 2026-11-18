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
    expect(x.log.filter((l) => l.text.includes("no trama")).length).toBe(2);
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
