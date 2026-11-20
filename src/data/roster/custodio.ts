import type { Effect, HeroDef, PlayerCardDef } from "../../engine/types";

// Custodio del Umbral (Dra. Noa Ferrán): a surgeon who became the keeper of the threshold between
// worlds. Besides her deck she has an invocation deck of 5 great spells; she pays the top one's cost
// to unleash it. Liderazgo: a swarm of allies. 40 cards: 15 hers, 19 Liderazgo, 6 básicas (+5 de invocación).

const invocation = (id: string, name: string, cost: number, glyph: string, text: string, effects: Effect[]): PlayerCardDef => ({
  id, name, type: "evento", cost, resources: 0, resType: "comodin", glyph, traits: ["invocacion"],
  text: `Invocación (coste ${cost}). ${text}`, play: { timing: "special", effects },
});

export const CUSTODIO_INVOCATION: PlayerCardDef[] = [
  invocation("inv-cadenas", "Cadenas de Ámbar", 2, "⛓", "Aturde a un enemigo e inflígele 7 daño.", [{ do: "status", status: "stunned", target: "chooseEnemy" }, { do: "damage", target: "lastTarget", amount: 7 }]),
  invocation("inv-espejismos", "Espejismos de Ilvar", 1, "🪞", "El villano queda Confundido y retiras 3 amenaza de un plan.", [{ do: "status", status: "confused", target: "villain" }, { do: "thwart", target: "choosePlan", amount: 3 }]),
  invocation("inv-sellos", "Siete Sellos Protectores", 1, "🔯", "Tu héroe y hasta 2 de tus aliados obtienen Duro.", [{ do: "toughParty", max: 3 }]),
  invocation("inv-brumas", "Brumas del Cambio", 0, "🌫", "Cambia un estado: el Duro de un enemigo pasa a Aturdido.", [{ do: "swapStatus", target: "chooseEnemy", from: ["tough", "confused"], to: "stunned" }]),
  invocation("inv-vientos", "Vientos del Saber", 0, "🌬", "Roba 3 cartas.", [{ do: "draw", amount: 3 }]),
];

