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
  | "chooseAlly" // one of your allies
  | "choosePlayer" // a player (their hero and allies); automatic when playing solo
  | "chooseOtherPlan" // a plan other than the one the previous thwart hit
  | "chooseHandCard" // a card in your hand
  | "bestPlan"; // picked for you: a side plan this clears, else the main plan, else the fullest side plan

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
      /** The damage equals this stat of your hero (plus amount). */
      fromStat?: "fuerza";
      /** Never more than this. */
      max?: number;
      /** +amount if every resource paid was of this type (Comodín counts). */
      onlyPaidBonus?: { res: ResType; amount: number };
    }
  | {
      do: "thwart"; target: Target; amount: number;
      paidBonus?: { res: ResType; amount: number };
      /** With this trait in play: remove the threat from every plan instead of one. */
      allIfTrait?: string;
      /** +amount if you defeated an enemy this turn. */
      bonusIfDefeated?: number;
      onlyPaidBonus?: { res: ResType; amount: number };
      /** The threat removed goes onto the acting card as counters. */
      toSource?: boolean;
    }
  | { do: "addThreat"; target: Target; amount: number }
  | { do: "heal"; target: Target; amount: number }
  | { do: "draw"; amount: number; ifPaid?: ResType; each?: boolean; target?: Target; ifOnlyPaid?: ResType } // ifPaid: only if paid with that type; each: every player draws
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
  | { do: "mill"; amount: number; damagePer?: { res: ResType; amount: number; exact?: boolean }; branches?: Partial<Record<Exclude<ResType, "comodin">, Effect[]>> }
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
  | { do: "discardUpgrade" } // discard one of your upgrades (the most expensive)
  /** Discard the top cards of your deck; those with exactly this printed resource go to your hand. */
  | { do: "millTake"; amount: number; res: ResType }
  /** Until the end of the phase: +stats to an ally ("thisCard") or to a player's hero and allies ("choosePlayer"). */
  | { do: "tempBuff"; target: Target; fuerza?: number; ingenio?: number; choose?: boolean }
  | { do: "readyAlly"; target: Target }
  /** Pay the printed cost of an ally in any player's discard (paid for you) to put it into play under your control. */
  | { do: "reviveAlly" }
  /** The next card that player plays this phase costs this much less. */
  | { do: "discount"; target: Target; amount: number; allyTrait?: string }
  /** This upgrade attaches to the chosen ally, minion or enemy (max one copy per card). */
  | { do: "attachSelf"; target: Target }
  /** Remove a counter from the acting card; with none left it is discarded. */
  | { do: "spendCounter" }
  /** The hero has this trait until the end of the phase. */
  | { do: "gainTrait"; trait: string }
  /** The chosen player takes the topmost upgrade with this trait from their discard back to their hand. */
  | { do: "recoverTrait"; trait: string; target: Target }
  /** Only if your hero has this trait (Aéreo from cards in play, or printed). */
  | { do: "ifHeroTrait"; trait: string; effects: Effect[] }
  /** Only in this form. */
  | { do: "ifForm"; form: "heroe" | "identidad"; effects: Effect[] }
  /** Only if the previous thwart removed the last threat from its plan. */
  | { do: "ifCleared"; effects: Effect[] }
  /** Look at the top cards of the encounter deck: remove 1 threat from a plan per treachery among them. */
  | { do: "scoutEncounter"; amount: number }
  /** Ready every character with this trait you control; every one in play gets +1 Fuerza and +1 Ingenio this phase. */
  | { do: "rally"; trait: string }
  /** Exhaust any of your ready allies: draw 1 card per ally exhausted. */
  | { do: "exhaustAlliesDraw" }
  /** Your next basic attack this turn gets +amount (and overkill if paid only with that type). */
  | { do: "nextAttackBonus"; amount: number; overkillIfOnly?: ResType }
  /** Move damage from your hero to an enemy. */
  | { do: "moveDamage"; target: Target; amount: number }
  /** Search your deck (and discard) for a card of this type/trait and add it to your hand; shuffle. */
  | { do: "tutor"; trait?: string; type?: PlayerCardType; discard?: boolean }
  /** Put a card of your choice from your discard back into your deck (or stop); shuffle. */
  | { do: "recycle" }
  /** Discard a card of your choice from your hand. */
  | { do: "discardFromHand"; target: Target }
  /** Put into play from your hand an ally with this trait whose cost is at most this card's counters; then discard this card. */
  | { do: "quinjet"; trait: string }
  // Campaign villains
  | { do: "ifTrait"; trait: string; effects: Effect[]; else?: Effect[] } // only if the villain has this trait (from the environment)
  | { do: "armWeapon" } // the top card of the weapons deck attaches to the villain; if it is empty, surge
  | { do: "nextSidePlan"; ifFewer?: number } // the top card of the side-plan deck comes into play (only if fewer than ifFewer side plans)
  | { do: "spawnTrait"; trait: string } // discard encounter cards until a minion with this trait appears; it engages you
  | { do: "spawn"; card: string } // a set-aside card comes into play (a minion engages you; a plan enters play)
  | { do: "planCounter"; amount: number } // counters on the main plan (Retraso, Pruebas…)
  | { do: "healVillain"; amount: number }
  | { do: "newEnvironment" } // the villain absorbs a different environment (searched from the encounter deck, then the discard)
  | { do: "minionsActivate" }; // every minion engaged with you activates again

