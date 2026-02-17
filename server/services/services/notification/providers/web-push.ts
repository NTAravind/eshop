import { NotificationProvider } from "./base";
import webpush from "web-push";

export class WebPushProvider implements NotificationProvider {
    async send(config: any, to: string, content: string, metadata?: any): Promise<{ success: boolean; providerId?: string; error?: string }> {
        try {
            const { subject, publicKey, privateKey } = config;

            if (!subject || !publicKey || !privateKey) {
                return { success: false, error: "Missing Web Push configuration (subject, publicKey, or privateKey)" };
            }

            webpush.setVapidDetails(
                subject, // e.g., 'mailto:admin@example.com'
                publicKey,
                privateKey
            );

            // 'to' should be the stringified subscription object or the subscription object itself
            let subscription;
            try {
                subscription = typeof to === 'string' ? JSON.parse(to) : to;
            } catch (e) {
                return { success: false, error: "Invalid Web Push subscription format" };
            }

            const payload = JSON.stringify({
                title: metadata?.title || "Notification",
                body: content,
                icon: metadata?.icon,
                ...metadata
            });

            await webpush.sendNotification(subscription, payload);

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message || "Web Push Error" };
        }
    }
}
