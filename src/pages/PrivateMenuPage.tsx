import React from "react";
import { useCustomHeader } from "@/contexts/HeaderContext";

export default function PrivateMenuPage() {
    const headerNode = React.useMemo(
        () => (
            <div className="flex items-center text-center justify-center-safe w-full h-full px-2">
                <span className="text-lg font-semibold leading-none">
                    Private Menu Page
                </span>
            </div>
        ),
        [],
    );

    useCustomHeader(headerNode, { visible: true });

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Private Menu Page</h1>
            <p className="text-muted-foreground">
                This is a dummy page to demonstrate the custom header and layout behavior.
            </p>
        </div>
    );
}
