/** Card art: src/assets/art/<key>.png, bundled when the game is built. Missing art shows the card's symbol. */
const files = import.meta.glob("../assets/art/*.{png,webp}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const byKey = new Map(Object.entries(files).map(([path, url]) => [path.split("/").pop()!.replace(/\.(png|webp)$/, ""), url]));
export const artUrl = (key: string) => byKey.get(key);
