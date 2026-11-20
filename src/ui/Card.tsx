import type { ComponentChildren } from "preact";
import type { Aspect, EncounterCardDef, PlayerCardDef, ResType, StatusKind, Statuses } from "../engine/types";
import { RES_ICON, RES_NAME, STATUS_NAME } from "../engine/game";
import { HERO_BY_ID } from "../data/content";
import { artUrl } from "./art";

const TYPE_NAME: Record<string, string> = {
  aliado: "Aliado", mejora: "Mejora", apoyo: "Apoyo", evento: "Evento", recurso: "Recurso",
  esbirro: "Esbirro", traicion: "Traición", plan: "Plan secundario", vinculo: "Vínculo", obligacion: "Obligación", entorno: "Entorno",
};
const TRAIT_NAME: Record<string, string> = { tecnologia: "Tecnología", pieza: "Pieza", aereo: "Aéreo", legion: "Legión", mutante: "Mutante", arma: "Arma experimental", campana: "Campaña", oricalco: "Oricalco", liderazgo: "Liderazgo", guardia: "Guardia de Aurelia", espia: "Espía", planificacion: "Planificación" };
/** Aspect names (the colour of the card frame). */
export const ASPECT_NAME: Record<Aspect, string> = { heroe: "Héroe", agresion: "Furia", justicia: "Justicia", proteccion: "Protección", liderazgo: "Liderazgo", basica: "Básica", campana: "Campaña" };
/** A player card's frame colour: its aspect, or its hero's colour for signature cards. */
export function frameColour(def: PlayerCardDef): string | undefined {
  return def.aspect === "heroe" && def.owner ? HERO_BY_ID.get(def.owner)?.colour : undefined;
}
/** The label of a card's aspect tag: the hero's name for signature cards. */
export const aspectLabel = (def: PlayerCardDef) => (def.aspect === "heroe" && def.owner ? HERO_BY_ID.get(def.owner)?.hero.name ?? "Héroe" : ASPECT_NAME[def.aspect ?? "basica"]);
/** Encounter side: purple for the villain's forces, orange for treacheries and obligations. */
const ENC_SIDE: Record<string, string> = { traicion: "orange", obligacion: "orange" };
const KW: Record<string, string> = { perforante: "Perforante", arrollador: "Arrollador", distancia: "A distancia" };
const STATUS_ICON: Record<StatusKind, string> = { stunned: "💫", confused: "🌀", tough: "🛡️" };

/** A card's printed resources: one icon per resource, coloured by type. */
export function ResIcons({ type, n }: { type: ResType; n: number }) {
  return (
    <span class="card-res" role="img" aria-label={`Vale ${n} ${RES_NAME[type]}`} title={`Vale ${n} ${RES_NAME[type]}`}>
      {Array.from({ length: n }, (_, k) => <i key={k} class={`res res-${type}`} aria-hidden="true">{RES_ICON[type]}</i>)}
    </span>
  );
}

/** Status cards on a character (Aturdido, Confundido, Duro). */
export function StatusChips({ st }: { st?: Statuses }) {
  const on = (["stunned", "confused", "tough"] as StatusKind[]).filter((k) => st?.[k]);
  if (!on.length) return null;
  return <span class="status-chips">{on.map((k) => <span key={k} class={`chip st-${k}`}>{STATUS_ICON[k]} {STATUS_NAME[k]}</span>)}</span>;
}

/** The art window: the card's picture, or its symbol while there's none. */
export function Art({ artKey, glyph, label }: { artKey: string; glyph: string; label?: string }) {
  const url = artUrl(artKey);
  return (
    <span class="card-art" aria-hidden={label ? undefined : "true"} role={label ? "img" : undefined} aria-label={label}>
      {url ? <img src={url} alt="" draggable={false} /> : <span class="card-glyph">{glyph}</span>}
    </span>
  );
}

/**
 * A card: name bar with its cost gem, art window, type band, rules text (on bigger sizes) and a
 * footer with its stats and the resources it gives when discarded to pay.
 */
