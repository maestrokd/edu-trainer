import { useCallback, useEffect, useState } from "react";
import { choresApi, type ChoreFilters } from "../api/choresApi";
import { useFamilyTaskErrorHandler } from "./useFamilyTaskErrorHandler";
import type { ChoreDto, CreateChoreRequest, PatchChoreRequest } from "../models/dto";

export function useChores(filters?: ChoreFilters) {
  const [chores, setChores] = useState<ChoreDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useFamilyTaskErrorHandler();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await choresApi.getAll(filters);
      setChores(data);
    } catch (error: unknown) {
      handleError(error, {
        fallbackKey: "familyTask.errors.chores",
        fallbackMessage: "Failed to load chores.",
        setError,
      });
    } finally {
      setLoading(false);
    }
  }, [filters, handleError]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(
    async (data: CreateChoreRequest) => {
      try {
        const created = await choresApi.create(data);
        setChores((prev) => [...prev, created]);
        return created;
      } catch (error: unknown) {
        handleError(error, {
          fallbackKey: "familyTask.errors.choreSave",
          fallbackMessage: "Failed to save chore.",
          setError,
        });
      }
    },
    [handleError]
  );

  const update = useCallback(
    async (choreUuid: string, data: PatchChoreRequest) => {
      try {
        const updated = await choresApi.update(choreUuid, data);
        setChores((prev) => prev.map((item) => (item.uuid === choreUuid ? updated : item)));
        return updated;
      } catch (error: unknown) {
        handleError(error, {
          fallbackKey: "familyTask.errors.choreSave",
          fallbackMessage: "Failed to save chore.",
          setError,
        });
      }
    },
    [handleError]
  );

  const remove = useCallback(
    async (choreUuid: string) => {
      try {
        await choresApi.remove(choreUuid);
        setChores((prev) => prev.filter((item) => item.uuid !== choreUuid));
      } catch (error: unknown) {
        handleError(error, {
          fallbackKey: "familyTask.errors.choreDelete",
          fallbackMessage: "Failed to delete chore.",
          setError,
        });
      }
    },
    [handleError]
  );

  return { chores, loading, error, refetch: load, create, update, remove };
}
