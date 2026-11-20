import type { HeroDef, PlayerCardDef } from "../../engine/types";

// Centella Estelar (Comandante Elena Saavedra): a pilot who absorbed a star. She spends ⚡ Energía to
// heal and draw, flies (Aéreo) to reach two plans at once, and charges up for one huge blast.
// Leadership: allies of the Guardia de Aurelia at her command. 40 cards: 15 hers, 25 Liderazgo y básicas.

export const CENTELLA_CARDS: PlayerCardDef[] = [
  { id: "teniente-okafor", name: "Teniente Okafor", type: "aliado", cost: 3, resources: 1, resType: "comodin", glyph: "👩‍✈️", traits: ["guardia", "espia"],
    text: "Aliado. Guardia de Aurelia, Espía. Al entrar en juego: el villano queda Confundido. Atacar o contener le cuesta 1 daño.",
    ally: { vida: 2, fuerza: 2, ingenio: 2, consFuerza: 1, consIngenio: 1 }, onPlay: [{ do: "status", status: "confused", target: "villain" }] },
  { id: "interceptar-crisis", name: "Interceptar la Crisis", type: "evento", cost: 2, resources: 1, resType: "energia", glyph: "🛑",
    text: "Héroe. Acción: retira 2 amenaza de un plan. Luego, si tienes Aéreo, retira 2 amenaza de otro plan distinto.",
    play: { timing: "action", heroOnly: true, effects: [{ do: "thwart", target: "choosePlan", amount: 2 }, { do: "ifHeroTrait", trait: "aereo", effects: [{ do: "thwart", target: "chooseOtherPlan", amount: 2 }] }] } },
  { id: "rafaga-fotonica", name: "Ráfaga Fotónica", type: "evento", cost: 3, resources: 1, resType: "fisico", glyph: "🌟",
    text: "Héroe. Ataque: inflige 5 daño a un enemigo. Si pagaste con ⚡, roba 1 carta.", play: { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "chooseEnemy", amount: 5 }, { do: "draw", amount: 1, ifPaid: "energia" }] } },
  { id: "absorcion-energia", name: "Absorción de Energía", type: "recurso", cost: 0, resources: 3, resType: "energia", glyph: "🌀",
    text: "Recurso: vale ⚡⚡⚡ al pagar una carta." },
  { id: "base-orbital", name: "Base Orbital", type: "apoyo", cost: 1, resources: 1, resType: "mental", glyph: "🛰",
    text: "Apoyo. Acción, agótala y descarta una carta de tu mano: roba 1 carta (2 si estás en tu identidad).",
    ability: { timing: "action", cost: "exhaust", payFor: "any", payRequired: true, effects: [{ do: "draw", amount: 1 }, { do: "ifForm", form: "identidad", effects: [{ do: "draw", amount: 1 }] }], text: "Informe orbital" } },
  { id: "energia-binaria", name: "Energía Binaria", type: "mejora", cost: 2, resources: 1, resType: "fisico", glyph: "✴",
    text: "Tu héroe obtiene +1 Aguante (+2 si tienes Aéreo).", bonus: { aguante: 1 }, bonusIfTrait: { trait: "aereo", bonus: { aguante: 1 } } },
  { id: "vuelo-cosmico", name: "Vuelo Cósmico", type: "mejora", cost: 2, resources: 1, resType: "energia", glyph: "🌌", traits: ["aereo"],
    text: "Tu héroe obtiene Aéreo. Héroe. Cuando un ataque te vaya a hacer daño: descarta esta carta para evitar 3 de ese daño.",
    ability: { timing: "defend", heroOnly: true, effects: [{ do: "prevent", amount: 3 }, { do: "discardSelf" }], text: "Esquiva estelar: evita 3" } },
  { id: "canal-energia", name: "Canal de Energía", type: "mejora", cost: 0, resources: 1, resType: "mental", glyph: "🔋", maxInPlay: 1,
    text: "Una por jugador. Acción: descarta cartas con ⚡ para poner 1 carga por cada ⚡. Héroe. Ataque: descarta esta carta para infligir 2 daño por carga a un enemigo (máximo 10).",
    abilities: [
      { timing: "action", payFor: "energia", payRequired: true, effects: [{ do: "addCounter", amount: 0, perPaid: "energia" }], text: "Cargar" },
      { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "chooseEnemy", amount: 0, perCounter: 2, max: 10 }, { do: "discardSelf" }], text: "Descargar: 2 daño por carga" },
    ] },
  // Fuera del mazo actual (siguen en el álbum).
  { id: "impacto-binario", name: "Impacto Binario", type: "evento", cost: 3, resources: 1, resType: "fisico", glyph: "☄",
    text: "Héroe. Acción: inflige 5 daño a un enemigo.", play: { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "chooseEnemy", amount: 5 }] } },
  { id: "pulso-cosmico", name: "Pulso Cósmico", type: "recurso", cost: 0, resources: 2, resType: "energia", glyph: "💫", text: "Recurso: vale ⚡⚡ al pagar una carta." },
  { id: "supernova", name: "Supernova", type: "evento", cost: 4, resources: 1, resType: "energia", glyph: "🌞",
    text: "Héroe. Acción: inflige 3 daño al villano y a cada esbirro.", play: { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "allEnemies", amount: 3 }] } },
];

export const CENTELLA: HeroDef = {
  id: "centella",
  hero: { name: "Centella Estelar", fuerza: 2, ingenio: 2, aguante: 1, mano: 5, text: "Recanalizar: una vez por ronda, como acción, descarta una carta con ⚡ para curar 1 y robar 1." },
  identity: { name: "Comandante Elena Saavedra", recuperacion: 4, mano: 6, text: "Al mando: una vez por ronda, como acción, un jugador roba 1 carta." },
  vida: 12,
  heroTraits: ["guardia"],
  ability: { timing: "action", cost: "once", payFor: "energia", payRequired: true, effects: [{ do: "heal", target: "self", amount: 1 }, { do: "draw", amount: 1 }], text: "Recanalizar" },
  identityAbility: { timing: "action", cost: "once", effects: [{ do: "draw", amount: 1, target: "choosePlayer" }], text: "Al mando: roba 1" },
  deck: [
    // 15 de Centella
    "teniente-okafor", "interceptar-crisis", "interceptar-crisis", "interceptar-crisis",
    "rafaga-fotonica", "rafaga-fotonica", "rafaga-fotonica", "absorcion-energia", "absorcion-energia",
    "base-orbital", "energia-binaria", "vuelo-cosmico", "vuelo-cosmico", "canal-energia", "canal-energia",
    // 13 de Liderazgo
    "arquero-campanario", "comisaria-vega", "automata-cristal", "al-frente", "al-frente", "don-mando", "don-mando",
    "bastion-consejo", "vigia-alado", "nuez-picara", "guardia-formacion", "unidos-mas", "unidos-mas",
    // 12 básicas
    "director-umbral", "vendaje-rapido", "celula-energia", "chispa-genio", "pulso-fuerza", "salon-guardia", "aeronave-mando",
    "torre-guardia", "insignia-guardia", "insignia-guardia", "reflejos-afilados", "reflejos-afilados",
  ],
  colour: "#d9a21b",
  glyph: "⭐",
};
