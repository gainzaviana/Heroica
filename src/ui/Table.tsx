import { useEffect, useState } from "preact/hooks";
import {
  abilitiesOf, allyCards, allyStats, canPlay, ecard, enemiesFor, handSize, heroName, heroOf, heroStats, mainPlan, mainPlanDef, mainPlanStages, minionStats, otherCards, paidByType, pcard,
  planLimit, planName, RES_ICON, resourcesOf, resourceSources, scenarioOf, stageList, villainStats,
} from "../engine/game";
import type { ResType } from "../engine/types";
import type { GameState } from "../engine/types";
import { ENCOUNTER_CARDS, PLAYER_CARDS } from "../data/content";
import { store, useStore } from "./store";
import { EncounterCard, PlayerCard, StatusChips } from "./Card";
import { artUrl } from "./art";

/** A hero or villain portrait (its art, or its symbol while there is none). */
export function Portrait({ artKey, glyph }: { artKey: string; glyph: string }) {
  const url = artUrl(artKey);
  return <div class="art-box" aria-hidden="true">{url ? <img src={url} alt="" /> : glyph}</div>;
}

type Sheet =
  | { k: "card"; uid: string }
  | { k: "pay"; uid: string; pay: string[]; extra: string[] }
  | { k: "end"; discard: string[] }
  | { k: "enc"; def: string; damage?: number }
  | { k: "ally"; uid: string }
  | { k: "log" }
  | { k: "rules" }
  | { k: "menu" };

/** The game table: villain and plans, the active hero's side, the hand, and every decision. */
export function Table() {
  const st = useStore();
  const s = st.state!;
  const [view, setView] = useState(s.active);
  const [sheet, setSheet] = useState<Sheet>();
  // Follow whoever has to act.
  const focus = s.prompt ? s.prompt.player : s.active;
  useEffect(() => { setView(focus); }, [focus, s.phase, s.round]);
  const viewing = s.players[view] ? view : 0;
  const mine = viewing === s.active && s.phase === "jugadores" && !s.prompt;
  // The villain phase is shown step by step; decisions wait until you've read what led to them.
  const report = s.phaseReport ?? [];
  const [walk, setWalk] = useState({ round: s.reportRound, shown: report.length, closed: true });
  // A new villain phase (often fully resolved within one action) opens the walkthrough; reloading doesn't replay it.
  useEffect(() => { if (s.reportRound !== undefined && walk.round !== s.reportRound) setWalk({ round: s.reportRound, shown: 1, closed: false }); }, [s.reportRound]);
  const walking = !walk.closed && walk.round === s.reportRound && report.length > 0;
  const pending = walking && walk.shown < report.length;

  return (
    <div class="table">
      <header class="topbar">
        <div class="brand">Heroica</div>
        <div class="round">Ronda {s.round} · {s.phase === "villano" ? "Fase del villano" : s.phase === "fin" ? "Fin" : `Turno de ${heroName(s, s.active)}`}</div>
        <div class="top-actions">
          <button class="ghost" disabled={!st.canUndo} onClick={() => st.undo()} title="Deshacer" aria-label="Deshacer">↶<span class="wide-only"> Deshacer</span></button>
          <button class="ghost" onClick={() => setSheet({ k: "log" })} aria-label="Registro">📜<span class="wide-only"> Registro</span></button>
          <button class="ghost" onClick={() => setSheet({ k: "menu" })} aria-label="Menú">☰</button>
        </div>
      </header>

      <VillainPanel s={s} viewing={viewing} canAct={mine} onEncounter={(def, damage) => setSheet({ k: "enc", def, damage })} />

      <section class="side">
        {s.players.length > 1 && (
          <div class="tabs" role="tablist">
            {s.players.map((p, i) => (
              <button key={i} role="tab" aria-selected={i === viewing} class={i === viewing ? "on" : ""} onClick={() => setView(i)} style={{ ["--hero" as string]: heroOf(p).colour }}>
                {heroOf(p).glyph} {heroName(s, i)}{i === s.active && s.phase === "jugadores" ? " · su turno" : ""}{p.eliminated ? " · caído" : ""}
              </button>
            ))}
          </div>
        )}
        <HeroPanel s={s} i={viewing} canAct={mine} onAlly={(uid) => setSheet({ k: "ally", uid })} onEncounter={(def, damage) => setSheet({ k: "enc", def, damage })} />
      </section>

      <HandBar s={s} i={viewing} canAct={mine} onCard={(uid) => setSheet({ k: "card", uid })} onEnd={() => setSheet({ k: "end", discard: [] })} />

      {sheet && <SheetView s={s} sheet={sheet} viewing={viewing} canAct={mine} set={setSheet} />}
      <ComboPopup s={s} />
      {walking && (
        <VillainPhase s={s} shown={walk.shown}
          onNext={() => setWalk({ ...walk, shown: Math.min(report.length, walk.shown + 1) })}
          onAll={() => setWalk({ ...walk, shown: report.length })}
          onClose={() => setWalk({ ...walk, shown: report.length, closed: true })} />
      )}
      {s.prompt && !pending && <PromptSheet s={s} />}
      {s.result && <EndOverlay s={s} />}
      {st.error && <div class="toast" role="status">{st.error}</div>}
    </div>
  );
}

