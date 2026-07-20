import { describe, it, expect } from "vitest";
import { gameReducer, initialGameState, type GameAction } from "../model/game.reducer";
import { DEFAULT_CONFIG, HEARTS_START, MAX_LEVEL } from "../model/game.constants";
import type { EncounterKind, GameConfig, Problem, SessionState } from "../model/game.types";

function problem(a: number, b: number): Problem {
  return { fact: { a, b }, answer: a * b, options: [a * b, a * b + 1, a * b + 2, a + b] };
}

const P = problem(7, 8);

function start(config: Partial<GameConfig> = {}): SessionState {
  return gameReducer(initialGameState, {
    type: "START",
    config: { ...DEFAULT_CONFIG, mode: "adventure", level: 4, ...config },
    troublePool: [],
    leitnerClock: 0,
  });
}

function run(state: SessionState, ...actions: GameAction[]): SessionState {
  return actions.reduce(gameReducer, state);
}

function trigger(state: SessionState, kind: EncounterKind, problems: Problem[] = [P]): SessionState {
  return gameReducer(state, { type: "ENCOUNTER_TRIGGERED", kind, stationId: 1, problems });
}

describe("session lifecycle", () => {
  it("START seeds a playing session with full hearts and base equipment", () => {
    const s = start();
    expect(s.phase).toBe("playing");
    expect(s.hearts).toBe(HEARTS_START);
    expect(s.weapon).toBe(0);
    expect(s.armor).toBe(0);
    expect(s.encounter).toBeNull();
  });

  it("has no clock: nothing but boss defeat or empty hearts ends a session", () => {
    let s = start();
    for (let i = 0; i < 500; i++) {
      s = run(s, { type: "COIN_COLLECTED", value: 1 }, { type: "CREATURE_SLAIN" });
    }
    expect(s.phase).toBe("playing");
  });

  it("an encounter freezes into phase encounter and returns to the prior phase", () => {
    let s = trigger(start(), "forge-anvil");
    expect(s.phase).toBe("encounter");
    expect(s.returnPhase).toBe("playing");
    s = run(s, { type: "ANSWER", value: P.answer }, { type: "ENCOUNTER_ADVANCED" });
    expect(s.phase).toBe("playing");
    expect(s.questionStopsCleared).toBe(1);
  });

  it("multi-problem volleys advance through every problem", () => {
    let s = trigger(start(), "forge-anvil", [problem(3, 4), problem(3, 5)]);
    s = run(s, { type: "ANSWER", value: 12 }, { type: "ENCOUNTER_ADVANCED" });
    expect(s.phase).toBe("encounter");
    expect(s.encounter?.index).toBe(1);
    s = run(s, { type: "ANSWER", value: 15 }, { type: "ENCOUNTER_ADVANCED" });
    expect(s.phase).toBe("playing");
    expect(s.answered).toBe(2);
    expect(s.correct).toBe(2);
  });

  it("ignores a second ANSWER for the same problem", () => {
    let s = trigger(start(), "forge-anvil");
    s = gameReducer(s, { type: "ANSWER", value: P.answer });
    const again = gameReducer(s, { type: "ANSWER", value: 0 });
    expect(again).toBe(s);
  });
});

