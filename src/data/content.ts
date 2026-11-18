import type { EncounterCardDef, HeroDef, PlayerCardDef, ScenarioDef } from "../engine/types";
import { LIDERAZGO, PROTECCION } from "./roster/aspects";
import { CENTELLA, CENTELLA_CARDS } from "./roster/centella";
import { FUNAMBULA, FUNAMBULA_CARDS } from "./roster/funambula";
import { MOLE, MOLE_CARDS } from "./roster/mole";
import { NEW_SCENARIOS, SCENARIO_ENCOUNTERS, SCENARIO_SETS } from "./roster/scenarios";
import { SOBERANO, SOBERANO_CARDS } from "./roster/soberano";

// Heroica — Valdoria: a kingdom of floating towers and old runes where a few people woke up
// with powers. By day they are engineers, students and scientists in the city of Aurelia; when
// the sky burns, they are its heroes. All names, cards and text are original.

// MARK: Player cards

const cards: PlayerCardDef[] = [
  // Vanguardia de Titanio (Iria Montalbán): an engineer who fights inside a modular titanium suit.
  // Every Tecnología piece in play widens her hand in hero form (1 → up to 7). Propulsores give Aéreo.
  { id: "guantelete-plasma", name: "Guantelete de Plasma", type: "mejora", cost: 2, resources: 1, resType: "energia", glyph: "🧤", traits: ["tecnologia"],
    text: "Tecnología. Héroe. Acción, agota esta carta: inflige 1 daño a un enemigo. Puedes descartar una carta con ⚡ para infligir 2.",
    ability: { timing: "action", cost: "exhaust", heroOnly: true, payFor: "energia", effects: [{ do: "damage", target: "chooseEnemy", amount: 1, paidBonus: { res: "energia", amount: 1 } }], text: "Disparo de plasma" } },
  { id: "visor-tactico", name: "Visor Táctico", type: "mejora", cost: 2, resources: 1, resType: "mental", glyph: "🥽", traits: ["tecnologia"],
    text: "Tecnología. Héroe. Acción, agota esta carta: retira 1 amenaza de un plan. Si tienes Aéreo, retira 1 de cada plan en juego.",
    ability: { timing: "action", cost: "exhaust", heroOnly: true, effects: [{ do: "thwart", target: "choosePlan", amount: 1, allIfTrait: "aereo" }], text: "Barrido del visor" } },
  { id: "nucleo-fusion", name: "Núcleo de Fusión", type: "mejora", cost: 3, resources: 1, resType: "energia", glyph: "⚛", traits: ["tecnologia"],
    text: "Tecnología. Héroe. Acción, una vez por ronda: descarta una carta con ⚡ para preparar a tu héroe.",
    ability: { timing: "action", cost: "once", heroOnly: true, payFor: "energia", payRequired: true, effects: [{ do: "readyHero" }], text: "Recarga" } },
  { id: "propulsores-dorsales", name: "Propulsores Dorsales", type: "mejora", cost: 2, resources: 1, resType: "energia", glyph: "🚀", traits: ["tecnologia", "aereo"],
    text: "Tecnología. Tu héroe obtiene Aéreo y +1 Vida máxima.", bonus: { vidaMax: 1 } },
  { id: "canon-hombro", name: "Cañón de Hombro", type: "mejora", cost: 4, resources: 1, resType: "fisico", glyph: "💠", traits: ["tecnologia"],
    text: "Tecnología. Héroe. Acción, agota esta carta: inflige 2 daño a un enemigo. Puedes descartar una carta con ✊ para infligir 4.",
    ability: { timing: "action", cost: "exhaust", heroOnly: true, payFor: "fisico", effects: [{ do: "damage", target: "chooseEnemy", amount: 2, paidBonus: { res: "fisico", amount: 2 } }], text: "Andanada" } },
  { id: "lumen-ia", name: "Lumen, IA de combate", type: "aliado", cost: 3, resources: 1, resType: "comodin", glyph: "🛰",
    text: "Aliado. Dron con inteligencia propia. Atacar o contener le cuesta 1 daño.", ally: { vida: 3, fuerza: 2, ingenio: 1, consFuerza: 1, consIngenio: 1 } },
  { id: "forja-tecnologica", name: "Forja Tecnológica", type: "apoyo", cost: 2, resources: 1, resType: "mental", glyph: "🏭",
    text: "Apoyo. Acción, agota esta carta: roba 1 carta.", ability: { timing: "action", cost: "exhaust", effects: [{ do: "draw", amount: 1 }], text: "Roba 1 carta" } },
  { id: "pulso-ionico", name: "Pulso Iónico", type: "evento", cost: 2, resources: 1, resType: "energia", glyph: "⚡",
    text: "Héroe. Acción: inflige 1 daño a un enemigo. Descarta las 5 primeras cartas de tu mazo: +2 daño a ese enemigo por cada ⚡ impreso en ellas (🌟 cuenta).",
    play: { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "chooseEnemy", amount: 1 }, { do: "mill", amount: 5, damagePer: { res: "energia", amount: 2 } }] } },
  { id: "impacto-supersonico", name: "Impacto Supersónico", type: "evento", cost: 3, resources: 1, resType: "fisico", glyph: "💨",
    text: "Héroe. Acción: inflige 3 daño a un enemigo (+2 si tienes Aéreo).", play: { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "chooseEnemy", amount: 3, traitBonus: { trait: "aereo", amount: 2 } }] } },

  // Furia: an aggressive pool (Vanguardia's deck uses it).
  { id: "torvo-iracundo", name: "Torvo, el Gigante Iracundo", type: "aliado", cost: 4, resources: 1, resType: "fisico", glyph: "👹",
    text: "Aliado. Obligatorio: después de que ataque, descarta la carta superior de tu mazo. ✊: +2 daño al objetivo. 🧠: 1 daño a todos los personajes. ⚡: descarta a Torvo. 🌟: las tres.",
    ally: { vida: 5, fuerza: 3, ingenio: 0, consFuerza: 0, consIngenio: 1, onAttack: [{ do: "mill", amount: 1, branches: {
      fisico: [{ do: "damage", target: "lastTarget", amount: 2 }],
      mental: [{ do: "damage", target: "allCharacters", amount: 1 }],
      energia: [{ do: "discardSelf" }],
    } }] } },
  { id: "zarpa-cazadora", name: "Zarpa, la Cazadora", type: "aliado", cost: 3, resources: 1, resType: "fisico", glyph: "🐆",
    text: "Aliado. Atacar o contener le cuesta 1 daño. Después de que su ataque derrote a un enemigo, se cura 2.",
    ally: { vida: 3, fuerza: 2, ingenio: 1, consFuerza: 1, consIngenio: 1, onKill: [{ do: "heal", target: "thisCard", amount: 2 }] } },
  { id: "halcon-plateado", name: "Halcón Plateado", type: "aliado", cost: 3, resources: 1, resType: "energia", glyph: "🦅",
    text: "Aliado. Al entrar en juego desde tu mano: aturde a un enemigo. Atacar o contener le cuesta 1 daño.",
    ally: { vida: 2, fuerza: 1, ingenio: 2, consFuerza: 1, consIngenio: 1 }, onPlay: [{ do: "status", status: "stunned", target: "chooseEnemy" }] },
  { id: "embate-frontal", name: "Embate Frontal", type: "evento", cost: 2, resources: 1, resType: "fisico", glyph: "🥊",
    text: "Héroe. Acción: inflige 5 daño a un esbirro. Si pagaste con ✊, el daño sobrante pasa al villano (arrollador).",
    play: { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "chooseMinion", amount: 5, overkillIfPaid: "fisico" }] } },
  { id: "furia-imparable", name: "Furia Imparable", type: "evento", cost: 3, resources: 1, resType: "fisico", glyph: "🌋",
    text: "Héroe. Acción: inflige 3 daño a un enemigo y 3 daño a otro enemigo.",
    play: { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "chooseEnemy", amount: 3 }, { do: "damage", target: "chooseOtherEnemy", amount: 3 }] } },
  { id: "por-aurelia", name: "¡Por Aurelia!", type: "evento", cost: 1, resources: 1, resType: "mental", glyph: "📣",
    text: "Acción: retira 2 amenaza de un plan (3 si pagaste con 🧠).", play: { timing: "action", effects: [{ do: "thwart", target: "choosePlan", amount: 2, paidBonus: { res: "mental", amount: 1 } }] } },
  { id: "persecucion", name: "Persecución", type: "evento", cost: 1, resources: 1, resType: "energia", glyph: "🏃",
    text: "Acción: retira 1 amenaza de un plan (3 si has derrotado a un enemigo este turno).", play: { timing: "action", effects: [{ do: "thwart", target: "choosePlan", amount: 1, bonusIfDefeated: 2 }] } },
  { id: "botiquin-campo", name: "Botiquín de Campo", type: "apoyo", cost: 1, resources: 1, resType: "mental", glyph: "🩹",
    text: "Apoyo. Acción, agota esta carta: cura 2 daño a tu héroe o a uno de tus aliados.", ability: { timing: "action", cost: "exhaust", effects: [{ do: "heal", target: "chooseFriendly", amount: 2 }], text: "Primeros auxilios: cura 2" } },
  { id: "instinto-combate", name: "Instinto de Combate", type: "mejora", cost: 1, resources: 1, resType: "fisico", glyph: "🐺",
    text: "Tu héroe obtiene +1 Fuerza.", bonus: { fuerza: 1 } },
  { id: "sala-entrenamiento", name: "Sala de Entrenamiento", type: "apoyo", cost: 3, resources: 1, resType: "energia", glyph: "🥋",
    text: "Apoyo. Acción, agota esta carta: inflige 1 daño a un enemigo.", ability: { timing: "action", cost: "exhaust", effects: [{ do: "damage", target: "chooseEnemy", amount: 1 }], text: "Práctica de tiro: 1 daño" } },
  { id: "celula-energia", name: "Célula de Energía", type: "recurso", cost: 0, resources: 2, resType: "energia", glyph: "🔋", text: "Recurso: vale ⚡⚡ al pagar una carta." },
  { id: "chispa-genio", name: "Chispa de Genio", type: "recurso", cost: 0, resources: 2, resType: "mental", glyph: "💡", text: "Recurso: vale 🧠🧠 al pagar una carta." },
  { id: "pulso-fuerza", name: "Pulso de Fuerza", type: "recurso", cost: 0, resources: 2, resType: "fisico", glyph: "💪", text: "Recurso: vale ✊✊ al pagar una carta." },

  // Básicas: shared by every hero.
  { id: "pocion-curacion", name: "Poción de Curación", type: "evento", cost: 1, resources: 1, resType: "mental", glyph: "⚗",
    text: "Acción: cura 4 daño a tu héroe.", play: { timing: "action", effects: [{ do: "heal", target: "self", amount: 4 }] } },
  { id: "mercenario-posada", name: "Mercenaria de la Posada", type: "aliado", cost: 3, resources: 1, resType: "fisico", glyph: "⚔",
    text: "Aliado. Atacar o contener le cuesta 1 daño.", ally: { vida: 3, fuerza: 2, ingenio: 1, consFuerza: 1, consIngenio: 1 } },
  { id: "aldeana-valiente", name: "Aldeana Valiente", type: "aliado", cost: 1, resources: 1, resType: "mental", glyph: "🧺",
    text: "Aliado. Contener le cuesta 1 daño.", ally: { vida: 1, fuerza: 0, ingenio: 1, consFuerza: 1, consIngenio: 1 } },
  { id: "inspiracion", name: "Inspiración", type: "recurso", cost: 0, resources: 2, resType: "comodin", glyph: "✶",
    text: "Recurso: vale 🌟🌟 (cualquier tipo) al pagar una carta." },
  { id: "contraataque", name: "Contraataque", type: "evento", cost: 0, resources: 1, resType: "energia", glyph: "↺",
    text: "Héroe. Después de que un enemigo te ataque: inflígele 2 daño.", play: { timing: "afterAttack", heroOnly: true, effects: [{ do: "damage", target: "attacker", amount: 2 }] } },
  { id: "vigilancia", name: "Vigilancia", type: "evento", cost: 1, resources: 1, resType: "mental", glyph: "👁",
    text: "Acción: retira 2 amenaza de un plan.", play: { timing: "action", effects: [{ do: "thwart", target: "choosePlan", amount: 2 }] } },
  { id: "golpe-certero", name: "Golpe Certero", type: "evento", cost: 2, resources: 1, resType: "fisico", glyph: "⚡",
    text: "Acción: inflige 3 daño a un enemigo.", play: { timing: "action", effects: [{ do: "damage", target: "chooseEnemy", amount: 3 }] } },
  { id: "respiro", name: "Segundo Aliento", type: "evento", cost: 1, resources: 1, resType: "energia", glyph: "❖",
    text: "Acción: prepara a tu héroe.", play: { timing: "action", effects: [{ do: "readyHero" }] } },
  { id: "escudo-ciudad", name: "Escudo de Aurelia", type: "mejora", cost: 2, resources: 1, resType: "fisico", glyph: "⛨",
    text: "Tu héroe obtiene +1 Aguante.", bonus: { aguante: 1 } },

  ...LIDERAZGO,
  ...PROTECCION,
  ...FUNAMBULA_CARDS,
  ...MOLE_CARDS,
  ...CENTELLA_CARDS,
  ...SOBERANO_CARDS,
];

