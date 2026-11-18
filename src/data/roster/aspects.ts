import type { PlayerCardDef } from "../../engine/types";

// Aspect pools shared by several heroes. Liderazgo: allies and ways to ready, inspire and recall them.
// Protección: defence, toughness and hitting back.

export const LIDERAZGO: PlayerCardDef[] = [
  { id: "capitana-fernandez", name: "Capitana Fernández", type: "aliado", cost: 4, resources: 1, resType: "mental", glyph: "🎖",
    text: "Aliado. Veterana de la guardia de Aurelia. ¡En formación!: al entrar en juego, prepara a todos tus aliados. Atacar o contener le cuesta 1 daño.",
    ally: { vida: 4, fuerza: 2, ingenio: 2, consFuerza: 1, consIngenio: 1 }, onPlay: [{ do: "readyAllies" }] },
  { id: "mago-errante", name: "Mago Errante", type: "aliado", cost: 3, resources: 1, resType: "mental", glyph: "🧙",
    text: "Aliado. Ilusión: después de que contenga, el villano queda Confundido. Atacar o contener le cuesta 1 daño.",
    ally: { vida: 2, fuerza: 1, ingenio: 3, consFuerza: 1, consIngenio: 1, onThwart: [{ do: "status", status: "confused", target: "villain" }] } },
  { id: "doctora-ignis", name: "Doctora Ignis", type: "aliado", cost: 4, resources: 1, resType: "energia", glyph: "🔥",
    text: "Aliado. Llamarada: después de que ataque, inflige 1 daño a cada esbirro. Atacar o contener le cuesta 1 daño.",
    ally: { vida: 3, fuerza: 3, ingenio: 1, consFuerza: 1, consIngenio: 1, onAttack: [{ do: "damage", target: "allMinions", amount: 1 }] } },
  { id: "hacer-llamada", name: "Hacer la Llamada", type: "evento", cost: 0, resources: 1, resType: "mental", glyph: "📞",
    text: "Acción: un aliado de tu descarte vuelve a tu mano.", play: { timing: "action", effects: [{ do: "recallAlly" }] } },
  { id: "arenga", name: "Arenga", type: "evento", cost: 1, resources: 1, resType: "energia", glyph: "📯",
    text: "Acción: uno de tus aliados obtiene +1 Fuerza y +1 Ingenio de forma permanente.", play: { timing: "action", effects: [{ do: "buffAlly", target: "chooseAlly", fuerza: 1, ingenio: 1 }] } },
  { id: "liderar-ejemplo", name: "Liderar con el Ejemplo", type: "evento", cost: 2, resources: 1, resType: "fisico", glyph: "🚩",
    text: "Héroe. Acción: prepara a tu héroe y a todos tus aliados.", play: { timing: "action", heroOnly: true, effects: [{ do: "readyHero" }, { do: "readyAllies" }] } },
  { id: "toque-reunion", name: "Toque de Reunión", type: "evento", cost: 1, resources: 1, resType: "energia", glyph: "📢",
    text: "Acción: prepara a todos tus aliados.", play: { timing: "action", effects: [{ do: "readyAllies" }] } },
  { id: "plan-equipo", name: "Plan de Equipo", type: "evento", cost: 1, resources: 1, resType: "mental", glyph: "🗺",
    text: "Acción: roba 2 cartas.", play: { timing: "action", effects: [{ do: "draw", amount: 2 }] } },
];

export const PROTECCION: PlayerCardDef[] = [
  { id: "bloqueo-perfecto", name: "Bloqueo Perfecto", type: "evento", cost: 1, resources: 1, resType: "fisico", glyph: "🛡",
    text: "Héroe. Al defenderte: evita 4 daño.", play: { timing: "defend", heroOnly: true, effects: [{ do: "prevent", amount: 4 }] } },
  { id: "desvio", name: "Desvío y Réplica", type: "evento", cost: 2, resources: 1, resType: "fisico", glyph: "↩",
    text: "Héroe. Al defenderte: evita 2 daño e inflige 2 daño al atacante.", play: { timing: "defend", heroOnly: true, effects: [{ do: "prevent", amount: 2 }, { do: "damage", target: "attacker", amount: 2 }] } },
  { id: "aguantar-golpe", name: "Aguantar el Golpe", type: "evento", cost: 0, resources: 1, resType: "energia", glyph: "✋",
    text: "Al defenderte: evita 2 daño.", play: { timing: "defend", effects: [{ do: "prevent", amount: 2 }] } },
  { id: "coraza-puas", name: "Coraza de Púas", type: "mejora", cost: 1, resources: 1, resType: "fisico", glyph: "🌵",
    text: "Represalia 1: después de que un enemigo ataque a tu héroe, recibe 1 daño.", retaliate: 1 },
  { id: "armadura-combate", name: "Armadura de Combate", type: "mejora", cost: 2, resources: 1, resType: "mental", glyph: "🦺",
    text: "Tu héroe obtiene +1 Aguante y +2 Vida máxima.", bonus: { aguante: 1, vidaMax: 2 } },
  { id: "voluntad-hierro", name: "Voluntad de Hierro", type: "evento", cost: 1, resources: 1, resType: "energia", glyph: "⛓",
    text: "Acción: tu héroe obtiene Duro (el próximo daño que reciba se anula) y se cura 1.", play: { timing: "action", effects: [{ do: "status", status: "tough", target: "self" }, { do: "heal", target: "self", amount: 1 }] } },
  { id: "escudero-fiel", name: "Escudero Fiel", type: "aliado", cost: 2, resources: 1, resType: "fisico", glyph: "🛡",
    text: "Aliado. Escudo en alto: cuando bloquea un ataque, evita 1 daño. Atacar o contener le cuesta 1 daño.",
    ally: { vida: 3, fuerza: 1, ingenio: 1, consFuerza: 1, consIngenio: 1, onBlock: [{ do: "prevent", amount: 1 }] } },
  { id: "centinela-real", name: "Centinela Real", type: "aliado", cost: 3, resources: 1, resType: "mental", glyph: "💂",
    text: "Aliado. Un muro con armadura. Alabarda: cuando bloquea un ataque, inflige 1 daño al atacante. Atacar le cuesta 1 daño.",
    ally: { vida: 5, fuerza: 1, ingenio: 0, consFuerza: 1, consIngenio: 1, onBlock: [{ do: "damage", target: "attacker", amount: 1 }] } },
];
