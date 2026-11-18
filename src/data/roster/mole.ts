import type { HeroDef, PlayerCardDef } from "../../engine/types";

// Mole Tronante (Dra. Irene Volkova): a nuclear scientist who turns into a living storm of muscle.
// Huge health and Fuerza, a tiny hand she throws away every turn, and ✊ Físico everywhere.

export const MOLE_CARDS: PlayerCardDef[] = [
  { id: "golpe-demoledor", name: "Golpe Demoledor", type: "evento", cost: 2, resources: 1, resType: "fisico", glyph: "👊",
    text: "Héroe. Acción: inflige 2 daño a un enemigo, +1 por cada ✊ con que pagues.", play: { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "chooseEnemy", amount: 2, perPaid: { res: "fisico", amount: 1 } }] } },
  { id: "palmada-sismica", name: "Palmada Sísmica", type: "evento", cost: 3, resources: 1, resType: "fisico", glyph: "👏",
    text: "Héroe. Acción: inflige 2 daño al villano y a cada esbirro.", play: { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "allEnemies", amount: 2 }] } },
  { id: "salto-suborbital", name: "Salto Suborbital", type: "evento", cost: 2, resources: 1, resType: "energia", glyph: "🌠",
    text: "Héroe. Acción: retira 3 amenaza de un plan. Si pagaste con ✊, inflige además 1 daño a cada esbirro.",
    play: { timing: "action", heroOnly: true, effects: [{ do: "thwart", target: "choosePlan", amount: 3 }, { do: "damage", target: "allMinions", amount: 0, paidBonus: { res: "fisico", amount: 1 } }] } },
  { id: "fuerza-imparable", name: "Fuerza Imparable", type: "evento", cost: 1, resources: 1, resType: "fisico", glyph: "💥",
    text: "Héroe. Acción: prepara a tu héroe.", play: { timing: "action", heroOnly: true, effects: [{ do: "readyHero" }] } },
  { id: "furia-sin-limites", name: "Furia sin Límites", type: "recurso", cost: 0, resources: 2, resType: "fisico", glyph: "💢", text: "Recurso: vale ✊✊ al pagar una carta." },
  { id: "laboratorio-gamma", name: "Laboratorio Subterráneo", type: "apoyo", cost: 2, resources: 1, resType: "mental", glyph: "🧪",
    text: "Apoyo. Identidad. Acción, agota esta carta: roba 1 carta y cura 2 daño a tu héroe.",
    ability: { timing: "action", cost: "exhaust", identityOnly: true, effects: [{ do: "draw", amount: 1 }, { do: "heal", target: "self", amount: 2 }], text: "Investigar: roba 1 y cura 2" } },
  { id: "coronel-ruiz", name: "Coronel Ruiz", type: "aliado", cost: 3, resources: 1, resType: "mental", glyph: "🪖",
    text: "Aliado. Atacar o contener le cuesta 1 daño.", ally: { vida: 4, fuerza: 2, ingenio: 1, consFuerza: 1, consIngenio: 1 } },
  { id: "piel-indestructible", name: "Piel Indestructible", type: "mejora", cost: 2, resources: 1, resType: "fisico", glyph: "🪨",
    text: "Tu héroe obtiene +1 Aguante y +3 Vida máxima.", bonus: { aguante: 1, vidaMax: 3 } },
  { id: "arrancar-suelo", name: "Arrancar el Suelo", type: "evento", cost: 1, resources: 1, resType: "fisico", glyph: "🏔",
    text: "Héroe. Acción: inflige 1 daño a un enemigo, +1 por cada ✊ que te quede en la mano.", play: { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "chooseEnemy", amount: 1, perHeld: { res: "fisico", amount: 1 } }] } },
];

export const MOLE: HeroDef = {
  id: "mole",
  hero: {
    name: "Mole Tronante", fuerza: 3, ingenio: 1, aguante: 2, mano: 4, discardHandAtEnd: true,
    text: "Furia: al final de tu turno en forma de héroe, descarta toda tu mano antes de robar.",
  },
  identity: { name: "Dra. Irene Volkova", recuperacion: 4, mano: 6, text: "Científica nuclear. Cuando la furia se calma, piensa con claridad." },
  vida: 18,
  deck: [
    // 15 de Mole Tronante
    "golpe-demoledor", "golpe-demoledor", "golpe-demoledor", "palmada-sismica", "palmada-sismica",
    "salto-suborbital", "salto-suborbital", "fuerza-imparable", "fuerza-imparable", "furia-sin-limites", "furia-sin-limites",
    "laboratorio-gamma", "coronel-ruiz", "piel-indestructible", "arrancar-suelo",
    // 25 de Furia y básicas
    "torvo-iracundo", "zarpa-cazadora", "halcon-plateado", "embate-frontal", "embate-frontal", "furia-imparable", "furia-imparable",
    "golpe-certero", "golpe-certero", "contraataque", "contraataque", "respiro", "instinto-combate", "instinto-combate",
    "sala-entrenamiento", "persecucion", "por-aurelia", "botiquin-campo", "mercenario-posada", "escudo-ciudad", "aldeana-valiente",
    "vigilancia", "vigilancia", "pulso-fuerza", "pulso-fuerza",
  ],
  colour: "#3f8a3a",
  glyph: "💚",
};
