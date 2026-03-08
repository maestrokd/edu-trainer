import { useCallback, useEffect, useRef, useState } from "react";
import { taskOccurrencesApi, type TaskHistoryFilters, type TaskOccurrenceFilters } from "../api/taskOccurrencesApi";
import { useFamilyTaskErrorHandler } from "./useFamilyTaskErrorHandler";
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
  const { handleError } = useFamilyTaskErrorHandler();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await taskOccurrencesApi.getToday(profileUuid);
      setTasks(data);
    } catch (error: unknown) {
      handleError(error, {
        fallbackKey: "familyTask.errors.today",
        fallbackMessage: "Failed to load today's tasks.",
        setError,
      });
    } finally {
      setLoading(false);
    }
  }, [profileUuid, handleError]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = useCallback(
    async (occurrenceUuid: string, payload?: SubmitTaskCompletionRequest) => {
      try {
        const updated = await taskOccurrencesApi.submit(occurrenceUuid, payload);
        setTasks((prev) => prev.map((item) => (item.uuid === occurrenceUuid ? updated : item)));
        return updated;
      } catch (error: unknown) {
        handleError(error, {
          fallbackKey: "familyTask.errors.submitTask",
          fallbackMessage: "Failed to submit task completion.",
          setError,
        });
      }
    },
    [handleError]
  );

  return { tasks, loading, error, refetch: load, submit };
}

export function useTaskOccurrences(filters?: TaskOccurrenceFilters) {
  const [tasks, setTasks] = useState<TaskOccurrenceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const { handleError } = useFamilyTaskErrorHandler();

  const load = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    setError(null);

    try {
      const data = await taskOccurrencesApi.getOccurrences(filters);
      if (requestIdRef.current !== requestId) {
        return;
      }
      setTasks(data);
    } catch (error: unknown) {
      if (requestIdRef.current !== requestId) {
        return;
      }
      handleError(error, {
        fallbackKey: "familyTask.errors.occurrences",
        fallbackMessage: "Failed to load task occurrences.",
        setError,
      });
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [filters, handleError]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = useCallback(
    async (occurrenceUuid: string, payload?: SubmitTaskCompletionRequest) => {
      try {
        const updated = await taskOccurrencesApi.submit(occurrenceUuid, payload);
        setTasks((prev) => prev.map((item) => (item.uuid === occurrenceUuid ? updated : item)));
        return updated;
      } catch (error: unknown) {
        handleError(error, {
          fallbackKey: "familyTask.errors.submitTask",
          fallbackMessage: "Failed to submit task completion.",
          setError,
        });
      }
    },
    [handleError]
  );

  return { tasks, loading, error, refetch: load, submit };
}

export function useApprovalQueue(enabled = true) {
  const [queue, setQueue] = useState<TaskOccurrenceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useFamilyTaskErrorHandler();

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
    } catch (error: unknown) {
      handleError(error, {
        fallbackKey: "familyTask.errors.approvalQueue",
        fallbackMessage: "Failed to load approval queue.",
        setError,
      });
    } finally {
      setLoading(false);
    }
  }, [enabled, handleError]);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = useCallback(
    async (occurrenceUuid: string, payload?: ReviewTaskCompletionRequest) => {
      try {
        const updated = await taskOccurrencesApi.approve(occurrenceUuid, payload);
        setQueue((prev) => prev.filter((item) => item.uuid !== updated.uuid));
        return updated;
      } catch (error: unknown) {
        handleError(error, {
          fallbackKey: "familyTask.errors.approveTask",
          fallbackMessage: "Failed to approve task.",
          setError,
        });
      }
    },
    [handleError]
  );

  const reject = useCallback(
    async (occurrenceUuid: string, payload?: ReviewTaskCompletionRequest) => {
      try {
        const updated = await taskOccurrencesApi.reject(occurrenceUuid, payload);
        setQueue((prev) => prev.filter((item) => item.uuid !== updated.uuid));
        return updated;
      } catch (error: unknown) {
        handleError(error, {
          fallbackKey: "familyTask.errors.rejectTask",
          fallbackMessage: "Failed to reject task.",
          setError,
        });
      }
    },
    [handleError]
  );

  return { queue, loading, error, refetch: load, approve, reject };
}

export function useTaskHistory(filters?: TaskHistoryFilters) {
  const [events, setEvents] = useState<TaskCompletionEventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useFamilyTaskErrorHandler();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await taskOccurrencesApi.getHistory(filters);
      setEvents(data);
    } catch (error: unknown) {
      handleError(error, {
        fallbackKey: "familyTask.errors.taskHistory",
        fallbackMessage: "Failed to load task history.",
        setError,
      });
    } finally {
      setLoading(false);
    }
  }, [filters, handleError]);

  useEffect(() => {
    void load();
  }, [load]);

  return { events, loading, error, refetch: load };
}

export function useOccurrenceHistory(occurrenceUuid?: string) {
  const [events, setEvents] = useState<TaskCompletionEventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useFamilyTaskErrorHandler();

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
    } catch (error: unknown) {
      handleError(error, {
        fallbackKey: "familyTask.errors.taskHistory",
        fallbackMessage: "Failed to load task history.",
        setError,
      });
    } finally {
      setLoading(false);
    }
  }, [occurrenceUuid, handleError]);

  useEffect(() => {
    void load();
  }, [load]);

  return { events, loading, error, refetch: load };
}
