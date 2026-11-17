import { ENCOUNTER_CARDS, HEROES, PLAYER_CARDS, SCENARIOS } from "../../src/data/content";

/** Every picture the cards need: its key (file name), a label and what it should show. */
export interface ArtKey { key: string; label: string; brief: string; group: string }

export function artKeys(): ArtKey[] {
  const out: ArtKey[] = [];
  for (const h of HEROES) {
    out.push({ key: `hero-${h.id}`, label: h.hero.name, brief: `Superhéroe/a en forma de héroe. ${h.hero.text}`, group: "personajes" });
    out.push({ key: `identity-${h.id}`, label: h.identity.name, brief: `Su identidad civil. ${h.identity.text}`, group: "personajes" });
  }
  for (const s of SCENARIOS) out.push({ key: `villain-${s.id}`, label: s.villain.name, brief: `Villano del escenario «${s.name}». ${s.intro}`, group: "villanos" });
  for (const c of PLAYER_CARDS.values()) out.push({ key: c.id, label: c.name, brief: `${c.type}: ${c.text}`, group: c.type === "aliado" ? "personajes" : "cartas" });
  for (const c of ENCOUNTER_CARDS.values()) out.push({ key: c.id, label: c.name, brief: `${c.type}: ${c.text}`, group: c.type === "esbirro" ? "villanos" : "encuentros" });
  return out;
}
