import type { HeroDef, PlayerCardDef } from "../../engine/types";

// Funámbula (Lía Brenner): a physics student who swings over Aurelia on threads of spun silk.
// Agile and hard to hit; a Leadership deck full of allies. 40 cards: 15 of her own, 15 Liderazgo, 10 básicas.

export const FUNAMBULA_CARDS: PlayerCardDef[] = [
  // Cartas de Funámbula (15)
  { id: "dedalo-inventor", name: "Dédalo, el Inventor", type: "aliado", cost: 2, resources: 1, resType: "energia", glyph: "🔭",
    text: "Aliado. Al entrar en juego: descarta las 2 primeras cartas de tu mazo; las que tengan 🧠 impreso van a tu mano. Contener le cuesta 1 daño.",
    ally: { vida: 2, fuerza: 1, ingenio: 1, consFuerza: 0, consIngenio: 1 }, onPlay: [{ do: "millTake", amount: 2, res: "mental" }] },
  { id: "voltereta", name: "Voltereta", type: "evento", cost: 0, resources: 1, resType: "fisico", glyph: "🤸",
    text: "Héroe. Defensa: cuando un ataque te vaya a hacer daño, evita todo ese daño.", play: { timing: "defend", heroOnly: true, effects: [{ do: "prevent", amount: 99 }] } },
  { id: "vision-periferica", name: "Visión Periférica", type: "evento", cost: 1, resources: 1, resType: "mental", glyph: "👁",
    text: "Héroe. Cuando se revele una traición contra ti: anula su efecto.", play: { timing: "treachery", heroOnly: true, effects: [] } },
  { id: "patada-pendular", name: "Patada Pendular", type: "evento", cost: 3, resources: 1, resType: "mental", glyph: "🦶",
    text: "Héroe. Ataque: inflige 8 daño a un enemigo.", play: { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "chooseEnemy", amount: 8 }] } },
  { id: "abuela-teresa", name: "Abuela Teresa", type: "apoyo", cost: 1, resources: 1, resType: "energia", glyph: "👵",
    text: "Apoyo. Identidad. Acción, agota esta carta: cura 4 daño a Lía.", ability: { timing: "action", cost: "exhaust", identityOnly: true, effects: [{ do: "heal", target: "self", amount: 4 }], text: "Sopa caliente: cura 4" } },
  { id: "hilo-rastreador", name: "Hilo Rastreador", type: "mejora", cost: 1, resources: 1, resType: "energia", glyph: "🧵",
    text: "Vincúlala a un esbirro. Cuando ese esbirro sea derrotado: retira 3 amenaza de un plan.",
    play: { timing: "action", effects: [{ do: "attachSelf", target: "chooseMinion" }] }, onHostDefeated: [{ do: "thwart", target: "bestPlan", amount: 3 }] },
  { id: "lanzadores-seda", name: "Lanzadores de Seda", type: "mejora", cost: 1, resources: 1, resType: "fisico", glyph: "🕸", uses: 3, resourceAbility: { res: "comodin", amount: 1, heroOnly: true },
    text: "Entra con 3 usos. Héroe: agótala al pagar una carta y gasta 1 uso; vale 🌟. Sin usos, se descarta." },
  { id: "red-atrapante", name: "Red Atrapante", type: "mejora", cost: 4, resources: 1, resType: "fisico", glyph: "🕸", snare: true,
    text: "Héroe. Vincúlala a un enemigo (una por enemigo). Cuando ese enemigo vaya a atacar: en su lugar, descarta la Red y el enemigo queda Aturdido.",
    play: { timing: "action", heroOnly: true, effects: [{ do: "attachSelf", target: "chooseEnemy" }] } },

  // Liderazgo de Funámbula (15)
  { id: "arquero-campanario", name: "Arquero del Campanario", type: "aliado", cost: 3, resources: 1, resType: "energia", glyph: "🏹", traits: ["liderazgo"], uses: 4,
    text: "Aliado. Entra con 4 flechas. Después de que un esbirro entre en juego: gasta 1 flecha para infligirle 2 daño. Atacar o contener le cuesta 1 daño.",
    ally: { vida: 3, fuerza: 1, ingenio: 1, consFuerza: 1, consIngenio: 1, onMinionEnters: [{ do: "damage", target: "lastTarget", amount: 2 }] } },
  { id: "comisaria-vega", name: "Comisaria Vega", type: "aliado", cost: 2, resources: 1, resType: "mental", glyph: "🪪", traits: ["liderazgo"],
    text: "Aliado. Al entrar en juego: cada jugador roba 1 carta. Atacar o contener le cuesta 1 daño.",
    ally: { vida: 2, fuerza: 1, ingenio: 2, consFuerza: 1, consIngenio: 1 }, onPlay: [{ do: "draw", amount: 1, each: true }] },
  { id: "automata-cristal", name: "Autómata de Cristal", type: "aliado", cost: 4, resources: 1, resType: "fisico", glyph: "💎", traits: ["liderazgo"],
    text: "Aliado. Acción (una vez por ronda): descarta una carta con ⚡ para que obtenga +2 Ingenio o +2 Fuerza hasta el final de la fase. Atacar o contener le cuesta 1 daño.",
    ally: { vida: 3, fuerza: 2, ingenio: 1, consFuerza: 1, consIngenio: 1 },
    ability: { timing: "action", cost: "once", payFor: "energia", payRequired: true, text: "Cambio de densidad", effects: [{ do: "choose", text: "Autómata de Cristal: ¿qué gana hasta el final de la fase?", options: [
      { label: "+2 Ingenio", effects: [{ do: "tempBuff", target: "thisCard", ingenio: 2 }] },
      { label: "+2 Fuerza", effects: [{ do: "tempBuff", target: "thisCard", fuerza: 2 }] },
    ] }] } },
  { id: "en-pie", name: "¡En Pie!", type: "evento", cost: 0, resources: 1, resType: "fisico", glyph: "🙌", traits: ["liderazgo"],
    text: "Acción: prepara a uno de tus aliados.", play: { timing: "action", effects: [{ do: "readyAlly", target: "chooseAlly" }] } },
  { id: "al-frente", name: "Al Frente del Grupo", type: "evento", cost: 2, resources: 1, resType: "energia", glyph: "🚩", traits: ["liderazgo"],
    text: "Héroe. Acción: elige un jugador; su héroe y sus aliados obtienen +1 Fuerza y +1 Ingenio hasta el final de la fase.",
    play: { timing: "action", heroOnly: true, effects: [{ do: "tempBuff", target: "choosePlayer", fuerza: 1, ingenio: 1 }] } },
  { id: "llamada-refuerzos", name: "Llamada de Refuerzos", type: "evento", cost: 0, resources: 1, resType: "mental", glyph: "📯", traits: ["liderazgo"],
    text: "Acción: paga el coste de un aliado del descarte de cualquier jugador y ponlo en juego bajo tu control.", play: { timing: "action", effects: [{ do: "reviveAlly" }] } },
  { id: "don-mando", name: "Don de Mando", type: "recurso", cost: 0, resources: 1, resType: "comodin", glyph: "👑", traits: ["liderazgo"], doubleFor: "liderazgo",
    text: "Recurso: vale 🌟. Al pagar una carta de Liderazgo vale el doble (🌟🌟)." },
  { id: "palabras-animo", name: "Palabras de Ánimo", type: "mejora", cost: 1, resources: 1, resType: "fisico", glyph: "✨", traits: ["liderazgo"], attachBonus: { fuerza: 1, ingenio: 1 },
    text: "Vincúlala a uno de tus aliados (una por aliado): obtiene +1 Fuerza y +1 Ingenio.", play: { timing: "action", effects: [{ do: "attachSelf", target: "chooseAlly" }] } },

  // Básicas de Funámbula (7 + 3 recursos)
  { id: "grajilla-acrobata", name: "Grajilla, la Acróbata", type: "aliado", cost: 3, resources: 1, resType: "fisico", glyph: "🐦‍⬛",
    text: "Aliado. Al entrar en juego: aturde a un enemigo. Atacar o contener le cuesta 1 daño.",
    ally: { vida: 3, fuerza: 1, ingenio: 1, consFuerza: 1, consIngenio: 1 }, onPlay: [{ do: "status", status: "stunned", target: "chooseEnemy" }] },
  { id: "director-umbral", name: "El Director Umbral", type: "aliado", cost: 4, resources: 1, resType: "mental", glyph: "🕴", temporary: true,
    text: "Aliado. Al entrar en juego elige: retira 2 amenaza de un plan, roba 3 cartas o inflige 4 daño a un enemigo. Al final de la ronda se descarta. Atacar o contener le cuesta 1 daño.",
    ally: { vida: 3, fuerza: 2, ingenio: 2, consFuerza: 1, consIngenio: 1 },
    onPlay: [{ do: "choose", text: "El Director Umbral: ¿qué orden das?", options: [
      { label: "Retirar 2 amenaza de un plan", effects: [{ do: "thwart", target: "choosePlan", amount: 2 }] },
      { label: "Robar 3 cartas", effects: [{ do: "draw", amount: 3 }] },
      { label: "Infligir 4 daño a un enemigo", effects: [{ do: "damage", target: "chooseEnemy", amount: 4 }] },
    ] }] },
  { id: "vendaje-rapido", name: "Vendaje Rápido", type: "evento", cost: 1, resources: 1, resType: "mental", glyph: "🩹",
    text: "Acción: cura 2 daño a tu héroe o a uno de tus aliados.", play: { timing: "action", effects: [{ do: "heal", target: "chooseFriendly", amount: 2 }] } },
  { id: "directo-demoledor", name: "Directo Demoledor", type: "evento", cost: 2, resources: 1, resType: "energia", glyph: "👊",
    text: "Héroe. Ataque: inflige 3 daño a un enemigo.", play: { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "chooseEnemy", amount: 3 }] } },
  { id: "aeronave-mando", name: "Aeronave de Mando", type: "apoyo", cost: 3, resources: 1, resType: "fisico", glyph: "🛩",
    text: "Apoyo. Acción, agótala: elige un jugador; la siguiente carta que juegue en esta fase cuesta 1 menos.",
    ability: { timing: "action", cost: "exhaust", effects: [{ do: "discount", target: "choosePlayer", amount: 1 }], text: "Apoyo aéreo: −1 al coste" } },
];

