import { useCallback, useEffect, useMemo, useState } from "react";
import { rewardRedemptionsApi, rewardsApi, starsApi } from "../api/rewardsApi";
import { useFamilyTaskErrorHandler } from "./useFamilyTaskErrorHandler";
import type {
  CreateRedemptionRequest,
  CreateRewardRequest,
  PatchRewardRequest,
  RewardDto,
  RewardRedemptionDto,
  RewardRedemptionsQuery,
  RewardsQuery,
  ReviewRewardRedemptionRequest,
  StarLedgerEntryDto,
  StarsBalanceDto,
} from "../models/dto";
import type { FamilyRewardRedemptionStatus } from "../models/enums";

type UseRewardsInput = boolean | RewardsQuery | undefined;
type UseRewardRedemptionsInput = FamilyRewardRedemptionStatus | RewardRedemptionsQuery | undefined;

function normalizeRewardsInput(input?: UseRewardsInput): RewardsQuery | undefined {
  if (typeof input === "boolean") {
    return { active: input };
  }

  if (!input) {
    return undefined;
  }

  return {
    active: input.active,
    primaryLabelUuid: input.primaryLabelUuid,
    labelUuids: input.labelUuids ? [...input.labelUuids] : undefined,
    labelMatchMode: input.labelMatchMode,
    searchString: input.searchString,
  };
}

function normalizeRewardRedemptionsInput(input?: UseRewardRedemptionsInput): RewardRedemptionsQuery | undefined {
  if (!input) {
    return undefined;
  }

  if (typeof input === "string") {
    return { status: input };
  }

  return {
    status: input.status,
    active: input.active,
    primaryLabelUuid: input.primaryLabelUuid,
    labelUuids: input.labelUuids ? [...input.labelUuids] : undefined,
    labelMatchMode: input.labelMatchMode,
    searchString: input.searchString,
    redeemedFrom: input.redeemedFrom,
    redeemedTo: input.redeemedTo,
    page: input.page,
    size: input.size,
    sort: input.sort ? [...input.sort] : undefined,
  };
}

export function useRewards(filtersOrActive?: UseRewardsInput) {
  const [rewards, setRewards] = useState<RewardDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useFamilyTaskErrorHandler();
  const filtersSignature = useMemo(
    () => JSON.stringify(normalizeRewardsInput(filtersOrActive) ?? {}),
    [filtersOrActive]
  );
  const normalizedFilters = useMemo(() => {
    const parsed = JSON.parse(filtersSignature) as RewardsQuery;
    return Object.keys(parsed).length > 0 ? parsed : undefined;
  }, [filtersSignature]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await rewardsApi.getAll(normalizedFilters);
      setRewards(data);
    } catch (error: unknown) {
      handleError(error, {
        fallbackKey: "familyTask.errors.rewards",
        fallbackMessage: "Failed to load rewards.",
        setError,
      });
    } finally {
      setLoading(false);
    }
  }, [handleError, normalizedFilters]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(
    async (data: CreateRewardRequest) => {
      try {
        const created = await rewardsApi.create(data);
        setRewards((prev) => [...prev, created]);
        return created;
      } catch (error: unknown) {
        handleError(error, {
          fallbackKey: "familyTask.errors.rewardSave",
          fallbackMessage: "Failed to save reward.",
          setError,
        });
      }
    },
    [handleError]
  );

  const update = useCallback(
    async (rewardUuid: string, data: PatchRewardRequest) => {
      try {
        const updated = await rewardsApi.update(rewardUuid, data);
        setRewards((prev) => prev.map((item) => (item.uuid === rewardUuid ? updated : item)));
        return updated;
      } catch (error: unknown) {
        handleError(error, {
          fallbackKey: "familyTask.errors.rewardSave",
          fallbackMessage: "Failed to save reward.",
          setError,
        });
      }
    },
    [handleError]
  );

  const remove = useCallback(
    async (rewardUuid: string) => {
      try {
        await rewardsApi.remove(rewardUuid);
        setRewards((prev) => prev.filter((item) => item.uuid !== rewardUuid));
      } catch (error: unknown) {
        handleError(error, {
          fallbackKey: "familyTask.errors.rewardDelete",
          fallbackMessage: "Failed to delete reward.",
          setError,
        });
      }
    },
    [handleError]
  );

  return { rewards, loading, error, refetch: load, create, update, remove };
}