// MARK: Villain side

function VillainPanel({ s, viewing, canAct, onEncounter }: { s: GameState; viewing: number; canAct: boolean; onEncounter: (def: string, damage?: number) => void }) {
  const sc = scenarioOf(s);
  const v = villainStats(s);
  const plan = mainPlan(s);
  const limit = planLimit(s);
  const p = s.players[viewing];
  return (
    <section class="villain-side">
      <div class="villain panel">
        <Portrait artKey={`villain-${sc.id}`} glyph={sc.villain.glyph} />
        <div class="grow">
          <div class="kicker">Villano · fase {s.villain.stage + 1} de {stageList(s).length}</div>
          <div class="title">{v.name}</div>
          <Meter value={v.vidaMax - s.villain.damage} max={v.vidaMax} kind="hp" label="Vida" />
          <div class="statline"><span>⚔ Fuerza {v.fuerza}</span><span>☾ Plan {v.plan}</span><StatusChips st={s.villain} /></div>
          {v.text && <div class="muted small">{v.text}</div>}
        </div>
      </div>
      {s.villain.attachments.length > 0 && (
        <div class="panel">
          <div class="kicker">Vínculos del villano</div>
          {s.villain.attachments.map((uid) => {
            const d = ecard(s, uid);
            return (
              <div class="row" key={uid}>
                <button class="linkish grow" onClick={() => onEncounter(d.id)}>{d.glyph} {d.name}</button>
                {canAct && p.form === "heroe" && !p.heroExhausted && <button class="small-btn" onClick={() => store.act({ a: "removeAttachment", player: viewing, attachment: uid })}>Arrancar</button>}
              </div>
            );
          })}
        </div>
      )}
      <div class="panel plan">
        <div class="kicker">Plan principal{mainPlanStages(s) > 1 ? ` · fase ${(s.mainStage ?? 0) + 1} de ${mainPlanStages(s)}` : ""}</div>
        <div class="title">{mainPlanDef(s).name}</div>
        <Meter value={plan.threat} max={limit} kind="threat" label="Amenaza" />
        <div class="muted small">{mainPlanDef(s).text} Avanza {mainPlanDef(s).aceleracionPorJugador * s.players.length} por ronda.</div>
      </div>
      {s.plans.filter((x) => x.def !== "main").map((x) => {
        const d = ecard(s, x.uid);
        return (
          <button class="panel plan side-plan" key={x.uid} onClick={() => onEncounter(d.id)}>
            <div class="kicker">Plan secundario{d.sidePlan?.aceleracion ? " · Aceleración" : ""}</div>
            <div class="row"><span class="title grow">{d.glyph} {planName(s, x)}</span><span class="threat-chip">{x.threat}</span></div>
          </button>
        );
      })}
      <div class="decks muted small">Mazo de encuentros: {s.encounterDeck.length} · descarte: {s.encounterDiscard.length}</div>
    </section>
  );
}

