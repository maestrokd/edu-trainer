import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ProfileForm, type ProfileFormData } from "./ProfileForm";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { useAuth } from "@/contexts/AuthContext.tsx";
import TenantProfilesService from "@/services/TenantProfilesService";
import { notifier } from "@/services/NotificationService";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler.ts";

export const CreateSecondaryProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { handleError } = useApiErrorHandler();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { principal } = useAuth();
  const tenantUuid = principal?.activeTenantUuid ?? null;
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: ProfileFormData) =>
      TenantProfilesService.createTenantProfile(tenantUuid as string, {
        username: data.username,
        password: data.password || "",
        firstName: data.firstName?.trim() || undefined,
        lastName: data.lastName?.trim() || undefined,
        locale: data.locale || undefined,
      }),
    onSuccess: () => {
      setSubmitError(null);
      notifier.success(t("pages.createProfile.success", "Profile created successfully"));
      queryClient.invalidateQueries({ queryKey: ["secondaryProfiles", tenantUuid] });
      navigate("/settings/profiles");
    },
    onError: (error: unknown) => {
      handleError(error, {
        fallbackKey: "pages.createProfile.error",
        fallbackMessage: "Failed to create profile",
        setError: setSubmitError,
      });
      console.error(error);
    },
  });

  const handleSubmit = async (data: ProfileFormData) => {
    if (!tenantUuid) {
      return;
    }

    setSubmitError(null);
    await createMutation.mutateAsync(data);
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

  return (
    <ProfileForm
      mode="create"
      onSubmit={handleSubmit}
      isLoading={createMutation.isPending}
      submitError={submitError}
      onCancel={() => navigate("/settings/profiles")}
    />
  );
};

export default CreateSecondaryProfilePage;