/** Combat keywords. Perforante: removes Duro before damage. Arrollador: damage beyond a blocking
 *  ally's life goes to the hero. A distancia: Represalia doesn't hit it. */
export type Keyword = "perforante" | "arrollador" | "distancia";

/** When a card's ability can be used. */
export type Timing =
  | "action" // on your turn
  | "defend" // interrupt: while an enemy attacks you, before damage
  | "afterAttack" // response: after an enemy attacked you
  | "afterUpgrade" // response: after you play an upgrade
  | "villainAttack" // response: after the villain starts an attack against you
  | "treachery" // interrupt: when a treachery is revealed against you, cancel its effects
  | "encounter" // interrupt (cards in play): when an encounter card is revealed against you, cancel it and reveal another
  | "special" // only through an event that fires every such card ("¡Por Oricalcia!")
  | "boost"; // interrupt: when the villain's boost cards are flipped for an attack against you, cancel their icons

export interface Ability {
  timing: Timing; cost?: "exhaust" | "once"; effects: Effect[]; text: string; heroOnly?: boolean;
  /** Using it asks you to discard a card with this resource (Comodín counts; "any": any card) to pay. */
  payFor?: ResType | "any";
  /** "special" abilities: the bonus when resolved as the last step (added to the first amount, or to every amount). */
  lastBonus?: number;
  lastBonusAll?: boolean;
  /** Without such a card you can't use it. */
  payRequired?: boolean;
  /** Only in identity form. */
  identityOnly?: boolean;
}

// MARK: Cards

export type PlayerCardType = "aliado" | "mejora" | "apoyo" | "evento" | "recurso";
export type EncounterCardType = "esbirro" | "traicion" | "plan" | "vinculo" | "obligacion" | "entorno";

export interface Stats { fuerza?: number; ingenio?: number; aguante?: number }

/** Where a card belongs: a hero's signature cards, an aspect, the basic pool or the campaign. */
export type Aspect = "heroe" | "agresion" | "justicia" | "proteccion" | "liderazgo" | "basica" | "campana";

