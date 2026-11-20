# Heroica

Un juego de cartas cooperativo para jugar solo, con uno o dos héroes a la vez («a dos manos»), en el reino de
fantasía de **Valdoria**: ingenieras, estudiantes y científicas de la ciudad de Aurelia que, cuando el cielo arde, se
convierten en héroes con poderes. Todo el contenido (héroes, cartas, villanos, escenarios, reglas y textos) es original.

Web estática (PWA) pensada para iPad en horizontal y iPhone en vertical. Sin servidores, sin cuentas: la partida se
guarda en el propio dispositivo después de cada acción.

## Cómo se juega

- **Objetivo:** derrota al villano en todas sus fases antes de que su plan principal llegue al límite.
- **Tu turno:** juega cartas pagando su coste con otras cartas de tu mano (cada icono ⚡🧠✊🌟 = 1 recurso). Tu héroe actúa una vez:
  atacar (Fuerza) o contener (Ingenio) en forma de héroe, o recuperar vida en su identidad. Cambias de forma una vez
  por turno. Aliados: atacan o contienen sufriendo daño. Al terminar, robas hasta tu mano y se prepara todo.
- **Fase del villano:** el plan avanza; el villano y tus esbirros atacan al héroe (te defiendes con el héroe o bloqueas
  con un aliado, y puedes jugar cartas de defensa o respuesta) o traman contra la identidad. Una carta de refuerzo suma
  a su ataque o plan. Después cada jugador recibe una carta de encuentro.

## Contenido actual

- **Héroes** (mazos de 40: 15 propias + 25 de su aspecto y básicas):
  - **Vanguardia de Titanio** (Iria Montalbán, ingeniera) — Protección. Mano 1 en forma de héroe, +1 por cada mejora
    Tecnología (máx. 7); Propulsores que dan Aéreo durante la fase, Pulso Iónico que lee los ⚡ descartados, Campo
    Reflector, Golpe Anticipado y aliados que anulan cartas de encuentro.
  - **Funámbula** (Lía Brenner, estudiante) — Liderazgo. Genera 🧠 en identidad; *Sexto sentido* roba cuando el villano
    la ataca; Visión Periférica anula traiciones, Red Atrapante, Hilo Rastreador y aliados que se refuerzan.
  - **Mole Tronante** (Dra. Irene Volkova) — Justicia. 18 de vida y 3 de Fuerza, mano de 4 que descarta entera al final
    de cada turno de héroe; cartas que mejoran si las pagas solo con ✊ (Salto Suborbital, Puño Cataclísmico) y control
    de planes (Patrulla del Barrio, Despejar la Plaza, Ojo Vigilante, Contrainteligencia).
  - **Centella Estelar** (Comandante Elena Saavedra) — Liderazgo. *Recanalizar* (⚡ → cura 1 y roba 1), *Al mando*
    (un jugador roba 1); Vuelo Cósmico da Aéreo para Interceptar la Crisis en dos planes; Canal de Energía acumula
    cargas; aliados de la Guardia de Aurelia.
  - **Soberano de Oricalco** (Rey Adisa Mbeki) — Liderazgo. Elige una mejora Oricalco al empezar; *¡Por Oricalcia!*
    resuelve las capacidades especiales de todas sus mejoras en secuencia (la última, más fuerte); Represalia 1.
- **Escenarios** (Normal: fases I–II del villano; Experto: fases II–III y su conjunto Experto de 3 cartas):
  - *El Asalto al Arsenal* contra **Mazagón, el Titán Embestidor** (+ *Amenaza de Bomba*): golpea fuerte, trama poco.
  - *La Sinfonía Destructora* contra **Estruendo, el Maestro del Sonido** (+ *Liga Siniestra*): 2 cartas de refuerzo por
    activación, empieza con un plan secundario en juego y su plan principal tiene 2 fases.
  - *El Enjambre* contra **Nexo, la IA Rebelde** (+ *Bajo Asedio*): convierte cartas de tu mazo en Drones, gana Fuerza
    por cada uno y su plan principal tiene 3 fases.
- **Campañas:** la home agrupa los escenarios en packs. *Caja Básica* tiene los tres anteriores. *El Ascenso del Mariscal
  de Ceniza* son 5 misiones enlazadas contra la Legión de Ceniza (modulares *Asalto de la Legión*, *Patrulla de la Legión*
  y *Maestro de Armas*):
  1. *Asalto al Laboratorio* — **Saeta Negra**: mazo aparte de armas experimentales que se quitan gastando recursos;
     Perforante, Arrollador, A distancia; plan principal de 3 fases.
  2. *Nadie Pasará* — **Amalgama**: absorbe el entorno en juego (Piedra, Acero, Hielo, Madera) y sus cartas lo leen;
     contadores de Retraso.
  3. *El Imitador* — **Réplica**: te hace daño cada vez que te transformas en héroe; dos aliados capturados que rescatas
     frustrando la Celda de Contención.
  4. *La Isla del Doctor Quimera* — **Doctor Quimera**: contadores de Pruebas que liberan esbirros Mutantes (Represalia, Duro).
  5. *El Mariscal de Ceniza* — mazo de planes secundarios (Crisis, Peligro) y El Coloso Dormido, que despierta.
  En modo campaña se guardan heridas, recompensas, aliados rescatados y condiciones (`localStorage`); las misiones se
  desbloquean para jugarlas sueltas al avanzar.
- **Reglas:** recursos por tipo (⚡ Energía, 🧠 Mental, ✊ Físico, 🌟 Comodín), estados (Aturdido, Confundido, Duro),
  fase del villano paso a paso con sus cartas de refuerzo, y deshacer de un solo paso.
- **Arte:** las cartas básicas tienen ilustración 3D (toon) en `src/assets/art/*.webp`; el resto muestra su símbolo hasta
  que se le haga un diseño.

## Álbum de cartas

Cada carta muestra su procedencia en el marco y en dos etiquetas: el tipo (ALIADO, EVENTO, MEJORA, APOYO, RECURSO) y el
aspecto, con su color: Furia (rojo), Justicia (amarillo), Protección (verde), Liderazgo (azul), Básica (gris) y las
cartas propias de cada héroe en su color. Las de encuentro son moradas (esbirros, vínculos, planes) o naranjas
(traiciones y obligaciones). Los aliados marcan con ✱ el daño que reciben al atacar o contener.

Las cartas de aspecto (Liderazgo, Protección…) y las básicas están una sola vez en
`src/data/roster/album.ts`, y cualquier mazo las reutiliza: Funámbula y Vanguardia comparten, por ejemplo, la Aeronave
de Mando y los recursos dobles. En el juego, **Álbum de cartas** muestra todas las cartas y qué mazos usan cada una.

`src/data/album.json` relaciona cada código de carta de MarvelCDB con la carta de Heroica que juega igual. Para montar
un mazo nuevo a partir de una lista pública:

```sh
NODE_USE_ENV_PROXY=1 node tools/album.mjs https://es.marvelcdb.com/decklist/view/510/...
```

Muestra qué cartas ya están en el álbum (se reutilizan tal cual) y cuáles faltan, con su texto. Las que faltan se
crean con nombre, texto y arte propios, y se añaden a `album.json`.

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
- `src/data/content.ts` — reúne cartas, héroes y escenarios; cada héroe nuevo y los escenarios están en `src/data/roster/`.
- `src/ui/` — mesa táctil, cartas, hojas de decisión; deshacer durante la fase de jugadores.

## Publicar gratis

GitHub Pages con `.github/workflows/deploy.yml`: crea un repositorio, súbelo a `main` y en *Settings › Pages*
elige *GitHub Actions*.
