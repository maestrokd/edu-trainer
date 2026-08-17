import React from "react";
import { Label } from "@/components/ui/label";

export function LabeledField({
  label,
  htmlFor,
  labelAction,
  children,
}: {
  label: string;
  htmlFor: string;
  labelAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-1">
        <Label htmlFor={htmlFor}>{label}:</Label>
        {labelAction}
      </div>
      {children}
    </div>
  );
}