export interface PlayerCardDef {
  id: string;
  name: string;
  aspect?: Aspect;
  /** Signature cards: the hero they belong to (set by content.ts). */
  owner?: string;
  /** Can only be played in hero form. */
  heroOnly?: boolean;
  /** Can only be played in identity form. */
  identityOnly?: boolean;
  /** At most this many copies in play per player. */
  maxInPlay?: number;
  /** Once per round (per player). */
  oncePerRound?: boolean;
  /** Can only be played if your hero has this trait. */
  heroTraitRequired?: string;
  /** Can only be played if you control a character (hero or ally) with this trait. */
  requiresCharTrait?: string;
  /** Only resources of this type (Comodín counts) can pay for it. */
  payOnly?: ResType;
  /** Resource cards: can only be spent in hero form. */
  heroFormOnly?: boolean;
  /** Upgrades: discarded when you change form. */
  discardOnFlip?: boolean;
  /** Extra bonus while your hero has this trait (Aéreo). */
  bonusIfTrait?: { trait: string; bonus: Stats };
  /** Supports: you can control this many more allies (allyLimitIfAll: only if all your allies have that trait). */
  allyLimit?: number;
  allyLimitIfAll?: string;
  /** Attached to an ally: traits it gains. */
  attachGrants?: string[];
  /** In play: after a side plan is cleared, exhaust this card for these effects (hero form). */
  onSidePlanCleared?: Effect[];
  /** In play: when threat would be placed on the main plan, discard this card to prevent this much of it. */
  guardMainPlan?: number;
  /** In play: when a surge would resolve, discard this card for these effects. */
  onSurge?: Effect[];
  /** Attached to the main plan: its threat limit grows by this much. */
  planLimitBonus?: number;
  /** Gains a counter at the start of each of your turns. */
  turnStartCounter?: boolean;
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
    /** After a minion enters play: spend one of its counters to run these (lastTarget is the minion). */
    onMinionEnters?: Effect[];
    /** To attack, you must also discard a card from your hand. */
    attackDiscard?: boolean;
  };
  /** Upgrades attached to an ally: bonus to that ally. */
  attachBonus?: { fuerza?: number; ingenio?: number; vida?: number };
  /** Attached to an enemy: when it would attack, discard this instead and stun the enemy. */
  snare?: boolean;
  /** Attached to a minion: when it is defeated (the card goes back to your discard). */
  onHostDefeated?: Effect[];
  /** Allies: discarded at the end of the round. */
  temporary?: boolean;
  /** Resource cards: worth double when paying for a card with this trait. */
  doubleFor?: string;
  /** Upgrades: stat bonus to the hero. */
  bonus?: Stats & { vidaMax?: number; mano?: number; recuperacion?: number };
  /** Traits other cards can count (e.g. "pieza" for armour pieces). */
  traits?: string[];
  /** Events: what they do when played, and when they can be played. */
  play?: { timing: Timing; effects: Effect[]; heroOnly?: boolean };
  /** Supports/upgrades with an ability (a second one in `abilities`). */
  ability?: Ability;
  abilities?: Ability[];
  /** Exhaust it while paying for a card: it gives this resource. */
  /** fromDiscardTop: it gives the printed resources of the top card of your discard instead. */
  resourceAbility?: { res: ResType; amount: number; heroOnly?: boolean; identityOnly?: boolean; fromDiscardTop?: boolean };
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
  minion?: { vida: number; fuerza: number; plan: number; guardia?: boolean; retaliate?: number; keywords?: Keyword[] };
  sidePlan?: {
    amenaza: number; aceleracion?: boolean;
    /** Crisis: you can't remove threat from the main plan while it's in play. */
    crisis?: boolean;
    /** Peligro: one more encounter card is dealt each villain phase while it's in play. */
    peligro?: boolean;
    /** Gains this much threat at the start of each villain phase. */
    grows?: number;
    /** When its threat reaches this (× players), it is discarded and `onComplete` happens. */
    completeAt?: number;
    onComplete?: Effect[];
  };
  /** Traits other cards look for ("legion", "mutante", "arma"). */
  traits?: string[];
  /** Attachments: combat keywords they give the villain. */
  keywords?: Keyword[];
  /** Attachments: instead of exhausting your hero, pay this many resources of this type to discard it. */
  removal?: { cost: number; res: ResType };
  /** Environments: the villain absorbs its material (one environment at a time). */
  environment?: { trait: string; fuerza?: number; plan?: number; keywords?: Keyword[]; afterAttack?: Effect[]; afterScheme?: Effect[] };
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
  /** The hero's traits ("guardia": Guardia de Aurelia, "espia"…). */
  heroTraits?: string[];
  /** Setup: choose a card of this type/trait from your deck for your starting hand. */
  setupTutor?: { trait?: string; type?: PlayerCardType };
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
  /** Reflejos: when a player turns into their hero, they take this much damage. */
  flipPunish?: number;
  keywords?: Keyword[];
  /** When revealed: these effects too (against the first player). */
  revealEffects?: Effect[];
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
  /** Separate decks (shuffled at setup): "armas" for armWeapon, "planes" for nextSidePlan. */
  sideDecks?: Record<string, string[]>;
  /** Cards set aside until a "spawn" effect brings them in. */
  setAside?: string[];
  /** Setup effects (against the first player), after side plans. */
  setup?: Effect[];
  /** Counters on the main plan: `perRound` at the end of each villain phase; at `threshold` they reset and `effects` happen. */
  counters?: { name: string; perRound: number; threshold: number; effects: Effect[]; text: string };
  /** At the start of each villain phase (against the first player). */
  phaseStart?: Effect[];
  /** Allies (player cards) held captive under this side plan; clearing it rescues them. */
  captives?: { plan: string; allies: string[] };
  /** Campaign this scenario belongs to (for the home screen). */
  pack?: string;
}

