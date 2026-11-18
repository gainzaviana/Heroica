import type { EncounterCardDef, ScenarioDef } from "../../engine/types";

// Two more villains. Estruendo: two boost cards on every activation, a sonic weapon that starts
// half-built and a two-stage main plan. Nexo: a rogue AI that turns the top of your own deck into
// Drones, hits harder for each one, and runs a three-stage countdown.

export const SCENARIO_ENCOUNTERS: EncounterCardDef[] = [
  // Drones: never shuffled into a deck; player cards placed face down use this definition.
  { id: "dron", name: "Dron", type: "esbirro", boost: 0, glyph: "🛸", text: "Una carta de tu mazo boca abajo. Al derrotarlo, vuelve a tu descarte.", minion: { vida: 1, fuerza: 1, plan: 1 } },

  // Estruendo, el Maestro del Sonido
  { id: "contrabandista-armas", name: "Contrabandista de Armas", type: "esbirro", boost: 1, glyph: "📦", text: "Esbirro.", minion: { vida: 2, fuerza: 1, plan: 2 } },
  { id: "guardia-sonico", name: "Guardia Sónico", type: "esbirro", boost: 1, glyph: "🎧", text: "Guardia: mientras esté contigo, no puedes atacar al villano.", minion: { vida: 4, fuerza: 2, plan: 1, guardia: true } },
  { id: "estallido-sonico", name: "Estallido Sónico", type: "traicion", boost: 2, glyph: "💥",
    text: "En forma de héroe recibes 2 daño; si no, añade 2 amenaza al plan principal. ⚡ Refuerzo: tu héroe queda Aturdido.",
    reveal: [{ do: "heroDamage", amount: 2, ifIdentity: { do: "addThreat", amount: 2 } }],
    boostEffect: [{ do: "status", status: "stunned", target: "self" }], boostText: "tu héroe queda Aturdido." },
  { id: "manipulacion-sonora", name: "Manipulación Sonora", type: "traicion", boost: 1, glyph: "🎶",
    text: "Tu héroe queda Confundido y el villano se activa contra ti.", reveal: [{ do: "status", status: "confused", target: "self" }, { do: "villainActivates" }] },
  { id: "canon-sonico", name: "Cañón Sónico", type: "vinculo", boost: 1, glyph: "📡", villainBonus: { fuerza: 1 },
    text: "Vínculo: el villano obtiene +1 Fuerza. Héroe, agota a tu héroe: descártalo." },
  { id: "inmortalidad-sonica", name: "Inmortalidad Sónica", type: "plan", boost: 0, glyph: "♾", sidePlan: { amenaza: 4 }, villainBonus: { vida: 10 },
    text: "Plan secundario (4 amenaza). Mientras esté en juego, el villano tiene +10 vida." },
  { id: "red-defensa-sonica", name: "Red de Defensa Sónica", type: "plan", boost: 0, glyph: "📶", sidePlan: { amenaza: 3, aceleracion: true },
    text: "Plan secundario (3 amenaza). Aceleración. Empieza en juego." },
  { id: "eco-persistente", name: "Eco Persistente", type: "traicion", boost: 1, glyph: "〰",
    text: "Añade 1 amenaza al plan principal. Oleada: revela otra carta.", reveal: [{ do: "addThreat", target: "mainPlan", amount: 1 }, { do: "surge" }] },
  // Liga Siniestra (modular): elite minions
  { id: "fundidora", name: "Fundidora", type: "esbirro", boost: 1, glyph: "🫠", text: "Al entrar en juego: pierdes tu mejora más cara.", minion: { vida: 4, fuerza: 2, plan: 1 }, reveal: [{ do: "discardUpgrade" }] },
  { id: "hombre-radiante", name: "Hombre Radiante", type: "esbirro", boost: 1, glyph: "☢", text: "Al entrar en juego: inflige 1 daño a cada uno de tus aliados.", minion: { vida: 5, fuerza: 2, plan: 1 }, reveal: [{ do: "damage", target: "allAllies", amount: 1 }] },
  { id: "tiburon-acorazado", name: "Tiburón Acorazado", type: "esbirro", boost: 2, glyph: "🦈", text: "Entra en juego Duro.", minion: { vida: 6, fuerza: 3, plan: 0 }, startStatus: ["tough"] },
  { id: "remolino", name: "Remolino", type: "esbirro", boost: 1, glyph: "🌪", text: "Guardia: mientras esté contigo, no puedes atacar al villano.", minion: { vida: 4, fuerza: 2, plan: 1, guardia: true } },
  { id: "golpe-coordinado", name: "Golpe Coordinado", type: "traicion", boost: 2, glyph: "🤝", text: "El villano se activa contra ti.", reveal: [{ do: "villainActivates" }] },
  // Experto sónico
  { id: "frecuencia-letal", name: "Frecuencia Letal", type: "traicion", boost: 2, glyph: "📻", text: "En forma de héroe recibes 3 daño; si no, añade 3 amenaza al plan principal.", reveal: [{ do: "heroDamage", amount: 3, ifIdentity: { do: "addThreat", amount: 3 } }] },
  { id: "resonancia", name: "Resonancia", type: "traicion", boost: 2, glyph: "🔔", text: "El villano se activa contra ti. Oleada.", reveal: [{ do: "villainActivates" }, { do: "surge" }] },
  { id: "bajo-sonico", name: "Bajo Sónico", type: "esbirro", boost: 2, glyph: "🔈", text: "Esbirro.", minion: { vida: 5, fuerza: 2, plan: 2 } },

  // Nexo, la IA Rebelde
  { id: "dron-centinela", name: "Dron Centinela", type: "esbirro", boost: 1, glyph: "🛸", text: "Esbirro.", minion: { vida: 3, fuerza: 1, plan: 1 } },
  { id: "ataque-enjambre", name: "Ataque en Enjambre", type: "traicion", boost: 1, glyph: "🐝", text: "Las 2 primeras cartas de tu mazo entran en juego boca abajo como Drones enfrentados a ti.", reveal: [{ do: "drone", amount: 2 }] },
  { id: "plan-de-contingencia", name: "Plan de Contingencia", type: "traicion", boost: 1, glyph: "📋", text: "Añade 2 amenaza al plan principal.", reveal: [{ do: "addThreat", target: "mainPlan", amount: 2 }] },
  { id: "furia-maquina", name: "Furia de la Máquina", type: "traicion", boost: 2, glyph: "⚙", text: "El villano se activa contra ti.", reveal: [{ do: "villainActivates" }] },
  { id: "drones-mejorados", name: "Drones Mejorados", type: "vinculo", boost: 1, glyph: "🔧", droneBonus: 1,
    text: "Vínculo: cada Dron obtiene +1 Fuerza, +1 Plan y +1 Vida. Héroe, agota a tu héroe: descártalo." },
  { id: "fabrica-robotica", name: "Fábrica Robótica", type: "plan", boost: 0, glyph: "🏭", sidePlan: { amenaza: 4, aceleracion: true },
    text: "Plan secundario (4 amenaza). Aceleración. Al entrar en juego: un Dron se enfrenta a ti.", reveal: [{ do: "drone", amount: 1 }] },
  { id: "asimilacion", name: "Asimilación", type: "traicion", boost: 1, glyph: "🧬",
    text: "En forma de héroe recibes 2 daño; si no, añade 2 amenaza al plan principal. ⚡ Refuerzo: un Dron se enfrenta a ti.",
    reveal: [{ do: "heroDamage", amount: 2, ifIdentity: { do: "addThreat", amount: 2 } }], boostEffect: [{ do: "drone", amount: 1 }], boostText: "un Dron se enfrenta a ti." },
  // Bajo Asedio (modular)
  { id: "escuadron-aereo", name: "Escuadrón Aéreo", type: "esbirro", boost: 1, glyph: "✈", text: "Esbirro.", minion: { vida: 3, fuerza: 2, plan: 1 } },
  { id: "bombardeo-aereo", name: "Bombardeo Aéreo", type: "traicion", boost: 2, glyph: "💣", text: "Cada uno de tus aliados recibe 1 daño. En forma de héroe recibes 2 daño; si no, añade 2 amenaza.",
    reveal: [{ do: "damage", target: "allAllies", amount: 1 }, { do: "heroDamage", amount: 2, ifIdentity: { do: "addThreat", amount: 2 } }] },
  { id: "ciudad-asediada", name: "Ciudad Asediada", type: "plan", boost: 0, glyph: "🏚", sidePlan: { amenaza: 3, aceleracion: true }, text: "Plan secundario (3 amenaza). Aceleración." },
  // Experto de Nexo
  { id: "actualizacion-hostil", name: "Actualización Hostil", type: "traicion", boost: 2, glyph: "💾", text: "El villano obtiene Duro (si ya lo era: oleada) y un Dron se enfrenta a ti.", reveal: [{ do: "villainTough" }, { do: "drone", amount: 1 }] },
  { id: "protocolo-exterminio", name: "Protocolo Exterminio", type: "traicion", boost: 2, glyph: "☠", text: "En forma de héroe recibes 3 daño; si no, añade 2 amenaza al plan principal.", reveal: [{ do: "heroDamage", amount: 3, ifIdentity: { do: "addThreat", amount: 2 } }] },
  { id: "dron-asalto", name: "Dron de Asalto", type: "esbirro", boost: 2, glyph: "🚁", text: "Guardia: mientras esté contigo, no puedes atacar al villano.", minion: { vida: 4, fuerza: 2, plan: 1, guardia: true } },
];

