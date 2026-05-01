import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { listItemsApi, listSectionsApi, listsApi } from "../api/listsApi";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { canManageFamilyTask } from "../domain/access";
import { useFamilyTaskErrorHandler } from "../hooks/useFamilyTaskErrorHandler";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import type { FamilyListDto, ListItemDto, ListSectionDto } from "../models/dto";

export function ListsPage() {
  const { t } = useTranslation();
  useTrackFamilyTaskPageView("lists");
  const { handleError } = useFamilyTaskErrorHandler();

  const { principal } = useAuth();
  const canManage = canManageFamilyTask(principal);

  const [lists, setLists] = useState<FamilyListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listsApi.getAll(true);
      setLists(data);
    } catch (error: unknown) {
      handleError(error, {
        fallbackKey: "familyTask.errors.lists",
        fallbackMessage: "Failed to load lists.",
        setError,
      });
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      return;
    }

    setCreating(true);
    setError(null);

    try {
      await listsApi.create({ title: newTitle.trim(), description: newDescription || undefined });
      setNewTitle("");
      setNewDescription("");
      await load();
    } catch (error: unknown) {
      handleError(error, {
        fallbackKey: "familyTask.errors.listSave",
        fallbackMessage: "Failed to create list.",
        setError,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (listUuid: string) => {
    if (!window.confirm(t("common.confirmDelete", "Are you sure?"))) {
      return;
    }

    setError(null);

    try {
      await listsApi.remove(listUuid);
      await load();
    } catch (error: unknown) {
      handleError(error, {
        fallbackKey: "familyTask.errors.listDelete",
        fallbackMessage: "Failed to delete list.",
        setError,
      });
    }
  };

  return (
    <FamilyTaskPageShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">{t("familyTask.lists.title", "Family Lists")}</h1>

        {canManage && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              className="rounded-md border bg-background px-3 py-2 text-sm"
              placeholder={t("familyTask.lists.newPlaceholder", "New list name...")}
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
            />
            <input
              className="rounded-md border bg-background px-3 py-2 text-sm"
              placeholder={t("familyTask.chores.form.description", "Description")}
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
            />
            <button
              disabled={creating || !newTitle.trim()}
              onClick={() => void handleCreate()}
              className="sm:col-span-2 bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm hover:opacity-90 disabled:opacity-50 transition"
            >
              {creating ? t("common.saving", "Saving...") : t("common.add", "Add")}
            </button>
          </div>
        )}

        {loading && <p className="text-muted-foreground">{t("common.loading", "Loading...")}</p>}
        {error && (
          <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm">
            {t(error, "Failed to load lists.")}
          </div>
        )}
        {!loading && !error && lists.length === 0 && (
          <p className="text-muted-foreground">{t("familyTask.lists.noLists", "No lists found.")}</p>
        )}

        <div className="space-y-2">
          {lists.map((list) => (
            <div
              key={list.uuid}
              className="rounded-lg border bg-card px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <Link
                  to={`/family-tasks/lists/${list.uuid}`}
                  className="font-medium text-sm hover:underline underline-offset-2"
                >
                  {list.title}
                </Link>
                {list.description && <p className="text-xs text-muted-foreground truncate">{list.description}</p>}
              </div>

              {canManage && (
                <button
                  onClick={() => void handleDelete(list.uuid)}
                  className="text-xs border border-destructive text-destructive px-3 py-1 rounded-md hover:bg-destructive/10 transition"
                >
                  {t("common.delete", "Delete")}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </FamilyTaskPageShell>
  );
}

interface SectionWithItems {
  section: ListSectionDto | null;
  items: ListItemDto[];
}

export function ListDetailsPage() {
  const { t } = useTranslation();
  useTrackFamilyTaskPageView("list_details");
  const { handleError } = useFamilyTaskErrorHandler();

  const { principal } = useAuth();
  const canManage = canManageFamilyTask(principal);

  const { listUuid } = useParams<{ listUuid: string }>();
  const [list, setList] = useState<FamilyListDto | null>(null);
  const [sections, setSections] = useState<ListSectionDto[]>([]);
  const [items, setItems] = useState<ListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemNotes, setNewItemNotes] = useState("");
  const [newItemSectionUuid, setNewItemSectionUuid] = useState("");

  const load = useCallback(async () => {
    if (!listUuid) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [listData, sectionData, itemData] = await Promise.all([
        listsApi.getById(listUuid),
        listSectionsApi.getByList(listUuid),
        listItemsApi.getByList(listUuid),
      ]);

      setList(listData);
      setSections(sectionData.sort((a, b) => a.sortOrder - b.sortOrder));
      setItems(itemData.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (error: unknown) {
      handleError(error, {
        fallbackKey: "familyTask.errors.listDetails",
        fallbackMessage: "Failed to load list details.",
        setError,
      });
    } finally {
      setLoading(false);
    }
  }, [handleError, listUuid]);

  useEffect(() => {
    void load();
  }, [load]);

  const groupedSections = useMemo(() => {
    const result: SectionWithItems[] = [];

    for (const section of sections) {
      result.push({
        section,
        items: items.filter((item) => item.sectionUuid === section.uuid),
      });
    }

    const unsectioned = items.filter((item) => !item.sectionUuid);
    if (unsectioned.length > 0 || result.length === 0) {
      result.unshift({ section: null, items: unsectioned });
    }

    return result;
  }, [items, sections]);

  const handleAddSection = async () => {
    if (!listUuid || !newSectionTitle.trim()) {
      return;
    }

    try {
      await listSectionsApi.create({
        listUuid,
        title: newSectionTitle.trim(),
        sortOrder: sections.length + 1,
      });

      setNewSectionTitle("");
      await load();
    } catch (error: unknown) {
      handleError(error, {
        fallbackKey: "familyTask.errors.listSectionSave",
        fallbackMessage: "Failed to add section.",
        setError,
      });
    }
  };

  const handleAddItem = async () => {
    if (!listUuid || !newItemTitle.trim()) {
      return;
    }

    try {
      await listItemsApi.create({
        listUuid,
        title: newItemTitle.trim(),
        notes: newItemNotes || undefined,
        sectionUuid: newItemSectionUuid || undefined,
        sortOrder: items.length + 1,
      });

      setNewItemTitle("");
      setNewItemNotes("");
      setNewItemSectionUuid("");
      await load();
    } catch (error: unknown) {
      handleError(error, {
        fallbackKey: "familyTask.errors.listItemSave",
        fallbackMessage: "Failed to add list item.",
        setError,
      });
    }
  };

  const handleToggleItem = async (itemUuid: string) => {
    try {
      await listItemsApi.toggleComplete(itemUuid);
      await load();
    } catch (error: unknown) {
      handleError(error, {
        fallbackKey: "familyTask.errors.listItemToggle",
        fallbackMessage: "Failed to update list item.",
        setError,
      });
    }
  };

  const handleDeleteItem = async (itemUuid: string) => {
    try {
      await listItemsApi.remove(itemUuid);
      await load();
    } catch (error: unknown) {
      handleError(error, {
        fallbackKey: "familyTask.errors.listItemDelete",
        fallbackMessage: "Failed to delete list item.",
        setError,
      });
    }
  };

  return (
    <FamilyTaskPageShell>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link to="/family-tasks/lists" className="text-sm text-primary hover:underline">
            {t("common.back", "Back")}
          </Link>
          <h1 className="text-2xl font-semibold">{list?.title ?? t("familyTask.lists.title", "Family Lists")}</h1>
        </div>

        {loading && <p className="text-muted-foreground">{t("common.loading", "Loading...")}</p>}
        {error && <p className="text-sm text-destructive">{t(error, "Failed to load list details.")}</p>}

        {canManage && !loading && !error && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                placeholder={t("familyTask.lists.newSection", "New section")}
                value={newSectionTitle}
                onChange={(event) => setNewSectionTitle(event.target.value)}
              />
              <button
                onClick={() => void handleAddSection()}
                disabled={!newSectionTitle.trim()}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm disabled:opacity-50"
              >
                {t("common.add", "Add")}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                className="rounded-md border bg-background px-3 py-2 text-sm"
                placeholder={t("familyTask.lists.addItem", "Add item")}
                value={newItemTitle}
                onChange={(event) => setNewItemTitle(event.target.value)}
              />
              <input
                className="rounded-md border bg-background px-3 py-2 text-sm"
                placeholder={t("familyTask.lists.itemNotes", "Notes")}
                value={newItemNotes}
                onChange={(event) => setNewItemNotes(event.target.value)}
              />
              <select
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={newItemSectionUuid}
                onChange={(event) => setNewItemSectionUuid(event.target.value)}
              >
                <option value="">{t("familyTask.lists.noSection", "No section")}</option>
                {sections.map((section) => (
                  <option key={section.uuid} value={section.uuid}>
                    {section.title}
                  </option>
                ))}
              </select>
              <button
                className="sm:col-span-3 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm disabled:opacity-50"
                onClick={() => void handleAddItem()}
                disabled={!newItemTitle.trim()}
              >
                {t("common.add", "Add")}
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {groupedSections.map((group, index) => (
              <section key={group.section?.uuid ?? `default-${index}`}>
                <h2 className="text-sm font-semibold mb-2">
                  {group.section?.title ?? t("familyTask.lists.defaultSection", "Items")}
                </h2>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <div key={item.uuid} className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => void handleToggleItem(item.uuid)}
                        className="cursor-pointer"
                      />
                      <span className={`flex-1 text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                        {item.title}
                      </span>
                      {canManage && (
                        <button
                          onClick={() => void handleDeleteItem(item.uuid)}
                          className="text-xs text-destructive hover:underline"
                        >
                          {t("common.delete", "Delete")}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </FamilyTaskPageShell>
  );
}