/** Campaign changes applied when a scenario is set up. */
export interface SetupOptions {
  /** Extra player cards shuffled into each hero's deck (by hero id). */
  extraCards?: Record<string, string[]>;
  /** Damage each hero starts with (by hero id). */
  startDamage?: Record<string, number>;
  /** Extra encounter cards shuffled into the encounter deck. */
  extraEncounter?: string[];
  /** Extra threat on the main plan, per player. */
  startThreat?: number;
  campaign?: { id: string; step: number };
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
  /** Bonuses until the end of the phase. */
  temp?: { fuerza?: number; ingenio?: number };
  /** Upgrades attached to this ally (uids). */
  attached?: string[];
}
/** A player card attached to an enemy, and who owns it. */
export interface PlayerAttachment { uid: string; owner: number }

/** A minion. A Drone is a player card (its uid) played face down with the "dron" definition. */
export interface MinionState extends Statuses { uid: string; def: string; damage: number; drone?: boolean; attached?: PlayerAttachment[] }

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
  /** Hero bonuses until the end of the phase. */
  temp?: { fuerza?: number; ingenio?: number };
  /** The next card played this phase costs this much less. */
  discount?: number;
  /** Traits the hero has until the end of the phase (Aéreo from the boots…). */
  tempTraits?: string[];
  /** The next ally with this trait played this phase costs this much less. */
  allyDiscount?: { trait: string; amount: number };
  /** The next basic attack this turn: extra Fuerza, and overkill. */
  nextAttack?: { bonus: number; overkill: boolean };
  /** Once-per-round cards already played this round (definition ids). */
  roundUsed?: string[];
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
  | { r: "interrupts"; player: number; attacker: string; amount: number; defender: string | null; prevented: number; oneShots?: string[]; used?: string[] }
  | { r: "afterAttack"; player: number; attacker: string }
  /** src: "hero", "identity" or "<card uid>#<ability index>". */
  | { r: "abilityPay"; player: number; src: string }
  /** An encounter card was revealed against this player: cancel it (a card in hand or in play), or let it resolve. */
  | { r: "encounter"; player: number; card: string }
  /** Boost cards were flipped for the villain's attack: cancel their icons, or let the attack go on. */
  | { r: "boost"; player: number; base: number; boost: number }
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
  /** A basic attack: "hero" or the attacking ally's uid (minions with Represalia hit back). */
  basic?: string;
  /** Enemies already hit by this card, the plan the last thwart hit and whether it was cleared. */
  hit?: string[];
  lastPlan?: string;
  cleared?: boolean;
  stopRecycle?: boolean;
  /** Overkill for this damage (a basic attack with "¡Mole aplasta!"). */
  overkill?: boolean;
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
  villain: { stage: number; damage: number; stunned: boolean; confused?: boolean; tough?: boolean; attachments: string[]; playerAttached?: PlayerAttachment[] };
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
  /** Player upgrades attached to the main plan. */
  planAttached?: PlayerAttachment[];
  /** The last card-combo that read discarded cards (for the on-screen summary). */
  combo?: { n: number; title: string; cards: string[]; text: string };
  result?: "victoria" | "derrota";
  resultText?: string;
  nextUid: number;
  /** Side decks (weapons, side plans) and set-aside cards, as uids. */
  sideDecks?: Record<string, string[]>;
  setAside?: string[];
  /** The environment in play (its uid) and the main plan counters. */
  environment?: string;
  planCounters?: number;
  /** Captured allies (uids) under their side plan, and allies rescued this game (uid → player). */
  captives?: { plan: string; cards: string[] };
  rescued?: { uid: string; player: number }[];
  campaign?: { id: string; step: number };
}

export type VillainStep =
  | { s: "accelerate" }
  | { s: "villainActivates"; player: number }
  | { s: "minionsActivate"; player: number }
  | { s: "deal" }
  | { s: "reveal"; player: number; card: string }
  | { s: "counters" }
  | { s: "endRound" };

/** One step of the villain phase: what happened and the cards involved (boosts, encounter cards). */
export interface ReportEntry { n: number; step: 1 | 2 | 3; title: string; lines: string[]; cards: string[] }
