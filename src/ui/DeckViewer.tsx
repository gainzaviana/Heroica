import { ENCOUNTER_CARDS, PLAYER_CARDS } from "../data/content";
import type { HeroDef, PlayerCardDef, PlayerCardType } from "../engine/types";
import { RES_ICON, RES_NAME } from "../engine/game";
import { aspectLabel, ASPECT_NAME, EncounterCard, frameColour, PlayerCard, ResIcons, traitName, typeName } from "./Card";
import type { Aspect } from "../engine/types";
import { Modal, Portrait } from "./Table";

const GROUPS: { type: PlayerCardType; title: string }[] = [
  { type: "aliado", title: "Aliados" },
  { type: "mejora", title: "Mejoras" },
  { type: "apoyo", title: "Apoyos" },
  { type: "evento", title: "Eventos" },
  { type: "recurso", title: "Recursos" },
];

const ASPECT_COLOUR: Record<Aspect, string> = { heroe: "#8a6d3b", agresion: "#dc2626", justicia: "#ca8a04", proteccion: "#16a34a", liderazgo: "#2563eb", basica: "#64748b", campana: "#9a6b3a" };

const TIMING: Record<string, string> = { action: "Acción", defend: "Al defenderte", afterAttack: "Después de un ataque", afterUpgrade: "Después de jugar una mejora", villainAttack: "Respuesta, cuando el villano te ataca" };

