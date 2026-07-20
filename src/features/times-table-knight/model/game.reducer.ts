import type {
  ArmorTier,
  EncounterKind,
  GameConfig,
  LeitnerEntry,
  Problem,
  SessionState,
  WeaponTier,
} from "./game.types";
import { ARMORS, DEFAULT_CONFIG, HEARTS_START, MAX_LEVEL, MAX_TIER, COINS_PER_CORRECT, COINS_PER_CREATURE, SCORE_COIN } from "./game.constants";
import { accuracyPct, scoreForCorrect, scoreForCreatureSlain, starsForClearedStage } from "../lib/scoring";
import { demote, promote } from "../lib/leitner";
import type { HitCause } from "../game/events";

// ---------------------------------------------------------------------------
// The session state machine (§10). Deliberately clock-free: a session ends
// ONLY via BOSS_DEFEATED or depleted hearts — never by any timer.
//
// Two-axis consequence model (§1/§5): reflex damage (KNIGHT_HIT) may touch
// hearts but never equipment tiers; a wrong ANSWER may touch equipment
// (Adventure) or hearts (Practice, where nothing else can) but the axes
// never cross inside one mode.
// ---------------------------------------------------------------------------

export type GameAction =
  | { type: "START"; config: GameConfig; troublePool: LeitnerEntry[]; leitnerClock: number }
  | { type: "ENCOUNTER_TRIGGERED"; kind: EncounterKind; stationId: number; problems: Problem[] }
  | { type: "ANSWER"; value: number }
  | { type: "ENCOUNTER_ADVANCED" }
  | { type: "KNIGHT_HIT"; cause: HitCause }
  | { type: "CHECKPOINT_REACHED" }
  | { type: "CREATURE_SLAIN" }
  | { type: "COIN_COLLECTED"; value: number }
  | { type: "BOSS_REACHED"; bossMaxHp: number }
  | { type: "BOSS_DAMAGED"; damage: number }
  | { type: "BOSS_DEFEATED" }
  | { type: "STAGE_RETRY" }
  | { type: "RESET" };

export const initialGameState: SessionState = {
  phase: "setup",
  config: DEFAULT_CONFIG,
  hearts: HEARTS_START,
  score: 0,
  coins: 0,
  streak: 0,
  bestStreak: 0,
  weapon: 0,
  armor: 0,
  armorAbsorbLeft: 0,
  answered: 0,
  correct: 0,
  troublePool: [],
  leitnerClock: 0,
  factLog: [],
  encounter: null,
  returnPhase: "playing",
  bossHp: 0,
  bossMaxHp: 0,
  questionStopsCleared: 0,
  endReason: null,
  stars: 0,
  gameCompleted: false,
};

function raiseWeapon(w: WeaponTier): WeaponTier {
  return Math.min(MAX_TIER, w + 1) as WeaponTier;
}

function lowerWeapon(w: WeaponTier): WeaponTier {
  return Math.max(0, w - 1) as WeaponTier;
}

function raiseArmor(a: ArmorTier): ArmorTier {
  return Math.min(MAX_TIER, a + 1) as ArmorTier;
}

function lowerArmor(a: ArmorTier): ArmorTier {
  return Math.max(0, a - 1) as ArmorTier;
}

function absorbsOf(a: ArmorTier): number {
  return ARMORS[a].absorbs;
}

/** apply a volley answer to the equipment ladders — Adventure kinds only */
function applyEquipmentOutcome(state: SessionState, kind: EncounterKind, isCorrect: boolean): Partial<SessionState> {
  switch (kind) {
    case "forge-anvil":
      return { weapon: isCorrect ? raiseWeapon(state.weapon) : lowerWeapon(state.weapon) };
    case "armor-scroll": {
      const armor = isCorrect ? raiseArmor(state.armor) : lowerArmor(state.armor);
      return {
        armor,
        armorAbsorbLeft: isCorrect ? absorbsOf(armor) : Math.min(state.armorAbsorbLeft, absorbsOf(armor)),
      };
    }
    case "boss-scroll": {
      // upgrade/recharge on the spot (§5): prefer the weapon ladder, always
      // refill absorption on success; a miss dulls the stronger ladder first
      if (isCorrect) {
        if (state.weapon < MAX_TIER) return { weapon: raiseWeapon(state.weapon), armorAbsorbLeft: absorbsOf(state.armor) };
        const armor = raiseArmor(state.armor);
        return { armor, armorAbsorbLeft: absorbsOf(armor) };
      }
      if (state.weapon > 0) return { weapon: lowerWeapon(state.weapon) };
      const armor = lowerArmor(state.armor);
      return { armor, armorAbsorbLeft: Math.min(state.armorAbsorbLeft, absorbsOf(armor)) };
    }
    default:
      return {};
  }
}

