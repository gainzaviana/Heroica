import type { EncounterCardDef, HeroDef, PlayerCardDef, ScenarioDef } from "../engine/types";

// Heroica — Valdoria: a kingdom of floating towers and old runes where a few people woke up
// with powers. By day they are smiths and mapmakers in the city of Aurelia; when the sky burns,
// they are its heroes. All names, cards and text are original.

// MARK: Player cards

const cards: PlayerCardDef[] = [
  // Brasa Rúnica (Kaela Voss): a smith who forges runes into her armour.
  { id: "martillo-runico", name: "Martillo Rúnico", type: "evento", cost: 2, resources: 1, glyph: "🔨",
    text: "Héroe. Acción: inflige 4 daño a un enemigo.", play: { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "chooseEnemy", amount: 4 }] } },
  { id: "chispa-forja", name: "Chispa de Forja", type: "evento", cost: 1, resources: 1, glyph: "✦",
    text: "Acción: inflige 2 daño a un enemigo (3 si controlas una mejora).", play: { timing: "action", effects: [{ do: "damage", target: "chooseEnemy", amount: 2, ifUpgrade: 3 }] } },
  { id: "guantelete-runico", name: "Guantelete Rúnico", type: "mejora", cost: 2, resources: 1, glyph: "🧤",
    text: "Tu héroe obtiene +1 Fuerza.", bonus: { fuerza: 1 } },
  { id: "coraza-escamas", name: "Coraza de Escamas", type: "mejora", cost: 2, resources: 1, glyph: "🛡",
    text: "Tu héroe obtiene +1 Aguante y +2 Vida máxima.", bonus: { aguante: 1, vidaMax: 2 } },
  { id: "torvald", name: "Torvald, aprendiz", type: "aliado", cost: 2, resources: 1, glyph: "⚒",
    text: "Aliado. Atacar o contener le cuesta 1 daño.", ally: { vida: 2, fuerza: 1, ingenio: 1, consFuerza: 1, consIngenio: 1 } },
  { id: "yunque-ancestral", name: "Yunque Ancestral", type: "apoyo", cost: 1, resources: 1, glyph: "⚙",
    text: "Acción, agota esta carta: roba 1 carta.", ability: { timing: "action", cost: "exhaust", effects: [{ do: "draw", amount: 1 }], text: "Roba 1 carta" } },
  { id: "golpe-escudo", name: "Golpe de Escudo", type: "evento", cost: 1, resources: 1, glyph: "🛡",
    text: "Héroe. Al defenderte: evita 3 daño e inflige 1 daño al atacante.", play: { timing: "defend", heroOnly: true, effects: [{ do: "prevent", amount: 3 }, { do: "damage", target: "attacker", amount: 1 }] } },

  // Vigía del Alba (Elian Morrow): a mapmaker whose arrows are made of morning light.
  { id: "flecha-alba", name: "Flecha del Alba", type: "evento", cost: 1, resources: 1, glyph: "➶",
    text: "Acción: inflige 2 daño a un enemigo.", play: { timing: "action", effects: [{ do: "damage", target: "chooseEnemy", amount: 2 }] } },
  { id: "luz-reveladora", name: "Luz Reveladora", type: "evento", cost: 2, resources: 1, glyph: "☀",
    text: "Acción: retira 3 amenaza de un plan y roba 1 carta.", play: { timing: "action", effects: [{ do: "thwart", target: "choosePlan", amount: 3 }, { do: "draw", amount: 1 }] } },
  { id: "mira-halcon", name: "Mira, halcón de luz", type: "aliado", cost: 2, resources: 1, glyph: "🦅",
    text: "Aliado. Contener le cuesta 1 daño; atacar, nada.", ally: { vida: 1, fuerza: 1, ingenio: 2, consFuerza: 0, consIngenio: 1 } },
  { id: "arco-amanecer", name: "Arco del Amanecer", type: "mejora", cost: 2, resources: 1, glyph: "🏹",
    text: "Tu héroe obtiene +1 Fuerza y +1 Ingenio.", bonus: { fuerza: 1, ingenio: 1 } },
  { id: "torre-vigia", name: "Torre de Vigía", type: "apoyo", cost: 2, resources: 1, glyph: "🗼",
    text: "Acción, agota esta carta: retira 1 amenaza de un plan.", ability: { timing: "action", cost: "exhaust", effects: [{ do: "thwart", target: "choosePlan", amount: 1 }], text: "Retira 1 amenaza" } },
  { id: "destello", name: "Destello Cegador", type: "evento", cost: 1, resources: 1, glyph: "✸",
    text: "Al defenderte: evita 2 daño; el atacante queda aturdido (se salta su próxima activación).", play: { timing: "defend", effects: [{ do: "prevent", amount: 2 }, { do: "stun", target: "attacker" }] } },
  { id: "capa-crepuscular", name: "Capa Crepuscular", type: "mejora", cost: 1, resources: 1, glyph: "🧥",
    text: "Tu héroe obtiene +1 Aguante.", bonus: { aguante: 1 } },

  // Shared by every hero.
  { id: "pocion-curacion", name: "Poción de Curación", type: "evento", cost: 1, resources: 1, glyph: "⚗",
    text: "Acción: cura 4 daño a tu héroe.", play: { timing: "action", effects: [{ do: "heal", target: "self", amount: 4 }] } },
  { id: "mercenario-posada", name: "Mercenaria de la Posada", type: "aliado", cost: 3, resources: 1, glyph: "⚔",
    text: "Aliado. Atacar o contener le cuesta 1 daño.", ally: { vida: 3, fuerza: 2, ingenio: 1, consFuerza: 1, consIngenio: 1 } },
  { id: "aldeana-valiente", name: "Aldeana Valiente", type: "aliado", cost: 1, resources: 1, glyph: "🧺",
    text: "Aliado. Contener le cuesta 1 daño.", ally: { vida: 1, fuerza: 0, ingenio: 1, consFuerza: 1, consIngenio: 1 } },
  { id: "inspiracion", name: "Inspiración", type: "recurso", cost: 0, resources: 2, glyph: "✶",
    text: "Recurso: vale 2 al pagar una carta." },
  { id: "contraataque", name: "Contraataque", type: "evento", cost: 0, resources: 1, glyph: "↺",
    text: "Héroe. Después de que un enemigo te ataque: inflígele 2 daño.", play: { timing: "afterAttack", heroOnly: true, effects: [{ do: "damage", target: "attacker", amount: 2 }] } },
  { id: "vigilancia", name: "Vigilancia", type: "evento", cost: 1, resources: 1, glyph: "👁",
    text: "Acción: retira 2 amenaza de un plan.", play: { timing: "action", effects: [{ do: "thwart", target: "choosePlan", amount: 2 }] } },
  { id: "golpe-certero", name: "Golpe Certero", type: "evento", cost: 2, resources: 1, glyph: "⚡",
    text: "Acción: inflige 3 daño a un enemigo.", play: { timing: "action", effects: [{ do: "damage", target: "chooseEnemy", amount: 3 }] } },
  { id: "respiro", name: "Segundo Aliento", type: "evento", cost: 1, resources: 1, glyph: "❖",
    text: "Acción: prepara a tu héroe.", play: { timing: "action", effects: [{ do: "readyHero" }] } },
  { id: "escudo-ciudad", name: "Escudo de Aurelia", type: "mejora", cost: 2, resources: 1, glyph: "⛨",
    text: "Tu héroe obtiene +1 Aguante.", bonus: { aguante: 1 } },
];

