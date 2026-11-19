import { render } from "preact";
import { useState } from "preact/hooks";
import "./styles.css";
import { ENCOUNTER_CARDS, ENCOUNTER_SETS, HEROES, packOf, PACKS, PLAYER_CARDS, SCENARIOS } from "./data/content";
import { campaignById } from "./ui/campaign";
import { PlayerCard } from "./ui/Card";
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
  const [heroInfo, setHeroInfo] = useState<string>();
  const [pack, setPack] = useState(packOf(SCENARIOS.find((x) => x.id === scenario)!));
  const pk = PACKS.find((x) => x.id === pack)!;
  const packScenarios = SCENARIOS.filter((x) => packOf(x) === pack);
  const unlocked = pk.campaign ? st.campaigns[pk.id]?.unlocked ?? 0 : Infinity;
  const isLocked = (id: string) => packScenarios.findIndex((x) => x.id === id) > unlocked;
  const choosePack = (id: string) => {
    setPack(id);
    const list = SCENARIOS.filter((x) => packOf(x) === id);
    setScenario((list.find((x) => !beaten(p, heroes[0] ?? HEROES[0].id, x.id)) ?? list[0]).id);
  };
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
              <div class="row gap">
                <button class="act ghost deck-btn grow" onClick={() => setDeck(h.id)} aria-label={`Ver mazo de ${h.hero.name} (${h.deck.length} cartas)`}>Ver mazo · {h.deck.length}</button>
                <button class="act ghost deck-btn info-btn" onClick={() => setHeroInfo(h.id)} aria-label={`Progreso de ${h.hero.name}`} title="Progreso en campañas">📊</button>
              </div>
              </div>
            );
          })}
        </div>
      </section>
      <section class="panel">
        <div class="kicker">Campañas</div>
        <div class="tabs" role="tablist" aria-label="Campañas">
          {PACKS.map((x) => (
            <button key={x.id} role="tab" aria-selected={x.id === pack} class={x.id === pack ? "on" : ""} style={{ ["--hero" as string]: x.campaign ? "#b5442c" : "#3d6fb6" }} onClick={() => choosePack(x.id)}>
              {x.name}
            </button>
          ))}
        </div>
        <p class="muted small">{pk.intro}</p>
        {pk.campaign && <CampaignPanel id={pk.id} heroes={heroes} difficulty={difficulty} />}
        <div class="kicker">{pk.campaign ? "Misiones sueltas (las desbloqueas avanzando en la campaña)" : "Escenarios"}</div>
        <div class="scenario-pick">
          {packScenarios.map((x, k) => {
            const locked = isLocked(x.id);
            return (
              <button key={x.id} class={`pick scenario${x.id === scenario ? " on" : ""}${locked ? " locked" : ""}`} disabled={locked} onClick={() => setScenario(x.id)} aria-pressed={x.id === scenario}>
                <Portrait artKey={`villain-${x.id}`} glyph={locked ? "🔒" : x.villain.glyph} />
                <span class="muted small">{pk.campaign ? `Misión ${k + 1}` : `Escenario ${k + 1}`}</span>
                <span class="title">{x.name}</span>
                <span class="muted small">{x.villain.name}</span>
                {locked ? <span class="small">🔒 Supera la misión {k} en campaña para desbloquearla.</span> : <ScenarioStatus p={p} heroes={heroes} scenario={x.id} />}
              </button>
            );
          })}
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
      <button class="act gold wide big" disabled={!heroes.length || isLocked(scenario) || packOf(sc) !== pack} onClick={() => store.start(scenario, heroes, difficulty)}>
        {pk.campaign ? `Partida suelta: ${sc.name}` : heroes.length === 2 ? "Empezar a dos manos" : "Empezar en solitario"}
      </button>
      <button class="act ghost wide" onClick={() => setShowProgress(true)}>Progreso por héroe</button>
      <button class="act ghost wide" onClick={() => setRules(true)}>Cómo se juega</button>
      {heroInfo && <Modal label="Progreso del héroe" onClose={() => setHeroInfo(undefined)}><HeroCampaigns hero={heroInfo} /><button class="act ghost wide" onClick={() => setHeroInfo(undefined)}>Cerrar</button></Modal>}
      {showProgress && <Modal wide label="Progreso" onClose={() => setShowProgress(false)}><ProgressTable p={p} /><button class="act ghost wide" onClick={() => setShowProgress(false)}>Cerrar</button></Modal>}
      {deck && <DeckViewer hero={HEROES.find((h) => h.id === deck)!} onClose={() => setDeck(undefined)} />}
      {rules && <Modal onClose={() => setRules(false)}><Rules /><button class="act ghost wide" onClick={() => setRules(false)}>Cerrar</button></Modal>}
    </main>
  );
}

