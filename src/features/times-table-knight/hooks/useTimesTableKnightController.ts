import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { Encounter, Fact, GameConfig, Problem, SessionState } from "../model/game.types";
import {
  densityTierFor,
  FEEDBACK_CORRECT_MS,
  FEEDBACK_WRONG_MS,
  DEFAULT_CONFIG,
  MAX_LEVEL,
  PRACTICE_BOSS_VOLLEY_GAP_MS,
} from "../model/game.constants";
import { gameReducer, initialGameState } from "../model/game.reducer";
import { selectAccuracy, selectCurrentProblem, selectMissedFacts } from "../model/game.selectors";
import { buildAdventurePool, practiceCreatureGroups, toProblem, toProblems, tableFacts } from "../lib/fact-pool";
import { boostFor, factKey, findEntry } from "../lib/leitner";
import { weightedPick, type Weighted } from "../lib/random";
import type { EncounterRequest, Engine, GameEvents, HitCause } from "../game/events";
import { bossEmoji } from "../game/spawner";
import { useGameAudio } from "./useGameAudio";
import { useTrainerAnalytics } from "./useTrainerAnalytics";
import {
  bankSession,
  buySkin as buySkinInProgress,
  loadProgress,
  saveProgress,
  type KnightProgress,
} from "../services/progress/knight-progress";

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
  const [progress, setProgress] = useState<KnightProgress>(() => loadProgress());
  const [config, setConfig] = useState<GameConfig>(() => {
    const saved = loadProgress();
    // the OS reduced-motion preference seeds the toggle (§13); the child can still override it
    const osReducedMotion =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return {
      ...DEFAULT_CONFIG,
      hero: saved.hero,
      skin: saved.skin,
      effects: { ...DEFAULT_CONFIG.effects, reducedMotion: osReducedMotion },
    };
  });
  const [sessionId, setSessionId] = useState(0);
  const [paused, setPaused] = useState(false);

  const audio = useGameAudio(config.effects.sound, config.effects.haptics);
  const analytics = useTrainerAnalytics();

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
      onPowerUpCollected: () => {
        audio.checkpoint();
      },
      onCheckpointReached: () => {
        audio.checkpoint();
        analytics.trackCheckpointReached(stateRef.current.config);
        dispatch({ type: "CHECKPOINT_REACHED" });
      },
      onBossGateReached: handleBossGateReached,
      onBossDamaged: (damage: number) => {
        audio.hit();
        dispatch({ type: "BOSS_DAMAGED", damage });
      },
    }),
    [audio, analytics, handleEncounterRequested, handleBossGateReached]
  );

  // ---- user actions ----------------------------------------------------------

  const progressRef = useRef(progress);
  progressRef.current = progress;

  const start = useCallback(
    (startConfig: GameConfig) => {
      const saved = progressRef.current;
      if (startConfig.mode === "adventure" && !saved.stages[startConfig.level]?.unlocked) return;
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
      // hero & skin choices persist across visits
      const nextProgress = { ...saved, hero: startConfig.hero, skin: startConfig.skin };
      setProgress(nextProgress);
      saveProgress(nextProgress);
      analytics.trackSessionStart(startConfig);
      dispatch({
        type: "START",
        config: startConfig,
        troublePool: saved.troublePool,
        leitnerClock: saved.leitnerClock,
      });
      setSessionId((id) => id + 1);
    },
    [clearTimers, analytics]
  );

  const nextStage = useCallback(() => {
    const s = stateRef.current;
    start({ ...s.config, level: s.config.level + 1 });
  }, [start]);

  const buySkin = useCallback(
    (skin: GameConfig["skin"]) => {
      const bought = buySkinInProgress(progressRef.current, skin);
      if (!bought) {
        audio.buzz();
        return false;
      }
      setProgress(bought);
      saveProgress(bought);
      setConfig((prev) => ({ ...prev, skin }));
      audio.coin();
      return true;
    },
    [audio]
  );

  const submitAnswer = useCallback(
    (value: number) => {
      const s = stateRef.current;
      const problem = selectCurrentProblem(s);
      const enc = s.encounter;
      if (s.phase !== "encounter" || !problem || !enc || enc.results[enc.index] !== null) return;

      const isCorrect = value === problem.answer;
      const isEquipmentStop = enc.kind === "forge-anvil" || enc.kind === "armor-scroll" || enc.kind === "boss-scroll";
      if (isEquipmentStop) {
        if (isCorrect) audio.forgeUp();
        else audio.forgeDown();
        const ladder = enc.kind === "armor-scroll" ? "armor" : "weapon";
        const tierNow = ladder === "armor" ? s.armor : s.weapon;
        analytics.trackEquipmentForged(s.config, ladder, tierNow, isCorrect ? "up" : "down");
      } else if (isCorrect) {
        audio.correct();
      } else {
        audio.wrong();
      }
      analytics.trackProblemAnswered(s.config, problem.fact, isCorrect, enc.kind);
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
    [audio, analytics]
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

    // Banking must NOT depend on the engine: entering results unmounts the
    // canvas, whose cleanup nulls engineRef before this effect runs — progress
    // (stage unlocks, stars, wallet) would silently never persist.
    if (state.phase === "results" && prev !== "results") {
      clearTimers();
      const banked = bankSession(progressRef.current, {
        mode: state.config.mode,
        level: state.config.level,
        victory: state.endReason === "boss-defeated",
        stars: state.stars,
        score: state.score,
        coins: state.coins,
        troublePool: state.troublePool,
        leitnerClock: state.leitnerClock,
        gameCompleted: state.gameCompleted,
      });
      setProgress(banked);
      saveProgress(banked);
      const victory = state.endReason === "boss-defeated";
      const accuracy = selectAccuracy(state);
      if (victory) {
        analytics.trackBossDefeated(state.config, state.stars, accuracy);
        if (state.config.mode === "adventure" && state.config.level < MAX_LEVEL) {
          analytics.trackStageUnlocked(state.config, state.config.level + 1);
        }
      }
      analytics.trackSessionEnd(state.config, {
        victory,
        accuracy,
        stars: state.stars,
        answered: state.answered,
        coins: state.coins,
        score: state.score,
      });
      if (victory) {
        audio.fanfare();
        engineRef.current?.defeatBoss(state.gameCompleted);
      } else {
        engineRef.current?.stopWorld();
      }
      return;
    }

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
  }, [state, audio, analytics, clearTimers, drawPracticeBossProblem, enterBoss, serveReviewVolley]);

  return {
    state,
    config,
    setConfig,
    progress,
    sessionId,
    paused,
    practiceCreatureCount: sessionRef.current?.practiceCreatureCount ?? 0,
    seed: sessionRef.current?.seed ?? 1,
    bossEmoji: bossEmoji(state.config.level),
    events,
    onEngineReady,
    actions: { start, submitAnswer, retry, reset, togglePause, nextStage, buySkin },
  };
}
