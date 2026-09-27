import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { taskCoachApi } from "../../api/taskCoachApi";
import { TaskCoachState, type TaskCoachStyle } from "../../models/enums";
import type { ChildProfileDto, TaskCoachAdviceDto } from "../../models/dto";
import type { TaskCoachCharacterId } from "../../models/taskCoachCharacter";
import {
  loadTaskCoachAutoplay,
  loadTaskCoachAutoRequest,
  loadTaskCoachCharacter,
  loadTaskCoachCompletionRefreshMode,
  loadTaskCoachStyle,
  saveTaskCoachAutoplay,
  saveTaskCoachAutoRequest,
  saveTaskCoachCharacter,
  saveTaskCoachCompletionRefreshMode,
  saveTaskCoachStyle,
  type TaskCoachCompletionRefreshMode,
} from "../../services/taskCoachPreferences";
import type { AssistantCharacterState } from "./TaskCoachCharacter";
import { getTaskCoachCharacter } from "./taskCoachCharacters";
import { useTaskCoachAudio } from "./useTaskCoachAudio";

export interface TaskCoachSuccessEvent {
  id: number;
  profileUuid: string;
  starsAwarded: number;
  revisions?: Record<string, number>;
}

export interface TaskCoachWidgetProps {
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

export function useTaskCoachController({
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
  const [coachStyle, setCoachStyle] = useState(loadTaskCoachStyle);
  const preferencesRef = useRef({ autoplay, completionRefreshMode });
  useEffect(() => {
    preferencesRef.current = { autoplay, completionRefreshMode };
  }, [autoplay, completionRefreshMode]);
  const [selectedPlanTaskUuid, setSelectedPlanTaskUuid] = useState<string | null>(null);
  const [refreshPlanAvailable, setRefreshPlanAvailable] = useState(false);
  const [autoPlayLoadedAudio, setAutoPlayLoadedAudio] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const revisionsRef = useRef<Record<string, number>>({});
  const adviceRevisionRef = useRef(-1);
  const requestInFlightRef = useRef(false);
  const celebrationDeadlineRef = useRef(0);
  const pendingResultRef = useRef<(() => void) | null>(null);
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
    celebrationDeadlineRef.current = 0;
    pendingResultRef.current = null;
    setCelebrating(false);
  }, []);

  const celebrate = useCallback(() => {
    if (celebrationTimerRef.current) return;
    setCelebrating(true);
    celebrationDeadlineRef.current = Date.now() + SUCCESS_DURATION_MS;
    celebrationTimerRef.current = setTimeout(() => {
      celebrationTimerRef.current = null;
      celebrationDeadlineRef.current = 0;
      setCelebrating(false);
      const commit = pendingResultRef.current;
      pendingResultRef.current = null;
      commit?.();
    }, SUCCESS_DURATION_MS);
  }, []);