describe("two-axis invariant: math never touches hearts (Adventure)", () => {
  it.each<EncounterKind>(["forge-anvil", "armor-scroll", "boss-scroll"])(
    "a wrong answer at %s lowers a tier but NEVER hearts",
    (kind) => {
      let s = start();
      // give both ladders a tier so the drop is observable
      s = { ...s, weapon: 2, armor: 2, armorAbsorbLeft: 2 };
      if (kind === "boss-scroll") s = run(s, { type: "BOSS_REACHED", bossMaxHp: 6 });
      s = trigger(s, kind);
      s = run(s, { type: "ANSWER", value: P.answer + 1 });
      expect(s.hearts).toBe(HEARTS_START);
      expect(s.weapon + s.armor).toBe(3); // exactly one tier lost
    }
  );

  it("wrong answers can never end an Adventure session", () => {
    let s = start();
    for (let i = 0; i < 20; i++) {
      s = trigger(s, "forge-anvil");
      s = run(s, { type: "ANSWER", value: 1 }, { type: "ENCOUNTER_ADVANCED" });
    }
    expect(s.phase).toBe("playing");
    expect(s.hearts).toBe(HEARTS_START);
    expect(s.weapon).toBe(0); // floored, never negative
  });

  it("forge success raises the weapon to the cap", () => {
    let s = start();
    for (let i = 0; i < 5; i++) {
      s = trigger(s, "forge-anvil");
      s = run(s, { type: "ANSWER", value: P.answer }, { type: "ENCOUNTER_ADVANCED" });
    }
    expect(s.weapon).toBe(3);
    expect(s.armor).toBe(0);
  });

  it("armor scroll success raises armor and refills absorption", () => {
    let s = trigger(start(), "armor-scroll");
    s = run(s, { type: "ANSWER", value: P.answer }, { type: "ENCOUNTER_ADVANCED" });
    expect(s.armor).toBe(1);
    expect(s.armorAbsorbLeft).toBe(1);
  });

  it("boss scroll success upgrades and recharges absorption on the spot", () => {
    let s = start();
    s = { ...s, armor: 2, armorAbsorbLeft: 0 };
    s = run(s, { type: "BOSS_REACHED", bossMaxHp: 6 });
    s = trigger(s, "boss-scroll");
    s = run(s, { type: "ANSWER", value: P.answer }, { type: "ENCOUNTER_ADVANCED" });
    expect(s.weapon).toBe(1);
    expect(s.armorAbsorbLeft).toBe(2);
    expect(s.phase).toBe("boss");
  });
});

describe("two-axis invariant: reflexes never touch math or equipment", () => {
  it("KNIGHT_HIT consumes armor absorption first, then hearts — tiers stay", () => {
    let s = start();
    s = { ...s, weapon: 2, armor: 1, armorAbsorbLeft: 1, streak: 5 };
    s = gameReducer(s, { type: "KNIGHT_HIT", cause: "contact" });
    expect(s.armorAbsorbLeft).toBe(0);
    expect(s.hearts).toBe(HEARTS_START);
    s = gameReducer(s, { type: "KNIGHT_HIT", cause: "pit" });
    expect(s.hearts).toBe(HEARTS_START - 1);
    // equipment tiers and the math streak are untouchable by reflex damage
    expect(s.weapon).toBe(2);
    expect(s.armor).toBe(1);
    expect(s.streak).toBe(5);
  });

  it("reflex damage is impossible while the world is frozen on a question", () => {
    const s = trigger(start(), "forge-anvil");
    expect(gameReducer(s, { type: "KNIGHT_HIT", cause: "contact" })).toBe(s);
  });

  it("reflex damage does not exist in Practice", () => {
    const s = start({ mode: "practice" });
    expect(gameReducer(s, { type: "KNIGHT_HIT", cause: "contact" })).toBe(s);
  });

  it("0 hearts by reflex damage ends the stage with a friendly retry", () => {
    let s = start();
    for (let i = 0; i < HEARTS_START; i++) s = gameReducer(s, { type: "KNIGHT_HIT", cause: "contact" });
    expect(s.phase).toBe("results");
    expect(s.endReason).toBe("hearts-depleted");

    const retried = gameReducer(s, { type: "STAGE_RETRY" });
    expect(retried.phase).toBe("playing");
    expect(retried.hearts).toBe(HEARTS_START);
    expect(retried.weapon).toBe(0); // equipment resets to base on stage retry
  });
});

