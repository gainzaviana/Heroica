import type { HeroDef, PlayerCardDef } from "../../engine/types";

// Centella Estelar (Comandante Elena Saavedra): a pilot who absorbed a star. She stores ⚡ Energía
// to heal and draw, or charges it up for one huge blast. Leadership: allies at her command.

export const CENTELLA_CARDS: PlayerCardDef[] = [
  { id: "canal-energia", name: "Canal de Energía", type: "mejora", cost: 1, resources: 1, resType: "energia", glyph: "🔋",
    text: "Acción: descarta una carta con ⚡ para añadir 1 carga por cada ⚡ que valga. Héroe. Acción: inflige 2 daño por carga a un enemigo y descarta esta carta.",
    abilities: [
      { timing: "action", payFor: "energia", payRequired: true, effects: [{ do: "addCounter", amount: 0, perPaid: "energia" }], text: "Cargar" },
      { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "chooseEnemy", amount: 0, perCounter: 2 }, { do: "discardSelf" }], text: "Descargar: 2 daño por carga" },
    ] },
  { id: "rafaga-fotonica", name: "Ráfaga Fotónica", type: "evento", cost: 2, resources: 1, resType: "energia", glyph: "🌟",
    text: "Héroe. Acción: inflige 3 daño a un enemigo. Si pagaste con ⚡, roba 1 carta.", play: { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "chooseEnemy", amount: 3 }, { do: "draw", amount: 1, ifPaid: "energia" }] } },
  { id: "vuelo-cosmico", name: "Vuelo Cósmico", type: "mejora", cost: 2, resources: 1, resType: "energia", glyph: "🌌", traits: ["aereo"],
    text: "Aéreo. Tu héroe obtiene +1 Aguante. Héroe. Al defenderte, agota esta carta: evita 2 daño.", bonus: { aguante: 1 },
    ability: { timing: "defend", cost: "exhaust", heroOnly: true, effects: [{ do: "prevent", amount: 2 }], text: "Esquiva estelar: evita 2" } },
  { id: "absorcion-energia", name: "Absorción de Energía", type: "evento", cost: 1, resources: 1, resType: "energia", glyph: "🌀",
    text: "Héroe. Al defenderte: evita 3 daño y cura 1 a tu héroe.", play: { timing: "defend", heroOnly: true, effects: [{ do: "prevent", amount: 3 }, { do: "heal", target: "self", amount: 1 }] } },
  { id: "impacto-binario", name: "Impacto Binario", type: "evento", cost: 3, resources: 1, resType: "fisico", glyph: "☄",
    text: "Héroe. Acción: inflige 5 daño a un enemigo.", play: { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "chooseEnemy", amount: 5 }] } },
  { id: "base-orbital", name: "Base Orbital", type: "apoyo", cost: 2, resources: 1, resType: "mental", glyph: "🛰",
    text: "Apoyo. Acción, agota esta carta: roba 1 carta.", ability: { timing: "action", cost: "exhaust", effects: [{ do: "draw", amount: 1 }], text: "Informe orbital: roba 1" } },
  { id: "teniente-okafor", name: "Teniente Okafor", type: "aliado", cost: 3, resources: 1, resType: "mental", glyph: "👩‍✈️",
    text: "Aliado. Atacar o contener le cuesta 1 daño.", ally: { vida: 3, fuerza: 2, ingenio: 1, consFuerza: 1, consIngenio: 1 } },
  { id: "energia-binaria", name: "Energía Binaria", type: "mejora", cost: 2, resources: 1, resType: "energia", glyph: "✴",
    text: "Tu héroe obtiene +1 Fuerza y +2 Vida máxima.", bonus: { fuerza: 1, vidaMax: 2 } },
  { id: "pulso-cosmico", name: "Pulso Cósmico", type: "recurso", cost: 0, resources: 2, resType: "energia", glyph: "💫", text: "Recurso: vale ⚡⚡ al pagar una carta." },
  { id: "supernova", name: "Supernova", type: "evento", cost: 4, resources: 1, resType: "energia", glyph: "🌞",
    text: "Héroe. Acción: inflige 3 daño al villano y a cada esbirro.", play: { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "allEnemies", amount: 3 }] } },
];

export const CENTELLA: HeroDef = {
  id: "centella",
  hero: { name: "Centella Estelar", fuerza: 2, ingenio: 1, aguante: 1, mano: 5, text: "Recanalizar: una vez por ronda, como acción, descarta una carta con ⚡ para curar 1 y robar 1." },
  identity: { name: "Comandante Elena Saavedra", recuperacion: 4, mano: 6, text: "Al mando: una vez por ronda, como acción, roba 1 carta." },
  vida: 12,
  ability: { timing: "action", cost: "once", payFor: "energia", payRequired: true, effects: [{ do: "heal", target: "self", amount: 1 }, { do: "draw", amount: 1 }], text: "Recanalizar" },
  identityAbility: { timing: "action", cost: "once", effects: [{ do: "draw", amount: 1 }], text: "Al mando: roba 1" },
  deck: [
    // 15 de Centella
    "canal-energia", "rafaga-fotonica", "rafaga-fotonica", "rafaga-fotonica", "vuelo-cosmico", "absorcion-energia", "absorcion-energia",
    "impacto-binario", "impacto-binario", "base-orbital", "teniente-okafor", "energia-binaria", "pulso-cosmico", "pulso-cosmico", "supernova",
    // 25 de Liderazgo y básicas
    "capitana-fernandez", "mago-errante", "doctora-ignis", "mercenario-posada", "aldeana-valiente", "halcon-plateado",
    "hacer-llamada", "arenga", "arenga", "liderar-ejemplo", "toque-reunion", "toque-reunion", "plan-equipo", "plan-equipo",
    "vigilancia", "vigilancia", "golpe-certero", "respiro", "pocion-curacion", "por-aurelia", "botiquin-campo",
    "celula-energia", "celula-energia", "inspiracion", "inspiracion",
  ],
  colour: "#d9a21b",
  glyph: "⭐",
};
