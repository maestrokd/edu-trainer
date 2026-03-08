import type { ChildProfileDto } from "../../models/dto";
import { NotoEmoji } from "./NotoEmoji";

interface AssigneeProfileBadgeProps {
  profile?: ChildProfileDto;
  profileColor?: string;
  unknownLabel: string;
}

function resolveProfileBadge(profile?: ChildProfileDto): string {
  if (profile?.avatarEmoji?.trim()) {
    return profile.avatarEmoji.trim();
  }

  if (!profile) {
    return "?";
  }

  const words = profile.displayName.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "?";
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function AssigneeProfileBadge({ profile, profileColor, unknownLabel }: AssigneeProfileBadgeProps) {
  const label = profile?.displayName ?? unknownLabel;

  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-slate-50 py-0.5 pr-2 pl-0.5 text-xs font-medium text-slate-700">
      <span
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: profileColor ?? "#94a3b8" }}
      >
        <NotoEmoji
          emoji={resolveProfileBadge(profile)}
          size={16}
          className="text-[10px] font-semibold text-white"
          fallback="?"
        />
      </span>
      <span className="truncate">{label}</span>
    </span>
  );
}
