import type { EncounterCardDef, Effect, PlayerCardDef, ScenarioDef } from "../../engine/types";

// Campaign "El Ascenso del Mariscal de Ceniza": five linked villains of the Legión de Ceniza.
// 1. Saeta Negra: a mercenary with a side deck of experimental weapons (removed by spending resources).
// 2. Amalgama: absorbs the material of the environment in play and changes how his cards hit.
// 3. Réplica: punishes every transformation into a hero, and holds two allies captive.
// 4. Doctor Quimera: test counters on his main plan release Mutant minions.
// 5. El Mariscal de Ceniza: a deck of side plans, and a sleeping colossus that wakes up.

const PACK = "ceniza";
const legion = ["legion"];
const mutante = ["mutante"];
const heroHit = (n: number, threat = n): Effect => ({ do: "heroDamage", amount: n, ifIdentity: { do: "addThreat", amount: threat } });

export const CENIZA_ENCOUNTERS: EncounterCardDef[] = [
  // MARK: Asalto de la Legión (modular)
  { id: "soldado-asalto", name: "Soldado de Asalto", type: "esbirro", boost: 1, glyph: "🪖", traits: legion, text: "Legión.", minion: { vida: 3, fuerza: 2, plan: 1 } },
  { id: "comandante-asalto", name: "Comandante de Asalto", type: "esbirro", boost: 2, glyph: "🎖", traits: legion, text: "Legión. Guardia: mientras esté contigo, no puedes atacar al villano.", minion: { vida: 5, fuerza: 2, plan: 1, guardia: true } },
  { id: "ofensiva-relampago", name: "Ofensiva Relámpago", type: "traicion", boost: 2, glyph: "⚡", text: "El villano se activa contra ti.", reveal: [{ do: "villainActivates" }] },
  { id: "puesto-avanzado", name: "Puesto Avanzado", type: "plan", boost: 0, glyph: "⛺", sidePlan: { amenaza: 3, aceleracion: true }, text: "Plan secundario (3 amenaza). Aceleración." },

  // MARK: Patrulla de la Legión (modular)
  { id: "patrullero", name: "Patrullero de la Legión", type: "esbirro", boost: 1, glyph: "🔦", traits: legion, text: "Legión.", minion: { vida: 3, fuerza: 1, plan: 2 } },
  { id: "rastreador-legion", name: "Rastreador de la Legión", type: "esbirro", boost: 1, glyph: "📡", traits: legion, text: "Legión. Al entrar en juego: tu héroe queda Confundido.", minion: { vida: 4, fuerza: 1, plan: 2 }, reveal: [{ do: "status", status: "confused", target: "self" }] },
  { id: "control-carreteras", name: "Control de Carreteras", type: "plan", boost: 0, glyph: "🚧", sidePlan: { amenaza: 3, crisis: true }, text: "Plan secundario (3 amenaza). Crisis: mientras esté en juego, no puedes retirar amenaza del plan principal." },
  { id: "redada", name: "Redada", type: "traicion", boost: 1, glyph: "🚨", text: "Descarta cartas de encuentro hasta revelar un esbirro de la Legión: se enfrenta a ti.", reveal: [{ do: "spawnTrait", trait: "legion" }] },

  // MARK: Maestro de Armas (modular)
  { id: "armero-legion", name: "Armero de la Legión", type: "esbirro", boost: 1, glyph: "🔧", traits: legion, text: "Legión. Al entrar en juego: el villano se equipa con la siguiente arma experimental.", minion: { vida: 3, fuerza: 1, plan: 1 }, reveal: [{ do: "armWeapon" }] },
  { id: "instruccion-tiro", name: "Instrucción de Tiro", type: "traicion", boost: 1, glyph: "🎯", text: "En forma de héroe recibes 2 daño; si no, añade 2 amenaza. ⚡ Refuerzo: el villano se equipa con la siguiente arma experimental.",
    reveal: [heroHit(2)], boostEffect: [{ do: "armWeapon" }], boostText: "el villano se equipa con un arma experimental." },
  { id: "taller-prototipos", name: "Taller de Prototipos", type: "plan", boost: 0, glyph: "🏗", sidePlan: { amenaza: 4, aceleracion: true }, text: "Plan secundario (4 amenaza). Aceleración. Al entrar en juego: el villano se equipa con un arma experimental.", reveal: [{ do: "armWeapon" }] },
  { id: "municion-especial", name: "Munición Especial", type: "vinculo", boost: 1, glyph: "🧷", villainBonus: { fuerza: 1 }, keywords: ["perforante"], text: "Vínculo: el villano obtiene +1 Fuerza y Perforante. Héroe, agota a tu héroe: descártala." },

  // MARK: 1 · Saeta Negra, el Mercenario
  { id: "mercenario-legion", name: "Mercenario de la Legión", type: "esbirro", boost: 1, glyph: "🗡", traits: legion, text: "Legión.", minion: { vida: 3, fuerza: 1, plan: 1 } },
  { id: "tirador-elite", name: "Tirador de Élite", type: "esbirro", boost: 2, glyph: "🔭", traits: legion, text: "Legión. A distancia: la Represalia no le alcanza.", minion: { vida: 3, fuerza: 2, plan: 1, keywords: ["distancia"] } },
  { id: "fuego-cobertura", name: "Fuego de Cobertura", type: "traicion", boost: 1, glyph: "💥", text: "En forma de héroe recibes 2 daño; si no, añade 2 amenaza. ⚡ Refuerzo: el villano se equipa con un arma experimental.",
    reveal: [heroHit(2)], boostEffect: [{ do: "armWeapon" }], boostText: "el villano se equipa con un arma experimental." },
  { id: "prueba-campo", name: "Prueba de Campo", type: "traicion", boost: 1, glyph: "🧪", text: "El villano se equipa con la siguiente arma experimental. Si no quedan: oleada.", reveal: [{ do: "armWeapon" }] },
  { id: "retirada-calculada", name: "Retirada Calculada", type: "traicion", boost: 2, glyph: "🏃", text: "Añade 2 amenaza al plan principal y el villano se cura 3.", reveal: [{ do: "addThreat", target: "mainPlan", amount: 2 }, { do: "healVillain", amount: 3 }] },
  { id: "disparo-certero", name: "Disparo Certero", type: "traicion", boost: 2, glyph: "🎯", text: "El villano se activa contra ti.", reveal: [{ do: "villainActivates" }] },
  { id: "camara-acorazada", name: "Cámara Acorazada", type: "plan", boost: 0, glyph: "🔐", sidePlan: { amenaza: 4 }, villainBonus: { plan: 1 }, text: "Plan secundario (4 amenaza). Mientras esté en juego, el villano tiene +1 Plan." },
  // Armas experimentales (mazo aparte)
  { id: "rifle-pulsos", name: "Rifle de Pulsos Prototipo", type: "vinculo", boost: 0, glyph: "🔫", traits: ["arma"], villainBonus: { fuerza: 1 }, keywords: ["distancia"], removal: { cost: 3, res: "mental" },
    text: "Arma experimental. El villano obtiene +1 Fuerza y A distancia. Héroe: gasta 🧠🧠🧠 para desactivarla." },
  { id: "guanteletes-sismicos", name: "Guanteletes Sísmicos", type: "vinculo", boost: 0, glyph: "🥊", traits: ["arma"], villainBonus: { fuerza: 1 }, keywords: ["arrollador"], removal: { cost: 3, res: "fisico" },
    text: "Arma experimental. El villano obtiene +1 Fuerza y Arrollador. Héroe: gasta ✊✊✊ para arrancarlos." },
  { id: "exoarmadura-asalto", name: "Exoarmadura de Asalto", type: "vinculo", boost: 0, glyph: "🦾", traits: ["arma"], villainBonus: { vida: 6 }, removal: { cost: 3, res: "energia" },
    text: "Arma experimental. El villano obtiene +6 vida. Héroe: gasta ⚡⚡⚡ para sobrecargarla." },
  { id: "canon-laser", name: "Cañón Láser Pesado", type: "vinculo", boost: 0, glyph: "🔆", traits: ["arma"], villainBonus: { fuerza: 2 }, keywords: ["perforante"], removal: { cost: 4, res: "fisico" },
    text: "Arma experimental. El villano obtiene +2 Fuerza y Perforante. Héroe: gasta ✊✊✊✊ para destrozarlo." },
  { id: "cuchillas-plasma", name: "Cuchillas de Plasma", type: "vinculo", boost: 0, glyph: "🗡", traits: ["arma"], villainBonus: { fuerza: 1 }, keywords: ["perforante"], removal: { cost: 2, res: "energia" },
    text: "Arma experimental. El villano obtiene +1 Fuerza y Perforante. Héroe: gasta ⚡⚡ para apagarlas." },
  // Experto
  { id: "arsenal-completo", name: "Arsenal Completo", type: "traicion", boost: 2, glyph: "🧰", text: "El villano se equipa con las 2 siguientes armas experimentales.", reveal: [{ do: "armWeapon" }, { do: "armWeapon" }] },
  { id: "francotirador", name: "Francotirador", type: "esbirro", boost: 2, glyph: "🎯", traits: legion, text: "Legión. A distancia.", minion: { vida: 4, fuerza: 3, plan: 1, keywords: ["distancia"] } },
  { id: "rafaga-supresion", name: "Ráfaga de Supresión", type: "traicion", boost: 2, glyph: "🌩", text: "En forma de héroe recibes 3 daño; si no, añade 2 amenaza.", reveal: [heroHit(3, 2)] },

  // MARK: 2 · Amalgama, el Absorbedor
  { id: "acantilados-rocosos", name: "Acantilados Rocosos", type: "entorno", boost: 1, glyph: "⛰", environment: { trait: "Piedra", keywords: ["perforante", "arrollador"] },
    text: "Entorno. El villano es de Piedra: Perforante y Arrollador. Sustituye al entorno anterior." },
  { id: "fabrica-abandonada", name: "Fábrica Abandonada", type: "entorno", boost: 1, glyph: "🏭", environment: { trait: "Acero", fuerza: 1 },
    text: "Entorno. El villano es de Acero: +1 Fuerza. Sustituye al entorno anterior." },
  { id: "montanas-nevadas", name: "Montañas Nevadas", type: "entorno", boost: 1, glyph: "🏔", environment: { trait: "Hielo", afterAttack: [{ do: "status", status: "stunned", target: "self" }] },
    text: "Entorno. El villano es de Hielo: si su ataque te hace daño, tu héroe queda Aturdido. Sustituye al entorno anterior." },
  { id: "bosque-denso", name: "Bosque Denso", type: "entorno", boost: 1, glyph: "🌲", environment: { trait: "Madera", afterScheme: [{ do: "healVillain", amount: 2 }] },
    text: "Entorno. El villano es de Madera: después de que trame, se cura 2. Sustituye al entorno anterior." },
  { id: "golpe-material", name: "Golpe de Materia", type: "traicion", boost: 2, glyph: "👊", text: "En forma de héroe recibes 2 daño (3 si es de Acero); si no, añade 2 amenaza (3 si es de Acero).",
    reveal: [{ do: "ifTrait", trait: "Acero", effects: [heroHit(3)], else: [heroHit(2)] }] },
  { id: "piel-cambiante", name: "Piel Cambiante", type: "traicion", boost: 1, glyph: "🔄", text: "El villano absorbe otro entorno. Si ahora es de Piedra, obtiene Duro.",
    reveal: [{ do: "newEnvironment" }, { do: "ifTrait", trait: "Piedra", effects: [{ do: "villainTough" }] }] },
  { id: "congelacion", name: "Congelación", type: "traicion", boost: 1, glyph: "🧊", text: "Si el villano es de Hielo, tu héroe queda Aturdido. Si no, añade 1 contador de Retraso.",
    reveal: [{ do: "ifTrait", trait: "Hielo", effects: [{ do: "status", status: "stunned", target: "self" }], else: [{ do: "planCounter", amount: 1 }] }] },
  { id: "raices-profundas", name: "Raíces Profundas", type: "traicion", boost: 1, glyph: "🌳", text: "Si el villano es de Madera, se cura 4. Si no, añade 2 amenaza al plan principal.",
    reveal: [{ do: "ifTrait", trait: "Madera", effects: [{ do: "healVillain", amount: 4 }], else: [{ do: "addThreat", target: "mainPlan", amount: 2 }] }] },
  { id: "avalancha", name: "Avalancha", type: "traicion", boost: 2, glyph: "🪨", text: "Si el villano es de Piedra, en forma de héroe recibes 3 daño (si no, +3 amenaza). Si no es de Piedra, añade 1 contador de Retraso y el villano se activa contra ti.",
    reveal: [{ do: "ifTrait", trait: "Piedra", effects: [heroHit(3)], else: [{ do: "planCounter", amount: 1 }, { do: "villainActivates" }] }] },
  { id: "bola-demolicion", name: "Bola de Demolición", type: "vinculo", boost: 1, glyph: "⛓", villainBonus: { fuerza: 1 }, keywords: ["arrollador"], text: "Vínculo: el villano obtiene +1 Fuerza y Arrollador. Héroe, agota a tu héroe: descártala." },
  { id: "recluso-fugado", name: "Recluso Fugado", type: "esbirro", boost: 1, glyph: "⛓", text: "Esbirro.", minion: { vida: 3, fuerza: 1, plan: 1 } },
  { id: "barricada-puente", name: "Barricada del Puente", type: "plan", boost: 0, glyph: "🌉", sidePlan: { amenaza: 4, aceleracion: true }, text: "Plan secundario (4 amenaza). Aceleración." },
  // Experto
  { id: "absorcion-total", name: "Absorción Total", type: "traicion", boost: 2, glyph: "🌀", text: "El villano absorbe otro entorno y se activa contra ti.", reveal: [{ do: "newEnvironment" }, { do: "villainActivates" }] },
  { id: "socio-celda", name: "Socio de Celda", type: "esbirro", boost: 2, glyph: "🦍", text: "Guardia.", minion: { vida: 5, fuerza: 2, plan: 1, guardia: true } },
  { id: "derrumbe", name: "Derrumbe", type: "traicion", boost: 2, glyph: "🏚", text: "En forma de héroe recibes 3 daño; si no, añade 2 amenaza.", reveal: [heroHit(3, 2)] },

  // MARK: 3 · Réplica, el Imitador
  { id: "alumno-replica", name: "Alumno de Réplica", type: "esbirro", boost: 1, glyph: "🥋", traits: legion, text: "Legión. Entrenado para copiar.", minion: { vida: 3, fuerza: 2, plan: 1 } },
  { id: "contraataque-aprendido", name: "Contraataque Aprendido", type: "traicion", boost: 2, glyph: "🔁", text: "El villano se activa contra ti.", reveal: [{ do: "villainActivates" }] },
  { id: "estudio-combate", name: "Estudio de Combate", type: "traicion", boost: 1, glyph: "📹", text: "Tu héroe queda Aturdido y Confundido.", reveal: [{ do: "status", status: "stunned", target: "self" }, { do: "status", status: "confused", target: "self" }] },
  { id: "memoria-muscular", name: "Memoria Muscular", type: "traicion", boost: 1, glyph: "🧠", text: "En forma de héroe recibes 2 daño; si no, añade 2 amenaza. ⚡ Refuerzo: tu héroe queda Confundido.",
    reveal: [heroHit(2)], boostEffect: [{ do: "status", status: "confused", target: "self" }], boostText: "tu héroe queda Confundido." },
  { id: "escudo-imitado", name: "Escudo Imitado", type: "vinculo", boost: 1, glyph: "🛡", villainBonus: { vida: 5 }, text: "Vínculo: el villano obtiene +5 vida. Héroe, agota a tu héroe: descártalo." },
  { id: "espada-imitada", name: "Espada Imitada", type: "vinculo", boost: 2, glyph: "⚔", villainBonus: { fuerza: 1 }, keywords: ["perforante"], text: "Vínculo: el villano obtiene +1 Fuerza y Perforante. Héroe, agota a tu héroe: descártala." },
  { id: "academia-replica", name: "Academia de Réplica", type: "plan", boost: 0, glyph: "🏫", sidePlan: { amenaza: 4, peligro: true }, text: "Plan secundario (4 amenaza). Peligro: cada fase del villano se reparte 1 carta de encuentro más." },
  { id: "persecucion-implacable", name: "Persecución Implacable", type: "traicion", boost: 1, glyph: "🏃", text: "Añade 1 amenaza al plan principal. Oleada.", reveal: [{ do: "addThreat", target: "mainPlan", amount: 1 }, { do: "surge" }] },
  { id: "celda-contencion", name: "Celda de Contención", type: "plan", boost: 0, glyph: "🔒", sidePlan: { amenaza: 5 },
    text: "Plan secundario (5 amenaza). Empieza en juego con dos aliados capturados debajo: frústralo para rescatarlos." },
  // Experto
  { id: "maestro-de-todo", name: "Maestro de Todo", type: "traicion", boost: 2, glyph: "🎭", text: "El villano obtiene Duro (si ya lo era: oleada) y se activa contra ti.", reveal: [{ do: "villainTough" }, { do: "villainActivates" }] },
  { id: "doble-replica", name: "Doble de Réplica", type: "esbirro", boost: 2, glyph: "👥", text: "Guardia.", minion: { vida: 5, fuerza: 3, plan: 1, guardia: true } },
  { id: "golpe-predecible", name: "Golpe Predecible", type: "traicion", boost: 2, glyph: "🥊", text: "En forma de héroe recibes 3 daño; si no, añade 3 amenaza.", reveal: [heroHit(3)] },

  // MARK: 4 · Doctor Quimera, el Genetista
  { id: "mutante-laboratorio", name: "Mutante de Laboratorio", type: "esbirro", boost: 1, glyph: "🧟", traits: mutante, text: "Mutante. Represalia 1: si le atacas, recibes 1 daño.", minion: { vida: 4, fuerza: 1, plan: 1, retaliate: 1 } },
  { id: "bestia-quimerica", name: "Bestia Quimérica", type: "esbirro", boost: 2, glyph: "🐲", traits: mutante, text: "Mutante. Entra en juego Duro.", minion: { vida: 5, fuerza: 2, plan: 0 }, startStatus: ["tough"] },
  { id: "golem-biologico", name: "Gólem Biológico", type: "esbirro", boost: 1, glyph: "🧫", traits: mutante, text: "Mutante. Guardia.", minion: { vida: 5, fuerza: 2, plan: 1, guardia: true } },
  { id: "guardian-celdas", name: "Guardián de Celdas", type: "esbirro", boost: 1, glyph: "🗝", traits: legion, text: "Legión.", minion: { vida: 3, fuerza: 1, plan: 2 } },
  { id: "celdas-isla", name: "Celdas de la Isla", type: "plan", boost: 0, glyph: "🏝", sidePlan: { amenaza: 4, aceleracion: true }, text: "Plan secundario (4 amenaza). Aceleración." },
  { id: "delirio", name: "Delirio", type: "traicion", boost: 1, glyph: "😵", text: "Tu héroe queda Confundido y el plan principal gana 1 contador de Pruebas.", reveal: [{ do: "status", status: "confused", target: "self" }, { do: "planCounter", amount: 1 }] },
  { id: "frenesi-mutante", name: "Frenesí Mutante", type: "traicion", boost: 2, glyph: "🩸", text: "Cada esbirro enfrentado a ti se activa. El plan principal gana 1 contador de Pruebas.", reveal: [{ do: "minionsActivate" }, { do: "planCounter", amount: 1 }] },
  { id: "inyeccion-experimental", name: "Inyección Experimental", type: "traicion", boost: 1, glyph: "💉", text: "El plan principal gana 2 contadores de Pruebas.", reveal: [{ do: "planCounter", amount: 2 }] },
  { id: "suero-mejora", name: "Suero de Mejora", type: "vinculo", boost: 1, glyph: "🧪", villainBonus: { plan: 1, vida: 3 }, text: "Vínculo: el villano obtiene +1 Plan y +3 vida. Héroe, agota a tu héroe: descártalo." },
  // Experto
  { id: "siervo-definitivo", name: "Siervo Definitivo", type: "esbirro", boost: 2, glyph: "🦠", traits: mutante, text: "Mutante. Entra en juego Duro. Represalia 1.", minion: { vida: 8, fuerza: 3, plan: 1, retaliate: 1 }, startStatus: ["tough"] },
  { id: "aceleracion-genetica", name: "Aceleración Genética", type: "traicion", boost: 2, glyph: "🧬", text: "El plan principal gana 2 contadores de Pruebas y el villano se activa contra ti.", reveal: [{ do: "planCounter", amount: 2 }, { do: "villainActivates" }] },
  { id: "mutacion-forzada", name: "Mutación Forzada", type: "traicion", boost: 2, glyph: "☣", text: "Descarta cartas de encuentro hasta revelar un esbirro Mutante: se enfrenta a ti.", reveal: [{ do: "spawnTrait", trait: "mutante" }] },

  // MARK: 5 · El Mariscal de Ceniza
  { id: "oficial-ceniza", name: "Oficial de la Ceniza", type: "esbirro", boost: 1, glyph: "🎖", traits: legion, text: "Legión.", minion: { vida: 3, fuerza: 2, plan: 1 } },
  { id: "guardia-mariscal", name: "Guardia del Mariscal", type: "esbirro", boost: 2, glyph: "💂", traits: legion, text: "Legión. Guardia.", minion: { vida: 5, fuerza: 2, plan: 1, guardia: true } },
  { id: "ordenes-mariscal", name: "Órdenes del Mariscal", type: "traicion", boost: 1, glyph: "📜", text: "Pon en juego el siguiente plan del mazo de planes secundarios y añade 1 amenaza al plan principal.",
    reveal: [{ do: "nextSidePlan" }, { do: "addThreat", target: "mainPlan", amount: 1 }] },
  { id: "propaganda", name: "Propaganda", type: "traicion", boost: 2, glyph: "📢", text: "Añade 2 amenaza al plan principal.", reveal: [{ do: "addThreat", target: "mainPlan", amount: 2 }] },
  { id: "mano-hierro", name: "Mano de Hierro", type: "traicion", boost: 2, glyph: "✊", text: "El villano se activa contra ti.", reveal: [{ do: "villainActivates" }] },
  { id: "baston-mando", name: "Bastón de Mando", type: "vinculo", boost: 1, glyph: "🦯", villainBonus: { fuerza: 1 }, keywords: ["perforante"], text: "Vínculo: el villano obtiene +1 Fuerza y Perforante. Héroe, agota a tu héroe: descártalo." },
  { id: "la-purga", name: "La Purga", type: "traicion", boost: 1, glyph: "🔥", text: "Cada uno de tus aliados recibe 2 daño. En forma de héroe recibes 1 daño; si no, +1 amenaza.", reveal: [{ do: "damage", target: "allAllies", amount: 2 }, heroHit(1)] },
  // Planes secundarios (mazo aparte)
  { id: "cuartel-ceniza", name: "Cuartel de la Ceniza", type: "plan", boost: 0, glyph: "🏰", sidePlan: { amenaza: 3 }, villainBonus: { fuerza: 1 }, text: "Plan secundario (3 amenaza). Mientras esté en juego, el villano tiene +1 Fuerza." },
  { id: "campos-internamiento", name: "Campos de Internamiento", type: "plan", boost: 0, glyph: "⛓", sidePlan: { amenaza: 3, crisis: true }, text: "Plan secundario (3 amenaza). Crisis: no puedes retirar amenaza del plan principal." },
  { id: "tropas-frontera", name: "Tropas en la Frontera", type: "plan", boost: 0, glyph: "🚩", sidePlan: { amenaza: 3, aceleracion: true }, text: "Plan secundario (3 amenaza). Aceleración." },
  { id: "fabricas-guerra", name: "Fábricas de Guerra", type: "plan", boost: 0, glyph: "🏭", sidePlan: { amenaza: 3, peligro: true }, text: "Plan secundario (3 amenaza). Peligro: se reparte 1 carta de encuentro más cada fase." },
  { id: "red-espias", name: "Red de Espías", type: "plan", boost: 0, glyph: "🕵", sidePlan: { amenaza: 3 }, villainBonus: { plan: 1 }, text: "Plan secundario (3 amenaza). El villano tiene +1 Plan." },
  // El Coloso Dormido (aparte)
  { id: "coloso-dormido", name: "El Coloso Dormido", type: "plan", boost: 0, glyph: "💤", sidePlan: { amenaza: 2, grows: 1, completeAt: 7, onComplete: [{ do: "spawn", card: "coloso-despierto" }] },
    text: "Plan secundario. Al empezar cada fase del villano gana 1 amenaza por jugador. Si llega a 7 por jugador, se completa: el Coloso Despierto se enfrenta al primer jugador." },
  { id: "coloso-despierto", name: "El Coloso Despierto", type: "esbirro", boost: 0, glyph: "🗿", text: "Guardia. Arrollador. Un arma viviente que la Legión mantuvo dormida.", minion: { vida: 12, fuerza: 4, plan: 2, guardia: true, keywords: ["arrollador"] } },
  // Experto
  { id: "doctrina-ceniza", name: "Doctrina de la Ceniza", type: "traicion", boost: 2, glyph: "📕", text: "Pon en juego el siguiente plan secundario y el villano se activa contra ti.", reveal: [{ do: "nextSidePlan" }, { do: "villainActivates" }] },
  { id: "verdugo-ceniza", name: "Verdugo de la Ceniza", type: "esbirro", boost: 2, glyph: "🪓", traits: legion, text: "Legión. Perforante.", minion: { vida: 5, fuerza: 3, plan: 1, keywords: ["perforante"] } },
  { id: "estado-sitio", name: "Estado de Sitio", type: "plan", boost: 0, glyph: "🚫", sidePlan: { amenaza: 4, aceleracion: true, peligro: true }, text: "Plan secundario (4 amenaza). Aceleración. Peligro." },

  // MARK: Condiciones de campaña
  { id: "prototipo-robado", name: "Prototipo Robado", type: "vinculo", boost: 1, glyph: "🔫", traits: ["arma"], villainBonus: { fuerza: 1 }, removal: { cost: 2, res: "fisico" },
    text: "Condición de campaña: la Legión se quedó un arma de Saeta Negra. Vínculo: +1 Fuerza. Héroe: gasta ✊✊ para quitársela." },
  { id: "mutante-fugado", name: "Mutante Fugado", type: "esbirro", boost: 1, glyph: "🧟", traits: mutante, text: "Condición de campaña: escapó de la isla del Doctor Quimera. Mutante. Represalia 1.", minion: { vida: 5, fuerza: 2, plan: 1, retaliate: 1 } },
];