describe("Practice axis: wrong answers cost hearts, equipment does not exist", () => {
  it("a wrong Practice answer costs a heart and leaves equipment at base", () => {
    let s = trigger(start({ mode: "practice" }), "practice-creature");
    s = gameReducer(s, { type: "ANSWER", value: 1 });
    expect(s.hearts).toBe(HEARTS_START - 1);
    expect(s.weapon).toBe(0);
    expect(s.armor).toBe(0);
  });

  it("hearts reaching 0 ends the run only AFTER the corrective feedback", () => {
    let s = start({ mode: "practice" });
    s = { ...s, hearts: 1 };
    s = trigger(s, "practice-creature");
    s = gameReducer(s, { type: "ANSWER", value: 1 });
    expect(s.phase).toBe("encounter"); // the child still sees the right answer
    s = gameReducer(s, { type: "ENCOUNTER_ADVANCED" });
    expect(s.phase).toBe("results");
    expect(s.endReason).toBe("hearts-depleted");
  });

  it("each correct practice-boss answer lands one hit", () => {
    let s = start({ mode: "practice" });
    s = run(s, { type: "BOSS_REACHED", bossMaxHp: 3 });
    s = trigger(s, "practice-boss");
    s = run(s, { type: "ANSWER", value: P.answer }, { type: "ENCOUNTER_ADVANCED" });
    expect(s.bossHp).toBe(2);
    expect(s.phase).toBe("boss");
  });
});

describe("boss flow, stars, completion", () => {
  it("BOSS_REACHED locks in the fight and refills absorption at the gate", () => {
    let s = start();
    s = { ...s, armor: 2, armorAbsorbLeft: 0 };
    s = gameReducer(s, { type: "BOSS_REACHED", bossMaxHp: 6 });
    expect(s.phase).toBe("boss");
    expect(s.bossHp).toBe(6);
    expect(s.armorAbsorbLeft).toBe(2);
  });

  it("BOSS_DEFEATED requires an empty boss HP bar", () => {
    let s = run(start(), { type: "BOSS_REACHED", bossMaxHp: 6 });
    expect(gameReducer(s, { type: "BOSS_DEFEATED" })).toBe(s);
    s = run(s, { type: "BOSS_DAMAGED", damage: 6 }, { type: "BOSS_DEFEATED" });
    expect(s.phase).toBe("results");
    expect(s.endReason).toBe("boss-defeated");
  });

  it("stars follow accuracy and remaining hearts", () => {
    let s = run(start(), { type: "BOSS_REACHED", bossMaxHp: 1 });
    // 100% accuracy across one volley, full hearts → 3 stars
    s = trigger(s, "boss-scroll");
    s = run(
      s,
      { type: "ANSWER", value: P.answer },
      { type: "ENCOUNTER_ADVANCED" },
      { type: "BOSS_DAMAGED", damage: 1 },
      { type: "BOSS_DEFEATED" }
    );
    expect(s.stars).toBe(3);
  });

  it("beating the Level 15 Adventure boss completes the game", () => {
    let s = start({ level: MAX_LEVEL });
    s = run(s, { type: "BOSS_REACHED", bossMaxHp: 1 }, { type: "BOSS_DAMAGED", damage: 1 }, { type: "BOSS_DEFEATED" });
    expect(s.gameCompleted).toBe(true);
  });
});

describe("learning state", () => {
  it("a missed fact enters the trouble pool; a correct one promotes it out over time", () => {
    let s = trigger(start(), "forge-anvil");
    s = run(s, { type: "ANSWER", value: 1 }, { type: "ENCOUNTER_ADVANCED" });
    expect(s.troublePool).toHaveLength(1);
    expect(s.troublePool[0].box).toBe(0);

    s = trigger(s, "forge-anvil");
    s = run(s, { type: "ANSWER", value: P.answer }, { type: "ENCOUNTER_ADVANCED" });
    expect(s.troublePool[0].box).toBe(1);
  });

  it("checkpoint refills armor absorption and survives learning state on retry", () => {
    let s = start();
    s = { ...s, armor: 2, armorAbsorbLeft: 0 };
    s = gameReducer(s, { type: "CHECKPOINT_REACHED" });
    expect(s.armorAbsorbLeft).toBe(2);

    s = trigger(s, "forge-anvil");
    s = run(s, { type: "ANSWER", value: 1 }, { type: "ENCOUNTER_ADVANCED" });
    for (let i = 0; i < HEARTS_START; i++) s = gameReducer(s, { type: "KNIGHT_HIT", cause: "contact" });
    const retried = gameReducer(s, { type: "STAGE_RETRY" });
    expect(retried.troublePool).toHaveLength(1); // learning is never rolled back
    expect(retried.leitnerClock).toBe(s.leitnerClock);
  });
});
