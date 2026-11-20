import { ENCOUNTER_CARDS, ENCOUNTER_SETS, HERO_BY_ID, PLAYER_CARDS, SCENARIO_BY_ID } from "../data/content";
import type { Ability, CardInPlay, EncounterCardDef, Effect, EffectCtx, GameState, Keyword, MainPlanDef, MinionState, PlanState, PlayerAttachment, PlayerCardDef, PlayerState, Prompt, ResType, Resume, SetupOptions, StatusKind, Statuses, Target, VillainStep } from "./types";

export const RES_ICON: Record<ResType, string> = { energia: "⚡", mental: "🧠", fisico: "✊", comodin: "🌟" };
export const RES_NAME: Record<ResType, string> = { energia: "Energía", mental: "Mental", fisico: "Físico", comodin: "Comodín" };
export const STATUS_NAME: Record<StatusKind, string> = { stunned: "Aturdido", confused: "Confundido", tough: "Duro" };
/** A printed type satisfies a wanted type if it matches or is Comodín. */
export const resMatches = (printed: ResType, wanted: ResType) => printed === wanted || printed === "comodin";

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

const log = (s: GameState, text: string) => {
  s.log.push({ round: s.round, text });
  if (s.log.length > 400) s.log.shift();
  // During the villain phase every line also goes to the step being resolved.
  if (s.phase === "villano" && s.phaseReport?.length) s.phaseReport[s.phaseReport.length - 1].lines.push(text);
};
/** Opens a new step of the villain-phase breakdown. */
function report(s: GameState, step: 1 | 2 | 3, title: string, cards: string[] = []) {
  if (s.phase !== "villano") return;
  s.phaseReport ??= [];
  s.phaseReport.push({ n: s.phaseReport.length + 1, step, title, lines: [], cards });
}

/** All of a card's abilities (most have one). */
export const abilitiesOf = (d: PlayerCardDef): Ability[] => d.abilities ?? (d.ability ? [d.ability] : []);

/** A minion's definition and stats (Drones get the Drone bonus from attachments). */
export const minionDef = (m: MinionState): EncounterCardDef => ENCOUNTER_CARDS.get(m.def)!;
export function minionStats(s: GameState, m: MinionState) {
  const d = minionDef(m).minion!;
  const bonus = m.drone ? s.villain.attachments.reduce((a, u) => a + (ecard(s, u).droneBonus ?? 0), 0) : 0;
  return { vida: d.vida + bonus, fuerza: d.fuerza + bonus, plan: d.plan + bonus, guardia: !!d.guardia };
}
const findMinion = (s: GameState, id: string) => { for (const p of s.players) { const m = p.engaged.find((x) => x.uid === id); if (m) return m; } return undefined; };

/** An ally's stats with its permanent bonuses. */
export function allyStats(s: GameState, c: CardInPlay) {
  const a = pcard(s, c.uid).ally!;
  const att = (k: "fuerza" | "ingenio") => (c.attached ?? []).reduce((n, u) => n + (pcard(s, u).attachBonus?.[k] ?? 0), 0);
  return {
    ...a,
    fuerza: a.fuerza + (c.buff?.fuerza ?? 0) + (c.temp?.fuerza ?? 0) + att("fuerza"),
    ingenio: a.ingenio + (c.buff?.ingenio ?? 0) + (c.temp?.ingenio ?? 0) + att("ingenio"),
    vida: a.vida + (c.buff?.vida ?? 0) + (c.attached ?? []).reduce((n, u) => n + (pcard(s, u).attachBonus?.vida ?? 0), 0),
  };
}

/** A card leaves play to its owner's discard, with every upgrade attached to it. */
function leavePlay(s: GameState, i: number, uid: string) {
  const p = s.players[i];
  const c = p.play.find((x) => x.uid === uid);
  if (!c) return;
  p.play = p.play.filter((x) => x !== c);
  p.discard.push(uid, ...(c.attached ?? []));
}

/** Is this player card attached to an ally, a minion or the villain? */
function isAttached(s: GameState, uid: string): boolean {
  if (s.villain.playerAttached?.some((a) => a.uid === uid) || s.planAttached?.some((a) => a.uid === uid)) return true;
  return s.players.some((p) => p.play.some((c) => c.uid === uid || c.attached?.includes(uid)) || p.engaged.some((m) => m.attached?.some((a) => a.uid === uid)));
}

/** The player cards attached to an enemy (the villain or a minion). */
export function enemyAttachments(s: GameState, id: string): PlayerAttachment[] {
  if (id === "villain") return s.villain.playerAttached ?? [];
  return findMinion(s, id)?.attached ?? [];
}

/** A card's cost for this player now (an Aeronave discount lowers the next one). */
export function costOf(s: GameState, i: number, uid: string): number {
  const p = s.players[i], c = pcard(s, uid);
  const ally = p.allyDiscount && c.ally && c.traits?.includes(p.allyDiscount.trait) ? p.allyDiscount.amount : 0;
  return Math.max(0, c.cost - (p.discount ?? 0) - ally);
}

/** How many allies a player can control: 3, plus supports that raise it. */
export function allyLimit(s: GameState, i: number): number {
  const p = s.players[i];
  const allies = p.play.filter((c) => pcard(s, c.uid).ally);
  let n = 3;
  for (const c of p.play) {
    const d = pcard(s, c.uid);
    n += d.allyLimit ?? 0;
    if (d.allyLimitIfAll && allies.every((a) => allyTraits(s, a).includes(d.allyLimitIfAll!))) n += 1;
  }
  return n;
}
const allyCount = (s: GameState, i: number) => s.players[i].play.filter((c) => pcard(s, c.uid).ally).length;

/** An ally's traits, with those granted by attached cards (Insignia de la Guardia). */
export function allyTraits(s: GameState, c: CardInPlay): string[] {
  return [...(pcard(s, c.uid).traits ?? []), ...(c.attached ?? []).flatMap((u) => pcard(s, u).attachGrants ?? [])];
}
/** The hero's printed traits (hero form) plus Insignia-style grants on the hero. */
export function heroTraits(s: GameState, i: number): string[] {
  const p = s.players[i];
  if (p.form !== "heroe") return [];
  return [...(heroOf(p).heroTraits ?? []), ...p.play.flatMap((c) => pcard(s, c.uid).ally ? [] : pcard(s, c.uid).attachGrants ?? [])];
}
/** Do you control a character (hero or ally) with this trait? */
export const controlsTrait = (s: GameState, i: number, trait: string) => heroTraits(s, i).includes(trait) || s.players[i].play.some((c) => pcard(s, c.uid).ally && allyTraits(s, c).includes(trait));

/** What a card in hand is worth when paying for another (Don de Mando doubles for Liderazgo cards). */
export function payValue(s: GameState, payUid: string, forUid?: string): number {
  const c = pcard(s, payUid);
  if (c.heroFormOnly && s.players.some((p) => p.form !== "heroe" && p.hand.includes(payUid))) return 0;
  const target = forUid ? pcard(s, forUid) : undefined;
  if (target?.payOnly && !resMatches(c.resType, target.payOnly)) return 0;
  const double = !!c.doubleFor && !!target && (target.aspect === c.doubleFor || !!target.traits?.includes(c.doubleFor));
  return c.resources * (double ? 2 : 1);
}
/** A card or ability that asks for a resource type ("any": any card). */
const payMatch = (printed: ResType, want: ResType | "any") => want === "any" || resMatches(printed, want);
/** Everything paid was of this type (Comodín counts). */
const paidOnly = (ctx: EffectCtx, res: ResType) => Object.entries(ctx.paid ?? {}).every(([k, n]) => !n || k === res || k === "comodin");
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
  const st = { fuerza: h.hero.fuerza, ingenio: h.hero.ingenio, aguante: h.hero.aguante, vidaMax: h.vida, recuperacion: h.identity.recuperacion };
  for (const c of p.play) {
    const b = pcard(s, c.uid).bonus;
    if (!b) continue;
    st.fuerza += b.fuerza ?? 0; st.ingenio += b.ingenio ?? 0; st.aguante += b.aguante ?? 0; st.vidaMax += b.vidaMax ?? 0; st.recuperacion += b.recuperacion ?? 0;
  }
  for (const c of p.play) {
    const bt = pcard(s, c.uid).bonusIfTrait;
    if (bt && traitCount(s, i, bt.trait) > 0) { st.fuerza += bt.bonus.fuerza ?? 0; st.ingenio += bt.bonus.ingenio ?? 0; st.aguante += bt.bonus.aguante ?? 0; }
  }
  st.fuerza += p.temp?.fuerza ?? 0; st.ingenio += p.temp?.ingenio ?? 0;
  return st;
}

export function handSize(s: GameState, i: number): number {
  const p = s.players[i], h = heroOf(p);
  const base = p.form === "heroe" ? h.hero.mano : h.identity.mano;
  const n = base + p.play.reduce((a, c) => a + (pcard(s, c.uid).bonus?.mano ?? 0), 0);
  const rule = h.hero.manoPorRasgo;
  return p.form === "heroe" && rule ? Math.min(rule.max, n + traitCount(s, i, rule.trait)) : n;
}

/** How many of this player's cards in play have a trait (armour pieces, …). */
export const traitCount = (s: GameState, i: number, trait: string) =>
  s.players[i].play.filter((c) => pcard(s, c.uid).traits?.includes(trait)).length + (s.players[i].tempTraits?.includes(trait) ? 1 : 0);

/** The villain stages used this game, as indexes into the scenario's stages. */
export function stageList(s: GameState): number[] {
  const v = scenarioOf(s).villain;
  if (!v.stagesFor) return v.stages.map((_, k) => k);
  return s.difficulty === "experto" ? v.stagesFor.expert : v.stagesFor.normal;
}

export function villainStats(s: GameState) {
  const sc = scenarioOf(s);
  const st = sc.villain.stages[stageList(s)[s.villain.stage]];
  let fuerza = st.fuerza, plan = st.plan, vida = 0;
  const bonusCards = [...s.villain.attachments, ...s.plans.filter((x) => x.def !== "main").map((x) => x.uid)];
  for (const a of bonusCards) { const b = ecard(s, a).villainBonus; fuerza += b?.fuerza ?? 0; plan += b?.plan ?? 0; vida += b?.vida ?? 0; }
  const env = environmentDef(s)?.environment;
  fuerza += env?.fuerza ?? 0; plan += env?.plan ?? 0;
  // Scenarios with their own expert stages don't get the generic bonus.
  const expert = s.difficulty === "experto" && !sc.villain.stagesFor;
  return { name: st.name, fuerza: fuerza + (expert ? 1 : 0), plan, vidaMax: (st.vidaPorJugador + (expert ? 2 : 0)) * playerCount(s) + vida, text: st.text };
}

export const currentStage = (s: GameState) => scenarioOf(s).villain.stages[stageList(s)[s.villain.stage]];

/** The environment the villain has absorbed, if any. */
export const environmentDef = (s: GameState) => (s.environment ? ecard(s, s.environment) : undefined);
/** The villain's traits (from the environment it absorbed). */
export const villainTraits = (s: GameState): string[] => { const t = environmentDef(s)?.environment?.trait; return t ? [t] : []; };
/** Combat keywords of an attacker: the villain's come from its stage, attachments and environment. */
export function attackerKeywords(s: GameState, attacker: string): Keyword[] {
  if (attacker !== "villain") { const m = findMinion(s, attacker); return m ? (minionDef(m).minion?.keywords ?? []) : []; }
  const out = new Set<Keyword>(currentStage(s).keywords ?? []);
  for (const u of s.villain.attachments) for (const k of ecard(s, u).keywords ?? []) out.add(k);
  for (const k of environmentDef(s)?.environment?.keywords ?? []) out.add(k);
  return [...out];
}
export const KEYWORD_NAME: Record<Keyword, string> = { perforante: "Perforante", arrollador: "Arrollador", distancia: "A distancia" };
/** A side plan with Crisis is in play: no threat can be removed from the main plan. */
export const crisisActive = (s: GameState) => s.plans.some((x) => x.def !== "main" && ecard(s, x.uid).sidePlan?.crisis);

/** Where an encounter card goes when it leaves play: side-deck cards go back under their deck. */
function toDiscard(s: GameState, uid: string) {
  const def = s.cards[uid];
  const decks = scenarioOf(s).sideDecks ?? {};
  for (const [k, ids] of Object.entries(decks)) {
    if (ids.includes(def) && s.sideDecks?.[k]) { s.sideDecks[k].push(uid); return; }
  }
  s.encounterDiscard.push(uid);
}

/** A new villain stage comes into play: its "when revealed" effects. */
function revealStage(s: GameState) {
  const st = scenarioOf(s).villain.stages[stageList(s)[s.villain.stage]];
  const attach = st.onReveal?.attach;
  if (attach && !s.villain.attachments.some((u) => s.cards[u] === attach)) {
    const uid = takeByDef(s, attach);
    if (uid) { s.villain.attachments.push(uid); log(s, `${st.name} se equipa con ${ecard(s, uid).name}.`); }
  }
  if (st.onReveal?.tough) { s.villain.tough = true; log(s, `${st.name} obtiene Duro: el próximo daño que reciba se anula.`); }
  if (st.revealEffects && s.players.length) runEffects(s, firstAlive(s), st.revealEffects);
}
const firstAlive = (s: GameState) => { const k = s.players.findIndex((p, i) => i >= s.first && !p.eliminated); return k >= 0 ? k : Math.max(0, s.players.findIndex((p) => !p.eliminated)); };

/** Takes a card with this definition out of the encounter deck or discard (searching), if there is one. */
function takeByDef(s: GameState, def: string): string | undefined {
  for (const pile of [s.encounterDeck, s.encounterDiscard]) {
    const k = pile.findIndex((u) => s.cards[u] === def);
    if (k >= 0) return pile.splice(k, 1)[0];
  }
  return undefined;
}

export const mainPlan = (s: GameState) => s.plans.find((p) => p.def === "main")!;
/** The main plan stage in play. */
export function mainPlanDef(s: GameState): MainPlanDef {
  const sc = scenarioOf(s);
  return [sc.mainPlan, ...(sc.nextPlans ?? [])][s.mainStage ?? 0];
}
export const mainPlanStages = (s: GameState) => 1 + (scenarioOf(s).nextPlans?.length ?? 0);
export const planLimit = (s: GameState) => mainPlanDef(s).limitePorJugador * playerCount(s) + (s.planAttached ?? []).reduce((a, x) => a + (pcard(s, x.uid).planLimitBonus ?? 0), 0);

// MARK: Setup

