import { NotificationProvider } from './base';

export class InAppNotificationProvider implements NotificationProvider {
    async send(config: any, to: string, content: string, metadata?: any): Promise<{ success: boolean; providerId?: string; error?: string }> {
        // In-app notifications are typically stored in the database, which is handled by the main service logic (e.g. creating a NotificationLog or a separate InAppNotification table).
        // For now, we'll consider the log creation in the service as the "sending" part, or we could add specific logic here if there's a real-time socket.

        // Return success as the "sending" is just persisting data which happens in the calling service or here if we added a separate table.
        return { success: true, providerId: 'internal' };
    }
}
