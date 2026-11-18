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
  | "eachHero"
  | "lastTarget" // the enemy the previous effect hit
  | "chooseOtherEnemy" // an enemy other than lastTarget
  | "allCharacters" // villain, every minion, every hero and every ally
  | "thisCard" // the card whose ability or ally action this is
  | "allEnemies" // the villain and every minion
  | "allAllies" // every ally of this player
  | "chooseAlly"; // one of your allies

/** Printed resource types. Comodín counts as any type. */
export type ResType = "energia" | "mental" | "fisico" | "comodin";
/** Status cards: Aturdido cancels the next basic attack, Confundido the next basic thwart or scheme, Duro the next damage. */
export type StatusKind = "stunned" | "confused" | "tough";
export interface Statuses { stunned?: boolean; confused?: boolean; tough?: boolean }

export type Effect =
  | {
      do: "damage"; target: Target; amount: number; ifUpgrade?: number; stun?: boolean; plusTrait?: string;
      /** +amount if the card was paid with this resource type. */
      paidBonus?: { res: ResType; amount: number };
      /** +amount if your hero has a card in play with this trait. */
      traitBonus?: { trait: string; amount: number };
      /** Paid with this type: damage beyond what kills a minion carries over to the villain. */
      overkillIfPaid?: ResType;
      /** +amount per resource of this type paid (Comodín counts). */
      perPaid?: { res: ResType; amount: number };
      /** +amount per printed resource of this type in your hand. */
      perHeld?: { res: ResType; amount: number };
      /** +amount per counter on the acting card. */
      perCounter?: number;
    }
  | {
      do: "thwart"; target: Target; amount: number;
      paidBonus?: { res: ResType; amount: number };
      /** With this trait in play: remove the threat from every plan instead of one. */
      allIfTrait?: string;
      /** +amount if you defeated an enemy this turn. */
      bonusIfDefeated?: number;
    }
  | { do: "addThreat"; target: Target; amount: number }
  | { do: "heal"; target: Target; amount: number }
  | { do: "draw"; amount: number; ifPaid?: ResType } // ifPaid: only if paid with that type
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
  | { do: "detonate"; plan: string } // damage equal to that side plan's threat, then discard it; if absent, surge
  | { do: "status"; status: StatusKind; target: Target } // give a status card (never two of the same)
  /** Discard the top cards of your deck and read their printed resources: damage per icon of a type
   *  (to lastTarget), and/or (one card) the branch for its type — a Comodín runs every branch. */
  | { do: "mill"; amount: number; damagePer?: { res: ResType; amount: number }; branches?: Partial<Record<Exclude<ResType, "comodin">, Effect[]>> }
  | { do: "ifKilled"; effects: Effect[] } // only if the previous damage defeated an enemy
  | { do: "selfDamage"; amount: number } // the acting ally takes damage (consequential damage)
  | { do: "discardSelf" } // the acting card is discarded
  | { do: "addCounter"; amount: number; perPaid?: ResType } // counters on the acting card (perPaid: one per resource of that type paid)
  | { do: "readyAllies" }
  | { do: "buffAlly"; target: Target; fuerza?: number; ingenio?: number; vida?: number } // permanent bonus to one ally
  | { do: "recallAlly" } // an ally from your discard back to your hand
  /** Resolve the action ability of every card in play with this trait (without exhausting them);
   *  the one you choose as primary gets +primaryBonus to its first amount. */
  | { do: "triggerAll"; trait: string; primaryBonus: number }
  | { do: "drone"; amount: number } // the top cards of your deck come into play face down as Drones engaged with you
  | { do: "discardUpgrade" }; // discard one of your upgrades (the most expensive)

/** When a card's ability can be used. */
export type Timing =
  | "action" // on your turn
  | "defend" // interrupt: while an enemy attacks you, before damage
  | "afterAttack" // response: after an enemy attacked you
  | "afterUpgrade" // response: after you play an upgrade
  | "villainAttack"; // response: after the villain starts an attack against you

export interface Ability {
  timing: Timing; cost?: "exhaust" | "once"; effects: Effect[]; text: string; heroOnly?: boolean;
  /** Using it asks you to discard a card with this resource (Comodín counts) to pay. */
  payFor?: ResType;
  /** Without such a card you can't use it. */
  payRequired?: boolean;
  /** Only in identity form. */
  identityOnly?: boolean;
}

// MARK: Cards

export type PlayerCardType = "aliado" | "mejora" | "apoyo" | "evento" | "recurso";
export type EncounterCardType = "esbirro" | "traicion" | "plan" | "vinculo" | "obligacion";

export interface Stats { fuerza?: number; ingenio?: number; aguante?: number }