/** Campaign mode for a pack: start, continue, rewards between missions, and the campaign log. */
function CampaignPanel({ id, heroes, difficulty }: { id: string; heroes: string[]; difficulty: "normal" | "experto" }) {
  const st = useStore();
  const def = campaignById(id)!;
  const saved = st.campaigns[id];
  const c = saved?.active;
  const heroName = (h: string) => HEROES.find((x) => x.id === h)?.hero.name ?? h;
  const cardName = (cid: string) => PLAYER_CARDS.get(cid)?.name ?? cid;
  const startNew = () => {
    if (c && !confirm("Ya tienes una campaña en curso. ¿Empezar otra nueva? Se perderá la actual.")) return;
    st.startCampaign(id, heroes, difficulty);
  };
  const who = heroes.map(heroName).join(" y ");
  if (!c) {
    return (
      <div class="campaign">
        <div class="title">Modo campaña</div>
        <p class="small">Juega las {def.scenarios.length} misiones en orden con los mismos héroes. Entre misiones se guardan las heridas (la mitad del daño), las cartas de recompensa, los aliados rescatados y las condiciones que deje cada final.</p>
        {saved.completed > 0 && <p class="small">🏆 Campaña completada {saved.completed} {saved.completed === 1 ? "vez" : "veces"}.</p>}
        <button class="act gold wide" disabled={!heroes.length} onClick={startNew}>Empezar campaña con {who || "…"} ({difficulty === "experto" ? "Experto" : "Normal"})</button>
      </div>
    );
  }
  const done = c.step >= def.scenarios.length;
  const next = !done ? SCENARIOS.find((x) => x.id === def.scenarios[c.step])! : undefined;
  const extra = c.heroes.flatMap((h) => (c.boons[h] ?? []).length ? [`${heroName(h)}: ${c.boons[h].map(cardName).join(", ")}`] : []);
  const wounds = c.heroes.filter((h) => c.wounds[h]).map((h) => `${heroName(h)} ${c.wounds[h]}`);
  return (
    <div class="campaign">
      <div class="row"><span class="title grow">Campaña en curso</span><span class="chip">{c.difficulty === "experto" ? "Experto" : "Normal"}</span></div>
      <div class="small">{c.heroes.map(heroName).join(" y ")} · {Math.min(c.step, def.scenarios.length)}/{def.scenarios.length} villanos derrotados</div>
      <ol class="mission-track">
        {def.scenarios.map((sid, k) => {
          const x = SCENARIOS.find((y) => y.id === sid)!;
          const state = k < c.step ? "done" : k === c.step ? "now" : "todo";
          return <li key={sid} class={state}><span aria-hidden="true">{state === "done" ? "✓" : state === "now" ? "▶" : k + 1}</span> {x.villain.name}<span class="sr-only">{state === "done" ? " (derrotado)" : state === "now" ? " (siguiente)" : ""}</span></li>;
        })}
      </ol>
      {c.pendingReward ? (
        <div class="reward">
          <div class="kicker">Recompensa: cada héroe añade una carta a su mazo</div>
          {c.heroes.map((h) => (
            <div key={h}>
              <div class="small"><b>{heroName(h)}</b>{c.pendingReward!.chosen[h] ? ` eligió ${cardName(c.pendingReward!.chosen[h])}` : " elige:"}</div>
              <div class="cards wrap">
                {c.pendingReward!.options.map((o) => <PlayerCard key={o} def={PLAYER_CARDS.get(o)!} size="md" selected={c.pendingReward!.chosen[h] === o} onClick={() => st.chooseReward(id, h, o)} />)}
              </div>
            </div>
          ))}
        </div>
      ) : done ? (
        <p class="small">🏆 ¡Campaña completada! Puedes empezar otra con otros héroes o en Experto.</p>
      ) : (
        <button class="act gold wide" onClick={() => st.playMission(id)}>{c.attempts && c.log.at(-1)?.text.startsWith("Derrota") ? "Reintentar" : "Jugar"} misión {c.step + 1}: {next!.name}</button>
      )}
      {(wounds.length > 0 || extra.length > 0 || c.conditions.length > 0) && (
        <ul class="campaign-state small">
          {wounds.length > 0 && <li>🩹 Heridas: {wounds.join(", ")}</li>}
          {extra.length > 0 && <li>🎁 Cartas ganadas: {extra.join(" · ")}</li>}
          {c.conditions.map((k) => <li key={k}>⚠ {def.conditions[k].name}: {def.conditions[k].text}</li>)}
        </ul>
      )}
      <details class="campaign-log">
        <summary>Registro de campaña ({c.log.length})</summary>
        <ul class="small">{c.log.map((l, k) => <li key={k}>{l.text}</li>)}</ul>
      </details>
      <div class="row gap">
        <button class="act ghost grow" disabled={!heroes.length} onClick={startNew}>Nueva campaña con {who || "…"}</button>
        <button class="act ghost grow" onClick={() => { if (confirm("¿Abandonar la campaña en curso?")) st.abandonCampaign(id); }}>Abandonar</button>
      </div>
    </div>
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

/** On each hero: villains beaten in each campaign pack (details in the 📊 view). */
function HeroProgress({ p, hero }: { p: Progress; hero: string }) {
  const st = useStore();
  return (
    <span class="hero-progress small">
      {PACKS.map((pk) => {
        const list = SCENARIOS.filter((x) => packOf(x) === pk.id);
        const n = list.filter((x) => beaten(p, hero, x.id)).length;
        const done = pk.campaign ? Object.values(st.campaigns[pk.id]?.completedBy?.[hero] ?? {}).reduce((a, b) => a + (b ?? 0), 0) : 0;
        return (
          <span key={pk.id} class={`pack-chip${n === list.length ? " full" : ""}`} title={`${pk.name}: ${n} de ${list.length} villanos vencidos`}>
            {done > 0 ? "🏆 " : ""}{shortPack(pk.name)} {n}/{list.length}
          </span>
        );
      })}
    </span>
  );
}
const shortPack = (name: string) => (name.startsWith("El Ascenso del ") ? name.slice(15) : name);

/** A hero's quick view: each campaign pack, its scenarios with results, and the campaigns played and completed. */
function HeroCampaigns({ hero }: { hero: string }) {
  const st = useStore();
  const p = st.progress;
  const h = HEROES.find((x) => x.id === hero)!;
  return (
    <div class="hero-campaigns">
      <div class="title big">{h.glyph} {h.hero.name}</div>
      {PACKS.map((pk) => {
        const list = SCENARIOS.filter((x) => packOf(x) === pk.id);
        const n = list.filter((x) => beaten(p, hero, x.id)).length;
        const saved = pk.campaign ? st.campaigns[pk.id] : undefined;
        const by = saved?.completedBy?.[hero] ?? {};
        const active = saved?.active?.heroes.includes(hero) ? saved.active : undefined;
        return (
          <section key={pk.id} class="hc-pack">
            <div class="row"><span class="title grow">{pk.name}</span><span class={`pack-chip${n === list.length ? " full" : ""}`}>{n}/{list.length}</span></div>
            {pk.campaign && (
              <div class="small hc-camp">
                {by.normal || by.experto
                  ? <>🏆 Campaña completada: {[by.normal && `${by.normal}× Normal`, by.experto && `${by.experto}× Experto`].filter(Boolean).join(", ")}.</>
                  : <>Campaña aún no completada.</>}
                {active && <> En curso: misión {Math.min(active.step + 1, list.length)} de {list.length} ({active.difficulty === "experto" ? "Experto" : "Normal"}{active.heroes.length > 1 ? `, con ${active.heroes.filter((x) => x !== hero).map((x) => HEROES.find((y) => y.id === x)!.hero.name).join(", ")}` : ""}).</>}
              </div>
            )}
            <ul class="hc-list">
              {list.map((x) => {
                const m = mark(p, hero, x.id);
                const r = p[hero]?.[x.id] ?? {};
                const stat = (["normal", "experto"] as const).flatMap((d) => r[d] && r[d]!.wins + r[d]!.losses ? [`${d === "normal" ? "Normal" : "Experto"} ${r[d]!.wins}V ${r[d]!.losses}D${r[d]!.bestRound ? ` (mejor: ${r[d]!.bestRound} r.)` : ""}`] : []);
                return (
                  <li key={x.id}>
                    <span class={`pmark ${m.cls}`} aria-hidden="true">{m.icon}</span>
                    <span class="grow"><b>{x.villain.name}</b> <span class="muted">· {x.name}</span><br /><span class="muted">{stat.length ? stat.join(" · ") : m.text}</span></span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
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
