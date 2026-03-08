import { Card, CardContent } from "@/components/ui/card";

export function StatCard({ label, value }: { label: string; value: number | string }) {
    return (
        <Card className="rounded-xl border shadow-sm min-w-20 py-0">
            <CardContent className="px-3 py-1.5">
                <div className="text-[11px] text-muted-foreground leading-tight">{label}</div>
                <div className="text-base font-semibold leading-tight">{value}</div>
            </CardContent>
        </Card>
    );
}
