import React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronsUpDown, LogIn, LogOut } from "lucide-react";
import { useAuth } from "./AuthProvider";

type Props = {
  variant?: "header" | "sidebar";
};

const AuthStatus: React.FC<Props> = ({ variant = "sidebar" }) => {
  const { user, loading, error, signOut } = useAuth();
  const { t } = useTranslation();
  const { isMobile } = useSidebar();

  const displayName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email;
  const avatarUrl =
    (user?.user_metadata as { avatar_url?: string; picture?: string } | undefined)
      ?.avatar_url ||
    (user?.user_metadata as { picture?: string } | undefined)?.picture;
  const avatarInitials =
    displayName?.slice(0, 2)?.toUpperCase() || user?.email?.[0]?.toUpperCase() ||
    "?";

  if (variant === "header") {
    return (
      <div className="flex items-center gap-2">
        {loading ? (
          <Skeleton className="h-9 w-24" />
        ) : user ? (
          <>
            <div className="flex flex-col text-right leading-tight">
              <span className="text-xs text-muted-foreground">
                {t("auth.signedInAs")}
              </span>
              <span className="text-sm font-medium truncate max-w-[12ch]">
                {displayName}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>
              {t("auth.logoutAction")}
            </Button>
          </>
        ) : (
          <Button variant="secondary" size="sm" asChild>
            <Link to="/auth/sign-in">{t("auth.signInTitle")}</Link>
          </Button>
        )}
        {error && (
          <span
            className="text-destructive text-xs max-w-[180px] truncate"
            title={error}
          >
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {loading ? (
        <Skeleton className="h-14 w-full" />
      ) : user ? (
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={avatarUrl} alt={displayName || "User"} />
                    <AvatarFallback className="rounded-lg">
                      {avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={avatarUrl} alt={displayName || "User"} />
                      <AvatarFallback className="rounded-lg">
                        {avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{displayName}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                  <LogOut className="mr-2 size-4" />
                  {t("auth.logoutAction")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      ) : (
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link
                to="/auth/sign-in"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    <LogIn className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {t("auth.signInTitle")}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {t("auth.notSignedIn")}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      )}

      {error && (
        <div className="text-destructive text-xs" title={error}>
          {error}
        </div>
      )}
    </div>
  );
};

export default AuthStatus;
