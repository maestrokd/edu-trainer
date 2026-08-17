import React from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { RangeSettingsCard } from "./Setup/RangeSettingsCard";
import { SessionOptionsCard } from "./Setup/SessionOptionsCard";
import type { Mode } from "../model/trainer.types";

interface MultiplicationTrainerSetupScreenProps {
  minVal: number;
  maxVal: number;
  mode: Mode;
  includeMul: boolean;
  includeDiv: boolean;
  timerMinutes: number;
  maxExercises: number;
  onMinChange: (val: number) => void;
  onMaxChange: (val: number) => void;
  onModeChange: (val: Mode) => void;
  onMulChange: (val: boolean) => void;
  onDivChange: (val: boolean) => void;
  onTimerChange: (val: number) => void;
  onMaxExercisesChange: (val: number) => void;
  onStartClick: () => void;
  labels: {
    introText: React.ReactNode;
    range: string;
    rangeHint: string;
    min: string;
    max: string;
    mode: string;
    modeQuiz: string;
    modeInput: string;
    exercises: string;
    mul: string;
    div: string;
    timer: string;
    timerHint: string;
    maxExercises: string;
    maxExercisesHint: string;
    start: string;
    menu: string;
    ariaBackToMenu: string;
    ariaMin: string;
    ariaMax: string;
    ariaMode: string;
    ariaMul: string;
    ariaDiv: string;
    ariaTimer: string;
    ariaMaxExercises: string;
    moreInfo: (field: string) => string;
  };
  isInteractable: boolean;
}

export function MultiplicationTrainerSetupScreen({
  minVal,
  maxVal,
  mode,
  includeMul,
  includeDiv,
  timerMinutes,
  maxExercises,
  onMinChange,
  onMaxChange,
  onModeChange,
  onMulChange,
  onDivChange,
  onTimerChange,
  onMaxExercisesChange,
  onStartClick,
  labels,
  isInteractable,
}: MultiplicationTrainerSetupScreenProps) {
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col overflow-y-auto sm:rounded-2xl sm:bg-muted/50 sm:p-5 sm:shadow-lg sm:backdrop-blur md:p-8">
      <p className="hidden text-sm text-muted-foreground sm:block">{labels.introText}</p>

      <div className="grid gap-4 sm:mt-5 md:grid-cols-2 md:gap-0">
        <RangeSettingsCard
          minVal={minVal}
          maxVal={maxVal}
          includeMul={includeMul}
          includeDiv={includeDiv}
          onMinChange={onMinChange}
          onMaxChange={onMaxChange}
          onMulChange={onMulChange}
          onDivChange={onDivChange}
          labels={{
            range: labels.range,
            rangeHint: labels.rangeHint,
            min: labels.min,
            max: labels.max,
            exercises: labels.exercises,
            mul: labels.mul,
            div: labels.div,
            ariaMin: labels.ariaMin,
            ariaMax: labels.ariaMax,
            ariaMul: labels.ariaMul,
            ariaDiv: labels.ariaDiv,
            moreInfo: labels.moreInfo,
          }}
        />

        <SessionOptionsCard
          mode={mode}
          timerMinutes={timerMinutes}
          maxExercises={maxExercises}
          onModeChange={onModeChange}
          onTimerChange={onTimerChange}
          onMaxExercisesChange={onMaxExercisesChange}
          labels={{
            mode: labels.mode,
            modeQuiz: labels.modeQuiz,
            modeInput: labels.modeInput,
            timer: labels.timer,
            timerHint: labels.timerHint,
            maxExercises: labels.maxExercises,
            maxExercisesHint: labels.maxExercisesHint,
            ariaMode: labels.ariaMode,
            ariaTimer: labels.ariaTimer,
            ariaMaxExercises: labels.ariaMaxExercises,
            moreInfo: labels.moreInfo,
          }}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:flex sm:justify-end">
        <Button onClick={onStartClick} className="h-10 w-full sm:w-auto" disabled={!isInteractable}>
          {labels.start}
        </Button>
        <Button asChild variant="outline" className="h-10 w-full sm:w-auto">
          <Link to="/" aria-label={labels.ariaBackToMenu}>
            {labels.menu}
          </Link>
        </Button>
      </div>
    </div>
  );
}
