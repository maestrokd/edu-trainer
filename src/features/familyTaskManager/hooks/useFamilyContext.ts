import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { childProfilesApi } from "../api/childProfilesApi";
import { familyFamiliesApi, householdMembersApi } from "../api/familyApi";
import type { ChildProfileDto, FamilyInfoDto, HouseholdMemberDto } from "../models/dto";

function is404(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

export function useFamilyContext() {
  const [family, setFamily] = useState<FamilyInfoDto | null>(null);
  const [members, setMembers] = useState<HouseholdMemberDto[]>([]);
  const [profiles, setProfiles] = useState<ChildProfileDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [familyResult, membersResult, profilesResult] = await Promise.allSettled([
      familyFamiliesApi.getMyFamily(),
      householdMembersApi.getMembers(),
      childProfilesApi.getAll(),
    ]);

    if (familyResult.status === "fulfilled") {
      setFamily(familyResult.value);
    } else if (!is404(familyResult.reason)) {
      setError("familyTask.errors.familyContext");
    }

    if (membersResult.status === "fulfilled") {
      setMembers(membersResult.value);
    } else {
      setError("familyTask.errors.familyContext");
    }

    if (profilesResult.status === "fulfilled") {
      setProfiles(profilesResult.value);
    } else {
      setError("familyTask.errors.familyContext");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    family,
    members,
    profiles,
    loading,
    error,
    refetch: load,
  };
}
