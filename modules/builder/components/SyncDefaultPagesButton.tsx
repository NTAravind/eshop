"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

interface SyncDefaultPagesButtonProps {
    storeId: string;
}

export function SyncDefaultPagesButton({ storeId }: SyncDefaultPagesButtonProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleClick = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/admin/update-default-pages?storeId=${storeId}`, {
                method: "POST",
            });

            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.error || "Failed to update default pages");
            }

            router.refresh();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to update default pages";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Button onClick={handleClick} variant="secondary" size="sm" disabled={loading}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                {loading ? "Updating..." : "Sync Default Pages"}
            </Button>
            {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
    );
}
