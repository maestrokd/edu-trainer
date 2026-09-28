import type { BibleBookshelfGroupId } from "../data/learning-groups";

export interface BibleBookshelfGroupTone {
  spine: string;
  swatch: string;
}

const GROUP_TONES: Record<BibleBookshelfGroupId, BibleBookshelfGroupTone> = {
  law: { spine: "border-l-sky-500 dark:border-l-sky-400", swatch: "bg-sky-500" },
  history: { spine: "border-l-amber-500 dark:border-l-amber-400", swatch: "bg-amber-500" },
  "poetry-wisdom": { spine: "border-l-violet-500 dark:border-l-violet-400", swatch: "bg-violet-500" },
  "major-prophets": { spine: "border-l-rose-500 dark:border-l-rose-400", swatch: "bg-rose-500" },
  "minor-prophets": { spine: "border-l-orange-500 dark:border-l-orange-400", swatch: "bg-orange-500" },
  "gospels-acts": { spine: "border-l-emerald-500 dark:border-l-emerald-400", swatch: "bg-emerald-500" },
  "pauline-letters": { spine: "border-l-indigo-500 dark:border-l-indigo-400", swatch: "bg-indigo-500" },
  "general-letters-revelation": { spine: "border-l-cyan-500 dark:border-l-cyan-400", swatch: "bg-cyan-500" },
  "gospels-general-letters": {
    spine: "border-l-emerald-500 dark:border-l-emerald-400",
    swatch: "bg-emerald-500",
  },
  "pauline-letters-revelation": {
    spine: "border-l-indigo-500 dark:border-l-indigo-400",
    swatch: "bg-indigo-500",
  },
};

export function getBibleBookshelfGroupTone(groupId: BibleBookshelfGroupId): BibleBookshelfGroupTone {
  return GROUP_TONES[groupId];
}
