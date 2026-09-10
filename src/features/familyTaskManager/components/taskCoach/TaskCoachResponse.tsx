import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, Loader2, Maximize2, Minimize2, Pause, Play, RefreshCw, Volume2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TaskCoachState } from "../../models/enums";
import type { TaskCoachController } from "./useTaskCoachController";

export function TaskCoachResponse({ coach: c, isToday }: { coach: TaskCoachController; isToday: boolean }) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  const attachScroll = useCallback((element: HTMLDivElement | null) => {
    scrollRef.current = element;
    setScrollElement(element);
  }, []);
  const scrollPosition = useRef(0);
  const expandRef = useRef<HTMLButtonElement>(null);
  const [overflow, setOverflow] = useState(false);
  const open = c.coachVisible && c.responseOpen;
  useLayoutEffect(() => {
    scrollPosition.current = 0;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [c.advice, c.selectedProfileUuid]);
  useLayoutEffect(() => {
    const element = scrollElement;
    if (!element) return;
    element.scrollTop = scrollPosition.current;
    const measure = () => setOverflow(element.scrollHeight - element.clientHeight - element.scrollTop > 4);
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(element);
    if (element.firstElementChild) observer?.observe(element.firstElementChild);
    return () => observer?.disconnect();
  }, [open, c.expanded, c.advice, c.loading, scrollElement]);

  if (!open) return null;
  const title = c.selectedProfile?.displayName ?? t("familyTask.taskCoach.title", "Task Coach");
  const close = () => c.handleResponseToggle();
  const content = (
    <>
      <header className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-2">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl"
        >
          {c.selectedProfile?.avatarEmoji ?? "✨"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-muted-foreground">
            {t("familyTask.taskCoach.title", "Task Coach")}
          </p>
          {c.expanded ? (
            <DialogTitle className="text-base leading-snug [overflow-wrap:anywhere]">{title}</DialogTitle>
          ) : (
            <h2 className="font-semibold [overflow-wrap:anywhere]">{title}</h2>
          )}
        </div>
        <Button
          ref={expandRef}
          size="icon"
          variant="ghost"
          className="size-11 shrink-0 rounded-full"
          aria-label={
            c.expanded
              ? t("familyTask.taskCoach.collapse", "Compact view")
              : t("familyTask.taskCoach.expand", "Expand advice")
          }
          onClick={() => c.setExpanded(!c.expanded)}
        >
          {c.expanded ? <Minimize2 /> : <Maximize2 />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-11 shrink-0 rounded-full"
          aria-label={t("familyTask.taskCoach.closeAdvice", "Close advice")}
          onClick={close}
        >
          <X />
        </Button>
      </header>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={attachScroll}
          tabIndex={0}
          aria-label={t("familyTask.taskCoach.adviceContent", "Advice content")}
          className="min-h-0 overflow-y-auto overscroll-contain p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [overflow-wrap:anywhere]"
          onScroll={(event) => {
            const el = event.currentTarget;
            scrollPosition.current = el.scrollTop;
            setOverflow(el.scrollHeight - el.clientHeight - el.scrollTop > 4);
          }}
        >
          <div className="space-y-3">
            {c.inactiveHintVisible ? <p className="text-sm">{c.disabledHint}</p> : null}
            {isToday && c.selectableProfiles.length > 0 && !c.selectedProfileUuid ? (
              <p>{t("familyTask.taskCoach.chooseChild", "Who would like coaching?")}</p>
            ) : null}
            {c.selectableProfiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("familyTask.taskCoach.noChild", "No active child profile is available.")}
              </p>
            ) : null}
            <div role="status" className="empty:hidden">
              {c.loading ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 shrink-0 motion-safe:animate-spin" />
                  {c.advice
                    ? t("familyTask.taskCoach.updating", "Updating your plan…")
                    : t("familyTask.taskCoach.thinking", "Choosing a good next step...")}
                </p>
              ) : c.stale ? (
                <p className="text-sm text-muted-foreground">
                  {t("familyTask.taskCoach.stale", "Tasks changed. This advice needs an update.")}
                </p>
              ) : null}
            </div>
            {c.advice ? (
              <div lang={c.advice.responseLocale} className="space-y-3">
                {c.advice.planItems.length ? (
                  <>
                    {c.advice.appreciationText ? (
                      <p className="rounded-2xl bg-primary/8 px-3 py-3 text-sm leading-relaxed">
                        {c.advice.appreciationText}
                      </p>
                    ) : null}
                    <ol
                      className="space-y-2"
                      aria-label={t("familyTask.taskCoach.plan", {
                        lng: c.advice.responseLocale,
                        defaultValue: "Your task plan",
                      })}
                    >
                      {c.advice.planItems.map((item, index) => {
                        const selected = item.taskUuid === c.selectedPlanTaskUuid;
                        return (
                          <li key={item.taskUuid}>
                            <button
                              type="button"
                              className={`w-full rounded-2xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? "border-primary/60 bg-primary/5" : "border-border/70 bg-background/60 hover:bg-accent"}`}
                              aria-current={selected ? "step" : undefined}
                              onClick={() => {
                                c.setExpanded(false);
                                requestAnimationFrame(() => c.focusPlanTask(item.taskUuid));
                              }}
                            >
                              <span className="mb-1 block text-xs font-semibold text-primary">
                                {t(
                                  index === 0
                                    ? "familyTask.taskCoach.planNow"
                                    : index === 1
                                      ? "familyTask.taskCoach.planNext"
                                      : "familyTask.taskCoach.planAfterThat",
                                  {
                                    lng: c.advice!.responseLocale,
                                    defaultValue: index === 0 ? "Now" : index === 1 ? "Next" : "After that",
                                  }
                                )}
                              </span>
                              <span className="block text-base font-semibold leading-snug">{item.title}</span>
                              <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                                {item.guidanceText}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  </>
                ) : (
                  <div className="rounded-2xl bg-primary/5 p-4">
                    <span aria-hidden="true" className="mb-2 block text-2xl">
                      {c.advice.state === TaskCoachState.ALL_DONE
                        ? "🎉"
                        : c.advice.state === TaskCoachState.WAITING_FOR_APPROVAL
                          ? "⏳"
                          : "🌿"}
                    </span>
                    <p className="text-base leading-relaxed whitespace-pre-wrap">{c.advice.displayText}</p>
                  </div>
                )}
              </div>
            ) : null}
            {c.refreshPlanAvailable && !c.loading ? (
              <p className="text-sm font-medium">
                {t("familyTask.taskCoach.refreshPlanAvailable", "Nice work! Ready for an updated plan?")}
              </p>
            ) : null}
            {c.error ? (
              <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">
                <p>{t("familyTask.taskCoach.adviceError", "I couldn’t choose a task right now.")}</p>
                {c.selectedProfileUuid ? (
                  <Button
                    variant="outline"
                    className="min-h-11"
                    onClick={() => void c.requestAdvice(c.selectedProfileUuid!)}
                  >
                    {t("common.retry", "Retry")}
                  </Button>
                ) : null}
              </div>
            ) : null}
            {!c.showBubble ? (
              <p className="text-sm text-muted-foreground">
                {t("familyTask.taskCoach.noResponse", "Ask the cat when you’re ready for a new suggestion.")}
              </p>
            ) : null}
          </div>
        </div>
        {overflow ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 flex h-6 items-end justify-center bg-gradient-to-t from-card to-transparent"
          >
            <ChevronDown className="size-4 text-muted-foreground" />
          </div>
        ) : null}
      </div>
      {c.selectedProfileUuid && isToday ? (
        <footer className="shrink-0 space-y-1 border-t border-border/60 bg-muted/20 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            {c.advice && !c.loading ? (
              <div className="min-w-0 flex-1">
                {c.audioLoading ? (
                  <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-4 motion-safe:animate-spin" />
                    {t("familyTask.taskCoach.preparingVoice", "Preparing voice...")}
                  </p>
                ) : c.audioUrl ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="size-11 shrink-0 rounded-full"
                      onClick={c.audio.toggle}
                      aria-label={
                        c.audio.playing
                          ? t("familyTask.taskCoach.pauseVoice", "Pause voice")
                          : t("familyTask.taskCoach.playVoice", "Play voice")
                      }
                    >
                      {c.audio.playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                    </Button>
                    <div
                      role="progressbar"
                      aria-label={t("familyTask.taskCoach.voiceProgress", "Voice progress")}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(c.audio.progress * 100)}
                      className="h-1 min-w-8 flex-1 overflow-hidden rounded-full bg-muted"
                    >
                      <div className="h-full bg-primary" style={{ width: `${c.audio.progress * 100}%` }} />
                    </div>
                  </div>
                ) : !c.audioError ? (
                  <Button
                    variant="secondary"
                    className="min-h-11 rounded-full"
                    onClick={() => void c.requestSpeech(c.advice!, true)}
                  >
                    <Volume2 className="size-4" />
                    {t("familyTask.taskCoach.playVoice", "Play voice")}
                  </Button>
                ) : null}
              </div>
            ) : null}
            <Button
              variant="outline"
              className="ml-auto min-h-11 rounded-full"
              disabled={c.loading}
              onClick={() => void c.requestAdvice(c.selectedProfileUuid!)}
            >
              <RefreshCw className={`size-4 ${c.loading ? "motion-safe:animate-spin" : ""}`} />
              {c.refreshPlanAvailable
                ? t("familyTask.taskCoach.updatePlan", "Update my plan")
                : t("familyTask.taskCoach.refreshAdvice", "Refresh advice")}
            </Button>
          </div>
          {c.audioError && !c.loading ? (
            <div className="flex flex-wrap items-center gap-1 text-xs text-destructive">
              <span>{t("familyTask.taskCoach.voiceError", "Voice playback is unavailable.")}</span>
              <Button
                variant="ghost"
                className="min-h-11"
                onClick={() => c.advice && void c.requestSpeech(c.advice, true)}
              >
                {t("common.retry", "Retry")}
              </Button>
            </div>
          ) : null}
          {c.advice ? (
            <p className="text-[11px] text-muted-foreground">
              {t("familyTask.taskCoach.aiVoiceDisclosure", "Voice audio is AI-generated.")}
            </p>
          ) : null}
        </footer>
      ) : null}
    </>
  );

  return c.expanded ? (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) c.setExpanded(false);
      }}
    >
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          requestAnimationFrame(() => expandRef.current?.focus());
        }}
        className="pointer-events-auto top-auto bottom-0 left-0 flex h-[85dvh] max-h-[calc(100dvh-env(safe-area-inset-top))] w-full max-w-full translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-t-3xl rounded-b-none p-0 pb-[env(safe-area-inset-bottom)] sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:h-[min(46rem,85dvh)] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
      >
        {content}
      </DialogContent>
    </Dialog>
  ) : (
    <section
      id="task-coach-response"
      aria-label={t("familyTask.taskCoach.title", "Task Coach")}
      className="task-coach-response pointer-events-auto flex w-full flex-col overflow-hidden rounded-3xl border border-border/80 bg-card/95 shadow-xl backdrop-blur"
    >
      {content}
    </section>
  );
}