/** Every card in a hero's deck, grouped by type, with counts and full text: to inspect a deck before playing. */
export function DeckViewer({ hero, onClose }: { hero: HeroDef; onClose: () => void }) {
  const counts = new Map<string, number>();
  for (const id of hero.deck) counts.set(id, (counts.get(id) ?? 0) + 1);
  // Keep the deck list's order (signature cards first), one row per distinct card.
  const unique = [...counts.keys()].map((id) => PLAYER_CARDS.get(id)!);
  const extra = [...(hero.nemesis ?? []), ...(hero.obligation ? [hero.obligation] : [])].map((id) => ENCOUNTER_CARDS.get(id)!);
  const h = hero.hero, idn = hero.identity;

  return (
    <Modal onClose={onClose} wide label={`Mazo de ${h.name}`}>
      <div class="deck-head" style={{ ["--hero" as string]: hero.colour }}>
        <Portrait artKey={`hero-${hero.id}`} glyph={hero.glyph} />
        <div class="grow">
          <div class="kicker">Mazo · {hero.deck.length} cartas · {resSummary(hero.deck)}</div>
          <div class="title">{h.name}</div>
          <div class="deck-summary">
            {(["heroe", "agresion", "justicia", "proteccion", "liderazgo", "basica", "campana"] as Aspect[]).map((asp) => {
              const n = hero.deck.filter((id) => (PLAYER_CARDS.get(id)!.aspect ?? "basica") === asp).length;
              return n ? <span key={asp} class={`chip aspect-chip asp-${asp}`} style={{ ["--tcol" as string]: asp === "heroe" ? hero.colour : ASPECT_COLOUR[asp] }}>{asp === "heroe" ? h.name : ASPECT_NAME[asp]} {n}</span> : null;
            })}
          </div>
          <div class="deck-summary">
            {GROUPS.map((g) => {
              const n = hero.deck.filter((id) => PLAYER_CARDS.get(id)!.type === g.type).length;
              return n ? <span key={g.type} class={`chip t-${g.type}`}>{g.title} {n}</span> : null;
            })}
          </div>
        </div>
        <button class="ghost" onClick={onClose} aria-label="Cerrar">✕</button>
      </div>

      <section class="deck-group" aria-label="Identidad del héroe">
        <div class="zone-title">Identidad del héroe</div>
        <div class="deck-identity">
          <div class="id-side hero-face">
            <div class="kicker">Forma de héroe</div>
            <div class="strong">{h.name}</div>
            <div class="statline small"><span>⚔ Fuerza {h.fuerza}</span><span>✦ Ingenio {h.ingenio}</span><span>⛨ Aguante {h.aguante}</span><span>♥ Vida {hero.vida}</span><span>✋ Mano {h.manoPorRasgo ? `${h.mano} (+1 por ${traitName(h.manoPorRasgo.trait)}, máx. ${h.manoPorRasgo.max})` : h.mano}</span></div>
            <p class="small">{h.text}</p>
            {hero.ability && <p class="small"><b>{TIMING[hero.ability.timing]}{hero.ability.cost === "once" ? " (una vez por ronda)" : ""}:</b> {hero.ability.text}</p>}
          </div>
          <div class="id-side">
            <div class="kicker">Identidad</div>
            <div class="strong">{idn.name}</div>
            <div class="statline small"><span>✚ Recuperación {idn.recuperacion}</span><span>♥ Vida {hero.vida}</span><span>✋ Mano {idn.mano}</span></div>
            <p class="small">{idn.text}</p>
            {hero.identityAbility && <p class="small"><b>Acción (una vez por ronda):</b> {hero.identityAbility.text}</p>}
            {hero.identityResource && <p class="small"><b>Recurso (una vez por ronda):</b> genera {RES_ICON[hero.identityResource.res].repeat(hero.identityResource.amount)} {RES_NAME[hero.identityResource.res]} al pagar.</p>}
          </div>
        </div>
      </section>

      {GROUPS.map((g) => {
        const defs = unique.filter((d) => d.type === g.type);
        if (!defs.length) return null;
        const total = defs.reduce((a, d) => a + counts.get(d.id)!, 0);
        return (
          <section class="deck-group" key={g.type} aria-label={g.title}>
            <div class="zone-title">{g.title} ({total})</div>
            <ul class="deck-list">
              {defs.map((d) => <DeckRow key={d.id} def={d} count={counts.get(d.id)!} />)}
            </ul>
          </section>
        );
      })}

      {extra.length > 0 && (
        <section class="deck-group" aria-label="Némesis y obligación">
          <div class="zone-title">Némesis y obligación (van al mazo de encuentros)</div>
          <ul class="deck-list">
            {extra.map((d) => (
              <li class="deck-row" key={d.id}>
                <EncounterCard def={d} size="sm" />
                <div class="deck-info">
                  <div class="row"><span class="strong grow">{d.name}</span></div>
                  <div class="muted small">{typeName(d.type)}{d.minion ? ` · ⚔${d.minion.fuerza} ☾${d.minion.plan} ♥${d.minion.vida}` : ""}{d.sidePlan ? ` · ${d.sidePlan.amenaza} amenaza` : ""}{d.boost ? ` · refuerzo ${d.boost}` : ""}</div>
                  <p class="small">{d.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <button class="act ghost wide" onClick={onClose}>Cerrar</button>
    </Modal>
  );
}

/** How many printed resources of each type the deck has, e.g. "⚡17 🧠10 ✊15 🌟1". */
function resSummary(deck: string[]): string {
  const n: Record<string, number> = {};
  for (const id of deck) { const c = PLAYER_CARDS.get(id)!; n[c.resType] = (n[c.resType] ?? 0) + c.resources; }
  return [["energia", "⚡"], ["mental", "🧠"], ["fisico", "✊"], ["comodin", "🌟"]].filter(([k]) => n[k]).map(([k, i]) => `${i}${n[k]}`).join(" ");
}

export function DeckRow({ def, count, note }: { def: PlayerCardDef; count?: number; note?: string }) {
  const traits = def.traits?.map(traitName).join(", ");
  return (
    <li class="deck-row">
      <PlayerCard def={def} size="sm" />
      <div class="deck-info">
        <div class="row">
          <span class="strong grow">{def.name}</span>
          {count !== undefined && <span class="qty" aria-label={`${count} copias`}>×{count}</span>}
        </div>
        <div class="muted small">
          <span class="chip aspect-chip" style={{ ["--tcol" as string]: frameColour(def) ?? ASPECT_COLOUR[def.aspect ?? "basica"] }}>{aspectLabel(def)}</span>{" "}
          {typeName(def.type)}{traits ? ` · ${traits}` : ""}
          {def.type !== "recurso" && ` · Coste ${def.cost}`}
        </div>
        <div class="row small res-row"><ResIcons type={def.resType} n={def.resources} /><span>{def.resources === 2 ? "Doble " : ""}{RES_NAME[def.resType]}</span></div>
        {def.ally && (
          <div class="statline small">
            <span>⚔ {def.ally.fuerza}</span><span>✦ {def.ally.ingenio}</span><span>♥ {def.ally.vida}</span>
            <span class="muted">Daño al atacar {def.ally.consFuerza} · al contener {def.ally.consIngenio}</span>
          </div>
        )}
        <p class="small">{def.text}</p>
        {note && <div class="muted small album-note">{note}</div>}
      </div>
    </li>
  );
}
