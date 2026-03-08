import { useCallback, useEffect, useState } from "react";
import { routinesApi, type RoutineFilters } from "../api/routinesApi";
import type { CreateRoutineRequest, PatchRoutineRequest, RoutineDto } from "../models/dto";

export function useRoutines(filters?: RoutineFilters) {
  const [routines, setRoutines] = useState<RoutineDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await routinesApi.getAll(filters);
      setRoutines(data);
    } catch {
      setError("familyTask.errors.routines");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(async (data: CreateRoutineRequest) => {
    const created = await routinesApi.create(data);
    setRoutines((prev) => [...prev, created]);
    return created;
  }, []);

  const update = useCallback(async (routineUuid: string, data: PatchRoutineRequest) => {
    const updated = await routinesApi.update(routineUuid, data);
    setRoutines((prev) => prev.map((item) => (item.uuid === routineUuid ? updated : item)));
    return updated;
  }, []);

  const remove = useCallback(async (routineUuid: string) => {
    await routinesApi.remove(routineUuid);
    setRoutines((prev) => prev.filter((item) => item.uuid !== routineUuid));
  }, []);

  return { routines, loading, error, refetch: load, create, update, remove };
}
