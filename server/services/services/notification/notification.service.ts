import prisma from '@/lib/prisma';
import { NotificationChannel, NotificationStatus } from '@/app/generated/prisma';
import { WhatsAppProvider } from './providers/whatsapp';
import { EmailProvider } from './providers/email';
import { WebPushProvider } from './providers/web-push';
import { MobilePushProvider } from './providers/mobile-push';
import { InAppNotificationProvider } from './providers/in-app';
import { NotificationProvider } from './providers/base';

const providers: Record<NotificationChannel, NotificationProvider> = {
    [NotificationChannel.WHATSAPP]: new WhatsAppProvider(),
    [NotificationChannel.EMAIL]: new EmailProvider(),
    [NotificationChannel.WEB_PUSH]: new WebPushProvider(),
    [NotificationChannel.MOBILE_PUSH]: new MobilePushProvider(),
    [NotificationChannel.IN_APP]: new InAppNotificationProvider(),
};

/**
 * Send a notification through a specific channel
 */
export async function sendNotification(
    storeId: string,
    channel: NotificationChannel,
    to: string,
    content: string,
    metadata?: any
) {
    // 1. Get configuration
    const configRecord = await prisma.notificationConfig.findUnique({
        where: {
            storeId_channel: {
                storeId,
                channel,
            },
        },
    });

    if (!configRecord || !configRecord.isActive) {
        throw new Error(`Channel ${channel} is not configured or active for this store`);
    }

    // 2. Create Log (Queued)
    const log = await prisma.notificationLog.create({
        data: {
            storeId,
            channel,
            recipient: to.length > 190 ? to.substring(0, 190) + '...' : to, // Truncate if too long (e.g. web push sub)
            content,
            status: NotificationStatus.QUEUED,
        },
    });

    // 3. Send via Provider
    const provider = providers[channel];
    const result = await provider.send(configRecord.config, to, content, metadata);

    // 4. Update Log
    await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
            status: result.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
            error: result.error,
            providerMessageId: result.providerId,
        },
    });

    return {
        id: log.id,
        success: result.success,
        providerId: result.providerId,
        error: result.error,
    };
}

/**
 * Get notification statistics for a store
 */
export async function getNotificationStats(storeId: string) {
    const stats = await prisma.notificationLog.groupBy({
        by: ['channel', 'status'],
        where: { storeId },
        _count: {
            id: true,
        },
    });

    return stats;
}

/**
 * List notification logs for a store
 */
export async function listNotifications(
    storeId: string,
    limit: number = 20
) {
    return prisma.notificationLog.findMany({
        where: { storeId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
            id: true,
            channel: true,
            recipient: true,
            status: true,
            createdAt: true,
            error: true,
        }
    });
}
