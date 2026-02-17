import { NotificationProvider } from "./base";

export class MobilePushProvider implements NotificationProvider {
    async send(config: any, to: string, content: string, metadata?: any): Promise<{ success: boolean; providerId?: string; error?: string }> {
        try {
            // Expo doesn't strictly require an access token for low volume, but good to support
            const { accessToken } = config;

            // 'to' is the Expo Push Token (e.g., ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx])
            if (!to.startsWith('ExponentPushToken[')) {
                return { success: false, error: "Invalid Expo Push Token" };
            }

            const message = {
                to,
                sound: 'default',
                body: content,
                title: metadata?.title || "Notification",
                data: metadata?.data,
            };

            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
                },
                body: JSON.stringify([message]),
            });

            const data = await response.json();

            // Expo returns { data: [ { status: 'ok', id: '...' } ] } or { data: [ { status: 'error', message: '...' } ] }
            // Note: It returns 200 OK even for partial failures often, need to check inside data
            if (data?.data?.[0]?.status === 'error') {
                return { success: false, error: data.data[0].message || "Expo API Error" };
            }

            if (data?.errors) {
                return { success: false, error: JSON.stringify(data.errors) };
            }

            return { success: true, providerId: data?.data?.[0]?.id };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}
