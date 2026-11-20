import type { HeroDef, PlayerCardDef } from "../../engine/types";

// Sibila del Caos (Lucía Montenegro): a witch who bends probability. Her spells read the boost
// icons (⭐) of the encounter deck: what comes up decides the outcome. Justicia: clear plans and
// draw. 40 cards: 15 hers, 9 Justicia, 16 básicas.

export const SIBILA_CARDS: PlayerCardDef[] = [
  { id: "velo-hermano", name: "Velo, el Hermano Veloz", type: "aliado", cost: 4, resources: 1, resType: "comodin", glyph: "💨", traits: ["guardia"],
    text: "Aliado. Guardia de Aurelia. Acción (una vez por ronda): prepara a Velo. Atacar o contener le cuesta 1 daño.",
    ally: { vida: 4, fuerza: 2, ingenio: 1, consFuerza: 1, consIngenio: 1 },
    ability: { timing: "action", cost: "once", effects: [{ do: "readyAlly", target: "thisCard" }], text: "Carrera: se prepara" } },
  { id: "desorden-arcano", name: "Desorden Arcano", type: "evento", cost: 0, resources: 1, resType: "comodin", glyph: "🎲", traits: ["hechizo"],
    text: "Héroe. Acción: juega una carta de tu mano sin pagar su coste. Descarta tantas cartas de encuentros como ese coste.",
    play: { timing: "action", heroOnly: true, effects: [{ do: "chaosPlay" }] } },
  { id: "sortilegio", name: "Sortilegio", type: "evento", cost: 2, resources: 1, resType: "mental", glyph: "🔮", traits: ["hechizo"],
    text: "Héroe. Acción: descarta las 3 primeras cartas de encuentros. Por cada una según sus ⭐ — 0: 2 daño a un enemigo · 1: retira 2 amenaza · 2: roba 1 · 3+: pon un estado.",
    play: { timing: "action", heroOnly: true, effects: [{ do: "hex", amount: 3 }] } },
  { id: "disolucion", name: "Disolución", type: "evento", cost: 3, resources: 1, resType: "energia", glyph: "💥", traits: ["hechizo"],
    text: "Héroe. Ataque: inflige 5 daño a un enemigo y descarta las 2 primeras cartas de encuentros: +1 daño por cada ⭐.",
    play: { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "chooseEnemy", amount: 5 }, { do: "millEncounter", amount: 2, damagePerBoost: 1 }] } },
  { id: "torcer-realidad", name: "Torcer la Realidad", type: "evento", cost: 1, resources: 1, resType: "fisico", glyph: "🌀", traits: ["hechizo"],
    text: "Héroe. Cuando se revele una carta de encuentro contra ti: anúlala y descártala; descarta además tantas cartas de encuentros como ⭐ tenga.",
    play: { timing: "anyEncounter", heroOnly: true, effects: [{ do: "discardEncounterByBoost" }] } },
  { id: "maestra-eulalia", name: "Maestra Eulalia", type: "apoyo", cost: 1, resources: 1, resType: "mental", glyph: "🧙‍♀️",
    text: "Apoyo. Identidad. Acción, agótala: mira las 3 primeras cartas de tu mazo, quédate 1 y pon las demás al fondo.",
    ability: { timing: "action", cost: "exhaust", identityOnly: true, effects: [{ do: "lookTop", amount: 3, restToBottom: true }], text: "Lección de la maestra" } },
  { id: "escudo-bruma", name: "Escudo de Bruma", type: "mejora", cost: 1, resources: 1, resType: "fisico", glyph: "🫧", traits: ["hechizo"],
    text: "Hechizo. Héroe. Cuando un ataque vaya a hacer daño a tu héroe o a tu aliado: descarta esta carta para evitar 3 de ese daño.",
    ability: { timing: "defend", heroOnly: true, effects: [{ do: "prevent", amount: 3 }, { do: "discardSelf" }], text: "Bruma: evita 3" } },
  { id: "diadema-azar", name: "Diadema del Azar", type: "mejora", cost: 2, resources: 1, resType: "energia", glyph: "👑", boostTweak: true,
    text: "Cuando el villano cuente el refuerzo de su ataque contra ti: agótala para restarle 1 ⭐." },
];

export const SIBILA: HeroDef = {
  id: "sibila",
  hero: { name: "Sibila del Caos", fuerza: 1, ingenio: 2, aguante: 2, mano: 5, text: "Control del caos: una vez por fase, cuando el villano cuente el refuerzo de su ataque contra ti, descarta la primera carta de encuentros y cuenta sus ⭐ en su lugar." },
  identity: { name: "Lucía Montenegro", recuperacion: 3, mano: 6, text: "Hermanos: una vez por ronda, como acción, descarta 2 cartas de tu mano para robar 2 (3 si Velo está en juego)." },
  vida: 10,
  heroTraits: ["guardia", "mistico"],
  ability: { timing: "boostSwap", effects: [], text: "Control del caos" },
  identityAbility: { timing: "action", cost: "once", payFor: "any", payRequired: true, text: "Hermanos: descarta 2, roba 2",
    effects: [{ do: "discardFromHand", target: "chooseHandCard" }, { do: "draw", amount: 2 }, { do: "ifControls", card: "velo-hermano", effects: [{ do: "draw", amount: 1 }] }] },
  deck: [
    // 15 de Sibila
    "velo-hermano", "desorden-arcano", "sortilegio", "sortilegio", "sortilegio", "sortilegio", "disolucion", "disolucion", "disolucion",
    "torcer-realidad", "maestra-eulalia", "escudo-bruma", "escudo-bruma", "escudo-bruma", "diadema-azar",
    // 9 de Justicia
    "olfato-detective", "despejar-plaza", "despejar-plaza", "despejar-plaza", "ojo-vigilante", "eco-aprendiz",
    "tornas-cambian", "tornas-cambian", "tornas-cambian",
    // 16 básicas
    "grajilla-acrobata", "director-umbral", "celula-energia", "chispa-genio", "pulso-fuerza", "salon-guardia", "aeronave-mando",
    "centinela-puente", "nave-guardia", "archimago", "chispa-inventora", "union-todos", "union-todos",
    "meditacion", "meditacion", "meditacion",
  ],
  colour: "#be185d",
  glyph: "🌀",
};
