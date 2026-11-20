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
import { artCeniza1 } from "./art-ceniza-1";
import { artCeniza2 } from "./art-ceniza-2";
import { artCeniza3 } from "./art-ceniza-3";
import { artCeniza4 } from "./art-ceniza-4";
import { artFunambula1 } from "./art-funambula-1";
import { artFunambula2 } from "./art-funambula-2";

/** Card art sculpts by art key (see tools/art/keys.ts). */
export const ART: Record<string, Sculpt> = { ...personajes, ...villanos, ...cartasA, ...cartasB, ...encuentros, ...expansion, ...artHeroes, ...artAliados, ...artEsbirros, ...artEncuentros, ...artCartas1, ...artCartas2, ...artCeniza1, ...artCeniza2, ...artCeniza3, ...artCeniza4, ...artFunambula1, ...artFunambula2 };
