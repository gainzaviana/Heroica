import type { Sculpt } from "../sculpt";
import { personajes } from "./personajes";
import { villanos } from "./villanos";
import { cartasA } from "./cartas-a";
import { cartasB } from "./cartas-b";
import { encuentros } from "./encuentros";
import { expansion } from "./expansion";
import { artHeroes } from "./art-heroes";
import { artAliados } from "./art-aliados";
import { artEsbirros } from "./art-esbirros";
import { artEncuentros } from "./art-encuentros";
import { artCartas1 } from "./art-cartas-1";
import { artCartas2 } from "./art-cartas-2";

/** Card art sculpts by art key (see tools/art/keys.ts). */
export const ART: Record<string, Sculpt> = { ...personajes, ...villanos, ...cartasA, ...cartasB, ...encuentros, ...expansion, ...artHeroes, ...artAliados, ...artEsbirros, ...artEncuentros, ...artCartas1, ...artCartas2 };
