import type { HeroDef, PlayerCardDef } from "../../engine/types";

// Mole Tronante (Dra. Irene Volkova): a nuclear scientist who turns into a living storm of muscle.
// Huge health and Fuerza, a 4-card hand she throws away every turn, and ✊ Físico everywhere: many
// of her cards are better when paid only with ✊. Justicia: she keeps the plans in check.
// 40 cards: 15 hers, 25 Justicia y básicas.

export const MOLE_CARDS: PlayerCardDef[] = [
  { id: "golpe-demoledor", name: "Golpe Demoledor", type: "evento", cost: 1, resources: 1, resType: "fisico", glyph: "👊", payOnly: "fisico",
    text: "Solo se paga con ✊. Héroe. Ataque: inflige a un enemigo tanto daño como tu Fuerza.",
    play: { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "chooseEnemy", amount: 0, fromStat: "fuerza" }] } },
  { id: "puno-cataclismo", name: "Puño Cataclísmico", type: "evento", cost: 3, resources: 1, resType: "fisico", glyph: "💥",
    text: "Héroe. Acción: tu próximo ataque básico de este turno tiene +10 Fuerza. Si la pagaste solo con ✊, ese ataque arrolla (el daño que sobre al derrotar a un esbirro pasa al villano).",
    play: { timing: "action", heroOnly: true, effects: [{ do: "nextAttackBonus", amount: 10, overkillIfOnly: "fisico" }] } },
  { id: "salto-suborbital", name: "Salto Suborbital", type: "evento", cost: 3, resources: 1, resType: "fisico", glyph: "🌠",
    text: "Héroe. Acción: retira 3 amenaza de un plan (5 si la pagaste solo con ✊).",
    play: { timing: "action", heroOnly: true, effects: [{ do: "thwart", target: "choosePlan", amount: 3, onlyPaidBonus: { res: "fisico", amount: 2 } }] } },
  { id: "palmada-sismica", name: "Palmada Sísmica", type: "evento", cost: 3, resources: 1, resType: "fisico", glyph: "👏",
    text: "Héroe. Acción: inflige 3 daño a cada uno de hasta 3 enemigos distintos.",
    play: { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "chooseEnemy", amount: 3 }, { do: "damage", target: "chooseOtherEnemy", amount: 3 }, { do: "damage", target: "chooseOtherEnemy", amount: 3 }] } },
  { id: "fuerza-imparable", name: "Fuerza Imparable", type: "evento", cost: 2, resources: 1, resType: "fisico", glyph: "⚡",
    text: "Héroe. Acción: prepara a tu héroe. Si la pagaste solo con ✊, roba 1 carta.",
    play: { timing: "action", heroOnly: true, effects: [{ do: "readyHero" }, { do: "draw", amount: 1, ifOnlyPaid: "fisico" }] } },
  { id: "furia-sin-limites", name: "Furia sin Límites", type: "recurso", cost: 0, resources: 3, resType: "fisico", glyph: "💢", heroFormOnly: true,
    text: "Recurso: vale ✊✊✊. Solo se gasta en forma de héroe." },
  { id: "laboratorio-gamma", name: "Laboratorio Subterráneo", type: "apoyo", cost: 2, resources: 1, resType: "mental", glyph: "🧪", bonus: { recuperacion: 2 },
    resourceAbility: { res: "mental", amount: 1, identityOnly: true },
    text: "Apoyo. Tu identidad obtiene +2 Recuperación. Identidad: al pagar una carta, agótalo; vale 🧠." },
  { id: "ira-creciente", name: "Ira Creciente", type: "mejora", cost: 1, resources: 1, resType: "fisico", glyph: "🌋", heroOnly: true, discardOnFlip: true, bonus: { fuerza: 1 },
    text: "Héroe. Tu héroe obtiene +1 Fuerza. Se descarta cuando cambias de forma." },
  { id: "piel-indestructible", name: "Piel Indestructible", type: "mejora", cost: 3, resources: 1, resType: "fisico", glyph: "🪨", bonus: { vidaMax: 4 }, retaliate: 1,
    text: "Tu héroe obtiene +4 Vida máxima y Represalia 1." },
  // Fuera del mazo actual (siguen en el álbum).
  { id: "coronel-ruiz", name: "Coronel Ruiz", type: "aliado", cost: 3, resources: 1, resType: "mental", glyph: "🪖",
    text: "Aliado. Apoyo táctico: al entrar en juego, tu héroe obtiene Duro (el próximo daño que reciba se anula). Atacar o contener le cuesta 1 daño.",
    ally: { vida: 4, fuerza: 2, ingenio: 1, consFuerza: 1, consIngenio: 1 }, onPlay: [{ do: "status", status: "tough", target: "self" }] },
  { id: "arrancar-suelo", name: "Arrancar el Suelo", type: "evento", cost: 1, resources: 1, resType: "fisico", glyph: "🏔",
    text: "Héroe. Acción: inflige 1 daño a un enemigo, +1 por cada ✊ que te quede en la mano.", play: { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "chooseEnemy", amount: 1, perHeld: { res: "fisico", amount: 1 } }] } },
];

export const MOLE: HeroDef = {
  id: "mole",
  hero: {
    name: "Mole Tronante", fuerza: 3, ingenio: 0, aguante: 3, mano: 4, discardHandAtEnd: true,
    text: "Furia: al final de tu turno en forma de héroe, descarta toda tu mano antes de robar.",
  },
  identity: { name: "Dra. Irene Volkova", recuperacion: 4, mano: 5, text: "Investigación: una vez por ronda, como acción, roba 1 carta y luego descarta 1 de tu mano." },
  vida: 18,
  heroTraits: ["guardia"],
  identityAbility: { timing: "action", cost: "once", effects: [{ do: "draw", amount: 1 }, { do: "discardFromHand", target: "chooseHandCard" }], text: "Investigación: roba 1 y descarta 1" },
  deck: [
    // 15 de Mole Tronante
    "golpe-demoledor", "golpe-demoledor", "puno-cataclismo", "puno-cataclismo", "salto-suborbital", "salto-suborbital",
    "palmada-sismica", "palmada-sismica", "fuerza-imparable", "fuerza-imparable", "furia-sin-limites", "furia-sin-limites",
    "laboratorio-gamma", "ira-creciente", "piel-indestructible",
    // 16 de Justicia
    "patrulla-barrio", "patrulla-barrio", "patrulla-barrio", "martillo-juez", "rectitud", "rectitud", "olfato-detective",
    "despejar-plaza", "despejar-plaza", "despejar-plaza", "golpe-conmocionante", "golpe-conmocionante", "golpe-conmocionante",
    "ojo-vigilante", "agente-lucero", "contrainteligencia",
    // 9 básicas
    "grajilla-acrobata", "celula-energia", "chispa-genio", "pulso-fuerza", "salon-guardia", "aeronave-mando", "pausa-merecida",
    "nave-guardia", "red-informantes",
  ],
  colour: "#3f8a3a",
  glyph: "💚",
};
