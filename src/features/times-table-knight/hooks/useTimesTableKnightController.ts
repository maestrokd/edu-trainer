import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { Encounter, Fact, GameConfig, Problem, SessionState } from "../model/game.types";
import {
  densityTierFor,
  FEEDBACK_CORRECT_MS,
  FEEDBACK_WRONG_MS,
  DEFAULT_CONFIG,
  PRACTICE_BOSS_VOLLEY_GAP_MS,
} from "../model/game.constants";
import { gameReducer, initialGameState } from "../model/game.reducer";
import { selectCurrentProblem, selectMissedFacts } from "../model/game.selectors";
import { buildAdventurePool, practiceCreatureGroups, toProblem, toProblems, tableFacts } from "../lib/fact-pool";
import { boostFor, factKey, findEntry } from "../lib/leitner";
import { weightedPick, type Weighted } from "../lib/random";
import type { EncounterRequest, Engine, GameEvents, HitCause, PowerUpKind } from "../game/events";
import { bossEmoji } from "../game/spawner";
import { useGameAudio } from "./useGameAudio";

interface SessionRefs {
  /** Practice: remaining creature volleys, all 12 facts exactly once (§3) */
  practiceQueue: Fact[][];
  practiceCreatureCount: number;
  /** Practice: missed facts re-asked once at the boss gate, then the mini-boss */
  reaskQueue: Fact[][];
  reaskServed: boolean;
  seed: number;
}

interface ClosedEncounter {
  stationId: number;
  kind: Encounter["kind"];
  success: boolean;
}

/**
 * Top orchestrator (§10): subscribes to engine GameEvents, maps each to a
 * reducer action, and issues engine commands (freeze/resume/resolve/apply)
 * when the reducer state answers back. The two worlds sync only here.
 */
