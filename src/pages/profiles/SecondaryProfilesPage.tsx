import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { notifier } from "@/services/NotificationService.ts";
import ProfileService, { type UserProfilesDto } from "@/services/ProfileService.ts";

export const SecondaryProfilesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch profiles
  const {
    data: profiles = { items: [] },
    isLoading,
    isError,
  } = useQuery<UserProfilesDto>({
    queryKey: ["secondaryProfiles"],
    queryFn: ProfileService.listSecondaries,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => ProfileService.deleteSecondary(uuid),
    onSuccess: () => {
      notifier.success(t("pages.secondaryProfiles.notifications.deleteSuccess", "Profile deleted successfully"));
      queryClient.invalidateQueries({ queryKey: ["secondaryProfiles"] });
    },
    onError: () => {
      notifier.error(t("pages.secondaryProfiles.notifications.deleteError", "Failed to delete profile"));
    },
  });

  const handleDelete = async (uuid: string) => {
    if (confirm(t("pages.secondaryProfiles.confirmDelete", "Are you sure you want to delete this profile?"))) {
      await deleteMutation.mutateAsync(uuid);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("pages.secondaryProfiles.title", "Secondary Profiles")}</h1>
        <Button onClick={() => navigate("create")}>
          <Plus className="mr-2 h-4 w-4" />
          {t("pages.secondaryProfiles.createButton", "Create Profile")}
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="animate-spin h-6 w-6" />
        </div>
      )}

      {!isLoading && isError && (
        <Alert variant="destructive">
          <AlertDescription>{t("pages.secondaryProfiles.loadError", "Failed to load profiles.")}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !isError && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("pages.secondaryProfiles.columns.name", "Name")}</TableHead>
                <TableHead>{t("pages.secondaryProfiles.columns.username", "Username")}</TableHead>
                <TableHead>{t("pages.secondaryProfiles.columns.locale", "Locale")}</TableHead>
                <TableHead className="w-[100px]">{t("pages.secondaryProfiles.columns.actions", "Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                    {t("pages.secondaryProfiles.empty", "No secondary profiles found.")}
                  </TableCell>
                </TableRow>
              ) : (
                profiles.items.map((profile) => (
                  <TableRow key={profile.uuid}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {profile.firstName && profile.lastName
                            ? `${profile.firstName} ${profile.lastName}`
                            : profile.username}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{profile.username}</TableCell>
                    <TableCell>{profile.locale}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`${profile.uuid}/edit`)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("common.edit", "Edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(profile.uuid)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("common.delete", "Delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default SecondaryProfilesPage;