export const HEROES: HeroDef[] = [
  {
    id: "vanguardia",
    hero: {
      name: "Vanguardia de Titanio", fuerza: 1, ingenio: 1, aguante: 1, mano: 1,
      text: "Armadura modular: en forma de héroe tu mano es 1, +1 por cada Tecnología que tengas en juego (máximo 7).",
      manoPorRasgo: { trait: "tecnologia", max: 7 },
    },
    identity: { name: "Iria Montalbán", recuperacion: 3, mano: 6, text: "Ingeniera prodigio. I+D nocturno: una vez por ronda, mira las 3 primeras cartas de tu mazo, quédate 1 y descarta el resto." },
    vida: 9,
    identityAbility: { timing: "action", cost: "once", effects: [{ do: "lookTop", amount: 3 }], text: "I+D nocturno" },
    deck: [
      // 15 de Vanguardia
      "guantelete-plasma", "guantelete-plasma", "visor-tactico", "visor-tactico", "nucleo-fusion", "nucleo-fusion",
      "propulsores-dorsales", "propulsores-dorsales", "canon-hombro", "lumen-ia", "forja-tecnologica",
      "pulso-ionico", "pulso-ionico", "impacto-supersonico", "impacto-supersonico",
      // 25 de Furia y básicas
      "torvo-iracundo", "zarpa-cazadora", "halcon-plateado",
      "embate-frontal", "embate-frontal", "furia-imparable", "furia-imparable", "por-aurelia", "por-aurelia", "persecucion",
      "golpe-certero", "golpe-certero", "contraataque", "contraataque", "respiro",
      "instinto-combate", "instinto-combate", "botiquin-campo", "sala-entrenamiento",
      "celula-energia", "celula-energia", "chispa-genio", "chispa-genio", "pulso-fuerza", "pulso-fuerza",
    ],
    nemesis: ["silas-corven", "opa-hostil", "sabotaje-industrial"],
    obligation: "junta-accionistas",
    colour: "#b8322a",
    glyph: "🛡",
  },
  FUNAMBULA,
  MOLE,
  CENTELLA,
  SOBERANO,
];

