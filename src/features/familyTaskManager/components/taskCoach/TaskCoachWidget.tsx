import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Eye,
  EyeOff,
  Loader2,
  MessageCircle,
  RefreshCw,
  Settings2,
  Sparkles,
  Users,
  Volume2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import AudioPlayerBubble from "@/components/english-coach/AudioPlayerBubble";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { taskCoachApi } from "../../api/taskCoachApi";
import { TaskCoachMascotCue, TaskCoachState } from "../../models/enums";
import type { ChildProfileDto, TaskCoachAdviceDto } from "../../models/dto";
import { TASK_COACH_CHARACTER_IDS, type TaskCoachCharacterId } from "../../models/taskCoachCharacter";
import {
  loadTaskCoachAutoplay,
  loadTaskCoachAutoRequest,
  loadTaskCoachCharacter,
  loadTaskCoachCompletionRefreshMode,
  saveTaskCoachAutoplay,
  saveTaskCoachAutoRequest,
  saveTaskCoachCharacter,
  saveTaskCoachCompletionRefreshMode,
  TASK_COACH_COMPLETION_REFRESH_MODES,
  type TaskCoachCompletionRefreshMode,
} from "../../services/taskCoachPreferences";
import type { AssistantCharacterState } from "./TaskCoachCharacter";
import { TaskCoachCharacterLoader } from "./TaskCoachCharacterLoader";
import { getTaskCoachCharacter, TASK_COACH_CHARACTER_LICENSE_URL } from "./taskCoachCharacters";

export interface TaskCoachSuccessEvent {
  id: number;
  profileUuid: string;
  starsAwarded: number;
}

interface TaskCoachWidgetProps {
  isToday: boolean;
  activeProfiles: ChildProfileDto[];
  profileFilter: string[];
  isSecondary: boolean;
  ownProfileUuid: string | null;
  successEvent?: TaskCoachSuccessEvent | null;
  onRecommendation: (taskUuid: string | null) => void;
  onVisibilityChange?: (visible: boolean) => void;
}

const SUCCESS_DURATION_MS = 2_500;
const COMPLETION_REFRESH_OPTION_COPY: Record<
  TaskCoachCompletionRefreshMode,
  { translationKey: string; fallback: string }
> = {
  AUTO: { translationKey: "familyTask.taskCoach.completionRefreshAuto", fallback: "Refresh automatically" },
  PROMPT: { translationKey: "familyTask.taskCoach.completionRefreshPrompt", fallback: "Offer a refresh button" },
  MANUAL: { translationKey: "familyTask.taskCoach.completionRefreshManual", fallback: "Wait for character click" },
};

