import React from "react";
import { useTranslation } from "react-i18next";
import { QuizKeyboardPad } from "@/components/ui/quiz-keyboard-pad";
import { cn } from "@/lib/utils";
import type { CompareRelation } from "@/lib/compare-numbers/generator";
import type { CompareNumbersSessionState, HistoryEntry, HistoryOrder } from "../model/trainer.types";
import { formatTime, relationLabel, resolveDisplaySizeClass } from "../lib/format";
import { CompareNumbersHistoryTable } from "./CompareNumbersHistoryTable";
import { NotificationBanner, type NotificationPayload } from "./shared/NotificationBanner";
import { StatCard } from "./shared/StatCard";

interface CompareNumbersPlayScreenProps {
  session: CompareNumbersSessionState;
  historyDisplay: HistoryEntry[];
  historyOrder: HistoryOrder;
  maxExercises: number | null;
  elapsedSec: number;
  hasTimer: boolean;
  timeLeft: number | null;
  focusRef: React.RefObject<HTMLDivElement | null>;
  onAnswer: (relation: CompareRelation) => void;
}

export function CompareNumbersPlayScreen({
  session,
  historyDisplay,
  historyOrder,
  maxExercises,
  elapsedSec,
  hasTimer,
  timeLeft,
  focusRef,
  onAnswer,
}: CompareNumbersPlayScreenProps) {
  const { t } = useTranslation();
  const tr = React.useCallback((key: string, options?: Record<string, unknown>) => t(`cmpNmbrGm.${key}`, options), [t]);

  const totalExercises = session.history.length;
  const accuracy = totalExercises > 0 ? Math.round((session.correctCount / totalExercises) * 100) : 0;
  const sessionEnded = session.screen === "play" && session.gameOver;
  const displaySizeClass = React.useMemo(() => resolveDisplaySizeClass(session.exercise), [session.exercise]);

  const feedbackNotification = React.useMemo<NotificationPayload | null>(() => {
    if (!session.feedback) return null;
    if (session.feedback.type === "correct") {
      return {
        variant: "success",
        message: tr("feedback.correct"),
      };
    }
    return {
      variant: "error",
      message: tr("feedback.wrong", {
        user: relationLabel(session.feedback.userRelation, tr),
        correct: relationLabel(session.feedback.correctRelation, tr),
      }),
    };
  }, [session.feedback, tr]);

  const sessionNotification = React.useMemo<NotificationPayload | null>(() => {
    if (!sessionEnded || !session.endReason) {
      return null;
    }

    if (session.endReason === "time") {
      return {
        variant: "warning",
        message: tr("finished.time"),
      };
    }

    if (session.endReason === "ex") {
      return {
        variant: "info",
        message: tr("finished.exercises", {
          count: maxExercises ?? totalExercises,
        }),
      };
    }

    if (session.endReason === "generator") {
      return {
        variant: "warning",
        message: tr("finished.generator"),
      };
    }

    return null;
  }, [maxExercises, session.endReason, sessionEnded, totalExercises, tr]);

  const activeNotifications = React.useMemo(() => {
    if (sessionNotification) {
      return [sessionNotification];
    }

    return feedbackNotification ? [feedbackNotification] : [];
  }, [feedbackNotification, sessionNotification]);

  const relationOptions = React.useMemo(
    () => [
      { key: "less", value: "<" as const, label: "<", ariaLabel: relationLabel("<", tr) },
      { key: "equal", value: "=" as const, label: "=", ariaLabel: relationLabel("=", tr) },
      { key: "greater", value: ">" as const, label: ">", ariaLabel: relationLabel(">", tr) },
    ],
    [tr]
  );

  return (
    <div className="bg-muted/50 backdrop-blur rounded-2xl shadow-lg p-5 sm:p-8 sm:mt-6 flex-1 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)] gap-6 h-full min-h-0">
        <div className="flex flex-col min-h-0">
          <div
            ref={focusRef}
            tabIndex={-1}
            className="flex flex-col gap-6 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatCard label={tr("stats.correct")} value={session.correctCount} />
              <StatCard label={tr("stats.wrong")} value={session.wrongCount} />
              <StatCard label={tr("stats.accuracy")} value={`${accuracy}%`} />
              <StatCard
                label={hasTimer ? tr("stats.timeLeft") : tr("stats.time")}
                value={hasTimer ? formatTime(timeLeft ?? 0) : formatTime(elapsedSec)}
              />
            </div>

            {activeNotifications.length > 0 && (
              <div className="space-y-3">
                {activeNotifications.map((notification, index) => (
                  <NotificationBanner key={`${notification.variant}-${index}`} variant={notification.variant}>
                    {notification.message}
                  </NotificationBanner>
                ))}
              </div>
            )}

            <div className="rounded-2xl border bg-background/40 p-6 text-center shadow-sm">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{tr("play.compare")}</div>
              <div
                key={session.taskId}
                className={cn(
                  "mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center justify-items-center gap-2 sm:gap-4",
                  displaySizeClass
                )}
              >
                <span className="font-semibold whitespace-nowrap text-center leading-tight">
                  {session.exercise?.left.display ?? ""}
                </span>
                <span className="font-semibold text-muted-foreground">?</span>
                <span className="font-semibold whitespace-nowrap text-center leading-tight">
                  {session.exercise?.right.display ?? ""}
                </span>
              </div>

              <div className="mt-6 flex justify-center">
                <QuizKeyboardPad<CompareRelation>
                  taskId={session.taskId}
                  options={relationOptions}
                  onSelect={onAnswer}
                  disabled={sessionEnded}
                  columns={3}
                  hotkeysHint={tr("play.hotkeys")}
                />
              </div>
            </div>
          </div>
        </div>

        <CompareNumbersHistoryTable
          history={session.history}
          historyDisplay={historyDisplay}
          historyOrder={historyOrder}
          tr={tr}
        />
      </div>
    </div>
  );
}