export function newGame(scenarioID: string, heroIDs: string[], seed = Date.now() >>> 0, difficulty: "normal" | "experto" = "normal", opts: SetupOptions = {}): GameState {
  const sc = SCENARIO_BY_ID.get(scenarioID);
  if (!sc) throw new Error(`Escenario desconocido: ${scenarioID}`);
  const s: GameState = {
    version: 1, seed, rngState: seed, scenario: sc.id, difficulty, cards: {}, players: [], active: 0, first: 0, round: 1, phase: "jugadores",
    villain: { stage: 0, damage: 0, stunned: false, attachments: [] }, plans: [], encounterDeck: [], encounterDiscard: [],
    villainQueue: [], prompt: null, log: [], nextUid: 1,
  };
  const mk = (def: string) => { const uid = `c${s.nextUid++}`; s.cards[uid] = def; return uid; };
  for (const id of heroIDs) {
    const h = HERO_BY_ID.get(id);
    if (!h) throw new Error(`Héroe desconocido: ${id}`);
    const deck = shuffle(s, [...h.deck, ...(opts.extraCards?.[id] ?? [])].map(mk));
    const damage = Math.max(0, Math.min(h.vida - 1, opts.startDamage?.[id] ?? 0));
    const p: PlayerState = { hero: h.id, form: "identidad", heroExhausted: false, flippedThisTurn: false, heroAbilityUsed: false, damage, stunned: false, deck, hand: [], discard: [], play: [], engaged: [], eliminated: false };
    if (h.nemesis) p.nemesis = h.nemesis.map(mk);
    if (h.setupToHand) { const k = p.deck.findIndex((u) => s.cards[u] === h.setupToHand); if (k >= 0) p.hand.push(...p.deck.splice(k, 1)); }
    s.players.push(p);
  }
  s.players.forEach((p, i) => drawCards(s, i, handSize(s, i) - p.hand.length));
  s.plans.push({ uid: "main", def: "main", threat: (sc.mainPlan.inicioPorJugador + (opts.startThreat ?? 0)) * s.players.length });
  if (opts.campaign) s.campaign = opts.campaign;
  const sets = difficulty === "experto" ? [...sc.encounterSets, ...(sc.expertSets ?? ["experto"])] : sc.encounterSets;
  const encounter = [...sets.flatMap((set) => ENCOUNTER_SETS[set]), ...(opts.extraEncounter ?? [])].map(mk);
  for (const p of s.players) { const ob = heroOf(p).obligation; if (ob) encounter.push(mk(ob)); }
  s.encounterDeck = shuffle(s, encounter);
  if (sc.sideDecks) s.sideDecks = Object.fromEntries(Object.entries(sc.sideDecks).map(([k, ids]) => [k, shuffle(s, ids.map(mk))]));
  if (sc.setAside) s.setAside = sc.setAside.map(mk);
  for (const id of sc.setupSidePlans ?? []) {
    const uid = takeByDef(s, id);
    if (uid) { s.plans.push({ uid, def: id, threat: ecard(s, uid).sidePlan!.amenaza }); log(s, `En juego desde el inicio: ${ecard(s, uid).name}.`); }
  }
  if (sc.captives) {
    const plan = s.plans.find((x) => s.cards[x.uid] === sc.captives!.plan);
    if (plan) {
      s.captives = { plan: plan.uid, cards: sc.captives.allies.map(mk) };
      log(s, `Bajo ${ecard(s, plan.uid).name} hay aliados capturados: ${s.captives.cards.map((u) => pcard(s, u).name).join(", ")}. Frústralo para rescatarlos.`);
    }
  }
  if (sc.setup) runEffects(s, 0, sc.setup);
  s.prompt = null;
  revealStage(s);
  s.revealed = false;
  log(s, `${sc.villain.name} amenaza Aurelia. ${s.players.map((_, i) => heroOf(s.players[i]).hero.name).join(" y ")} acuden a la llamada.`);
  for (const p of s.players) if (p.damage) log(s, `${heroOf(p).hero.name} arrastra ${p.damage} daño de la misión anterior.`);
  s.villainQueue = [];
  startTurn(s, 0);
  // Heroes that choose a starting card (Soberano: an Oricalco upgrade).
  const tut = s.players.findIndex((p) => heroOf(p).setupTutor);
  if (tut >= 0) { const t = heroOf(s.players[tut]).setupTutor!; runEffects(s, tut, [{ do: "tutor", ...t }], 0, { sourceName: heroOf(s.players[tut]).identity.name }); s.revealed = false; }
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
    s.revealed = true;
  }
}

// MARK: Results

