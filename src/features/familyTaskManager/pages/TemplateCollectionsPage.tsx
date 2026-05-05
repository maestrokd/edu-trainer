import axios, { type AxiosResponse } from "axios";
import { ChevronRight, Copy, Download, Eye, FileJson, Upload } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { isApiErrorResponse } from "@/services/ApiService";
import { notifier } from "@/services/NotificationService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  buildNextSelection,
  buildSelectedTemplatePayload,
  downloadBlob,
  familyTemplateCollectionsApi,
  safeParseTemplateJson,
  TEMPLATE_COLLECTION_MAX_FILE_SIZE_BYTES,
  type AnyTemplateCollectionPayload,
} from "../api/familyTemplateCollectionsApi";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { NotoEmoji } from "../components/shared/NotoEmoji";
import { FAMILY_TASK_ROUTES } from "../constants/routes";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import {
  TemplateSelectionMode,
  TemplateStateFilter as TemplateStateFilterEnum,
  type ChoreTemplateCandidateDto,
  type RewardTemplateCandidateDto,
  type RoutineTemplateCandidateDto,
  type TemplateExportRequest,
  type TemplateImportExecuteResponseDto,
  type TemplateImportPreviewResponseDto,
  type TemplateStateFilter,
} from "../models/dto";

type PageTab = "export" | "import";
type ImportSourceTab = "upload" | "paste";
type CollectionType = "routines" | "chores" | "rewards";
type CandidateRow = RoutineTemplateCandidateDto | ChoreTemplateCandidateDto | RewardTemplateCandidateDto;
type TemplateFileValidationErrorCode = "FILE_REQUIRED" | "FILE_TOO_LARGE";

const ROUTINE_SLOT_ORDER = ["MORNING", "AFTERNOON", "EVENING", "ANYTIME"] as const;

function toDisplayValue(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function formatLocalDate(value: string | null | undefined, locale: string): string {
  if (!value) {
    return "—";
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(parsed));
}

function getExportFallbackName(collectionType: CollectionType): string {
  const dateSuffix = new Date().toISOString().slice(0, 10);

  switch (collectionType) {
    case "routines":
      return `family-routines-templates-${dateSuffix}.json`;
    case "chores":
      return `family-chores-templates-${dateSuffix}.json`;
    case "rewards":
      return `family-rewards-templates-${dateSuffix}.json`;
  }
}

function applyStateFilter(candidates: CandidateRow[], filter: TemplateStateFilter): CandidateRow[] {
  if (filter === TemplateStateFilterEnum.ALL) {
    return candidates;
  }

  const expected = filter === TemplateStateFilterEnum.ACTIVE;
  return candidates.filter((candidate) => candidate.active === expected);
}

function normalizeRoutineSlot(slot: unknown): string {
  if (typeof slot !== "string" || !slot.trim()) {
    return "UNSPECIFIED";
  }

  return slot.trim().toUpperCase();
}

function getRoutineSlotRank(slot: string): number {
  const index = ROUTINE_SLOT_ORDER.indexOf(slot as (typeof ROUTINE_SLOT_ORDER)[number]);
  return index >= 0 ? index : ROUTINE_SLOT_ORDER.length;
}

function groupByRoutineSlot<T>(items: T[], resolveSlot: (item: T) => unknown): Array<{ slot: string; items: T[] }> {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const slot = normalizeRoutineSlot(resolveSlot(item));
    groups.set(slot, [...(groups.get(slot) ?? []), item]);
  }

  return [...groups.entries()]
    .sort(([leftSlot], [rightSlot]) => {
      const leftRank = getRoutineSlotRank(leftSlot);
      const rightRank = getRoutineSlotRank(rightSlot);

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      return leftSlot.localeCompare(rightSlot);
    })
    .map(([slot, groupedItems]) => ({
      slot,
      items: groupedItems,
    }));
}

function extractValidationMessages(error: unknown): string[] {
  if (!axios.isAxiosError(error)) {
    return [];
  }

  const responseData = error.response?.data;
  if (!isApiErrorResponse(responseData)) {
    return [];
  }

  return responseData.errors.map((issue) => `${issue.field}: ${issue.message}`);
}

function validateTemplateFile(file: File | null): TemplateFileValidationErrorCode | null {
  if (!file) {
    return "FILE_REQUIRED";
  }

  if (file.size > TEMPLATE_COLLECTION_MAX_FILE_SIZE_BYTES) {
    return "FILE_TOO_LARGE";
  }

  return null;
}

async function listCandidates(collectionType: CollectionType): Promise<CandidateRow[]> {
  switch (collectionType) {
    case "routines":
      return familyTemplateCollectionsApi.listRoutineCandidates();
    case "chores":
      return familyTemplateCollectionsApi.listChoreCandidates();
    case "rewards":
      return familyTemplateCollectionsApi.listRewardCandidates();
  }
}

async function exportTemplates(
  collectionType: CollectionType,
  request: TemplateExportRequest,
  download: boolean
): Promise<AnyTemplateCollectionPayload | AxiosResponse<Blob>> {
  switch (collectionType) {
    case "routines":
      return familyTemplateCollectionsApi.exportRoutines(request, download) as Promise<
        AnyTemplateCollectionPayload | AxiosResponse<Blob>
      >;
    case "chores":
      return familyTemplateCollectionsApi.exportChores(request, download) as Promise<
        AnyTemplateCollectionPayload | AxiosResponse<Blob>
      >;
    case "rewards":
      return familyTemplateCollectionsApi.exportRewards(request, download) as Promise<
        AnyTemplateCollectionPayload | AxiosResponse<Blob>
      >;
  }
}

function previewImport(
  collectionType: CollectionType,
  payload: AnyTemplateCollectionPayload
): Promise<TemplateImportPreviewResponseDto> {
  switch (collectionType) {
    case "routines":
      return familyTemplateCollectionsApi.previewRoutineImport(payload);
    case "chores":
      return familyTemplateCollectionsApi.previewChoreImport(payload);
    case "rewards":
      return familyTemplateCollectionsApi.previewRewardImport(payload);
  }
}

function executeImport(
  collectionType: CollectionType,
  payload: AnyTemplateCollectionPayload
): Promise<TemplateImportExecuteResponseDto> {
  switch (collectionType) {
    case "routines":
      return familyTemplateCollectionsApi.importRoutines(payload);
    case "chores":
      return familyTemplateCollectionsApi.importChores(payload);
    case "rewards":
      return familyTemplateCollectionsApi.importRewards(payload);
  }
}

