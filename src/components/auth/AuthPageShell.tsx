import React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AuthPageShellProps {
  title: string;
  description: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const AuthPageShell: React.FC<AuthPageShellProps> = ({
  title,
  description,
  footer,
  children,
}) => {
  return (
    <div className="min-h-dvh w-full bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Card className="border shadow bg-white/80 dark:bg-slate-900/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold leading-tight">
              {title}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {children}
            {footer && (
              <div className="pt-2 border-t text-sm text-muted-foreground">
                {footer}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPageShell;
