import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact()],
  // Relative paths: the game works from any folder or subpath it's hosted under.
  base: "./",
  build: { target: "es2022" },
});