export const CENIZA_SETS: Record<string, string[]> = {
  "asalto-legion": ["soldado-asalto", "soldado-asalto", "comandante-asalto", "ofensiva-relampago", "puesto-avanzado"],
  "patrulla-legion": ["patrullero", "patrullero", "rastreador-legion", "control-carreteras", "redada"],
  "maestro-armas": ["armero-legion", "instruccion-tiro", "taller-prototipos", "municion-especial"],
  saeta: ["mercenario-legion", "mercenario-legion", "mercenario-legion", "tirador-elite", "fuego-cobertura", "prueba-campo", "retirada-calculada", "disparo-certero", "camara-acorazada"],
  "experto-saeta": ["arsenal-completo", "francotirador", "rafaga-supresion"],
  amalgama: ["acantilados-rocosos", "fabrica-abandonada", "montanas-nevadas", "bosque-denso", "golpe-material", "golpe-material", "piel-cambiante", "congelacion", "raices-profundas", "avalancha", "bola-demolicion", "recluso-fugado", "recluso-fugado", "barricada-puente"],
  "experto-amalgama": ["absorcion-total", "socio-celda", "derrumbe"],
  replica: ["alumno-replica", "alumno-replica", "contraataque-aprendido", "estudio-combate", "memoria-muscular", "memoria-muscular", "escudo-imitado", "espada-imitada", "academia-replica", "persecucion-implacable", "celda-contencion"],
  "experto-replica": ["maestro-de-todo", "doble-replica", "golpe-predecible"],
  quimera: ["mutante-laboratorio", "mutante-laboratorio", "bestia-quimerica", "golem-biologico", "guardian-celdas", "celdas-isla", "delirio", "frenesi-mutante", "inyeccion-experimental", "suero-mejora"],
  "experto-quimera": ["siervo-definitivo", "aceleracion-genetica", "mutacion-forzada"],
  mariscal: ["oficial-ceniza", "oficial-ceniza", "oficial-ceniza", "guardia-mariscal", "ordenes-mariscal", "propaganda", "mano-hierro", "baston-mando", "la-purga"],
  "experto-mariscal": ["doctrina-ceniza", "verdugo-ceniza", "estado-sitio"],
};

