import { useCallback, useEffect, useState } from "react";
import { routinesApi, type RoutineFilters } from "../api/routinesApi";
import { useFamilyTaskErrorHandler } from "./useFamilyTaskErrorHandler";
import type { CreateRoutineRequest, PatchRoutineRequest, RoutineDto } from "../models/dto";

export function useRoutines(filters?: RoutineFilters) {
  const [routines, setRoutines] = useState<RoutineDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useFamilyTaskErrorHandler();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await routinesApi.getAll(filters);
      setRoutines(data);
    } catch (error: unknown) {
      handleError(error, {
        fallbackKey: "familyTask.errors.routines",
        fallbackMessage: "Failed to load routines.",
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
    async (data: CreateRoutineRequest) => {
      try {
        const created = await routinesApi.create(data);
        setRoutines((prev) => [...prev, created]);
        return created;
      } catch (error: unknown) {
        handleError(error, {
          fallbackKey: "familyTask.errors.routineSave",
          fallbackMessage: "Failed to save routine.",
          setError,
        });
      }
    },
    [handleError]
  );

  const update = useCallback(
    async (routineUuid: string, data: PatchRoutineRequest) => {
      try {
        const updated = await routinesApi.update(routineUuid, data);
        setRoutines((prev) => prev.map((item) => (item.uuid === routineUuid ? updated : item)));
        return updated;
      } catch (error: unknown) {
        handleError(error, {
          fallbackKey: "familyTask.errors.routineSave",
          fallbackMessage: "Failed to save routine.",
          setError,
        });
      }
    },
    [handleError]
  );

  const remove = useCallback(
    async (routineUuid: string) => {
      try {
        await routinesApi.remove(routineUuid);
        setRoutines((prev) => prev.filter((item) => item.uuid !== routineUuid));
      } catch (error: unknown) {
        handleError(error, {
          fallbackKey: "familyTask.errors.routineDelete",
          fallbackMessage: "Failed to delete routine.",
          setError,
        });
      }
    },
    [handleError]
  );

  return { routines, loading, error, refetch: load, create, update, remove };
}
