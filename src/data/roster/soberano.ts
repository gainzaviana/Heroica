import type { HeroDef, PlayerCardDef } from "../../engine/types";

// Soberano de Oricalco (Rey Adisa Mbeki): the king of Oricalcia, the golden city, armoured in living
// metal. Four Oricalco upgrades whose special abilities only "¡Por Oricalcia!" fires, all of them in
// a row; the last one in the sequence hits harder. Liderazgo: allies of the Guardia de Aurelia.
// 40 cards: 15 his, 25 Liderazgo y básicas.

const porOricalcia = (id: string, resType: PlayerCardDef["resType"]): PlayerCardDef => ({
  id, name: "¡Por Oricalcia!", type: "evento", cost: 1, resources: 1, resType, glyph: "👑",
  text: "Héroe. Acción: resuelve la capacidad especial de cada mejora Oricalco que tengas en juego, una tras otra; la última de la secuencia gana su bonificación.",
  play: { timing: "action", heroOnly: true, effects: [{ do: "triggerAll", trait: "oricalco", primaryBonus: 1 }] },
});

export const SOBERANO_CARDS: PlayerCardDef[] = [
  { id: "zola-ingeniera", name: "Zola, Ingeniera Real", type: "aliado", cost: 2, resources: 1, resType: "fisico", glyph: "👩‍🔬",
    text: "Aliado. Al entrar en juego: busca una mejora en tu mazo y añádela a tu mano. Atacar o contener le cuesta 1 daño.",
    ally: { vida: 3, fuerza: 1, ingenio: 1, consFuerza: 1, consIngenio: 1 }, onPlay: [{ do: "tutor", type: "mejora" }] },
  { id: "hierba-ancestral", name: "Hierba Ancestral", type: "evento", cost: 1, resources: 1, resType: "mental", glyph: "🌿", identityOnly: true,
    text: "Identidad. Acción: devuelve hasta 3 cartas de tu descarte a tu mazo y barájalo.",
    play: { timing: "action", effects: [{ do: "recycle" }, { do: "recycle" }, { do: "recycle" }] } },
  porOricalcia("por-oricalcia-e", "energia"),
  porOricalcia("por-oricalcia-m", "mental"),
  porOricalcia("por-oricalcia-f", "fisico"),
  porOricalcia("por-oricalcia-c", "comodin"),
  { id: "oricalco-puro", name: "Oricalco Puro", type: "recurso", cost: 0, resources: 2, resType: "comodin", glyph: "🪙", text: "Recurso: vale 🌟🌟 (cualquier tipo) al pagar una carta." },
  { id: "ciudad-dorada", name: "La Ciudad Dorada", type: "apoyo", cost: 2, resources: 1, resType: "energia", glyph: "🏛",
    text: "Apoyo. Identidad. Acción, agota esta carta: roba 2 cartas.", ability: { timing: "action", cost: "exhaust", identityOnly: true, effects: [{ do: "draw", amount: 2 }], text: "Consejo real: roba 2" } },
  { id: "dagas-oricalco", name: "Dagas de Oricalco", type: "mejora", cost: 2, resources: 1, resType: "mental", glyph: "🗡", traits: ["oricalco"],
    text: "Oricalco. Especial: inflige 1 daño al villano y a cada esbirro (2 si es el último paso).",
    ability: { timing: "special", lastBonus: 1, lastBonusAll: true, effects: [{ do: "damage", target: "villain", amount: 1 }, { do: "damage", target: "allMinions", amount: 1 }], text: "Lluvia de dagas: 1 al villano y a cada esbirro (2 si es la última)" } },
  { id: "garras-oricalco", name: "Garras de Oricalco", type: "mejora", cost: 2, resources: 1, resType: "energia", glyph: "🐾", traits: ["oricalco"],
    text: "Oricalco. Especial (ataque): inflige 2 daño a un enemigo (4 si es el último paso).",
    ability: { timing: "special", lastBonus: 2, effects: [{ do: "damage", target: "chooseEnemy", amount: 2 }], text: "Zarpazo: 2 daño (4 si es la última)" } },
  { id: "ordenador-tactico", name: "Ordenador Táctico", type: "mejora", cost: 2, resources: 1, resType: "fisico", glyph: "💻", traits: ["oricalco"],
    text: "Oricalco. Especial: retira 1 amenaza de un plan (2 si es el último paso).",
    ability: { timing: "special", lastBonus: 1, effects: [{ do: "thwart", target: "choosePlan", amount: 1 }], text: "Análisis: retira 1 (2 si es la última)" } },
  { id: "traje-reflectante", name: "Traje Reflectante", type: "mejora", cost: 2, resources: 1, resType: "mental", glyph: "🥋", traits: ["oricalco"],
    text: "Oricalco. Especial (ataque): traslada 1 daño de tu héroe a un enemigo (2 si es el último paso).",
    ability: { timing: "special", lastBonus: 1, effects: [{ do: "moveDamage", target: "chooseEnemy", amount: 1 }], text: "Devolver el golpe: traslada 1 daño (2 si es la última)" } },
  // Fuera del mazo actual (sigue en el álbum).
  { id: "postura-guardian", name: "Postura del Guardián", type: "evento", cost: 1, resources: 1, resType: "energia", glyph: "🛡",
    text: "Héroe. Al defenderte: evita 3 daño.", play: { timing: "defend", heroOnly: true, effects: [{ do: "prevent", amount: 3 }] } },
];

export const SOBERANO: HeroDef = {
  id: "soberano",
  hero: { name: "Soberano de Oricalco", fuerza: 2, ingenio: 2, aguante: 2, mano: 5, retaliate: 1, text: "Represalia 1: después de que un enemigo te ataque, recibe 1 daño." },
  identity: { name: "Rey Adisa Mbeki", recuperacion: 4, mano: 6, text: "Previsión: al preparar la partida, elige una mejora Oricalco de tu mazo para tu mano." },
  vida: 11,
  heroTraits: ["guardia"],
  setupTutor: { trait: "oricalco", type: "mejora" },
  deck: [
    // 15 de Soberano
    "zola-ingeniera", "hierba-ancestral",
    "por-oricalcia-e", "por-oricalcia-m", "por-oricalcia-f", "por-oricalcia-c", "por-oricalcia-c",
    "oricalco-puro", "oricalco-puro", "oricalco-puro", "ciudad-dorada",
    "dagas-oricalco", "garras-oricalco", "ordenador-tactico", "traje-reflectante",
    // 15 de Liderazgo
    "arquero-campanario", "comisaria-vega", "automata-cristal", "llamada-refuerzos", "llamada-refuerzos", "llamada-refuerzos",
    "bastion-consejo", "vigia-alado", "nuez-picara", "gedeon-rubi", "unidos-mas", "unidos-mas", "unidos-mas",
    "esquife-veloz", "esquife-veloz",
    // 10 básicas
    "director-umbral", "celula-energia", "chispa-genio", "pulso-fuerza", "salon-guardia", "salon-guardia", "aeronave-mando",
    "torre-guardia", "reflejos-afilados", "reflejos-afilados",
  ],
  colour: "#6b3fa0",
  glyph: "👑",
};