// MARK: Encounter cards

const encounters: EncounterCardDef[] = [
  // Mazagón, el Titán Embestidor
  { id: "maton-sueldo", name: "Matón a Sueldo", type: "esbirro", boost: 1, glyph: "🪓", text: "Esbirro.", minion: { vida: 3, fuerza: 1, plan: 1 } },
  { id: "guardaespaldas-blindado", name: "Guardaespaldas Blindado", type: "esbirro", boost: 1, glyph: "🛡", text: "Guardia: mientras esté contigo, no puedes atacar al villano.", minion: { vida: 4, fuerza: 2, plan: 0, guardia: true } },
  { id: "embestida", name: "Embestida a Toda Máquina", type: "vinculo", boost: 2, glyph: "🐃", oneShot: true, villainBonus: { fuerza: 2 },
    text: "Vínculo: el villano obtiene +2 Fuerza. Después de su próximo ataque, descártala. Héroe, agota a tu héroe: descártala." },
  { id: "punos-remachados", name: "Puños Remachados", type: "vinculo", boost: 1, glyph: "🔩", villainBonus: { fuerza: 1 },
    text: "Vínculo: el villano obtiene +1 Fuerza. Héroe, agota a tu héroe: descártalos." },
  { id: "piel-acero", name: "Piel de Acero", type: "traicion", boost: 1, glyph: "🪨", text: "El villano obtiene Duro (el próximo daño que reciba se anula). Si ya era Duro: oleada.", reveal: [{ do: "villainTough" }] },
  { id: "arrollar", name: "Arrollar", type: "traicion", boost: 2, glyph: "🦶", text: "El villano se activa contra ti.", reveal: [{ do: "villainActivates" }] },
  { id: "caos-avenida", name: "Caos en la Avenida", type: "plan", boost: 0, glyph: "🚧", text: "Plan secundario (4 amenaza).", sidePlan: { amenaza: 4 } },
  { id: "viejas-cuentas", name: "Viejas Cuentas", type: "traicion", boost: 1, glyph: "🕰", text: "Pon en juego el conjunto némesis de tu héroe (su esbirro se enfrenta a ti). Si no tiene o ya salió: oleada.", reveal: [{ do: "nemesis" }] },
  // Amenaza de Bomba (modular)
  { id: "artefacto-explosivo", name: "Artefacto Explosivo", type: "plan", boost: 0, glyph: "💣", text: "Plan secundario (3 amenaza). Detonación y Falsa Alarma lo alimentan.", sidePlan: { amenaza: 3 } },
  { id: "detonacion", name: "Detonación", type: "traicion", boost: 2, glyph: "💥", text: "Si el Artefacto Explosivo está en juego, estalla: recibes tanto daño como amenaza tenga y se descarta. Si no: oleada.", reveal: [{ do: "detonate", plan: "artefacto-explosivo" }] },
  { id: "falsa-alarma", name: "Falsa Alarma", type: "traicion", boost: 1, glyph: "🚨", text: "Si el Artefacto Explosivo está en juego, gana 2 amenaza. Si no, búscalo y ponlo en juego (si no aparece: oleada).", reveal: [{ do: "armPlan", plan: "artefacto-explosivo", amount: 2 }] },
  { id: "artificiero", name: "Artificiero", type: "esbirro", boost: 1, glyph: "🧨", text: "Esbirro.", minion: { vida: 2, fuerza: 1, plan: 2 } },
  // Experto del Titán
  { id: "carga-brutal", name: "Carga Brutal", type: "traicion", boost: 2, glyph: "🐂", text: "En forma de héroe recibes 3 daño; si no, añade 2 amenaza al plan principal.", reveal: [{ do: "heroDamage", amount: 3, ifIdentity: { do: "addThreat", amount: 2 } }] },
  { id: "bramido", name: "Bramido", type: "traicion", boost: 2, glyph: "📢", text: "El villano obtiene Duro (si ya lo era: oleada) y se activa contra ti.", reveal: [{ do: "villainTough" }, { do: "villainActivates" }] },
  { id: "mercenario-veterano", name: "Mercenario Veterano", type: "esbirro", boost: 2, glyph: "🎯", text: "Guardia: mientras esté contigo, no puedes atacar al villano.", minion: { vida: 5, fuerza: 2, plan: 1, guardia: true } },
  // Némesis de Vanguardia
  { id: "silas-corven", name: "Silas Corven, el Magnate de Hierro", type: "esbirro", boost: 2, glyph: "🎩", text: "Esbirro némesis de Vanguardia.", minion: { vida: 6, fuerza: 2, plan: 2 } },
  { id: "opa-hostil", name: "OPA Hostil", type: "plan", boost: 0, glyph: "📉", text: "Plan secundario némesis (4 amenaza). Aceleración.", sidePlan: { amenaza: 4, aceleracion: true } },
  { id: "sabotaje-industrial", name: "Sabotaje Industrial", type: "traicion", boost: 1, glyph: "🔧", text: "En forma de héroe recibes 2 daño; si no, añade 2 amenaza al plan principal.", reveal: [{ do: "heroDamage", amount: 2, ifIdentity: { do: "addThreat", amount: 2 } }] },
  { id: "junta-accionistas", name: "Junta de Accionistas", type: "obligacion", boost: 1, glyph: "📊",
    text: "Obligación de Iria Montalbán. Elige: acudes (tu héroe queda agotado y pierde su próxima acción) o faltas (añade 2 amenaza al plan principal).",
    reveal: [{ do: "choose", text: "Junta de Accionistas: ¿acudes?", options: [
      { label: "Acudir: tu héroe queda agotado", effects: [{ do: "exhaustHero" }] },
      { label: "Faltar: +2 amenaza al plan principal", effects: [{ do: "addThreat", target: "mainPlan", amount: 2 }] },
    ] }] },
  // Estándar
  { id: "avance-oscuro", name: "Avance Oscuro", type: "traicion", boost: 2, glyph: "⇥", text: "Añade 2 amenaza al plan principal.", reveal: [{ do: "addThreat", target: "mainPlan", amount: 2 }] },
  { id: "emboscada", name: "Emboscada", type: "traicion", boost: 1, glyph: "⚔", text: "En forma de héroe recibes 1 daño; si no, añade 1 amenaza al plan principal.", reveal: [{ do: "heroDamage", amount: 1, ifIdentity: { do: "addThreat", amount: 1 } }] },
  ...SCENARIO_ENCOUNTERS,
];