export function PlayerCard({ def, size = "md", selected, dim, exhausted, damage, onClick, badge, status, allyStats }: {
  def: PlayerCardDef; size?: "sm" | "md" | "lg"; selected?: boolean; dim?: boolean; exhausted?: boolean; damage?: number; onClick?: () => void; badge?: ComponentChildren; status?: Statuses;
  /** An ally's current stats (with permanent bonuses), if they differ from the printed ones. */
  allyStats?: { fuerza: number; ingenio: number; vida: number };
}) {
  const a = def.ally && (allyStats ?? def.ally);
  // Only cards you can tap are buttons; display-only cards are a labelled group.
  const Tag = onClick ? "button" : "div";
  const hero = frameColour(def);
  const cons = (n: number, what: string) => n > 0 ? <i class="cons" title={`Le cuesta ${n} daño ${what}`}>{"✱".repeat(n)}</i> : null;
  return (
    <Tag type={onClick ? "button" : undefined} role={onClick ? undefined : "group"} class={`card card-${size} t-${def.type} asp-${def.aspect ?? "basica"}${selected ? " selected" : ""}${dim ? " dim" : ""}${exhausted ? " exhausted" : ""}`} style={hero ? { ["--tcol" as string]: hero } : undefined} onClick={onClick} aria-label={`${def.name}. ${TYPE_NAME[def.type]} de ${aspectLabel(def)}. Coste ${def.cost}. Vale ${def.resources} ${RES_NAME[def.resType]}. ${def.text}`}>
      <span class="card-tags" aria-hidden="true">
        <span class="type-badge">{TYPE_NAME[def.type]}</span>
        <span class="asp-tag">{aspectLabel(def)}</span>
      </span>
      <span class="card-head">
        <span class="card-name">{def.name}</span>
        {def.type !== "recurso" && <span class="card-cost" title="Coste">{def.cost}</span>}
      </span>
      <Art artKey={def.id} glyph={def.glyph} />
      {def.traits?.length ? <span class="card-band">{def.traits.map(traitName).join(" · ")}</span> : null}
      {size !== "sm" && <span class="card-body">{def.text}</span>}
      <span class="card-foot">
        {a ? (
          <span class="card-stats">
            <span class="stat atk" title="Fuerza (ATQ)">{a.fuerza}{cons(def.ally!.consFuerza, "al atacar")}</span>
            <span class="stat thw" title="Ingenio (INT)">{a.ingenio}{cons(def.ally!.consIngenio, "al contener")}</span>
            <span class="stat hp" title="Vida">{a.vida - (damage ?? 0)}</span>
          </span>
        ) : <span />}
        <ResIcons type={def.resType} n={def.resources} />
      </span>
      <StatusChips st={status} />
      {badge}
    </Tag>
  );
}

export function EncounterCard({ def, size = "md", damage, status, onClick, stats }: {
  def: EncounterCardDef; size?: "sm" | "md" | "lg"; damage?: number; status?: Statuses; onClick?: () => void;
  /** A minion's current stats (Drones with bonuses), if they differ from the printed ones. */
  stats?: { vida: number; fuerza: number; plan: number };
}) {
  const m = def.minion && (stats ?? def.minion);
  const Tag = onClick ? "button" : "div";
  const band = [
    ...(def.traits ?? []).map(traitName), def.minion?.guardia && "Guardia", def.minion?.retaliate && `Represalia ${def.minion.retaliate}`,
    ...[...(def.minion?.keywords ?? []), ...(def.keywords ?? [])].map((k) => KW[k]), def.environment && def.environment.trait,
    def.sidePlan?.aceleracion && "Aceleración", def.sidePlan?.crisis && "Crisis", def.sidePlan?.peligro && "Peligro",
  ].filter(Boolean) as string[];
  return (
    <Tag type={onClick ? "button" : undefined} role={onClick ? undefined : "group"} class={`card card-${size} enc t-${def.type} enc-${ENC_SIDE[def.type] ?? "purple"}`} onClick={onClick} aria-label={`${def.name}. ${TYPE_NAME[def.type]}. ${def.text}`}>
      <span class="card-tags" aria-hidden="true">
        <span class="type-badge">{TYPE_NAME[def.type]}</span>
        <span class="asp-tag">{def.type === "obligacion" ? "Obligación" : "Encuentro"}</span>
      </span>
      <span class="card-head"><span class="card-name">{def.name}</span></span>
      <Art artKey={def.id} glyph={def.glyph} />
      {band.length > 0 && <span class="card-band">{band.join(" · ")}</span>}
      {size !== "sm" && <span class="card-body">{def.text}</span>}
      <span class="card-foot">
        {m ? (
          <span class="card-stats">
            <span class="stat atk" title="Fuerza">{m.fuerza}</span>
            <span class="stat sch" title="Plan">{m.plan}</span>
            <span class="stat hp" title="Vida">{m.vida - (damage ?? 0)}</span>
          </span>
        ) : def.sidePlan ? <span class="card-stats"><span class="stat sch" title="Amenaza">{def.sidePlan.amenaza}</span></span> : <span />}
        <span class="card-boost" title={`Refuerzo ${def.boost}`}>{Array.from({ length: def.boost }, (_, k) => <i key={k} />)}</span>
      </span>
      <StatusChips st={status} />
    </Tag>
  );
}

export const typeName = (t: string) => TYPE_NAME[t] ?? t;
export const traitName = (t: string) => TRAIT_NAME[t] ?? t;