export function useTimesTableKnightController() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [sessionId, setSessionId] = useState(0);
  const [paused, setPaused] = useState(false);

  const audio = useGameAudio(config.effects.sound, config.effects.haptics);

  const stateRef = useRef<SessionState>(state);
  stateRef.current = state;
  const engineRef = useRef<Engine | null>(null);
  const sessionRef = useRef<SessionRefs | null>(null);
  const closedEncounterRef = useRef<ClosedEncounter | null>(null);
  const prevPhaseRef = useRef(state.phase);
  const advanceTimerRef = useRef<number | null>(null);
  const bossVolleyTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);
    if (bossVolleyTimerRef.current !== null) window.clearTimeout(bossVolleyTimerRef.current);
    advanceTimerRef.current = null;
    bossVolleyTimerRef.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  // ---- problem sourcing -----------------------------------------------------

  const drawAdventureProblems = useCallback((count: number): Problem[] => {
    const s = stateRef.current;
    const pool = buildAdventurePool(s.config.level, s.troublePool, s.leitnerClock);
    const facts: Fact[] = [];
    for (let i = 0; i < count; i++) {
      // weighted draw with no back-to-back repeats
      let pick = weightedPick(pool);
      let guard = 0;
      while (facts.length > 0 && factKey(pick) === factKey(facts[facts.length - 1]) && guard < 8) {
        pick = weightedPick(pool);
        guard++;
      }
      facts.push(pick);
    }
    return toProblems(facts);
  }, []);

  const drawPracticeBossProblem = useCallback((): Problem => {
    const s = stateRef.current;
    const pool: Weighted<Fact>[] = tableFacts(s.config.level).map((fact) => {
      const entry = findEntry(s.troublePool, fact);
      return { item: fact, weight: 1 + (entry ? boostFor(entry) : 0) };
    });
    return toProblem(weightedPick(pool));
  }, []);

  // ---- engine events → reducer actions --------------------------------------

  const handleEncounterRequested = useCallback(
    (req: EncounterRequest) => {
      const s = stateRef.current;
      const tier = densityTierFor(s.config.level);
      let problems: Problem[];
      if (req.kind === "practice-creature") {
        const group = sessionRef.current?.practiceQueue.shift();
        if (!group || group.length === 0) {
          engineRef.current?.resume();
          return;
        }
        problems = toProblems(group);
      } else if (req.kind === "boss-scroll") {
        problems = drawAdventureProblems(1);
      } else {
        problems = drawAdventureProblems(tier.problemsPerStop);
      }
      dispatch({ type: "ENCOUNTER_TRIGGERED", kind: req.kind, stationId: req.stationId, problems });
    },
    [drawAdventureProblems]
  );

  const serveReviewVolley = useCallback(() => {
    const volley = sessionRef.current?.reaskQueue.shift();
    if (!volley) return false;
    engineRef.current?.freeze();
    dispatch({ type: "ENCOUNTER_TRIGGERED", kind: "practice-creature", stationId: -2, problems: toProblems(volley) });
    return true;
  }, []);

  const enterBoss = useCallback(() => {
    const s = stateRef.current;
    const tier = densityTierFor(s.config.level);
    const bossMaxHp = s.config.mode === "practice" ? tier.practiceBossHits : tier.adventureBossHp;
    dispatch({ type: "BOSS_REACHED", bossMaxHp });
    engineRef.current?.enterBossArena();
  }, []);

  const handleBossGateReached = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== "playing") return;
    if (s.config.mode === "practice") {
      const session = sessionRef.current;
      if (session && !session.reaskServed) {
        session.reaskServed = true;
        const missed = selectMissedFacts(s);
        const perVolley = densityTierFor(s.config.level).problemsPerStop;
        for (let i = 0; i < missed.length; i += perVolley) {
          session.reaskQueue.push(missed.slice(i, i + perVolley));
        }
      }
      if (serveReviewVolley()) return;
    }
    enterBoss();
  }, [enterBoss, serveReviewVolley]);

  const events = useMemo<Partial<GameEvents>>(
    () => ({
      onEncounterRequested: handleEncounterRequested,
      onKnightHit: (cause: HitCause) => {
        audio.hit();
        dispatch({ type: "KNIGHT_HIT", cause });
      },
      onCreatureSlain: () => {
        audio.coin();
        dispatch({ type: "CREATURE_SLAIN" });
      },
      onCoinCollected: (value: number) => {
        audio.coin();
        dispatch({ type: "COIN_COLLECTED", value });
      },
      onPowerUpCollected: (_kind: PowerUpKind) => {
        audio.checkpoint();
      },
      onCheckpointReached: () => {
        audio.checkpoint();
        dispatch({ type: "CHECKPOINT_REACHED" });
      },
      onBossGateReached: handleBossGateReached,
      onBossDamaged: (damage: number) => {
        audio.hit();
        dispatch({ type: "BOSS_DAMAGED", damage });
      },
    }),
    [audio, handleEncounterRequested, handleBossGateReached]
  );

  // ---- user actions ----------------------------------------------------------

  const start = useCallback(
    (startConfig: GameConfig) => {
      clearTimers();
      closedEncounterRef.current = null;
      const practiceQueue = startConfig.mode === "practice" ? practiceCreatureGroups(startConfig.level) : [];
      sessionRef.current = {
        practiceQueue,
        practiceCreatureCount: practiceQueue.length,
        reaskQueue: [],
        reaskServed: false,
        seed: (Date.now() % 2147483647) + startConfig.level,
      };
      setConfig(startConfig);
      setPaused(false);
      const s = stateRef.current;
      dispatch({ type: "START", config: startConfig, troublePool: s.troublePool, leitnerClock: s.leitnerClock });
      setSessionId((id) => id + 1);
    },
    [clearTimers]
  );

  const submitAnswer = useCallback(
    (value: number) => {
      const s = stateRef.current;
      const problem = selectCurrentProblem(s);
      const enc = s.encounter;
      if (s.phase !== "encounter" || !problem || !enc || enc.results[enc.index] !== null) return;

      const isCorrect = value === problem.answer;
      if (isCorrect) {
        if (enc.kind === "forge-anvil" || enc.kind === "armor-scroll" || enc.kind === "boss-scroll") audio.forgeUp();
        else audio.correct();
      } else {
        if (enc.kind === "forge-anvil" || enc.kind === "armor-scroll" || enc.kind === "boss-scroll") audio.forgeDown();
        else audio.wrong();
      }
      dispatch({ type: "ANSWER", value });

      advanceTimerRef.current = window.setTimeout(
        () => {
          const cur = stateRef.current;
          const curEnc = cur.encounter;
          if (cur.phase !== "encounter" || !curEnc) return;
          const willClose = cur.hearts <= 0 || curEnc.index + 1 >= curEnc.problems.length;
          if (willClose) {
            closedEncounterRef.current = {
              stationId: curEnc.stationId,
              kind: curEnc.kind,
              success: curEnc.results.every((r) => r === true),
            };
          }
          dispatch({ type: "ENCOUNTER_ADVANCED" });
        },
        isCorrect ? FEEDBACK_CORRECT_MS : FEEDBACK_WRONG_MS
      );
    },
    [audio]
  );

  const retry = useCallback(() => {
    clearTimers();
    closedEncounterRef.current = null;
    const session = sessionRef.current;
    if (session && stateRef.current.config.mode === "practice") {
      session.practiceQueue = practiceCreatureGroups(stateRef.current.config.level);
      session.practiceCreatureCount = session.practiceQueue.length;
      session.reaskQueue = [];
      session.reaskServed = false;
    }
    dispatch({ type: "STAGE_RETRY" });
    engineRef.current?.retryStage();
  }, [clearTimers]);

  const reset = useCallback(() => {
    clearTimers();
    dispatch({ type: "RESET" });
  }, [clearTimers]);

  const togglePause = useCallback(() => {
    setPaused((p) => {
      engineRef.current?.setPaused(!p);
      return !p;
    });
  }, []);

  const onEngineReady = useCallback((engine: Engine | null) => {
    engineRef.current = engine;
  }, []);

  // the Adventure boss falls when engine strikes empty his HP bar
  useEffect(() => {
    if (state.phase === "boss" && state.config.mode === "adventure" && state.bossMaxHp > 0 && state.bossHp === 0) {
      dispatch({ type: "BOSS_DEFEATED" });
    }
  }, [state.phase, state.bossHp, state.bossMaxHp, state.config.mode]);

  // ---- reducer state → engine commands ---------------------------------------

  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = state.phase;
    const engine = engineRef.current;
    if (!engine) return;

    // a volley just closed — settle it in the world and unfreeze
    if (prev === "encounter" && (state.phase === "playing" || state.phase === "boss")) {
      const closed = closedEncounterRef.current;
      closedEncounterRef.current = null;
      if (closed && closed.stationId >= 0) engine.resolveEncounter(closed.stationId, closed.success);
      engine.applyEquipment(state.weapon, state.armor);

      if (state.phase === "playing" && state.config.mode === "practice" && closed?.stationId === -2) {
        // gate review continues until the re-ask queue is empty, then the boss
        if (serveReviewVolley()) return;
        enterBoss();
        return;
      }
      engine.resume();

      if (state.phase === "boss" && state.config.mode === "practice") {
        if (state.bossHp <= 0) {
          dispatch({ type: "BOSS_DEFEATED" });
        } else {
          bossVolleyTimerRef.current = window.setTimeout(() => {
            const cur = stateRef.current;
            if (cur.phase !== "boss" || cur.config.mode !== "practice") return;
            engineRef.current?.freeze();
            dispatch({
              type: "ENCOUNTER_TRIGGERED",
              kind: "practice-boss",
              stationId: -1,
              problems: [drawPracticeBossProblem()],
            });
          }, PRACTICE_BOSS_VOLLEY_GAP_MS);
        }
      }
      return;
    }

    if (state.phase === "boss" && prev === "playing" && state.config.mode === "practice") {
      // practice mini-boss: the calm volley starts right away
      bossVolleyTimerRef.current = window.setTimeout(() => {
        const cur = stateRef.current;
        if (cur.phase !== "boss") return;
        engineRef.current?.freeze();
        dispatch({
          type: "ENCOUNTER_TRIGGERED",
          kind: "practice-boss",
          stationId: -1,
          problems: [drawPracticeBossProblem()],
        });
      }, PRACTICE_BOSS_VOLLEY_GAP_MS);
      return;
    }

    if (state.phase === "results" && prev !== "results") {
      clearTimers();
      if (state.endReason === "boss-defeated") {
        audio.fanfare();
        engine.defeatBoss(state.gameCompleted);
      } else {
        engine.stopWorld();
      }
    }
  }, [state, audio, clearTimers, drawPracticeBossProblem, enterBoss, serveReviewVolley]);

  return {
    state,
    config,
    setConfig,
    sessionId,
    paused,
    practiceCreatureCount: sessionRef.current?.practiceCreatureCount ?? 0,
    seed: sessionRef.current?.seed ?? 1,
    bossEmoji: bossEmoji(state.config.level),
    events,
    onEngineReady,
    actions: { start, submitAnswer, retry, reset, togglePause },
  };
}
