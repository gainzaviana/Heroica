# Heroica

Un juego de cartas cooperativo para jugar solo, con uno o dos héroes a la vez («a dos manos»), en el reino de
fantasía de **Valdoria**: herreras y cartógrafos de la ciudad de Aurelia que, cuando el cielo arde, se convierten en
héroes con poderes. Todo el contenido (héroes, cartas, villanos, escenarios, reglas y textos) es original.

Web estática (PWA) pensada para iPad en horizontal y iPhone en vertical. Sin servidores, sin cuentas: la partida se
guarda en el propio dispositivo después de cada acción.

## Cómo se juega

- **Objetivo:** derrota al villano en todas sus fases antes de que su plan principal llegue al límite.
- **Tu turno:** juega cartas pagando su coste con otras cartas de tu mano (◆ = 1 recurso). Tu héroe actúa una vez:
  atacar (Fuerza) o contener (Ingenio) en forma de héroe, o recuperar vida en su identidad. Cambias de forma una vez
  por turno. Aliados: atacan o contienen sufriendo daño. Al terminar, robas hasta tu mano y se prepara todo.
- **Fase del villano:** el plan avanza; el villano y tus esbirros atacan al héroe (te defiendes con el héroe o bloqueas
  con un aliado, y puedes jugar cartas de defensa o respuesta) o traman contra la identidad. Una carta de refuerzo suma
  a su ataque o plan. Después cada jugador recibe una carta de encuentro.

## Contenido actual

- **Héroes** (mazos de 30): **Brasa Rúnica** (Kaela Voss, herrera de runas), **Vigía del Alba** (Elian Morrow,
  cartógrafo), **Guardián de Piedra** (Bruna Halder, cantera; muy resistente) y **Sombra Errante** (Liss Corvel,
  ladrona; rápida y con mucho robo) y **Armadura Celeste** (Teodor Valcourt, inventor; cada pieza de armadura amplía su
  mano y potencia sus ataques).
- **Escenarios:** *La Estampida* contra **Kragor, el Coloso Embestidor** (el más sencillo: golpea fuerte, trama poco);
  *El Eclipse de Ceniza* contra **Morvath, el Rey Ceniza**; *La Marea Negra* contra **Vesperia, la
  Bruja de las Mareas**; *El Asedio de Hierro* contra **Gorvak, el Señor del Asedio**. Cada uno con su conjunto de
  encuentros, un conjunto modular (*Legión de Sombras* o *Culto de la Luna Rota*) y el *Estándar*.
- **Dificultad:** Normal o Experto (el villano tiene +1 Fuerza y +2 vida por jugador en cada fase, y se añade el
  conjunto *Experto*).
- **Arte:** cada carta, héroe y villano tiene su ilustración 3D (toon) en `src/assets/art/*.webp`.

## Arte de las cartas

Las ilustraciones salen de esculturas 3D descritas en código (`tools/art/designs/*.ts`, motor en
`tools/art/sculpt.ts`) y se renderizan con Chrome:

```sh
node tools/art/render.mjs list                         # qué cartas tienen diseño
node tools/art/render.mjs preview /tmp/x.png martillo-runico,torre-vigia
node tools/art/render.mjs build                        # genera src/assets/art/*.png
python3 tools/art/webp.py                              # las pasa a WebP (necesita Pillow)
```

## Desarrollo

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # motor de reglas: partidas completas jugadas por un bot
npm run build
```

- `src/engine/` — reglas: estado de la partida (JSON), acciones, fase del villano, efectos de cartas como datos,
  decisiones del jugador (`prompt`/`answer`), azar con semilla (partidas reproducibles).
- `src/data/content.ts` — todas las cartas, héroes y escenarios.
- `src/ui/` — mesa táctil, cartas, hojas de decisión; deshacer durante la fase de jugadores.

## Publicar gratis

GitHub Pages con `.github/workflows/deploy.yml`: crea un repositorio, súbelo a `main` y en *Settings › Pages*
elige *GitHub Actions*.