// MARK: Player cards: captured allies and campaign rewards

export const CENIZA_CARDS: PlayerCardDef[] = [
  // Captured by Réplica (rescued allies join the rescuer's deck for the rest of the campaign).
  { id: "sargento-brisa", name: "Sargento Brisa, Rastreadora", type: "aliado", cost: 3, resources: 1, resType: "mental", glyph: "🏹",
    text: "Aliado. Puntería: después de que ataque, el objetivo queda Aturdido. Atacar o contener le cuesta 1 daño.",
    ally: { vida: 3, fuerza: 2, ingenio: 2, consFuerza: 1, consIngenio: 1, onAttack: [{ do: "status", status: "stunned", target: "lastTarget" }] } },
  { id: "hermano-cobalto", name: "Hermano Cobalto, Monje Guerrero", type: "aliado", cost: 3, resources: 1, resType: "fisico", glyph: "🧘",
    text: "Aliado. Paso firme: cuando bloquea un ataque, evita 2 daño. Atacar o contener le cuesta 1 daño.",
    ally: { vida: 4, fuerza: 2, ingenio: 1, consFuerza: 1, consIngenio: 1, onBlock: [{ do: "prevent", amount: 2 }] } },
  // Rewards
  { id: "arma-confiscada", name: "Arma Confiscada", type: "mejora", cost: 2, resources: 1, resType: "fisico", glyph: "🔫", traits: ["campana"],
    text: "Recompensa de campaña. Héroe. Acción, agota esta carta: inflige 2 daño a un enemigo.",
    ability: { timing: "action", cost: "exhaust", heroOnly: true, effects: [{ do: "damage", target: "chooseEnemy", amount: 2 }], text: "Disparo confiscado: 2 daño" } },
  { id: "blindaje-recuperado", name: "Blindaje Recuperado", type: "mejora", cost: 2, resources: 1, resType: "energia", glyph: "🦺", traits: ["campana"],
    text: "Recompensa de campaña. Tu héroe obtiene +1 Aguante y +2 Vida máxima.", bonus: { aguante: 1, vidaMax: 2 } },
  { id: "muestra-materia", name: "Muestra de Materia Viva", type: "apoyo", cost: 1, resources: 1, resType: "mental", glyph: "🧫", traits: ["campana"],
    text: "Recompensa de campaña. Apoyo. Acción, agota esta carta: tu héroe obtiene Duro.",
    ability: { timing: "action", cost: "exhaust", effects: [{ do: "status", status: "tough", target: "self" }], text: "Endurecer: obtienes Duro" } },
  { id: "mapa-pasos", name: "Mapa de los Pasos de Montaña", type: "apoyo", cost: 2, resources: 1, resType: "mental", glyph: "🗺", traits: ["campana"],
    text: "Recompensa de campaña. Apoyo. Acción, agota esta carta: retira 1 amenaza de un plan.",
    ability: { timing: "action", cost: "exhaust", effects: [{ do: "thwart", target: "choosePlan", amount: 1 }], text: "Atajo: retira 1 amenaza" } },
  { id: "expediente-robado", name: "Expediente Robado", type: "evento", cost: 1, resources: 1, resType: "mental", glyph: "📁", traits: ["campana"],
    text: "Recompensa de campaña. Acción: roba 2 cartas y retira 1 amenaza de un plan.", play: { timing: "action", effects: [{ do: "draw", amount: 2 }, { do: "thwart", target: "choosePlan", amount: 1 }] } },
  { id: "tecnica-aprendida", name: "Técnica Aprendida", type: "mejora", cost: 1, resources: 1, resType: "fisico", glyph: "🥋", traits: ["campana"],
    text: "Recompensa de campaña. Tu héroe obtiene +1 Fuerza.", bonus: { fuerza: 1 } },
  { id: "antidoto", name: "Antídoto Universal", type: "evento", cost: 0, resources: 1, resType: "energia", glyph: "💊", traits: ["campana"],
    text: "Recompensa de campaña. Acción: cura 4 daño a tu héroe.", play: { timing: "action", effects: [{ do: "heal", target: "self", amount: 4 }] } },
  { id: "suero-estabilizado", name: "Suero Estabilizado", type: "mejora", cost: 2, resources: 1, resType: "energia", glyph: "🧪", traits: ["campana"],
    text: "Recompensa de campaña. Tu héroe obtiene +1 Ingenio y +2 Vida máxima.", bonus: { ingenio: 1, vidaMax: 2 } },
];

