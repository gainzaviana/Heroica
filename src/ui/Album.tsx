import { useState } from "preact/hooks";
import { HEROES, PLAYER_CARDS } from "../data/content";
import { ALBUM_CARDS } from "../data/roster/album";
import type { PlayerCardDef } from "../engine/types";
import { DeckRow } from "./DeckViewer";
import { Modal } from "./Table";

/**
 * The card album: every player card in the game once, with the decks that use it. Shared aspect and
 * basic cards (src/data/roster/album.ts) are reused by several heroes instead of being remade.
 */
export function Album({ onClose }: { onClose: () => void }) {
  const usedBy = new Map<string, { hero: string; n: number }[]>();
  for (const h of HEROES) {
    const counts = new Map<string, number>();
    for (const id of h.deck) counts.set(id, (counts.get(id) ?? 0) + 1);
    for (const [id, n] of counts) (usedBy.get(id) ?? usedBy.set(id, []).get(id)!).push({ hero: h.hero.name, n });
  }
  const all = [...PLAYER_CARDS.values()];
  const shared = new Set(ALBUM_CARDS.map((c) => c.id));
  const tabs: { id: string; label: string; cards: PlayerCardDef[]; text: string }[] = [
    { id: "compartidas", label: "Compartidas", cards: all.filter((c) => (usedBy.get(c.id)?.length ?? 0) > 1), text: "Cartas que usan dos o más mazos." },
    { id: "album", label: "Aspectos y básicas", cards: ALBUM_CARDS, text: "El fondo común: cartas de Liderazgo, Protección y básicas que cualquier mazo puede reutilizar." },
    ...HEROES.map((h) => ({ id: h.id, label: h.hero.name, cards: [...new Set(h.deck)].map((id) => PLAYER_CARDS.get(id)!), text: `Las ${h.deck.length} cartas del mazo de ${h.hero.name} (${new Set(h.deck).size} distintas).` })),
    { id: "todas", label: "Todas", cards: all, text: `Todas las cartas de jugador del juego: ${all.length}.` },
  ];
  const [tab, setTab] = useState(tabs[0].id);
  const t = tabs.find((x) => x.id === tab)!;
  const note = (c: PlayerCardDef) => {
    const u = usedBy.get(c.id);
    const where = u?.length ? `En: ${u.map((x) => `${x.hero} ×${x.n}`).join(" · ")}` : "Ningún mazo la usa ahora.";
    return shared.has(c.id) ? `${where} · Del álbum común` : where;
  };
  return (
    <Modal wide label="Álbum de cartas" onClose={onClose}>
      <div class="kicker">Álbum de cartas · {all.length} cartas distintas</div>
      <div class="tabs" role="tablist" aria-label="Secciones del álbum">
        {tabs.map((x) => (
          <button key={x.id} role="tab" aria-selected={x.id === tab} class={x.id === tab ? "on" : ""} style={{ ["--hero" as string]: HEROES.find((h) => h.id === x.id)?.colour ?? "#6b5b95" }} onClick={() => setTab(x.id)}>
            {x.label} · {x.cards.length}
          </button>
        ))}
      </div>
      <p class="muted small">{t.text}</p>
      <ul class="deck-list">
        {t.cards.map((c) => <DeckRow key={c.id} def={c} note={note(c)} />)}
      </ul>
      <button class="act ghost wide" onClick={onClose}>Cerrar</button>
    </Modal>
  );
}
