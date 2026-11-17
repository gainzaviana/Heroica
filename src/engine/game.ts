import { ENCOUNTER_CARDS, ENCOUNTER_SETS, HERO_BY_ID, PLAYER_CARDS, SCENARIO_BY_ID } from "../data/content";
import type { CardInPlay, Effect, EffectCtx, GameState, PlanState, PlayerState, Prompt, Resume, Target, VillainStep } from "./types";

/**
 * The rules engine. Every function takes the state and changes it in place; the interface keeps
 * copies for undo. Player decisions the engine needs (targets, defences, optional responses)
 * become a `prompt`; the game waits until `answer` is called.
 *
 * Round: each player takes a turn (first player first), then the villain phase: the main plan
 * advances, the villain and each player's minions activate (attack heroes, scheme against
 * identities), each player is dealt an encounter card, and the first player passes on.
 */

// MARK: Random (deterministic, so any game can be replayed)

function rand(s: GameState): number {
  let t = (s.rngState = (s.rngState + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function shuffle<T>(s: GameState, a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand(s) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// MARK: Lookups

export const scenarioOf = (s: GameState) => SCENARIO_BY_ID.get(s.scenario)!;
export const heroOf = (p: PlayerState) => HERO_BY_ID.get(p.hero)!;
export const pcard = (s: GameState, uid: string) => PLAYER_CARDS.get(s.cards[uid])!;
export const ecard = (s: GameState, uid: string) => ENCOUNTER_CARDS.get(s.cards[uid])!;
export const isPlayerCard = (s: GameState, uid: string) => PLAYER_CARDS.has(s.cards[uid]);

const log = (s: GameState, text: string) => { s.log.push({ round: s.round, text }); if (s.log.length > 200) s.log.shift(); };
const playersAlive = (s: GameState) => s.players.filter((p) => !p.eliminated).length;
const playerCount = (s: GameState) => s.players.length;

export function heroName(s: GameState, i: number): string {
  const p = s.players[i];
  const h = heroOf(p);
  return p.form === "heroe" ? h.hero.name : h.identity.name;
}

/** The hero's current stats with upgrades. */
export function heroStats(s: GameState, i: number) {
  const p = s.players[i];
  const h = heroOf(p);
  const st = { fuerza: h.hero.fuerza, ingenio: h.hero.ingenio, aguante: h.hero.aguante, vidaMax: h.vida };
  for (const c of p.play) {
    const b = pcard(s, c.uid).bonus;
    if (!b) continue;
    st.fuerza += b.fuerza ?? 0; st.ingenio += b.ingenio ?? 0; st.aguante += b.aguante ?? 0; st.vidaMax += b.vidaMax ?? 0;
  }
  return st;
}

export const handSize = (s: GameState, i: number) => { const p = s.players[i], h = heroOf(p); return p.form === "heroe" ? h.hero.mano : h.identity.mano; };

export function villainStats(s: GameState) {
  const sc = scenarioOf(s);
  const st = sc.villain.stages[s.villain.stage];
  let fuerza = st.fuerza, plan = st.plan;
  for (const a of s.villain.attachments) { const b = ecard(s, a).villainBonus; fuerza += b?.fuerza ?? 0; plan += b?.plan ?? 0; }
  return { name: st.name, fuerza, plan, vidaMax: st.vidaPorJugador * playerCount(s), text: st.text };
}

export const mainPlan = (s: GameState) => s.plans.find((p) => p.def === "main")!;
export const planLimit = (s: GameState) => scenarioOf(s).mainPlan.limitePorJugador * playerCount(s);

// MARK: Setup

export function newGame(scenarioID: string, heroIDs: string[], seed = Date.now() >>> 0): GameState {
  const sc = SCENARIO_BY_ID.get(scenarioID);
  if (!sc) throw new Error(`Escenario desconocido: ${scenarioID}`);
  const s: GameState = {
    version: 1, seed, rngState: seed, scenario: sc.id, cards: {}, players: [], active: 0, first: 0, round: 1, phase: "jugadores",
    villain: { stage: 0, damage: 0, stunned: false, attachments: [] }, plans: [], encounterDeck: [], encounterDiscard: [],
    villainQueue: [], prompt: null, log: [], nextUid: 1,
  };
  const mk = (def: string) => { const uid = `c${s.nextUid++}`; s.cards[uid] = def; return uid; };
  for (const id of heroIDs) {
    const h = HERO_BY_ID.get(id);
    if (!h) throw new Error(`Héroe desconocido: ${id}`);
    const deck = shuffle(s, h.deck.map(mk));
    const p: PlayerState = { hero: h.id, form: "identidad", heroExhausted: false, flippedThisTurn: false, heroAbilityUsed: false, damage: 0, stunned: false, deck, hand: [], discard: [], play: [], engaged: [], eliminated: false };
    s.players.push(p);
  }
  s.players.forEach((_, i) => drawCards(s, i, handSize(s, i)));
  s.plans.push({ uid: "main", def: "main", threat: sc.mainPlan.inicioPorJugador * s.players.length });
  s.encounterDeck = shuffle(s, sc.encounterSets.flatMap((set) => ENCOUNTER_SETS[set]).map(mk));
  log(s, `${sc.villain.name} amenaza Aurelia. ${s.players.map((_, i) => heroOf(s.players[i]).hero.name).join(" y ")} acuden a la llamada.`);
  return s;
}

function drawCards(s: GameState, i: number, n: number) {
  const p = s.players[i];
  for (let k = 0; k < n; k++) {
    if (!p.deck.length) {
      if (!p.discard.length) return;
      p.deck = shuffle(s, p.discard.splice(0));
      log(s, `${heroOf(p).hero.name} baraja su descarte: el villano aprovecha el respiro (+1 amenaza).`);
      mainPlan(s).threat += 1;
    }
    p.hand.push(p.deck.shift()!);
  }
}

// MARK: Results

function checkEnd(s: GameState): boolean {
  if (s.result) return true;
  if (mainPlan(s).threat >= planLimit(s)) { finish(s, "derrota", `${scenarioOf(s).mainPlan.name} se ha completado. El sol se apaga sobre Aurelia.`); return true; }
  if (playersAlive(s) === 0) { finish(s, "derrota", "Todos los héroes han caído."); return true; }
  return false;
}
function finish(s: GameState, r: "victoria" | "derrota", text: string) {
  // Cards still on their way (dealt but unrevealed, or an event waiting for a target) go to their discards.
  for (const st of s.villainQueue) if (st.s === "reveal" && !st.card.startsWith("activate:")) s.encounterDiscard.push(st.card);
  const pending = s.prompt?.resume;
  if (pending?.r === "effects" && pending.source?.startsWith("event:")) s.players[pending.player].discard.push(pending.source.slice(6));
  s.result = r; s.resultText = text; s.phase = "fin"; s.prompt = null; s.villainQueue = [];
  log(s, r === "victoria" ? `¡Victoria! ${text}` : `Derrota. ${text}`);
}

// MARK: Damage, threat and healing

export interface EnemyRef { kind: "villain" | "minion"; uid?: string; player?: number }

export function enemiesFor(s: GameState, i: number, forAttack: boolean): EnemyRef[] {
  const out: EnemyRef[] = [];
  const guarded = s.players[i].engaged.some((m) => ecard(s, m.uid).minion?.guardia);
  if (!(forAttack && guarded)) out.push({ kind: "villain" });
  s.players.forEach((p, pi) => { for (const m of p.engaged) out.push({ kind: "minion", uid: m.uid, player: pi }); });
  return out;
}
const refID = (r: EnemyRef) => (r.kind === "villain" ? "villain" : r.uid!);
const refFromID = (s: GameState, id: string): EnemyRef | undefined => {
  if (id === "villain") return { kind: "villain" };
  const pi = s.players.findIndex((p) => p.engaged.some((m) => m.uid === id));
  return pi >= 0 ? { kind: "minion", uid: id, player: pi } : undefined;
};
export const enemyName = (s: GameState, id: string) => (id === "villain" ? villainStats(s).name : ecard(s, id).name);

function damageEnemy(s: GameState, id: string, amount: number) {
  if (amount <= 0) return;
  if (id === "villain") {
    s.villain.damage += amount;
    const v = villainStats(s);
    log(s, `${v.name} recibe ${amount} daño (${Math.max(0, v.vidaMax - s.villain.damage)} vida restante).`);
    if (s.villain.damage >= v.vidaMax) {
      const sc = scenarioOf(s);
      if (s.villain.stage + 1 < sc.villain.stages.length) {
        s.villain.stage += 1; s.villain.damage = 0; s.villain.stunned = false;
        log(s, `¡${v.name} cae, pero se alza de nuevo como ${villainStats(s).name}!`);
      } else finish(s, "victoria", `${sc.villain.name} ha sido derrotado. Aurelia vuelve a ver el sol.`);
    }
    return;
  }
  const ref = refFromID(s, id);
  if (!ref) return;
  const p = s.players[ref.player!];
  const m = p.engaged.find((x) => x.uid === id)!;
  const def = ecard(s, id);
  m.damage += amount;
  if (m.damage >= def.minion!.vida) {
    p.engaged = p.engaged.filter((x) => x.uid !== id);
    s.encounterDiscard.push(id);
    log(s, `${def.name} es derrotado.`);
  } else log(s, `${def.name} recibe ${amount} daño.`);
}

function damageHero(s: GameState, i: number, amount: number) {
  if (amount <= 0) return;
  const p = s.players[i];
  p.damage += amount;
  const max = heroStats(s, i).vidaMax;
  log(s, `${heroName(s, i)} recibe ${amount} daño (${Math.max(0, max - p.damage)} vida).`);
  if (p.damage >= max) {
    p.eliminated = true;
    for (const m of p.engaged) s.encounterDiscard.push(m.uid);
    p.engaged = [];
    log(s, `${heroOf(p).hero.name} cae derrotado.`);
  }
}

function damageAlly(s: GameState, i: number, uid: string, amount: number) {
  const p = s.players[i];
  const c = p.play.find((x) => x.uid === uid);
  if (!c || amount <= 0) return;
  c.damage += amount;
  const def = pcard(s, uid);
  if (c.damage >= def.ally!.vida) {
    p.play = p.play.filter((x) => x.uid !== uid);
    p.discard.push(uid);
    log(s, `${def.name} cae y vuelve al descarte.`);
  }
}

function thwartPlan(s: GameState, uid: string, amount: number) {
  const plan = s.plans.find((p) => p.uid === uid);
  if (!plan || amount <= 0) return;
  plan.threat = Math.max(0, plan.threat - amount);
  const name = planName(s, plan);
  log(s, `Retiras ${amount} amenaza de ${name}.`);
  if (plan.def !== "main" && plan.threat === 0) {
    s.plans = s.plans.filter((p) => p !== plan);
    s.encounterDiscard.push(plan.uid);
    log(s, `${name} queda frustrado.`);
  }
}
export const planName = (s: GameState, p: PlanState) => (p.def === "main" ? scenarioOf(s).mainPlan.name : ecard(s, p.uid).name);

function addThreat(s: GameState, uid: string, amount: number) {
  const plan = s.plans.find((p) => p.uid === uid);
  if (!plan || amount <= 0) return;
  plan.threat += amount;
  log(s, `${planName(s, plan)} gana ${amount} amenaza.`);
}

// MARK: Effects

function optionsFor(s: GameState, i: number, t: Target, ctx?: EffectCtx): { id: string; label: string; detail?: string }[] {
  switch (t) {
    case "chooseEnemy": return enemiesFor(s, i, true).map((r) => ({ id: refID(r), label: enemyName(s, refID(r)), detail: enemyDetail(s, refID(r)) }));
    case "chooseMinion": return enemiesFor(s, i, false).filter((r) => r.kind === "minion").map((r) => ({ id: r.uid!, label: enemyName(s, r.uid!), detail: enemyDetail(s, r.uid!) }));
    case "villain": return [{ id: "villain", label: enemyName(s, "villain") }];
    case "attacker": return ctx?.attacker && (ctx.attacker === "villain" || refFromID(s, ctx.attacker)) ? [{ id: ctx.attacker, label: enemyName(s, ctx.attacker) }] : [];
    case "choosePlan": return s.plans.map((p) => ({ id: p.uid, label: planName(s, p), detail: `${p.threat} amenaza` }));
    case "mainPlan": return [{ id: "main", label: planName(s, mainPlan(s)) }];
    case "self": return [{ id: `hero:${i}`, label: heroName(s, i) }];
    case "chooseFriendly": {
      const out = [{ id: `hero:${i}`, label: heroName(s, i) }];
      for (const c of s.players[i].play) if (pcard(s, c.uid).ally) out.push({ id: c.uid, label: pcard(s, c.uid).name });
      return out;
    }
    default: return [];
  }
}

function enemyDetail(s: GameState, id: string): string {
  if (id === "villain") { const v = villainStats(s); return `${v.vidaMax - s.villain.damage} vida`; }
  const ref = refFromID(s, id);
  const m = ref && s.players[ref.player!].engaged.find((x) => x.uid === id);
  return m ? `${ecard(s, id).minion!.vida - m.damage} vida` : "";
}

/** Runs effects from `index`, pausing with a prompt when a choice is needed. */
function runEffects(s: GameState, i: number, effects: Effect[], index = 0, ctx: EffectCtx = {}, source?: string): boolean {
  for (let k = index; k < effects.length; k++) {
    if (s.result) return true;
    const e = effects[k];
    const needsTarget = "target" in e && e.target && !["eachHero", "allMinions"].includes(e.target);
    let chosen: string | undefined;
    if (needsTarget) {
      const opts = optionsFor(s, i, (e as { target: Target }).target, ctx);
      if (!opts.length) continue;
      if (opts.length === 1 || !(e as { target: Target }).target.startsWith("choose")) chosen = opts[0].id;
      else {
        setPrompt(s, { player: i, kind: "target", text: targetText(e), options: opts, resume: { r: "effects", player: i, effects, index: k, source, ctx } });
        return false;
      }
    }
    applyEffect(s, i, e, chosen, ctx);
  }
  return true;
}

const targetText = (e: Effect) => (e.do === "damage" ? "¿A qué enemigo?" : e.do === "thwart" ? "¿De qué plan retiras amenaza?" : e.do === "heal" ? "¿A quién curas?" : "Elige un objetivo");

function applyEffect(s: GameState, i: number, e: Effect, target: string | undefined, ctx: EffectCtx) {
  const p = s.players[i];
  switch (e.do) {
    case "damage": {
      const upgraded = p.play.some((c) => pcard(s, c.uid).type === "mejora");
      damageEnemy(s, target!, upgraded && e.ifUpgrade ? e.ifUpgrade : e.amount);
      break;
    }
    case "thwart": thwartPlan(s, target!, e.amount); break;
    case "addThreat": addThreat(s, target!, e.amount); break;
    case "heal": {
      if (target?.startsWith("hero:")) { const before = p.damage; p.damage = Math.max(0, p.damage - e.amount); log(s, `${heroName(s, i)} se cura ${before - p.damage}.`); }
      else { const c = p.play.find((x) => x.uid === target); if (c) c.damage = Math.max(0, c.damage - e.amount); }
      break;
    }
    case "draw": drawCards(s, i, e.amount); break;
    case "prevent": if (ctx.preventPool) ctx.preventPool.amount += e.amount; break;
    case "stun": {
      if (target === "villain") s.villain.stunned = true;
      else { const ref = target && refFromID(s, target); const m = ref && s.players[ref.player!].engaged.find((x) => x.uid === target); if (m) m.stunned = true; }
      if (target) log(s, `${enemyName(s, target)} queda aturdido.`);
      break;
    }
    case "readyHero": p.heroExhausted = false; log(s, `${heroName(s, i)} se prepara de nuevo.`); break;
    case "villainActivates": s.villainQueue.unshift({ s: "villainActivates", player: i }); break;
    case "heroDamage":
      if (p.form === "heroe") damageHero(s, i, e.amount);
      else if (e.ifIdentity) addThreat(s, "main", e.ifIdentity.amount);
      break;
    case "surge": {
      const next = takeEncounter(s);
      if (next) s.villainQueue.unshift({ s: "reveal", player: i, card: next });
      break;
    }
  }
  checkEnd(s);
}

// MARK: Prompts

let promptCounter = 0;
function setPrompt(s: GameState, p: Omit<Prompt, "id">) { s.prompt = { ...p, id: `p${++promptCounter}-${s.log.length}` }; }

/** The player's answer to the current prompt. */
export function answer(s: GameState, option: string): string | undefined {
  const pr = s.prompt;
  if (!pr) return "No hay nada que decidir.";
  if (!pr.options.some((o) => o.id === option)) return "Esa opción no es válida.";
  s.prompt = null;
  resume(s, pr.resume, option);
  if (!s.prompt && s.phase === "villano") runVillain(s);
  return undefined;
}

function resume(s: GameState, r: Resume, option: string) {
  switch (r.r) {
    case "effects": {
      applyEffect(s, r.player, r.effects[r.index], option, r.ctx ?? {});
      if (runEffects(s, r.player, r.effects, r.index + 1, r.ctx ?? {}, r.source)) afterEffects(s, r.player, r.source);
      return;
    }
    case "defense": return resolveDefense(s, r, option);
    case "interrupts": return resolveInterrupt(s, r, option);
    case "afterAttack": return resolveAfterAttack(s, r, option);
    case "villainStep": return;
  }
}

/** After a played card's effects finish: events go to the discard, triggers fire. */
function afterEffects(s: GameState, i: number, source?: string) {
  if (!source) return;
  const p = s.players[i];
  if (source.startsWith("event:")) {
    const uid = source.slice(6);
    p.discard.push(uid);
  }
}

// MARK: Player actions

export type Action =
  | { a: "play"; player: number; card: string; pay: string[] }
  | { a: "attack"; player: number }
  | { a: "thwart"; player: number }
  | { a: "recover"; player: number }
  | { a: "allyAttack"; player: number; ally: string }
  | { a: "allyThwart"; player: number; ally: string }
  | { a: "useCard"; player: number; card: string }
  | { a: "heroAbility"; player: number }
  | { a: "flip"; player: number }
  | { a: "removeAttachment"; player: number; attachment: string }
  | { a: "endTurn"; player: number; discard: string[] };

/** What a player can do right now with a card in hand (for the interface). */
export function canPlay(s: GameState, i: number, uid: string): string | undefined {
  const p = s.players[i];
  const c = pcard(s, uid);
  if (c.type === "recurso") return "Solo sirve para pagar.";
  if (c.play && c.play.timing !== "action") return c.play.timing === "defend" ? "Se juega al defenderte." : "Se juega después de que te ataquen.";
  if (c.play?.heroOnly && p.form !== "heroe") return "Solo en forma de héroe.";
  if (c.type === "aliado" && p.play.filter((x) => pcard(s, x.uid).type === "aliado").length >= 3) return "Ya tienes 3 aliados.";
  const available = p.hand.filter((u) => u !== uid).reduce((a, u) => a + pcard(s, u).resources, 0);
  if (available < c.cost) return `Necesitas ${c.cost} recursos.`;
  return undefined;
}

export const resourcesOf = (s: GameState, uids: string[]) => uids.reduce((a, u) => a + pcard(s, u).resources, 0);

export function act(s: GameState, x: Action): string | undefined {
  if (s.result) return "La partida ha terminado.";
  if (s.prompt) return "Primero resuelve la decisión pendiente.";
  if (s.phase !== "jugadores" || x.player !== s.active) return "No es tu turno.";
  const i = x.player;
  const p = s.players[i];
  const h = heroOf(p);
  const err = doAction(s, i, p, h.hero.name, x);
  if (err) return err;
  checkEnd(s);
  return undefined;
}

function doAction(s: GameState, i: number, p: PlayerState, heroLabel: string, x: Action): string | undefined {
  switch (x.a) {
    case "play": {
      if (!p.hand.includes(x.card)) return "Esa carta no está en tu mano.";
      const why = canPlay(s, i, x.card);
      if (why) return why;
      const c = pcard(s, x.card);
      if (x.pay.includes(x.card) || x.pay.some((u) => !p.hand.includes(u))) return "Pago no válido.";
      if (resourcesOf(s, x.pay) < c.cost) return `Faltan recursos: necesitas ${c.cost}.`;
      p.hand = p.hand.filter((u) => u !== x.card && !x.pay.includes(u));
      p.discard.push(...x.pay);
      log(s, `${heroName(s, i)} juega ${c.name}.`);
      if (c.play) {
        if (runEffects(s, i, c.play.effects, 0, {}, `event:${x.card}`)) afterEffects(s, i, `event:${x.card}`);
        return;
      }
      p.play.push({ uid: x.card, def: c.id, exhausted: false, damage: 0 });
      if (c.type === "mejora") triggerAfterUpgrade(s, i);
      return;
    }
    case "attack": case "thwart": {
      if (p.form !== "heroe") return "Solo en forma de héroe.";
      if (p.heroExhausted) return `${heroLabel} está agotado.`;
      const st = heroStats(s, i);
      p.heroExhausted = true;
      if (x.a === "attack") {
        log(s, `${heroLabel} ataca.`);
        runEffects(s, i, [{ do: "damage", target: "chooseEnemy", amount: st.fuerza }]);
      } else {
        log(s, `${heroLabel} contiene el plan.`);
        runEffects(s, i, [{ do: "thwart", target: "choosePlan", amount: st.ingenio }]);
      }
      return;
    }
    case "recover": {
      if (p.form !== "identidad") return "Solo en forma de identidad.";
      if (p.heroExhausted) return "Ya has actuado este turno.";
      p.heroExhausted = true;
      const before = p.damage;
      p.damage = Math.max(0, p.damage - heroOf(p).identity.recuperacion);
      log(s, `${heroName(s, i)} descansa y recupera ${before - p.damage} vida.`);
      return;
    }
    case "allyAttack": case "allyThwart": {
      const c = p.play.find((y) => y.uid === x.ally);
      const def = c && pcard(s, c.uid);
      if (!c || !def?.ally) return "Ese aliado no está en juego.";
      if (c.exhausted) return `${def.name} está agotado.`;
      c.exhausted = true;
      const attack = x.a === "allyAttack";
      log(s, `${def.name} ${attack ? "ataca" : "contiene el plan"}.`);
      const done = runEffects(s, i, [attack ? { do: "damage", target: "chooseEnemy", amount: def.ally.fuerza } : { do: "thwart", target: "choosePlan", amount: def.ally.ingenio }]);
      void done;
      damageAlly(s, i, c.uid, attack ? def.ally.consFuerza : def.ally.consIngenio);
      return;
    }
    case "useCard": {
      const c = p.play.find((y) => y.uid === x.card);
      const def = c && pcard(s, c.uid);
      if (!c || !def?.ability || def.ability.timing !== "action") return "Esa carta no tiene una acción.";
      if (def.ability.cost === "exhaust" && c.exhausted) return `${def.name} está agotada.`;
      if (def.ability.cost === "once" && c.usedThisRound) return "Ya la usaste esta ronda.";
      if (def.ability.cost === "exhaust") c.exhausted = true; else c.usedThisRound = true;
      log(s, `${heroName(s, i)} usa ${def.name}.`);
      runEffects(s, i, def.ability.effects);
      return;
    }
    case "heroAbility": {
      const ab = heroOf(p).ability;
      if (ab.timing !== "action") return "Esta habilidad se activa sola.";
      if (p.form !== "heroe") return "Solo en forma de héroe.";
      if (p.heroAbilityUsed) return "Ya la usaste esta ronda.";
      p.heroAbilityUsed = true;
      log(s, `${heroLabel}: ${ab.text}.`);
      runEffects(s, i, ab.effects);
      return;
    }
    case "flip": {
      if (p.flippedThisTurn) return "Solo puedes cambiar de forma una vez por turno.";
      p.form = p.form === "heroe" ? "identidad" : "heroe";
      p.flippedThisTurn = true;
      log(s, p.form === "heroe" ? `${heroOf(p).identity.name} se transforma en ${heroLabel}.` : `${heroLabel} vuelve a ser ${heroOf(p).identity.name}.`);
      return;
    }
    case "removeAttachment": {
      if (p.form !== "heroe") return "Solo en forma de héroe.";
      if (p.heroExhausted) return `${heroLabel} está agotado.`;
      if (!s.villain.attachments.includes(x.attachment)) return "Ese vínculo ya no está.";
      p.heroExhausted = true;
      s.villain.attachments = s.villain.attachments.filter((u) => u !== x.attachment);
      s.encounterDiscard.push(x.attachment);
      log(s, `${heroLabel} arranca ${ecard(s, x.attachment).name} al villano.`);
      return;
    }
    case "endTurn": {
      if (x.discard.some((u) => !p.hand.includes(u))) return "Solo puedes descartar cartas de tu mano.";
      p.hand = p.hand.filter((u) => !x.discard.includes(u));
      p.discard.push(...x.discard);
      const need = handSize(s, i) - p.hand.length;
      if (need > 0) drawCards(s, i, need);
      p.heroExhausted = false; p.flippedThisTurn = false; p.stunned = false;
      for (const c of p.play) c.exhausted = false;
      log(s, `${heroName(s, i)} termina su turno.`);
      nextTurn(s);
      return;
    }
  }
}

function triggerAfterUpgrade(s: GameState, i: number) {
  const p = s.players[i];
  const ab = heroOf(p).ability;
  if (ab.timing !== "afterUpgrade" || p.heroAbilityUsed || p.form !== "heroe") return;
  p.heroAbilityUsed = true;
  log(s, `${heroOf(p).hero.name}: ${ab.text}.`);
  runEffects(s, i, ab.effects);
}

function nextTurn(s: GameState) {
  const n = s.players.length;
  for (let k = 1; k <= n; k++) {
    const next = (s.active + k) % n;
    if (next === s.first) break;
    if (!s.players[next].eliminated) { s.active = next; log(s, `Turno de ${heroName(s, next)}.`); return; }
  }
  startVillainPhase(s);
}

// MARK: Villain phase

function order(s: GameState): number[] {
  const n = s.players.length;
  return Array.from({ length: n }, (_, k) => (s.first + k) % n).filter((i) => !s.players[i].eliminated);
}

function startVillainPhase(s: GameState) {
  s.phase = "villano";
  log(s, `Fase del villano (ronda ${s.round}).`);
  const q: VillainStep[] = [{ s: "accelerate" }];
  for (const i of order(s)) q.push({ s: "villainActivates", player: i }, { s: "minionsActivate", player: i });
  q.push({ s: "deal" }, { s: "endRound" });
  s.villainQueue = q;
  runVillain(s);
}

/** Runs villain steps until one needs a decision or the round ends. */
export function runVillain(s: GameState) {
  while (!s.prompt && !s.result && s.villainQueue.length) {
    const step = s.villainQueue.shift()!;
    villainStep(s, step);
    checkEnd(s);
  }
}

function takeEncounter(s: GameState): string | undefined {
  if (!s.encounterDeck.length) {
    if (!s.encounterDiscard.length) return undefined;
    s.encounterDeck = shuffle(s, s.encounterDiscard.splice(0));
    addThreat(s, "main", 1);
    log(s, "El mazo de encuentros se rebaraja: el plan principal avanza 1.");
  }
  return s.encounterDeck.shift();
}

function villainStep(s: GameState, st: VillainStep) {
  switch (st.s) {
    case "accelerate": {
      const sc = scenarioOf(s);
      const extra = s.plans.filter((p) => p.def !== "main" && ecard(s, p.uid).sidePlan?.aceleracion).length;
      addThreat(s, "main", sc.mainPlan.aceleracionPorJugador * playerCount(s) + extra);
      return;
    }
    case "villainActivates": {
      const p = s.players[st.player];
      if (p.eliminated) return;
      if (s.villain.stunned) { s.villain.stunned = false; log(s, `${villainStats(s).name} está aturdido y no actúa.`); return; }
      const boostCard = takeEncounter(s);
      const boost = boostCard ? ecard(s, boostCard).boost : 0;
      if (boostCard) s.encounterDiscard.push(boostCard);
      const v = villainStats(s);
      if (p.form === "heroe") attack(s, st.player, "villain", v.fuerza, boost);
      else {
        log(s, `${v.name} trama contra ${heroName(s, st.player)}${boost ? ` (+${boost} de refuerzo)` : ""}.`);
        addThreat(s, "main", v.plan + boost);
      }
      return;
    }
    case "minionsActivate": {
      const p = s.players[st.player];
      if (p.eliminated) return;
      // Queue one activation per minion so each attack can wait for its own defence.
      const steps: VillainStep[] = [];
      for (const m of p.engaged) steps.push({ s: "reveal", player: st.player, card: `activate:${m.uid}` });
      s.villainQueue.unshift(...steps);
      return;
    }
    case "deal": {
      for (const i of order(s)) {
        const c = takeEncounter(s);
        if (c) s.villainQueue.splice(s.villainQueue.length - 1, 0, { s: "reveal", player: i, card: c });
      }
      return;
    }
    case "reveal": {
      if (st.card.startsWith("activate:")) return activateMinion(s, st.player, st.card.slice(9));
      return reveal(s, st.player, st.card);
    }
    case "endRound": {
      s.first = (s.first + 1) % s.players.length;
      while (s.players[s.first].eliminated) s.first = (s.first + 1) % s.players.length;
      s.active = s.first;
      s.round += 1;
      s.phase = "jugadores";
      for (const p of s.players) { p.heroAbilityUsed = false; for (const c of p.play) c.usedThisRound = false; }
      log(s, `Ronda ${s.round}. Empieza ${heroName(s, s.active)}.`);
      return;
    }
  }
}

function activateMinion(s: GameState, i: number, uid: string) {
  const p = s.players[i];
  const m = p.engaged.find((x) => x.uid === uid);
  if (!m || p.eliminated) return;
  const def = ecard(s, uid);
  if (m.stunned) { m.stunned = false; log(s, `${def.name} está aturdido y no actúa.`); return; }
  if (p.form === "heroe") attack(s, i, uid, def.minion!.fuerza, 0);
  else if (def.minion!.plan > 0) { log(s, `${def.name} trama contra ${heroName(s, i)}.`); addThreat(s, "main", def.minion!.plan); }
}

function reveal(s: GameState, i: number, uid: string) {
  const def = ecard(s, uid);
  const p = s.players[i];
  log(s, `Encuentro para ${heroName(s, i)}: ${def.name}.`);
  switch (def.type) {
    case "esbirro": p.engaged.push({ uid, def: def.id, damage: 0 }); return;
    case "plan": s.plans.push({ uid, def: def.id, threat: def.sidePlan!.amenaza }); return;
    case "vinculo": s.villain.attachments.push(uid); return;
    case "traicion":
      s.encounterDiscard.push(uid);
      if (def.reveal) runEffects(s, i, def.reveal.map((e) => (e.do === "addThreat" ? { ...e, target: "mainPlan" as Target } : e)));
      return;
  }
}

// MARK: Attacks and defence

/** Number of resources from hand a player could pay (for interrupts paid automatically). */
function autoPay(s: GameState, i: number, cost: number, except: string): string[] | undefined {
  const p = s.players[i];
  // Cheapest to lose first: resource cards, then the lowest-cost cards.
  const pool = p.hand.filter((u) => u !== except).sort((a, b) => (pcard(s, a).type === "recurso" ? -1 : 0) - (pcard(s, b).type === "recurso" ? -1 : 0) || pcard(s, a).cost - pcard(s, b).cost);
  const pay: string[] = [];
  let sum = 0;
  for (const u of pool) { if (sum >= cost) break; pay.push(u); sum += pcard(s, u).resources; }
  return sum >= cost ? pay : undefined;
}

function responsesFor(s: GameState, i: number, timing: "defend" | "afterAttack") {
  const p = s.players[i];
  return p.hand.filter((u) => {
    const c = pcard(s, u);
    return c.play?.timing === timing && (!c.play.heroOnly || p.form === "heroe") && autoPay(s, i, c.cost, u);
  });
}

function attack(s: GameState, i: number, attacker: string, base: number, boost: number) {
  const p = s.players[i];
  const amount = base + boost;
  const name = enemyName(s, attacker);
  log(s, `${name} ataca a ${heroName(s, i)} con ${amount}${boost ? ` (incluye +${boost} de refuerzo)` : ""}.`);
  const options: Prompt["options"] = [];
  if (!p.heroExhausted && p.form === "heroe") options.push({ id: "hero", label: `Defender con ${heroName(s, i)}`, detail: `Agota al héroe; Aguante ${heroStats(s, i).aguante} reduce el daño` });
  for (const c of p.play) {
    const d = pcard(s, c.uid);
    if (d.ally && !c.exhausted) options.push({ id: c.uid, label: `Bloquear con ${d.name}`, detail: `El aliado recibe todo el daño (${d.ally.vida - c.damage} vida)` });
  }
  options.push({ id: "none", label: "No defender", detail: `${heroName(s, i)} recibe ${amount} daño` });
  setPrompt(s, { player: i, kind: "defense", text: `${name} ataca con ${amount}. ¿Cómo te defiendes?`, options, resume: { r: "defense", player: i, attacker, amount, boost } });
}

function resolveDefense(s: GameState, r: Extract<Resume, { r: "defense" }>, option: string) {
  const p = s.players[r.player];
  let defender: string | null = null;
  if (option === "hero") { p.heroExhausted = true; defender = "hero"; log(s, `${heroName(s, r.player)} se defiende.`); }
  else if (option !== "none") { const c = p.play.find((x) => x.uid === option); if (c) { c.exhausted = true; defender = option; log(s, `${pcard(s, option).name} bloquea el golpe.`); } }
  askInterrupts(s, { r: "interrupts", player: r.player, attacker: r.attacker, amount: r.amount, defender, prevented: 0 });
}

function askInterrupts(s: GameState, r: Extract<Resume, { r: "interrupts" }>) {
  const opts = responsesFor(s, r.player, "defend");
  if (!opts.length) return applyAttackDamage(s, r);
  setPrompt(s, {
    player: r.player, kind: "optional", text: "¿Juegas una carta antes de recibir el golpe? (se paga sola con tus cartas menos valiosas)",
    options: [...opts.map((u) => ({ id: u, label: pcard(s, u).name, detail: pcard(s, u).text })), { id: "no", label: "No" }],
    resume: r,
  });
}

function resolveInterrupt(s: GameState, r: Extract<Resume, { r: "interrupts" }>, option: string) {
  if (option !== "no") {
    const p = s.players[r.player];
    const c = pcard(s, option);
    const pay = autoPay(s, r.player, c.cost, option) ?? [];
    p.hand = p.hand.filter((u) => u !== option && !pay.includes(u));
    p.discard.push(...pay, option);
    log(s, `${heroName(s, r.player)} juega ${c.name}${pay.length ? ` (paga con ${pay.map((u) => pcard(s, u).name).join(", ")})` : ""}.`);
    const pool = { amount: 0 };
    runEffects(s, r.player, c.play!.effects, 0, { attacker: r.attacker, preventPool: pool });
    r = { ...r, prevented: r.prevented + pool.amount };
  }
  applyAttackDamage(s, r);
}

function applyAttackDamage(s: GameState, r: Extract<Resume, { r: "interrupts" }>) {
  const p = s.players[r.player];
  let dmg = Math.max(0, r.amount - r.prevented);
  if (r.defender === "hero") dmg = Math.max(0, dmg - heroStats(s, r.player).aguante);
  if (r.defender && r.defender !== "hero") damageAlly(s, r.player, r.defender, dmg);
  else if (dmg > 0) damageHero(s, r.player, dmg);
  else log(s, `${heroName(s, r.player)} no recibe daño.`);
  if (checkEnd(s) || p.eliminated) return;
  const opts = responsesFor(s, r.player, "afterAttack");
  const attackerAlive = r.attacker === "villain" || !!refFromID(s, r.attacker);
  if (!opts.length || !attackerAlive) return;
  setPrompt(s, {
    player: r.player, kind: "optional", text: `¿Respondes al ataque de ${enemyName(s, r.attacker)}?`,
    options: [...opts.map((u) => ({ id: u, label: pcard(s, u).name, detail: pcard(s, u).text })), { id: "no", label: "No" }],
    resume: { r: "afterAttack", player: r.player, attacker: r.attacker },
  });
}

function resolveAfterAttack(s: GameState, r: Extract<Resume, { r: "afterAttack" }>, option: string) {
  if (option === "no") return;
  const p = s.players[r.player];
  const c = pcard(s, option);
  const pay = autoPay(s, r.player, c.cost, option) ?? [];
  p.hand = p.hand.filter((u) => u !== option && !pay.includes(u));
  p.discard.push(...pay, option);
  log(s, `${heroName(s, r.player)} juega ${c.name}.`);
  runEffects(s, r.player, c.play!.effects, 0, { attacker: r.attacker });
}

// MARK: Helpers for the interface

export const allyCards = (s: GameState, i: number): CardInPlay[] => s.players[i].play.filter((c) => !!pcard(s, c.uid).ally);
export const otherCards = (s: GameState, i: number): CardInPlay[] => s.players[i].play.filter((c) => !pcard(s, c.uid).ally);
