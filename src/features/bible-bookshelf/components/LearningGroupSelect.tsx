import { BookOpen } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { BibleBookshelfGroup, BibleBookshelfGroupId } from "../data/learning-groups";

interface LearningGroupSelectProps {
  groups: readonly BibleBookshelfGroup[];
  selectedGroupId: BibleBookshelfGroupId;
  onChange: (groupId: BibleBookshelfGroupId) => void;
  label: string;
  getGroupLabel: (group: BibleBookshelfGroup) => string;
}

export function LearningGroupSelect({
  groups,
  selectedGroupId,
  onChange,
  label,
  getGroupLabel,
}: LearningGroupSelectProps) {
  return (
    <div className="w-full space-y-2 sm:max-w-sm">
      <Label htmlFor="bible-bookshelf-group" className="flex items-center gap-2 text-sm font-semibold">
        <BookOpen className="size-4" aria-hidden="true" />
        {label}
      </Label>
      <Select value={selectedGroupId} onValueChange={(value) => onChange(value as BibleBookshelfGroupId)}>
        <SelectTrigger id="bible-bookshelf-group" className="h-11 w-full bg-background/90">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {groups.map((group) => (
            <SelectItem key={group.id} value={group.id}>
              {getGroupLabel(group)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