function Meter({ value, max, kind, label }: { value: number; max: number; kind: "hp" | "threat"; label: string }) {
  const pct = Math.max(0, Math.min(1, value / Math.max(1, max)));
  return (
    <div class={`meter ${kind}`} role="meter" aria-label={label} aria-valuenow={value} aria-valuemax={max}>
      <div class="meter-fill" style={{ width: `${pct * 100}%` }} />
      <span class="meter-text">{label} {value} / {max}</span>
    </div>
  );
}

// MARK: Hero side

function HeroPanel({ s, i, canAct, onAlly, onEncounter }: { s: GameState; i: number; canAct: boolean; onAlly: (uid: string) => void; onEncounter: (def: string, damage?: number) => void }) {
  const p = s.players[i];
  const h = heroOf(p);
  const st = heroStats(s, i);
  const hero = p.form === "heroe";
  const ability = h.ability;
  const guarded = hero && !enemiesFor(s, i, true).some((e) => e.kind === "villain");
  return (
    <div class="hero-side">
      <div class={`hero panel${p.heroExhausted ? " exhausted" : ""}${p.eliminated ? " fallen" : ""}`} style={{ ["--hero" as string]: h.colour }}>
        <Portrait artKey={`${hero ? "hero" : "identity"}-${h.id}`} glyph={hero ? h.glyph : "🙂"} />
        <div class="grow">
          <div class="kicker">{hero ? "Forma de héroe" : "Identidad"}{p.heroExhausted ? " · agotado" : ""}</div>
          <StatusChips st={p} />
          <div class="title">{hero ? h.hero.name : h.identity.name}</div>
          <Meter value={st.vidaMax - p.damage} max={st.vidaMax} kind="hp" label="Vida" />
          <div class="statline">
            {hero ? <><span>⚔ Fuerza {st.fuerza}</span><span>✦ Ingenio {st.ingenio}</span><span>⛨ Aguante {st.aguante}</span></> : <span>✚ Recuperación {h.identity.recuperacion}</span>}
            <span>✋ Mano {handSize(s, i)}</span>
          </div>
          <div class="muted small">{hero ? h.hero.text : h.identity.text}</div>
        </div>
      </div>
      {canAct && (
        <div class="actions">
          {hero && <button class="act red" disabled={p.heroExhausted} onClick={() => store.act({ a: "attack", player: i })}>Atacar ({st.fuerza})</button>}
          {hero && <button class="act blue" disabled={p.heroExhausted} onClick={() => store.act({ a: "thwart", player: i })}>Contener ({st.ingenio})</button>}
          {!hero && <button class="act green" disabled={p.heroExhausted || p.damage === 0} onClick={() => store.act({ a: "recover", player: i })}>Recuperar ({h.identity.recuperacion})</button>}
          {hero && ability?.timing === "action" && <button class="act gold" disabled={p.heroAbilityUsed} onClick={() => store.act({ a: "heroAbility", player: i })}>{ability.text}</button>}
          {!hero && h.identityAbility && <button class="act gold" disabled={!!p.identityAbilityUsed} onClick={() => store.act({ a: "identityAbility", player: i })}>{h.identityAbility.text}</button>}
          <button class="act ghost" disabled={p.flippedThisTurn} onClick={() => store.act({ a: "flip", player: i })}>{hero ? `Volver a ${h.identity.name}` : `Transformarse en ${h.hero.name}`}</button>
        </div>
      )}
      {guarded && canAct && <div class="hint">Un esbirro con Guardia te bloquea: derrótalo antes de atacar al villano.</div>}

      <div class="zone">
        <div class="zone-title">Enemigos contigo ({p.engaged.length})</div>
        <div class="cards">
          {p.engaged.length === 0 && <div class="empty">Nadie te acecha.</div>}
          {p.engaged.map((m) => <EncounterCard key={m.uid} def={ENCOUNTER_CARDS.get(m.def)!} size="sm" damage={m.damage} status={m} stats={minionStats(s, m)} onClick={() => onEncounter(m.def, m.damage)} />)}
        </div>
      </div>
      <div class="zone">
        <div class="zone-title">Aliados ({allyCards(s, i).length}/3)</div>
        <div class="cards">
          {allyCards(s, i).length === 0 && <div class="empty">Sin aliados.</div>}
          {allyCards(s, i).map((c) => <PlayerCard key={c.uid} def={pcard(s, c.uid)} size="sm" exhausted={c.exhausted} damage={c.damage} status={c} allyStats={allyStats(s, c)} onClick={() => onAlly(c.uid)} />)}
        </div>
      </div>
      <div class="zone">
        <div class="zone-title">Mejoras y apoyos</div>
        <div class="cards">
          {otherCards(s, i).length === 0 && <div class="empty">Nada todavía.</div>}
          {otherCards(s, i).map((c) => {
            const d = pcard(s, c.uid);
            const usable = canAct && abilitiesOf(d).some((a) => abilityReady(a, c, p.form));
            const badge = <>{usable && <span class="chip ready">Usar</span>}{c.counters !== undefined && <span class="chip counters" title="Contadores">×{c.counters}</span>}</>;
            return <PlayerCard key={c.uid} def={d} size="sm" exhausted={c.exhausted} onClick={() => onAlly(c.uid)} badge={badge} />;
          })}
        </div>
      </div>
      <div class="muted small">Mazo {p.deck.length} · descarte {p.discard.length}</div>
    </div>
  );
}