function checkEnd(s: GameState): boolean {
  if (s.result) return true;
  while (mainPlan(s).threat >= planLimit(s)) {
    const done = mainPlanDef(s);
    if ((s.mainStage ?? 0) + 1 >= mainPlanStages(s)) { finish(s, "derrota", `${done.name} se ha completado. ${done.text}`); return true; }
    s.mainStage = (s.mainStage ?? 0) + 1;
    for (const a of s.planAttached ?? []) { s.players[a.owner].discard.push(a.uid); log(s, `${pcard(s, a.uid).name} se descarta con la fase del plan.`); }
    s.planAttached = [];
    const next = mainPlanDef(s);
    mainPlan(s).threat = next.inicioPorJugador * playerCount(s);
    log(s, `¡${done.name} se completa! El plan avanza a su fase ${s.mainStage + 1}: ${next.name} (${mainPlan(s).threat} amenaza, límite ${planLimit(s)}).`);
  }
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
  const guarded = s.players[i].engaged.some((m) => minionStats(s, m).guardia);
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
export const enemyName = (s: GameState, id: string) => (id === "villain" ? villainStats(s).name : minionDef(findMinion(s, id) ?? { uid: id, def: s.cards[id], damage: 0 }).name);

/** Damages an enemy. Returns whether it was defeated and the damage left over beyond what defeated it. */
function damageEnemy(s: GameState, id: string, amount: number): { defeated: boolean; excess: number } {
  const none = { defeated: false, excess: 0 };
  if (amount <= 0) return none;
  if (id === "villain") {
    if (s.villain.tough) {
      s.villain.tough = false;
      log(s, `${villainStats(s).name} es Duro: el golpe no le hace daño (pierde Duro).`);
      return none;
    }
    s.villain.damage += amount;
    const v = villainStats(s);
    log(s, `${v.name} recibe ${amount} daño (${Math.max(0, v.vidaMax - s.villain.damage)} vida restante).`);
    if (s.villain.damage >= v.vidaMax) {
      const sc = scenarioOf(s);
      countDefeat(s);
      if (s.villain.stage + 1 < stageList(s).length) {
        s.villain.stage += 1; s.villain.damage = 0; s.villain.stunned = false; s.villain.confused = false;
        log(s, `¡${v.name} cae, pero se alza de nuevo como ${villainStats(s).name}!`);
        revealStage(s);
      } else finish(s, "victoria", `${sc.villain.name} ha sido derrotado. Aurelia vuelve a ver el sol.`);
      return { defeated: true, excess: 0 };
    }
    return none;
  }
  const ref = refFromID(s, id);
  if (!ref) return none;
  const p = s.players[ref.player!];
  const m = p.engaged.find((x) => x.uid === id)!;
  const def = minionDef(m);
  const vida = minionStats(s, m).vida;
  if (m.tough) { m.tough = false; log(s, `${def.name} es Duro: el golpe no le hace daño (pierde Duro).`); return none; }
  const left = vida - m.damage;
  m.damage += amount;
  if (m.damage >= vida) {
    p.engaged = p.engaged.filter((x) => x.uid !== id);
    const attached = m.attached ?? [];
    discardMinion(s, ref.player!, m);
    log(s, `${def.name} es derrotado.`);
    countDefeat(s);
    for (const a of attached) {
      const fx = pcard(s, a.uid).onHostDefeated;
      if (fx && !s.result) { log(s, `${pcard(s, a.uid).name} se activa al caer ${def.name}.`); runEffects(s, a.owner, fx, 0, { sourceName: pcard(s, a.uid).name }); }
    }
    return { defeated: true, excess: amount - left };
  }
  log(s, `${def.name} recibe ${amount} daño.`);
  return none;
}

/** A defeated or removed minion leaves: Drones go back to their owner's discard. */
function discardMinion(s: GameState, owner: number, m: MinionState) {
  for (const a of m.attached ?? []) s.players[a.owner].discard.push(a.uid);
  m.attached = [];
  if (m.drone) s.players[owner].discard.push(m.uid);
  else toDiscard(s, m.uid);
}

function countDefeat(s: GameState) {
  if (s.phase === "jugadores") { const p = s.players[s.active]; p.defeatedThisTurn = (p.defeatedThisTurn ?? 0) + 1; }
}

/** The status holder behind a target id: villain, a minion, "hero:i" or an ally in play. */
function statusHolder(s: GameState, id: string): { st: Statuses; name: string } | undefined {
  if (id === "villain") return { st: s.villain, name: villainStats(s).name };
  if (id.startsWith("hero:")) { const i = Number(id.slice(5)); return { st: s.players[i], name: heroName(s, i) }; }
  for (const p of s.players) {
    const m = p.engaged.find((x) => x.uid === id);
    if (m) return { st: m, name: minionDef(m).name };
    const c = p.play.find((x) => x.uid === id);
    if (c) return { st: c, name: pcard(s, id).name };
  }
  return undefined;
}

export function giveStatus(s: GameState, id: string, kind: StatusKind) {
  const h = statusHolder(s, id);
  if (!h) return;
  if (h.st[kind]) { log(s, `${h.name} ya está ${STATUS_NAME[kind]}.`); return; }
  h.st[kind] = true;
  log(s, `${h.name} queda ${STATUS_NAME[kind]}.`);
}

function damageHero(s: GameState, i: number, amount: number) {
  if (amount <= 0) return;
  const p = s.players[i];
  if (p.tough) { p.tough = false; log(s, `${heroName(s, i)} es Duro: no recibe daño (pierde Duro).`); return; }
  p.damage += amount;
  const max = heroStats(s, i).vidaMax;
  log(s, `${heroName(s, i)} recibe ${amount} daño (${Math.max(0, max - p.damage)} vida).`);
  if (p.damage >= max) {
    p.eliminated = true;
    for (const m of p.engaged) discardMinion(s, i, m);
    p.engaged = [];
    log(s, `${heroOf(p).hero.name} cae derrotado.`);
  }
}

function damageAlly(s: GameState, i: number, uid: string, amount: number) {
  const p = s.players[i];
  const c = p.play.find((x) => x.uid === uid);
  if (!c || amount <= 0) return;
  const def = pcard(s, uid);
  if (c.tough) { c.tough = false; log(s, `${def.name} es Duro: no recibe daño (pierde Duro).`); return; }
  c.damage += amount;
  if (c.damage >= allyStats(s, c).vida) {
    leavePlay(s, i, uid);
    log(s, `${def.name} cae y vuelve al descarte.`);
  }
}

function thwartPlan(s: GameState, uid: string, amount: number, player = s.active) {
  const plan = s.plans.find((p) => p.uid === uid);
  if (!plan || amount <= 0) return;
  if (plan.def === "main" && crisisActive(s)) { log(s, `Crisis: no puedes retirar amenaza de ${planName(s, plan)} mientras haya un plan con Crisis.`); return; }
  const before = plan.threat;
  plan.threat = Math.max(0, plan.threat - amount);
  const name = planName(s, plan);
  log(s, `Retiras ${amount} amenaza de ${name}.`);
  lastThwart = { plan: uid, cleared: before > 0 && plan.threat === 0 };
  if (plan.def !== "main" && plan.threat === 0) {
    s.plans = s.plans.filter((p) => p !== plan);
    toDiscard(s, plan.uid);
    log(s, `${name} queda frustrado.`);
    if (s.captives?.plan === plan.uid) rescue(s, player);
    // Responses to a side plan being cleared (Olfato de Detective).
    s.players.forEach((q, k) => {
      if (q.form !== "heroe" || q.eliminated) return;
      for (const c of q.play) {
        const fx = pcard(s, c.uid).onSidePlanCleared;
        if (!fx || c.exhausted) continue;
        c.exhausted = true;
        log(s, `${pcard(s, c.uid).name}: ${heroName(s, k)} aprovecha la pista.`);
        runEffects(s, k, fx, 0, { source: c.uid, sourceName: pcard(s, c.uid).name });
      }
    });
  }
}
/** The plan the last thwart hit, and whether that removed its last threat. */
let lastThwart: { plan: string; cleared: boolean } | undefined;

/** Clearing the captives' plan: each captured ally joins this player (in play if there's room, else to the hand). */
function rescue(s: GameState, i: number) {
  const p = s.players[i];
  for (const uid of s.captives?.cards ?? []) {
    const room = allyCount(s, i) < allyLimit(s, i);
    if (room) p.play.push({ uid, def: s.cards[uid], exhausted: false, damage: 0 });
    else p.hand.push(uid);
    (s.rescued ??= []).push({ uid, player: i });
    log(s, `¡${pcard(s, uid).name} es rescatado y se une a ${heroName(s, i)}${room ? "" : " (a tu mano)"}!`);
  }
  s.captives = { plan: "", cards: [] };
}
export const planName = (s: GameState, p: PlanState) => (p.def === "main" ? mainPlanDef(s).name : ecard(s, p.uid).name);

function addThreat(s: GameState, uid: string, amount: number) {
  const plan = s.plans.find((p) => p.uid === uid);
  if (!plan || amount <= 0) return;
  if (plan.def === "main") {
    // Contrainteligencia: discard it to prevent some of that threat.
    for (const [k, q] of s.players.entries()) {
      const c = q.play.find((x) => pcard(s, x.uid).guardMainPlan);
      if (!c) continue;
      const n = Math.min(amount, pcard(s, c.uid).guardMainPlan!);
      leavePlay(s, k, c.uid);
      log(s, `${pcard(s, c.uid).name} evita ${n} amenaza sobre el plan principal (se descarta).`);
      amount -= n;
      break;
    }
    if (amount <= 0) return;
  }
  plan.threat += amount;
  log(s, `${planName(s, plan)} gana ${amount} amenaza.`);
  const sp = plan.def !== "main" ? ecard(s, plan.uid).sidePlan : undefined;
  if (sp?.completeAt && plan.threat >= sp.completeAt * playerCount(s)) {
    s.plans = s.plans.filter((x) => x !== plan);
    (s.setAside ??= []).push(plan.uid);
    log(s, `¡${planName(s, plan)} se completa!`);
    if (sp.onComplete) runEffects(s, firstAlive(s), sp.onComplete);
  }
}

/** A side plan comes into play (with its "when revealed" effects). */
function enterSidePlan(s: GameState, i: number, uid: string) {
  const def = ecard(s, uid);
  s.plans.push({ uid, def: def.id, threat: def.sidePlan!.amenaza });
  const tags = [def.sidePlan?.crisis && "Crisis", def.sidePlan?.peligro && "Peligro", def.sidePlan?.aceleracion && "Aceleración"].filter(Boolean).join(", ");
  log(s, `Entra en juego el plan secundario ${def.name} con ${def.sidePlan!.amenaza} amenaza${tags ? ` (${tags})` : ""}.`);
  if (def.reveal) runEffects(s, i, def.reveal);
}

/** The villain absorbs an environment's material; the previous one is discarded. */
function setEnvironment(s: GameState, uid: string) {
  const old = s.environment;
  if (old) toDiscard(s, old);
  s.environment = uid;
  const d = ecard(s, uid);
  log(s, `${villainStats(s).name} absorbe ${d.name}: ahora es de ${d.environment?.trait ?? "nada"}.`);
}

// MARK: Effects

function optionsFor(s: GameState, i: number, t: Target, ctx?: EffectCtx): { id: string; label: string; detail?: string }[] {
  switch (t) {
    case "chooseEnemy": return enemiesFor(s, i, true).map((r) => ({ id: refID(r), label: enemyName(s, refID(r)), detail: enemyDetail(s, refID(r)) }));
    case "chooseMinion": return enemiesFor(s, i, false).filter((r) => r.kind === "minion").map((r) => ({ id: r.uid!, label: enemyName(s, r.uid!), detail: enemyDetail(s, r.uid!) }));
    case "villain": return [{ id: "villain", label: enemyName(s, "villain") }];
    case "attacker": return ctx?.attacker && (ctx.attacker === "villain" || refFromID(s, ctx.attacker)) ? [{ id: ctx.attacker, label: enemyName(s, ctx.attacker) }] : [];
    case "choosePlan": return s.plans.filter((p) => !(p.def === "main" && crisisActive(s))).map((p) => ({ id: p.uid, label: planName(s, p), detail: `${p.threat} amenaza` }));
    case "mainPlan": return [{ id: "main", label: planName(s, mainPlan(s)) }];
    case "self": return [{ id: `hero:${i}`, label: heroName(s, i) }];
    case "lastTarget": return ctx?.lastTarget && (ctx.lastTarget === "villain" || refFromID(s, ctx.lastTarget)) ? [{ id: ctx.lastTarget, label: enemyName(s, ctx.lastTarget) }] : [];
    case "chooseOtherEnemy": return enemiesFor(s, i, true).filter((r) => refID(r) !== ctx?.lastTarget && !ctx?.hit?.includes(refID(r))).map((r) => ({ id: refID(r), label: enemyName(s, refID(r)), detail: enemyDetail(s, refID(r)) }));
    case "chooseAlly": return s.players[i].play.filter((c) => pcard(s, c.uid).ally).map((c) => ({ id: c.uid, label: pcard(s, c.uid).name }));
    case "thisCard": return ctx?.source && s.players[i].play.some((c) => c.uid === ctx.source) ? [{ id: ctx.source, label: pcard(s, ctx.source).name }] : [];
    case "chooseOtherPlan": return s.plans.filter((p) => p.uid !== ctx?.lastPlan && !(p.def === "main" && crisisActive(s))).map((p) => ({ id: p.uid, label: planName(s, p), detail: `${p.threat} amenaza` }));
    case "chooseHandCard": return s.players[i].hand.map((u) => ({ id: u, label: pcard(s, u).name, detail: pcard(s, u).text }));
    case "choosePlayer": return s.players.map((q, k) => ({ q, k })).filter((x) => !x.q.eliminated).map(({ k }) => ({ id: `hero:${k}`, label: heroName(s, k) }));
    case "bestPlan": {
      const open = s.plans.filter((p) => !(p.def === "main" && crisisActive(s)));
      const clears = open.filter((p) => p.def !== "main" && p.threat <= 3).sort((a, b) => b.threat - a.threat)[0];
      const pick = clears ?? open.find((p) => p.def === "main" && p.threat > 0) ?? open.filter((p) => p.def !== "main").sort((a, b) => b.threat - a.threat)[0];
      return pick ? [{ id: pick.uid, label: planName(s, pick) }] : [];
    }
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
  const m = findMinion(s, id);
  return m ? `${minionStats(s, m).vida - m.damage} vida` : "";
}

/** Runs effects from `index`, pausing with a prompt when a choice is needed. */
/** The effects of each upgrade's first ability, in sequence; the chosen one goes last with its last-step bonus. */
function triggerAllEffects(s: GameState, uids: string[], last: string, bonus: number): Effect[] {
  const order = [...uids.filter((u) => u !== last), last];
  return order.flatMap((u) => {
    const ab = abilitiesOf(pcard(s, u))[0];
    if (u !== last) return ab.effects;
    const extra = ab.lastBonus ?? bonus;
    let done = false;
    return ab.effects.map((e) => {
      if ((done && !ab.lastBonusAll) || !("amount" in e) || typeof e.amount !== "number") return e;
      done = true;
      return { ...e, amount: e.amount + extra } as Effect;
    });
  });
}
const triggerable = (s: GameState, c: CardInPlay, trait: string) => !!pcard(s, c.uid).traits?.includes(trait) && ["action", "special"].includes(abilitiesOf(pcard(s, c.uid))[0]?.timing ?? "");

function runEffects(s: GameState, i: number, effects: Effect[], index = 0, ctx: EffectCtx = {}, source?: string): boolean {
  for (let k = index; k < effects.length; k++) {
    if (s.result) return true;
    const e = effects[k];
    if (e.do === "lookTop") {
      const p = s.players[i];
      if (refillDeck(s, i, e.amount)) return true;
      const top = p.deck.slice(0, e.amount);
      if (!top.length) continue;
      s.revealed = true;
      setPrompt(s, {
        player: i, kind: "target", text: `Miras las ${top.length} primeras cartas de tu mazo: elige una para tu mano (el resto va al descarte).`,
        options: top.map((u) => ({ id: u, label: pcard(s, u).name, detail: pcard(s, u).text })),
        resume: { r: "effects", player: i, effects, index: k, source, ctx },
      });
      return false;
    }
    if (e.do === "recallAlly") {
      const allies = s.players[i].discard.filter((u) => pcard(s, u).ally);
      if (!allies.length) { log(s, "No hay aliados en tu descarte."); continue; }
      setPrompt(s, { player: i, kind: "target", text: "¿Qué aliado de tu descarte vuelve a tu mano?", options: allies.map((u) => ({ id: u, label: pcard(s, u).name, detail: pcard(s, u).text })), resume: { r: "effects", player: i, effects, index: k, source, ctx } });
      return false;
    }
    if (e.do === "reviveAlly") {
      const opts = reviveOptions(s, i, source);
      if (!opts.length) { log(s, "No hay ningún aliado en los descartes que puedas pagar."); continue; }
      setPrompt(s, { player: i, kind: "target", text: "¿Qué aliado de un descarte pones en juego? (pagas su coste con tus cartas menos valiosas)", options: opts.map((u) => ({ id: u, label: `${pcard(s, u).name} (coste ${pcard(s, u).cost})`, detail: pcard(s, u).text })), resume: { r: "effects", player: i, effects, index: k, source, ctx } });
      return false;
    }
    if (e.do === "triggerAll") {
      const ups = s.players[i].play.filter((c) => triggerable(s, c, e.trait));
      if (!ups.length) { log(s, "No tienes mejoras que activar."); continue; }
      if (ups.length === 1) { effects = [...effects.slice(0, k), ...triggerAllEffects(s, ups.map((c) => c.uid), ups[0].uid, e.primaryBonus), ...effects.slice(k + 1)]; k--; continue; }
      setPrompt(s, { player: i, kind: "target", text: "Se activan todas tus mejoras, una tras otra. ¿Cuál resuelves la última? (gana su bonificación)", options: ups.map((c) => ({ id: c.uid, label: pcard(s, c.uid).name, detail: abilitiesOf(pcard(s, c.uid))[0].text })), resume: { r: "effects", player: i, effects, index: k, source, ctx } });
      return false;
    }
    if (e.do === "tutor") {
      const p = s.players[i];
      const fits = (u: string) => (!e.type || pcard(s, u).type === e.type) && (!e.trait || !!pcard(s, u).traits?.includes(e.trait));
      const pool = [...p.deck, ...(e.discard ? p.discard : [])].filter(fits);
      const seen = new Set<string>();
      const opts = pool.filter((u) => !seen.has(s.cards[u]) && seen.add(s.cards[u]));
      s.revealed = true;
      if (!opts.length) { log(s, "No hay ninguna carta así que buscar."); shuffle(s, p.deck); continue; }
      if (opts.length === 1) { applyEffect(s, i, e, opts[0], ctx); continue; }
      setPrompt(s, { player: i, kind: "target", text: "¿Qué carta buscas para tu mano?", options: opts.map((u) => ({ id: u, label: pcard(s, u).name, detail: pcard(s, u).text })), resume: { r: "effects", player: i, effects, index: k, source, ctx } });
      return false;
    }
    if (e.do === "recycle") {
      const p = s.players[i];
      if (ctx.stopRecycle || !p.discard.length) continue;
      setPrompt(s, { player: i, kind: "target", text: "¿Qué carta de tu descarte vuelve a tu mazo?", options: [...p.discard.map((u) => ({ id: u, label: pcard(s, u).name, detail: pcard(s, u).text })), { id: "fin", label: "Ya está" }], resume: { r: "effects", player: i, effects, index: k, source, ctx } });
      return false;
    }
    if (e.do === "scoutEncounter") {
      const top = s.encounterDeck.slice(0, e.amount);
      s.revealed = true;
      const n = top.filter((u) => ecard(s, u).type === "traicion").length;
      log(s, `${ctx.sourceName ?? "Exploración"}: mira ${top.map((u) => ecard(s, u).name).join(", ") || "nada"} · ${n} traición${n === 1 ? "" : "es"}.`);
      effects = [...effects.slice(0, k), ...(n ? [{ do: "thwart", target: "choosePlan", amount: n } as Effect] : []), ...effects.slice(k + 1)];
      k--;
      continue;
    }
    if (e.do === "exhaustAlliesDraw") {
      const ready = s.players[i].play.filter((c) => pcard(s, c.uid).ally && !c.exhausted);
      if (!ready.length) { log(s, "No tienes aliados preparados que agotar."); continue; }
      setPrompt(s, { player: i, kind: "target", text: "¿Qué aliados agotas? (robas 1 carta por cada uno)", options: [
        ...(ready.length > 1 ? [{ id: "all", label: `Todos (${ready.length}): roba ${ready.length}` }] : []),
        ...ready.map((c) => ({ id: c.uid, label: `Solo ${pcard(s, c.uid).name}: roba 1` })),
      ], resume: { r: "effects", player: i, effects, index: k, source, ctx } });
      return false;
    }
    if (e.do === "quinjet") {
      const p = s.players[i];
      const c = p.play.find((x) => x.uid === ctx.source);
      const max = c?.counters ?? 0;
      const opts = allyCount(s, i) < allyLimit(s, i) ? p.hand.filter((u) => pcard(s, u).ally && pcard(s, u).traits?.includes(e.trait) && pcard(s, u).cost <= max) : [];
      if (!opts.length) { log(s, `No tienes en la mano ningún aliado de la Guardia de coste ${max} o menos.`); if (c) c.exhausted = false; continue; }
      setPrompt(s, { player: i, kind: "target", text: `¿Qué aliado traes en ${pcard(s, ctx.source!).name}? (coste ${max} o menos, gratis)`, options: opts.map((u) => ({ id: u, label: `${pcard(s, u).name} (coste ${pcard(s, u).cost})`, detail: pcard(s, u).text })), resume: { r: "effects", player: i, effects, index: k, source, ctx } });
      return false;
    }
    if (e.do === "ifHeroTrait") {
      if (traitCount(s, i, e.trait) > 0 || heroTraits(s, i).includes(e.trait)) { effects = [...effects.slice(0, k), ...e.effects, ...effects.slice(k + 1)]; k--; }
      continue;
    }
    if (e.do === "ifForm") {
      if (s.players[i].form === e.form) { effects = [...effects.slice(0, k), ...e.effects, ...effects.slice(k + 1)]; k--; }
      continue;
    }
    if (e.do === "ifCleared") {
      if (ctx.cleared) { effects = [...effects.slice(0, k), ...e.effects, ...effects.slice(k + 1)]; k--; }
      continue;
    }
    if (e.do === "choose") {
      setPrompt(s, { player: i, kind: "target", text: e.text, options: e.options.map((o, n) => ({ id: String(n), label: o.label })), resume: { r: "effects", player: i, effects, index: k, source, ctx } });
      return false;
    }
    const thwartAll = e.do === "thwart" && !!e.allIfTrait && traitCount(s, i, e.allIfTrait) > 0;
    const needsTarget = "target" in e && e.target && !["eachHero", "allMinions", "allCharacters", "allEnemies", "allAllies"].includes(e.target) && !thwartAll;
    let chosen: string | undefined;
    if (needsTarget) {
      let opts = optionsFor(s, i, (e as { target: Target }).target, ctx);
      if (e.do === "attachSelf") opts = opts.filter((o) => attachAllowed(s, i, source, o.id));
      if (e.do === "readyAlly") opts = opts.filter((o) => s.players[i].play.find((c) => c.uid === o.id)?.exhausted);
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

const targetText = (e: Effect) => (e.do === "damage" ? (e.target === "chooseOtherEnemy" ? "¿A qué otro enemigo?" : "¿A qué enemigo?") : e.do === "status" ? "¿A quién?" : e.do === "thwart" ? "¿De qué plan retiras amenaza?" : e.do === "heal" ? "¿A quién curas?" : "Elige un objetivo");

function applyEffect(s: GameState, i: number, e: Effect, target: string | undefined, ctx: EffectCtx) {
  const p = s.players[i];
  switch (e.do) {
    case "damage": {
      const upgraded = p.play.some((c) => pcard(s, c.uid).type === "mejora");
      const rawAmount = (upgraded && e.ifUpgrade ? e.ifUpgrade : e.amount)
        + (e.plusTrait ? traitCount(s, i, e.plusTrait) : 0)
        + (e.paidBonus && paidHas(ctx, e.paidBonus.res) ? e.paidBonus.amount : 0)
        + (e.traitBonus && traitCount(s, i, e.traitBonus.trait) > 0 ? e.traitBonus.amount : 0)
        + (e.perPaid ? e.perPaid.amount * ((ctx.paid?.[e.perPaid.res] ?? 0) + (e.perPaid.res === "comodin" ? 0 : ctx.paid?.comodin ?? 0)) : 0)
        + (e.perHeld ? e.perHeld.amount * p.hand.reduce((a, u) => a + (resMatches(pcard(s, u).resType, e.perHeld!.res) ? pcard(s, u).resources : 0), 0) : 0)
        + (e.perCounter ? e.perCounter * (p.play.find((c) => c.uid === ctx.source)?.counters ?? 0) : 0)
        + (e.fromStat ? heroStats(s, i)[e.fromStat] : 0)
        + (e.onlyPaidBonus && paidOnly(ctx, e.onlyPaidBonus.res) ? e.onlyPaidBonus.amount : 0);
      const amount = e.max !== undefined ? Math.min(e.max, rawAmount) : rawAmount;
      if (e.target === "allEnemies") {
        damageEnemy(s, "villain", amount);
        for (const q of s.players) for (const m of [...q.engaged]) damageEnemy(s, m.uid, amount);
        break;
      }
      if (e.target === "allAllies") {
        for (const c of [...p.play]) if (pcard(s, c.uid).ally) damageAlly(s, i, c.uid, amount);
        break;
      }
      if (e.target === "allMinions") {
        for (const q of s.players) for (const m of [...q.engaged]) damageEnemy(s, m.uid, amount);
        break;
      }
      if (e.target === "allCharacters") {
        log(s, `¡${amount} daño a todos los personajes!`);
        damageEnemy(s, "villain", amount);
        for (const q of s.players) for (const m of [...q.engaged]) damageEnemy(s, m.uid, amount);
        s.players.forEach((q, qi) => { if (!q.eliminated) damageHero(s, qi, amount); for (const c of [...q.play]) if (pcard(s, c.uid).ally) damageAlly(s, qi, c.uid, amount); });
        break;
      }
      if (!target) break;
      if (e.stun) giveStatus(s, target, "stunned");
      ctx.lastTarget = target;
      (ctx.hit ??= []).push(target);
      const retaliate = ctx.basic && target !== "villain" ? ENCOUNTER_CARDS.get(s.cards[target])?.minion?.retaliate ?? 0 : 0;
      const r = damageEnemy(s, target, amount);
      ctx.killed = r.defeated;
      if (retaliate && !s.result) {
        log(s, `Represalia de ${ENCOUNTER_CARDS.get(s.cards[target])!.name}: ${retaliate} daño a quien le atacó.`);
        if (ctx.basic === "hero") damageHero(s, i, retaliate); else damageAlly(s, i, ctx.basic!, retaliate);
      }
      if (r.excess > 0 && ((e.overkillIfPaid && paidHas(ctx, e.overkillIfPaid)) || ctx.overkill) && target !== "villain" && !s.result) {
        log(s, `Arrollador: ${r.excess} daño sobrante pasa al villano.`);
        damageEnemy(s, "villain", r.excess);
      }
      break;
    }
    case "thwart": {
      const amount = e.amount + (e.paidBonus && paidHas(ctx, e.paidBonus.res) ? e.paidBonus.amount : 0) + (e.bonusIfDefeated && (p.defeatedThisTurn ?? 0) > 0 ? e.bonusIfDefeated : 0)
        + (e.onlyPaidBonus && paidOnly(ctx, e.onlyPaidBonus.res) ? e.onlyPaidBonus.amount : 0);
      if (e.allIfTrait && traitCount(s, i, e.allIfTrait) > 0) { for (const plan of [...s.plans]) thwartPlan(s, plan.uid, amount, i); break; }
      lastThwart = undefined;
      const before = s.plans.find((x) => x.uid === target)?.threat ?? 0;
      thwartPlan(s, target!, amount, i);
      if (e.toSource) {
        const moved = before - (s.plans.find((x) => x.uid === target)?.threat ?? 0);
        const c = p.play.find((x) => x.uid === ctx.source);
        if (c && moved > 0) { c.counters = (c.counters ?? 0) + moved; log(s, `${pcard(s, c.uid).name} guarda ${moved} amenaza (${c.counters}).`); }
      }
      ctx.lastPlan = target;
      const lt = lastThwart as { plan: string; cleared: boolean } | undefined;
      ctx.cleared = !!lt && lt.plan === target && lt.cleared;
      break;
    }
    case "addThreat": addThreat(s, target!, e.amount); break;
    case "heal": {
      if (target?.startsWith("hero:")) { const before = p.damage; p.damage = Math.max(0, p.damage - e.amount); log(s, `${heroName(s, i)} se cura ${before - p.damage}.`); }
      else { const c = p.play.find((x) => x.uid === target); if (c) c.damage = Math.max(0, c.damage - e.amount); }
      break;
    }
    case "draw":
      if (e.each) s.players.forEach((q, k) => { if (!q.eliminated) drawCards(s, k, e.amount); });
      else if (target?.startsWith("hero:")) drawCards(s, Number(target.slice(5)), e.amount);
      else if ((!e.ifPaid || paidHas(ctx, e.ifPaid)) && (!e.ifOnlyPaid || paidOnly(ctx, e.ifOnlyPaid))) drawCards(s, i, e.amount);
      break;
    case "millTake": {
      if (refillDeck(s, i, e.amount)) break;
      const top = p.deck.splice(0, e.amount);
      s.revealed = true;
      const keep = top.filter((u) => pcard(s, u).resType === e.res);
      p.hand.push(...keep);
      p.discard.push(...top.filter((u) => !keep.includes(u)));
      log(s, `${ctx.sourceName ?? "Efecto"}: descarta ${top.map((u) => `${pcard(s, u).name} ${RES_ICON[pcard(s, u).resType]}`).join(", ") || "nada"}${keep.length ? ` y se queda ${keep.map((u) => pcard(s, u).name).join(", ")} (${RES_ICON[e.res]})` : ""}.`);
      s.combo = { n: (s.combo?.n ?? 0) + 1, title: ctx.sourceName ?? "Efecto", cards: top.map((u) => s.cards[u]), text: keep.length ? `${keep.length} con ${RES_ICON[e.res]} a tu mano` : `Ninguna con ${RES_ICON[e.res]}` };
      break;
    }
    case "tempBuff": {
      const bump = (t: { temp?: { fuerza?: number; ingenio?: number } }) => { t.temp = { fuerza: (t.temp?.fuerza ?? 0) + (e.fuerza ?? 0), ingenio: (t.temp?.ingenio ?? 0) + (e.ingenio ?? 0) }; };
      const what = [e.fuerza && `+${e.fuerza} Fuerza`, e.ingenio && `+${e.ingenio} Ingenio`].filter(Boolean).join(" y ");
      if (target?.startsWith("hero:")) {
        const k = Number(target.slice(5));
        const q = s.players[k];
        bump(q);
        for (const c of q.play) if (pcard(s, c.uid).ally) bump(c);
        log(s, `${heroName(s, k)} y sus aliados obtienen ${what} hasta el final de la fase.`);
      } else {
        const c = p.play.find((x) => x.uid === target);
        if (c) { bump(c); log(s, `${pcard(s, c.uid).name} obtiene ${what} hasta el final de la fase.`); }
      }
      break;
    }
    case "readyAlly": {
      const c = p.play.find((x) => x.uid === target);
      if (c) { c.exhausted = false; log(s, `${pcard(s, c.uid).name} se prepara.`); }
      break;
    }
    case "reviveAlly": {
      if (!target) break;
      const owner = s.players.findIndex((q) => q.discard.includes(target));
      if (owner < 0) break;
      const pay = autoPay(s, i, pcard(s, target).cost, "", target) ?? [];
      p.hand = p.hand.filter((u) => !pay.includes(u));
      p.discard.push(...pay);
      s.players[owner].discard = s.players[owner].discard.filter((u) => u !== target);
      p.play.push({ uid: target, def: s.cards[target], exhausted: false, damage: 0, ...(pcard(s, target).uses !== undefined ? { counters: pcard(s, target).uses } : {}) });
      log(s, `${pcard(s, target).name} vuelve al combate con ${heroName(s, i)}${pay.length ? ` (paga con ${pay.map((u) => pcard(s, u).name).join(", ")})` : ""}.`);
      break;
    }
    case "discount": {
      const k = target?.startsWith("hero:") ? Number(target.slice(5)) : i;
      if (e.allyTrait) {
        s.players[k].allyDiscount = { trait: e.allyTrait, amount: (s.players[k].allyDiscount?.amount ?? 0) + e.amount };
        log(s, `El próximo aliado de la Guardia que juegue ${heroName(s, k)} en esta fase cuesta ${e.amount} menos.`);
      } else {
        s.players[k].discount = (s.players[k].discount ?? 0) + e.amount;
        log(s, `La próxima carta que juegue ${heroName(s, k)} en esta fase cuesta ${e.amount} menos.`);
      }
      break;
    }
    case "tutor": {
      if (!target) break;
      const from = p.deck.includes(target) ? "deck" : "discard";
      p[from] = p[from].filter((u) => u !== target);
      p.hand.push(target);
      shuffle(s, p.deck);
      log(s, `${heroName(s, i)} busca ${pcard(s, target).name} y la añade a su mano.`);
      break;
    }
    case "recycle": {
      if (!target) break;
      if (target === "fin") { ctx.stopRecycle = true; break; }
      p.discard = p.discard.filter((u) => u !== target);
      p.deck.push(target);
      shuffle(s, p.deck);
      log(s, `${pcard(s, target).name} vuelve del descarte al mazo.`);
      break;
    }
    case "exhaustAlliesDraw": {
      const ready = p.play.filter((c) => pcard(s, c.uid).ally && !c.exhausted && (target === "all" || c.uid === target));
      for (const c of ready) c.exhausted = true;
      log(s, `${heroName(s, i)} agota ${ready.map((c) => pcard(s, c.uid).name).join(", ")} y roba ${ready.length}.`);
      drawCards(s, i, ready.length);
      break;
    }
    case "quinjet": {
      if (!target || !p.hand.includes(target)) break;
      p.hand = p.hand.filter((u) => u !== target);
      p.play.push({ uid: target, def: s.cards[target], exhausted: false, damage: 0, ...(pcard(s, target).uses !== undefined ? { counters: pcard(s, target).uses } : {}) });
      log(s, `${pcard(s, target).name} llega en ${pcard(s, ctx.source!).name}.`);
      const onPlay = pcard(s, target).onPlay;
      if (ctx.source) leavePlay(s, i, ctx.source);
      if (onPlay) runEffects(s, i, onPlay, 0, { source: target, sourceName: pcard(s, target).name });
      break;
    }
    case "rally": {
      const mine = p.play.filter((c) => pcard(s, c.uid).ally && allyTraits(s, c).includes(e.trait));
      if (heroTraits(s, i).includes(e.trait)) p.heroExhausted = false;
      for (const c of mine) c.exhausted = false;
      s.players.forEach((q, k) => {
        if (heroTraits(s, k).includes(e.trait)) q.temp = { fuerza: (q.temp?.fuerza ?? 0) + 1, ingenio: (q.temp?.ingenio ?? 0) + 1 };
        for (const c of q.play) if (pcard(s, c.uid).ally && allyTraits(s, c).includes(e.trait)) c.temp = { fuerza: (c.temp?.fuerza ?? 0) + 1, ingenio: (c.temp?.ingenio ?? 0) + 1 };
      });
      log(s, `¡La Guardia se reúne! Se preparan ${[heroTraits(s, i).includes(e.trait) ? heroName(s, i) : "", ...mine.map((c) => pcard(s, c.uid).name)].filter(Boolean).join(", ") || "nadie"}, y toda la Guardia obtiene +1 Fuerza y +1 Ingenio esta fase.`);
      break;
    }
    case "nextAttackBonus": {
      p.nextAttack = { bonus: e.amount, overkill: !!e.overkillIfOnly && paidOnly(ctx, e.overkillIfOnly) };
      log(s, `El próximo ataque básico de ${heroName(s, i)} este turno tendrá +${e.amount} Fuerza${p.nextAttack.overkill ? " y arrollará (el daño sobrante pasa al villano)" : ""}.`);
      break;
    }
    case "moveDamage": {
      const n = Math.min(e.amount, p.damage);
      if (!target || !n) { log(s, "No hay daño que trasladar."); break; }
      p.damage -= n;
      log(s, `${heroName(s, i)} traslada ${n} daño a ${enemyName(s, target)}.`);
      ctx.lastTarget = target;
      damageEnemy(s, target, n);
      break;
    }
    case "discardFromHand": {
      if (!target || !p.hand.includes(target)) break;
      p.hand = p.hand.filter((u) => u !== target);
      p.discard.push(target);
      log(s, `${heroName(s, i)} descarta ${pcard(s, target).name}.`);
      break;
    }
    case "ifHeroTrait": case "ifForm": case "ifCleared": case "scoutEncounter": break; // handled by runEffects
    case "spendCounter": {
      const c = ctx.source ? p.play.find((x) => x.uid === ctx.source) : undefined;
      if (!c) break;
      c.counters = Math.max(0, (c.counters ?? 0) - 1);
      if (c.counters === 0) { leavePlay(s, i, c.uid); log(s, `${pcard(s, c.uid).name} se queda sin usos y se descarta.`); }
      break;
    }
    case "gainTrait": {
      if (!p.tempTraits?.includes(e.trait)) (p.tempTraits ??= []).push(e.trait);
      log(s, `${heroName(s, i)} obtiene ${e.trait === "aereo" ? "Aéreo" : e.trait} hasta el final de la fase.`);
      break;
    }
    case "recoverTrait": {
      const k = target?.startsWith("hero:") ? Number(target.slice(5)) : i;
      const q = s.players[k];
      const idx = [...q.discard].reverse().findIndex((u) => pcard(s, u).type === "mejora" && pcard(s, u).traits?.includes(e.trait));
      if (idx < 0) { log(s, "No hay ninguna mejora de ese tipo en el descarte."); break; }
      const uid = q.discard.splice(q.discard.length - 1 - idx, 1)[0];
      q.hand.push(uid);
      log(s, `${pcard(s, uid).name} vuelve del descarte a la mano de ${heroName(s, k)}.`);
      break;
    }
    case "attachSelf": {
      const uid = ctx.source;
      if (!uid || !target) break;
      if (target === "villain") (s.villain.playerAttached ??= []).push({ uid, owner: i });
      else if (target === "main") (s.planAttached ??= []).push({ uid, owner: i });
      else if (target.startsWith("hero:")) { p.play.push({ uid, def: s.cards[uid], exhausted: false, damage: 0 }); log(s, `${pcard(s, uid).name} queda vinculada a ${heroName(s, i)}.`); break; }
      else {
        const m = findMinion(s, target);
        const ally = p.play.find((x) => x.uid === target);
        if (m) (m.attached ??= []).push({ uid, owner: i });
        else if (ally) (ally.attached ??= []).push(uid);
        else break;
      }
      log(s, `${pcard(s, uid).name} queda vinculada a ${target === "main" ? planName(s, mainPlan(s)) : target === "villain" || findMinion(s, target) ? enemyName(s, target) : pcard(s, target).name}.`);
      break;
    }
    case "addCounter": {
      const c = p.play.find((x) => x.uid === ctx.source);
      if (!c) break;
      const n = e.perPaid ? (ctx.paid?.[e.perPaid] ?? 0) + (ctx.paid?.comodin ?? 0) : e.amount;
      c.counters = (c.counters ?? 0) + n;
      log(s, `${pcard(s, c.uid).name} gana ${n} carga${n === 1 ? "" : "s"} (${c.counters} en total).`);
      break;
    }
    case "readyAllies": {
      const allies = p.play.filter((c) => pcard(s, c.uid).ally && c.exhausted);
      for (const c of allies) c.exhausted = false;
      log(s, allies.length ? `Se preparan ${allies.map((c) => pcard(s, c.uid).name).join(", ")}.` : "No hay aliados agotados.");
      break;
    }
    case "buffAlly": {
      const c = p.play.find((x) => x.uid === target);
      if (!c) break;
      c.buff = { fuerza: (c.buff?.fuerza ?? 0) + (e.fuerza ?? 0), ingenio: (c.buff?.ingenio ?? 0) + (e.ingenio ?? 0), vida: (c.buff?.vida ?? 0) + (e.vida ?? 0) };
      log(s, `${pcard(s, c.uid).name} se inspira: ${[e.fuerza && `+${e.fuerza} Fuerza`, e.ingenio && `+${e.ingenio} Ingenio`, e.vida && `+${e.vida} Vida`].filter(Boolean).join(", ")}.`);
      break;
    }
    case "recallAlly": {
      if (!target || !p.discard.includes(target)) break;
      p.discard = p.discard.filter((u) => u !== target);
      p.hand.push(target);
      log(s, `${pcard(s, target).name} vuelve a tu mano.`);
      break;
    }
    case "triggerAll": break; // handled by runEffects / resume
    case "drone": addDrones(s, i, e.amount); break;
    case "discardUpgrade": {
      const ups = p.play.filter((c) => pcard(s, c.uid).type === "mejora").sort((a, b) => pcard(s, b.uid).cost - pcard(s, a.uid).cost);
      if (!ups.length) { log(s, "No tienes mejoras que perder."); break; }
      p.play = p.play.filter((c) => c !== ups[0]);
      p.discard.push(ups[0].uid);
      log(s, `${heroName(s, i)} pierde ${pcard(s, ups[0].uid).name}.`);
      break;
    }
    case "prevent": if (ctx.preventPool) ctx.preventPool.amount += e.amount; break;
    case "stun": if (target) giveStatus(s, target, "stunned"); break;
    case "status": if (target) { giveStatus(s, target, e.status); if (target === "villain" || findMinion(s, target)) ctx.lastTarget = target; } break;
    case "mill": mill(s, i, e, ctx); break;
    case "ifKilled": if (ctx.killed) runEffects(s, i, e.effects, 0, ctx); break;
    case "selfDamage": if (ctx.source) damageAlly(s, i, ctx.source, e.amount); break;
    case "discardSelf": {
      const c = ctx.source && p.play.find((x) => x.uid === ctx.source);
      if (c) { leavePlay(s, i, c.uid); log(s, `${pcard(s, c.uid).name} abandona el combate (descartado).`); }
      break;
    }
    case "readyHero": p.heroExhausted = false; log(s, `${heroName(s, i)} se prepara de nuevo.`); break;
    case "villainActivates": s.villainQueue.unshift({ s: "villainActivates", player: i }); break;
    case "heroDamage":
      if (p.form === "heroe") damageHero(s, i, e.amount);
      else if (e.ifIdentity) addThreat(s, "main", e.ifIdentity.amount);
      break;
    case "surge": surge(s, i); break;
    case "lookTop": {
      const top = p.deck.slice(0, e.amount);
      if (!target || !top.includes(target)) break;
      p.deck = p.deck.slice(top.length);
      p.hand.push(target);
      const rest = top.filter((u) => u !== target);
      p.discard.push(...rest);
      log(s, `${heroName(s, i)} se queda ${pcard(s, target).name}${rest.length ? ` y descarta ${rest.map((u) => pcard(s, u).name).join(", ")}` : ""}.`);
      break;
    }
    case "exhaustHero": p.heroExhausted = true; log(s, `${heroName(s, i)} queda agotado: pierde su próxima acción.`); break;
    case "choose": break; // handled by runEffects / resume
    case "villainTough": {
      if (s.villain.tough) { log(s, `${villainStats(s).name} ya es Duro: oleada.`); surge(s, i); }
      else { s.villain.tough = true; log(s, `${villainStats(s).name} obtiene Duro: el próximo daño que reciba se anula.`); }
      break;
    }
    case "nemesis": {
      const set = p.nemesis ?? [];
      if (!set.length) { log(s, "No hay némesis que traer: oleada."); surge(s, i); break; }
      p.nemesis = [];
      log(s, `¡Aparece el némesis de ${heroOf(p).hero.name}!`);
      for (const uid of set) {
        const d = ecard(s, uid);
        if (d.type === "esbirro") { p.engaged.push({ uid, def: d.id, damage: 0 }); log(s, `${d.name} se enfrenta a ${heroName(s, i)}.`); }
        else if (d.type === "plan") { s.plans.push({ uid, def: d.id, threat: d.sidePlan!.amenaza }); log(s, `Entra en juego ${d.name}.`); }
        else s.encounterDeck.push(uid);
      }
      shuffle(s, s.encounterDeck);
      break;
    }
    case "armPlan": {
      const plan = s.plans.find((x) => x.def !== "main" && s.cards[x.uid] === e.plan);
      if (plan) { addThreat(s, plan.uid, e.amount); break; }
      const uid = takeByDef(s, e.plan);
      if (!uid) { surge(s, i); break; }
      s.plans.push({ uid, def: e.plan, threat: ecard(s, uid).sidePlan!.amenaza });
      log(s, `Entra en juego ${ecard(s, uid).name}.`);
      break;
    }
    case "ifTrait": {
      const has = villainTraits(s).includes(e.trait);
      const fx = has ? e.effects : e.else;
      if (fx) runEffects(s, i, fx, 0, ctx);
      break;
    }
    case "armWeapon": {
      const deck = s.sideDecks?.armas;
      if (!deck?.length) { log(s, "No quedan armas experimentales: oleada."); surge(s, i); break; }
      const uid = deck.shift()!;
      s.villain.attachments.push(uid);
      const d = ecard(s, uid);
      log(s, `🔫 ${villainStats(s).name} se equipa con un arma experimental: ${d.name}.`);
      s.phaseReport?.[s.phaseReport.length - 1]?.cards.push(d.id);
      break;
    }
    case "nextSidePlan": {
      const deck = s.sideDecks?.planes;
      if (e.ifFewer !== undefined && s.plans.filter((x) => x.def !== "main").length >= e.ifFewer) break;
      if (!deck?.length) { log(s, "El mazo de planes secundarios está vacío."); break; }
      const uid = deck.shift()!;
      s.phaseReport?.[s.phaseReport.length - 1]?.cards.push(s.cards[uid]);
      enterSidePlan(s, i, uid);
      break;
    }
    case "spawnTrait": {
      const has = (u: string) => !!ecard(s, u).minion && !!ecard(s, u).traits?.includes(e.trait);
      let found: string | undefined;
      const discarded: string[] = [];
      while (s.encounterDeck.length) {
        const u = s.encounterDeck.shift()!;
        s.revealed = true;
        if (has(u)) { found = u; break; }
        discarded.push(u);
      }
      s.encounterDiscard.push(...discarded);
      if (discarded.length) log(s, `Se descartan ${discarded.map((u) => ecard(s, u).name).join(", ")}.`);
      if (!found) { const k = s.encounterDiscard.findIndex(has); if (k >= 0) found = s.encounterDiscard.splice(k, 1)[0]; }
      if (!found) { log(s, "No aparece ningún esbirro de ese tipo."); break; }
      engageMinion(s, i, found);
      break;
    }
    case "spawn": {
      const k = (s.setAside ?? []).findIndex((u) => s.cards[u] === e.card);
      if (k < 0) { log(s, "Ya está en juego."); break; }
      const uid = s.setAside!.splice(k, 1)[0];
      const d = ecard(s, uid);
      if (d.type === "esbirro") engageMinion(s, i, uid);
      else if (d.type === "plan") enterSidePlan(s, i, uid);
      else s.encounterDiscard.push(uid);
      break;
    }
    case "planCounter": {
      const c = scenarioOf(s).counters;
      s.planCounters = (s.planCounters ?? 0) + e.amount;
      log(s, `El plan principal gana ${e.amount} contador${e.amount === 1 ? "" : "es"} de ${c?.name ?? "plan"} (${s.planCounters}${c ? ` de ${c.threshold}` : ""}).`);
      break;
    }
    case "healVillain": {
      const before = s.villain.damage;
      s.villain.damage = Math.max(0, s.villain.damage - e.amount);
      if (before > s.villain.damage) log(s, `${villainStats(s).name} se recupera ${before - s.villain.damage}.`);
      break;
    }
    case "newEnvironment": {
      const cur = s.environment ? s.cards[s.environment] : undefined;
      const ok = (u: string) => ecard(s, u).type === "entorno" && s.cards[u] !== cur;
      let k = s.encounterDeck.findIndex(ok);
      let uid = k >= 0 ? s.encounterDeck.splice(k, 1)[0] : undefined;
      if (!uid) { k = s.encounterDiscard.findIndex(ok); if (k >= 0) uid = s.encounterDiscard.splice(k, 1)[0]; }
      if (!uid) { log(s, "No hay otro entorno que absorber."); break; }
      s.phaseReport?.[s.phaseReport.length - 1]?.cards.push(s.cards[uid]);
      setEnvironment(s, uid);
      break;
    }
    case "minionsActivate": s.villainQueue.unshift({ s: "minionsActivate", player: i }); break;
    case "detonate": {
      const plan = s.plans.find((x) => x.def !== "main" && s.cards[x.uid] === e.plan);
      if (!plan) { log(s, "No hay nada que detone: oleada."); surge(s, i); break; }
      const dmg = plan.threat;
      s.plans = s.plans.filter((x) => x !== plan);
      toDiscard(s, plan.uid);
      log(s, `¡${ecard(s, plan.uid).name} estalla con ${dmg} de amenaza!`);
      damageHero(s, i, dmg);
      break;
    }
  }
  checkEnd(s);
}

/** The top cards of a player's deck come into play face down as Drones engaged with them. */
function addDrones(s: GameState, i: number, n: number): number {
  const p = s.players[i];
  if (refillDeck(s, i, n)) return 0;
  const cards = p.deck.splice(0, n);
  for (const uid of cards) p.engaged.push({ uid, def: "dron", damage: 0, drone: true });
  if (cards.length) { s.revealed = true; log(s, `${cards.length === 1 ? "Un Dron se enfrenta" : `${cards.length} Drones se enfrentan`} a ${heroName(s, i)} (cartas de su mazo, boca abajo).`); }
  return cards.length;
}

/** Puts the discard under the deck (shuffled) if the deck has fewer than n cards. Returns true if the game ended. */
function refillDeck(s: GameState, i: number, n: number): boolean {
  const p = s.players[i];
  if (p.deck.length >= n || !p.discard.length) return false;
  p.deck.push(...shuffle(s, p.discard.splice(0)));
  s.revealed = true;
  log(s, `${heroOf(p).hero.name} baraja su descarte: el villano aprovecha el respiro (+1 amenaza).`);
  mainPlan(s).threat += 1;
  return checkEnd(s);
}

/** Discard the top cards and read their printed resources (see the "mill" effect). */
function mill(s: GameState, i: number, e: Extract<Effect, { do: "mill" }>, ctx: EffectCtx) {
  const p = s.players[i];
  if (refillDeck(s, i, e.amount)) return;
  const top = p.deck.splice(0, e.amount);
  p.discard.push(...top);
  s.revealed = true;
  const shown = top.map((u) => `${pcard(s, u).name} ${RES_ICON[pcard(s, u).resType].repeat(pcard(s, u).resources)}`);
  log(s, `${ctx.sourceName ?? "Efecto"}: descarta ${shown.join(", ") || "nada"}.`);
  const results: string[] = [];
  if (e.damagePer) {
    const n = top.reduce((a, u) => a + ((e.damagePer!.exact ? pcard(s, u).resType === e.damagePer!.res : resMatches(pcard(s, u).resType, e.damagePer!.res)) ? pcard(s, u).resources : 0), 0);
    const dmg = n * e.damagePer.amount;
    results.push(n ? `${n} ${RES_ICON[e.damagePer.res]} → +${dmg} daño` : `Ningún ${RES_ICON[e.damagePer.res]}: sin daño extra`);
    if (dmg) runEffects(s, i, [{ do: "damage", target: "lastTarget", amount: dmg }], 0, ctx);
  }
  if (e.branches && top.length) {
    const t = pcard(s, top[0]).resType;
    const kinds = (t === "comodin" ? ["fisico", "mental", "energia"] : [t]) as Exclude<ResType, "comodin">[];
    const label: Record<string, string> = { fisico: "✊ +2 daño al objetivo", mental: "🧠 1 daño a todos los personajes", energia: "⚡ se descarta" };
    for (const k of kinds) {
      const branch = e.branches[k];
      if (!branch || s.result) continue;
      results.push(label[k] ?? RES_ICON[k]);
      runEffects(s, i, branch, 0, ctx);
    }
  }
  s.combo = { n: (s.combo?.n ?? 0) + 1, title: ctx.sourceName ?? "Combo", cards: top.map((u) => s.cards[u]), text: results.join(" · ") || "Sin efecto." };
}

function surge(s: GameState, i: number) {
  // Red de Informantes: discard it when a surge resolves.
  for (const [k, q] of s.players.entries()) {
    const c = q.play.find((x) => pcard(s, x.uid).onSurge);
    if (!c) continue;
    const fx = pcard(s, c.uid).onSurge!;
    leavePlay(s, k, c.uid);
    log(s, `${pcard(s, c.uid).name}: la oleada no pilla a ${heroName(s, k)} por sorpresa.`);
    runEffects(s, k, fx);
    break;
  }
  const next = takeEncounter(s);
  if (next) s.villainQueue.unshift({ s: "reveal", player: i, card: next });
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
      const e = r.effects[r.index];
      if (e.do === "triggerAll") {
        const ups = s.players[r.player].play.filter((c) => triggerable(s, c, e.trait)).map((c) => c.uid);
        const rest = [...triggerAllEffects(s, ups, option, e.primaryBonus), ...r.effects.slice(r.index + 1)];
        if (runEffects(s, r.player, rest, 0, r.ctx ?? {}, r.source)) afterEffects(s, r.player, r.source);
        return;
      }
      if (e.do === "choose") {
        const rest = [...e.options[Number(option)].effects, ...r.effects.slice(r.index + 1)];
        if (runEffects(s, r.player, rest, 0, r.ctx ?? {}, r.source)) afterEffects(s, r.player, r.source);
        return;
      }
      applyEffect(s, r.player, e, option, r.ctx ?? {});
      if (runEffects(s, r.player, r.effects, r.index + 1, r.ctx ?? {}, r.source)) afterEffects(s, r.player, r.source);
      return;
    }
    case "defense": return resolveDefense(s, r, option);
    case "interrupts": return resolveInterrupt(s, r, option);
    case "afterAttack": return resolveAfterAttack(s, r, option);
    case "abilityPay": {
      const p = s.players[r.player];
      const { ability, source, name } = abilitySource(s, r.player, r.src);
      let paid: EffectCtx["paid"] = {};
      if (option !== "no" && p.hand.includes(option)) {
        p.hand = p.hand.filter((u) => u !== option);
        p.discard.push(option);
        paid = paidByType(s, [option]);
        log(s, `Paga con ${pcard(s, option).name} (${RES_ICON[pcard(s, option).resType].repeat(pcard(s, option).resources)}).`);
      }
      runEffects(s, r.player, ability.effects, 0, { paid, source, sourceName: name });
      return;
    }
    case "encounter": {
      const p = s.players[r.player];
      const def = ecard(s, r.card);
      if (option.startsWith("ally:")) {
        const c = p.play.find((x) => x.uid === option.slice(5));
        const ab = c && abilitiesOf(pcard(s, c.uid)).find((x) => x.timing === "encounter");
        if (c && ab) {
          if (ab.cost === "exhaust") c.exhausted = true;
          const pay = ab.payFor ? payOne(s, r.player, ab.payFor) : undefined;
          toDiscard(s, r.card);
          log(s, `${pcard(s, c.uid).name} anula ${def.name}${pay ? ` (paga con ${pcard(s, pay).name})` : ""} y se muestra otra carta.`);
          surge(s, r.player);
          return;
        }
      }
      if (option !== "no" && p.hand.includes(option)) {
        const c = pcard(s, option);
        const pay = autoPay(s, r.player, costOf(s, r.player, option), option) ?? [];
        p.hand = p.hand.filter((u) => u !== option && !pay.includes(u));
        p.discard.push(...pay, option);
        s.encounterDiscard.push(r.card);
        log(s, `${heroName(s, r.player)} juega ${c.name}${pay.length ? ` (paga con ${pay.map((u) => pcard(s, u).name).join(", ")})` : ""}: ¡${def.name} no tiene efecto!`);
        return;
      }
      resolveReveal(s, r.player, r.card);
      return;
    }
    case "boost": {
      const p = s.players[r.player];
      let boost = r.boost;
      if (option !== "no" && p.hand.includes(option)) {
        const c = pcard(s, option);
        const pay = autoPay(s, r.player, costOf(s, r.player, option), option) ?? [];
        p.hand = p.hand.filter((u) => u !== option && !pay.includes(u));
        p.discard.push(...pay, option);
        log(s, `${heroName(s, r.player)} juega ${c.name}: anula ${boost} ⭐ de refuerzo y devuelve ${boost} daño al villano.`);
        boost = 0;
        damageEnemy(s, "villain", r.boost);
        if (checkEnd(s)) return;
      }
      villainStrike(s, r.player, r.base, boost);
      return;
    }
    case "villainStep": return;
  }
}

/** After a played card's effects finish: events go to the discard, triggers fire. */
function afterEffects(s: GameState, i: number, source?: string) {
  if (!source) return;
  const p = s.players[i];
  if (source.startsWith("event:")) {
    const uid = source.slice(6);
    if (!isAttached(s, uid)) p.discard.push(uid);
  }
}

/** Allies in any player's discard this player can pay for and bring into play. */
function reviveOptions(s: GameState, i: number, source?: string): string[] {
  if (allyCount(s, i) >= allyLimit(s, i)) return [];
  const self = source?.startsWith("event:") ? source.slice(6) : "";
  return s.players.flatMap((q) => q.discard).filter((u) => pcard(s, u).ally && autoPay(s, i, pcard(s, u).cost, self, u));
}

/** Upgrades that attach: one copy of the same card per ally or enemy. */
function attachAllowed(s: GameState, i: number, source: string | undefined, target: string): boolean {
  const uid = source?.startsWith("event:") ? source.slice(6) : source;
  if (!uid) return true;
  const def = s.cards[uid];
  if (target === "main") return !(s.planAttached ?? []).some((a) => s.cards[a.uid] === def);
  if (target.startsWith("hero:")) return !s.players[Number(target.slice(5))].play.some((c) => c.def === def);
  if (target === "villain" || findMinion(s, target)) return !enemyAttachments(s, target).some((a) => s.cards[a.uid] === def);
  const ally = s.players[i].play.find((c) => c.uid === target);
  return !!ally && !(ally.attached ?? []).some((u) => s.cards[u] === def);
}

// MARK: Player actions

export type Action =
  /** extra: resource sources besides cards in hand: "identity" or the uid of a card in play with a resource ability. */
  | { a: "play"; player: number; card: string; pay: string[]; extra?: string[] }
  | { a: "attack"; player: number }
  | { a: "thwart"; player: number }
  | { a: "recover"; player: number }
  | { a: "allyAttack"; player: number; ally: string }
  | { a: "allyThwart"; player: number; ally: string }
  | { a: "useCard"; player: number; card: string; index?: number }
  | { a: "heroAbility"; player: number }
  | { a: "identityAbility"; player: number }
  | { a: "flip"; player: number }
  | { a: "removeAttachment"; player: number; attachment: string; pay?: string[] }
  | { a: "endTurn"; player: number; discard: string[] };

/** What a player can do right now with a card in hand (for the interface). */
export function canPlay(s: GameState, i: number, uid: string): string | undefined {
  const p = s.players[i];
  const c = pcard(s, uid);
  if (c.type === "recurso") return "Solo sirve para pagar.";
  if (c.play && c.play.timing !== "action") return ({ defend: "Se juega al defenderte.", treachery: "Se juega cuando se revela una traición contra ti.", boost: "Se juega cuando el villano voltea su refuerzo al atacarte.", afterAttack: "Se juega después de que te ataquen." } as Record<string, string>)[c.play.timing] ?? "Ahora no se puede jugar.";
  if (c.play?.heroOnly && p.form !== "heroe") return "Solo en forma de héroe.";
  const first = c.play?.effects[0];
  if (first && "target" in first && first.target === "chooseMinion" && !s.players.some((q) => q.engaged.length)) return "No hay esbirros a los que apuntar.";
  if (c.type === "aliado" && allyCount(s, i) >= allyLimit(s, i)) return `Ya tienes ${allyLimit(s, i)} aliados.`;
  if (c.heroOnly && p.form !== "heroe") return "Solo en forma de héroe.";
  if (c.identityOnly && p.form !== "identidad") return "Solo en tu identidad.";
  if (c.maxInPlay && p.play.filter((x) => x.def === c.id).length >= c.maxInPlay) return `Solo puedes tener ${c.maxInPlay} en juego.`;
  if (c.oncePerRound && p.roundUsed?.includes(c.id)) return "Solo una vez por ronda.";
  if (c.heroTraitRequired && !(heroOf(p).heroTraits ?? []).includes(c.heroTraitRequired)) return "Tu héroe no pertenece a la Guardia de Aurelia.";
  if (c.requiresCharTrait && !controlsTrait(s, i, c.requiresCharTrait)) return "Necesitas controlar un personaje Espía.";
  if (first?.do === "attachSelf") {
    const t = first.target;
    const opts = optionsFor(s, i, t).filter((o) => attachAllowed(s, i, uid, o.id));
    if (!opts.length) return t === "chooseAlly" ? "No tienes aliados sin esta carta." : t === "chooseMinion" ? "No hay esbirros a los que vincularla." : t === "mainPlan" ? "El plan principal ya tiene una." : t === "chooseFriendly" ? "Todos tus personajes ya la tienen." : "No hay enemigos a los que vincularla.";
  }
  if (first?.do === "readyAlly" && !p.play.some((x) => pcard(s, x.uid).ally && x.exhausted)) return "No tienes aliados agotados.";
  const cost = costOf(s, i, uid);
  const available = p.hand.filter((u) => u !== uid).reduce((a, u) => a + payValue(s, u, uid), 0) + resourceSources(s, i).filter((x) => !c.payOnly || resMatches(x.res, c.payOnly)).reduce((a, x) => a + x.amount, 0);
  if (available < cost) return `Necesitas ${cost} recursos.`;
  if (first?.do === "reviveAlly" && !reviveOptions(s, i, `event:${uid}`).length) return "No hay ningún aliado en los descartes que puedas pagar.";
  return undefined;
}

/** Resources a player can generate besides discarding cards: the identity's once-per-round resource and ready cards with a resource ability. */
export function resourceSources(s: GameState, i: number): { id: string; label: string; res: ResType; amount: number }[] {
  const p = s.players[i];
  const out: { id: string; label: string; res: ResType; amount: number }[] = [];
  const ir = heroOf(p).identityResource;
  if (ir && p.form === "identidad" && !p.identityResUsed) out.push({ id: "identity", label: heroOf(p).identity.name, res: ir.res, amount: ir.amount });
  for (const c of p.play) {
    const r = pcard(s, c.uid).resourceAbility;
    if (!r || c.exhausted || (r.heroOnly && p.form !== "heroe") || (r.identityOnly && p.form !== "identidad")) continue;
    if (r.fromDiscardTop) {
      const top = p.discard[p.discard.length - 1];
      if (top && pcard(s, top).resources > 0) out.push({ id: c.uid, label: `${pcard(s, c.uid).name} (${pcard(s, top).name})`, res: pcard(s, top).resType, amount: pcard(s, top).resources });
    } else out.push({ id: c.uid, label: pcard(s, c.uid).name, res: r.res, amount: r.amount });
  }
  return out;
}

export const resourcesOf = (s: GameState, uids: string[], forUid?: string) => uids.reduce((a, u) => a + payValue(s, u, forUid), 0);
/** Resources paid, by printed type. */
export function paidByType(s: GameState, uids: string[], forUid?: string): Partial<Record<ResType, number>> {
  const out: Partial<Record<ResType, number>> = {};
  for (const u of uids) { const c = pcard(s, u); out[c.resType] = (out[c.resType] ?? 0) + payValue(s, u, forUid); }
  return out;
}
const paidHas = (ctx: EffectCtx, res: ResType) => (ctx.paid?.[res] ?? 0) > 0 || (ctx.paid?.comodin ?? 0) > 0;

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
      const sources = resourceSources(s, i).filter((r) => x.extra?.includes(r.id));
      if ((x.extra?.length ?? 0) !== sources.length) return "Esa fuente de recursos no está disponible.";
      const cost = costOf(s, i, x.card);
      if (c.payOnly && (x.pay.some((u) => !resMatches(pcard(s, u).resType, c.payOnly!)) || sources.some((r) => !resMatches(r.res, c.payOnly!)))) return `Solo puedes pagarla con ${RES_ICON[c.payOnly]}.`;
      if (p.form !== "heroe" && x.pay.some((u) => pcard(s, u).heroFormOnly)) return `${pcard(s, x.pay.find((u) => pcard(s, u).heroFormOnly)!).name} solo se gasta en forma de héroe.`;
      if (resourcesOf(s, x.pay, x.card) + sources.reduce((a, r) => a + r.amount, 0) < cost) return `Faltan recursos: necesitas ${cost}.`;
      if (p.discount) { log(s, `Descuento: ${c.name} cuesta ${p.discount} menos.`); p.discount = 0; }
      if (p.allyDiscount && c.ally && c.traits?.includes(p.allyDiscount.trait)) { log(s, `Descuento: ${c.name} cuesta ${p.allyDiscount.amount} menos.`); p.allyDiscount = undefined; }
      if (c.oncePerRound) (p.roundUsed ??= []).push(c.id);
      const paid = paidByType(s, x.pay, x.card);
      for (const r of sources) {
        paid[r.res] = (paid[r.res] ?? 0) + r.amount;
        if (r.id === "identity") p.identityResUsed = true;
        else {
          const src = p.play.find((y) => y.uid === r.id)!;
          src.exhausted = true;
          if (src.counters !== undefined) {
            src.counters -= 1;
            if (src.counters <= 0) { p.play = p.play.filter((y) => y !== src); p.discard.push(src.uid); log(s, `${pcard(s, src.uid).name} se queda sin usos y se descarta.`); }
          }
        }
      }
      p.hand = p.hand.filter((u) => u !== x.card && !x.pay.includes(u));
      p.discard.push(...x.pay);
      const paidText = (Object.entries(paid) as [ResType, number][]).map(([k, n]) => RES_ICON[k].repeat(n)).join("");
      log(s, `${heroName(s, i)} juega ${c.name}${paidText ? ` (paga ${paidText})` : ""}.`);
      if (c.play) {
        if (runEffects(s, i, c.play.effects, 0, { paid, source: x.card, sourceName: c.name }, `event:${x.card}`)) afterEffects(s, i, `event:${x.card}`);
        return;
      }
      p.play.push({ uid: x.card, def: c.id, exhausted: false, damage: 0, ...(c.uses !== undefined ? { counters: c.uses } : {}) });
      if (c.onPlay) runEffects(s, i, c.onPlay, 0, { paid, source: x.card, sourceName: c.name });
      if (c.type === "mejora" && !s.prompt) triggerAfterUpgrade(s, i);
      return;
    }
    case "attack": case "thwart": {
      if (p.form !== "heroe") return "Solo en forma de héroe.";
      if (p.heroExhausted) return `${heroLabel} está agotado.`;
      const st = heroStats(s, i);
      p.heroExhausted = true;
      if (x.a === "attack" && p.stunned) { p.stunned = false; log(s, `${heroLabel} está Aturdido: su ataque se cancela (pierde Aturdido).`); return; }
      if (x.a === "thwart" && p.confused) { p.confused = false; log(s, `${heroLabel} está Confundido: no contiene nada (pierde Confundido).`); return; }
      if (x.a === "attack") {
        const extra = p.nextAttack;
        p.nextAttack = undefined;
        log(s, `${heroLabel} ataca${extra ? ` con +${extra.bonus} de Fuerza` : ""}.`);
        runEffects(s, i, [{ do: "damage", target: "chooseEnemy", amount: st.fuerza + (extra?.bonus ?? 0) }], 0, { basic: "hero", overkill: extra?.overkill });
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
      p.damage = Math.max(0, p.damage - heroStats(s, i).recuperacion);
      log(s, `${heroName(s, i)} descansa y recupera ${before - p.damage} vida.`);
      return;
    }
    case "allyAttack": case "allyThwart": {
      const c = p.play.find((y) => y.uid === x.ally);
      const def = c && pcard(s, c.uid);
      if (!c || !def?.ally) return "Ese aliado no está en juego.";
      if (c.exhausted) return `${def.name} está agotado.`;
      const attack = x.a === "allyAttack";
      if (attack && def.ally.attackDiscard) {
        const u = cheapest(s, i);
        if (!u) return `Para que ${def.name} ataque, descarta una carta de tu mano.`;
        p.hand = p.hand.filter((y) => y !== u);
        p.discard.push(u);
        log(s, `${def.name} exige un precio: descartas ${pcard(s, u).name}.`);
      }
      c.exhausted = true;
      if (attack && c.stunned) { c.stunned = false; log(s, `${def.name} está Aturdido: su ataque se cancela (pierde Aturdido).`); return; }
      if (!attack && c.confused) { c.confused = false; log(s, `${def.name} está Confundido: no contiene nada (pierde Confundido).`); return; }
      log(s, `${def.name} ${attack ? "ataca" : "contiene el plan"}.`);
      const a = def.ally;
      const st = allyStats(s, c);
      const effects: Effect[] = attack
        ? [{ do: "damage", target: "chooseEnemy", amount: st.fuerza }, { do: "selfDamage", amount: a.consFuerza }, ...(a.onKill ? [{ do: "ifKilled" as const, effects: a.onKill }] : []), ...(a.onAttack ?? [])]
        : [{ do: "thwart", target: "choosePlan", amount: st.ingenio }, { do: "selfDamage", amount: a.consIngenio }, ...(a.onThwart ?? [])];
      runEffects(s, i, effects, 0, { source: c.uid, sourceName: def.name, ...(attack ? { basic: c.uid } : {}) });
      return;
    }
    case "useCard": {
      const c = p.play.find((y) => y.uid === x.card);
      const def = c && pcard(s, c.uid);
      const ab = def && abilitiesOf(def)[x.index ?? 0];
      if (!c || !def || !ab || ab.timing !== "action") return "Esa carta no tiene una acción.";
      if (ab.heroOnly && p.form !== "heroe") return "Solo en forma de héroe.";
      if (ab.identityOnly && p.form !== "identidad") return "Solo en forma de identidad.";
      if (ab.cost === "exhaust" && c.exhausted) return `${def.name} está agotada.`;
      if (ab.cost === "once" && c.usedThisRound) return "Ya la usaste esta ronda.";
      const err = checkAbilityPay(s, i, ab);
      if (err) return err;
      if (ab.cost === "exhaust") c.exhausted = true; else if (ab.cost === "once") c.usedThisRound = true;
      log(s, `${heroName(s, i)} usa ${def.name}${abilitiesOf(def).length > 1 ? ` (${ab.text})` : ""}.`);
      useAbility(s, i, ab, `${c.uid}#${x.index ?? 0}`, c.uid, def.name);
      return;
    }
    case "heroAbility": case "identityAbility": {
      const hero = x.a === "heroAbility";
      const ab = hero ? heroOf(p).ability : heroOf(p).identityAbility;
      if (!ab || ab.timing !== "action") return hero ? "Esta habilidad se activa sola." : "Esta identidad no tiene una acción propia.";
      if (hero && p.form !== "heroe") return "Solo en forma de héroe.";
      if (!hero && p.form !== "identidad") return "Solo en forma de identidad.";
      if (hero ? p.heroAbilityUsed : p.identityAbilityUsed) return "Ya la usaste esta ronda.";
      const err = checkAbilityPay(s, i, ab);
      if (err) return err;
      if (hero) p.heroAbilityUsed = true; else p.identityAbilityUsed = true;
      log(s, `${heroName(s, i)}: ${ab.text}.`);
      useAbility(s, i, ab, hero ? "hero" : "identity", undefined, ab.text);
      return;
    }
    case "flip": {
      if (p.flippedThisTurn) return "Solo puedes cambiar de forma una vez por turno.";
      p.form = p.form === "heroe" ? "identidad" : "heroe";
      p.flippedThisTurn = true;
      for (const c of [...p.play]) if (pcard(s, c.uid).discardOnFlip) { leavePlay(s, i, c.uid); log(s, `${pcard(s, c.uid).name} se apaga al cambiar de forma.`); }
      log(s, p.form === "heroe" ? `${heroOf(p).identity.name} se transforma en ${heroLabel}.` : `${heroLabel} vuelve a ser ${heroOf(p).identity.name}.`);
      const punish = currentStage(s).flipPunish ?? 0;
      if (p.form === "heroe" && punish) {
        log(s, `Reflejos fotográficos: ${villainStats(s).name} ya conocía ese movimiento y castiga la transformación.`);
        damageHero(s, i, punish);
      }
      return;
    }
    case "removeAttachment": {
      if (p.form !== "heroe") return "Solo en forma de héroe.";
      if (!s.villain.attachments.includes(x.attachment)) return "Ese vínculo ya no está.";
      const rm = ecard(s, x.attachment).removal;
      if (rm) {
        const pay = x.pay ?? [];
        if (pay.some((u) => !p.hand.includes(u))) return "Pago no válido.";
        const got = pay.reduce((a, u) => a + (resMatches(pcard(s, u).resType, rm.res) ? pcard(s, u).resources : 0), 0);
        if (got < rm.cost) return `Necesitas ${rm.cost} ${RES_ICON[rm.res]} para quitarla.`;
        p.hand = p.hand.filter((u) => !pay.includes(u));
        p.discard.push(...pay);
        log(s, `${heroLabel} gasta ${RES_ICON[rm.res].repeat(rm.cost)} y desactiva ${ecard(s, x.attachment).name}.`);
      } else {
        if (p.heroExhausted) return `${heroLabel} está agotado.`;
        p.heroExhausted = true;
        log(s, `${heroLabel} arranca ${ecard(s, x.attachment).name} al villano.`);
      }
      s.villain.attachments = s.villain.attachments.filter((u) => u !== x.attachment);
      toDiscard(s, x.attachment);
      return;
    }
    case "endTurn": {
      if (x.discard.some((u) => !p.hand.includes(u))) return "Solo puedes descartar cartas de tu mano.";
      p.hand = p.hand.filter((u) => !x.discard.includes(u));
      p.discard.push(...x.discard);
      if (p.form === "heroe" && heroOf(p).hero.discardHandAtEnd && p.hand.length) {
        log(s, `${heroLabel} descarta su mano entera (${p.hand.length} cartas) por su furia.`);
        p.discard.push(...p.hand.splice(0));
      }
      const need = handSize(s, i) - p.hand.length;
      if (need > 0) drawCards(s, i, need);
      p.heroExhausted = false; p.flippedThisTurn = false; p.defeatedThisTurn = 0; p.nextAttack = undefined;
      for (const c of p.play) c.exhausted = false;
      log(s, `${heroName(s, i)} termina su turno.`);
      nextTurn(s);
      return;
    }
  }
}

/** The ability behind an "abilityPay" source id. */
function abilitySource(s: GameState, i: number, src: string): { ability: Ability; source?: string; name: string } {
  const h = heroOf(s.players[i]);
  if (src === "hero") return { ability: h.ability!, name: h.ability!.text };
  if (src === "identity") return { ability: h.identityAbility!, name: h.identityAbility!.text };
  const [uid, idx] = src.split("#");
  const def = pcard(s, uid);
  return { ability: abilitiesOf(def)[Number(idx)], source: uid, name: def.name };
}

function checkAbilityPay(s: GameState, i: number, ab: Ability): string | undefined {
  const want = ab.payFor;
  if (!want || !ab.payRequired) return undefined;
  const has = s.players[i].hand.some((u) => payMatch(pcard(s, u).resType, want));
  return has ? undefined : want === "any" ? "Necesitas una carta en la mano que descartar." : `Necesitas descartar una carta con ${RES_ICON[want]} ${RES_NAME[want]}.`;
}

/** Runs an ability, first asking for its resource payment if it has one. */
function useAbility(s: GameState, i: number, ab: Ability, src: string, source: string | undefined, name: string) {
  const want = ab.payFor;
  const payWith = want ? s.players[i].hand.filter((u) => payMatch(pcard(s, u).resType, want)) : [];
  if (want && payWith.length) {
    setPrompt(s, {
      player: i, kind: "optional",
      text: `${name}: ${ab.payRequired ? "descarta" : "¿descartas"} ${want === "any" ? "una carta de tu mano" : `una carta con ${RES_ICON[want]} ${RES_NAME[want]}`} para pagar${ab.payRequired ? "." : "?"}`,
      options: [
        ...payWith.map((u) => ({ id: u, label: `${pcard(s, u).name} ${RES_ICON[pcard(s, u).resType].repeat(pcard(s, u).resources)}`, detail: pcard(s, u).text })),
        ...(ab.payRequired ? [] : [{ id: "no", label: "No pagar" }]),
      ],
      resume: { r: "abilityPay", player: i, src },
    });
    return;
  }
  runEffects(s, i, ab.effects, 0, { source, sourceName: name });
}

function triggerAfterUpgrade(s: GameState, i: number) {
  const p = s.players[i];
  const ab = heroOf(p).ability;
  if (!ab || ab.timing !== "afterUpgrade" || p.heroAbilityUsed || p.form !== "heroe") return;
  p.heroAbilityUsed = true;
  log(s, `${heroOf(p).hero.name}: ${ab.text}.`);
  runEffects(s, i, ab.effects);
}

/** The start of a player's turn: cards that gain a counter (Esquife Veloz). */
function startTurn(s: GameState, i: number) {
  for (const c of s.players[i].play) {
    if (!pcard(s, c.uid).turnStartCounter) continue;
    c.counters = (c.counters ?? 0) + 1;
    log(s, `${pcard(s, c.uid).name} gana un contador (${c.counters}).`);
  }
}

/** The card a player loses most cheaply (resource cards first, then the lowest cost). */
function cheapest(s: GameState, i: number): string | undefined {
  return [...s.players[i].hand].sort((a, b) => (pcard(s, a).type === "recurso" ? -1 : 0) - (pcard(s, b).type === "recurso" ? -1 : 0) || pcard(s, a).cost - pcard(s, b).cost)[0];
}

function nextTurn(s: GameState) {
  const n = s.players.length;
  for (let k = 1; k <= n; k++) {
    const next = (s.active + k) % n;
    if (next === s.first) break;
    if (!s.players[next].eliminated) { s.active = next; log(s, `Turno de ${heroName(s, next)}.`); startTurn(s, next); return; }
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
  // "Until the end of the phase" bonuses and discounts end with the players' phase.
  for (const p of s.players) { p.temp = undefined; p.discount = undefined; p.allyDiscount = undefined; p.tempTraits = undefined; for (const c of p.play) c.temp = undefined; }
  s.phaseReport = [];
  s.reportRound = s.round;
  log(s, `Fase del villano (ronda ${s.round}).`);
  const q: VillainStep[] = [{ s: "accelerate" }];
  for (const i of order(s)) q.push({ s: "villainActivates", player: i }, { s: "minionsActivate", player: i });
  q.push({ s: "deal" });
  if (scenarioOf(s).counters) q.push({ s: "counters" });
  q.push({ s: "endRound" });
  // Anything queued during the players' turns (a surge from a stage revealed mid-turn…) resolves first.
  s.villainQueue = [q[0], ...s.villainQueue, ...q.slice(1)];
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
      report(s, 1, "Paso 1 · La amenaza avanza");
      const base = mainPlanDef(s).aceleracionPorJugador * playerCount(s);
      const accel = s.plans.filter((p) => p.def !== "main" && ecard(s, p.uid).sidePlan?.aceleracion);
      log(s, `Base: +${base} amenaza${accel.length ? ` · Aceleración: +${accel.length} (${accel.map((x) => ecard(s, x.uid).name).join(", ")})` : ""} → +${base + accel.length} en total.`);
      addThreat(s, "main", base + accel.length);
      for (const x of [...s.plans]) { const g = x.def !== "main" ? ecard(s, x.uid).sidePlan?.grows : 0; if (g) addThreat(s, x.uid, g * playerCount(s)); }
      const ps = scenarioOf(s).phaseStart;
      if (ps && !s.result) runEffects(s, firstAlive(s), ps);
      return;
    }
    case "counters": {
      const c = scenarioOf(s).counters;
      if (!c) return;
      report(s, 3, `Paso 4 · Contadores de ${c.name}`);
      s.planCounters = (s.planCounters ?? 0) + c.perRound;
      log(s, `El plan principal gana ${c.perRound} contador${c.perRound === 1 ? "" : "es"} de ${c.name}: ${s.planCounters} de ${c.threshold}.`);
      if (s.planCounters >= c.threshold) {
        s.planCounters -= c.threshold;
        log(s, `¡${c.threshold} contadores de ${c.name}! ${c.text}`);
        runEffects(s, firstAlive(s), c.effects);
      }
      return;
    }
    case "villainActivates": {
      const p = s.players[st.player];
      if (p.eliminated) return;
      const attacking = p.form === "heroe";
      const v0 = villainStats(s);
      report(s, 2, `Paso 2 · ${v0.name} ${attacking ? "ataca a" : "trama contra"} ${heroName(s, st.player)}`);
      log(s, attacking ? `${heroName(s, st.player)} está en forma de héroe: el villano ataca.` : `${heroName(s, st.player)} está en su identidad: el villano trama.`);
      if (attacking && s.villain.stunned) { s.villain.stunned = false; log(s, `💫 ${v0.name} está Aturdido: su ataque se cancela (pierde Aturdido).`); return; }
      if (attacking && springSnare(s, "villain")) return;
      if (!attacking && s.villain.confused) { s.villain.confused = false; log(s, `🌀 ${v0.name} está Confundido: no trama (pierde Confundido).`); return; }
      const stage = currentStage(s);
      if (attacking && stage.dronesOnAttack) addDrones(s, st.player, stage.dronesOnAttack);
      if (attacking) {
        const ab = heroOf(p).ability;
        if (ab?.timing === "villainAttack") { log(s, `${heroName(s, st.player)}: ${ab.text}.`); runEffects(s, st.player, ab.effects); }
      }
      let boost = 0;
      const n = stage.boosts ?? 1;
      for (let k = 0; k < n; k++) {
        const card = takeEncounter(s);
        if (!card) continue;
        const d = ecard(s, card);
        s.encounterDiscard.push(card);
        s.phaseReport?.[s.phaseReport.length - 1]?.cards.push(d.id);
        boost += d.boost;
        log(s, `Carta de refuerzo${n > 1 ? ` ${k + 1} de ${n}` : ""}: ${d.name} · ${d.boost ? "⭐".repeat(d.boost) : "sin iconos"}.`);
        if (d.boostEffect) { log(s, `⚡ Refuerzo: ${d.boostText ?? ""}`); runEffects(s, st.player, d.boostEffect); }
      }
      if (s.result) return;
      const v = villainStats(s);
      if (attacking) {
        const drones = p.engaged.filter((m) => m.drone).length * (stage.fuerzaPorDron ?? 0);
        const base = v.fuerza + drones;
        log(s, `Fuerza ${v.fuerza}${drones ? ` + ${drones} por drones` : ""} + ${boost} ⭐ = ${base + boost} de daño.`);
        const cancels = boost > 0 ? p.hand.filter((u) => pcard(s, u).play?.timing === "boost" && autoPay(s, st.player, costOf(s, st.player, u), u)) : [];
        if (cancels.length) {
          setPrompt(s, {
            player: st.player, kind: "optional", text: `El refuerzo suma ${boost} ⭐ al ataque. ¿Lo anulas? (se paga solo con tus cartas menos valiosas)`,
            options: [...cancels.map((u) => ({ id: u, label: pcard(s, u).name, detail: pcard(s, u).text })), { id: "no", label: "No" }],
            resume: { r: "boost", player: st.player, base, boost },
          });
          return;
        }
        villainStrike(s, st.player, base, boost);
      } else {
        log(s, `Plan ${v.plan} + ${boost} ⭐ = +${v.plan + boost} amenaza al plan principal.`);
        addThreat(s, "main", v.plan + boost);
        const env = environmentDef(s);
        if (env?.environment?.afterScheme && !s.result) { log(s, `${env.name}: ${env.environment.trait}.`); runEffects(s, st.player, env.environment.afterScheme); }
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
      const ord = order(s);
      const hazards = s.plans.filter((x) => x.def !== "main" && ecard(s, x.uid).sidePlan?.peligro).length;
      const tail = s.villainQueue.findIndex((x) => x.s === "endRound" || x.s === "counters");
      const at = tail >= 0 ? tail : s.villainQueue.length;
      const dealt: VillainStep[] = [];
      for (let k = 0; k < ord.length + hazards; k++) {
        const c = takeEncounter(s);
        if (c) dealt.push({ s: "reveal", player: ord[k % ord.length], card: c });
      }
      if (hazards) log(s, `Peligro: se reparte${hazards > 1 ? "n" : ""} ${hazards} carta${hazards > 1 ? "s" : ""} de encuentro más.`);
      s.villainQueue.splice(at, 0, ...dealt);
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
      s.players.forEach((p, k) => {
        for (const c of [...p.play]) if (pcard(s, c.uid).temporary) { leavePlay(s, k, c.uid); log(s, `${pcard(s, c.uid).name} se retira al final de la ronda.`); }
      });
      for (const p of s.players) { p.heroAbilityUsed = false; p.identityAbilityUsed = false; p.identityResUsed = false; for (const c of p.play) c.usedThisRound = false; }
      log(s, `Ronda ${s.round}. Empieza ${heroName(s, s.active)}.`);
      for (const p of s.players) p.roundUsed = undefined;
      startTurn(s, s.active);
      return;
    }
  }
}

/** The villain's attack goes ahead with this boost. */
function villainStrike(s: GameState, i: number, base: number, boost: number) {
  attack(s, i, "villain", base, boost);
}

/** Pays one resource of this type from hand (resource cards first). Returns the card used. */
function payOne(s: GameState, i: number, res: ResType | "any"): string | undefined {
  const p = s.players[i];
  const pool = p.hand.filter((u) => payMatch(pcard(s, u).resType, res)).sort((a, b) => (pcard(s, a).type === "recurso" ? -1 : 0) - (pcard(s, b).type === "recurso" ? -1 : 0) || pcard(s, a).cost - pcard(s, b).cost);
  const u = pool[0];
  if (!u) return undefined;
  p.hand = p.hand.filter((x) => x !== u);
  p.discard.push(u);
  return u;
}
const canPayOne = (s: GameState, i: number, res: ResType | "any") => s.players[i].hand.some((u) => payMatch(pcard(s, u).resType, res));

function activateMinion(s: GameState, i: number, uid: string) {
  const p = s.players[i];
  const m = p.engaged.find((x) => x.uid === uid);
  if (!m || p.eliminated) return;
  const def = minionDef(m);
  const st = minionStats(s, m);
  if (p.form === "heroe") {
    report(s, 2, `Paso 2 · ${def.name} ataca a ${heroName(s, i)}`);
    if (m.stunned) { m.stunned = false; log(s, `💫 ${def.name} está Aturdido: su ataque se cancela (pierde Aturdido).`); return; }
    if (springSnare(s, uid)) return;
    log(s, `Fuerza ${st.fuerza} (los esbirros no reciben refuerzo).`);
    attack(s, i, uid, st.fuerza, 0);
  } else if (st.plan > 0) {
    report(s, 2, `Paso 2 · ${def.name} trama contra ${heroName(s, i)}`);
    if (m.confused) { m.confused = false; log(s, `🌀 ${def.name} está Confundido: no trama (pierde Confundido).`); return; }
    log(s, `Plan ${st.plan} → +${st.plan} amenaza.`);
    addThreat(s, "main", st.plan);
  }
}

/** A minion engages a player (with its starting statuses and "when revealed" effects). */
function engageMinion(s: GameState, i: number, uid: string) {
  const def = ecard(s, uid);
  const p = s.players[i];
  const m: MinionState = { uid, def: def.id, damage: 0 };
  for (const k of def.startStatus ?? []) m[k] = true;
  p.engaged.push(m);
  log(s, `${def.name} se enfrenta a ${heroName(s, i)} (⚔${def.minion!.fuerza} ☾${def.minion!.plan} ♥${def.minion!.vida}${def.startStatus?.length ? `, ${def.startStatus.map((k) => STATUS_NAME[k]).join(", ")}` : ""}).`);
  if (def.reveal) runEffects(s, i, def.reveal);
  // Allies that react to a minion entering play (each spends a counter).
  s.players.forEach((q, k) => {
    for (const c of q.play) {
      const fx = pcard(s, c.uid).ally?.onMinionEnters;
      if (!fx || !c.counters || s.result || !findMinion(s, uid)) continue;
      c.counters -= 1;
      log(s, `${pcard(s, c.uid).name} reacciona (${c.counters} contador${c.counters === 1 ? "" : "es"} restante${c.counters === 1 ? "" : "s"}).`);
      runEffects(s, k, fx, 0, { lastTarget: uid, source: c.uid, sourceName: pcard(s, c.uid).name });
    }
  });
}

/** An enemy with a snare attached would attack: the snare is discarded and the enemy stunned instead. */
function springSnare(s: GameState, id: string): boolean {
  const list = id === "villain" ? s.villain.playerAttached : findMinion(s, id)?.attached;
  const k = list?.findIndex((a) => pcard(s, a.uid).snare) ?? -1;
  if (!list || k < 0) return false;
  const [a] = list.splice(k, 1);
  s.players[a.owner].discard.push(a.uid);
  log(s, `🕸 ${pcard(s, a.uid).name} atrapa a ${enemyName(s, id)}: no ataca y queda Aturdido.`);
  giveStatus(s, id, "stunned");
  return true;
}

function reveal(s: GameState, i: number, uid: string) {
  const def = ecard(s, uid);
  report(s, 3, `Paso 3 · Encuentro para ${heroName(s, i)}: ${def.name}`, [def.id]);
  log(s, `Encuentro para ${heroName(s, i)}: ${def.name}.`);
  // Cancel it: allies in play (any card) or events from hand (treacheries, in hero form).
  const p = s.players[i];
  const allies = p.play.filter((c) => abilitiesOf(pcard(s, c.uid)).some((a) => a.timing === "encounter" && !(a.cost === "exhaust" && c.exhausted) && (!a.payFor || canPayOne(s, i, a.payFor))));
  const events = def.type === "traicion" && def.reveal?.length && p.form === "heroe" ? p.hand.filter((u) => pcard(s, u).play?.timing === "treachery" && autoPay(s, i, costOf(s, i, u), u)) : [];
  if (allies.length || events.length) {
    setPrompt(s, {
      player: i, kind: "optional", text: `${def.name}: ${def.text} ¿La anulas?`,
      options: [
        ...allies.map((c) => ({ id: `ally:${c.uid}`, label: `${pcard(s, c.uid).name} (en juego)`, detail: abilitiesOf(pcard(s, c.uid)).find((a) => a.timing === "encounter")!.text })),
        ...events.map((u) => ({ id: u, label: pcard(s, u).name, detail: `${pcard(s, u).text} (se paga solo con tus cartas menos valiosas)` })),
        { id: "no", label: "No" },
      ],
      resume: { r: "encounter", player: i, card: uid },
    });
    return;
  }
  resolveReveal(s, i, uid);
}

function resolveReveal(s: GameState, i: number, uid: string) {
  const def = ecard(s, uid);
  switch (def.type) {
    case "esbirro": engageMinion(s, i, uid); return;
    case "plan": enterSidePlan(s, i, uid); return;
    case "entorno":
      setEnvironment(s, uid);
      if (def.reveal) runEffects(s, i, def.reveal);
      return;
    case "vinculo": s.villain.attachments.push(uid); return;
    case "traicion": case "obligacion": {
      s.encounterDiscard.push(uid);
      const owner = def.type === "obligacion" ? s.players.findIndex((q) => !q.eliminated && heroOf(q).obligation === def.id) : -1;
      const who = owner >= 0 ? owner : i;
      if (who !== i) log(s, `${def.name} es una obligación de ${heroName(s, who)}.`);
      resolveTreachery(s, who, uid);
      return;
    }
  }
}

function resolveTreachery(s: GameState, who: number, uid: string) {
  const def = ecard(s, uid);
  if (def.reveal) runEffects(s, who, def.reveal.map((e) => (e.do === "addThreat" ? { ...e, target: "mainPlan" as Target } : e)));
}

// MARK: Attacks and defence

/** Number of resources from hand a player could pay (for interrupts paid automatically). */
function autoPay(s: GameState, i: number, cost: number, except: string, forUid?: string): string[] | undefined {
  const p = s.players[i];
  if (cost <= 0) return [];
  // Cheapest to lose first: resource cards, then the lowest-cost cards.
  const pool = p.hand.filter((u) => u !== except).sort((a, b) => (pcard(s, a).type === "recurso" ? -1 : 0) - (pcard(s, b).type === "recurso" ? -1 : 0) || pcard(s, a).cost - pcard(s, b).cost);
  const pay: string[] = [];
  let sum = 0;
  for (const u of pool) { if (sum >= cost) break; pay.push(u); sum += payValue(s, u, forUid ?? except); }
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
    if (d.ally && !c.exhausted) options.push({ id: c.uid, label: `Bloquear con ${d.name}`, detail: `El aliado recibe todo el daño (${allyStats(s, c).vida - c.damage} vida)` });
  }
  options.push({ id: "none", label: "No defender", detail: `${heroName(s, i)} recibe ${amount} daño` });
  const oneShots = attacker === "villain" ? s.villain.attachments.filter((u) => ecard(s, u).oneShot) : [];
  setPrompt(s, { player: i, kind: "defense", text: `${name} ataca con ${amount}. ¿Cómo te defiendes?`, options, resume: { r: "defense", player: i, attacker, amount, boost, oneShots } });
}

