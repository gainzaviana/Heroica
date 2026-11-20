import type { HeroDef, PlayerCardDef } from "../../engine/types";

// Baluarte (Teniente Marcos Alcalá): a veteran of the old Guardia who never yields. His bronze
// Égida blocks anything, flies back to his hand and stuns whoever it hits. Protección: defend,
// stun, hit back. 40 cards: 15 his, 18 Protección, 7 básicas.

export const BALUARTE_CARDS: PlayerCardDef[] = [
  { id: "exploradora-ordonez", name: "Exploradora Ordóñez", type: "aliado", cost: 3, resources: 1, resType: "mental", glyph: "🧭",
    text: "Aliado. Al entrar en juego: retira 2 amenaza de un plan. Atacar o contener le cuesta 1 daño.",
    ally: { vida: 3, fuerza: 1, ingenio: 2, consFuerza: 1, consIngenio: 1 }, onPlay: [{ do: "thwart", target: "choosePlan", amount: 2 }] },
  { id: "determinacion-firme", name: "Determinación Firme", type: "evento", cost: 0, resources: 1, resType: "mental", glyph: "✊",
    text: "Héroe. Acción: tu héroe obtiene +1 Ingenio hasta el final de la fase. Roba 1 carta.",
    play: { timing: "action", heroOnly: true, effects: [{ do: "tempBuff", target: "self", ingenio: 1 }, { do: "draw", amount: 1 }] } },
  { id: "carga-valiente", name: "Carga Valiente", type: "evento", cost: 3, resources: 1, resType: "fisico", glyph: "⚔",
    text: "Héroe. Ataque: inflige 6 daño a un enemigo. Si pagaste con ✊, además queda Aturdido.",
    play: { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "chooseEnemy", amount: 6 }, { do: "ifPaid", res: "fisico", effects: [{ do: "status", status: "stunned", target: "lastTarget" }] }] } },
  { id: "parada-egida", name: "Parada con la Égida", type: "evento", cost: 0, resources: 1, resType: "mental", glyph: "🛡", requiresReady: "egida-bronce",
    text: "Defensa: cuando un ataque te vaya a hacer daño, agota la Égida de Bronce para evitar todo ese daño.",
    play: { timing: "defend", effects: [{ do: "exhaustCard", card: "egida-bronce" }, { do: "prevent", amount: 99 }] } },
  { id: "egida-arrojada", name: "Égida Arrojada", type: "evento", cost: 0, resources: 1, resType: "energia", glyph: "🥏", requiresReady: "egida-bronce",
    text: "Héroe. Ataque: descarta cartas de tu mano para lanzar la Égida a otros tantos enemigos distintos (4 daño a cada uno); luego la Égida vuelve a tu mano.",
    play: { timing: "action", heroOnly: true, effects: [{ do: "shieldThrow", card: "egida-bronce", amount: 4 }] } },
  { id: "buhardilla", name: "La Buhardilla del Teniente", type: "apoyo", cost: 1, resources: 1, resType: "energia", glyph: "🏠",
    text: "Apoyo. Identidad. Acción, agótala: roba 1 carta y cura 1 daño a tu héroe.",
    ability: { timing: "action", cost: "exhaust", identityOnly: true, effects: [{ do: "draw", amount: 1 }, { do: "heal", target: "self", amount: 1 }], text: "Descanso en casa: roba 1, cura 1" } },
  { id: "yelmo-veterano", name: "Yelmo del Veterano", type: "mejora", cost: 1, resources: 1, resType: "fisico", glyph: "⛑", preventDefeat: true,
    text: "Cuando tu héroe vaya a ser derrotado: en vez de eso se queda con 1 vida. Luego descarta esta carta." },
  { id: "egida-bronce", name: "Égida de Bronce", type: "mejora", cost: 1, resources: 1, resType: "comodin", glyph: "🛡", bonus: { aguante: 1 }, retaliate: 1,
    text: "Tu héroe obtiene +1 Aguante y Represalia 1." },
  { id: "elixir-templado", name: "Elixir Templado", type: "mejora", cost: 2, resources: 1, resType: "fisico", glyph: "🧪", resourceAbility: { res: "fisico", amount: 1 },
    text: "Al pagar una carta, agótalo: vale ✊." },
];

export const BALUARTE: HeroDef = {
  id: "baluarte",
  hero: { name: "Baluarte", fuerza: 2, ingenio: 2, aguante: 2, mano: 5, text: "¡Aguanto lo que haga falta!: una vez por ronda, como acción, descarta 1 carta para preparar a tu héroe." },
  identity: { name: "Teniente Marcos Alcalá", recuperacion: 3, mano: 6, text: "Leyenda viva: en tu identidad, el primer aliado que juegues cada ronda cuesta 1 menos. Preparación: empiezas con la Égida de Bronce en la mano." },
  vida: 11,
  heroTraits: ["guardia"],
  ability: { timing: "action", cost: "once", heroOnly: true, payFor: "any", payRequired: true, effects: [{ do: "readyHero" }], text: "¡Aguanto lo que haga falta!" },
  firstAllyDiscount: 1,
  setupTutor: { card: "egida-bronce", discard: true },
  deck: [
    // 15 de Baluarte
    "exploradora-ordonez", "determinacion-firme", "determinacion-firme", "carga-valiente", "carga-valiente", "carga-valiente",
    "parada-egida", "parada-egida", "egida-arrojada", "egida-arrojada", "buhardilla", "yelmo-veterano", "egida-bronce",
    "elixir-templado", "elixir-templado",
    // 18 de Protección
    "lince-espia", "tomas-roca", "reves-certero", "reves-certero", "detras-de-mi", "detras-de-mi", "firmeza", "firmeza",
    "equipo-sanadores", "cota-malla", "indomable", "indomable", "guardia-experta", "guardia-experta",
    "embestida-aturdidora", "embestida-aturdidora", "embestida-aturdidora", "campo-reflector",
    // 7 básicas
    "grajilla-acrobata", "celula-energia", "chispa-genio", "pulso-fuerza", "salon-guardia", "aeronave-mando", "pausa-merecida",
  ],
  colour: "#2f6f8f",
  glyph: "🛡",
};