export const CUSTODIO_CARDS: PlayerCardDef[] = [
  { id: "tobias-bibliotecario", name: "Tobías, el Bibliotecario", type: "aliado", cost: 3, resources: 1, resType: "comodin", glyph: "📚", traits: ["mistico"],
    text: "Aliado. Acción, agótalo: cura 1 daño a tu héroe o descarta la primera carta de tu mazo de invocación. Atacar o contener le cuesta 1 daño.",
    ally: { vida: 3, fuerza: 2, ingenio: 1, consFuerza: 1, consIngenio: 1 },
    ability: { timing: "action", cost: "exhaust", text: "Consejo del bibliotecario", effects: [{ do: "choose", text: "Tobías: ¿qué hace?", options: [
      { label: "Curar 1 a tu héroe", effects: [{ do: "heal", target: "self", amount: 1 }] },
      { label: "Pasar la invocación de arriba", effects: [{ do: "cycleInvocation" }] },
    ] }] } },
  { id: "viaje-astral", name: "Viaje Astral", type: "evento", cost: 2, resources: 1, resType: "mental", glyph: "👻", traits: ["hechizo"],
    text: "Héroe. Acción: retira 3 amenaza de un plan y mira la primera carta de encuentros: retira 1 más de ese plan por cada ⭐ que tenga.",
    play: { timing: "action", heroOnly: true, effects: [{ do: "thwart", target: "choosePlan", amount: 3 }, { do: "thwartByBoost", target: "lastPlan" }] } },
  { id: "descarga-arcana", name: "Descarga Arcana", type: "evento", cost: 3, resources: 1, resType: "energia", glyph: "✴", traits: ["hechizo"],
    text: "Héroe. Ataque: inflige 5 daño a un enemigo y descarta la primera carta de tu mazo. ✊: queda Aturdido. ⚡: +2 daño. 🧠: queda Confundido. 🌟: las tres.",
    play: { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "chooseEnemy", amount: 5 }, { do: "mill", amount: 1, labels: { fisico: "✊ Aturdido", energia: "⚡ +2 daño", mental: "🧠 Confundido" }, branches: {
      fisico: [{ do: "status", status: "stunned", target: "lastTarget" }],
      energia: [{ do: "damage", target: "lastTarget", amount: 2 }],
      mental: [{ do: "status", status: "confused", target: "lastTarget" }],
    } }] } },
  { id: "maestria-arcana", name: "Maestría Arcana", type: "evento", cost: 1, resources: 1, resType: "mental", glyph: "📜",
    text: "Héroe. Acción: paga el coste de la primera carta de tu mazo de invocación y resuélvela; luego vuelve arriba del mazo de invocación.",
    play: { timing: "action", heroOnly: true, effects: [{ do: "invoke", putBack: true }] } },
  { id: "estudio-grimorio", name: "Estudio del Grimorio", type: "evento", cost: 1, resources: 1, resType: "fisico", glyph: "📖", identityOnly: true,
    text: "Identidad. Acción: busca una carta propia del Custodio en tu mazo y tu descarte y añádela a tu mano.",
    play: { timing: "action", effects: [{ do: "tutor", ownCards: true, discard: true }] } },
  { id: "salvaguarda-runica", name: "Salvaguarda Rúnica", type: "evento", cost: 1, resources: 1, resType: "fisico", glyph: "🔰", traits: ["hechizo"],
    text: "Héroe. Cuando se revele una traición contra ti: anula todos sus efectos y descártala.", play: { timing: "treachery", heroOnly: true, effects: [] } },
  { id: "torre-umbral", name: "La Torre del Umbral", type: "apoyo", cost: 1, resources: 1, resType: "mental", glyph: "🗼",
    text: "Apoyo. Identidad. Acción, agótala: devuelve un Hechizo de tu descarte a tu mazo, barájalo y roba 1 carta.",
    ability: { timing: "action", cost: "exhaust", identityOnly: true, effects: [{ do: "recycle", trait: "hechizo" }, { do: "draw", amount: 1 }], text: "Biblioteca del Umbral" } },
  { id: "capa-errante", name: "Capa Errante", type: "mejora", cost: 2, resources: 1, resType: "fisico", glyph: "🧣", traits: ["aereo"],
    text: "Tu héroe obtiene Aéreo. Héroe. Acción, agótala: prepara a tu héroe.",
    ability: { timing: "action", cost: "exhaust", heroOnly: true, effects: [{ do: "readyHero" }], text: "Vuelo de la capa: prepárate" } },
  { id: "hechizo-potencia", name: "Hechizo de Potencia", type: "mejora", cost: 1, resources: 1, resType: "energia", glyph: "💠", traits: ["hechizo"], temporary: true, bonus: { fuerza: 1, ingenio: 1, aguante: 1 },
    text: "Hechizo. Tu héroe obtiene +1 Fuerza, +1 Ingenio y +1 Aguante. Se descarta al final de la ronda." },
  { id: "amuleto-tiempo", name: "Amuleto del Tiempo", type: "mejora", cost: 2, resources: 1, resType: "energia", glyph: "🧿", resourceAbility: { res: "comodin", amount: 1, heroOnly: true },
    text: "Héroe: al pagar una carta, agótalo; vale 🌟." },
  ...CUSTODIO_INVOCATION,
];

export const CUSTODIO: HeroDef = {
  id: "custodio",
  hero: { name: "Custodio del Umbral", fuerza: 1, ingenio: 2, aguante: 2, mano: 5, text: "Dominio arcano: acción, agota a tu héroe y paga el coste de la primera carta de tu mazo de invocación para resolverla." },
  identity: { name: "Dra. Noa Ferrán", recuperacion: 3, mano: 6, text: "Talento innato: una vez por ronda, como acción, descarta la primera carta de tu mazo de invocación." },
  vida: 10,
  heroTraits: ["guardia", "mistico"],
  ability: { timing: "action", cost: "exhaustHero", effects: [{ do: "invoke" }], text: "Dominio arcano" },
  identityAbility: { timing: "action", cost: "once", effects: [{ do: "cycleInvocation" }], text: "Talento innato" },
  invocation: ["inv-cadenas", "inv-espejismos", "inv-sellos", "inv-brumas", "inv-vientos"],
  deck: [
    // 15 del Custodio
    "tobias-bibliotecario", "viaje-astral", "viaje-astral", "descarga-arcana", "descarga-arcana", "maestria-arcana", "maestria-arcana",
    "estudio-grimorio", "salvaguarda-runica", "salvaguarda-runica", "torre-umbral", "capa-errante",
    "hechizo-potencia", "hechizo-potencia", "amuleto-tiempo",
    // 19 de Liderazgo
    "arquero-campanario", "comisaria-vega", "automata-cristal", "en-pie", "en-pie", "en-pie",
    "llamada-refuerzos", "llamada-refuerzos", "llamada-refuerzos", "don-mando", "don-mando", "palabras-animo",
    "vigia-alado", "nuez-picara", "gedeon-rubi", "relevo-inmediato", "relevo-inmediato", "relevo-inmediato", "yunque-armero",
    // 6 básicas
    "grajilla-acrobata", "director-umbral", "celula-energia", "chispa-genio", "pulso-fuerza", "centinela-puente",
  ],
  colour: "#0f766e",
  glyph: "🔮",
};
