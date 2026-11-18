import type { ComponentChildren } from "preact";
import type { EncounterCardDef, PlayerCardDef } from "../engine/types";
import { artUrl } from "./art";

const TYPE_NAME: Record<string, string> = {
  aliado: "Aliado", mejora: "Mejora", apoyo: "Apoyo", evento: "Evento", recurso: "Recurso",
  esbirro: "Esbirro", traicion: "Traición", plan: "Plan secundario", vinculo: "Vínculo", obligacion: "Obligación",
};
const TRAIT_NAME: Record<string, string> = { tecnologia: "Tecnología", pieza: "Pieza" };

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
export function PlayerCard({ def, size = "md", selected, dim, exhausted, damage, onClick, badge }: {
  def: PlayerCardDef; size?: "sm" | "md" | "lg"; selected?: boolean; dim?: boolean; exhausted?: boolean; damage?: number; onClick?: () => void; badge?: ComponentChildren;
}) {
  // Only cards you can tap are buttons; display-only cards are a labelled group.
  const Tag = onClick ? "button" : "div";
  return (
    <Tag type={onClick ? "button" : undefined} role={onClick ? undefined : "group"} class={`card card-${size} t-${def.type}${selected ? " selected" : ""}${dim ? " dim" : ""}${exhausted ? " exhausted" : ""}`} onClick={onClick} aria-label={`${def.name}. ${TYPE_NAME[def.type]}. Coste ${def.cost}. ${def.text}`}>
      <span class="card-head">
        <span class="card-name">{def.name}</span>
        {def.type !== "recurso" && <span class="card-cost">{def.cost}</span>}
      </span>
      <Art artKey={def.id} glyph={def.glyph} />
      <span class="card-band">{TYPE_NAME[def.type]}{def.traits?.length ? ` · ${def.traits.map(traitName).join(" · ")}` : ""}</span>
      {size !== "sm" && <span class="card-body">{def.text}</span>}
      <span class="card-foot">
        {def.ally ? (
          <span class="card-stats">
            <span class="stat atk" title="Fuerza">{def.ally.fuerza}</span>
            <span class="stat thw" title="Ingenio">{def.ally.ingenio}</span>
            <span class="stat hp" title="Vida">{def.ally.vida - (damage ?? 0)}</span>
          </span>
        ) : <span />}
        <span class="card-res" title={`Vale ${def.resources} al pagar`}>{Array.from({ length: def.resources }, (_, k) => <i key={k} />)}</span>
      </span>
      {badge}
    </Tag>
  );
}

export function EncounterCard({ def, size = "md", damage, stunned, onClick }: { def: EncounterCardDef; size?: "sm" | "md" | "lg"; damage?: number; stunned?: boolean; onClick?: () => void }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag type={onClick ? "button" : undefined} role={onClick ? undefined : "group"} class={`card card-${size} enc t-${def.type}`} onClick={onClick} aria-label={`${def.name}. ${TYPE_NAME[def.type]}. ${def.text}`}>
      <span class="card-head"><span class="card-name">{def.name}</span></span>
      <Art artKey={def.id} glyph={def.glyph} />
      <span class="card-band">{TYPE_NAME[def.type]}{def.minion?.guardia ? " · Guardia" : ""}{def.sidePlan?.aceleracion ? " · Aceleración" : ""}</span>
      {size !== "sm" && <span class="card-body">{def.text}</span>}
      <span class="card-foot">
        {def.minion ? (
          <span class="card-stats">
            <span class="stat atk" title="Fuerza">{def.minion.fuerza}</span>
            <span class="stat sch" title="Plan">{def.minion.plan}</span>
            <span class="stat hp" title="Vida">{def.minion.vida - (damage ?? 0)}</span>
          </span>
        ) : def.sidePlan ? <span class="card-stats"><span class="stat sch" title="Amenaza">{def.sidePlan.amenaza}</span></span> : <span />}
        <span class="card-boost" title={`Refuerzo ${def.boost}`}>{Array.from({ length: def.boost }, (_, k) => <i key={k} />)}</span>
      </span>
      {stunned && <span class="chip stun">Aturdido</span>}
    </Tag>
  );
}

export const typeName = (t: string) => TYPE_NAME[t] ?? t;
export const traitName = (t: string) => TRAIT_NAME[t] ?? t;