export const FUNAMBULA: HeroDef = {
  id: "funambula",
  hero: { name: "Funámbula", fuerza: 1, ingenio: 1, aguante: 3, mano: 5, text: "Sexto sentido: después de que el villano empiece un ataque contra ti, roba 1 carta." },
  identity: { name: "Lía Brenner", recuperacion: 3, mano: 6, text: "Estudiante de física. Genio: una vez por ronda, en identidad, genera 🧠 al pagar una carta." },
  vida: 10,
  ability: { timing: "villainAttack", effects: [{ do: "draw", amount: 1 }], text: "Sexto sentido: roba 1 carta" },
  identityResource: { res: "mental", amount: 1 },
  deck: [
    // 15 de Funámbula
    "dedalo-inventor", "voltereta", "voltereta", "vision-periferica", "vision-periferica",
    "patada-pendular", "patada-pendular", "patada-pendular", "abuela-teresa", "hilo-rastreador", "hilo-rastreador",
    "lanzadores-seda", "lanzadores-seda", "red-atrapante", "red-atrapante",
    // 15 de Liderazgo
    "arquero-campanario", "comisaria-vega", "automata-cristal", "en-pie", "en-pie", "en-pie",
    "al-frente", "al-frente", "llamada-refuerzos", "llamada-refuerzos", "don-mando", "don-mando",
    "palabras-animo", "palabras-animo", "palabras-animo",
    // 10 básicas
    "grajilla-acrobata", "director-umbral", "vendaje-rapido", "vendaje-rapido", "directo-demoledor", "directo-demoledor",
    "celula-energia", "chispa-genio", "pulso-fuerza", "aeronave-mando",
  ],

  colour: "#c0263f",
  glyph: "🕸",
};