// MARK: Hand

function HandBar({ s, i, canAct, onCard, onEnd }: { s: GameState; i: number; canAct: boolean; onCard: (uid: string) => void; onEnd: () => void }) {
  const p = s.players[i];
  return (
    <section class="hand-bar" aria-label="Tu mano">
      <div class="hand-head">
        <span class="kicker">Mano de {heroName(s, i)} · {p.hand.length} cartas · <PaidLine paid={paidByType(s, p.hand)} /></span>
        {canAct && <button class="act end" onClick={onEnd}>Terminar turno</button>}
      </div>
      <div class="hand">
        {p.hand.map((uid) => <PlayerCard key={uid} def={pcard(s, uid)} size="md" dim={canAct && !!canPlay(s, i, uid)} onClick={() => onCard(uid)} />)}
      </div>
    </section>
  );
}

// MARK: Sheets

function SheetView({ s, sheet, viewing, canAct, set }: { s: GameState; sheet: Sheet; viewing: number; canAct: boolean; set: (x?: Sheet) => void }) {
  const close = () => set(undefined);
  const p = s.players[viewing];
  switch (sheet.k) {
    case "card": {
      if (!p.hand.includes(sheet.uid)) { close(); return null; }
      const d = pcard(s, sheet.uid);
      const why = canPlay(s, viewing, sheet.uid);
      return (
        <Modal onClose={close}>
          <div class="center"><PlayerCard def={d} size="lg" /></div>
          {d.flavor && <p class="muted small center">{d.flavor}</p>}
          {canAct && !why && <button class="act gold wide" onClick={() => d.cost === 0 ? (store.act({ a: "play", player: viewing, card: sheet.uid, pay: [] }), close()) : set({ k: "pay", uid: sheet.uid, pay: [], extra: [] })}>Jugar{d.cost ? ` (coste ${d.cost})` : ""}</button>}
          {canAct && why && <div class="hint center">{why}</div>}
          <button class="act ghost wide" onClick={close}>Cerrar</button>
        </Modal>
      );
    }
    case "pay": {
      if (!p.hand.includes(sheet.uid)) { close(); return null; }
      const d = pcard(s, sheet.uid);
      const sources = resourceSources(s, viewing);
      const chosen = sources.filter((r) => sheet.extra.includes(r.id));
      const total = resourcesOf(s, sheet.pay) + chosen.reduce((a, r) => a + r.amount, 0);
      const paid = paidByType(s, sheet.pay);
      for (const r of chosen) paid[r.res] = (paid[r.res] ?? 0) + r.amount;
      const toggle = (u: string) => set({ ...sheet, pay: sheet.pay.includes(u) ? sheet.pay.filter((x) => x !== u) : [...sheet.pay, u] });
      const toggleExtra = (id: string) => set({ ...sheet, extra: sheet.extra.includes(id) ? sheet.extra.filter((x) => x !== id) : [...sheet.extra, id] });
      return (
        <Modal onClose={close}>
          <div class="kicker">Pagar {d.name}</div>
          <div class="title">Descarta cartas por {d.cost} recursos · llevas {total}</div>
          <div class="muted small">Pagas: <PaidLine paid={paid} />{payHint(d.text)}</div>
          {sources.length > 0 && (
            <div class="sources">
              {sources.map((r) => (
                <button key={r.id} class={`source${sheet.extra.includes(r.id) ? " on" : ""}`} aria-pressed={sheet.extra.includes(r.id)} onClick={() => toggleExtra(r.id)}>
                  {RES_ICON[r.res].repeat(r.amount)} {r.label}{r.id === "identity" ? " (una vez por ronda)" : ""}
                </button>
              ))}
            </div>
          )}
          <div class="cards wrap">
            {p.hand.filter((u) => u !== sheet.uid).map((u) => <PlayerCard key={u} def={pcard(s, u)} size="sm" selected={sheet.pay.includes(u)} onClick={() => toggle(u)} />)}
          </div>
          <button class="act gold wide" disabled={total < d.cost} onClick={() => { if (!store.act({ a: "play", player: viewing, card: sheet.uid, pay: sheet.pay, extra: sheet.extra })) close(); }}>Pagar y jugar</button>
          <button class="act ghost wide" onClick={close}>Cancelar</button>
        </Modal>
      );
    }
    case "end": {
      const toggle = (u: string) => set({ ...sheet, discard: sheet.discard.includes(u) ? sheet.discard.filter((x) => x !== u) : [...sheet.discard, u] });
      const draw = Math.max(0, handSize(s, viewing) - (p.hand.length - sheet.discard.length));
      return (
        <Modal onClose={close}>
          <div class="kicker">Terminar el turno de {heroName(s, viewing)}</div>
          <div class="muted small">Puedes descartar cartas que no quieras. Después robas hasta {handSize(s, viewing)} y preparas tus cartas.</div>
          <div class="cards wrap">
            {p.hand.map((u) => <PlayerCard key={u} def={pcard(s, u)} size="sm" selected={sheet.discard.includes(u)} onClick={() => toggle(u)} />)}
          </div>
          <button class="act gold wide" onClick={() => { if (!store.act({ a: "endTurn", player: viewing, discard: sheet.discard })) close(); }}>Terminar turno{draw ? ` y robar ${draw}` : ""}</button>
          <button class="act ghost wide" onClick={close}>Seguir jugando</button>
        </Modal>
      );
    }
    case "enc": {
      const d = ENCOUNTER_CARDS.get(sheet.def)!;
      return (
        <Modal onClose={close}>
          <div class="center"><EncounterCard def={d} size="lg" damage={sheet.damage} /></div>
          {d.boost > 0 && <div class="muted small center">Como refuerzo suma {d.boost} al ataque o plan del villano.</div>}
          <button class="act ghost wide" onClick={close}>Cerrar</button>
        </Modal>
      );
    }
    case "ally": {
      const c = p.play.find((x) => x.uid === sheet.uid);
      if (!c) { close(); return null; }
      const d = PLAYER_CARDS.get(c.def)!;
      const ast = d.ally && allyStats(s, c);
      return (
        <Modal onClose={close}>
          <div class="center"><PlayerCard def={d} size="lg" exhausted={c.exhausted} damage={c.damage} status={c} allyStats={ast} /></div>
          {c.counters !== undefined && <div class="hint center">Contadores: {c.counters}</div>}
          {canAct && ast && !c.exhausted && (
            <div class="row gap">
              <button class="act red grow" onClick={() => { store.act({ a: "allyAttack", player: viewing, ally: c.uid }); close(); }}>Atacar ({ast.fuerza})</button>
              <button class="act blue grow" onClick={() => { store.act({ a: "allyThwart", player: viewing, ally: c.uid }); close(); }}>Contener ({ast.ingenio})</button>
            </div>
          )}
          {canAct && abilitiesOf(d).map((a, k) => a.timing === "action" && (
            <button key={k} class="act gold wide" disabled={!abilityReady(a, c, p.form)} onClick={() => { store.act({ a: "useCard", player: viewing, card: c.uid, index: k }); close(); }}>{a.text}</button>
          ))}
          {c.exhausted && <div class="hint center">Agotada: se prepara al terminar tu turno.</div>}
          <button class="act ghost wide" onClick={close}>Cerrar</button>
        </Modal>
      );
    }
    case "log": {
      // One collapsible section per round, newest first; the current round starts open.
      const rounds = [...new Set(s.log.map((l) => l.round))].reverse();
      return (
        <Modal onClose={close} wide label="Registro de la partida">
          <div class="kicker">Registro de la partida</div>
          <div class="log">
            {rounds.map((r) => (
              <details key={r} open={r === s.round}>
                <summary>Ronda {r}</summary>
                <ol>{s.log.filter((l) => l.round === r).map((l, k) => <li key={k} class={/^(Fase del villano|Paso|Carta de refuerzo|Encuentro|Resultado|Fuerza|Plan \d|Base:)/.test(l.text) ? "v" : ""}>{l.text}</li>)}</ol>
              </details>
            ))}
          </div>
          <button class="act ghost wide" onClick={close}>Cerrar</button>
        </Modal>
      );
    }
    case "rules":
      return <Modal onClose={close}><Rules /><button class="act ghost wide" onClick={close}>Cerrar</button></Modal>;
    case "menu":
      return (
        <Modal onClose={close}>
          <div class="kicker">{scenarioOf(s).name}</div>
          <button class="act ghost wide" onClick={() => set({ k: "rules" })}>Cómo se juega</button>
          <button class="act red wide" onClick={() => { if (confirm("¿Abandonar la partida? Se perderá.")) { store.quit(); close(); } }}>Abandonar partida</button>
          <button class="act ghost wide" onClick={close}>Volver</button>
        </Modal>
      );
  }
}

