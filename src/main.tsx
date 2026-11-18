import { render } from "preact";
import { useState } from "preact/hooks";
import "./styles.css";
import { ENCOUNTER_CARDS, ENCOUNTER_SETS, HEROES, SCENARIOS } from "./data/content";
import type { ScenarioDef } from "./engine/types";
import { DeckViewer } from "./ui/DeckViewer";
import { beaten, exportProgress, importProgress, resetProgress, tried, type Progress } from "./ui/progress";
import { store, useStore } from "./ui/store";
import { Modal, Portrait, Rules, Table } from "./ui/Table";

/** Start: choose one or two heroes and a scenario, or continue the saved game. */
function Start() {
  const [heroes, setHeroes] = useState<string[]>([HEROES[0].id]);
  const st = useStore();
  const p = st.progress;
  // Start on the first villain this hero hasn't beaten yet.
  const [scenario, setScenario] = useState((SCENARIOS.find((x) => !beaten(p, HEROES[0].id, x.id)) ?? SCENARIOS[0]).id);
  const [showProgress, setShowProgress] = useState(false);
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
                <HeroProgress p={p} hero={h.id} />
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
              <ScenarioStatus p={p} heroes={heroes} scenario={x.id} />
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
      <button class="act ghost wide" onClick={() => setShowProgress(true)}>Progreso por héroe</button>
      <button class="act ghost wide" onClick={() => setRules(true)}>Cómo se juega</button>
      {showProgress && <Modal wide label="Progreso" onClose={() => setShowProgress(false)}><ProgressTable p={p} /><button class="act ghost wide" onClick={() => setShowProgress(false)}>Cerrar</button></Modal>}
      {deck && <DeckViewer hero={HEROES.find((h) => h.id === deck)!} onClose={() => setDeck(undefined)} />}
      {rules && <Modal onClose={() => setRules(false)}><Rules /><button class="act ghost wide" onClick={() => setRules(false)}>Cerrar</button></Modal>}
    </main>
  );
}

/** Per scenario mark: ★ beaten on Experto, ✓ beaten on Normal, ✗ tried but not beaten, · not tried. */
function mark(p: Progress, hero: string, scenario: string) {
  const b = beaten(p, hero, scenario);
  if (b === "experto") return { icon: "★", cls: "expert", text: "vencido en Experto" };
  if (b === "normal") return { icon: "✓", cls: "won", text: "vencido en Normal" };
  if (tried(p, hero, scenario)) return { icon: "✗", cls: "lost", text: "intentado, sin victoria" };
  return { icon: "·", cls: "new", text: "sin jugar" };
}

/** On each hero: how many villains they have beaten, with one mark per scenario. */
function HeroProgress({ p, hero }: { p: Progress; hero: string }) {
  const n = SCENARIOS.filter((x) => beaten(p, hero, x.id)).length;
  return (
    <span class="hero-progress small" aria-label={`Villanos vencidos: ${n} de ${SCENARIOS.length}`}>
      <span>Vencidos {n}/{SCENARIOS.length}</span>
      {SCENARIOS.map((x) => {
        const m = mark(p, hero, x.id);
        return <span key={x.id} class={`pmark ${m.cls}`} title={`${x.villain.name}: ${m.text}`} aria-hidden="true">{m.icon}</span>;
      })}
    </span>
  );
}

/** On each scenario: whether the chosen heroes already beat it, so battles aren't repeated by mistake. */
function ScenarioStatus({ p, heroes, scenario }: { p: Progress; heroes: string[]; scenario: string }) {
  if (!heroes.length) return null;
  const marks = heroes.map((h) => ({ h, m: mark(p, h, scenario) }));
  const allNew = marks.every(({ m }) => m.cls === "new" || m.cls === "lost");
  if (allNew) return <span class="chip ready">Nuevo reto</span>;
  return (
    <span class="scenario-status small">
      {marks.map(({ h, m }) => (
        <span key={h} class={`pmark-line ${m.cls}`}>{m.icon} {HEROES.find((x) => x.id === h)!.hero.name}: {m.text}</span>
      ))}
    </span>
  );
}

/** Every hero against every villain, with wins, losses and the fastest win. */
function ProgressTable({ p }: { p: Progress }) {
  const st = useStore();
  const [msg, setMsg] = useState<string>();
  const download = () => {
    const url = URL.createObjectURL(new Blob([exportProgress()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url; a.download = "heroica-progreso.json"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const upload = (e: Event) => {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    void file.text().then((text) => {
      const err = importProgress(text);
      setMsg(err ?? "Progreso cargado.");
      if (!err) st.reloadProgress();
    });
  };
  const reset = () => {
    if (!confirm("¿Borrar todo el progreso de todos los héroes? No se puede deshacer.")) return;
    resetProgress(); st.reloadProgress(); setMsg("Progreso borrado.");
  };
  const cell = (hero: string, scenario: string, d: "normal" | "experto") => {
    const r = p[hero]?.[scenario]?.[d];
    if (!r || r.wins + r.losses === 0) return <span class="muted">—</span>;
    return (
      <span class={r.wins ? (d === "experto" ? "pmark expert" : "pmark won") : "pmark lost"}>
        {r.wins ? (d === "experto" ? "★" : "✓") : "✗"} {r.wins}V {r.losses}D{r.bestRound ? ` · ${r.bestRound} r.` : ""}
      </span>
    );
  };
  return (
    <div class="progress">
      <div class="title big">Progreso por héroe</div>
      <p class="muted small">Victorias (V) y derrotas (D) de cada héroe contra cada villano, y la victoria más rápida en rondas. Una partida a dos manos cuenta para los dos héroes. Se guarda en este dispositivo.</p>
      <div class="progress-scroll">
        <table class="progress-table">
          <thead>
            <tr><th scope="col">Héroe</th>{SCENARIOS.map((x) => <th key={x.id} scope="col">{x.villain.name}</th>)}</tr>
          </thead>
          <tbody>
            {HEROES.map((h) => (
              <tr key={h.id}>
                <th scope="row">{h.glyph} {h.hero.name}<div class="muted small">Vencidos {SCENARIOS.filter((x) => beaten(p, h.id, x.id)).length}/{SCENARIOS.length}</div></th>
                {SCENARIOS.map((x) => (
                  <td key={x.id}>
                    <div class="small"><span class="muted">Normal </span>{cell(h.id, x.id, "normal")}</div>
                    <div class="small"><span class="muted">Experto </span>{cell(h.id, x.id, "experto")}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div class="progress-actions">
        <button class="act ghost" onClick={download}>Exportar</button>
        <label class="act ghost">Importar<input type="file" accept="application/json,.json" hidden onChange={upload} /></label>
        <button class="act ghost" onClick={reset}>Borrar progreso</button>
      </div>
      {msg && <p class="small" role="status">{msg}</p>}
    </div>
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
