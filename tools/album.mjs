// The card album: which cards of a MarvelCDB decklist already exist in Heroica.
//   node tools/album.mjs <decklist URL or id>
// For each card: ✓ and the Heroica card it maps to (reuse it), or ✗ and its type, cost, resources
// and text (it still has to be made). Add every new card to src/data/album.json once it exists:
// shared aspect/basic cards in src/data/roster/album.ts, hero cards in the hero's file.
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const album = JSON.parse(readFileSync(resolve(root, "src/data/album.json"), "utf8"));
const arg = process.argv[2];
const id = arg?.match(/decklist\/view\/(\d+)/)?.[1] ?? arg?.match(/^\d+$/)?.[0];
if (!id) { console.error("Uso: node tools/album.mjs <URL o número de la lista de MarvelCDB>"); process.exit(1); }

const api = "https://es.marvelcdb.com/api/public";
async function get(path, tries = 3) {
  for (let k = 1; ; k++) {
    try { const r = await fetch(`${api}/${path}`); if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`); return await r.json(); }
    catch (e) { if (k >= tries) throw e; await new Promise((ok) => setTimeout(ok, 1500 * k)); }
  }
}
const strip = (t) => (t ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const icons = (c) => [["⚡", c.resource_energy], ["🧠", c.resource_mental], ["✊", c.resource_physical], ["🌟", c.resource_wild]].map(([i, n]) => i.repeat(n ?? 0)).join("");

const deck = await get(`decklist/${id}`);
const hero = album.heroes[deck.investigator_code ?? deck.hero_code];
console.log(`${deck.name} · héroe ${deck.hero_code}${hero ? ` → ${hero}` : " (héroe nuevo: aún no existe)"}\n`);

// Every player card in one request (instead of one per card).
const all = new Map((await get("cards/")).map((c) => [c.code, c]));
let have = 0, missing = 0;
const rows = { "✓": [], "✗": [] };
for (const [code, n] of Object.entries(deck.slots)) {
  const c = all.get(code) ?? await get(`card/${code}`);
  const ours = album.cards[code] ?? album.cards[c.duplicate_of_code];
  const head = `${n}× ${c.name} [${c.faction_name}, ${c.type_name}${c.cost != null ? `, coste ${c.cost}` : ""}${icons(c) ? `, ${icons(c)}` : ""}]`;
  if (ours) { have += n; rows["✓"].push(`  ✓ ${head} → ${ours}`); }
  else {
    missing += n;
    const stats = c.type_code === "ally" ? ` ATQ ${c.attack ?? 0} INT ${c.thwart ?? 0} Vida ${c.health}` : "";
    rows["✗"].push(`  ✗ ${head}${stats} (${code})\n      ${strip(c.text)}`);
  }
}
console.log(`Ya en el álbum (${have} cartas):`); console.log(rows["✓"].join("\n") || "  —");
console.log(`\nPor crear (${missing} cartas):`); console.log(rows["✗"].join("\n") || "  —");