export function gameReducer(state: SessionState, action: GameAction): SessionState {
  switch (action.type) {
    case "START": {
      return {
        ...initialGameState,
        phase: "playing",
        config: action.config,
        troublePool: action.troublePool,
        leitnerClock: action.leitnerClock,
      };
    }

    case "ENCOUNTER_TRIGGERED": {
      if (state.phase !== "playing" && state.phase !== "boss") return state;
      return {
        ...state,
        phase: "encounter",
        returnPhase: state.phase,
        encounter: {
          kind: action.kind,
          stationId: action.stationId,
          problems: action.problems,
          index: 0,
          results: action.problems.map(() => null),
        },
      };
    }

    case "ANSWER": {
      const enc = state.encounter;
      if (state.phase !== "encounter" || !enc || enc.results[enc.index] !== null) return state;

      const problem = enc.problems[enc.index];
      const isCorrect = action.value === problem.answer;
      const clock = state.leitnerClock + 1;
      const streak = isCorrect ? state.streak + 1 : 0;

      let next: SessionState = {
        ...state,
        encounter: {
          ...enc,
          results: enc.results.map((r, i) => (i === enc.index ? isCorrect : r)),
        },
        answered: state.answered + 1,
        correct: state.correct + (isCorrect ? 1 : 0),
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
        leitnerClock: clock,
        factLog: [...state.factLog, { fact: problem.fact, correct: isCorrect }],
        troublePool: isCorrect
          ? promote(state.troublePool, problem.fact, clock)
          : demote(state.troublePool, problem.fact, clock),
        score: isCorrect ? state.score + scoreForCorrect(streak) : state.score,
        coins: isCorrect ? state.coins + COINS_PER_CORRECT : state.coins,
      };

      if (enc.kind === "practice-creature" || enc.kind === "practice-boss") {
        // Practice axis: a wrong answer is the only thing that can cost a heart
        if (!isCorrect) next = { ...next, hearts: Math.max(0, next.hearts - 1) };
        // the calm mini-boss volley: every correct answer lands one hit
        if (enc.kind === "practice-boss" && isCorrect) {
          next = { ...next, bossHp: Math.max(0, next.bossHp - 1) };
        }
      } else {
        // Adventure axis: math outcomes move equipment tiers, never hearts
        next = { ...next, ...applyEquipmentOutcome(state, enc.kind, isCorrect) };
      }

      return next;
    }

    case "ENCOUNTER_ADVANCED": {
      const enc = state.encounter;
      if (state.phase !== "encounter" || !enc || enc.results[enc.index] === null) return state;

      // Practice ran out of hearts mid-volley (after corrective feedback)
      if (state.hearts <= 0) {
        return { ...state, phase: "results", encounter: null, endReason: "hearts-depleted" };
      }

      if (enc.index + 1 < enc.problems.length) {
        return { ...state, encounter: { ...enc, index: enc.index + 1 } };
      }

      return {
        ...state,
        phase: state.returnPhase,
        encounter: null,
        questionStopsCleared: state.questionStopsCleared + 1,
      };
    }

    case "KNIGHT_HIT": {
      // the world is frozen during a question — reflex damage cannot exist there
      if (state.phase !== "playing" && state.phase !== "boss") return state;
      if (state.config.mode !== "adventure") return state;

      if (state.armorAbsorbLeft > 0) {
        return { ...state, armorAbsorbLeft: state.armorAbsorbLeft - 1 };
      }
      const hearts = Math.max(0, state.hearts - 1);
      if (hearts === 0) {
        return { ...state, hearts, phase: "results", encounter: null, endReason: "hearts-depleted" };
      }
      return { ...state, hearts };
    }

    case "CHECKPOINT_REACHED": {
      if (state.phase !== "playing") return state;
      return { ...state, armorAbsorbLeft: absorbsOf(state.armor) };
    }

    case "CREATURE_SLAIN": {
      if (state.phase !== "playing" && state.phase !== "boss") return state;
      return {
        ...state,
        score: state.score + scoreForCreatureSlain(state.streak),
        coins: state.coins + COINS_PER_CREATURE,
      };
    }

    case "COIN_COLLECTED": {
      return { ...state, coins: state.coins + action.value, score: state.score + SCORE_COIN };
    }

    case "BOSS_REACHED": {
      if (state.phase !== "playing") return state;
      return {
        ...state,
        phase: "boss",
        bossMaxHp: action.bossMaxHp,
        bossHp: action.bossMaxHp,
        // the boss gate refills armor absorption (§5)
        armorAbsorbLeft: absorbsOf(state.armor),
      };
    }

    case "BOSS_DAMAGED": {
      if (state.phase !== "boss") return state;
      return { ...state, bossHp: Math.max(0, state.bossHp - action.damage) };
    }

    case "BOSS_DEFEATED": {
      if (state.phase !== "boss" || state.bossHp > 0) return state;
      const accuracy = accuracyPct(state.correct, state.answered);
      return {
        ...state,
        phase: "results",
        encounter: null,
        endReason: "boss-defeated",
        stars: starsForClearedStage(accuracy, state.hearts),
        gameCompleted: state.config.mode === "adventure" && state.config.level === MAX_LEVEL,
      };
    }

    case "STAGE_RETRY": {
      if (state.phase !== "results" || state.endReason !== "hearts-depleted") return state;
      // friendly retry: hearts refill, equipment resets to base — but what the
      // child has learned (trouble pool, Leitner clock) is never rolled back
      return {
        ...initialGameState,
        phase: "playing",
        config: state.config,
        troublePool: state.troublePool,
        leitnerClock: state.leitnerClock,
      };
    }

    case "RESET": {
      return {
        ...initialGameState,
        phase: "setup",
        config: state.config,
        troublePool: state.troublePool,
        leitnerClock: state.leitnerClock,
      };
    }

    default:
      return state;
  }
}