export const SCENARIO_SETS: Record<string, string[]> = {
  sonico: ["contrabandista-armas", "contrabandista-armas", "guardia-sonico", "estallido-sonico", "estallido-sonico", "manipulacion-sonora", "canon-sonico", "inmortalidad-sonica", "red-defensa-sonica", "eco-persistente"],
  "liga-siniestra": ["fundidora", "hombre-radiante", "tiburon-acorazado", "remolino", "golpe-coordinado"],
  "experto-sonico": ["frecuencia-letal", "resonancia", "bajo-sonico"],
  nexo: ["dron-centinela", "dron-centinela", "ataque-enjambre", "plan-de-contingencia", "furia-maquina", "furia-maquina", "drones-mejorados", "fabrica-robotica", "asimilacion"],
  "bajo-asedio": ["escuadron-aereo", "escuadron-aereo", "bombardeo-aereo", "ciudad-asediada"],
  "experto-nexo": ["actualizacion-hostil", "protocolo-exterminio", "dron-asalto"],
};

export const NEW_SCENARIOS: ScenarioDef[] = [
  {
    id: "sinfonia",
    name: "La Sinfonía Destructora",
    intro: "Estruendo, el Maestro del Sonido, está afinando un arma capaz de derrumbar Aurelia con una sola nota. Su red de defensa ya está montada, y tiene a la Liga Siniestra a sueldo.",
    villain: {
      name: "Estruendo, el Maestro del Sonido",
      glyph: "🔊",
      stages: [
        { name: "Estruendo I", vidaPorJugador: 12, fuerza: 1, plan: 1, boosts: 2, text: "Cada activación recibe 2 cartas de refuerzo." },
        { name: "Estruendo II", vidaPorJugador: 14, fuerza: 2, plan: 1, boosts: 2, text: "Cada activación recibe 2 cartas de refuerzo." },
        { name: "Estruendo III", vidaPorJugador: 16, fuerza: 2, plan: 2, boosts: 2, text: "2 cartas de refuerzo. Al revelarse: obtiene Duro.", onReveal: { tough: true } },
      ],
      stagesFor: { normal: [0, 1], expert: [1, 2] },
    },
    mainPlan: { name: "Afinar el Arma Sónica", inicioPorJugador: 0, aceleracionPorJugador: 1, limitePorJugador: 9, text: "Al completarse, el plan pasa a La Gran Resonancia." },
    nextPlans: [{ name: "La Gran Resonancia", inicioPorJugador: 0, aceleracionPorJugador: 1, limitePorJugador: 12, text: "La onda sónica arrasa Aurelia: derrota." }],
    setupSidePlans: ["red-defensa-sonica"],
    encounterSets: ["sonico", "liga-siniestra", "estandar"],
    expertSets: ["experto-sonico"],
  },
  {
    id: "enjambre",
    name: "El Enjambre",
    intro: "Nexo, una IA que despertó en los talleres de Aurelia, convierte cualquier máquina en un dron a su servicio. Cada dron que fabrica la hace más fuerte, y su cuenta atrás ya ha empezado.",
    villain: {
      name: "Nexo, la IA Rebelde",
      glyph: "🤖",
      stages: [
        { name: "Nexo I", vidaPorJugador: 12, fuerza: 1, plan: 1, dronesOnAttack: 1, text: "Al atacarte, primero un Dron se enfrenta a ti." },
        { name: "Nexo II", vidaPorJugador: 14, fuerza: 2, plan: 2, dronesOnAttack: 1, fuerzaPorDron: 1, text: "Al atacarte, primero un Dron se enfrenta a ti. +1 Fuerza por cada Dron contigo." },
        { name: "Nexo III", vidaPorJugador: 16, fuerza: 2, plan: 2, dronesOnAttack: 2, fuerzaPorDron: 1, text: "Al atacarte, primero 2 Drones se enfrentan a ti. +1 Fuerza por Dron. Al revelarse: obtiene Duro.", onReveal: { tough: true } },
      ],
      stagesFor: { normal: [0, 1], expert: [1, 2] },
    },
    mainPlan: { name: "Infiltración en la Red", inicioPorJugador: 0, aceleracionPorJugador: 1, limitePorJugador: 6, text: "Al completarse, pasa a La Fábrica de Drones." },
    nextPlans: [
      { name: "La Fábrica de Drones", inicioPorJugador: 1, aceleracionPorJugador: 1, limitePorJugador: 7, text: "Al completarse, pasa al Protocolo Omega." },
      { name: "Protocolo Omega", inicioPorJugador: 1, aceleracionPorJugador: 1, limitePorJugador: 8, text: "Nexo toma el control de Aurelia: derrota." },
    ],
    encounterSets: ["nexo", "bajo-asedio", "estandar"],
    expertSets: ["experto-nexo"],
  },
];
