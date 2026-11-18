// Card art tool. Starts its own Vite server, renders sculpts in headless Chrome.
//   node tools/art/render.mjs build [key,key,...]      → src/assets/art/<key>.png (512×512)
//   node tools/art/render.mjs preview <out.png> key,key,...   → review sheet (two angles + brief)
//   node tools/art/render.mjs list                     → keys and whether they have a design
import { createServer } from "vite";
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const [mode, a, b] = process.argv.slice(2);
// No file watching or live reload: other edits to the designs must not reload the page mid-render.
const server = await createServer({ root, logLevel: "error", server: { port: 0, hmr: false, watch: null } });
await server.listen();
const url = server.resolvedUrls.local[0] + "tools/art/render.html";
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(url);
await page.waitForFunction(() => typeof window.renderArt === "function", null, { timeout: 30000 });
try {
  if (mode === "list") {
    const rows = await page.evaluate(() => { const d = new Set(window.artDesigned()); return window.artKeys().map((k) => `${d.has(k.key) ? "✓" : "·"} ${k.group.padEnd(11)} ${k.key.padEnd(26)} ${k.label}`); });
    console.log(rows.join("\n"));
  } else if (mode === "build") {
    const dir = resolve(root, "src/assets/art");
    mkdirSync(dir, { recursive: true });
    // Only cards that exist: old designs whose card was removed are not rebuilt.
    const keys = a ? a.split(",") : await page.evaluate(() => { const live = new Set(window.artKeys().map((k) => k.key)); return window.artDesigned().filter((k) => live.has(k)); });
    for (const key of keys) {
      const data = await page.evaluate((k) => window.renderArt(k, 512), key);
      if (!data) { console.log(`sin diseño: ${key}`); continue; }
      writeFileSync(resolve(dir, `${key}.png`), Buffer.from(data.split(",")[1], "base64"));
    }
    console.log(`${keys.length} imágenes en src/assets/art (PNG: conviértelas a WebP con tools/art/webp.py)`);
  } else if (mode === "preview") {
    const keys = b.split(",");
    await page.evaluate(async (keys) => {
      const all = Object.fromEntries(window.artKeys().map((k) => [k.key, k]));
      document.body.innerHTML = "";
      document.body.style.cssText = "margin:0;background:#f6eee2;font:13px sans-serif;display:grid;grid-template-columns:repeat(3,380px);gap:8px;padding:8px";
      for (const key of keys) {
        const cell = document.createElement("div");
        cell.style.cssText = "background:#fff;border-radius:10px;padding:6px";
        const imgs = [-0.6, 0.15].map((t) => window.renderArt(key, 360, t));
        cell.innerHTML = `<b>${key}</b> · ${all[key]?.label ?? "?"}<div style="display:flex">${imgs.map((u) => (u ? `<img src="${u}" width=180 height=180>` : `<div style="width:180px;height:180px;display:grid;place-items:center;color:#c00">sin diseño</div>`)).join("")}</div><div style="color:#776">${all[key]?.brief ?? ""}</div>`;
        document.body.appendChild(cell);
      }
    }, keys);
    await page.screenshot({ path: a, fullPage: true });
    console.log(`→ ${a}`);
  }
} finally {
  if (errors.length) console.log("ERRORES:\n" + errors.join("\n"));
  await browser.close();
  await server.close();
}
