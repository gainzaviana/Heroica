import type { ComponentChildren } from "preact";
import type { EncounterCardDef, PlayerCardDef } from "../engine/types";

const TYPE_NAME: Record<string, string> = {
  aliado: "Aliado", mejora: "Mejora", apoyo: "Apoyo", evento: "Evento", recurso: "Recurso",
  esbirro: "Esbirro", traicion: "Traición", plan: "Plan secundario", vinculo: "Vínculo",
};

/** A player card, drawn as a small framed card. */
export function PlayerCard({ def, size = "md", selected, dim, exhausted, damage, onClick, badge }: {
  def: PlayerCardDef; size?: "sm" | "md" | "lg"; selected?: boolean; dim?: boolean; exhausted?: boolean; damage?: number; onClick?: () => void; badge?: ComponentChildren;
}) {
  return (
    <button type="button" class={`card card-${size} t-${def.type}${selected ? " selected" : ""}${dim ? " dim" : ""}${exhausted ? " exhausted" : ""}`} onClick={onClick} aria-label={`${def.name}. ${TYPE_NAME[def.type]}. Coste ${def.cost}. ${def.text}`}>
      {def.type !== "recurso" && <span class="card-cost">{def.cost}</span>}
      <span class="card-name">{def.name}</span>
      <span class="card-art" aria-hidden="true">{def.glyph}</span>
      <span class="card-type">{TYPE_NAME[def.type]}</span>
      {size !== "sm" && <span class="card-text">{def.text}</span>}
      {def.ally && (
        <span class="card-stats">
          <span title="Fuerza">⚔{def.ally.fuerza}</span><span title="Ingenio">✦{def.ally.ingenio}</span><span title="Vida">♥{def.ally.vida - (damage ?? 0)}</span>
        </span>
      )}
      <span class="card-res" title={`Vale ${def.resources} al pagar`}>{"◆".repeat(def.resources)}</span>
      {badge}
    </button>
  );
}

/** An encounter card (minion, treachery, side plan, attachment). */
export function EncounterCard({ def, size = "md", damage, stunned, onClick }: { def: EncounterCardDef; size?: "sm" | "md" | "lg"; damage?: number; stunned?: boolean; onClick?: () => void }) {
  return (
    <button type="button" class={`card card-${size} enc t-${def.type}`} onClick={onClick} aria-label={`${def.name}. ${TYPE_NAME[def.type]}. ${def.text}`}>
      <span class="card-name">{def.name}</span>
      <span class="card-art" aria-hidden="true">{def.glyph}</span>
      <span class="card-type">{TYPE_NAME[def.type]}{def.minion?.guardia ? " · Guardia" : ""}</span>
      {size !== "sm" && <span class="card-text">{def.text}</span>}
      {def.minion && (
        <span class="card-stats">
          <span title="Fuerza">⚔{def.minion.fuerza}</span><span title="Plan">☾{def.minion.plan}</span><span title="Vida">♥{def.minion.vida - (damage ?? 0)}</span>
        </span>
      )}
      {stunned && <span class="chip stun">Aturdido</span>}
      <span class="card-boost" title="Refuerzo">{"✹".repeat(def.boost)}</span>
    </button>
  );
}

export const typeName = (t: string) => TYPE_NAME[t] ?? t;