const neutral = [
  "pocion-curacion", "pocion-curacion", "mercenario-posada", "aldeana-valiente", "aldeana-valiente",
  "inspiracion", "inspiracion", "inspiracion", "inspiracion", "contraataque", "contraataque",
  "vigilancia", "vigilancia", "golpe-certero", "golpe-certero", "golpe-certero", "respiro", "escudo-ciudad",
];

export const HEROES: HeroDef[] = [
  {
    id: "brasa",
    hero: { name: "Brasa Rúnica", fuerza: 2, ingenio: 1, aguante: 2, mano: 5, text: "Forja viva: una vez por ronda, después de jugar una mejora, inflige 1 daño a un enemigo." },
    identity: { name: "Kaela Voss", recuperacion: 3, mano: 6, text: "Herrera de runas del barrio de los yunques." },
    vida: 11,
    ability: { timing: "afterUpgrade", cost: "once", effects: [{ do: "damage", target: "chooseEnemy", amount: 1 }], text: "Forja viva: 1 daño" },
    deck: ["martillo-runico", "martillo-runico", "martillo-runico", "chispa-forja", "chispa-forja", "chispa-forja", "guantelete-runico", "coraza-escamas", "torvald", "yunque-ancestral", "golpe-escudo", "golpe-escudo", ...neutral],
    colour: "#e2573b",
    glyph: "🔥",
  },
  {
    id: "vigia",
    hero: { name: "Vigía del Alba", fuerza: 1, ingenio: 2, aguante: 1, mano: 5, text: "Ojo del amanecer: una vez por ronda, como acción, retira 1 amenaza de un plan." },
    identity: { name: "Elian Morrow", recuperacion: 4, mano: 6, text: "Cartógrafo real. Conoce cada callejón de Aurelia." },
    vida: 10,
    ability: { timing: "action", cost: "once", effects: [{ do: "thwart", target: "choosePlan", amount: 1 }], text: "Ojo del amanecer: retira 1 amenaza" },
    deck: ["flecha-alba", "flecha-alba", "flecha-alba", "flecha-alba", "luz-reveladora", "luz-reveladora", "luz-reveladora", "mira-halcon", "arco-amanecer", "torre-vigia", "destello", "destello", "capa-crepuscular", ...neutral],
    colour: "#e8a923",
    glyph: "🌅",
  },
];

// MARK: Encounter cards