export const ENCOUNTER_SETS: Record<string, string[]> = {
  titan: ["maton-sueldo", "maton-sueldo", "guardaespaldas-blindado", "embestida", "punos-remachados", "piel-acero", "piel-acero", "arrollar", "arrollar", "caos-avenida", "viejas-cuentas"],
  "amenaza-bomba": ["artefacto-explosivo", "detonacion", "falsa-alarma", "falsa-alarma", "artificiero"],
  "experto-titan": ["carga-brutal", "bramido", "mercenario-veterano"],
  estandar: ["avance-oscuro", "emboscada"],
  ...SCENARIO_SETS,
};

export const SCENARIOS: ScenarioDef[] = [
  {
    id: "asalto-arsenal",
    name: "El Asalto al Arsenal",
    intro: "Mazagón, el Titán Embestidor, ha venido a por el arsenal de Aurelia, y alguien ha dejado una bomba en el mercado. Detén su carga antes de que el arsenal caiga.",
    villain: {
      name: "Mazagón, el Titán Embestidor",
      glyph: "🐃",
      stages: [
        { name: "Mazagón I", vidaPorJugador: 14, fuerza: 2, plan: 1, text: "Golpea fuerte y trama poco." },
        { name: "Mazagón II", vidaPorJugador: 15, fuerza: 3, plan: 1, text: "Al revelarse: busca Embestida a Toda Máquina y vincúlasela.", onReveal: { attach: "embestida" } },
        { name: "Mazagón III", vidaPorJugador: 16, fuerza: 4, plan: 1, text: "Al revelarse: obtiene Duro.", onReveal: { tough: true } },
      ],
      stagesFor: { normal: [0, 1], expert: [1, 2] },
    },
    mainPlan: { name: "El Asalto al Arsenal", inicioPorJugador: 0, aceleracionPorJugador: 1, limitePorJugador: 14, text: "Si llega al límite, Mazagón saquea el arsenal: derrota." },
    encounterSets: ["titan", "amenaza-bomba", "estandar"],
    expertSets: ["experto-titan"],
  },
  ...NEW_SCENARIOS,
];

export const PLAYER_CARDS = new Map(cards.map((c) => [c.id, c]));
export const ENCOUNTER_CARDS = new Map(encounters.map((c) => [c.id, c]));
export const HERO_BY_ID = new Map(HEROES.map((h) => [h.id, h]));
export const SCENARIO_BY_ID = new Map(SCENARIOS.map((s) => [s.id, s]));
