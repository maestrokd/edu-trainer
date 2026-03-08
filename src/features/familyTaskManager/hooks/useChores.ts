import { useCallback, useEffect, useState } from "react";
import { choresApi, type ChoreFilters } from "../api/choresApi";
import type { ChoreDto, CreateChoreRequest, PatchChoreRequest } from "../models/dto";

export function useChores(filters?: ChoreFilters) {
  const [chores, setChores] = useState<ChoreDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await choresApi.getAll(filters);
      setChores(data);
    } catch {
      setError("familyTask.errors.chores");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(async (data: CreateChoreRequest) => {
    const created = await choresApi.create(data);
    setChores((prev) => [...prev, created]);
    return created;
  }, []);

  const update = useCallback(async (choreUuid: string, data: PatchChoreRequest) => {
    const updated = await choresApi.update(choreUuid, data);
    setChores((prev) => prev.map((item) => (item.uuid === choreUuid ? updated : item)));
    return updated;
  }, []);

  const remove = useCallback(async (choreUuid: string) => {
    await choresApi.remove(choreUuid);
    setChores((prev) => prev.filter((item) => item.uuid !== choreUuid));
  }, []);

  return { chores, loading, error, refetch: load, create, update, remove };
}
