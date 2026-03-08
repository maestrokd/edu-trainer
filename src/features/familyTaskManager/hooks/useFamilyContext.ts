import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { FAMILY_CONTEXT_INCLUDE, familyFamiliesApi } from "../api/familyApi";
import { useFamilyTaskErrorHandler } from "./useFamilyTaskErrorHandler";
import type { ChildProfileDto, FamilyInfoDto, HouseholdMemberDto } from "../models/dto";

function is404(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

const FAMILY_CONTEXT_INCLUDES = [FAMILY_CONTEXT_INCLUDE.HOUSEHOLD_MEMBERS, FAMILY_CONTEXT_INCLUDE.CHILD_PROFILES];

function assertFamilyContextIncludes(family: FamilyInfoDto): {
  householdMembers: HouseholdMemberDto[];
  childProfiles: ChildProfileDto[];
} {
  if (!Array.isArray(family.householdMembers) || !Array.isArray(family.childProfiles)) {
    throw new Error("Family context response is missing required include payload.");
  }

  return {
    householdMembers: family.householdMembers,
    childProfiles: family.childProfiles,
  };
}

export function useFamilyContext() {
  const [family, setFamily] = useState<FamilyInfoDto | null>(null);
  const [members, setMembers] = useState<HouseholdMemberDto[]>([]);
  const [profiles, setProfiles] = useState<ChildProfileDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useFamilyTaskErrorHandler();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const familyResult = await familyFamiliesApi.getMyFamily({
        include: [...FAMILY_CONTEXT_INCLUDES],
      });
      const familyContext = assertFamilyContextIncludes(familyResult);

      setFamily(familyResult);
      setMembers(familyContext.householdMembers);
      setProfiles(familyContext.childProfiles);
    } catch (reason: unknown) {
      if (is404(reason)) {
        setFamily(null);
        setMembers([]);
        setProfiles([]);
      } else {
        setFamily(null);
        setMembers([]);
        setProfiles([]);
        handleError(reason, {
          fallbackKey: "familyTask.errors.familyContext",
          fallbackMessage: "Failed to load family context.",
          setError,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [handleError]);

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
