import { render } from "preact";
import { useState } from "preact/hooks";
import "./styles.css";
import { HEROES, SCENARIOS } from "./data/content";
import { store, useStore } from "./ui/store";
import { Modal, Portrait, Rules, Table } from "./ui/Table";

/** Start: choose one or two heroes and a scenario, or continue the saved game. */
function Start() {
  const [heroes, setHeroes] = useState<string[]>([HEROES[0].id]);
  const [scenario, setScenario] = useState(SCENARIOS[0].id);
  const [rules, setRules] = useState(false);
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
              <button key={h.id} class={`pick${on ? " on" : ""}`} style={{ ["--hero" as string]: h.colour }} onClick={() => toggle(h.id)} aria-pressed={on}>
                <Portrait artKey={`hero-${h.id}`} glyph={h.glyph} />
                <span class="title">{h.hero.name}</span>
                <span class="muted small">{h.identity.name}</span>
                <span class="statline small"><span>⚔{h.hero.fuerza}</span><span>✦{h.hero.ingenio}</span><span>⛨{h.hero.aguante}</span><span>♥{h.vida}</span></span>
                <span class="small">{h.hero.text}</span>
                {on && <span class="chip ready">{heroes.indexOf(h.id) === 0 ? "Jugador 1" : "Jugador 2"}</span>}
              </button>
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
      </section>
      <button class="act gold wide big" disabled={!heroes.length} onClick={() => store.start(scenario, heroes)}>
        {heroes.length === 2 ? "Empezar a dos manos" : "Empezar en solitario"}
      </button>
      <button class="act ghost wide" onClick={() => setRules(true)}>Cómo se juega</button>
      {rules && <Modal onClose={() => setRules(false)}><Rules /><button class="act ghost wide" onClick={() => setRules(false)}>Cerrar</button></Modal>}
    </main>
  );
}

function App() {
  const st = useStore();
  return st.state ? <Table /> : <Start />;
}

render(<App />, document.getElementById("app")!);

if ("serviceWorker" in navigator && import.meta.env.PROD) void navigator.serviceWorker.register("./sw.js");
void navigator.storage?.persist?.();
