import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { FeatureFlag, getFeatureFlags } from "@/services/featureFlagsApi";

export function useFeatureFlag(feature: FeatureFlag): boolean {
  const { isAuthenticated } = useAuth();
  const query = useQuery({
    queryKey: ["feature-flags"],
    queryFn: ({ signal }) => getFeatureFlags(signal),
    enabled: isAuthenticated,
    staleTime: 0,
    retry: false,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });

  // React Query retains previous data after a failed refresh; status must also be successful.
  return isAuthenticated && query.isSuccess && query.data[feature] === true;
}
