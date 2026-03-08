import { useCallback, useEffect, useState } from "react";
import { rewardRedemptionsApi, rewardsApi, starsApi } from "../api/rewardsApi";
import type {
  CreateRedemptionRequest,
  CreateRewardRequest,
  PatchRewardRequest,
  RewardDto,
  RewardRedemptionDto,
  ReviewRewardRedemptionRequest,
  StarLedgerEntryDto,
  StarsBalanceDto,
} from "../models/dto";
import type { FamilyRewardRedemptionStatus } from "../models/enums";

export function useRewards(active?: boolean) {
  const [rewards, setRewards] = useState<RewardDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await rewardsApi.getAll(active);
      setRewards(data);
    } catch {
      setError("familyTask.errors.rewards");
    } finally {
      setLoading(false);
    }
  }, [active]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(async (data: CreateRewardRequest) => {
    const created = await rewardsApi.create(data);
    setRewards((prev) => [...prev, created]);
    return created;
  }, []);

  const update = useCallback(async (rewardUuid: string, data: PatchRewardRequest) => {
    const updated = await rewardsApi.update(rewardUuid, data);
    setRewards((prev) => prev.map((item) => (item.uuid === rewardUuid ? updated : item)));
    return updated;
  }, []);

  const remove = useCallback(async (rewardUuid: string) => {
    await rewardsApi.remove(rewardUuid);
    setRewards((prev) => prev.filter((item) => item.uuid !== rewardUuid));
  }, []);

  return { rewards, loading, error, refetch: load, create, update, remove };
}

export function useStarsBalance(secondaryProfileUuid?: string) {
  const [balance, setBalance] = useState<StarsBalanceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await starsApi.getBalance(secondaryProfileUuid);
      setBalance(data);
    } catch {
      setError("familyTask.errors.starBalance");
    } finally {
      setLoading(false);
    }
  }, [secondaryProfileUuid]);

  useEffect(() => {
    void load();
  }, [load]);

  return { balance, loading, error, refetch: load };
}

export function useStarsHistory(secondaryProfileUuid?: string) {
  const [entries, setEntries] = useState<StarLedgerEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await starsApi.getHistory(secondaryProfileUuid);
      setEntries(data);
    } catch {
      setError("familyTask.errors.starHistory");
    } finally {
      setLoading(false);
    }
  }, [secondaryProfileUuid]);

  useEffect(() => {
    void load();
  }, [load]);

  return { entries, loading, error, refetch: load };
}

export function useRewardRedemptions(status?: FamilyRewardRedemptionStatus) {
  const [redemptions, setRedemptions] = useState<RewardRedemptionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await rewardRedemptionsApi.getAll(status);
      setRedemptions(data);
    } catch {
      setError("familyTask.errors.redemptions");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(async (data: CreateRedemptionRequest) => {
    const created = await rewardRedemptionsApi.create(data);
    setRedemptions((prev) => [created, ...prev]);
    return created;
  }, []);

  const approve = useCallback(async (redemptionUuid: string, data?: ReviewRewardRedemptionRequest) => {
    const updated = await rewardRedemptionsApi.approve(redemptionUuid, data);
    setRedemptions((prev) => prev.map((item) => (item.uuid === redemptionUuid ? updated : item)));
    return updated;
  }, []);

  const reject = useCallback(async (redemptionUuid: string, data?: ReviewRewardRedemptionRequest) => {
    const updated = await rewardRedemptionsApi.reject(redemptionUuid, data);
    setRedemptions((prev) => prev.map((item) => (item.uuid === redemptionUuid ? updated : item)));
    return updated;
  }, []);

  return { redemptions, loading, error, refetch: load, create, approve, reject };
}
