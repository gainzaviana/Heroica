import type { Sculpt } from "../sculpt";
import { personajes } from "./personajes";
import { villanos } from "./villanos";
import { cartasA } from "./cartas-a";
import { cartasB } from "./cartas-b";
import { encuentros } from "./encuentros";

/** Card art sculpts by art key (see tools/art/keys.ts). */
export const ART: Record<string, Sculpt> = { ...personajes, ...villanos, ...cartasA, ...cartasB, ...encuentros };
