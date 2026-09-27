import { useEffect, useRef, type RefObject } from "react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ChildProfileDto } from "../../models/dto";
import { hexToRgba, PROFILE_FALLBACK_COLORS } from "../../domain/dashboard/color";

interface Props {
  profiles: ChildProfileDto[];
  selectedProfileUuid: string | null;
  disabled: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onSelect: (uuid: string) => void;
  onClose: () => void;
}

export function TaskCoachChildRail({ profiles, selectedProfileUuid, disabled, triggerRef, onSelect, onClose }: Props) {
  const { t } = useTranslation();
  const railRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    // Explicit keyboard/pointer opening enters the rail; automatic opening never steals page focus.
    if (triggerRef.current?.closest(".task-coach-widget")?.contains(document.activeElement)) {
      const selected = railRef.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]:not(:disabled)');
      (selected ?? railRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)"))?.focus();
    }
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !railRef.current?.contains(event.target) &&
        !triggerRef.current?.contains(event.target)
      )
        closeRef.current();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeRef.current();
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [triggerRef]);

  return (
    <div
      ref={railRef}
      id="task-coach-child-selector"
      className="task-coach-child-rail pointer-events-auto absolute z-20 w-[min(15rem,calc(100vw-6rem))]"
    >
      <p className="mb-2 ml-auto mr-14 w-fit rounded-full bg-background/95 px-3 py-1.5 text-right text-xs font-medium shadow-sm">
        {t("familyTask.taskCoach.chooseChild", "Who would like coaching?")}
      </p>
      <div
        role="radiogroup"
        aria-label={t("familyTask.taskCoach.childSelector", "Choose a child for Task Coach")}
        className="task-coach-kids-scroll space-y-2 overflow-y-auto overscroll-contain p-1"
        onKeyDown={(event) => {
          const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
          const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
          if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) || !buttons.length) return;
          event.preventDefault();
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? buttons.length - 1
                : (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
          buttons[next].focus();
        }}
      >
        {profiles.map((profile, index) => {
          const selected = profile.profileUuid === selectedProfileUuid;
          const color = profile.color ?? PROFILE_FALLBACK_COLORS[index % PROFILE_FALLBACK_COLORS.length];
          return (
            <button
              key={profile.profileUuid}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected || (!selectedProfileUuid && index === 0) ? 0 : -1}
              disabled={disabled}
              className="group flex min-h-12 w-full items-center justify-end gap-2 rounded-full text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              onClick={() => {
                onSelect(profile.profileUuid);
                triggerRef.current?.focus();
              }}
            >
              <span
                data-slot="task-coach-child-name"
                className={`min-w-0 rounded-2xl px-3 py-2 text-right text-sm font-medium shadow-sm [overflow-wrap:anywhere] ${selected ? "bg-primary text-primary-foreground" : "bg-background/95 text-foreground"}`}
              >
                {profile.displayName}
              </span>
              <span
                data-slot="task-coach-child-avatar"
                aria-hidden="true"
                style={{ backgroundColor: hexToRgba(color, 0.94) }}
                className={`relative flex size-12 shrink-0 items-center justify-center rounded-full border border-white/60 text-2xl shadow-md ${selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "group-hover:ring-2 group-hover:ring-primary/40"}`}
              >
                {profile.avatarEmoji ?? "🧒"}
                {selected ? (
                  <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-primary p-0.5 text-primary-foreground">
                    <Check className="size-3" />
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