/** Whether an action ability of a card in play can be used now (form, exhaustion, once per round). */
function abilityReady(a: ReturnType<typeof abilitiesOf>[number], c: { exhausted: boolean; usedThisRound?: boolean }, form: "heroe" | "identidad") {
  if (a.timing !== "action") return false;
  if (a.heroOnly && form !== "heroe") return false;
  if (a.identityOnly && form !== "identidad") return false;
  return a.cost === "exhaust" ? !c.exhausted : a.cost === "once" ? !c.usedThisRound : true;
}

const STEP_NAME = { 1: "Amenaza", 2: "Activación", 3: "Encuentro" } as const;

/** The villain phase, one step at a time: what happened, the boost and encounter cards, and the numbers. */
function VillainPhase({ s, shown, onNext, onAll, onClose }: { s: GameState; shown: number; onNext: () => void; onAll: () => void; onClose: () => void }) {
  const report = s.phaseReport ?? [];
  const steps = report.slice(0, Math.max(1, shown));
  const more = shown < report.length;
  const waiting = !more && !!s.prompt;
  const done = !more && !s.prompt;
  useEffect(() => { document.getElementById(`vstep-${steps.length}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [steps.length]);
  return (
    <div class="modal-backdrop vphase-backdrop">
      <div class="modal panel wide vphase" role="dialog" aria-label="Fase del villano">
        <div class="row">
          <div class="grow">
            <div class="kicker">Fase del villano · ronda {s.reportRound}</div>
            <div class="title">{steps.length} de {report.length} pasos</div>
          </div>
          {more && <button class="ghost" onClick={onAll}>Ver todo</button>}
        </div>
        <ol class="vsteps">
          {steps.map((e) => (
            <li key={e.n} id={`vstep-${e.n}`} class={`vstep step-${e.step}`}>
              <div class="vstep-head"><span class="chip">{STEP_NAME[e.step]}</span> <span class="strong">{e.title.replace(/^Paso \d · /, "")}</span></div>
              {e.cards.length > 0 && (
                <div class="cards">
                  {e.cards.map((d, k) => {
                    const def = ENCOUNTER_CARDS.get(d)!;
                    return <div key={k} class="vcard"><EncounterCard def={def} size="sm" /><span class="small">{e.step === 2 ? `Refuerzo ${def.boost ? "⭐".repeat(def.boost) : "—"}` : def.text}</span></div>;
                  })}
                </div>
              )}
              <ul class="vlines">{e.lines.map((l, k) => <li key={k}>{l}</li>)}</ul>
            </li>
          ))}
        </ol>
        {more && <button class="act gold wide" onClick={onNext} autoFocus>Siguiente paso</button>}
        {waiting && <div class="hint center">Te toca decidir ↓</div>}
        {done && <button class="act gold wide" onClick={onClose} autoFocus>{s.result ? "Ver resultado" : `Empezar la ronda ${s.round}`}</button>}
      </div>
    </div>
  );
}

/** Resources by type, e.g. "⚡⚡ 🧠 ✊✊". */
function PaidLine({ paid }: { paid: Partial<Record<ResType, number>> }) {
  const parts = (["energia", "mental", "fisico", "comodin"] as ResType[]).filter((k) => paid[k]).map((k) => `${RES_ICON[k]}${paid[k]}`);
  return <span class="paid-line">{parts.length ? parts.join(" · ") : "nada"}</span>;
}
/** A reminder when the card rewards paying with a type. */
const payHint = (text: string) => (/pagaste con/.test(text) ? " · Esta carta mejora según el tipo con que pagues." : "");

/** The cards a combo just discarded, their printed resources and what they triggered. Stays until dismissed. */
function ComboPopup({ s }: { s: GameState }) {
  const c = s.combo;
  const key = c ? `${c.n}:${c.title}:${c.cards.join(",")}` : "";
  const [seen, setSeen] = useState(key); // don't replay the last combo when the game loads
  if (!c || key === seen) return null;
  return (
    <div class="combo panel" role="status" aria-live="polite">
      <div class="row"><div class="kicker grow">Combo · {c.title}</div><button class="ghost" onClick={() => setSeen(key)} aria-label="Cerrar combo">✕</button></div>
      <div class="cards">{c.cards.map((d, k) => <PlayerCard key={k} def={PLAYER_CARDS.get(d)!} size="sm" />)}</div>
      <div class="strong">{c.text}</div>
    </div>
  );
}

function PromptSheet({ s }: { s: GameState }) {
  const pr = s.prompt!;
  return (
    <div class="modal-backdrop prompt">
      <div class="modal panel" role="dialog" aria-label={pr.text}>
        <div class="kicker">{heroName(s, pr.player)}</div>
        <div class="title">{pr.text}</div>
        {pr.options.map((o) => (
          <button key={o.id} class={`option${o.id === "no" || o.id === "none" ? " ghost" : ""}`} onClick={() => store.answer(o.id)}>
            <span class="strong">{o.label}</span>
            {o.detail && <span class="muted small">{o.detail}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function EndOverlay({ s }: { s: GameState }) {
  const win = s.result === "victoria";
  return (
    <div class="modal-backdrop">
      <div class={`modal panel end ${win ? "win" : "lose"}`} role="dialog">
        <div class="end-glyph" aria-hidden="true">{win ? "☀" : "☾"}</div>
        <div class="title big">{win ? "¡Victoria!" : "Derrota"}</div>
        <p>{s.resultText}</p>
        <p class="muted small">Ronda {s.round}.</p>
        <button class="act gold wide" onClick={() => store.quit()}>Nueva partida</button>
      </div>
    </div>
  );
}

export function Modal({ children, onClose, wide, label }: { children: preact.ComponentChildren; onClose: () => void; wide?: boolean; label?: string }) {
  // Escape closes it, like tapping outside.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div class="modal-backdrop" onClick={onClose}>
      <div class={`modal panel${wide ? " wide" : ""}`} role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

export function Rules() {
  return (
    <div class="rules">
      <div class="title">Cómo se juega</div>
      <p><b>Objetivo:</b> deja al villano sin vida en todas sus fases antes de que su plan principal llegue al límite. Si el plan se completa o caen todos los héroes, pierdes.</p>
      <p><b>Tu turno:</b> juega cartas pagando su coste: descarta otras cartas de tu mano (cada ◆ vale 1 recurso). Tu héroe puede actuar una vez: <b>Atacar</b> (daño = Fuerza) o <b>Contener</b> (retira amenaza = Ingenio) en forma de héroe, o <b>Recuperar</b> vida como identidad. Puedes cambiar de forma una vez por turno. Los aliados también atacan o contienen, pero sufren daño al hacerlo.</p>
      <p><b>Al terminar el turno</b> descartas lo que quieras, robas hasta tu tamaño de mano y se prepara todo.</p>
      <p><b>Fase del villano:</b> el plan principal avanza; el villano y tus esbirros <b>atacan</b> si estás en forma de héroe (puedes defenderte con el héroe o bloquear con un aliado) o <b>traman</b> si eres identidad (añaden amenaza). La carta de refuerzo ✹ suma a su ataque o plan. Después cada jugador recibe una carta de encuentro: esbirros, traiciones, planes secundarios o vínculos.</p>
      <p><b>Guardia:</b> mientras un esbirro con Guardia esté contigo, no puedes atacar al villano. <b>Aceleración:</b> el plan principal avanza más cada ronda.</p>
      <p><b>Experto:</b> el villano gana +1 Fuerza y +2 vida por jugador en cada fase, y el mazo de encuentros incluye cartas más duras. Algunos escenarios cambian esto: en <i>El Asalto al Arsenal</i>, Experto usa las fases II y III del villano y su propio conjunto Experto.</p>
      <p><b>Fase del villano, paso a paso:</b> 1) el plan principal gana amenaza (base + aceleración); 2) el villano y cada esbirro atacan (si estás en forma de héroe) o traman (si eres identidad); el villano recibe carta(s) de refuerzo ⭐ que suman a su ataque o plan, y algunas tienen un efecto ⚡ Refuerzo; 3) cada jugador recibe una carta de encuentro. Puedes revisar cada paso en el Registro.</p>
      <p><b>Planes en varias fases:</b> en algunos escenarios, completar el plan principal no es la derrota: pasa a su siguiente fase. <b>Drones:</b> cartas de tu propio mazo boca abajo que luchan contra ti (1/1/1); al derrotarlos vuelven a tu descarte.</p>
      <p><b>Deshacer:</b> puedes deshacer un solo paso de tu turno, y no después de robar o revelar cartas.</p>
      <p><b>Recursos:</b> cada carta lleva impreso su tipo: ⚡ Energía, 🧠 Mental, ✊ Físico o 🌟 Comodín (cuenta como cualquiera). Algunas cartas mejoran según el tipo con que pagues, y otras leen los iconos de las cartas que descartan de tu mazo.</p>
      <p><b>Estados</b> (héroes, aliados, villano y esbirros; nunca dos iguales a la vez): 💫 <b>Aturdido</b> cancela su próximo ataque básico; 🌀 <b>Confundido</b> cancela su próximo contener (o tramar, si es un enemigo); 🛡️ <b>Duro</b> anula el próximo daño que reciba. Cada estado se descarta al usarse.</p>
      <p><b>Aéreo:</b> rasgo que dan algunas mejoras; otras cartas lo aprovechan. <b>Némesis:</b> cada héroe puede tener un enemigo personal apartado; cuando una carta lo llama, su esbirro se enfrenta a ti y su plan entra en juego. <b>Obligación:</b> carta personal del héroe que se baraja en los encuentros y siempre la resuelve su dueño.</p>
      <p><b>A dos manos:</b> controlas dos héroes; juegan por turnos y el primer jugador cambia cada ronda.</p>
    </div>
  );
}
