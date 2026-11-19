import { CENIZA_CAMPAIGN, type CampaignDef } from "../data/roster/campana-ceniza";
import { ecard, heroOf, pcard } from "../engine/game";
import type { GameState, SetupOptions } from "../engine/types";
import { HERO_BY_ID, PLAYER_CARDS, SCENARIO_BY_ID } from "../data/content";

/**
 * Campaign mode, saved on this device. A campaign is played with the same heroes and difficulty
 * from mission 1 to 5. Between missions it carries:
 * - Heridas: each hero starts with half (rounded down) of the damage they ended the last victory with.
 * - Recompensas: after missions 1 to 4 each hero adds one reward card to their deck.
 * - Aliados rescatados: allies freed in mission 3 join the deck of the hero who rescued them.
 * - Condiciones: consequences of how a mission ended (extra encounter cards, extra threat).
 * A defeat changes nothing: you retry the same mission.
 */
export interface CampaignState {
  id: string;
  heroes: string[];
  difficulty: "normal" | "experto";
  /** The next mission (0–4); 5 means the campaign is won. */
  step: number;
  wounds: Record<string, number>;
  boons: Record<string, string[]>;
  conditions: string[];
  log: { step: number; text: string }[];
  /** Rewards to choose before the next mission (options per hero). */
  pendingReward?: { options: string[]; chosen: Record<string, string> };
  attempts: number;
}
interface Saved { active?: CampaignState; unlocked: number; completed: number }

export const CAMPAIGNS: CampaignDef[] = [CENIZA_CAMPAIGN];
export const campaignById = (id: string) => CAMPAIGNS.find((c) => c.id === id);
const KEY = (id: string) => `heroica.campana.${id}`;

export function loadCampaign(id: string): Saved {
  try {
    const t = localStorage.getItem(KEY(id));
    const v = t ? (JSON.parse(t) as Saved) : undefined;
    return v && typeof v === "object" ? { unlocked: v.unlocked ?? 0, completed: v.completed ?? 0, active: v.active } : { unlocked: 0, completed: 0 };
  } catch { return { unlocked: 0, completed: 0 }; }
}
export function saveCampaign(id: string, v: Saved) { try { localStorage.setItem(KEY(id), JSON.stringify(v)); } catch { /* storage full or blocked */ } }

export function newCampaign(id: string, heroes: string[], difficulty: "normal" | "experto"): CampaignState {
  return { id, heroes, difficulty, step: 0, wounds: {}, boons: Object.fromEntries(heroes.map((h) => [h, []])), conditions: [], log: [{ step: 0, text: `Empieza la campaña con ${heroes.map(heroLabel).join(" y ")} (${difficulty === "experto" ? "Experto" : "Normal"}).` }], attempts: 0 };
}

const heroLabel = (id: string) => HERO_BY_ID.get(id)?.hero.name ?? id;

/** What the next mission's setup gets from the campaign so far. */
export function setupFor(c: CampaignState): SetupOptions {
  const def = campaignById(c.id)!;
  const conds = c.conditions.map((k) => def.conditions[k]).filter(Boolean);
  return {
    extraCards: c.boons,
    startDamage: c.wounds,
    extraEncounter: conds.flatMap((x) => x.extraEncounter ?? []),
    startThreat: conds.reduce((a, x) => a + (x.startThreat ?? 0), 0),
    campaign: { id: c.id, step: c.step },
  };
}

export const missionScenario = (c: CampaignState) => campaignById(c.id)!.scenarios[c.step];

/** A campaign mission ended: carry its consequences. Returns the lines to show. */
export function applyResult(c: CampaignState, s: GameState): string[] {
  const def = campaignById(c.id)!;
  const sc = SCENARIO_BY_ID.get(s.scenario)!;
  const out: string[] = [];
  c.attempts++;
  if (s.result !== "victoria") {
    out.push(`Derrota en ${sc.name}. La campaña no avanza: puedes volver a intentarlo.`);
    c.log.push({ step: c.step, text: out[0] });
    return out;
  }
  out.push(`¡${sc.villain.name} derrotado! Misión ${c.step + 1} de ${def.scenarios.length} completada.`);
  // Heridas.
  for (const p of s.players) {
    const max = HERO_BY_ID.get(p.hero)!.vida;
    const w = Math.min(max - 1, Math.floor(p.damage / 2));
    c.wounds[p.hero] = w;
    if (w) out.push(`${heroOf(p).hero.name} arrastra ${w} herida${w === 1 ? "" : "s"} (la mitad de su daño) a la próxima misión.`);
  }
  // Rescued allies join the rescuer's deck.
  for (const r of s.rescued ?? []) {
    const hero = s.players[r.player].hero;
    (c.boons[hero] ??= []).push(s.cards[r.uid]);
    out.push(`${pcard(s, r.uid).name} se une al mazo de ${heroLabel(hero)} para el resto de la campaña.`);
  }
  if (s.captives?.cards.length) out.push(`Nadie rescató a ${s.captives.cards.map((u) => pcard(s, u).name).join(" ni a ")}: siguen en manos de la Legión.`);
  // Conditions from how it ended.
  const add = (k: string) => { if (!c.conditions.includes(k)) { c.conditions.push(k); out.push(`Condición: ${def.conditions[k].name}. ${def.conditions[k].text}`); } };
  if (s.scenario === "saeta-negra" && s.villain.attachments.some((u) => ecard(s, u).traits?.includes("arma"))) add("arsenal-legion");
  if (s.scenario === "amalgama" && (s.mainStage ?? 0) > 0) add("rutas-cortadas");
  if (s.scenario === "quimera" && s.players.some((p) => p.engaged.some((m) => ecard(s, m.uid).traits?.includes("mutante")))) add("mutantes-fugados");
  const rewards = def.rewards[s.scenario];
  if (rewards) c.pendingReward = { options: rewards, chosen: {} };
  c.step++;
  if (c.step >= def.scenarios.length) out.push("¡Has completado la campaña! La Legión de Ceniza ha caído.");
  for (const line of out) c.log.push({ step: c.step, text: line });
  return out;
}

/** Choose this hero's reward; once every hero has chosen, the cards go into their decks. */
export function chooseReward(c: CampaignState, hero: string, card: string) {
  if (!c.pendingReward || !c.pendingReward.options.includes(card)) return;
  c.pendingReward.chosen[hero] = card;
  if (c.heroes.every((h) => c.pendingReward!.chosen[h])) {
    for (const h of c.heroes) {
      const id = c.pendingReward.chosen[h];
      (c.boons[h] ??= []).push(id);
      c.log.push({ step: c.step, text: `${heroLabel(h)} añade ${PLAYER_CARDS.get(id)!.name} a su mazo.` });
    }
    c.pendingReward = undefined;
  }
}
