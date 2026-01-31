"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const CHANNELS = [
    { value: "WHATSAPP", label: "WhatsApp", cost: 0.05 },
    { value: "EMAIL", label: "Email", cost: 0.001 },
    { value: "WEB_PUSH", label: "Web Push", cost: 0.00 },
    { value: "MOBILE_PUSH", label: "Mobile Push", cost: 0.00 },
];

export function NotificationSenderClient({ storeId }: { storeId: string }) {
    const [loading, setLoading] = useState(false);
    const [channel, setChannel] = useState("WHATSAPP");
    const [recipient, setRecipient] = useState("");
    const [content, setContent] = useState("");

    const selectedChannel = CHANNELS.find(c => c.value === channel);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/stores/${storeId}/notifications/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    channel,
                    to: recipient,
                    content,
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to send");
            }

            toast.success("Notification sent successfully!");
            setContent("");
            // Optional: clear recipient?
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Send Notification</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Channel</label>
                        <Select value={channel} onValueChange={setChannel}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CHANNELS.map(c => (
                                    <SelectItem key={c.value} value={c.value}>
                                        {c.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="text-xs text-muted-foreground">
                            Estimated Cost: <span className="font-medium text-primary">
                                ${selectedChannel?.cost.toFixed(3)}
                            </span> per message
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Recipient</label>
                        <Input
                            placeholder={channel === 'EMAIL' ? 'user@example.com' : '+1234567890'}
                            value={recipient}
                            onChange={e => setRecipient(e.target.value)}
                            required
                        />
                        <div className="text-xs text-muted-foreground">
                            For Push: Enter Token JSON or ID
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Message</label>
                        <Textarea
                            placeholder="Type your message here..."
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            required
                            rows={4}
                        />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Notification
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