export interface PlayerCardDef {
  id: string;
  name: string;
  type: PlayerCardType;
  cost: number;
  /** Resources it gives when discarded to pay (most 1, resource cards 2), all of type `resType`. */
  resources: number;
  resType: ResType;
  /** When it enters play from your hand (allies, supports, upgrades). */
  onPlay?: Effect[];
  text: string;
  flavor?: string;
  /** Allies: health, attack, thwart and the damage they take for acting. */
  ally?: {
    vida: number; fuerza: number; ingenio: number; consFuerza: number; consIngenio: number;
    /** After it attacks (forced). */
    onAttack?: Effect[];
    /** After its attack defeats an enemy. */
    onKill?: Effect[];
    /** After it thwarts (its basic thwart). */
    onThwart?: Effect[];
    /** When it blocks an attack, before damage ("prevent" lowers the damage; "attacker" is the enemy). */
    onBlock?: Effect[];
  };
  /** Upgrades: stat bonus to the hero. */
  bonus?: Stats & { vidaMax?: number; mano?: number };
  /** Traits other cards can count (e.g. "pieza" for armour pieces). */
  traits?: string[];
  /** Events: what they do when played, and when they can be played. */
  play?: { timing: Timing; effects: Effect[]; heroOnly?: boolean };
  /** Supports/upgrades with an ability (a second one in `abilities`). */
  ability?: Ability;
  abilities?: Ability[];
  /** Exhaust it while paying for a card: it gives this resource. */
  resourceAbility?: { res: ResType; amount: number };
  /** Counters it enters play with; a resource card with counters is discarded when they run out. */
  uses?: number;
  /** Upgrades: after an enemy attacks your hero, deal this much damage to it. */
  retaliate?: number;
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
  /** Attachments and side plans: added to the villain's stats while in play. */
  villainBonus?: { fuerza?: number; plan?: number; vida?: number };
  /** Attachments: every Drone gets +n Fuerza, Plan and Vida. */
  droneBonus?: number;
  /** As a boost card: this also happens (shown as "⚡ Refuerzo"). */
  boostEffect?: Effect[];
  boostText?: string;
  /** Minions: statuses they enter play with. */
  startStatus?: StatusKind[];
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
    /** At the end of your turn in hero form, discard your whole hand before drawing. */
    discardHandAtEnd?: boolean;
    /** After an enemy attacks you in hero form, deal this much damage to it. */
    retaliate?: number;
  };
  /** Identity form: once per round, a free resource when paying for a card. */
  identityResource?: { res: ResType; amount: number };
  /** Setup: this card starts in your hand. */
  setupToHand?: string;
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
  /** Boost cards dealt to each of its activations (default 1). */
  boosts?: number;
  /** When it attacks you: this many Drones come into play first. */
  dronesOnAttack?: number;
  /** +Fuerza per Drone engaged with the hero it attacks. */
  fuerzaPorDron?: number;
}

export interface MainPlanDef { name: string; inicioPorJugador: number; aceleracionPorJugador: number; limitePorJugador: number; text: string }

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
  mainPlan: MainPlanDef;
  /** Later main plan stages: completing one advances to the next; completing the last loses. */
  nextPlans?: MainPlanDef[];
  /** Side plans (found in the encounter sets) that start in play. */
  setupSidePlans?: string[];
  encounterSets: string[];
  /** Sets added in Expert mode (default: the shared "experto" set). */
  expertSets?: string[];
}

// MARK: State

export type Zone = "deck" | "hand" | "discard" | "play" | "removed";

export interface CardInPlay extends Statuses {
  uid: string;
  counters?: number;
  /** Permanent bonuses (allies). */
  buff?: { fuerza?: number; ingenio?: number; vida?: number };
  def: string;
  exhausted: boolean;
  damage: number;
  /** Ability used this round (for "once" costs). */
  usedThisRound?: boolean;
}

/** A minion. A Drone is a player card (its uid) played face down with the "dron" definition. */
export interface MinionState extends Statuses { uid: string; def: string; damage: number; drone?: boolean }

export interface PlanState { uid: string; def: string | "main"; threat: number }

export interface PlayerState {
  hero: string;
  form: "heroe" | "identidad";
  heroExhausted: boolean;
  flippedThisTurn: boolean;
  heroAbilityUsed: boolean;
  damage: number;
  /** Statuses of the hero/identity (one character). */
  stunned: boolean;
  confused?: boolean;
  tough?: boolean;
  /** Enemies defeated during this player's current turn. */
  defeatedThisTurn?: number;
  deck: string[]; // uids, top first
  hand: string[];
  discard: string[];
  play: CardInPlay[];
  engaged: MinionState[];
  eliminated: boolean;
  identityAbilityUsed?: boolean;
  identityResUsed?: boolean;
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
  /** oneShots: one-use attachments that were on the villain when this attack started (they go after it). */
  | { r: "defense"; player: number; attacker: string; amount: number; boost: number; oneShots?: string[] }
  | { r: "interrupts"; player: number; attacker: string; amount: number; defender: string | null; prevented: number; oneShots?: string[] }
  | { r: "afterAttack"; player: number; attacker: string }
  /** src: "hero", "identity" or "<card uid>#<ability index>". */
  | { r: "abilityPay"; player: number; src: string }
  | { r: "villainStep" };

export interface EffectCtx {
  attacker?: string;
  preventPool?: { amount: number };
  /** Resources paid for the card or ability, by type. */
  paid?: Partial<Record<ResType, number>>;
  /** The enemy the last damage effect hit; whether that defeated it. */
  lastTarget?: string;
  killed?: boolean;
  /** The card acting (an ally or a card in play) and the name to show for combos. */
  source?: string;
  sourceName?: string;
}

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
  villain: { stage: number; damage: number; stunned: boolean; confused?: boolean; tough?: boolean; attachments: string[] };
  plans: PlanState[];
  encounterDeck: string[];
  encounterDiscard: string[];
  /** Villain phase progress: the queue of steps still to run. */
  villainQueue: VillainStep[];
  prompt: Prompt | null;
  log: { round: number; text: string }[];
  /** Main plan stage (index into mainPlan + nextPlans). */
  mainStage?: number;
  /** The last villain phase, step by step (for the paced breakdown). */
  phaseReport?: ReportEntry[];
  reportRound?: number;
  /** Set when hidden cards were seen (draws, shuffles, deck reveals): the interface drops its undo. */
  revealed?: boolean;
  /** The last card-combo that read discarded cards (for the on-screen summary). */
  combo?: { n: number; title: string; cards: string[]; text: string };
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

/** One step of the villain phase: what happened and the cards involved (boosts, encounter cards). */
export interface ReportEntry { n: number; step: 1 | 2 | 3; title: string; lines: string[]; cards: string[] }
