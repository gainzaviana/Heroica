import type { HeroDef, PlayerCardDef } from "../../engine/types";

// Soberano de Oricalco (Rey Adisa Mbeki): the king of Oricalcia, the golden city, armoured in living
// metal. Four Oricalco upgrades that "¡Por Oricalcia!" fires all at once. Protección: defence and payback.

const porOricalcia = (id: string, resType: PlayerCardDef["resType"]): PlayerCardDef => ({
  id, name: "¡Por Oricalcia!", type: "evento", cost: 1, resources: 1, resType, glyph: "👑",
  text: "Héroe. Acción: resuelve la acción de cada mejora Oricalco que tengas en juego (sin agotarlas). La que elijas como principal gana +1.",
  play: { timing: "action", heroOnly: true, effects: [{ do: "triggerAll", trait: "oricalco", primaryBonus: 1 }] },
});

export const SOBERANO_CARDS: PlayerCardDef[] = [
  { id: "garras-oricalco", name: "Garras de Oricalco", type: "mejora", cost: 1, resources: 1, resType: "fisico", glyph: "🐾", traits: ["oricalco"],
    text: "Oricalco. Héroe. Acción, agota esta carta: inflige 2 daño a un enemigo.",
    ability: { timing: "action", cost: "exhaust", heroOnly: true, effects: [{ do: "damage", target: "chooseEnemy", amount: 2 }], text: "Zarpazo: 2 daño" } },
  { id: "traje-reflectante", name: "Traje Reflectante", type: "mejora", cost: 2, resources: 1, resType: "energia", glyph: "🥋", traits: ["oricalco"], bonus: { aguante: 1 }, retaliate: 1,
    text: "Oricalco. +1 Aguante. Represalia 1. Héroe. Acción, agota esta carta: cura 2 daño a tu héroe.",
    ability: { timing: "action", cost: "exhaust", heroOnly: true, effects: [{ do: "heal", target: "self", amount: 2 }], text: "Absorber el impacto: cura 2" } },
  { id: "ordenador-tactico", name: "Ordenador Táctico", type: "mejora", cost: 2, resources: 1, resType: "mental", glyph: "💻", traits: ["oricalco"],
    text: "Oricalco. Acción, agota esta carta: retira 1 amenaza de un plan.",
    ability: { timing: "action", cost: "exhaust", effects: [{ do: "thwart", target: "choosePlan", amount: 1 }], text: "Análisis: retira 1 amenaza" } },
  { id: "dagas-oricalco", name: "Dagas de Oricalco", type: "mejora", cost: 2, resources: 1, resType: "fisico", glyph: "🗡", traits: ["oricalco"],
    text: "Oricalco. Héroe. Acción, agota esta carta: inflige 1 daño a cada esbirro.",
    ability: { timing: "action", cost: "exhaust", heroOnly: true, effects: [{ do: "damage", target: "allMinions", amount: 1 }], text: "Lluvia de dagas: 1 a cada esbirro" } },
  porOricalcia("por-oricalcia-e", "energia"),
  porOricalcia("por-oricalcia-m", "mental"),
  porOricalcia("por-oricalcia-f", "fisico"),
  porOricalcia("por-oricalcia-c", "comodin"),
  { id: "ciudad-dorada", name: "La Ciudad Dorada", type: "apoyo", cost: 3, resources: 1, resType: "mental", glyph: "🏛",
    text: "Apoyo. Identidad. Acción, agota esta carta: roba 2 cartas.", ability: { timing: "action", cost: "exhaust", identityOnly: true, effects: [{ do: "draw", amount: 2 }], text: "Consejo real: roba 2" } },
  { id: "oricalco-puro", name: "Oricalco Puro", type: "recurso", cost: 0, resources: 2, resType: "comodin", glyph: "🪙", text: "Recurso: vale 🌟🌟 (cualquier tipo) al pagar una carta." },
  { id: "zola-ingeniera", name: "Zola, Ingeniera Real", type: "aliado", cost: 3, resources: 1, resType: "mental", glyph: "👩‍🔬",
    text: "Aliado. Atacar o contener le cuesta 1 daño.", ally: { vida: 3, fuerza: 1, ingenio: 2, consFuerza: 1, consIngenio: 1 } },
  { id: "hierba-ancestral", name: "Hierba Ancestral", type: "mejora", cost: 1, resources: 1, resType: "mental", glyph: "🌿",
    text: "Tu héroe obtiene +3 Vida máxima.", bonus: { vidaMax: 3 } },
  { id: "postura-guardian", name: "Postura del Guardián", type: "evento", cost: 1, resources: 1, resType: "energia", glyph: "🛡",
    text: "Héroe. Al defenderte: evita 3 daño.", play: { timing: "defend", heroOnly: true, effects: [{ do: "prevent", amount: 3 }] } },
];

export const SOBERANO: HeroDef = {
  id: "soberano",
  hero: { name: "Soberano de Oricalco", fuerza: 2, ingenio: 2, aguante: 1, mano: 5, text: "Preparación: empiezas la partida con Garras de Oricalco en la mano." },
  identity: { name: "Rey Adisa Mbeki", recuperacion: 3, mano: 6, text: "Gobernante de Oricalcia, la ciudad dorada." },
  vida: 11,
  setupToHand: "garras-oricalco",
  deck: [
    // 15 de Soberano
    "garras-oricalco", "traje-reflectante", "ordenador-tactico", "dagas-oricalco",
    "por-oricalcia-e", "por-oricalcia-m", "por-oricalcia-f", "por-oricalcia-c",
    "ciudad-dorada", "oricalco-puro", "oricalco-puro", "zola-ingeniera", "hierba-ancestral", "postura-guardian", "postura-guardian",
    // 25 de Protección y básicas
    "bloqueo-perfecto", "bloqueo-perfecto", "desvio", "desvio", "aguantar-golpe", "aguantar-golpe", "coraza-puas", "plan-equipo",
    "armadura-combate", "voluntad-hierro", "voluntad-hierro", "escudero-fiel", "centinela-real",
    "contraataque", "contraataque", "escudo-ciudad", "vigilancia", "vigilancia", "golpe-certero", "golpe-certero",
    "respiro", "pocion-curacion", "botiquin-campo", "pulso-fuerza", "pulso-fuerza",
  ],
  colour: "#6b3fa0",
  glyph: "👑",
};
