import { NotificationProvider } from "./base";

export class WhatsAppProvider implements NotificationProvider {
    async send(config: any, to: string, content: string, metadata?: any): Promise<{ success: boolean; providerId?: string; error?: string }> {
        try {
            const { phoneNumberId, accessToken } = config;

            if (!phoneNumberId || !accessToken) {
                return { success: false, error: "Missing WhatsApp configuration (phoneNumberId or accessToken)" };
            }

            // Simple text message payload
            // For templates, metadata would need to contain { type: 'template', templateName: '...', language: '...', components: [...] }
            let body: any;

            if (metadata?.type === 'template') {
                body = {
                    messaging_product: "whatsapp",
                    to,
                    type: "template",
                    template: {
                        name: metadata.templateName,
                        language: {
                            code: metadata.language || "en_US"
                        },
                        components: metadata.components || []
                    }
                };
            } else {
                body = {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to,
                    type: "text",
                    text: { preview_url: false, body: content }
                };
            }

            const response = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, error: data.error?.message || "WhatsApp API Error" };
            }

            return { success: true, providerId: data.messages?.[0]?.id };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}