function resolveDefense(s: GameState, r: Extract<Resume, { r: "defense" }>, option: string) {
  const p = s.players[r.player];
  let defender: string | null = null;
  if (option === "hero") { p.heroExhausted = true; defender = "hero"; log(s, `${heroName(s, r.player)} se defiende.`); }
  let prevented = 0;
  if (option !== "hero" && option !== "none") {
    const c = p.play.find((x) => x.uid === option);
    if (c) {
      c.exhausted = true; defender = option;
      const d = pcard(s, option);
      log(s, `${d.name} bloquea el golpe.`);
      // The ally's own block ability (prevent damage, hit back…).
      if (d.ally?.onBlock) {
        const pool = { amount: 0 };
        runEffects(s, r.player, d.ally.onBlock, 0, { attacker: r.attacker, preventPool: pool, source: option, sourceName: d.name });
        prevented = pool.amount;
      }
    }
  }
  askInterrupts(s, { r: "interrupts", player: r.player, attacker: r.attacker, amount: r.amount, defender, prevented, oneShots: r.oneShots });
}

function askInterrupts(s: GameState, r: Extract<Resume, { r: "interrupts" }>) {
  const p = s.players[r.player];
  const opts = responsesFor(s, r.player, "defend");
  const ab = heroOf(p).ability;
  const canAbility = !!ab && ab.timing === "defend" && !p.heroAbilityUsed && p.form === "heroe";
  const used = r.used ?? [];
  const cardsInPlay = p.play.filter((c) => !used.includes(`play:${c.uid}`) && abilitiesOf(pcard(s, c.uid)).some((a) => a.timing === "defend" && (!a.heroOnly || p.form === "heroe") && !(a.cost === "exhaust" && c.exhausted) && !(c.exhausted && !a.cost && !a.payFor && c.counters === undefined) && (c.counters === undefined || c.counters > 0) && (!a.payFor || canPayOne(s, r.player, a.payFor))));
  if (!opts.length && !canAbility && !cardsInPlay.length) return applyAttackDamage(s, r);
  setPrompt(s, {
    player: r.player, kind: "optional", text: "¿Juegas algo antes de recibir el golpe? (las cartas se pagan solas con tus cartas menos valiosas)",
    options: [
      ...(canAbility ? [{ id: "ability", label: ab!.text, detail: "Habilidad de tu héroe (una vez por ronda)" }] : []),
      ...cardsInPlay.map((c) => ({ id: `play:${c.uid}`, label: `${pcard(s, c.uid).name} (en juego)`, detail: abilitiesOf(pcard(s, c.uid)).find((a) => a.timing === "defend")!.text })),
      ...opts.map((u) => ({ id: u, label: pcard(s, u).name, detail: pcard(s, u).text })),
      { id: "no", label: "No" },
    ],
    resume: r,
  });
}

