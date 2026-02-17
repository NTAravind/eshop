import { NotificationProvider } from "./base";
import nodemailer from "nodemailer";

export class EmailProvider implements NotificationProvider {
    async send(config: any, to: string, content: string, metadata?: any): Promise<{ success: boolean; providerId?: string; error?: string }> {
        try {
            const { user, pass, from, service } = config;

            if (!user || !pass) {
                return { success: false, error: "Missing Email configuration (user or pass)" };
            }

            const transporter = nodemailer.createTransport({
                service: service || "gmail",
                auth: {
                    user,
                    pass,
                },
            });

            const mailOptions = {
                from: from || user,
                to,
                subject: metadata?.subject || "Notification",
                text: metadata?.html ? undefined : content,
                html: metadata?.html || (metadata?.isHtml ? content : undefined),
            };

            const info = await transporter.sendMail(mailOptions);

            return { success: true, providerId: info.messageId };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}
