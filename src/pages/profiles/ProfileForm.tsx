import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Loader2 } from "lucide-react";

export interface ProfileFormData {
  username: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  locale?: string;
}

interface ProfileFormProps {
  initialData?: ProfileFormData;
  mode: "create" | "edit";
  onSubmit: (data: ProfileFormData) => Promise<void>;
  isLoading: boolean;
  onCancel: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ initialData, mode, onSubmit, isLoading, onCancel }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ProfileFormData>({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    locale: "en-US", // Default locale
  });

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="max-w-md w-full mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === "create"
            ? t("pages.profileForm.createTitle", "Create Profile")
            : t("pages.profileForm.editTitle", "Edit Profile")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">{t("pages.profileForm.username", "Username")}</Label>
            <Input
              id="username"
              required
              disabled={mode === "edit" || isLoading} // Username might be immutable or used as ID? Task says update request doesn't include username.
              value={formData.username}
              onChange={(e) => handleChange("username", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstName">{t("pages.profileForm.firstName", "First Name")}</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">{t("pages.profileForm.lastName", "Last Name")}</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="locale">{t("pages.profileForm.locale", "Locale")}</Label>
            <Select value={formData.locale} onValueChange={(val) => handleChange("locale", val)} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select locale" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="uk-UA">Українська</SelectItem>
                <SelectItem value="ru-RU">Русский</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              {mode === "create"
                ? t("pages.profileForm.password", "Password")
                : t("pages.profileForm.newPassword", "New Password (Optional)")}
            </Label>
            <Input
              id="password"
              type="password"
              required={mode === "create"}
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.save", "Save")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
