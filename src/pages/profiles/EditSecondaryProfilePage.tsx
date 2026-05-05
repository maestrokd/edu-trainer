import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ProfileForm, type ProfileFormData } from "./ProfileForm";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { useAuth } from "@/contexts/AuthContext.tsx";
import TenantProfilesService from "@/services/TenantProfilesService";
import { notifier } from "@/services/NotificationService";
import { Loader2 } from "lucide-react";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler.ts";

export const EditSecondaryProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { getErrorMessage, handleError } = useApiErrorHandler();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { principal } = useAuth();
  const tenantUuid = principal?.activeTenantUuid ?? null;
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    data: profile,
    isLoading: isLoadingProfile,
    isError: isLoadError,
    error: loadError,
  } = useQuery({
    queryKey: ["secondaryProfile", tenantUuid, id],
    queryFn: () => TenantProfilesService.getTenantProfile(tenantUuid as string, id as string),
    enabled: Boolean(id && tenantUuid),
  });

  const loadErrorMessage = useMemo(() => {
    if (!isLoadError) return null;
    return getErrorMessage(loadError, {
      fallbackKey: "pages.editProfile.loadError",
      fallbackMessage: "Failed to load profile.",
    });
  }, [getErrorMessage, isLoadError, loadError]);

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) =>
      TenantProfilesService.patchTenantProfile(tenantUuid as string, id as string, {
        firstName: data.firstName?.trim() || undefined,
        lastName: data.lastName?.trim() || undefined,
        locale: data.locale || undefined,
        password: data.password || undefined,
      }),
    onSuccess: () => {
      setSubmitError(null);
      notifier.success(t("pages.editProfile.success", "Profile updated successfully"));
      queryClient.invalidateQueries({ queryKey: ["secondaryProfiles", tenantUuid] });
      queryClient.invalidateQueries({ queryKey: ["secondaryProfile", tenantUuid, id] });
      navigate("/settings/profiles");
    },
    onError: (error: unknown) => {
      handleError(error, {
        fallbackKey: "pages.editProfile.error",
        fallbackMessage: "Failed to update profile",
        setError: setSubmitError,
      });
      console.error(error);
    },
  });

  const handleSubmit = async (data: ProfileFormData) => {
    if (!id || !tenantUuid) return;
    setSubmitError(null);
    await updateMutation.mutateAsync(data);
  };

  if (!tenantUuid) {
    return (
      <div className="bg-background p-4">
        <Alert variant="destructive">
          <AlertDescription>
            {t("pages.tenantProfiles.errors.noActiveTenant", "No active tenant found. Switch tenant and try again.")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center flex-1 bg-background">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (loadErrorMessage) {
    return (
      <div className="bg-background p-4">
        <Alert variant="destructive">
          <AlertDescription>{loadErrorMessage}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center flex-1 bg-background">
        <p>{t("pages.editProfile.notFound", "Profile not found")}</p>
      </div>
    );
  }

  return (
    <ProfileForm
      mode="edit"
      initialData={{
        username: profile.username ?? "",
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        locale: profile.locale || "en-US",
      }}
      onSubmit={handleSubmit}
      isLoading={updateMutation.isPending}
      submitError={submitError}
      onCancel={() => navigate("/settings/profiles")}
    />
  );
};

export default EditSecondaryProfilePage;