// MARK: Scenarios

export const CENIZA_SCENARIOS: ScenarioDef[] = [
  {
    id: "saeta-negra", pack: PACK,
    name: "Asalto al Laboratorio",
    intro: "La Legión de Ceniza ha contratado a Saeta Negra para robar las armas experimentales del laboratorio real de Aurelia. Cada prototipo que se lleve puesto lo hace más letal: desactívalos gastando recursos.",
    villain: {
      name: "Saeta Negra, el Mercenario", glyph: "🏹",
      stages: [
        { name: "Saeta Negra I", vidaPorJugador: 13, fuerza: 2, plan: 1, keywords: ["distancia"], text: "A distancia: la Represalia no le alcanza." },
        { name: "Saeta Negra II", vidaPorJugador: 15, fuerza: 2, plan: 1, keywords: ["distancia"], revealEffects: [{ do: "armWeapon" }], text: "A distancia. Al revelarse: se equipa con un arma experimental." },
        { name: "Saeta Negra III", vidaPorJugador: 17, fuerza: 3, plan: 2, keywords: ["distancia"], onReveal: { tough: true }, revealEffects: [{ do: "armWeapon" }], text: "A distancia. Al revelarse: obtiene Duro y un arma experimental." },
      ],
      stagesFor: { normal: [0, 1], expert: [1, 2] },
    },
    mainPlan: { name: "Asalto a las Instalaciones", inicioPorJugador: 0, aceleracionPorJugador: 1, limitePorJugador: 7, text: "Al completarse, pasa a La Huida." },
    nextPlans: [
      { name: "La Huida", inicioPorJugador: 1, aceleracionPorJugador: 1, limitePorJugador: 7, text: "Al completarse, pasa a Sin Rastro." },
      { name: "Sin Rastro", inicioPorJugador: 1, aceleracionPorJugador: 1, limitePorJugador: 8, text: "Saeta Negra escapa con el arsenal: derrota." },
    ],
    sideDecks: { armas: ["rifle-pulsos", "guanteletes-sismicos", "exoarmadura-asalto", "canon-laser", "cuchillas-plasma"] },
    setup: [{ do: "armWeapon" }],
    encounterSets: ["saeta", "asalto-legion", "maestro-armas", "estandar"],
    expertSets: ["experto-saeta"],
  },
  {
    id: "amalgama", pack: PACK,
    name: "Nadie Pasará",
    intro: "Amalgama, el Absorbedor, guarda el único puente hacia el cuartel de la Legión. Toca un material y se convierte en él: piedra que atraviesa, acero que golpea, hielo que paraliza, madera que se regenera.",
    villain: {
      name: "Amalgama, el Absorbedor", glyph: "🪨",
      stages: [
        { name: "Amalgama I", vidaPorJugador: 14, fuerza: 2, plan: 1, text: "Absorbe el entorno en juego y gana su rasgo." },
        { name: "Amalgama II", vidaPorJugador: 16, fuerza: 2, plan: 2, revealEffects: [{ do: "newEnvironment" }], text: "Al revelarse: absorbe otro entorno." },
        { name: "Amalgama III", vidaPorJugador: 18, fuerza: 3, plan: 2, onReveal: { tough: true }, revealEffects: [{ do: "newEnvironment" }], text: "Al revelarse: obtiene Duro y absorbe otro entorno." },
      ],
      stagesFor: { normal: [0, 1], expert: [1, 2] },
    },
    mainPlan: { name: "Nadie Pasará", inicioPorJugador: 0, aceleracionPorJugador: 1, limitePorJugador: 8, text: "Al completarse, pasa a El Puente Cae." },
    nextPlans: [{ name: "El Puente Cae", inicioPorJugador: 1, aceleracionPorJugador: 1, limitePorJugador: 9, text: "El puente se derrumba con vosotros encima: derrota." }],
    counters: { name: "Retraso", perRound: 1, threshold: 3, effects: [{ do: "newEnvironment" }, { do: "villainActivates" }], text: "Amalgama cambia de materia y carga: absorbe otro entorno y se activa contra el primer jugador." },
    setup: [{ do: "newEnvironment" }],
    encounterSets: ["amalgama", "patrulla-legion", "estandar"],
    expertSets: ["experto-amalgama"],
  },
  {
    id: "replica", pack: PACK,
    name: "El Imitador",
    intro: "Réplica, el Imitador, ha estudiado cada combate grabado en Aurelia. Si te ve transformarte, ya sabe cómo golpearte. Además tiene a dos aliados encerrados en su Celda de Contención.",
    villain: {
      name: "Réplica, el Imitador", glyph: "🎭",
      stages: [
        { name: "Réplica I", vidaPorJugador: 13, fuerza: 2, plan: 1, flipPunish: 1, text: "Reflejos fotográficos: cuando te transformas en héroe, recibes 1 daño." },
        { name: "Réplica II", vidaPorJugador: 15, fuerza: 2, plan: 2, flipPunish: 2, text: "Reflejos fotográficos: cuando te transformas en héroe, recibes 2 daño." },
        { name: "Réplica III", vidaPorJugador: 17, fuerza: 3, plan: 2, flipPunish: 2, onReveal: { tough: true }, text: "Reflejos fotográficos (2 daño al transformarte). Al revelarse: obtiene Duro." },
      ],
      stagesFor: { normal: [0, 1], expert: [1, 2] },
    },
    mainPlan: { name: "Cacería de Héroes", inicioPorJugador: 1, aceleracionPorJugador: 1, limitePorJugador: 8, text: "Al completarse, pasa a El Expediente Completo." },
    nextPlans: [{ name: "El Expediente Completo", inicioPorJugador: 1, aceleracionPorJugador: 1, limitePorJugador: 9, text: "Réplica conoce todos vuestros secretos: derrota." }],
    setupSidePlans: ["celda-contencion"],
    captives: { plan: "celda-contencion", allies: ["sargento-brisa", "hermano-cobalto"] },
    encounterSets: ["replica", "patrulla-legion", "estandar"],
    expertSets: ["experto-replica"],
  },
  {
    id: "quimera", pack: PACK,
    name: "La Isla del Doctor Quimera",
    intro: "En una isla de niebla, el Doctor Quimera prueba sueros de la Legión en sus prisioneros. Cada fase del villano suma una Prueba; a la cuarta, un Mutante sale del laboratorio.",
    villain: {
      name: "Doctor Quimera, el Genetista", glyph: "🧬",
      stages: [
        { name: "Doctor Quimera I", vidaPorJugador: 13, fuerza: 1, plan: 1, text: "Prefiere que sus creaciones peleen por él." },
        { name: "Doctor Quimera II", vidaPorJugador: 15, fuerza: 2, plan: 2, revealEffects: [{ do: "spawnTrait", trait: "mutante" }], text: "Al revelarse: un Mutante se enfrenta al primer jugador." },
        { name: "Doctor Quimera III", vidaPorJugador: 17, fuerza: 2, plan: 3, onReveal: { tough: true }, revealEffects: [{ do: "spawnTrait", trait: "mutante" }], text: "Al revelarse: obtiene Duro y libera un Mutante." },
      ],
      stagesFor: { normal: [0, 1], expert: [1, 2] },
    },
    mainPlan: { name: "La Isla del Doctor Quimera", inicioPorJugador: 0, aceleracionPorJugador: 1, limitePorJugador: 10, text: "Al completarse, pasa a El Sujeto Definitivo." },
    nextPlans: [{ name: "El Sujeto Definitivo", inicioPorJugador: 1, aceleracionPorJugador: 1, limitePorJugador: 11, text: "El suero definitivo está listo: derrota." }],
    counters: { name: "Pruebas", perRound: 1, threshold: 4, effects: [{ do: "spawnTrait", trait: "mutante" }], text: "Un experimento escapa: descarta cartas de encuentro hasta revelar un Mutante, que se enfrenta al primer jugador." },
    encounterSets: ["quimera", "asalto-legion", "estandar"],
    expertSets: ["experto-quimera"],
  },
  {
    id: "mariscal", pack: PACK,
    name: "El Mariscal de Ceniza",
    intro: "El Mariscal de Ceniza, señor de la guerra de la Legión, por fin da la cara. Mueve sus planes como piezas de ajedrez: al empezar cada fase del villano, si hay menos de 2 planes secundarios, pone otro en juego. Y bajo la fortaleza duerme un coloso.",
    villain: {
      name: "El Mariscal de Ceniza", glyph: "🔥",
      stages: [
        { name: "Mariscal de Ceniza I", vidaPorJugador: 14, fuerza: 2, plan: 1, text: "Cada fase del villano: si hay menos de 2 planes secundarios, pone el siguiente en juego." },
        { name: "Mariscal de Ceniza II", vidaPorJugador: 16, fuerza: 2, plan: 2, revealEffects: [{ do: "nextSidePlan" }], text: "Al revelarse: pone en juego el siguiente plan secundario." },
        { name: "Mariscal de Ceniza III", vidaPorJugador: 19, fuerza: 3, plan: 3, onReveal: { tough: true }, revealEffects: [{ do: "nextSidePlan" }], text: "Al revelarse: obtiene Duro y pone en juego otro plan secundario." },
      ],
      stagesFor: { normal: [0, 1], expert: [1, 2] },
    },
    mainPlan: { name: "La Cumbre de Ceniza", inicioPorJugador: 0, aceleracionPorJugador: 1, limitePorJugador: 11, text: "Al completarse, pasa a El Nuevo Orden." },
    nextPlans: [{ name: "El Nuevo Orden", inicioPorJugador: 1, aceleracionPorJugador: 1, limitePorJugador: 12, text: "La Legión de Ceniza gobierna Valdoria: derrota." }],
    sideDecks: { planes: ["cuartel-ceniza", "campos-internamiento", "tropas-frontera", "fabricas-guerra", "red-espias"] },
    setAside: ["coloso-dormido", "coloso-despierto"],
    setup: [{ do: "spawn", card: "coloso-dormido" }, { do: "nextSidePlan" }],
    phaseStart: [{ do: "nextSidePlan", ifFewer: 2 }],
    encounterSets: ["mariscal", "asalto-legion", "patrulla-legion", "estandar"],
    expertSets: ["experto-mariscal"],
  },
];

