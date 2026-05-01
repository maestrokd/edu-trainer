import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { rewardLabelsApi } from "../../api/rewardsApi";
import { useFamilyTaskErrorHandler } from "../../hooks/useFamilyTaskErrorHandler";
import type { RewardLabelDto } from "../../models/dto";
import type { FamilyRewardLabelKind } from "../../models/enums";

const LABEL_SEARCH_DEBOUNCE_MS = 300;

function dedupeUuids(value: string[]): string[] {
  return [...new Set(value)];
}

function normalizeLabelName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

interface RewardLabelDropdownProps {
  kind: FamilyRewardLabelKind;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  multiple?: boolean;
  allowCreate?: boolean;
  includeInactive?: boolean;
  disabled?: boolean;
  className?: string;
  align?: "start" | "end" | "center";
  knownLabels?: Record<string, RewardLabelDto>;
  onLabelsLoaded?: (labels: RewardLabelDto[]) => void;
}

export function RewardLabelDropdown({
  kind,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  multiple = false,
  allowCreate = false,
  includeInactive = false,
  disabled = false,
  className,
  align = "start",
  knownLabels,
  onLabelsLoaded,
}: RewardLabelDropdownProps) {
  const { getErrorMessage, handleError } = useFamilyTaskErrorHandler();
  const [open, setOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [options, setOptions] = useState<RewardLabelDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!open) {
      setSearchDraft("");
      setDebouncedSearch("");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchDraft);
    }, LABEL_SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open, searchDraft]);

  const loadLabels = useCallback(
    async (searchString: string) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      setLoadingError(null);

      try {
        const items = await rewardLabelsApi.getAll({
          kind,
          includeInactive,
          searchString: searchString.trim() || undefined,
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        setOptions(items);
        onLabelsLoaded?.(items);
      } catch (error: unknown) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setOptions([]);
        setLoadingError(
          getErrorMessage(error, {
            fallbackKey: "familyTask.errors.rewardLabels",
            fallbackMessage: "Failed to load reward labels.",
          })
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [getErrorMessage, includeInactive, kind, onLabelsLoaded]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    void loadLabels(debouncedSearch);
  }, [debouncedSearch, loadLabels, open]);

  const labelByUuid = useMemo(() => {
    const map = new Map<string, RewardLabelDto>();

    for (const item of options) {
      map.set(item.uuid, item);
    }

    if (knownLabels) {
      for (const item of Object.values(knownLabels)) {
        if (!map.has(item.uuid)) {
          map.set(item.uuid, item);
        }
      }
    }

    return map;
  }, [knownLabels, options]);

  const selectedLabels = useMemo(() => {
    return value.map((uuid) => labelByUuid.get(uuid)).filter(Boolean) as RewardLabelDto[];
  }, [labelByUuid, value]);

  const triggerLabel = useMemo(() => {
    if (selectedLabels.length === 0) {
      return placeholder;
    }

    if (!multiple) {
      return selectedLabels[0]?.name ?? placeholder;
    }

    const [first, ...rest] = selectedLabels;
    if (!first) {
      return placeholder;
    }

    if (rest.length === 0) {
      return first.name;
    }

    return `${first.name} +${rest.length}`;
  }, [multiple, placeholder, selectedLabels]);

  const selectedUuidSet = useMemo(() => new Set(value), [value]);

  const toggleOption = (optionUuid: string) => {
    if (multiple) {
      if (selectedUuidSet.has(optionUuid)) {
        onChange(value.filter((item) => item !== optionUuid));
      } else {
        onChange(dedupeUuids([...value, optionUuid]));
      }
      return;
    }

    if (selectedUuidSet.has(optionUuid)) {
      onChange([]);
    } else {
      onChange([optionUuid]);
    }

    setOpen(false);
  };

  const removeSelected = (optionUuid: string) => {
    onChange(value.filter((item) => item !== optionUuid));
  };

  const trimmedSearch = searchDraft.trim();
  const normalizedSearch = normalizeLabelName(trimmedSearch);
  const hasExactOption = options.some((item) => normalizeLabelName(item.name) === normalizedSearch);
  const canCreate = allowCreate && trimmedSearch.length > 0 && !hasExactOption && !creating;

  const handleCreate = async () => {
    if (!canCreate) {
      return;
    }

    setCreating(true);

    try {
      const created = await rewardLabelsApi.create({
        kind,
        name: trimmedSearch,
      });

      setOptions((previous) => {
        const next = [...previous];
        const existingIndex = next.findIndex((item) => item.uuid === created.uuid);
        if (existingIndex >= 0) {
          next[existingIndex] = created;
          return next;
        }

        return [created, ...next];
      });
      onLabelsLoaded?.([created]);
      setSearchDraft("");
      setDebouncedSearch("");

      if (multiple) {
        onChange(dedupeUuids([...value, created.uuid]));
      } else {
        onChange([created.uuid]);
        setOpen(false);
      }
    } catch (error: unknown) {
      handleError(error, {
        fallbackKey: "familyTask.errors.rewardLabelCreate",
        fallbackMessage: "Failed to create reward label.",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <DropdownMenu
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);

          if (!nextOpen) {
            setLoadingError(null);
          }
        }}
      >
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "inline-flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-input bg-background px-3 text-left text-sm shadow-xs transition-colors hover:border-ring/50 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60",
              value.length > 0 && "border-primary/40 bg-primary/5 text-foreground"
            )}
          >
            <span className={cn("truncate", value.length === 0 && "text-muted-foreground")}>{triggerLabel}</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={align}
          className="w-[min(92vw,360px)] rounded-2xl border-border bg-popover/95 p-2 text-popover-foreground"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
          }}
        >
          <div className="space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 rounded-lg pl-9"
              />
            </div>

            {!multiple && value.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  onChange([]);
                  setOpen(false);
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="size-3.5" />
                Clear selection
              </button>
            ) : null}

            <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
              {loading ? (
                <div className="flex h-20 items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading...
                </div>
              ) : null}

              {!loading && loadingError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-xs text-red-700 dark:border-destructive/40 dark:bg-destructive/15 dark:text-destructive">
                  {loadingError}
                </p>
              ) : null}

              {!loading && !loadingError && options.length === 0 ? (
                <p className="rounded-lg border border-border/70 bg-muted/30 px-2.5 py-2 text-xs text-muted-foreground">
                  {emptyText}
                </p>
              ) : null}

              {!loading && !loadingError
                ? options.map((item) => {
                    const isSelected = selectedUuidSet.has(item.uuid);
                    return (
                      <button
                        key={item.uuid}
                        type="button"
                        onClick={() => toggleOption(item.uuid)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors",
                          isSelected
                            ? "border-primary/40 bg-primary/10 text-foreground"
                            : "border-border/70 bg-background hover:border-ring/40 hover:bg-accent"
                        )}
                      >
                        <span className="truncate">{item.name}</span>
                        {isSelected ? <Check className="size-4 shrink-0 text-primary" /> : null}
                      </button>
                    );
                  })
                : null}
            </div>

            {canCreate ? (
              <button
                type="button"
                disabled={creating}
                onClick={() => void handleCreate()}
                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/50 bg-primary/5 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Create "{trimmedSearch}"
              </button>
            ) : null}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {multiple && selectedLabels.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedLabels.map((item) => (
            <button
              key={item.uuid}
              type="button"
              onClick={() => removeSelected(item.uuid)}
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-primary/20"
            >
              <span className="max-w-[170px] truncate">{item.name}</span>
              <X className="size-3.5 text-muted-foreground" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