function previewImportFile(collectionType: CollectionType, file: File): Promise<TemplateImportPreviewResponseDto> {
  switch (collectionType) {
    case "routines":
      return familyTemplateCollectionsApi.previewRoutineImportFile(file);
    case "chores":
      return familyTemplateCollectionsApi.previewChoreImportFile(file);
    case "rewards":
      return familyTemplateCollectionsApi.previewRewardImportFile(file);
  }
}

function executeImportFile(collectionType: CollectionType, file: File): Promise<TemplateImportExecuteResponseDto> {
  switch (collectionType) {
    case "routines":
      return familyTemplateCollectionsApi.importRoutinesFile(file);
    case "chores":
      return familyTemplateCollectionsApi.importChoresFile(file);
    case "rewards":
      return familyTemplateCollectionsApi.importRewardsFile(file);
  }
}

export function TemplateCollectionsPage() {
  const { t, i18n } = useTranslation();
  const { getErrorMessage } = useApiErrorHandler();

  useTrackFamilyTaskPageView("template_collections");

  const [activeTab, setActiveTab] = useState<PageTab>("export");
  const [collectionType, setCollectionType] = useState<CollectionType>("routines");
  const [actionKey, setActionKey] = useState<string | null>(null);

  const [screenError, setScreenError] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);

  const [directExportFilter, setDirectExportFilter] = useState<TemplateStateFilter>(TemplateStateFilterEnum.ALL);
  const [interactiveExportFilter, setInteractiveExportFilter] = useState<TemplateStateFilter>(
    TemplateStateFilterEnum.ALL
  );
  const [exportCandidates, setExportCandidates] = useState<CandidateRow[]>([]);
  const [selectedExportUuids, setSelectedExportUuids] = useState<string[]>([]);
  const [groupRoutinesInExport, setGroupRoutinesInExport] = useState<boolean>(true);
  const [groupRoutinesInImport, setGroupRoutinesInImport] = useState<boolean>(true);

  const [previewJson, setPreviewJson] = useState<string | null>(null);
  const [previewJsonTitle, setPreviewJsonTitle] = useState<string>("Preview JSON");

  const [directImportFile, setDirectImportFile] = useState<File | null>(null);
  const [directImportFileError, setDirectImportFileError] = useState<string | null>(null);

  const [importSourceTab, setImportSourceTab] = useState<ImportSourceTab>("upload");
  const [interactiveImportFile, setInteractiveImportFile] = useState<File | null>(null);
  const [interactiveImportText, setInteractiveImportText] = useState<string>("");
  const [interactiveParseError, setInteractiveParseError] = useState<string | null>(null);
  const [schemaVersionNotice, setSchemaVersionNotice] = useState<string | null>(null);
  const [interactivePayload, setInteractivePayload] = useState<AnyTemplateCollectionPayload | null>(null);
  const [selectedImportIndexes, setSelectedImportIndexes] = useState<string[]>([]);

  const [importPreview, setImportPreview] = useState<TemplateImportPreviewResponseDto | null>(null);
  const [importPreviewContext, setImportPreviewContext] = useState<"direct-file" | "interactive" | null>(null);
  const [importResult, setImportResult] = useState<TemplateImportExecuteResponseDto | null>(null);

  const collectionLabel =
    collectionType === "routines"
      ? t("familyTask.templateCollections.collection.routines", "Routines")
      : collectionType === "chores"
        ? t("familyTask.templateCollections.collection.chores", "Chores")
        : t("familyTask.templateCollections.collection.rewards", "Rewards");

  const collectionContract =
    collectionType === "routines"
      ? t(
          "familyTask.templateCollections.contract.routines",
          "Routine templates contain recurrence settings only. Imports create inactive, unassigned drafts."
        )
      : collectionType === "chores"
        ? t(
            "familyTask.templateCollections.contract.chores",
            "Chore templates contain generic task fields only. Imports create inactive, unassigned drafts."
          )
        : t(
            "familyTask.templateCollections.contract.rewards",
            "Reward templates contain reward metadata only. Imports create inactive, unassigned drafts."
          );

  const collectionListRoute =
    collectionType === "routines"
      ? FAMILY_TASK_ROUTES.routines
      : collectionType === "chores"
        ? FAMILY_TASK_ROUTES.chores
        : FAMILY_TASK_ROUTES.rewards;

  const filteredCandidates = applyStateFilter(exportCandidates, interactiveExportFilter);
  const selectedFilteredExportUuids = filteredCandidates
    .filter((candidate) => selectedExportUuids.includes(candidate.uuid))
    .map((candidate) => candidate.uuid);
  const allFilteredSelected =
    filteredCandidates.length > 0 && selectedFilteredExportUuids.length === filteredCandidates.length;

  const selectedInteractiveIndexes = selectedImportIndexes
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value));

  const interactiveImportRows =
    interactivePayload?.items.map((rawItem, index) => ({
      index,
      row: rawItem as Record<string, unknown>,
      rowId: String(index),
    })) ?? [];

  const groupedRoutineExportCandidates =
    collectionType === "routines"
      ? groupByRoutineSlot(
          filteredCandidates as RoutineTemplateCandidateDto[],
          (candidate) => (candidate as RoutineTemplateCandidateDto).routineSlot
        )
      : [];

  const groupedRoutineImportRows =
    collectionType === "routines" ? groupByRoutineSlot(interactiveImportRows, (entry) => entry.row.routineSlot) : [];

  const allInteractiveItemsSelected =
    !!interactivePayload &&
    interactivePayload.items.length > 0 &&
    selectedImportIndexes.length === interactivePayload.items.length;

  const disableInteractiveImport = importPreviewContext === "interactive" && (importPreview?.invalidItemCount ?? 0) > 0;
  const showImportPreview = importPreview !== null;

  const getRoutineSlotLabel = (slot: string): string => {
    if (slot === "MORNING") {
      return t("familyTask.today.slots.morning", "Morning");
    }

    if (slot === "AFTERNOON") {
      return t("familyTask.today.slots.afternoon", "Afternoon");
    }

    if (slot === "EVENING") {
      return t("familyTask.today.slots.evening", "Evening");
    }

    if (slot === "ANYTIME") {
      return t("familyTask.today.slots.anytime", "Anytime");
    }

    return t("familyTask.templateCollections.grouping.unspecified", "Unspecified");
  };

  const getFileValidationMessage = (errorCode: TemplateFileValidationErrorCode): string => {
    if (errorCode === "FILE_REQUIRED") {
      return t("familyTask.templateCollections.validation.fileRequired", "Please choose a JSON file first.");
    }

    return t(
      "familyTask.templateCollections.validation.fileTooLarge",
      "File is larger than 1 MiB. Maximum allowed size is 1,048,576 bytes."
    );
  };

  const getParseErrorMessage = (parsed: Extract<ReturnType<typeof safeParseTemplateJson>, { ok: false }>): string => {
    if (parsed.errorCode === "EMPTY") {
      return t("familyTask.templateCollections.validation.emptyJson", "JSON is empty.");
    }

    if (parsed.errorCode === "PARSE_ERROR") {
      return t("familyTask.templateCollections.validation.parseError", {
        defaultValue: "JSON parse error: {{detail}}",
        detail: parsed.errorDetail ?? t("familyTask.templateCollections.validation.unknownError", "Unknown error"),
      });
    }

    if (parsed.errorCode === "INVALID_ROOT") {
      return t("familyTask.templateCollections.validation.invalidRoot", "JSON root must be an object.");
    }

    if (parsed.errorCode === "MISSING_SCHEMA_VERSION") {
      return t("familyTask.templateCollections.validation.missingSchemaVersion", "schemaVersion is required.");
    }

    if (parsed.errorCode === "INVALID_ITEMS") {
      return t("familyTask.templateCollections.validation.invalidItems", "items must be an array.");
    }

    return t("familyTask.templateCollections.validation.invalidItemEntry", "Each item must be an object.");
  };

  const resetContextForCollection = (nextCollectionType: CollectionType) => {
    setCollectionType(nextCollectionType);
    setScreenError(null);
    setValidationIssues([]);
    setPreviewJson(null);
    setImportPreview(null);
    setImportPreviewContext(null);
    setImportResult(null);
    setDirectImportFile(null);
    setDirectImportFileError(null);
    setInteractiveImportFile(null);
    setInteractiveImportText("");
    setInteractiveParseError(null);
    setSchemaVersionNotice(null);
    setInteractivePayload(null);
    setSelectedImportIndexes([]);
    setExportCandidates([]);
    setSelectedExportUuids([]);
    setDirectExportFilter(TemplateStateFilterEnum.ALL);
    setInteractiveExportFilter(TemplateStateFilterEnum.ALL);
  };

  const runWithAction = async (nextActionKey: string, run: () => Promise<void>) => {
    setActionKey(nextActionKey);
    setScreenError(null);
    setValidationIssues([]);

    try {
      await run();
    } catch (error) {
      const fallbackMessage = t("familyTask.templateCollections.error.generic", "Operation failed.");
      const message = getErrorMessage(error, {
        fallbackKey: "familyTask.templateCollections.error.generic",
        fallbackMessage,
      });
      const issues = extractValidationMessages(error);
      setValidationIssues(issues);
      setScreenError(message);
      notifier.error(message);
    } finally {
      setActionKey(null);
    }
  };

  const handleDirectExportPreview = async () => {
    const request: TemplateExportRequest = {
      stateFilter: directExportFilter,
      selectionMode: TemplateSelectionMode.ALL_FILTERED,
      selectedUuids: [],
    };

    await runWithAction("direct-export-preview", async () => {
      const payload = (await exportTemplates(collectionType, request, false)) as AnyTemplateCollectionPayload;
      setPreviewJsonTitle(t("familyTask.templateCollections.preview.direct", "Direct Export Preview"));
      setPreviewJson(JSON.stringify(payload, null, 2));
    });
  };

  const handleDirectExportDownload = async () => {
    const request: TemplateExportRequest = {
      stateFilter: directExportFilter,
      selectionMode: TemplateSelectionMode.ALL_FILTERED,
      selectedUuids: [],
    };

    await runWithAction("direct-export-download", async () => {
      const response = (await exportTemplates(collectionType, request, true)) as AxiosResponse<Blob>;
      const fileName = downloadBlob(response, getExportFallbackName(collectionType));
      notifier.success(
        t("familyTask.templateCollections.export.downloaded", {
          defaultValue: "Downloaded {{fileName}}",
          fileName,
        })
      );
    });
  };

  const handleLoadCandidates = async () => {
    await runWithAction("load-export-candidates", async () => {
      const rows = await listCandidates(collectionType);
      setExportCandidates(rows);
      setSelectedExportUuids([]);
    });
  };

  const handleToggleAllFilteredCandidates = (checked: boolean) => {
    const filteredUuids = filteredCandidates.map((candidate) => candidate.uuid);

    if (checked) {
      setSelectedExportUuids((current) => [...new Set([...current, ...filteredUuids])]);
      return;
    }

    setSelectedExportUuids((current) => current.filter((uuid) => !filteredUuids.includes(uuid)));
  };

  const handleInteractiveExport = async (download: boolean) => {
    if (selectedFilteredExportUuids.length === 0) {
      notifier.warning(
        t("familyTask.templateCollections.selection.required", "Select at least one item before continuing.")
      );
      return;
    }

    const request: TemplateExportRequest = {
      stateFilter: interactiveExportFilter,
      selectionMode: TemplateSelectionMode.SELECTED,
      selectedUuids: selectedFilteredExportUuids,
    };

    await runWithAction(download ? "interactive-export-download" : "interactive-export-preview", async () => {
      if (download) {
        const response = (await exportTemplates(collectionType, request, true)) as AxiosResponse<Blob>;
        const fileName = downloadBlob(response, getExportFallbackName(collectionType));
        notifier.success(
          t("familyTask.templateCollections.export.downloaded", {
            defaultValue: "Downloaded {{fileName}}",
            fileName,
          })
        );
        return;
      }

      const payload = (await exportTemplates(collectionType, request, false)) as AnyTemplateCollectionPayload;
      setPreviewJsonTitle(t("familyTask.templateCollections.preview.selected", "Selected Export Preview"));
      setPreviewJson(JSON.stringify(payload, null, 2));
    });
  };

  const handleDirectFileAction = async (previewOnly: boolean) => {
    const fileValidationError = validateTemplateFile(directImportFile);
    if (fileValidationError) {
      setDirectImportFileError(getFileValidationMessage(fileValidationError));
      return;
    }

    const selectedFile = directImportFile as File;
    setDirectImportFileError(null);

    await runWithAction(previewOnly ? "direct-import-file-preview" : "direct-import-file-execute", async () => {
      if (previewOnly) {
        const response = await previewImportFile(collectionType, selectedFile);
        setImportPreview(response);
        setImportPreviewContext("direct-file");
        return;
      }

      const response = await executeImportFile(collectionType, selectedFile);
      setImportResult(response);
      notifier.success(
        t("familyTask.templateCollections.import.created", {
          defaultValue: "Created {{count}} item(s).",
          count: response.createdItemCount,
        })
      );
    });
  };

  const handleLoadInteractivePayload = async () => {
    setInteractiveParseError(null);
    setSchemaVersionNotice(null);
    setImportPreview(null);
    setImportPreviewContext(null);
    setImportResult(null);

    let rawText = "";
    if (importSourceTab === "upload") {
      const fileValidationError = validateTemplateFile(interactiveImportFile);
      if (fileValidationError) {
        setInteractiveParseError(getFileValidationMessage(fileValidationError));
        return;
      }

      try {
        rawText = await (interactiveImportFile as File).text();
      } catch {
        setInteractiveParseError(t("familyTask.templateCollections.import.fileReadError", "Failed to read file."));
        return;
      }
    } else {
      rawText = interactiveImportText;
    }

    const parsed = safeParseTemplateJson(rawText);
    if (!parsed.ok) {
      setInteractivePayload(null);
      setSelectedImportIndexes([]);
      setInteractiveParseError(getParseErrorMessage(parsed));
      return;
    }

    setInteractivePayload(parsed.payload);
    setSelectedImportIndexes(parsed.payload.items.map((_, index) => String(index)));
    if (parsed.payload.schemaVersion !== "1.0") {
      setSchemaVersionNotice(
        t("familyTask.templateCollections.schemaNotice", {
          defaultValue: 'Unsupported schemaVersion "{{version}}". Supported version is "1.0".',
          version: parsed.payload.schemaVersion,
        })
      );
    }
  };

  const handlePreviewInteractiveImport = async () => {
    if (!interactivePayload || selectedInteractiveIndexes.length === 0) {
      notifier.warning(
        t("familyTask.templateCollections.selection.required", "Select at least one item before continuing.")
      );
      return;
    }

    const payload = buildSelectedTemplatePayload(interactivePayload, selectedInteractiveIndexes);
    await runWithAction("interactive-import-preview", async () => {
      const response = await previewImport(collectionType, payload);
      setImportPreview(response);
      setImportPreviewContext("interactive");
    });
  };

  const handleExecuteInteractiveImport = async () => {
    if (!interactivePayload || selectedInteractiveIndexes.length === 0) {
      notifier.warning(
        t("familyTask.templateCollections.selection.required", "Select at least one item before continuing.")
      );
      return;
    }

    if (disableInteractiveImport) {
      notifier.warning(
        t(
          "familyTask.templateCollections.import.blocked",
          "Import is blocked because preview contains invalid items. Fix data or reduce selection first."
        )
      );
      return;
    }

    const payload = buildSelectedTemplatePayload(interactivePayload, selectedInteractiveIndexes);
    await runWithAction("interactive-import-execute", async () => {
      const response = await executeImport(collectionType, payload);
      setImportResult(response);
      notifier.success(
        t("familyTask.templateCollections.import.created", {
          defaultValue: "Created {{count}} item(s).",
          count: response.createdItemCount,
        })
      );
    });
  };

  const handleCopyPreviewJson = async () => {
    if (!previewJson) {
      return;
    }

    if (!navigator.clipboard) {
      notifier.error(t("familyTask.templateCollections.copy.notAvailable", "Clipboard API is not available."));
      return;
    }

    try {
      await navigator.clipboard.writeText(previewJson);
      notifier.success(t("familyTask.templateCollections.copy.success", "JSON copied to clipboard."));
    } catch {
      notifier.error(t("familyTask.templateCollections.copy.failure", "Failed to copy JSON."));
    }
  };

  return (
    <FamilyTaskPageShell>
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">
            {t("familyTask.templateCollections.title", "Template Collections")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(
              "familyTask.templateCollections.description",
              "Export and import reusable routine, chore, and reward templates."
            )}
          </p>
        </div>

        <Card>
          <CardHeader className="gap-3">
            <CardTitle>{t("familyTask.templateCollections.controls", "Collection Controls")}</CardTitle>
            <CardDescription>
              {t("familyTask.templateCollections.pickType", "Choose template collection type.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[minmax(0,260px)_1fr]">
            <div className="space-y-2">
              <label htmlFor="template-type-select" className="text-sm font-medium">
                {t("familyTask.templateCollections.type", "Collection type")}
              </label>
              <Select
                value={collectionType}
                onValueChange={(next) => resetContextForCollection(next as CollectionType)}
              >
                <SelectTrigger id="template-type-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routines">
                    {t("familyTask.templateCollections.collection.routines", "Routines")}
                  </SelectItem>
                  <SelectItem value="chores">
                    {t("familyTask.templateCollections.collection.chores", "Chores")}
                  </SelectItem>
                  <SelectItem value="rewards">
                    {t("familyTask.templateCollections.collection.rewards", "Rewards")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              {collectionContract}
            </div>
          </CardContent>
        </Card>

        <div className="inline-flex rounded-lg border p-1">
          <Button
            type="button"
            variant={activeTab === "export" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("export")}
          >
            {t("familyTask.templateCollections.tabs.export", "Export")}
          </Button>
          <Button
            type="button"
            variant={activeTab === "import" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("import")}
          >
            {t("familyTask.templateCollections.tabs.import", "Import")}
          </Button>
        </div>

        {screenError ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {screenError}
          </div>
        ) : null}

        {validationIssues.length > 0 ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <p className="font-medium">
              {t("familyTask.templateCollections.validation.title", "Validation issues returned by backend:")}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {validationIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {activeTab === "export" ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("familyTask.templateCollections.export.direct.title", "Direct Export")}</CardTitle>
                <CardDescription>
                  {t(
                    "familyTask.templateCollections.export.direct.description",
                    "Export all filtered items and preview or download backend-generated JSON."
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
                  <div className="space-y-2">
                    <label htmlFor="direct-export-filter" className="text-sm font-medium">
                      {t("familyTask.templateCollections.export.stateFilter", "State filter")}
                    </label>
                    <Select
                      value={directExportFilter}
                      onValueChange={(value) => setDirectExportFilter(value as TemplateStateFilter)}
                    >
                      <SelectTrigger id="direct-export-filter" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TemplateStateFilterEnum.ALL}>
                          {t("familyTask.templateCollections.filters.all", "All")}
                        </SelectItem>
                        <SelectItem value={TemplateStateFilterEnum.ACTIVE}>
                          {t("familyTask.templateCollections.filters.active", "Active")}
                        </SelectItem>
                        <SelectItem value={TemplateStateFilterEnum.INACTIVE}>
                          {t("familyTask.templateCollections.filters.inactive", "Inactive")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => void handleDirectExportPreview()}
                    disabled={actionKey !== null}
                    variant="outline"
                  >
                    <Eye className="size-4" />
                    {t("familyTask.templateCollections.previewJson", "Preview JSON")}
                  </Button>
                  <Button type="button" onClick={() => void handleDirectExportDownload()} disabled={actionKey !== null}>
                    <Download className="size-4" />
                    {t("familyTask.templateCollections.downloadJson", "Download JSON")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t("familyTask.templateCollections.export.interactive.title", "Interactive Export")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "familyTask.templateCollections.export.interactive.description",
                    "Load candidates, select individual items, then preview or download selected templates."
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="w-full max-w-xs space-y-2">
                    <label htmlFor="interactive-export-filter" className="text-sm font-medium">
                      {t("familyTask.templateCollections.export.stateFilter", "State filter")}
                    </label>
                    <Select
                      value={interactiveExportFilter}
                      onValueChange={(value) => setInteractiveExportFilter(value as TemplateStateFilter)}
                    >
                      <SelectTrigger id="interactive-export-filter" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TemplateStateFilterEnum.ALL}>
                          {t("familyTask.templateCollections.filters.all", "All")}
                        </SelectItem>
                        <SelectItem value={TemplateStateFilterEnum.ACTIVE}>
                          {t("familyTask.templateCollections.filters.active", "Active")}
                        </SelectItem>
                        <SelectItem value={TemplateStateFilterEnum.INACTIVE}>
                          {t("familyTask.templateCollections.filters.inactive", "Inactive")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleLoadCandidates()}
                    disabled={actionKey !== null}
                  >
                    <Upload className="size-4" />
                    {t("familyTask.templateCollections.export.loadCandidates", "Load candidates")}
                  </Button>
                </div>

                {collectionType === "routines" ? (
                  <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox
                      checked={groupRoutinesInExport}
                      onCheckedChange={(checked) => setGroupRoutinesInExport(checked === true)}
                    />
                    <span>{t("familyTask.templateCollections.grouping.toggleExport", "Group by routine slot")}</span>
                  </label>
                ) : null}

                {exportCandidates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("familyTask.templateCollections.export.noCandidates", "No candidates loaded yet.")}
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAllFilteredCandidates(!allFilteredSelected)}
                      >
                        {allFilteredSelected
                          ? t("familyTask.templateCollections.selection.clearFiltered", "Clear filtered selection")
                          : t("familyTask.templateCollections.selection.selectFiltered", "Select all filtered")}
                      </Button>
                      <span>
                        {t("familyTask.templateCollections.selection.counter", {
                          defaultValue: "{{selected}} selected out of {{total}} filtered",
                          selected: selectedFilteredExportUuids.length,
                          total: filteredCandidates.length,
                        })}
                      </span>
                    </div>

                    {collectionType === "routines" && groupRoutinesInExport ? (
                      <div className="space-y-3">
                        {groupedRoutineExportCandidates.map((group) => (
                          <Collapsible key={group.slot} defaultOpen>
                            <div className="overflow-hidden rounded-lg border">
                              <CollapsibleTrigger asChild>
                                <button
                                  type="button"
                                  className="flex w-full items-center justify-between gap-2 bg-muted/30 px-3 py-2 text-left text-sm font-medium hover:bg-muted/40 [&[data-state=open]>svg]:rotate-90"
                                >
                                  <span>
                                    {getRoutineSlotLabel(group.slot)}{" "}
                                    <span className="text-muted-foreground">({group.items.length})</span>
                                  </span>
                                  <ChevronRight className="size-4 transition-transform" />
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="border-t bg-background">
                                <div className="p-2">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="w-12">
                                          <span className="sr-only">
                                            {t("familyTask.templateCollections.selectLabel", "Select")}
                                          </span>
                                        </TableHead>
                                        <TableHead>
                                          {t("familyTask.templateCollections.columns.title", "Title")}
                                        </TableHead>
                                        <TableHead>
                                          {t("familyTask.templateCollections.columns.recurrence", "Recurrence")}
                                        </TableHead>
                                        <TableHead>
                                          {t("familyTask.templateCollections.columns.starsReward", "Stars")}
                                        </TableHead>
                                        <TableHead>
                                          {t("familyTask.templateCollections.columns.active", "Status")}
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {group.items.map((candidate) => (
                                        <TableRow key={candidate.uuid}>
                                          <TableCell>
                                            <Checkbox
                                              checked={selectedExportUuids.includes(candidate.uuid)}
                                              onCheckedChange={(checked) => {
                                                setSelectedExportUuids((current) =>
                                                  buildNextSelection(current, candidate.uuid, checked === true)
                                                );
                                              }}
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex items-center gap-2">
                                              <span className="inline-flex size-6 items-center justify-center rounded-md bg-muted">
                                                <NotoEmoji emoji={candidate.emoji ?? ""} size={14} fallback="•" />
                                              </span>
                                              <span className="font-medium">{candidate.title}</span>
                                            </div>
                                          </TableCell>
                                          <TableCell>{candidate.recurrenceType}</TableCell>
                                          <TableCell>{candidate.starsReward}</TableCell>
                                          <TableCell>
                                            <span
                                              className={cn(
                                                "inline-flex rounded-md border px-2 py-0.5 text-xs font-medium",
                                                candidate.active
                                                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                                  : "border-slate-300 bg-slate-100 text-slate-700"
                                              )}
                                            >
                                              {candidate.active
                                                ? t("familyTask.templateCollections.filters.active", "Active")
                                                : t("familyTask.templateCollections.filters.inactive", "Inactive")}
                                            </span>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        ))}
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <span className="sr-only">
                                {t("familyTask.templateCollections.selectLabel", "Select")}
                              </span>
                            </TableHead>
                            <TableHead>{t("familyTask.templateCollections.columns.title", "Title")}</TableHead>
                            {collectionType === "routines" ? (
                              <>
                                <TableHead>
                                  {t("familyTask.templateCollections.columns.recurrence", "Recurrence")}
                                </TableHead>
                                <TableHead>{t("familyTask.templateCollections.columns.slot", "Slot")}</TableHead>
                                <TableHead>
                                  {t("familyTask.templateCollections.columns.starsReward", "Stars")}
                                </TableHead>
                              </>
                            ) : null}
                            {collectionType === "chores" ? (
                              <>
                                <TableHead>
                                  {t("familyTask.templateCollections.columns.starsReward", "Stars")}
                                </TableHead>
                                <TableHead>{t("familyTask.templateCollections.columns.dueDate", "Due date")}</TableHead>
                              </>
                            ) : null}
                            {collectionType === "rewards" ? (
                              <>
                                <TableHead>
                                  {t("familyTask.templateCollections.columns.starsCost", "Stars cost")}
                                </TableHead>
                                <TableHead>
                                  {t("familyTask.templateCollections.columns.availableQuantity", "Available quantity")}
                                </TableHead>
                              </>
                            ) : null}
                            <TableHead>{t("familyTask.templateCollections.columns.active", "Status")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCandidates.map((candidate) => (
                            <TableRow key={candidate.uuid}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedExportUuids.includes(candidate.uuid)}
                                  onCheckedChange={(checked) => {
                                    setSelectedExportUuids((current) =>
                                      buildNextSelection(current, candidate.uuid, checked === true)
                                    );
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex size-6 items-center justify-center rounded-md bg-muted">
                                    <NotoEmoji emoji={candidate.emoji ?? ""} size={14} fallback="•" />
                                  </span>
                                  <span className="font-medium">{candidate.title}</span>
                                </div>
                              </TableCell>
                              {collectionType === "routines" ? (
                                <>
                                  <TableCell>{(candidate as RoutineTemplateCandidateDto).recurrenceType}</TableCell>
                                  <TableCell>{(candidate as RoutineTemplateCandidateDto).routineSlot}</TableCell>
                                  <TableCell>{(candidate as RoutineTemplateCandidateDto).starsReward}</TableCell>
                                </>
                              ) : null}
                              {collectionType === "chores" ? (
                                <>
                                  <TableCell>{(candidate as ChoreTemplateCandidateDto).starsReward}</TableCell>
                                  <TableCell>
                                    {formatLocalDate((candidate as ChoreTemplateCandidateDto).dueDate, i18n.language)}
                                  </TableCell>
                                </>
                              ) : null}
                              {collectionType === "rewards" ? (
                                <>
                                  <TableCell>{(candidate as RewardTemplateCandidateDto).starsCost}</TableCell>
                                  <TableCell>
                                    {(candidate as RewardTemplateCandidateDto).availableQuantity === null
                                      ? t("familyTask.templateCollections.unlimited", "Unlimited")
                                      : (candidate as RewardTemplateCandidateDto).availableQuantity}
                                  </TableCell>
                                </>
                              ) : null}
                              <TableCell>
                                <span
                                  className={cn(
                                    "inline-flex rounded-md border px-2 py-0.5 text-xs font-medium",
                                    candidate.active
                                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                      : "border-slate-300 bg-slate-100 text-slate-700"
                                  )}
                                >
                                  {candidate.active
                                    ? t("familyTask.templateCollections.filters.active", "Active")
                                    : t("familyTask.templateCollections.filters.inactive", "Inactive")}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handleInteractiveExport(false)}
                        disabled={actionKey !== null || selectedFilteredExportUuids.length === 0}
                      >
                        <Eye className="size-4" />
                        {t("familyTask.templateCollections.previewSelectedJson", "Preview Selected JSON")}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => void handleInteractiveExport(true)}
                        disabled={actionKey !== null || selectedFilteredExportUuids.length === 0}
                      >
                        <Download className="size-4" />
                        {t("familyTask.templateCollections.downloadSelectedJson", "Download Selected JSON")}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("familyTask.templateCollections.import.direct.title", "Direct File Import")}</CardTitle>
                <CardDescription>
                  {t(
                    "familyTask.templateCollections.import.direct.description",
                    "Upload a JSON file and preview or import it directly via backend file endpoints."
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="file"
                  accept=".json,application/json"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setDirectImportFile(file);
                    setDirectImportFileError(null);
                    setImportPreview(null);
                    setImportPreviewContext(null);
                  }}
                />
                {directImportFileError ? <p className="text-sm text-destructive">{directImportFileError}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleDirectFileAction(true)}
                    disabled={actionKey !== null}
                  >
                    <Eye className="size-4" />
                    {t("familyTask.templateCollections.previewFile", "Preview File")}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleDirectFileAction(false)}
                    disabled={actionKey !== null}
                  >
                    <Upload className="size-4" />
                    {t("familyTask.templateCollections.importFile", "Import File")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t("familyTask.templateCollections.import.interactive.title", "Interactive Import")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "familyTask.templateCollections.import.interactive.description",
                    "Load JSON from file or pasted text, select items, preview import result, then import selection."
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="inline-flex rounded-lg border p-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={importSourceTab === "upload" ? "default" : "ghost"}
                    onClick={() => setImportSourceTab("upload")}
                  >
                    {t("familyTask.templateCollections.import.source.upload", "Upload JSON file")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={importSourceTab === "paste" ? "default" : "ghost"}
                    onClick={() => setImportSourceTab("paste")}
                  >
                    {t("familyTask.templateCollections.import.source.paste", "Paste JSON")}
                  </Button>
                </div>

                {importSourceTab === "upload" ? (
                  <div className="space-y-3">
                    <Input
                      type="file"
                      accept=".json,application/json"
                      onChange={(event) => setInteractiveImportFile(event.target.files?.[0] ?? null)}
                    />
                    <Button type="button" variant="outline" onClick={() => void handleLoadInteractivePayload()}>
                      <FileJson className="size-4" />
                      {t("familyTask.templateCollections.import.loadJson", "Load JSON")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      className="min-h-44 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                      value={interactiveImportText}
                      onChange={(event) => setInteractiveImportText(event.target.value)}
                      placeholder={t(
                        "familyTask.templateCollections.import.pastePlaceholder",
                        "Paste template collection JSON here..."
                      )}
                    />
                    <Button type="button" variant="outline" onClick={() => void handleLoadInteractivePayload()}>
                      <FileJson className="size-4" />
                      {t("familyTask.templateCollections.import.loadJson", "Load JSON")}
                    </Button>
                  </div>
                )}

                {interactiveParseError ? <p className="text-sm text-destructive">{interactiveParseError}</p> : null}
                {schemaVersionNotice ? (
                  <p className="text-sm text-amber-700 dark:text-amber-300">{schemaVersionNotice}</p>
                ) : null}

                {interactivePayload ? (
                  <div className="space-y-3">
                    <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                      {t("familyTask.templateCollections.import.payloadSummary", {
                        defaultValue: "schemaVersion: {{version}} · items: {{count}}",
                        version: interactivePayload.schemaVersion,
                        count: interactivePayload.items.length,
                      })}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (!interactivePayload) {
                            return;
                          }

                          if (allInteractiveItemsSelected) {
                            setSelectedImportIndexes([]);
                            setImportPreview(null);
                            setImportPreviewContext(null);
                            return;
                          }

                          setSelectedImportIndexes(interactivePayload.items.map((_, index) => String(index)));
                          setImportPreview(null);
                          setImportPreviewContext(null);
                        }}
                      >
                        {allInteractiveItemsSelected
                          ? t("familyTask.templateCollections.selection.clearAll", "Clear all")
                          : t("familyTask.templateCollections.selection.selectAll", "Select all")}
                      </Button>
                      <span>
                        {t("familyTask.templateCollections.selection.counter", {
                          defaultValue: "{{selected}} selected out of {{total}} filtered",
                          selected: selectedImportIndexes.length,
                          total: interactivePayload.items.length,
                        })}
                      </span>
                    </div>

                    {collectionType === "routines" ? (
                      <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                          checked={groupRoutinesInImport}
                          onCheckedChange={(checked) => setGroupRoutinesInImport(checked === true)}
                        />
                        <span>
                          {t("familyTask.templateCollections.grouping.toggleImport", "Group by routine slot")}
                        </span>
                      </label>
                    ) : null}

                    {collectionType === "routines" && groupRoutinesInImport ? (
                      <div className="space-y-3">
                        {groupedRoutineImportRows.map((group) => (
                          <Collapsible key={group.slot} defaultOpen>
                            <div className="overflow-hidden rounded-lg border">
                              <CollapsibleTrigger asChild>
                                <button
                                  type="button"
                                  className="flex w-full items-center justify-between gap-2 bg-muted/30 px-3 py-2 text-left text-sm font-medium hover:bg-muted/40 [&[data-state=open]>svg]:rotate-90"
                                >
                                  <span>
                                    {getRoutineSlotLabel(group.slot)}{" "}
                                    <span className="text-muted-foreground">({group.items.length})</span>
                                  </span>
                                  <ChevronRight className="size-4 transition-transform" />
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="border-t bg-background">
                                <div className="p-2">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="w-12">
                                          <span className="sr-only">
                                            {t("familyTask.templateCollections.selectLabel", "Select")}
                                          </span>
                                        </TableHead>
                                        <TableHead>
                                          {t("familyTask.templateCollections.columns.title", "Title")}
                                        </TableHead>
                                        <TableHead>
                                          {t("familyTask.templateCollections.columns.recurrence", "Recurrence")}
                                        </TableHead>
                                        <TableHead>
                                          {t("familyTask.templateCollections.columns.starsReward", "Stars")}
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {group.items.map((entry) => (
                                        <TableRow key={entry.rowId}>
                                          <TableCell>
                                            <Checkbox
                                              checked={selectedImportIndexes.includes(entry.rowId)}
                                              onCheckedChange={(checked) => {
                                                setSelectedImportIndexes((current) =>
                                                  buildNextSelection(current, entry.rowId, checked === true)
                                                );
                                                setImportPreview(null);
                                                setImportPreviewContext(null);
                                              }}
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex items-center gap-2">
                                              <span className="inline-flex size-6 items-center justify-center rounded-md bg-muted">
                                                <NotoEmoji
                                                  emoji={toDisplayValue(entry.row.emoji, "")}
                                                  size={14}
                                                  fallback="•"
                                                />
                                              </span>
                                              <div>
                                                <p className="font-medium">
                                                  {toDisplayValue(
                                                    entry.row.title,
                                                    t("familyTask.templateCollections.import.itemFallbackTitle", {
                                                      defaultValue: "Item {{index}}",
                                                      index: entry.index + 1,
                                                    })
                                                  )}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                  {toDisplayValue(entry.row.description)}
                                                </p>
                                              </div>
                                            </div>
                                          </TableCell>
                                          <TableCell>{toDisplayValue(entry.row.recurrenceType)}</TableCell>
                                          <TableCell>{toDisplayValue(entry.row.starsReward)}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        ))}
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <span className="sr-only">
                                {t("familyTask.templateCollections.selectLabel", "Select")}
                              </span>
                            </TableHead>
                            <TableHead>{t("familyTask.templateCollections.columns.title", "Title")}</TableHead>
                            {collectionType === "routines" ? (
                              <>
                                <TableHead>
                                  {t("familyTask.templateCollections.columns.recurrence", "Recurrence")}
                                </TableHead>
                                <TableHead>{t("familyTask.templateCollections.columns.slot", "Slot")}</TableHead>
                                <TableHead>
                                  {t("familyTask.templateCollections.columns.starsReward", "Stars")}
                                </TableHead>
                              </>
                            ) : null}
                            {collectionType === "chores" ? (
                              <TableHead>{t("familyTask.templateCollections.columns.starsReward", "Stars")}</TableHead>
                            ) : null}
                            {collectionType === "rewards" ? (
                              <>
                                <TableHead>
                                  {t("familyTask.templateCollections.columns.starsCost", "Stars cost")}
                                </TableHead>
                                <TableHead>
                                  {t("familyTask.templateCollections.columns.availableQuantity", "Available quantity")}
                                </TableHead>
                              </>
                            ) : null}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {interactiveImportRows.map((entry) => (
                            <TableRow key={entry.rowId}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedImportIndexes.includes(entry.rowId)}
                                  onCheckedChange={(checked) => {
                                    setSelectedImportIndexes((current) =>
                                      buildNextSelection(current, entry.rowId, checked === true)
                                    );
                                    setImportPreview(null);
                                    setImportPreviewContext(null);
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex size-6 items-center justify-center rounded-md bg-muted">
                                    <NotoEmoji emoji={toDisplayValue(entry.row.emoji, "")} size={14} fallback="•" />
                                  </span>
                                  <div>
                                    <p className="font-medium">
                                      {toDisplayValue(
                                        entry.row.title,
                                        t("familyTask.templateCollections.import.itemFallbackTitle", {
                                          defaultValue: "Item {{index}}",
                                          index: entry.index + 1,
                                        })
                                      )}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {toDisplayValue(entry.row.description)}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              {collectionType === "routines" ? (
                                <>
                                  <TableCell>{toDisplayValue(entry.row.recurrenceType)}</TableCell>
                                  <TableCell>{toDisplayValue(entry.row.routineSlot)}</TableCell>
                                  <TableCell>{toDisplayValue(entry.row.starsReward)}</TableCell>
                                </>
                              ) : null}
                              {collectionType === "chores" ? (
                                <TableCell>{toDisplayValue(entry.row.starsReward)}</TableCell>
                              ) : null}
                              {collectionType === "rewards" ? (
                                <>
                                  <TableCell>{toDisplayValue(entry.row.starsCost)}</TableCell>
                                  <TableCell>
                                    {entry.row.availableQuantity === null
                                      ? t("familyTask.templateCollections.unlimited", "Unlimited")
                                      : toDisplayValue(entry.row.availableQuantity)}
                                  </TableCell>
                                </>
                              ) : null}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handlePreviewInteractiveImport()}
                        disabled={actionKey !== null || selectedImportIndexes.length === 0}
                      >
                        <Eye className="size-4" />
                        {t("familyTask.templateCollections.previewImport", "Preview Import")}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => void handleExecuteInteractiveImport()}
                        disabled={actionKey !== null || selectedImportIndexes.length === 0 || disableInteractiveImport}
                      >
                        <Upload className="size-4" />
                        {t("familyTask.templateCollections.importSelected", "Import Selected")}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        )}

        {previewJson ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>{previewJsonTitle}</CardTitle>
                <CardDescription>
                  {t("familyTask.templateCollections.preview.pretty", "Backend-generated prettified JSON preview.")}
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => void handleCopyPreviewJson()}>
                <Copy className="size-4" />
                {t("familyTask.templateCollections.copyJson", "Copy JSON")}
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs leading-relaxed">
                {previewJson}
              </pre>
            </CardContent>
          </Card>
        ) : null}

        {showImportPreview ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("familyTask.templateCollections.import.preview.title", "Import Preview Result")}</CardTitle>
              <CardDescription>
                {t(
                  "familyTask.templateCollections.import.preview.description",
                  "Review counts and validation details before executing import."
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border bg-muted/20 px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    {t("familyTask.templateCollections.import.preview.total", "Total")}
                  </p>
                  <p className="text-lg font-semibold">{importPreview.totalItemCount}</p>
                </div>
                <div className="rounded-md border bg-muted/20 px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    {t("familyTask.templateCollections.import.preview.valid", "Valid")}
                  </p>
                  <p className="text-lg font-semibold">{importPreview.validItemCount}</p>
                </div>
                <div className="rounded-md border bg-muted/20 px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    {t("familyTask.templateCollections.import.preview.invalid", "Invalid")}
                  </p>
                  <p className="text-lg font-semibold">{importPreview.invalidItemCount}</p>
                </div>
                <div className="rounded-md border bg-muted/20 px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    {t("familyTask.templateCollections.import.preview.wouldCreate", "Would create")}
                  </p>
                  <p className="text-lg font-semibold">{importPreview.wouldCreateCount}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-medium">{t("familyTask.templateCollections.import.preview.warnings", "Warnings")}</p>
                {importPreview.warnings.length === 0 ? (
                  <p className="text-muted-foreground">
                    {t("familyTask.templateCollections.import.preview.noWarnings", "No warnings.")}
                  </p>
                ) : (
                  <ul className="list-disc space-y-1 pl-5">
                    {importPreview.warnings.map((warning, index) => (
                      <li key={`${warning.itemIndex}-${warning.field}-${index}`}>
                        [{warning.itemIndex}] {warning.field}: {warning.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <p className="font-medium">{t("familyTask.templateCollections.import.preview.errors", "Errors")}</p>
                {importPreview.errors.length === 0 ? (
                  <p className="text-muted-foreground">
                    {t("familyTask.templateCollections.import.preview.noErrors", "No errors.")}
                  </p>
                ) : (
                  <ul className="list-disc space-y-1 pl-5">
                    {importPreview.errors.map((issue, index) => (
                      <li key={`${issue.itemIndex}-${issue.field}-${index}`}>
                        [{issue.itemIndex}] {issue.field}: {issue.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {importResult ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("familyTask.templateCollections.import.success", "Import Completed")}</CardTitle>
              <CardDescription>
                {t("familyTask.templateCollections.import.successDescription", "Templates were imported successfully.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                {t("familyTask.templateCollections.import.successCounts", {
                  defaultValue: "Created {{created}} out of {{requested}} requested item(s).",
                  created: importResult.createdItemCount,
                  requested: importResult.requestedItemCount,
                })}
              </p>
              <p className="text-muted-foreground">
                {t(
                  "familyTask.templateCollections.import.draftNote",
                  "Imported items are inactive and unassigned drafts. Assign profiles before activation."
                )}
              </p>
              <div>
                <Button asChild variant="outline" size="sm">
                  <Link to={collectionListRoute}>
                    {t("familyTask.templateCollections.import.openList", {
                      defaultValue: "Open {{collection}} list",
                      collection: collectionLabel,
                    })}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </FamilyTaskPageShell>
  );
}
