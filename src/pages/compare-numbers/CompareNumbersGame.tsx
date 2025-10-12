import React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Settings } from "lucide-react";

import ThemeToggle from "@/components/menu/ThemeToggle";
import LanguageSelector, {
  LanguageSelectorMode,
} from "@/components/lang/LanguageSelector";

import { cn } from "@/lib/utils";

import {
  canGenerate,
  generateExercise,
  prepareGenerator,
} from "@/lib/compare-numbers/generator";
import type {
  CompareNumberTypeKey,
  CompareRelation,
  GeneratedExercise,
  GeneratedValue,
  PreparedGenerator,
} from "@/lib/compare-numbers/generator";

type Screen = "setup" | "play";

type HistoryOrder = "asc" | "desc";

type ModeKey = "nonNegative" | "signed" | "decimal" | "fraction";

interface IntegerState {
  enabled: boolean;
  weight: number;
  min: number;
  max: number;
  gap: { min: number; max: number | null };
}

interface DecimalState {
  enabled: boolean;
  weight: number;
  min: number;
  max: number;
  precisionMode: "exact" | "upTo";
  precision: number;
  maxPrecision: number;
  gap: { min: number; max: number | null };
}

interface FractionState {
  enabled: boolean;
  weight: number;
  preset: "preset12" | "preset20" | "custom";
  numeratorMin: number;
  numeratorMax: number;
  denominatorMin: number;
  denominatorMax: number;
  gap: { min: number; max: number | null };
}

interface HistoryEntry {
  id: number;
  left: GeneratedValue;
  right: GeneratedValue;
  correctRelation: CompareRelation;
  userRelation: CompareRelation;
  isCorrect: boolean;
  timestamp: number;
}

type EndReason = "time" | "ex" | "generator" | null;

const PRECISION_OPTIONS = [0, 1, 2, 3, 4];

