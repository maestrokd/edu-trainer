import { useCallback, useEffect, useState } from "react";
import { taskOccurrencesApi, type TaskHistoryFilters, type TaskOccurrenceFilters } from "../api/taskOccurrencesApi";
import type {
  ReviewTaskCompletionRequest,
  SubmitTaskCompletionRequest,
  TaskCompletionEventDto,
  TaskOccurrenceDto,
} from "../models/dto";

export function useTodayTasks(profileUuid?: string) {
  const [tasks, setTasks] = useState<TaskOccurrenceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await taskOccurrencesApi.getToday(profileUuid);
      setTasks(data);
    } catch {
      setError("familyTask.errors.today");
    } finally {
      setLoading(false);
    }
  }, [profileUuid]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = useCallback(async (occurrenceUuid: string, payload?: SubmitTaskCompletionRequest) => {
    const updated = await taskOccurrencesApi.submit(occurrenceUuid, payload);
    setTasks((prev) => prev.map((item) => (item.uuid === occurrenceUuid ? updated : item)));
    return updated;
  }, []);

  return { tasks, loading, error, refetch: load, submit };
}

export function useTaskOccurrences(filters?: TaskOccurrenceFilters) {
  const [tasks, setTasks] = useState<TaskOccurrenceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await taskOccurrencesApi.getOccurrences(filters);
      setTasks(data);
    } catch {
      setError("familyTask.errors.occurrences");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = useCallback(async (occurrenceUuid: string, payload?: SubmitTaskCompletionRequest) => {
    const updated = await taskOccurrencesApi.submit(occurrenceUuid, payload);
    setTasks((prev) => prev.map((item) => (item.uuid === occurrenceUuid ? updated : item)));
    return updated;
  }, []);

  return { tasks, loading, error, refetch: load, submit };
}

export function useApprovalQueue(enabled = true) {
  const [queue, setQueue] = useState<TaskOccurrenceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!enabled) {
        setQueue([]);
        return;
      }

      const data = await taskOccurrencesApi.getApprovalQueue();
      setQueue(data);
    } catch {
      setError("familyTask.errors.approvalQueue");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = useCallback(async (occurrenceUuid: string, payload?: ReviewTaskCompletionRequest) => {
    const updated = await taskOccurrencesApi.approve(occurrenceUuid, payload);
    setQueue((prev) => prev.filter((item) => item.uuid !== updated.uuid));
    return updated;
  }, []);

  const reject = useCallback(async (occurrenceUuid: string, payload?: ReviewTaskCompletionRequest) => {
    const updated = await taskOccurrencesApi.reject(occurrenceUuid, payload);
    setQueue((prev) => prev.filter((item) => item.uuid !== updated.uuid));
    return updated;
  }, []);

  return { queue, loading, error, refetch: load, approve, reject };
}

export function useTaskHistory(filters?: TaskHistoryFilters) {
  const [events, setEvents] = useState<TaskCompletionEventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await taskOccurrencesApi.getHistory(filters);
      setEvents(data);
    } catch {
      setError("familyTask.errors.taskHistory");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  return { events, loading, error, refetch: load };
}

export function useOccurrenceHistory(occurrenceUuid?: string) {
  const [events, setEvents] = useState<TaskCompletionEventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!occurrenceUuid) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await taskOccurrencesApi.getOccurrenceHistory(occurrenceUuid);
      setEvents(data);
    } catch {
      setError("familyTask.errors.taskHistory");
    } finally {
      setLoading(false);
    }
  }, [occurrenceUuid]);

  useEffect(() => {
    void load();
  }, [load]);

  return { events, loading, error, refetch: load };
}
