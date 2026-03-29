import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BidDetailsField {
  label: string;
  value: ReactNode;
}

interface BidDetailsSectionProps {
  title: string;
  fields: BidDetailsField[];
}

export function BidDetailsSection({ title, fields }: BidDetailsSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => (
            <div key={field.label} className="space-y-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{field.label}</dt>
              <dd className="break-words text-sm">{field.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export type { BidDetailsField };