export default function CompareNumbersGame() {
  const { t } = useTranslation();
  const tr = React.useCallback(
    (key: string, options?: Record<string, unknown>) =>
      t(`cmpNmbrGm.${key}`, options),
    [t],
  );

  const [screen, setScreen] = React.useState<Screen>("setup");

  const [nonNegativeConfig, setNonNegativeConfig] =
    React.useState<IntegerState>({
      enabled: true,
      weight: 25,
      min: 0,
      max: 99,
      gap: { min: 0, max: null },
    });

  const [signedConfig, setSignedConfig] = React.useState<IntegerState>({
    enabled: false,
    weight: 25,
    min: -50,
    max: 50,
    gap: { min: 0, max: null },
  });

  const [decimalConfig, setDecimalConfig] = React.useState<DecimalState>({
    enabled: false,
    weight: 25,
    min: 0,
    max: 100,
    precisionMode: "exact",
    precision: 1,
    maxPrecision: 2,
    gap: { min: 0, max: null },
  });

  const [fractionConfig, setFractionConfig] = React.useState<FractionState>({
    enabled: false,
    weight: 25,
    preset: "preset12",
    numeratorMin: 1,
    numeratorMax: 12,
    denominatorMin: 2,
    denominatorMax: 12,
    gap: { min: 0, max: null },
  });

  const [openMode, setOpenMode] = React.useState<ModeKey | undefined>(undefined);

  const [equalRatio, setEqualRatio] = React.useState<number>(10);
  const [timerMinutes, setTimerMinutes] = React.useState<number>(0);
  const [maxExercises, setMaxExercises] = React.useState<number>(0);
  const [historyOrder, setHistoryOrder] = React.useState<HistoryOrder>("asc");
  const [enableSound, setEnableSound] = React.useState<boolean>(false);
  const [enableVibration, setEnableVibration] = React.useState<boolean>(false);

  const handleAccordionChange = React.useCallback((value: string | undefined) => {
    if (!value) {
      setOpenMode(undefined);
      return;
    }

    if (value === "nonNegative" || value === "signed" || value === "decimal" || value === "fraction") {
      setOpenMode(value);
    }
  }, []);

  const [correctCount, setCorrectCount] = React.useState<number>(0);
  const [wrongCount, setWrongCount] = React.useState<number>(0);
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);
  const [exercise, setExercise] = React.useState<GeneratedExercise | null>(
    null,
  );
  const [gameOver, setGameOver] = React.useState<boolean>(false);
  const [endReason, setEndReason] = React.useState<EndReason>(null);
  const [feedback, setFeedback] = React.useState<{
    type: "correct" | "wrong";
    userRelation: CompareRelation;
    correctRelation: CompareRelation;
  } | null>(null);
  const [taskId, setTaskId] = React.useState<number>(0);
  const [sessionAnchor, setSessionAnchor] = React.useState<number>(0);

  const activeGeneratorRef = React.useRef<PreparedGenerator | null>(null);
  const historyIdRef = React.useRef<number>(0);
  const focusRef = React.useRef<HTMLDivElement>(null);

  const timerActive = screen === "play" && !gameOver;
  const { elapsedSec, reset: resetTimer } = useAccurateTimer(timerActive);

  const audioCtxRef = React.useRef<AudioContext | null>(null);

  const triggerFeedback = React.useCallback(
    (isCorrect: boolean) => {
      if (
        enableVibration &&
        typeof navigator !== "undefined" &&
        navigator.vibrate
      ) {
        navigator.vibrate(isCorrect ? 25 : [10, 60, 10]);
      }
      if (!enableSound) return;
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContext();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") {
          void ctx.resume();
        }
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = isCorrect ? 880 : 220;
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.25);
      } catch (error) {
        console.error("Audio feedback error", error);
      }
    },
    [enableSound, enableVibration],
  );

  const finishSession = React.useCallback((reason: EndReason) => {
    setGameOver(true);
    setEndReason(reason);
  }, []);

  const equalRatioFraction = Math.min(equalRatio, 50) / 100;

  const generatorPreview = React.useMemo(
    () =>
      prepareGenerator({
        nonNegativeInt: nonNegativeConfig,
        signedInt: signedConfig,
        decimal: decimalConfig,
        fraction: fractionConfig,
        equalRatio: equalRatioFraction,
      }),
    [
      nonNegativeConfig,
      signedConfig,
      decimalConfig,
      fractionConfig,
      equalRatioFraction,
    ],
  );

  const handleAnswer = React.useCallback(
    (relation: CompareRelation) => {
      if (!exercise || gameOver) return;
      const isCorrect = relation === exercise.correctRelation;
      setFeedback({
        type: isCorrect ? "correct" : "wrong",
        userRelation: relation,
        correctRelation: exercise.correctRelation,
      });
      if (isCorrect) {
        setCorrectCount((count) => count + 1);
      } else {
        setWrongCount((count) => count + 1);
      }
      historyIdRef.current += 1;
      setHistory((prev) => [
        ...prev,
        {
          id: historyIdRef.current,
          left: exercise.left,
          right: exercise.right,
          correctRelation: exercise.correctRelation,
          userRelation: relation,
          isCorrect,
          timestamp: Date.now(),
        },
      ]);
      triggerFeedback(isCorrect);

      const total = history.length + 1;
      if (maxExercises > 0 && total >= maxExercises) {
        finishSession("ex");
        return;
      }

      const generator = activeGeneratorRef.current ?? generatorPreview;
      const nextExercise = generateExercise(generator);
      if (!nextExercise) {
        finishSession("generator");
        setExercise(null);
      } else {
        setExercise(nextExercise);
        setTaskId((id) => id + 1);
      }
    },
    [
      exercise,
      gameOver,
      history.length,
      maxExercises,
      triggerFeedback,
      finishSession,
      generatorPreview,
    ],
  );

  const canStart = canGenerate(generatorPreview);

  const typeAvailableMap = React.useMemo(() => {
    const map: Record<CompareNumberTypeKey, boolean> = {
      nonNegativeInt: false,
      signedInt: false,
      decimal: false,
      fraction: false,
    };
    for (const type of generatorPreview.types) {
      map[type.key] = true;
    }
    return map;
  }, [generatorPreview]);

  const totalExercises = history.length;
  const accuracy =
    totalExercises > 0 ? Math.round((correctCount / totalExercises) * 100) : 0;

  React.useEffect(() => {
    if (!timerActive) return;
    if (timerMinutes <= 0) return;
    if (elapsedSec >= timerMinutes * 60) {
      finishSession("time");
    }
  }, [elapsedSec, timerMinutes, timerActive, finishSession]);

  React.useEffect(() => {
    if (!timerActive) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "ArrowLeft") {
        event.preventDefault();
        handleAnswer("<");
      } else if (event.code === "ArrowRight") {
        event.preventDefault();
        handleAnswer(">");
      } else if (event.code === "Space") {
        event.preventDefault();
        handleAnswer("=");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [timerActive, handleAnswer]);

  const historyDisplay = React.useMemo(
    () => (historyOrder === "asc" ? history : [...history].reverse()),
    [history, historyOrder],
  );

  const formatTime = React.useCallback((totalSec: number) => {
    const seconds = Math.max(0, Math.floor(totalSec));
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(minutes)}:${pad(remaining)}`;
  }, []);

  const timeLeft =
    timerMinutes > 0 ? Math.max(0, timerMinutes * 60 - elapsedSec) : 0;

  function sanitizeNonNegativeConfig(update: Partial<IntegerState>) {
    setNonNegativeConfig((prev) => {
      const next = { ...prev, ...update };
      const min = Math.max(0, next.min);
      const max = Math.max(min, next.max);
      return { ...next, min, max };
    });
  }

  function sanitizeSignedConfig(update: Partial<IntegerState>) {
    setSignedConfig((prev) => {
      const next = { ...prev, ...update };
      if (next.min > next.max) {
        return { ...next, max: next.min };
      }
      return next;
    });
  }

  function sanitizeDecimalConfig(update: Partial<DecimalState>) {
    setDecimalConfig((prev) => {
      const next = { ...prev, ...update };
      if (next.min > next.max) {
        return { ...next, max: next.min };
      }
      return next;
    });
  }

  function sanitizeFractionConfig(update: Partial<FractionState>) {
    setFractionConfig((prev) => {
      const next = { ...prev, ...update };
      if (next.preset !== "custom") {
        return next;
      }
      const numeratorMin = Math.max(
        1,
        Math.min(next.numeratorMin, next.numeratorMax),
      );
      const numeratorMax = Math.max(numeratorMin, next.numeratorMax);
      const denominatorMin = Math.max(
        1,
        Math.min(next.denominatorMin, next.denominatorMax),
      );
      const denominatorMax = Math.max(denominatorMin, next.denominatorMax);
      return {
        ...next,
        numeratorMin,
        numeratorMax,
        denominatorMin,
        denominatorMax,
      };
    });
  }

  const startSession = React.useCallback(() => {
    if (!canStart) return;
    const prepared = prepareGenerator({
      nonNegativeInt: nonNegativeConfig,
      signedInt: signedConfig,
      decimal: decimalConfig,
      fraction: fractionConfig,
      equalRatio: equalRatioFraction,
    });
    if (!canGenerate(prepared)) {
      setEndReason("generator");
      setGameOver(true);
      return;
    }
    activeGeneratorRef.current = prepared;
    setSessionAnchor((value) => value + 1);
    setScreen("play");
    setCorrectCount(0);
    setWrongCount(0);
    setHistory([]);
    setFeedback(null);
    setEndReason(null);
    setGameOver(false);
    setSessionAnchor((value) => value + 1);
    resetTimer();
    const nextExercise = generateExercise(prepared);
    if (!nextExercise) {
      setGameOver(true);
      setEndReason("generator");
      setExercise(null);
    } else {
      setExercise(nextExercise);
    }
    setTaskId((id) => id + 1);
  }, [
    canStart,
    nonNegativeConfig,
    signedConfig,
    decimalConfig,
    fractionConfig,
    equalRatioFraction,
    resetTimer,
  ]);

  const backToSetup = React.useCallback(() => {
    setScreen("setup");
    setGameOver(false);
    setExercise(null);
    setFeedback(null);
    setEndReason(null);
  }, []);

  const newSession = React.useCallback(() => {
    if (screen === "setup") {
      startSession();
      return;
    }
    if (!activeGeneratorRef.current) {
      startSession();
      return;
    }
    setCorrectCount(0);
    setWrongCount(0);
    setHistory([]);
    setFeedback(null);
    setEndReason(null);
    setGameOver(false);
    resetTimer();
    const nextExercise = generateExercise(activeGeneratorRef.current);
    if (!nextExercise) {
      setGameOver(true);
      setEndReason("generator");
      setExercise(null);
    } else {
      setExercise(nextExercise);
    }
    setTaskId((id) => id + 1);
  }, [screen, startSession, resetTimer]);

  const sessionEnded = screen === "play" && gameOver;

  const displaySizeClass = React.useMemo(() => {
    const leftLength = exercise?.left.display.length ?? 0;
    const rightLength = exercise?.right.display.length ?? 0;
    const maxLength = Math.max(leftLength, rightLength);
    if (maxLength > 20) {
      return "text-xl sm:text-3xl";
    }
    if (maxLength > 14) {
      return "text-2xl sm:text-4xl";
    }
    return "text-3xl sm:text-5xl";
  }, [exercise]);

  React.useEffect(() => {
    if (screen !== "play") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    const node = focusRef.current;
    if (node) {
      node.focus({ preventScroll: true });
    }
  }, [screen, sessionAnchor]);

  return (
    <div className="min-h-dvh w-full bg-gradient-to-br bg-background flex flex-col p-2 sm:p-4 overflow-hidden">
      <div className="w-full flex flex-col h-full">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-muted-foreground">
              {tr("title")}
            </span>
          </div>
          <div className="flex items-center text-center">
            {screen === "play" && (
              <span className="w-full text-[10px] sm:text-xs text-muted-foreground">
                {tr("summary.enabledTypes", {
                  types: summarizeTypes(typeAvailableMap, tr),
                })}
                {" • "}
                {tr("summary.equal", { ratio: equalRatio })}
              </span>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={tr("aria.openMenu") ?? undefined}
                className="size-8"
              >
                <Settings className="size-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center text-center">
                    <span className="w-full">{tr("menuLabel")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <LanguageSelector mode={LanguageSelectorMode.ICON} />
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {screen === "play" && (
                  <>
                    <DropdownMenuItem onSelect={() => newSession()}>
                      {tr("actions.newSession")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => backToSetup()}>
                      {tr("actions.changeSetup")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/">{tr("actions.toMenu")}</Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {screen === "setup" ? (
          <div className="bg-muted/50 backdrop-blur rounded-2xl shadow-lg p-5 sm:p-8 max-w-6xl mx-auto w-full sm:mt-6 overflow-auto">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg sm:text-xl font-semibold">
                {tr("setup.title")}
              </h2>
              {!canStart && (
                <span className="text-sm font-medium text-destructive">
                  {tr("errors.unavailable")}
                </span>
              )}
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              {tr("setup.intro")}
            </p>

            <Accordion
              type="single"
              collapsible
              value={openMode}
              onValueChange={handleAccordionChange}
              className="mt-6 space-y-3"
            >
              <TypeCard
                id="non-negative"
                value="nonNegative"
                title={tr("types.nonNegative.title")}
                description={tr("types.nonNegative.desc")}
                enabled={nonNegativeConfig.enabled}
                onEnabledChange={(checked) => {
                  sanitizeNonNegativeConfig({ enabled: checked });
                }}
                showAvailabilityError={
                  nonNegativeConfig.enabled && !typeAvailableMap.nonNegativeInt
                }
                availabilityText={tr("types.messages.unavailable")}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <LabeledField
                    label={tr("ranges.min")!}
                    htmlFor="non-negative-min"
                  >
                    <Input
                      id="non-negative-min"
                      type="number"
                      min={0}
                      value={nonNegativeConfig.min}
                      disabled={!nonNegativeConfig.enabled}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        const min = Number.isFinite(value)
                          ? Math.max(0, value)
                          : 0;
                        sanitizeNonNegativeConfig({
                          min,
                          max: Math.max(min, nonNegativeConfig.max),
                        });
                      }}
                    />
                  </LabeledField>
                  <LabeledField
                    label={tr("ranges.max")!}
                    htmlFor="non-negative-max"
                  >
                    <Input
                      id="non-negative-max"
                      type="number"
                      min={0}
                      value={nonNegativeConfig.max}
                      disabled={!nonNegativeConfig.enabled}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        const max = Number.isFinite(value)
                          ? Math.max(0, value)
                          : nonNegativeConfig.min;
                        sanitizeNonNegativeConfig({
                          max: Math.max(nonNegativeConfig.min, max),
                        });
                      }}
                    />
                  </LabeledField>
                </div>
                <GapFields
                  idPrefix="non-negative"
                  minValue={nonNegativeConfig.gap.min}
                  maxValue={nonNegativeConfig.gap.max}
                  onMinChange={(value) =>
                    sanitizeNonNegativeConfig({
                      gap: { ...nonNegativeConfig.gap, min: value },
                    })
                  }
                  onMaxChange={(value) =>
                    sanitizeNonNegativeConfig({
                      gap: { ...nonNegativeConfig.gap, max: value },
                    })
                  }
                  labelMin={tr("gap.min")!}
                  labelMax={tr("gap.max")!}
                  disabled={!nonNegativeConfig.enabled}
                />
                <WeightField
                  value={nonNegativeConfig.weight}
                  onChange={(value) =>
                    sanitizeNonNegativeConfig({ weight: value })
                  }
                  label={tr("weights.label")!}
                  disabled={!nonNegativeConfig.enabled}
                />
              </TypeCard>

              <TypeCard
                id="signed"
                value="signed"
                title={tr("types.signed.title")}
                description={tr("types.signed.desc")}
                enabled={signedConfig.enabled}
                onEnabledChange={(checked) => {
                  sanitizeSignedConfig({ enabled: checked });
                }}
                showAvailabilityError={
                  signedConfig.enabled && !typeAvailableMap.signedInt
                }
                availabilityText={tr("types.messages.unavailable")}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <LabeledField
                    label={tr("ranges.min")!}
                    htmlFor="signed-min"
                  >
                    <Input
                      id="signed-min"
                      type="number"
                      value={signedConfig.min}
                      disabled={!signedConfig.enabled}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        const min = Number.isFinite(value)
                          ? value
                          : signedConfig.min;
                        sanitizeSignedConfig({
                          min,
                          max: Math.max(min, signedConfig.max),
                        });
                      }}
                    />
                  </LabeledField>
                  <LabeledField
                    label={tr("ranges.max")!}
                    htmlFor="signed-max"
                  >
                    <Input
                      id="signed-max"
                      type="number"
                      value={signedConfig.max}
                      disabled={!signedConfig.enabled}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        const max = Number.isFinite(value)
                          ? value
                          : signedConfig.max;
                        sanitizeSignedConfig({
                          max: Math.max(signedConfig.min, max),
                        });
                      }}
                    />
                  </LabeledField>
                </div>
                <GapFields
                  idPrefix="signed"
                  minValue={signedConfig.gap.min}
                  maxValue={signedConfig.gap.max}
                  onMinChange={(value) =>
                    sanitizeSignedConfig({
                      gap: { ...signedConfig.gap, min: value },
                    })
                  }
                  onMaxChange={(value) =>
                    sanitizeSignedConfig({
                      gap: { ...signedConfig.gap, max: value },
                    })
                  }
                  labelMin={tr("gap.min")!}
                  labelMax={tr("gap.max")!}
                  disabled={!signedConfig.enabled}
                />
                <WeightField
                  value={signedConfig.weight}
                  onChange={(value) =>
                    sanitizeSignedConfig({ weight: value })
                  }
                  label={tr("weights.label")!}
                  disabled={!signedConfig.enabled}
                />
              </TypeCard>

              <TypeCard
                id="decimal"
                value="decimal"
                title={tr("types.decimal.title")}
                description={tr("types.decimal.desc")}
                enabled={decimalConfig.enabled}
                onEnabledChange={(checked) => {
                  sanitizeDecimalConfig({ enabled: checked });
                }}
                showAvailabilityError={
                  decimalConfig.enabled && !typeAvailableMap.decimal
                }
                availabilityText={tr("types.messages.decimalRange")}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <LabeledField
                    label={tr("ranges.min")!}
                    htmlFor="decimal-min"
                  >
                    <Input
                      id="decimal-min"
                      type="number"
                      step="0.1"
                      value={decimalConfig.min}
                      disabled={!decimalConfig.enabled}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        const min = Number.isFinite(value)
                          ? value
                          : decimalConfig.min;
                        sanitizeDecimalConfig({
                          min,
                          max: Math.max(min, decimalConfig.max),
                        });
                      }}
                    />
                  </LabeledField>
                  <LabeledField
                    label={tr("ranges.max")!}
                    htmlFor="decimal-max"
                  >
                    <Input
                      id="decimal-max"
                      type="number"
                      step="0.1"
                      value={decimalConfig.max}
                      disabled={!decimalConfig.enabled}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        const max = Number.isFinite(value)
                          ? value
                          : decimalConfig.max;
                        sanitizeDecimalConfig({
                          max: Math.max(decimalConfig.min, max),
                        });
                      }}
                    />
                  </LabeledField>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <LabeledField
                    label={tr("precision.mode")!}
                    htmlFor="decimal-mode"
                  >
                    <Select
                      value={decimalConfig.precisionMode}
                      onValueChange={(val) =>
                        sanitizeDecimalConfig({
                          precisionMode:
                            val as DecimalState["precisionMode"],
                        })
                      }
                      disabled={!decimalConfig.enabled}
                    >
                      <SelectTrigger
                        id="decimal-mode"
                        disabled={!decimalConfig.enabled}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exact">
                          {tr("precision.exact")}
                        </SelectItem>
                        <SelectItem value="upTo">
                          {tr("precision.upTo")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </LabeledField>
                  <LabeledField
                    label={
                      decimalConfig.precisionMode === "exact"
                        ? tr("precision.exactValue")!
                        : tr("precision.maxValue")!
                    }
                    htmlFor="decimal-precision"
                  >
                    <Select
                      value={String(
                        decimalConfig.precisionMode === "exact"
                          ? decimalConfig.precision
                          : decimalConfig.maxPrecision,
                      )}
                      onValueChange={(val) => {
                        const num = Number(val);
                        if (!Number.isFinite(num)) return;
                        if (decimalConfig.precisionMode === "exact") {
                          sanitizeDecimalConfig({ precision: num });
                        } else {
                          sanitizeDecimalConfig({ maxPrecision: num });
                        }
                      }}
                      disabled={!decimalConfig.enabled}
                    >
                      <SelectTrigger
                        id="decimal-precision"
                        disabled={!decimalConfig.enabled}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRECISION_OPTIONS.map((value) => (
                          <SelectItem key={value} value={String(value)}>
                            {tr("precision.option", { count: value })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </LabeledField>
                </div>
                <GapFields
                  idPrefix="decimal"
                  minValue={decimalConfig.gap.min}
                  maxValue={decimalConfig.gap.max}
                  onMinChange={(value) =>
                    sanitizeDecimalConfig({
                      gap: { ...decimalConfig.gap, min: value },
                    })
                  }
                  onMaxChange={(value) =>
                    sanitizeDecimalConfig({
                      gap: { ...decimalConfig.gap, max: value },
                    })
                  }
                  labelMin={tr("gap.min")!}
                  labelMax={tr("gap.max")!}
                  disabled={!decimalConfig.enabled}
                />
                <WeightField
                  value={decimalConfig.weight}
                  onChange={(value) =>
                    sanitizeDecimalConfig({ weight: value })
                  }
                  label={tr("weights.label")!}
                  disabled={!decimalConfig.enabled}
                />
              </TypeCard>

              <TypeCard
                id="fraction"
                value="fraction"
                title={tr("types.fraction.title")}
                description={tr("types.fraction.desc")}
                enabled={fractionConfig.enabled}
                onEnabledChange={(checked) => {
                  sanitizeFractionConfig({ enabled: checked });
                }}
                showAvailabilityError={
                  fractionConfig.enabled && !typeAvailableMap.fraction
                }
                availabilityText={tr("types.messages.unavailable")}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <LabeledField
                    label={tr("fractions.mode")!}
                    htmlFor="fraction-mode"
                  >
                    <Select
                      value={fractionConfig.preset}
                      onValueChange={(val) =>
                        sanitizeFractionConfig({
                          preset: val as FractionState["preset"],
                        })
                      }
                      disabled={!fractionConfig.enabled}
                    >
                      <SelectTrigger
                        id="fraction-mode"
                        disabled={!fractionConfig.enabled}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preset12">
                          {tr("fractions.preset12")}
                        </SelectItem>
                        <SelectItem value="preset20">
                          {tr("fractions.preset20")}
                        </SelectItem>
                        <SelectItem value="custom">
                          {tr("fractions.custom")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </LabeledField>
                  <LabeledField
                    label={tr("fractions.numerator")!}
                    htmlFor="fraction-num-min"
                  >
                    <Input
                      id="fraction-num-min"
                      type="number"
                      min={1}
                      value={fractionConfig.numeratorMin}
                      disabled={
                        !fractionConfig.enabled ||
                        fractionConfig.preset !== "custom"
                      }
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        const min = Number.isFinite(value)
                          ? Math.max(1, value)
                          : fractionConfig.numeratorMin;
                        sanitizeFractionConfig({
                          numeratorMin: min,
                          numeratorMax: Math.max(min, fractionConfig.numeratorMax),
                        });
                      }}
                    />
                  </LabeledField>
                  <LabeledField
                    label={tr("fractions.numeratorMax")!}
                    htmlFor="fraction-num-max"
                  >
                    <Input
                      id="fraction-num-max"
                      type="number"
                      min={1}
                      value={fractionConfig.numeratorMax}
                      disabled={
                        !fractionConfig.enabled ||
                        fractionConfig.preset !== "custom"
                      }
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        const max = Number.isFinite(value)
                          ? Math.max(1, value)
                          : fractionConfig.numeratorMax;
                        sanitizeFractionConfig({
                          numeratorMax: Math.max(
                            fractionConfig.numeratorMin,
                            max,
                          ),
                        });
                      }}
                    />
                  </LabeledField>
                  <LabeledField
                    label={tr("fractions.denominator")!}
                    htmlFor="fraction-den-min"
                  >
                    <Input
                      id="fraction-den-min"
                      type="number"
                      min={1}
                      value={fractionConfig.denominatorMin}
                      disabled={
                        !fractionConfig.enabled ||
                        fractionConfig.preset !== "custom"
                      }
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        const min = Number.isFinite(value)
                          ? Math.max(1, value)
                          : fractionConfig.denominatorMin;
                        sanitizeFractionConfig({
                          denominatorMin: min,
                          denominatorMax: Math.max(min, fractionConfig.denominatorMax),
                        });
                      }}
                    />
                  </LabeledField>
                  <LabeledField
                    label={tr("fractions.denominatorMax")!}
                    htmlFor="fraction-den-max"
                  >
                    <Input
                      id="fraction-den-max"
                      type="number"
                      min={1}
                      value={fractionConfig.denominatorMax}
                      disabled={
                        !fractionConfig.enabled ||
                        fractionConfig.preset !== "custom"
                      }
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        const max = Number.isFinite(value)
                          ? Math.max(1, value)
                          : fractionConfig.denominatorMax;
                        sanitizeFractionConfig({
                          denominatorMax: Math.max(
                            fractionConfig.denominatorMin,
                            max,
                          ),
                        });
                      }}
                    />
                  </LabeledField>
                </div>
                <GapFields
                  idPrefix="fraction"
                  minValue={fractionConfig.gap.min}
                  maxValue={fractionConfig.gap.max}
                  onMinChange={(value) =>
                    sanitizeFractionConfig({
                      gap: { ...fractionConfig.gap, min: value },
                    })
                  }
                  onMaxChange={(value) =>
                    sanitizeFractionConfig({
                      gap: { ...fractionConfig.gap, max: value },
                    })
                  }
                  labelMin={tr("gap.min")!}
                  labelMax={tr("gap.max")!}
                  disabled={!fractionConfig.enabled}
                />
                <WeightField
                  value={fractionConfig.weight}
                  onChange={(value) =>
                    sanitizeFractionConfig({ weight: value })
                  }
                  label={tr("weights.label")!}
                  disabled={!fractionConfig.enabled}
                />
              </TypeCard>
            </Accordion>

            <Separator className="my-6" />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-3">
                <Label htmlFor="equal-ratio">{tr("equal.label")}</Label>
                <div className="flex items-center gap-4">
                  <input
                    id="equal-ratio"
                    type="range"
                    min={0}
                    max={50}
                    value={equalRatio}
                    onChange={(event) =>
                      setEqualRatio(Number(event.target.value))
                    }
                    className="w-full"
                  />
                  <span className="w-14 text-right text-sm font-medium">
                    {equalRatio}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {tr("equal.hint")}
                </p>
              </div>

              <div className="grid gap-3">
                <Label>{tr("history.order.label")}</Label>
                <Select
                  value={historyOrder}
                  onValueChange={(value) =>
                    setHistoryOrder(value as HistoryOrder)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">
                      {tr("history.order.oldest")}
                    </SelectItem>
                    <SelectItem value="desc">
                      {tr("history.order.newest")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {tr("history.order.hint")}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <LabeledField
                label={tr("session.timer")!}
                htmlFor="timer-min"
              >
                <Input
                  id="timer-min"
                  type="number"
                  min={0}
                  value={timerMinutes}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setTimerMinutes(
                      Number.isFinite(value) ? Math.max(0, value) : 0,
                    );
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {tr("session.timerHint")}
                </p>
              </LabeledField>
              <LabeledField
                label={tr("session.maxExercises")!}
                htmlFor="max-exercises"
              >
                <Input
                  id="max-exercises"
                  type="number"
                  min={0}
                  value={maxExercises}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setMaxExercises(
                      Number.isFinite(value) ? Math.max(0, value) : 0,
                    );
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {tr("session.maxExercisesHint")}
                </p>
              </LabeledField>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <ToggleRow
                id="feedback-sound"
                label={tr("feedback.sound")}
                description={tr("feedback.soundDesc")}
                checked={enableSound}
                onChange={setEnableSound}
              />
              <ToggleRow
                id="feedback-vibration"
                label={tr("feedback.vibration")}
                description={tr("feedback.vibrationDesc")}
                checked={enableVibration}
                onChange={setEnableVibration}
              />
            </div>

            <Alert className="mt-6 bg-background/40">
              <AlertDescription>{tr("telemetry.note")}</AlertDescription>
            </Alert>

            <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-2">
              <Button
                onClick={() => startSession()}
                disabled={!canStart}
                className="w-full sm:w-auto"
              >
                {tr("setup.start")}
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link to="/">{tr("actions.toMenu")}</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-muted/50 backdrop-blur rounded-2xl shadow-lg p-5 sm:p-8 sm:mt-6 flex-1 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)] gap-6 h-full min-h-0">
              <div className="flex flex-col min-h-0">
                {sessionEnded && (
                  <Alert className="mb-4">
                    <AlertDescription>
                      {endReason === "time" && tr("finished.time")}
                      {endReason === "ex" &&
                        tr("finished.exercises", { count: maxExercises })}
                      {endReason === "generator" && tr("finished.generator")}
                    </AlertDescription>
                  </Alert>
                )}

                <div
                  ref={focusRef}
                  tabIndex={-1}
                  className="flex flex-col gap-6 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatCard
                      label={tr("stats.correct")}
                      value={correctCount}
                    />
                    <StatCard label={tr("stats.wrong")} value={wrongCount} />
                    <StatCard
                      label={tr("stats.accuracy")}
                      value={`${accuracy}%`}
                    />
                    <StatCard
                      label={
                        timerMinutes > 0
                          ? tr("stats.timeLeft")
                          : tr("stats.time")
                      }
                      value={
                        timerMinutes > 0
                          ? formatTime(timeLeft)
                          : formatTime(elapsedSec)
                      }
                    />
                  </div>

                  {feedback && (
                    <div
                      className={`rounded-xl border px-4 py-3 text-sm font-medium ${feedback.type === "correct" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200" : "border-destructive/40 bg-destructive/10 text-destructive"}`}
                    >
                      {feedback.type === "correct"
                        ? tr("feedback.correct")
                        : tr("feedback.wrong", {
                            user: symbolLabel(feedback.userRelation, tr),
                            correct: symbolLabel(feedback.correctRelation, tr),
                          })}
                    </div>
                  )}

                  <div className="rounded-2xl border bg-background/40 p-6 text-center shadow-sm">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {tr("play.compare")}
                    </div>
                    <div
                      key={taskId}
                      className={cn(
                        "mt-4 grid grid-cols-3 items-center gap-4",
                        displaySizeClass,
                      )}
                    >
                      <span className="font-semibold break-words text-center">
                        {exercise?.left.display ?? ""}
                      </span>
                      <span className="font-semibold text-muted-foreground">
                        ?
                      </span>
                      <span className="font-semibold break-words text-center">
                        {exercise?.right.display ?? ""}
                      </span>
                    </div>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                      <Button
                        size="lg"
                        onClick={() => handleAnswer("<")}
                        disabled={sessionEnded}
                      >
                        &lt;
                      </Button>
                      <Button
                        size="lg"
                        onClick={() => handleAnswer("=")}
                        disabled={sessionEnded}
                      >
                        =
                      </Button>
                      <Button
                        size="lg"
                        onClick={() => handleAnswer(">")}
                        disabled={sessionEnded}
                      >
                        &gt;
                      </Button>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {tr("play.hotkeys")}
                    </p>
                  </div>
                </div>
              </div>

              <aside className="h-full overflow-hidden rounded-xl border bg-muted/40">
              <div className="flex items-center justify-between border-b bg-muted/60 px-4 py-3">
                <div className="text-base font-semibold">
                  {tr("history.title")}
                </div>
                <span className="text-xs text-muted-foreground">
                  {tr("history.total", { count: history.length })}
                </span>
              </div>
              <div className="h-[420px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/70 backdrop-blur">
                    <TableRow>
                      <TableHead className="w-10 text-center text-xs">
                        #
                      </TableHead>
                      <TableHead className="text-xs">
                        {tr("history.example")}
                      </TableHead>
                      <TableHead className="text-xs">
                        {tr("history.answer")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyDisplay.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="py-6 text-center text-sm text-muted-foreground"
                        >
                          {tr("history.empty")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      historyDisplay.map((entry, index) => (
                        <TableRow
                          key={entry.id}
                          className={entry.isCorrect ? "" : "bg-destructive/5"}
                        >
                          <TableCell className="text-center text-xs text-muted-foreground">
                            {historyOrder === "asc"
                              ? index + 1
                              : history.length - index}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium leading-tight">
                              {entry.left.display} ? {entry.right.display}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {tr("history.correct", {
                                relation: symbolLabel(
                                  entry.correctRelation,
                                  tr,
                                ),
                                left: entry.left.display,
                                right: entry.right.display,
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            {entry.isCorrect ? (
                              <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                {tr("history.result.correct", {
                                  relation: symbolLabel(entry.userRelation, tr),
                                })}
                              </div>
                            ) : (
                              <div className="grid gap-1 text-sm text-destructive">
                                <span>
                                  {tr("history.result.user", {
                                    relation: symbolLabel(
                                      entry.userRelation,
                                      tr,
                                    ),
                                  })}
                                </span>
                                <span>
                                  {tr("history.result.expected", {
                                    relation: symbolLabel(
                                      entry.correctRelation,
                                      tr,
                                    ),
                                  })}
                                </span>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function useAccurateTimer(active: boolean) {
  const [elapsedSec, setElapsedSec] = React.useState(0);
  const startRef = React.useRef<number | null>(null);
  const frameRef = React.useRef<number | null>(null);

  const step = React.useCallback((timestamp: number) => {
    if (startRef.current == null) {
      startRef.current = timestamp;
    }
    const seconds = Math.floor((timestamp - startRef.current) / 1000);
    setElapsedSec(seconds);
    frameRef.current = requestAnimationFrame(step);
  }, []);

  React.useEffect(() => {
    if (!active) {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      return;
    }
    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [active, step]);

  const reset = React.useCallback(() => {
    startRef.current = null;
    setElapsedSec(0);
  }, []);

  return { elapsedSec, reset };
}

function TypeCard({
  id,
  value,
  title,
  description,
  enabled,
  onEnabledChange,
  children,
  showAvailabilityError,
  availabilityText,
}: {
  id: string;
  value: ModeKey;
  title: string;
  description: string;
  enabled: boolean;
  onEnabledChange: (checked: boolean) => void;
  children: React.ReactNode;
  showAvailabilityError: boolean;
  availabilityText: string | null;
}) {
  return (
    <AccordionItem
      value={value}
      className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur"
    >
      <AccordionTrigger className="px-3 py-3 text-left text-sm font-medium hover:no-underline data-[state=open]:bg-muted/40 sm:px-5 sm:py-4 sm:text-base">
        <div className="flex w-full items-center gap-3">
          <div className="flex-1 text-left">
            <div className="text-sm font-semibold leading-tight sm:text-base">
              {title}
            </div>
            <p className="text-xs leading-snug text-muted-foreground sm:text-sm">
              {description}
            </p>
          </div>
          <Checkbox
            id={`${id}-toggle`}
            checked={enabled}
            onCheckedChange={(checked) => onEnabledChange(Boolean(checked))}
            aria-label={title}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          />
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-3 pb-4 sm:px-5">
        <fieldset
          disabled={!enabled}
          className={cn(
            "space-y-3 pt-3 sm:space-y-5 sm:pt-4",
            !enabled && "opacity-60",
          )}
        >
          {children}
        </fieldset>
        {showAvailabilityError && availabilityText && (
          <p className="pt-3 text-xs font-medium text-destructive">
            {availabilityText}
          </p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

function LabeledField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function GapFields({
  idPrefix,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  labelMin,
  labelMax,
  disabled = false,
}: {
  idPrefix: string;
  minValue: number;
  maxValue: number | null;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number | null) => void;
  labelMin: string;
  labelMax: string;
  disabled?: boolean;
}) {
  const minId = `${idPrefix}-gap-min`;
  const maxId = `${idPrefix}-gap-max`;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <LabeledField label={labelMin} htmlFor={minId}>
        <Input
          id={minId}
          type="number"
          min={0}
          step="0.1"
          value={minValue}
          disabled={disabled}
          onChange={(event) => {
            const value = Number(event.target.value);
            onMinChange(Number.isFinite(value) ? Math.max(0, value) : 0);
          }}
        />
      </LabeledField>
      <LabeledField label={labelMax} htmlFor={maxId}>
        <Input
          id={maxId}
          type="number"
          min={0}
          step="0.1"
          value={maxValue ?? ""}
          disabled={disabled}
          onChange={(event) => {
            if (event.target.value === "") {
              onMaxChange(null);
              return;
            }
            const value = Number(event.target.value);
            onMaxChange(Number.isFinite(value) ? Math.max(0, value) : null);
          }}
          placeholder="∞"
        />
      </LabeledField>
    </div>
  );
}

function WeightField({
  value,
  onChange,
  label,
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full"
        />
        <Input
          type="number"
          min={0}
          max={100}
          value={value}
          disabled={disabled}
          onChange={(event) => {
            const val = Number(event.target.value);
            onChange(
              Number.isFinite(val) ? Math.max(0, Math.min(100, val)) : value,
            );
          }}
          className="w-20"
        />
      </div>
    </div>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string | null;
  description: string | null;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm sm:px-3 sm:py-2.5">
      <div className="flex-1">
        <div className="font-medium leading-tight">{label}</div>
        {description && (
          <p className="text-xs text-muted-foreground leading-snug">
            {description}
          </p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={(value) => onChange(Boolean(value))}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string | null;
  value: number | string;
}) {
  return (
    <Card className="rounded-xl border shadow-sm min-w-20 py-0">
      <CardContent className="px-3 py-1.5">
        <div className="text-[11px] text-muted-foreground leading-tight">
          {label}
        </div>
        <div className="text-base font-semibold leading-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

function symbolLabel(
  relation: CompareRelation,
  translate: (key: string, options?: Record<string, unknown>) => string | null,
) {
  switch (relation) {
    case "<":
      return translate("symbols.less") ?? "<";
    case ">":
      return translate("symbols.greater") ?? ">";
    case "=":
      return translate("symbols.equal") ?? "=";
  }
}

function summarizeTypes(
  map: Record<CompareNumberTypeKey, boolean>,
  tr: (key: string, options?: Record<string, unknown>) => string | null,
) {
  const names: string[] = [];
  if (map.nonNegativeInt) names.push(tr("types.labels.nonNegative") ?? "");
  if (map.signedInt) names.push(tr("types.labels.signed") ?? "");
  if (map.decimal) names.push(tr("types.labels.decimal") ?? "");
  if (map.fraction) names.push(tr("types.labels.fraction") ?? "");
  if (names.length === 0) {
    return tr("types.labels.none") ?? "-";
  }
  return names.filter(Boolean).join(", ");
}