const encounters: EncounterCardDef[] = [
  // El Rey Ceniza
  { id: "esbirro-ceniza", name: "Esbirro de Ceniza", type: "esbirro", boost: 1, glyph: "☠", text: "Esbirro.", minion: { vida: 3, fuerza: 1, plan: 1 } },
  { id: "gargola-ignea", name: "Gárgola Ígnea", type: "esbirro", boost: 1, glyph: "🗿", text: "Guardia: mientras esté contigo, no puedes atacar al villano.", minion: { vida: 4, fuerza: 2, plan: 0, guardia: true } },
  { id: "lluvia-brasas", name: "Lluvia de Brasas", type: "traicion", boost: 2, glyph: "☄", text: "En forma de héroe recibes 2 daño; si no, añade 2 amenaza al plan principal.",
    reveal: [{ do: "heroDamage", amount: 2, ifIdentity: { do: "addThreat", amount: 2 } }] },
  { id: "orden-del-rey", name: "Orden del Rey", type: "traicion", boost: 1, glyph: "♛", text: "El villano se activa contra ti.", reveal: [{ do: "villainActivates" }] },
  { id: "torre-llamas", name: "Torre en Llamas", type: "plan", boost: 0, glyph: "🏰", text: "Plan secundario (4 amenaza). Aceleración: mientras esté en juego, el plan principal gana 1 amenaza más cada ronda.", sidePlan: { amenaza: 4, aceleracion: true } },
  { id: "corona-ascuas", name: "Corona de Ascuas", type: "vinculo", boost: 1, glyph: "👑", text: "Vínculo: el villano obtiene +1 Fuerza. Héroe, agota a tu héroe: descártala.", villainBonus: { fuerza: 1 } },
  // Legión de Sombras (modular)
  { id: "acechador-umbrio", name: "Acechador Umbrío", type: "esbirro", boost: 1, glyph: "🦇", text: "Esbirro.", minion: { vida: 2, fuerza: 1, plan: 2 } },
  { id: "niebla-sombria", name: "Niebla Sombría", type: "traicion", boost: 2, glyph: "🌫", text: "Añade 1 amenaza al plan principal. Oleada: revela otra carta.", reveal: [{ do: "addThreat", target: "mainPlan", amount: 1 }, { do: "surge" }] },
  { id: "santuario-profanado", name: "Santuario Profanado", type: "plan", boost: 0, glyph: "⛩", text: "Plan secundario (3 amenaza).", sidePlan: { amenaza: 3 } },
  // Estándar
  { id: "avance-oscuro", name: "Avance Oscuro", type: "traicion", boost: 2, glyph: "⇥", text: "Añade 2 amenaza al plan principal.", reveal: [{ do: "addThreat", target: "mainPlan", amount: 2 }] },
  { id: "emboscada", name: "Emboscada", type: "traicion", boost: 1, glyph: "⚔", text: "En forma de héroe recibes 1 daño; si no, añade 1 amenaza al plan principal.", reveal: [{ do: "heroDamage", amount: 1, ifIdentity: { do: "addThreat", amount: 1 } }] },
];

export const ENCOUNTER_SETS: Record<string, string[]> = {
  "rey-ceniza": ["esbirro-ceniza", "esbirro-ceniza", "esbirro-ceniza", "gargola-ignea", "gargola-ignea", "lluvia-brasas", "lluvia-brasas", "orden-del-rey", "orden-del-rey", "torre-llamas", "corona-ascuas"],
  "legion-sombras": ["acechador-umbrio", "acechador-umbrio", "niebla-sombria", "santuario-profanado"],
  estandar: ["avance-oscuro", "emboscada"],
};

export const SCENARIOS: ScenarioDef[] = [
  {
    id: "eclipse-ceniza",
    name: "El Eclipse de Ceniza",
    intro: "Morvath, el Rey Ceniza, ha encendido un ritual sobre las torres de Aurelia. Si el sol se apaga, la ciudad arderá en una noche sin fin.",
    villain: {
      name: "Morvath, el Rey Ceniza",
      glyph: "👹",
      stages: [
        { name: "Morvath I", vidaPorJugador: 10, fuerza: 1, plan: 1 },
        { name: "Morvath II", vidaPorJugador: 12, fuerza: 2, plan: 2, text: "Herido y furioso: ataca con más fuerza." },
      ],
    },
    mainPlan: { name: "El Eclipse", inicioPorJugador: 0, aceleracionPorJugador: 1, limitePorJugador: 13, text: "Si llega al límite, el sol se apaga: derrota." },
    encounterSets: ["rey-ceniza", "legion-sombras", "estandar"],
  },
];

export const PLAYER_CARDS = new Map(cards.map((c) => [c.id, c]));
export const ENCOUNTER_CARDS = new Map(encounters.map((c) => [c.id, c]));
export const HERO_BY_ID = new Map(HEROES.map((h) => [h.id, h]));
export const SCENARIO_BY_ID = new Map(SCENARIOS.map((s) => [s.id, s]));
