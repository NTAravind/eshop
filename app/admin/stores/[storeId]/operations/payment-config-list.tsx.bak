"use client";

import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { togglePaymentConfig } from "@/app/actions/payment-config";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface PaymentConfigListProps {
    configs: any[];
}

export function PaymentConfigList({ configs }: PaymentConfigListProps) {

    const handleToggle = async (id: string, currentState: boolean) => {
        try {
            const res = await fetch(`/api/admin/payment-configs/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentState }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update");
            }

            toast.success(`Payment method ${!currentState ? 'enabled' : 'disabled'}`);
            // To refresh the UI immediately without full page reload, we rely on the parent or router refresh
            // But since this is a transition from Server Action (which did revalidatePath), we need:
            // window.location.reload() OR router.refresh()
            window.location.reload();
        } catch (error: any) {
            toast.error(error.message || "Failed to update payment method");
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {configs.length === 0 && (
                    <div className="text-sm text-muted-foreground">No payment methods configured.</div>
                )}
                {configs.map((config) => (
                    <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{config.provider}</span>
                                {config.isLive ? (
                                    <Badge variant="default" className="text-[10px] px-1 h-5">LIVE</Badge>
                                ) : (
                                    <Badge variant="secondary" className="text-[10px] px-1 h-5">TEST</Badge>
                                )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {config.isActive ? "Active" : "Inactive"}
                            </div>
                        </div>
                        <Switch
                            checked={config.isActive}
                            onCheckedChange={() => handleToggle(config.id, config.isActive)}
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
