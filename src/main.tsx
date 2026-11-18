import { render } from "preact";
import { useState } from "preact/hooks";
import "./styles.css";
import { ENCOUNTER_CARDS, ENCOUNTER_SETS, HEROES, SCENARIOS } from "./data/content";
import type { ScenarioDef } from "./engine/types";
import { DeckViewer } from "./ui/DeckViewer";
import { store, useStore } from "./ui/store";
import { Modal, Portrait, Rules, Table } from "./ui/Table";

/** Start: choose one or two heroes and a scenario, or continue the saved game. */
function Start() {
  const [heroes, setHeroes] = useState<string[]>([HEROES[0].id]);
  const [scenario, setScenario] = useState(SCENARIOS[0].id);
  const [rules, setRules] = useState(false);
  const [difficulty, setDifficulty] = useState<"normal" | "experto">("normal");
  const [deck, setDeck] = useState<string>();
  const toggle = (id: string) => setHeroes(heroes.includes(id) ? heroes.filter((h) => h !== id) : heroes.length >= 2 ? [heroes[1], id] : [...heroes, id]);
  const sc = SCENARIOS.find((x) => x.id === scenario)!;
  return (
    <main class="start">
      <div class="logo">
        <div class="logo-mark" aria-hidden="true">☀</div>
        <h1>Heroica</h1>
        <p class="muted">Héroes con poderes en el reino de Valdoria</p>
      </div>
      <section class="panel">
        <div class="kicker">Elige tus héroes · uno, o dos para jugar a dos manos</div>
        <div class="hero-pick">
          {HEROES.map((h) => {
            const on = heroes.includes(h.id);
            return (
              <div key={h.id} class="pick-wrap">
              <button class={`pick${on ? " on" : ""}`} style={{ ["--hero" as string]: h.colour }} onClick={() => toggle(h.id)} aria-pressed={on}>
                <Portrait artKey={`hero-${h.id}`} glyph={h.glyph} />
                <span class="title">{h.hero.name}</span>
                <span class="muted small">{h.identity.name}</span>
                <span class="statline small"><span>⚔{h.hero.fuerza}</span><span>✦{h.hero.ingenio}</span><span>⛨{h.hero.aguante}</span><span>♥{h.vida}</span></span>
                <span class="small">{h.hero.text}</span>
                {on && <span class="chip ready">{heroes.indexOf(h.id) === 0 ? "Jugador 1" : "Jugador 2"}</span>}
              </button>
              <button class="act ghost deck-btn" onClick={() => setDeck(h.id)}>Ver mazo ({h.deck.length} cartas)</button>
              </div>
            );
          })}
        </div>
      </section>
      <section class="panel">
        <div class="kicker">Escenario</div>
        <div class="scenario-pick">
          {SCENARIOS.map((x) => (
            <button key={x.id} class={`pick scenario${x.id === scenario ? " on" : ""}`} onClick={() => setScenario(x.id)} aria-pressed={x.id === scenario}>
              <Portrait artKey={`villain-${x.id}`} glyph={x.villain.glyph} />
              <span class="title">{x.name}</span>
              <span class="muted small">{x.villain.name}</span>
            </button>
          ))}
        </div>
        <p class="muted">{sc.intro}</p>
        <div class="kicker">Dificultad</div>
        <div class="tabs" role="radiogroup">
          {(["normal", "experto"] as const).map((d) => (
            <button key={d} role="radio" aria-checked={difficulty === d} class={difficulty === d ? "on" : ""} style={{ ["--hero" as string]: d === "experto" ? "#c9452f" : "#4f9d4a" }} onClick={() => setDifficulty(d)}>
              {d === "normal" ? "Normal" : "Experto"}
            </button>
          ))}
        </div>
        <p class="muted small">{difficultyText(sc, difficulty)}</p>
      </section>
      <button class="act gold wide big" disabled={!heroes.length} onClick={() => store.start(scenario, heroes, difficulty)}>
        {heroes.length === 2 ? "Empezar a dos manos" : "Empezar en solitario"}
      </button>
      <button class="act ghost wide" onClick={() => setRules(true)}>Cómo se juega</button>
      {deck && <DeckViewer hero={HEROES.find((h) => h.id === deck)!} onClose={() => setDeck(undefined)} />}
      {rules && <Modal onClose={() => setRules(false)}><Rules /><button class="act ghost wide" onClick={() => setRules(false)}>Cerrar</button></Modal>}
    </main>
  );
}

/** What Normal and Experto mean for this scenario. */
function difficultyText(sc: ScenarioDef, d: "normal" | "experto"): string {
  const stages = (ix: number[]) => ix.map((k) => sc.villain.stages[k].name).join(" y ");
  const expertCards = (sc.expertSets ?? ["experto"]).flatMap((set) => ENCOUNTER_SETS[set]).map((id) => ENCOUNTER_CARDS.get(id)!.name);
  const sf = sc.villain.stagesFor;
  if (d === "normal") return sf ? `Fases del villano: ${stages(sf.normal)}.` : "La experiencia estándar.";
  return sf
    ? `Fases del villano: ${stages(sf.expert)}. Se añaden ${expertCards.length} cartas Experto: ${expertCards.join(", ")}.`
    : `El villano tiene +1 Fuerza y +2 vida por jugador en cada fase, y se añade el conjunto Experto (${expertCards.join(", ")}).`;
}

function App() {
  const st = useStore();
  return st.state ? <Table /> : <Start />;
}

render(<App />, document.getElementById("app")!);

if ("serviceWorker" in navigator && import.meta.env.PROD) void navigator.serviceWorker.register("./sw.js");
void navigator.storage?.persist?.();