export function TaskCoachWidget({
  isToday,
  activeProfiles,
  profileFilter,
  isSecondary,
  ownProfileUuid,
  successEvent,
  onRecommendation,
  onVisibilityChange,
}: TaskCoachWidgetProps) {
  const { t } = useTranslation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [childSelectorOpen, setChildSelectorOpen] = useState(false);
  const [responseOpen, setResponseOpen] = useState(false);
  const [coachVisible, setCoachVisible] = useState(true);
  const [selectedProfileUuid, setSelectedProfileUuid] = useState<string | null>(null);
  const [advice, setAdvice] = useState<TaskCoachAdviceDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [autoplay, setAutoplay] = useState(loadTaskCoachAutoplay);
  const [autoRequestAdvice, setAutoRequestAdvice] = useState(loadTaskCoachAutoRequest);
  const [selectedCharacterId, setSelectedCharacterId] = useState(loadTaskCoachCharacter);
  const [completionRefreshMode, setCompletionRefreshMode] = useState(loadTaskCoachCompletionRefreshMode);
  const [selectedPlanTaskUuid, setSelectedPlanTaskUuid] = useState<string | null>(null);
  const [refreshPlanAvailable, setRefreshPlanAvailable] = useState(false);
  const [autoPlayLoadedAudio, setAutoPlayLoadedAudio] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [inactiveHintVisible, setInactiveHintVisible] = useState(false);
  const audioUrlRef = useRef<string | null>(null);
  const adviceRequestIdRef = useRef(0);
  const speechRequestIdRef = useRef(0);
  const lastAutoRequestProfileRef = useRef<string | null>(null);
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handledSuccessEventIdRef = useRef<number | null>(null);
  const pendingCompletionActionRef = useRef<"AUTO" | "PROMPT" | null>(null);
  const completionRefreshInFlightRef = useRef(false);

  const automaticProfileUuid = useMemo(() => {
    if (isSecondary) {
      return ownProfileUuid;
    }
    if (profileFilter.length === 1) {
      return profileFilter[0];
    }
    return activeProfiles.length === 1 ? activeProfiles[0].profileUuid : null;
  }, [activeProfiles, isSecondary, ownProfileUuid, profileFilter]);

  const selectableProfiles = useMemo(() => {
    if (isSecondary) {
      return activeProfiles.filter((profile) => profile.profileUuid === ownProfileUuid);
    }
    if (profileFilter.length > 0) {
      const selected = new Set(profileFilter);
      return activeProfiles.filter((profile) => selected.has(profile.profileUuid));
    }
    return activeProfiles;
  }, [activeProfiles, isSecondary, ownProfileUuid, profileFilter]);
  const selectedProfile = selectableProfiles.find((profile) => profile.profileUuid === selectedProfileUuid);
  const selectedCharacter = getTaskCoachCharacter(selectedCharacterId);

  const replaceAudioUrl = useCallback((nextUrl: string | null) => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
    }
    audioUrlRef.current = nextUrl;
    setAudioUrl(nextUrl);
  }, []);

  const stopCelebrating = useCallback(() => {
    if (celebrationTimerRef.current) {
      clearTimeout(celebrationTimerRef.current);
      celebrationTimerRef.current = null;
    }
    setCelebrating(false);
  }, []);

  const celebrate = useCallback(() => {
    if (celebrationTimerRef.current) {
      clearTimeout(celebrationTimerRef.current);
    }
    setCelebrating(true);
    celebrationTimerRef.current = setTimeout(() => {
      celebrationTimerRef.current = null;
      setCelebrating(false);
    }, SUCCESS_DURATION_MS);
  }, []);

  const resetCoachResult = useCallback(() => {
    adviceRequestIdRef.current += 1;
    speechRequestIdRef.current += 1;
    setAdvice(null);
    setLoading(false);
    setError(false);
    setAudioLoading(false);
    setAudioError(false);
    setSpeaking(false);
    setAutoPlayLoadedAudio(false);
    setSelectedPlanTaskUuid(null);
    setRefreshPlanAvailable(false);
    pendingCompletionActionRef.current = null;
    completionRefreshInFlightRef.current = false;
    replaceAudioUrl(null);
    stopCelebrating();
    onRecommendation(null);
  }, [onRecommendation, replaceAudioUrl, stopCelebrating]);

  useEffect(
    () => () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    const selectableProfileUuidSet = new Set(selectableProfiles.map((profile) => profile.profileUuid));
    if (selectedProfileUuid && selectableProfileUuidSet.has(selectedProfileUuid)) {
      return;
    }

    const nextProfileUuid =
      automaticProfileUuid && selectableProfileUuidSet.has(automaticProfileUuid) ? automaticProfileUuid : null;
    if (nextProfileUuid !== selectedProfileUuid) {
      resetCoachResult();
      setSelectedProfileUuid(nextProfileUuid);
    }
  }, [automaticProfileUuid, resetCoachResult, selectableProfiles, selectedProfileUuid]);

  useEffect(() => {
    if (!coachVisible) {
      return;
    }

    if (selectableProfiles.length === 0) {
      setChildSelectorOpen(false);
      setResponseOpen(true);
      return;
    }

    if (isToday && !selectedProfileUuid && !automaticProfileUuid) {
      setChildSelectorOpen(true);
      setResponseOpen(false);
    }
  }, [automaticProfileUuid, coachVisible, isToday, selectableProfiles.length, selectedProfileUuid]);

  useEffect(() => {
    if (isToday) {
      setInactiveHintVisible(false);
      return;
    }

    lastAutoRequestProfileRef.current = null;
    resetCoachResult();
  }, [isToday, resetCoachResult]);

  const requestSpeech = useCallback(
    async (nextAdvice: TaskCoachAdviceDto, shouldAutoPlay: boolean) => {
      const requestId = speechRequestIdRef.current + 1;
      speechRequestIdRef.current = requestId;
      setAudioLoading(true);
      setAudioError(false);
      setAutoPlayLoadedAudio(shouldAutoPlay);
      try {
        const audio = await taskCoachApi.synthesizeSpeech(nextAdvice.profileUuid, nextAdvice.speechText);
        if (speechRequestIdRef.current !== requestId) {
          return;
        }
        replaceAudioUrl(URL.createObjectURL(audio));
      } catch {
        if (speechRequestIdRef.current === requestId) {
          setAudioError(true);
        }
      } finally {
        if (speechRequestIdRef.current === requestId) {
          setAudioLoading(false);
        }
      }
    },
    [replaceAudioUrl]
  );

  const focusPlanTask = useCallback(
    (taskUuid: string | null) => {
      setSelectedPlanTaskUuid(taskUuid);
      onRecommendation(taskUuid);
      if (!taskUuid) {
        return;
      }
      requestAnimationFrame(() => {
        const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
        document.getElementById(`family-task-${taskUuid}`)?.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "center",
          inline: "center",
        });
      });
    },
    [onRecommendation]
  );

  const requestAdvice = useCallback(
    async (profileUuid: string) => {
      const requestId = adviceRequestIdRef.current + 1;
      adviceRequestIdRef.current = requestId;
      speechRequestIdRef.current += 1;
      setResponseOpen(true);
      setChildSelectorOpen(false);
      setLoading(true);
      setError(false);
      setAdvice(null);
      setSpeaking(false);
      setAudioLoading(false);
      setAudioError(false);
      setRefreshPlanAvailable(false);
      pendingCompletionActionRef.current = null;
      replaceAudioUrl(null);
      stopCelebrating();
      focusPlanTask(null);
      try {
        const nextAdvice = await taskCoachApi.getAdvice(profileUuid);
        if (adviceRequestIdRef.current !== requestId) {
          return;
        }
        setAdvice(nextAdvice);
        const recommendedTaskUuid = nextAdvice.recommendedTaskUuids[0] ?? null;
        focusPlanTask(recommendedTaskUuid);
        if (nextAdvice.state === TaskCoachState.ALL_DONE || nextAdvice.mascotCue === TaskCoachMascotCue.CELEBRATING) {
          celebrate();
        }
        if (autoplay) {
          void requestSpeech(nextAdvice, true);
        }
      } catch {
        if (adviceRequestIdRef.current === requestId) {
          setError(true);
        }
      } finally {
        if (adviceRequestIdRef.current === requestId) {
          setLoading(false);
          completionRefreshInFlightRef.current = false;
        }
      }
    },
    [autoplay, celebrate, focusPlanTask, replaceAudioUrl, requestSpeech, stopCelebrating]
  );

  useEffect(() => {
    if (!coachVisible) {
      return;
    }
    if (!isToday) {
      lastAutoRequestProfileRef.current = null;
      return;
    }
    if (!selectedProfileUuid) {
      lastAutoRequestProfileRef.current = null;
      return;
    }
    if (!autoRequestAdvice) {
      lastAutoRequestProfileRef.current = selectedProfileUuid;
      return;
    }
    if (lastAutoRequestProfileRef.current === selectedProfileUuid) {
      return;
    }

    lastAutoRequestProfileRef.current = selectedProfileUuid;
    void requestAdvice(selectedProfileUuid);
  }, [autoRequestAdvice, coachVisible, isToday, requestAdvice, selectedProfileUuid]);

  useEffect(() => {
    if (!successEvent || handledSuccessEventIdRef.current === successEvent.id) {
      return;
    }
    handledSuccessEventIdRef.current = successEvent.id;
    if (!isToday) {
      return;
    }
    celebrate();
    if (!selectedProfileUuid || successEvent.profileUuid !== selectedProfileUuid) {
      return;
    }

    if (completionRefreshMode === "AUTO") {
      setRefreshPlanAvailable(false);
      if (coachVisible) {
        completionRefreshInFlightRef.current = true;
        void requestAdvice(selectedProfileUuid);
      } else {
        pendingCompletionActionRef.current = "AUTO";
      }
      return;
    }

    if (completionRefreshMode === "PROMPT") {
      if (coachVisible) {
        setRefreshPlanAvailable(true);
        setResponseOpen(true);
        setChildSelectorOpen(false);
      } else {
        pendingCompletionActionRef.current = "PROMPT";
      }
    }
  }, [celebrate, coachVisible, completionRefreshMode, isToday, requestAdvice, selectedProfileUuid, successEvent]);

  const handleProfileChange = (profileUuid: string) => {
    setChildSelectorOpen(false);
    if (profileUuid === selectedProfileUuid) {
      return;
    }
    setResponseOpen(false);
    resetCoachResult();
    setSelectedProfileUuid(profileUuid);
  };

  const handleCharacterClick = () => {
    if (!isToday) {
      setInactiveHintVisible(true);
      setResponseOpen(true);
      setChildSelectorOpen(false);
      return;
    }
    if (!selectedProfileUuid) {
      setChildSelectorOpen(selectableProfiles.length > 0);
      setResponseOpen(selectableProfiles.length === 0);
      return;
    }
    if (loading) {
      return;
    }
    void requestAdvice(selectedProfileUuid);
  };

  const handleChildSelectorToggle = () => {
    setChildSelectorOpen((open) => {
      const nextOpen = !open;
      if (nextOpen) {
        setResponseOpen(false);
        setSpeaking(false);
      }
      return nextOpen;
    });
  };

  const handleResponseToggle = () => {
    setResponseOpen((open) => {
      const nextOpen = !open;
      if (nextOpen) {
        setChildSelectorOpen(false);
      } else {
        setSpeaking(false);
      }
      return nextOpen;
    });
  };

  const handleSettingsOpenChange = (open: boolean) => {
    setSettingsOpen(open);
    if (open) {
      setChildSelectorOpen(false);
      setResponseOpen(false);
      setSpeaking(false);
    }
  };

  const handleAutoplayChange = (enabled: boolean) => {
    setAutoplay(enabled);
    saveTaskCoachAutoplay(enabled);
    if (enabled && advice && !audioUrl && !audioLoading) {
      void requestSpeech(advice, true);
    }
  };

  const handleAutoRequestChange = (enabled: boolean) => {
    if (selectedProfileUuid) {
      lastAutoRequestProfileRef.current = selectedProfileUuid;
    }
    setAutoRequestAdvice(enabled);
    saveTaskCoachAutoRequest(enabled);
  };

  const handleCharacterChange = (characterId: TaskCoachCharacterId) => {
    setSelectedCharacterId(characterId);
    saveTaskCoachCharacter(characterId);
  };

  const handleCompletionRefreshModeChange = (mode: TaskCoachCompletionRefreshMode) => {
    setCompletionRefreshMode(mode);
    saveTaskCoachCompletionRefreshMode(mode);
  };

  const hideCoach = () => {
    const adviceWasLoading = loading;
    adviceRequestIdRef.current += 1;
    speechRequestIdRef.current += 1;
    if (adviceWasLoading) {
      lastAutoRequestProfileRef.current = null;
    }
    if (completionRefreshInFlightRef.current) {
      pendingCompletionActionRef.current = "AUTO";
      completionRefreshInFlightRef.current = false;
    }
    setLoading(false);
    setAudioLoading(false);
    setSpeaking(false);
    setInteracting(false);
    setAutoPlayLoadedAudio(false);
    setResponseOpen(false);
    setChildSelectorOpen(false);
    setSettingsOpen(false);
    setCoachVisible(false);
    onVisibilityChange?.(false);
  };

  const showCoach = () => {
    setCoachVisible(true);
    onVisibilityChange?.(true);
    const pendingCompletionAction = pendingCompletionActionRef.current;
    pendingCompletionActionRef.current = null;
    if (pendingCompletionAction === "AUTO" && selectedProfileUuid) {
      lastAutoRequestProfileRef.current = selectedProfileUuid;
      completionRefreshInFlightRef.current = true;
      void requestAdvice(selectedProfileUuid);
      return;
    }
    if (pendingCompletionAction === "PROMPT") {
      setRefreshPlanAvailable(true);
      setResponseOpen(true);
      setChildSelectorOpen(false);
      return;
    }
    if (advice && autoplay && !audioUrl && !audioLoading) {
      void requestSpeech(advice, false);
    }
  };

  const characterState: AssistantCharacterState = !isToday
    ? "SLEEPING"
    : loading
      ? "THINKING"
      : speaking
        ? "SPEAKING"
        : error || audioError
          ? "ERROR"
          : celebrating
            ? "SUCCESS"
            : interacting
              ? "LISTENING"
              : "IDLE";

  const disabledHint = t("familyTask.taskCoach.todayOnly", "Task Coach is available while viewing today’s tasks.");
  const characterActionLabel = !isToday
    ? disabledHint
    : selectedProfileUuid
      ? t("familyTask.taskCoach.refresh", "Ask the cat for fresh advice")
      : t("familyTask.taskCoach.chooseChild", "Who would like coaching?");

  const showBubble =
    loading ||
    Boolean(advice) ||
    refreshPlanAvailable ||
    error ||
    inactiveHintVisible ||
    (isToday && selectableProfiles.length > 0 && !selectedProfileUuid) ||
    selectableProfiles.length === 0;
  const childSelectorLabel = childSelectorOpen
    ? t("familyTask.taskCoach.hideChildSelector", "Hide child selector")
    : t("familyTask.taskCoach.showChildSelector", "Choose or change child");
  const responseToggleLabel = responseOpen
    ? t("familyTask.taskCoach.hideResponse", "Hide latest response")
    : t("familyTask.taskCoach.showResponse", "Show latest response");
  const visibilityToggleLabel = coachVisible
    ? t("familyTask.taskCoach.hideCoach", "Hide Task Coach")
    : t("familyTask.taskCoach.showCoach", "Show Task Coach");

  return (
    <div className="pointer-events-none fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-[calc(1rem+env(safe-area-inset-right))] z-40 flex w-[min(22rem,calc(100vw-2rem))] flex-col items-end gap-2">
      {coachVisible && responseOpen ? (
        <div
          id="task-coach-response"
          className="pointer-events-auto max-h-[min(30rem,calc(100vh-13rem))] w-full overflow-y-auto overscroll-contain rounded-2xl border border-border/80 bg-card/95 p-3 shadow-xl backdrop-blur"
          aria-live="polite"
        >
          {inactiveHintVisible ? <p className="text-sm font-medium">{disabledHint}</p> : null}
          {isToday && selectableProfiles.length > 0 && !selectedProfileUuid ? (
            <p className="text-sm font-medium">{t("familyTask.taskCoach.chooseChild", "Who would like coaching?")}</p>
          ) : null}
          {selectableProfiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("familyTask.taskCoach.noChild", "No active child profile is available.")}
            </p>
          ) : null}
          {loading ? (
            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t("familyTask.taskCoach.thinking", "Choosing a good next step...")}
            </p>
          ) : null}
          {advice ? (
            advice.planItems.length > 0 ? (
              <div className="space-y-2.5">
                {advice.appreciationText ? (
                  <p className="rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium leading-relaxed text-primary">
                    {advice.appreciationText}
                  </p>
                ) : null}
                <div
                  className="space-y-1.5"
                  role="list"
                  aria-label={t("familyTask.taskCoach.plan", {
                    lng: advice.responseLocale,
                    defaultValue: "Your task plan",
                  })}
                >
                  {advice.planItems.map((item, index) => {
                    const selected = item.taskUuid === selectedPlanTaskUuid;
                    const label = t(
                      index === 0
                        ? "familyTask.taskCoach.planNow"
                        : index === 1
                          ? "familyTask.taskCoach.planNext"
                          : "familyTask.taskCoach.planAfterThat",
                      {
                        lng: advice.responseLocale,
                        defaultValue: index === 0 ? "Now" : index === 1 ? "Next" : "After that",
                      }
                    );
                    return (
                      <div key={item.taskUuid} role="listitem">
                        <button
                          type="button"
                          className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                            selected
                              ? "border-primary bg-primary/10 ring-1 ring-primary"
                              : "border-border/70 bg-background/65 hover:border-primary/60 hover:bg-primary/5"
                          }`}
                          aria-current={selected ? "step" : undefined}
                          onClick={() => focusPlanTask(item.taskUuid)}
                        >
                          <span className="block text-[11px] font-semibold uppercase tracking-wide text-primary">
                            {label}
                          </span>
                          <span className="block font-semibold leading-tight text-foreground">{item.title}</span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                            {item.guidanceText}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-base font-medium leading-relaxed">{advice.displayText}</p>
            )
          ) : null}
          {refreshPlanAvailable && selectedProfileUuid ? (
            <div className="mt-2 space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-2.5">
              <p className="text-sm font-medium">
                {t("familyTask.taskCoach.refreshPlanAvailable", "Nice work! Ready for an updated plan?")}
              </p>
              <Button size="sm" onClick={() => void requestAdvice(selectedProfileUuid)}>
                <RefreshCw className="size-3.5" />
                {t("familyTask.taskCoach.updatePlan", "Update my plan")}
              </Button>
            </div>
          ) : null}
          {error ? (
            <div className="flex flex-wrap items-center gap-2 text-sm text-destructive">
              <span>{t("familyTask.taskCoach.adviceError", "I couldn’t choose a task right now.")}</span>
              {selectedProfileUuid ? (
                <Button variant="outline" size="sm" onClick={() => void requestAdvice(selectedProfileUuid)}>
                  <RefreshCw className="size-3.5" />
                  {t("common.retry", "Retry")}
                </Button>
              ) : null}
            </div>
          ) : null}
          {!showBubble ? (
            <p className="text-sm text-muted-foreground">
              {t("familyTask.taskCoach.noResponse", "Ask the cat when you’re ready for a new suggestion.")}
            </p>
          ) : null}
          {advice ? (
            <div className="mt-2 space-y-2">
              {audioLoading ? (
                <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  {t("familyTask.taskCoach.preparingVoice", "Preparing voice...")}
                </p>
              ) : null}
              {audioUrl ? (
                <AudioPlayerBubble
                  audioUrl={audioUrl}
                  autoPlay={autoPlayLoadedAudio}
                  onPlay={() => setSpeaking(true)}
                  onPause={() => setSpeaking(false)}
                  onEnded={() => setSpeaking(false)}
                  onPlaybackError={() => {
                    setSpeaking(false);
                    setAudioError(true);
                  }}
                  onRetry={() => void requestSpeech(advice, autoplay)}
                />
              ) : !audioLoading && !audioError && !autoplay ? (
                <Button size="sm" variant="outline" onClick={() => void requestSpeech(advice, true)}>
                  <Volume2 className="size-4" />
                  {t("familyTask.taskCoach.playVoice", "Play voice")}
                </Button>
              ) : null}
              {audioError ? (
                <div className="flex flex-wrap items-center gap-2 text-xs text-destructive">
                  <span>{t("familyTask.taskCoach.voiceError", "Voice playback is unavailable.")}</span>
                  <button className="underline" onClick={() => void requestSpeech(advice, autoplay)}>
                    {t("common.retry", "Retry")}
                  </button>
                </div>
              ) : null}
              <p className="text-[11px] text-muted-foreground">
                {t("familyTask.taskCoach.aiVoiceDisclosure", "Voice audio is AI-generated.")}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {coachVisible && childSelectorOpen && selectableProfiles.length > 0 ? (
        <div
          id="task-coach-child-selector"
          className="pointer-events-auto w-full rounded-2xl border bg-card/95 p-2 shadow-lg backdrop-blur"
          role="radiogroup"
          aria-label={t("familyTask.taskCoach.childSelector", "Choose a child for Task Coach")}
        >
          <p className="px-1 pb-1.5 text-xs font-medium text-muted-foreground">
            {t("familyTask.taskCoach.chooseChild", "Who would like coaching?")}
          </p>
          <div className="max-h-[min(18rem,40vh)] space-y-1 overflow-y-auto overscroll-contain pr-1">
            {selectableProfiles.map((profile) => {
              const selected = profile.profileUuid === selectedProfileUuid;
              return (
                <Button
                  key={profile.profileUuid}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  variant={selected ? "default" : "ghost"}
                  size="sm"
                  disabled={!isToday}
                  className="w-full justify-start rounded-xl px-3"
                  onClick={() => handleProfileChange(profile.profileUuid)}
                >
                  <span aria-hidden="true">{profile.avatarEmoji ?? "🧒"}</span>
                  <span className="min-w-0 flex-1 truncate text-left">{profile.displayName}</span>
                  {selected ? <Check className="ml-auto size-4" aria-hidden="true" /> : null}
                </Button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className={coachVisible ? "relative h-[10.5rem] w-28 sm:w-32" : "relative size-9"}>
        <div
          data-slot="task-coach-actions"
          className="pointer-events-auto absolute bottom-0 right-0 z-10 flex flex-col gap-2"
        >
          {coachVisible ? (
            <>
              <Button
                type="button"
                size="icon"
                variant={responseOpen ? "default" : "secondary"}
                className="relative size-9 rounded-full shadow-md"
                aria-label={responseToggleLabel}
                title={responseToggleLabel}
                aria-expanded={responseOpen}
                aria-controls="task-coach-response"
                onClick={handleResponseToggle}
              >
                <MessageCircle className="size-4" />
                {showBubble && !responseOpen ? (
                  <span
                    className="absolute right-0 top-0 size-2.5 rounded-full border-2 border-card bg-primary"
                    aria-hidden="true"
                  />
                ) : null}
              </Button>

              {selectableProfiles.length > 0 ? (
                <Button
                  type="button"
                  size="icon"
                  variant={childSelectorOpen ? "default" : "secondary"}
                  className="size-9 rounded-full shadow-md"
                  aria-label={childSelectorLabel}
                  title={childSelectorLabel}
                  aria-expanded={childSelectorOpen}
                  aria-controls="task-coach-child-selector"
                  onClick={handleChildSelectorToggle}
                >
                  {selectedProfile ? (
                    <span className="text-base leading-none" aria-hidden="true">
                      {selectedProfile.avatarEmoji ?? "🧒"}
                    </span>
                  ) : (
                    <Users className="size-4" />
                  )}
                </Button>
              ) : null}

              <Dialog open={settingsOpen} onOpenChange={handleSettingsOpenChange}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="size-9 rounded-full shadow-md"
                    aria-label={t("familyTask.taskCoach.settings", "Task Coach settings")}
                    title={t("familyTask.taskCoach.settings", "Task Coach settings")}
                  >
                    <Settings2 className="size-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles className="size-5 text-primary" />
                      {t("familyTask.taskCoach.settings", "Task Coach settings")}
                    </DialogTitle>
                    <DialogDescription>
                      {t(
                        "familyTask.taskCoach.settingsDescription",
                        "Choose your character and when advice and voice are generated."
                      )}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3">
                    <div className="space-y-2 rounded-xl border bg-muted/35 px-3 py-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="task-coach-character">{t("familyTask.taskCoach.character", "Character")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t(
                            "familyTask.taskCoach.characterHint",
                            "Choose the character that stays with you on the task calendar."
                          )}
                        </p>
                      </div>
                      <Select
                        value={selectedCharacterId}
                        onValueChange={(value) => handleCharacterChange(value as TaskCoachCharacterId)}
                      >
                        <SelectTrigger id="task-coach-character" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_COACH_CHARACTER_IDS.map((characterId) => {
                            const character = getTaskCoachCharacter(characterId);
                            return (
                              <SelectItem key={characterId} value={characterId}>
                                {t(character.nameTranslationKey, character.nameFallback)}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/35 px-3 py-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="task-coach-auto-request" className="cursor-pointer">
                          {t("familyTask.taskCoach.autoRequest", "Automatically get advice")}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t(
                            "familyTask.taskCoach.autoRequestHint",
                            "Runs once when Task Coach activates or you change children. The cat always supports manual refresh."
                          )}
                        </p>
                      </div>
                      <Switch
                        id="task-coach-auto-request"
                        checked={autoRequestAdvice}
                        onCheckedChange={handleAutoRequestChange}
                      />
                    </div>

                    <div className="space-y-2 rounded-xl border bg-muted/35 px-3 py-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="task-coach-completion-refresh">
                          {t("familyTask.taskCoach.completionRefresh", "After task completion")}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t(
                            "familyTask.taskCoach.completionRefreshHint",
                            "Choose when the coach updates appreciation and the next plan."
                          )}
                        </p>
                      </div>
                      <Select
                        value={completionRefreshMode}
                        onValueChange={(value) =>
                          handleCompletionRefreshModeChange(value as TaskCoachCompletionRefreshMode)
                        }
                      >
                        <SelectTrigger id="task-coach-completion-refresh" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_COACH_COMPLETION_REFRESH_MODES.map((mode) => {
                            const copy = COMPLETION_REFRESH_OPTION_COPY[mode];
                            return (
                              <SelectItem key={mode} value={mode}>
                                {t(copy.translationKey, copy.fallback)}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/35 px-3 py-2">
                      <Label htmlFor="task-coach-autoplay" className="cursor-pointer">
                        {t("familyTask.taskCoach.autoplay", "Play voice automatically")}
                      </Label>
                      <Switch id="task-coach-autoplay" checked={autoplay} onCheckedChange={handleAutoplayChange} />
                    </div>
                  </div>

                  <div className="space-y-1.5 rounded-xl border px-3 py-2 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">
                      {t("familyTask.taskCoach.characterCredit", "Character credit")}
                    </p>
                    <p>{selectedCharacter.attribution.title}</p>
                    <p>
                      {t("familyTask.taskCoach.createdBy", "Created by")} {selectedCharacter.attribution.creator}
                    </p>
                    <p>
                      <a
                        className="underline"
                        href={selectedCharacter.attribution.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t("familyTask.taskCoach.marketplaceSource", "Character listing on the Rive Marketplace")}
                      </a>
                    </p>
                    {selectedCharacter.attribution.remix ? (
                      <>
                        <p>
                          {t("familyTask.taskCoach.remixOf", "Remix of")} {selectedCharacter.attribution.remix.title}{" "}
                          {t("familyTask.taskCoach.byCreator", "by")} {selectedCharacter.attribution.remix.creator}
                        </p>
                        <p>
                          <a
                            className="underline"
                            href={selectedCharacter.attribution.remix.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t("familyTask.taskCoach.remixSource", "Original character source")}
                          </a>
                        </p>
                      </>
                    ) : null}
                    <p>
                      <a className="underline" href={TASK_COACH_CHARACTER_LICENSE_URL} target="_blank" rel="noreferrer">
                        {t(
                          "familyTask.taskCoach.characterLicense",
                          "Licensed under Creative Commons Attribution 4.0 International (CC BY 4.0)"
                        )}
                      </a>
                    </p>
                    <p>{t("familyTask.taskCoach.characterAdapted", "Adapted for use in Kids Task Calendar.")}</p>
                    <p>
                      {t(
                        "familyTask.taskCoach.noEndorsement",
                        "The character creators do not endorse Kids Task Calendar."
                      )}
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : null}

          <Button
            data-slot="task-coach-visibility-toggle"
            type="button"
            size="icon"
            variant="secondary"
            className="size-9 rounded-full shadow-md"
            aria-label={visibilityToggleLabel}
            title={visibilityToggleLabel}
            onClick={coachVisible ? hideCoach : showCoach}
          >
            {coachVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>

        {coachVisible ? (
          <button
            type="button"
            className="pointer-events-auto absolute bottom-0 right-0 block rounded-[2rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={characterActionLabel}
            aria-busy={loading}
            onClick={handleCharacterClick}
            onPointerEnter={() => setInteracting(true)}
            onPointerLeave={() => setInteracting(false)}
            onPointerDown={() => setInteracting(true)}
            onPointerUp={() => setInteracting(false)}
          >
            <TaskCoachCharacterLoader state={characterState} characterId={selectedCharacterId} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