  const resetCoachResult = useCallback(() => {
    adviceRequestIdRef.current += 1;
    speechRequestIdRef.current += 1;
    setAdvice(null);
    adviceRevisionRef.current = -1;
    requestInFlightRef.current = false;
    setExpanded(false);
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
      adviceRequestIdRef.current += 1;
      speechRequestIdRef.current += 1;
      requestInFlightRef.current = false;
      pendingResultRef.current = null;
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
      if (requestInFlightRef.current) return;
      requestInFlightRef.current = true;
      const revision = revisionsRef.current[profileUuid] ?? 0;
      const requestId = adviceRequestIdRef.current + 1;
      adviceRequestIdRef.current = requestId;
      speechRequestIdRef.current += 1;
      setResponseOpen(true);
      setChildSelectorOpen(false);
      setLoading(true);
      setError(false);
      setSpeaking(false);
      setAudioLoading(false);
      setAudioError(false);
      setRefreshPlanAvailable(false);
      pendingCompletionActionRef.current = null;
      replaceAudioUrl(null);
      pendingResultRef.current = null;
      try {
        const nextAdvice = await taskCoachApi.getAdvice(profileUuid, coachStyle);
        if (adviceRequestIdRef.current !== requestId) {
          return;
        }
        if (
          nextAdvice.state === TaskCoachState.ALL_DONE &&
          !completionRefreshInFlightRef.current &&
          !celebrationDeadlineRef.current
        )
          celebrate();
        const commit = () => {
          if (adviceRequestIdRef.current !== requestId) return;
          adviceRevisionRef.current = revision;
          setAdvice(nextAdvice);
          setLoading(false);
          requestInFlightRef.current = false;
          const fresh = revision === (revisionsRef.current[profileUuid] ?? 0);
          setRefreshPlanAvailable(!fresh && preferencesRef.current.completionRefreshMode === "PROMPT");
          onRecommendation(fresh ? (nextAdvice.recommendedTaskUuids[0] ?? null) : null);
          setSelectedPlanTaskUuid(fresh ? (nextAdvice.recommendedTaskUuids[0] ?? null) : null);
          completionRefreshInFlightRef.current = false;
          if (preferencesRef.current.autoplay && fresh) void requestSpeech(nextAdvice, true);
        };
        if (celebrationDeadlineRef.current > Date.now()) {
          pendingResultRef.current = commit;
        } else {
          commit();
        }
      } catch {
        if (adviceRequestIdRef.current === requestId) {
          setError(true);
          adviceRevisionRef.current = -1;
        }
      } finally {
        if (adviceRequestIdRef.current === requestId && !pendingResultRef.current) {
          requestInFlightRef.current = false;
          setLoading(false);
          completionRefreshInFlightRef.current = false;
        }
      }
    },
    [celebrate, coachStyle, onRecommendation, replaceAudioUrl, requestSpeech]
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
    const previousRevision = revisionsRef.current[selectedProfileUuid ?? ""] ?? 0;
    revisionsRef.current = successEvent.revisions ?? {
      ...revisionsRef.current,
      [successEvent.profileUuid]: (revisionsRef.current[successEvent.profileUuid] ?? 0) + 1,
    };
    if (!isToday) return;
    if (!selectedProfileUuid || previousRevision === (revisionsRef.current[selectedProfileUuid] ?? 0)) {
      return;
    }

    if (coachVisible) celebrate();
    onRecommendation(null);
    setSelectedPlanTaskUuid(null);

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
  }, [
    celebrate,
    coachVisible,
    completionRefreshMode,
    isToday,
    requestAdvice,
    selectedProfileUuid,
    successEvent,
    onRecommendation,
  ]);

  useEffect(() => {
    if (
      completionRefreshMode !== "AUTO" ||
      !coachVisible ||
      !isToday ||
      !selectedProfileUuid ||
      !advice ||
      loading ||
      error
    )
      return;
    if (adviceRevisionRef.current === (revisionsRef.current[selectedProfileUuid] ?? 0)) return;
    completionRefreshInFlightRef.current = true;
    void requestAdvice(selectedProfileUuid);
  }, [advice, coachVisible, completionRefreshMode, error, isToday, loading, requestAdvice, selectedProfileUuid]);

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
      setResponseOpen(true);
      setChildSelectorOpen(false);
      return;
    }
    if (advice && adviceRevisionRef.current === (revisionsRef.current[selectedProfileUuid] ?? 0)) {
      handleResponseToggle();
      return;
    }
    void requestAdvice(selectedProfileUuid);
  };

  const handleChildSelectorToggle = () => {
    setExpanded(false);
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
    setExpanded(false);
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
      setExpanded(false);
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

  const handleCoachStyleChange = (style: TaskCoachStyle) => {
    setCoachStyle(style);
    saveTaskCoachStyle(style);
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
    requestInFlightRef.current = false;
    pendingResultRef.current = null;
    stopCelebrating();
    setExpanded(false);
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
    : celebrating
      ? "SUCCESS"
      : loading
        ? "THINKING"
        : speaking
          ? "SPEAKING"
          : error
            ? "ERROR"
            : "IDLE";

  const audio = useTaskCoachAudio({
    audioUrl,
    autoPlay: autoPlayLoadedAudio,
    visible: coachVisible && responseOpen && !settingsOpen && !celebrating,
    onSpeakingChange: setSpeaking,
    onError: () => setAudioError(true),
  });
  const stale = Boolean(advice) && adviceRevisionRef.current !== (revisionsRef.current[selectedProfileUuid ?? ""] ?? 0);

  const disabledHint = t("familyTask.taskCoach.todayOnly", "Task Coach is available while viewing today’s tasks.");
  const characterActionLabel = !isToday
    ? disabledHint
    : selectedProfileUuid
      ? advice && !stale
        ? t("familyTask.taskCoach.toggleAdvice", "Open or close advice")
        : t("familyTask.taskCoach.refresh", "Ask the cat for fresh advice")
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

  return {
    settingsOpen,
    childSelectorOpen,
    responseOpen,
    coachVisible,
    selectedProfileUuid,
    selectedProfile,
    selectedCharacter,
    advice,
    loading,
    error,
    audioUrl,
    audioLoading,
    audioError,
    autoplay,
    autoRequestAdvice,
    selectedCharacterId,
    completionRefreshMode,
    coachStyle,
    selectedPlanTaskUuid,
    refreshPlanAvailable,
    characterState,
    disabledHint,
    characterActionLabel,
    showBubble,
    childSelectorLabel,
    responseToggleLabel,
    visibilityToggleLabel,
    inactiveHintVisible,
    selectableProfiles,
    expanded,
    setExpanded,
    stale,
    audio,
    setChildSelectorOpen,
    requestAdvice,
    requestSpeech,
    focusPlanTask,
    handleProfileChange,
    handleCharacterClick,
    handleChildSelectorToggle,
    handleResponseToggle,
    handleSettingsOpenChange,
    handleAutoplayChange,
    handleAutoRequestChange,
    handleCharacterChange,
    handleCompletionRefreshModeChange,
    handleCoachStyleChange,
    hideCoach,
    showCoach,
  };
}

export type TaskCoachController = ReturnType<typeof useTaskCoachController>;
