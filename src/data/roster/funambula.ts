import type { HeroDef, PlayerCardDef } from "../../engine/types";

// Funámbula (Lía Brenner): a physics student who swings over Aurelia on threads of spun silk.
// Agile and hard to hit; a Leadership deck full of allies.

export const FUNAMBULA_CARDS: PlayerCardDef[] = [
  { id: "lanzadores-seda", name: "Lanzadores de Seda", type: "mejora", cost: 1, resources: 1, resType: "energia", glyph: "🕸", uses: 3, resourceAbility: { res: "comodin", amount: 1 },
    text: "Entra con 3 usos. Agótala al pagar una carta: vale 🌟 (gasta 1 uso). Sin usos, se descarta." },
  { id: "voltereta", name: "Voltereta", type: "evento", cost: 0, resources: 1, resType: "energia", glyph: "🤸",
    text: "Héroe. Al defenderte: evita 3 daño.", play: { timing: "defend", heroOnly: true, effects: [{ do: "prevent", amount: 3 }] } },
  { id: "patada-pendular", name: "Patada Pendular", type: "evento", cost: 3, resources: 1, resType: "fisico", glyph: "🦶",
    text: "Héroe. Acción: inflige 5 daño a un enemigo.", play: { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "chooseEnemy", amount: 5 }] } },
  { id: "red-atrapante", name: "Red Atrapante", type: "evento", cost: 2, resources: 1, resType: "mental", glyph: "🕸",
    text: "Acción: un enemigo queda Aturdido y Confundido.", play: { timing: "action", effects: [{ do: "status", status: "stunned", target: "chooseEnemy" }, { do: "status", status: "confused", target: "lastTarget" }] } },
  { id: "salto-tejados", name: "Salto entre Tejados", type: "evento", cost: 1, resources: 1, resType: "energia", glyph: "🏙",
    text: "Héroe. Acción: retira 2 amenaza de un plan.", play: { timing: "action", heroOnly: true, effects: [{ do: "thwart", target: "choosePlan", amount: 2 }] } },
  { id: "abuela-teresa", name: "Abuela Teresa", type: "apoyo", cost: 2, resources: 1, resType: "mental", glyph: "👵",
    text: "Apoyo. Identidad. Acción, agota esta carta: cura 3 daño a tu héroe.", ability: { timing: "action", cost: "exhaust", identityOnly: true, effects: [{ do: "heal", target: "self", amount: 3 }], text: "Sopa caliente: cura 3" } },
  { id: "dedalo-inventor", name: "Dédalo, el Inventor", type: "aliado", cost: 3, resources: 1, resType: "mental", glyph: "🔭",
    text: "Aliado. Al entrar en juego: roba 1 carta. Atacar o contener le cuesta 1 daño.", ally: { vida: 3, fuerza: 1, ingenio: 2, consFuerza: 1, consIngenio: 1 }, onPlay: [{ do: "draw", amount: 1 }] },
  { id: "vision-periferica", name: "Visión Periférica", type: "mejora", cost: 1, resources: 1, resType: "mental", glyph: "👁",
    text: "Tu héroe obtiene +1 Ingenio.", bonus: { ingenio: 1 } },
  { id: "golpe-sincronizado", name: "Golpe Sincronizado", type: "evento", cost: 2, resources: 1, resType: "fisico", glyph: "⚡",
    text: "Héroe. Acción: inflige 3 daño a un enemigo. Si pagaste con 🧠, roba 1 carta.", play: { timing: "action", heroOnly: true, effects: [{ do: "damage", target: "chooseEnemy", amount: 3 }, { do: "draw", amount: 1, ifPaid: "mental" }] } },
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
    "lanzadores-seda", "lanzadores-seda", "voltereta", "voltereta", "patada-pendular", "patada-pendular",
    "red-atrapante", "red-atrapante", "salto-tejados", "salto-tejados", "abuela-teresa", "dedalo-inventor",
    "vision-periferica", "golpe-sincronizado", "golpe-sincronizado",
    // 25 de Liderazgo y básicas
    "capitana-fernandez", "mago-errante", "doctora-ignis", "mercenario-posada", "mercenario-posada", "aldeana-valiente",
    "hacer-llamada", "arenga", "arenga", "liderar-ejemplo", "toque-reunion", "toque-reunion", "plan-equipo", "plan-equipo",
    "vigilancia", "vigilancia", "golpe-certero", "golpe-certero", "respiro", "pocion-curacion", "por-aurelia",
    "chispa-genio", "chispa-genio", "inspiracion", "inspiracion",
  ],
  colour: "#c0263f",
  glyph: "🕸",
};
