export interface NotificationProvider {
    send(config: any, to: string, content: string, metadata?: any): Promise<{ success: boolean; providerId?: string; error?: string }>;
}
