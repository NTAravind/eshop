"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PaymentConfigFormProps {
    storeId: string;
    existingConfig?: any; // If passed, we are in Edit mode
    onSuccess: () => void;
}

const PROVIDERS = [
    { value: "STRIPE", label: "Stripe" },
    { value: "RAZORPAY", label: "Razorpay" },
    { value: "MANUAL", label: "Manual (Cash/Bank Transfer)" },
];

export function PaymentConfigForm({ storeId, existingConfig, onSuccess }: PaymentConfigFormProps) {
    const [loading, setLoading] = useState(false);
    const [provider, setProvider] = useState(existingConfig?.provider || "STRIPE");
    const [apiKey, setApiKey] = useState(""); // Don't pre-fill purely specific secrets
    const [apiSecret, setApiSecret] = useState("");
    const [webhookSecret, setWebhookSecret] = useState("");
    const [isLive, setIsLive] = useState(existingConfig?.isLive || false);

    const isEditing = !!existingConfig;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = isEditing
                ? `/api/admin/payment-configs/${existingConfig.id}`
                : `/api/admin/payment-configs`;

            const method = isEditing ? "PATCH" : "POST";

            const body: any = {
                isLive,
            };

            // Only send fields if they have values (for updates) or are required (for create)
            if (!isEditing || apiKey) body.apiKey = apiKey;
            if (!isEditing || apiSecret) body.apiSecret = apiSecret;
            if (!isEditing || webhookSecret) body.webhookSecret = webhookSecret;

            if (!isEditing) {
                body.provider = provider;
            }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to save configuration");
            }

            toast.success(`Payment configuration ${isEditing ? "updated" : "created"} successfully`);
            onSuccess();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {!isEditing && (
                <div className="space-y-2">
                    <Label htmlFor="provider">Provider</Label>
                    <Select value={provider} onValueChange={setProvider}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                            {PROVIDERS.map((p) => (
                                <SelectItem key={p.value} value={p.value}>
                                    {p.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="apiKey">
                    {provider === 'MANUAL' ? 'Tracking ID / Reference' : 'API Key / Public Key'}
                </Label>
                <Input
                    id="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={isEditing ? "(Unchanged)" : "Enter key"}
                    required={!isEditing}
                />
            </div>

            {provider !== 'MANUAL' && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="apiSecret">API Secret / Private Key</Label>
                        <Input
                            id="apiSecret"
                            type="password"
                            value={apiSecret}
                            onChange={(e) => setApiSecret(e.target.value)}
                            placeholder={isEditing ? "(Unchanged)" : "Enter secret"}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="webhookSecret">Webhook Secret</Label>
                        <Input
                            id="webhookSecret"
                            type="password"
                            value={webhookSecret}
                            onChange={(e) => setWebhookSecret(e.target.value)}
                            placeholder={isEditing ? "(Unchanged)" : "Enter webhook secret"}
                        />
                    </div>
                </>
            )}

            <div className="flex items-center justify-between border p-3 rounded-lg">
                <div className="space-y-0.5">
                    <Label className="text-base">Live Mode</Label>
                    <div className="text-xs text-muted-foreground">
                        Enable for real transactions
                    </div>
                </div>
                <Switch checked={isLive} onCheckedChange={setIsLive} />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Create Configuration"}
            </Button>
        </form>
    );
}
