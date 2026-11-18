// Heroica: the card model and the game state. Everything is plain data (JSON-safe) so a game
// can be saved, undone and replayed.

// MARK: Effects (cards are data, not code)

/** Who an effect points at. "choose…" asks the player; the rest are fixed. */
export type Target =
  | "chooseEnemy" // villain or a minion
  | "chooseMinion"
  | "villain"
  | "attacker" // the enemy attacking right now
  | "allMinions"
  | "choosePlan" // main plan or a side plan
  | "mainPlan"
  | "self" // this hero
  | "chooseFriendly" // a hero or an ally on your side
  | "eachHero";

export type Effect =
  | { do: "damage"; target: Target; amount: number; ifUpgrade?: number; stun?: boolean; plusTrait?: string }
  | { do: "thwart"; target: Target; amount: number }
  | { do: "addThreat"; target: Target; amount: number }
  | { do: "heal"; target: Target; amount: number }
  | { do: "draw"; amount: number }
  | { do: "prevent"; amount: number } // during a defence: less damage
  | { do: "stun"; target: Target } // the enemy skips its next activation
  | { do: "readyHero" }
  | { do: "villainActivates" } // the villain activates against this player
  | { do: "heroDamage"; amount: number; ifIdentity?: { do: "addThreat"; amount: number } }
  | { do: "surge" } // reveal another encounter card
  | { do: "lookTop"; amount: number } // look at the top cards of your deck, keep one, discard the rest
  | { do: "exhaustHero" } // the hero loses its next action
  | { do: "choose"; text: string; options: { label: string; effects: Effect[] }[] } // the player picks one branch
  | { do: "villainTough" } // the villain gains Duro; if it already has it, surge
  | { do: "nemesis" } // the revealing hero's nemesis set comes into play; if there is none, surge
  | { do: "armPlan"; plan: string; amount: number } // add threat to that side plan, or put it into play
  | { do: "detonate"; plan: string }; // damage equal to that side plan's threat, then discard it; if absent, surge

/** When a card's ability can be used. */
export type Timing =
  | "action" // on your turn
  | "defend" // interrupt: while an enemy attacks you, before damage
  | "afterAttack" // response: after an enemy attacked you
  | "afterUpgrade"; // response: after you play an upgrade

export interface Ability { timing: Timing; cost?: "exhaust" | "once"; effects: Effect[]; text: string; heroOnly?: boolean }

// MARK: Cards

export type PlayerCardType = "aliado" | "mejora" | "apoyo" | "evento" | "recurso";
export type EncounterCardType = "esbirro" | "traicion" | "plan" | "vinculo" | "obligacion";

export interface Stats { fuerza?: number; ingenio?: number; aguante?: number }

export interface PlayerCardDef {
  id: string;
  name: string;
  type: PlayerCardType;
  cost: number;
  /** Resources it gives when discarded to pay (most 1, resource cards 2). */
  resources: number;
  text: string;
  flavor?: string;
  /** Allies: health, attack, thwart and the damage they take for acting. */
  ally?: { vida: number; fuerza: number; ingenio: number; consFuerza: number; consIngenio: number };
  /** Upgrades: stat bonus to the hero. */
  bonus?: Stats & { vidaMax?: number; mano?: number };
  /** Traits other cards can count (e.g. "pieza" for armour pieces). */
  traits?: string[];
  /** Events: what they do when played, and when they can be played. */
  play?: { timing: Timing; effects: Effect[]; heroOnly?: boolean };
  /** Supports/upgrades with an ability. */
  ability?: Ability;
  glyph: string;
}

export interface EncounterCardDef {
  id: string;
  name: string;
  type: EncounterCardType;
  text: string;
  flavor?: string;
  /** Extra attack or scheme it adds when flipped as a boost. */
  boost: number;
  minion?: { vida: number; fuerza: number; plan: number; guardia?: boolean };
  sidePlan?: { amenaza: number; aceleracion?: boolean };
  /** Treachery effects, or minion/plan effects when revealed. */
  reveal?: Effect[];
  /** Attachments: added to the villain's stats. */
  villainBonus?: { fuerza?: number; plan?: number };
  /** Attachments: discarded after the villain's next attack. */
  oneShot?: boolean;
  glyph: string;
}