export function useStarsBalance(secondaryProfileUuid?: string, enabled = true) {
  const [balance, setBalance] = useState<StarsBalanceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useFamilyTaskErrorHandler();

  const load = useCallback(async () => {
    if (!enabled) {
      setBalance(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const items = await starsApi.getBalances(
        secondaryProfileUuid ? { secondaryProfileUuids: [secondaryProfileUuid] } : undefined
      );
      const resolved =
        secondaryProfileUuid != null
          ? (items.find((item) => item.secondaryProfileUuid === secondaryProfileUuid) ?? null)
          : (items[0] ?? null);
      setBalance(resolved);
    } catch (error: unknown) {
      handleError(error, {
        fallbackKey: "familyTask.errors.starBalance",
        fallbackMessage: "Failed to load stars balance.",
        setError,
      });
    } finally {
      setLoading(false);
    }
  }, [enabled, secondaryProfileUuid, handleError]);

  useEffect(() => {
    if (!enabled) {
      setBalance(null);
      setLoading(false);
      setError(null);
      return;
    }

    void load();
  }, [enabled, load]);

  return { balance, loading, error, refetch: load };
}

export function useStarsHistory(secondaryProfileUuid?: string) {
  const [entries, setEntries] = useState<StarLedgerEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useFamilyTaskErrorHandler();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await starsApi.getHistory(secondaryProfileUuid);
      setEntries(data);
    } catch (error: unknown) {
      handleError(error, {
        fallbackKey: "familyTask.errors.starHistory",
        fallbackMessage: "Failed to load stars history.",
        setError,
      });
    } finally {
      setLoading(false);
    }
  }, [secondaryProfileUuid, handleError]);

  useEffect(() => {
    void load();
  }, [load]);

  return { entries, loading, error, refetch: load };
}

export function useRewardRedemptions(queryOrStatus?: UseRewardRedemptionsInput) {
  const [redemptions, setRedemptions] = useState<RewardRedemptionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useFamilyTaskErrorHandler();
  const filtersSignature = useMemo(
    () => JSON.stringify(normalizeRewardRedemptionsInput(queryOrStatus) ?? {}),
    [queryOrStatus]
  );
  const normalizedFilters = useMemo(() => {
    const parsed = JSON.parse(filtersSignature) as RewardRedemptionsQuery;
    return Object.keys(parsed).length > 0 ? parsed : undefined;
  }, [filtersSignature]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await rewardRedemptionsApi.getAll(normalizedFilters);
      setRedemptions(data);
    } catch (error: unknown) {
      handleError(error, {
        fallbackKey: "familyTask.errors.redemptions",
        fallbackMessage: "Failed to load redemptions.",
        setError,
      });
    } finally {
      setLoading(false);
    }
  }, [handleError, normalizedFilters]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(
    async (data: CreateRedemptionRequest) => {
      try {
        const created = await rewardRedemptionsApi.create(data);
        setRedemptions((prev) => [created, ...prev]);
        return created;
      } catch (error: unknown) {
        handleError(error, {
          fallbackKey: "familyTask.errors.redemptionSave",
          fallbackMessage: "Failed to create redemption.",
          setError,
        });
      }
    },
    [handleError]
  );

  const approve = useCallback(
    async (redemptionUuid: string, data?: ReviewRewardRedemptionRequest) => {
      try {
        const updated = await rewardRedemptionsApi.approve(redemptionUuid, data);
        setRedemptions((prev) => prev.map((item) => (item.uuid === redemptionUuid ? updated : item)));
        return updated;
      } catch (error: unknown) {
        handleError(error, {
          fallbackKey: "familyTask.errors.redemptionApprove",
          fallbackMessage: "Failed to approve redemption.",
          setError,
        });
      }
    },
    [handleError]
  );

  const reject = useCallback(
    async (redemptionUuid: string, data?: ReviewRewardRedemptionRequest) => {
      try {
        const updated = await rewardRedemptionsApi.reject(redemptionUuid, data);
        setRedemptions((prev) => prev.map((item) => (item.uuid === redemptionUuid ? updated : item)));
        return updated;
      } catch (error: unknown) {
        handleError(error, {
          fallbackKey: "familyTask.errors.redemptionReject",
          fallbackMessage: "Failed to reject redemption.",
          setError,
        });
      }
    },
    [handleError]
  );

  return { redemptions, loading, error, refetch: load, create, approve, reject };
}