// MARK: Campaign rules

export interface CampaignCondition { id: string; name: string; text: string; extraEncounter?: string[]; startThreat?: number }
export interface CampaignDef {
  id: string; name: string; scenarios: string[];
  /** Reward cards offered after beating each scenario (each hero picks one for their deck). */
  rewards: Record<string, string[]>;
  conditions: Record<string, CampaignCondition>;
}

export const CENIZA_CAMPAIGN: CampaignDef = {
  id: PACK,
  name: "El Ascenso del Mariscal de Ceniza",
  scenarios: ["saeta-negra", "amalgama", "replica", "quimera", "mariscal"],
  rewards: {
    "saeta-negra": ["arma-confiscada", "blindaje-recuperado"],
    amalgama: ["muestra-materia", "mapa-pasos"],
    replica: ["expediente-robado", "tecnica-aprendida"],
    quimera: ["antidoto", "suero-estabilizado"],
  },
  conditions: {
    "arsenal-legion": { id: "arsenal-legion", name: "Arsenal de la Legión", text: "Saeta Negra terminó con armas experimentales puestas: la Legión se quedó un prototipo. Prototipo Robado entra en los mazos de encuentros de las siguientes misiones.", extraEncounter: ["prototipo-robado"] },
    "rutas-cortadas": { id: "rutas-cortadas", name: "Rutas Cortadas", text: "Amalgama llegó a derrumbar el puente antes de caer: las siguientes misiones empiezan con +1 amenaza por jugador.", startThreat: 1 },
    "mutantes-fugados": { id: "mutantes-fugados", name: "Mutantes Fugados", text: "Quedaban Mutantes en pie al caer el Doctor Quimera: Mutante Fugado entra en el mazo de encuentros de la batalla final.", extraEncounter: ["mutante-fugado"] },
  },
};