export interface HeroDef {
  id: string;
  hero: {
    name: string; fuerza: number; ingenio: number; aguante: number; mano: number; text: string;
    /** Hero form: +1 hand size per card in play with this trait, up to `max`. */
    manoPorRasgo?: { trait: string; max: number };
  };
  identity: { name: string; recuperacion: number; mano: number; text: string };
  vida: number;
  /** The hero's own once-per-round ability (hero form). */
  ability?: Ability;
  /** An action usable once per round in identity form. */
  identityAbility?: Ability;
  deck: string[];
  /** Encounter cards set aside until a "nemesis" effect brings them in. */
  nemesis?: string[];
  /** Encounter card shuffled into the encounter deck; always resolves against this hero. */
  obligation?: string;
  colour: string;
  glyph: string;
}

export interface VillainStage {
  name: string; vidaPorJugador: number; fuerza: number; plan: number; text?: string;
  /** When this stage comes into play: attach a card found in the encounter deck or discard, and/or gain Duro. */
  onReveal?: { attach?: string; tough?: boolean };
}

export interface ScenarioDef {
  id: string;
  name: string;
  intro: string;
  villain: {
    name: string; stages: VillainStage[]; glyph: string;
    /** Which stages are used (indexes into `stages`). Default: all of them in both modes. Setting
     *  `expert` replaces the generic expert bonus (+1 Fuerza, +2 vida por jugador). */
    stagesFor?: { normal: number[]; expert: number[] };
  };
  mainPlan: { name: string; inicioPorJugador: number; aceleracionPorJugador: number; limitePorJugador: number; text: string };
  encounterSets: string[];
  /** Sets added in Expert mode (default: the shared "experto" set). */
  expertSets?: string[];
}

// MARK: State

export type Zone = "deck" | "hand" | "discard" | "play" | "removed";

export interface CardInPlay {
  uid: string;
  def: string;
  exhausted: boolean;
  damage: number;
  /** Ability used this round (for "once" costs). */
  usedThisRound?: boolean;
}

export interface MinionState { uid: string; def: string; damage: number; stunned?: boolean }

export interface PlanState { uid: string; def: string | "main"; threat: number }

export interface PlayerState {
  hero: string;
  form: "heroe" | "identidad";
  heroExhausted: boolean;
  flippedThisTurn: boolean;
  heroAbilityUsed: boolean;
  damage: number;
  stunned: boolean;
  deck: string[]; // uids, top first
  hand: string[];
  discard: string[];
  play: CardInPlay[];
  engaged: MinionState[];
  eliminated: boolean;
  identityAbilityUsed?: boolean;
  /** Nemesis cards set aside (uids) until they come into play. */
  nemesis?: string[];
}

export type Phase = "jugadores" | "villano" | "fin";

/** Something the engine is waiting for the player to decide. */
export interface Prompt {
  id: string;
  player: number;
  kind: "target" | "defense" | "optional" | "discardHand" | "info";
  text: string;
  options: { id: string; label: string; detail?: string }[];
  /** Internal: what to do with the answer. */
  resume: Resume;
}

export type Resume =
  | { r: "effects"; player: number; effects: Effect[]; index: number; source?: string; ctx?: EffectCtx }
  | { r: "defense"; player: number; attacker: string; amount: number; boost: number }
  | { r: "interrupts"; player: number; attacker: string; amount: number; defender: string | null; prevented: number }
  | { r: "afterAttack"; player: number; attacker: string }
  | { r: "villainStep" };

export interface EffectCtx { attacker?: string; preventPool?: { amount: number } }

export interface GameState {
  version: 1;
  seed: number;
  rngState: number;
  scenario: string;
  /** Experto: tougher villain (+1 Fuerza, +2 vida por jugador en cada fase) and the expert encounter set. */
  difficulty: "normal" | "experto";
  /** Every card instance in the game: uid → definition id. */
  cards: Record<string, string>;
  players: PlayerState[];
  /** Whose turn it is (player phase) and who goes first this round. */
  active: number;
  first: number;
  round: number;
  phase: Phase;
  /** `stage` is a position in the stages used this game (see stagesFor). Duro: the next damage is cancelled. */
  villain: { stage: number; damage: number; stunned: boolean; tough?: boolean; attachments: string[] };
  plans: PlanState[];
  encounterDeck: string[];
  encounterDiscard: string[];
  /** Villain phase progress: the queue of steps still to run. */
  villainQueue: VillainStep[];
  prompt: Prompt | null;
  log: { round: number; text: string }[];
  result?: "victoria" | "derrota";
  resultText?: string;
  nextUid: number;
}

export type VillainStep =
  | { s: "accelerate" }
  | { s: "villainActivates"; player: number }
  | { s: "minionsActivate"; player: number }
  | { s: "deal" }
  | { s: "reveal"; player: number; card: string }
  | { s: "endRound" };