function resolveInterrupt(s: GameState, r: Extract<Resume, { r: "interrupts" }>, option: string) {
  if (option === "ability") {
    const p = s.players[r.player];
    const ab = heroOf(p).ability!;
    p.heroAbilityUsed = true;
    log(s, `${heroName(s, r.player)}: ${ab.text}.`);
    const pool = { amount: 0 };
    runEffects(s, r.player, ab.effects, 0, { attacker: r.attacker, preventPool: pool });
    r = { ...r, prevented: r.prevented + pool.amount };
  } else if (option.startsWith("play:")) {
    const p = s.players[r.player];
    const c = p.play.find((x) => x.uid === option.slice(5));
    if (c) {
      const a = abilitiesOf(pcard(s, c.uid)).find((x) => x.timing === "defend")!;
      if (a.cost === "exhaust" || (!a.cost && !a.payFor && c.counters === undefined)) c.exhausted = true;
      const pay = a.payFor ? payOne(s, r.player, a.payFor) : undefined;
      log(s, `${heroName(s, r.player)} usa ${pcard(s, c.uid).name}${pay ? ` (paga con ${pcard(s, pay).name})` : ""}.`);
      const pool = { amount: 0 };
      runEffects(s, r.player, a.effects, 0, { attacker: r.attacker, preventPool: pool, source: c.uid, sourceName: pcard(s, c.uid).name });
      r = { ...r, prevented: r.prevented + pool.amount };
    }
  } else if (option !== "no") {
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
  if (option === "no" || s.result) return applyAttackDamage(s, r);
  // Something was played: offer the rest (each card in play once per attack).
  askInterrupts(s, { ...r, used: [...(r.used ?? []), option] });
}

function applyAttackDamage(s: GameState, r: Extract<Resume, { r: "interrupts" }>) {
  const p = s.players[r.player];
  if (r.attacker === "villain") {
    for (const u of s.villain.attachments.filter((x) => r.oneShots?.includes(x))) {
      s.villain.attachments = s.villain.attachments.filter((x) => x !== u);
      toDiscard(s, u);
      log(s, `${ecard(s, u).name} se agota tras el golpe y se descarta.`);
    }
  }
  const kw = attackerKeywords(s, r.attacker);
  if (kw.includes("perforante")) {
    const ally = r.defender && r.defender !== "hero" ? p.play.find((c) => c.uid === r.defender) : undefined;
    const holder: Statuses = ally ?? p;
    if (holder.tough) { holder.tough = false; log(s, `Perforante: el golpe atraviesa a ${ally ? pcard(s, ally.uid).name : heroName(s, r.player)} y le quita Duro.`); }
  }
  let dmg = Math.max(0, r.amount - r.prevented);
  if (r.defender === "hero") dmg = Math.max(0, dmg - heroStats(s, r.player).aguante);
  const parts = [`ataque ${r.amount}`, r.prevented ? `evitado ${Math.min(r.prevented, r.amount)}` : "", r.defender === "hero" ? `Aguante ${heroStats(s, r.player).aguante}` : ""].filter(Boolean).join(" − ");
  log(s, `Resultado: ${parts} → ${dmg} daño a ${r.defender && r.defender !== "hero" ? pcard(s, r.defender).name : heroName(s, r.player)}.`);
  const heroBefore = p.damage;
  if (r.defender && r.defender !== "hero") {
    const c = p.play.find((x) => x.uid === r.defender);
    const left = c ? allyStats(s, c).vida - c.damage : 0;
    damageAlly(s, r.player, r.defender, dmg);
    if (kw.includes("arrollador") && c && !c.tough && dmg > left) { log(s, `Arrollador: ${dmg - left} daño sobrante alcanza a ${heroName(s, r.player)}.`); damageHero(s, r.player, dmg - left); }
  }
  else if (dmg > 0) damageHero(s, r.player, dmg);
  else log(s, `${heroName(s, r.player)} no recibe daño.`);
  if (checkEnd(s) || p.eliminated) return;
  // The absorbed environment's after-attack effect (e.g. ice stuns a hero it hurt).
  const env = environmentDef(s)?.environment;
  if (r.attacker === "villain" && env?.afterAttack && p.damage > heroBefore) { runEffects(s, r.player, env.afterAttack); if (checkEnd(s)) return; }
  // Represalia: the hero hits back (not against ranged attackers).
  // Only when the hero was the one attacked (not when an ally blocked).
  const heroHit = !r.defender || r.defender === "hero";
  const ret = p.form === "heroe" && heroHit ? (heroOf(p).hero.retaliate ?? 0) + p.play.reduce((a, c) => a + (pcard(s, c.uid).retaliate ?? 0), 0) : 0;
  if (ret && kw.includes("distancia")) log(s, `${enemyName(s, r.attacker)} ataca a distancia: la Represalia no le alcanza.`);
  else if (ret && (r.attacker === "villain" || refFromID(s, r.attacker))) { log(s, `Represalia: ${ret} daño a ${enemyName(s, r.attacker)}.`); damageEnemy(s, r.attacker, ret); if (checkEnd(s)) return; }
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
