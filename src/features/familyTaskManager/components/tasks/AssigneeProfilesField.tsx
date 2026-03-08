import { cn } from "@/lib/utils";
import type { ChildProfileDto } from "../../models/dto";
import { NotoEmoji } from "../shared/NotoEmoji";

interface AssigneeProfilesFieldProps {
  profiles: ChildProfileDto[];
  value: string[];
  onChange: (value: string[]) => void;
  label: string;
  emptyHint: string;
}

function toggleAssignee(value: string[], profileUuid: string): string[] {
  if (value.includes(profileUuid)) {
    return value.filter((item) => item !== profileUuid);
  }

  return [...value, profileUuid];
}

function resolveProfileAvatar(profile: ChildProfileDto): string {
  if (profile.avatarEmoji) {
    return profile.avatarEmoji;
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

export function AssigneeProfilesField({ profiles, value, onChange, label, emptyHint }: AssigneeProfilesFieldProps) {
  const selected = new Set(value);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{label}</p>

      {profiles.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">{emptyHint}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {profiles.map((profile) => {
            const isSelected = selected.has(profile.profileUuid);

            return (
              <button
                key={profile.profileUuid}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onChange(toggleAssignee(value, profile.profileUuid))}
                className={cn(
                  "group inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-left transition",
                  isSelected
                    ? "border-sky-300 bg-sky-50 text-slate-900 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold",
                    isSelected ? "bg-sky-500 text-white" : "bg-slate-200 text-slate-700"
                  )}
                >
                  <NotoEmoji
                    emoji={resolveProfileAvatar(profile)}
                    size={24}
                    className="text-xs font-semibold"
                    fallback="?"
                  />
                </span>
                <span className="max-w-[120px] truncate text-sm font-medium">{profile.displayName}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
