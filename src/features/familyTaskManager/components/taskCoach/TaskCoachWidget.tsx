import { useRef } from "react";
import { Eye, EyeOff, MessageCircle, Settings2, Sparkles, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
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
import type { TaskCoachStyle } from "../../models/enums";
import { TASK_COACH_CHARACTER_IDS, type TaskCoachCharacterId } from "../../models/taskCoachCharacter";
import {
  TASK_COACH_COMPLETION_REFRESH_MODES,
  TASK_COACH_STYLES,
  type TaskCoachCompletionRefreshMode,
} from "../../services/taskCoachPreferences";
import { TaskCoachCharacterLoader } from "./TaskCoachCharacterLoader";
import { getTaskCoachCharacter, TASK_COACH_CHARACTER_LICENSE_URL } from "./taskCoachCharacters";
import { useTaskCoachController, type TaskCoachWidgetProps } from "./useTaskCoachController";
import { TaskCoachChildRail } from "./TaskCoachChildRail";
import { TaskCoachResponse } from "./TaskCoachResponse";
import "./taskCoach.css";
export type { TaskCoachSuccessEvent } from "./useTaskCoachController";

const COMPLETION_REFRESH_OPTION_COPY: Record<
  TaskCoachCompletionRefreshMode,
  { translationKey: string; fallback: string }
> = {
  AUTO: { translationKey: "familyTask.taskCoach.completionRefreshAuto", fallback: "Refresh automatically" },
  PROMPT: { translationKey: "familyTask.taskCoach.completionRefreshPrompt", fallback: "Offer a refresh button" },
  MANUAL: { translationKey: "familyTask.taskCoach.completionRefreshManual", fallback: "Wait for character click" },
};
const COACH_STYLE_OPTION_COPY: Record<TaskCoachStyle, { translationKey: string; fallback: string }> = {
  GENTLE: { translationKey: "familyTask.taskCoach.coachStyleGentle", fallback: "Gentle" },
  CHEERFUL: { translationKey: "familyTask.taskCoach.coachStyleCheerful", fallback: "Cheerful" },
  SILLY: { translationKey: "familyTask.taskCoach.coachStyleSilly", fallback: "Silly" },
};

export function TaskCoachWidget(props: TaskCoachWidgetProps) {
  const { t } = useTranslation();
  const { isToday } = props;
  const coach = useTaskCoachController(props);
  const childTriggerRef = useRef<HTMLButtonElement>(null);
  const {
    settingsOpen,
    childSelectorOpen,
    responseOpen,
    coachVisible,
    selectedProfileUuid,
    selectedProfile,
    selectedCharacter,
    autoplay,
    autoRequestAdvice,
    selectedCharacterId,
    completionRefreshMode,
    coachStyle,
    characterState,
    characterActionLabel,
    showBubble,
    childSelectorLabel,
    responseToggleLabel,
    visibilityToggleLabel,
    selectableProfiles,
    setChildSelectorOpen,
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
  } = coach;

  return (
    <div className="pointer-events-none fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-[calc(1rem+env(safe-area-inset-right))] z-40 flex w-[min(22.5rem,calc(100vw-2rem))] task-coach-widget flex-col items-end gap-2">
      <TaskCoachResponse coach={coach} isToday={isToday} />
      {coachVisible && childSelectorOpen && selectableProfiles.length > 0 ? (
        <TaskCoachChildRail
          profiles={selectableProfiles}
          selectedProfileUuid={selectedProfileUuid}
          disabled={!isToday}
          triggerRef={childTriggerRef}
          onSelect={handleProfileChange}
          onClose={() => setChildSelectorOpen(false)}
        />
      ) : null}

      <div className={coachVisible ? "relative h-52 w-44 task-coach-dock" : "relative size-11"}>
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
                className="relative size-11 rounded-full shadow-md"
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
                  className="size-11 rounded-full shadow-md"
                  ref={childTriggerRef}
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
                    className="size-11 rounded-full shadow-md"
                    aria-label={t("familyTask.taskCoach.settings", "Task Coach settings")}
                    title={t("familyTask.taskCoach.settings", "Task Coach settings")}
                  >
                    <Settings2 className="size-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles className="size-5 text-primary" />
                      {t("familyTask.taskCoach.settings", "Task Coach settings")}
                    </DialogTitle>
                    <DialogDescription>
                      {t(
                        "familyTask.taskCoach.settingsDescription",
                        "Choose your character, coaching style, and when advice and voice are generated."
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

                    <div className="space-y-2 rounded-xl border bg-muted/35 px-3 py-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="task-coach-style">{t("familyTask.taskCoach.coachStyle", "Coach style")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t(
                            "familyTask.taskCoach.coachStyleHint",
                            "Choose how calm, cheerful, or silly the character sounds."
                          )}
                        </p>
                      </div>
                      <Select
                        value={coachStyle}
                        onValueChange={(value) => handleCoachStyleChange(value as TaskCoachStyle)}
                      >
                        <SelectTrigger id="task-coach-style" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_COACH_STYLES.map((style) => {
                            const copy = COACH_STYLE_OPTION_COPY[style];
                            return (
                              <SelectItem key={style} value={style}>
                                {t(copy.translationKey, copy.fallback)}
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
            className="size-11 rounded-full shadow-md"
            aria-label={visibilityToggleLabel}
            title={visibilityToggleLabel}
            onClick={coachVisible ? hideCoach : showCoach}
          >
            {coachVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>

        <div
          hidden={!coachVisible}
          className="task-coach-character-button pointer-events-auto absolute bottom-0 right-12 block rounded-[2rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <TaskCoachCharacterLoader
            state={characterState}
            characterId={selectedCharacterId}
            visible={coachVisible}
            onActivate={handleCharacterClick}
            actionLabel={characterActionLabel}
          />
        </div>
      </div>
    </div>
  );
}
