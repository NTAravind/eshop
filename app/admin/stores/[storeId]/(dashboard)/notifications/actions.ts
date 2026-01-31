'use server';

import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { requireStoreRole } from '@/lib/auth/requireStore';
import { NotificationChannel } from '@/app/generated/prisma';
import { revalidatePath } from 'next/cache';

const DEFAULT_TEMPLATES: Record<string, Record<NotificationChannel, { subject?: string; content: string }>> = {
    ORDER_COMPLETE: {
        [NotificationChannel.EMAIL]: {
            subject: 'Your order {orderId} is complete!',
            content: 'Hi {customerName}, your order of {amount} has been completed. Thank you for shopping with {storeName}.'
        },
        [NotificationChannel.WHATSAPP]: {
            content: 'Hi {customerName}, your order {orderId} of *{amount}* is complete. Thanks!'
        },
        [NotificationChannel.WEB_PUSH]: {
            content: 'Order {orderId} complete!'
        },
        [NotificationChannel.MOBILE_PUSH]: {
            content: 'Order {orderId} complete!'
        },
        [NotificationChannel.IN_APP]: {
            content: 'Order {orderId} completed successfully.'
        }
    },
    ORDER_CREATED: { // Adding for completeness, though specific request was Order Messages
        [NotificationChannel.EMAIL]: {
            subject: 'Order Confirmation: {orderId}',
            content: 'Hi {customerName}, we received your order of {amount}. We will notify you when it ships.'
        },
        [NotificationChannel.WHATSAPP]: {
            content: 'Hi {customerName}, thanks for your order {orderId} of *{amount}*.'
        },
        [NotificationChannel.WEB_PUSH]: {
            content: 'Order {orderId} placed successfully.'
        },
        [NotificationChannel.MOBILE_PUSH]: {
            content: 'Order {orderId} placed successfully.'
        },
        [NotificationChannel.IN_APP]: {
            content: 'Order {orderId} placed successfully.'
        }
    }
};

export async function toggleEventChannel(
    storeId: string,
    currentUserId: string,
    eventType: string,
    channel: NotificationChannel,
    isActive: boolean
) {
    await requireStoreRole(currentUserId, storeId, 'OWNER'); // Only owners can change routing

    try {
        const existing = await prisma.notificationTemplate.findUnique({
            where: {
                storeId_channel_eventType: {
                    storeId,
                    channel,
                    eventType,
                }
            }
        });

        if (existing) {
            // Update existing
            await prisma.notificationTemplate.update({
                where: { id: existing.id },
                data: { isActive }
            });
        } else if (isActive) {
            // Create new if enabling
            const defaults = DEFAULT_TEMPLATES[eventType]?.[channel];
            if (!defaults) {
                throw new Error(`No default template defined for event ${eventType} on channel ${channel}`);
            }

            await prisma.notificationTemplate.create({
                data: {
                    storeId,
                    eventType,
                    channel,
                    subject: defaults.subject,
                    content: defaults.content,
                    isActive: true
                }
            });
        }

        revalidatePath(`/admin/stores/${storeId}/notifications`);
        return { success: true };
    } catch (error: any) {
        console.error('Toggle event channel error:', error);
        return { success: false, error: error.message };
    }
}

export async function getWorkflowSettings(storeId: string) {
    // Return a matrix of [EventType][Channel] -> boolean (isActive)
    const templates = await prisma.notificationTemplate.findMany({
        where: { storeId }
    });

    const matrix: Record<string, Record<NotificationChannel, boolean>> = {};

    // Initialize standard events
    const events = ['ORDER_COMPLETE', 'ORDER_CREATED'];

    events.forEach(event => {
        matrix[event] = {
            [NotificationChannel.EMAIL]: false,
            [NotificationChannel.WHATSAPP]: false,
            [NotificationChannel.WEB_PUSH]: false,
            [NotificationChannel.MOBILE_PUSH]: false,
            [NotificationChannel.IN_APP]: false,
        };
    });

    templates.forEach(t => {
        if (!matrix[t.eventType]) {
            // Handle custom/legacy events
            matrix[t.eventType] = {
                [NotificationChannel.EMAIL]: false,
                [NotificationChannel.WHATSAPP]: false,
                [NotificationChannel.WEB_PUSH]: false,
                [NotificationChannel.MOBILE_PUSH]: false,
                [NotificationChannel.IN_APP]: false,
            };
        }
        matrix[t.eventType][t.channel] = t.isActive;
    });


    return matrix;
}

export async function getNotificationConfigs(storeId: string) {
    return await prisma.notificationConfig.findMany({
        where: { storeId }
    });
}

export async function saveNotificationConfig(
    storeId: string,
    channel: NotificationChannel,
    config: any,
    isActive: boolean
) {
    // Permission check usually handled by caller or middleware, but good to add if context available
    // Here we assume caller (Client Component) has session validation or we add it here if passed userId

    // Simple update/upsert
    try {
        await prisma.notificationConfig.upsert({
            where: {
                storeId_channel: {
                    storeId,
                    channel
                }
            },
            update: {
                config,
                isActive
            },
            create: {
                storeId,
                channel,
                config,
                isActive
            }
        });
        revalidatePath(`/admin/stores/${storeId}/notifications`);
        return { success: true };
    } catch (error: any) {
        console.error('Save config error:', error);
        return { success: false, error: error.message };
    }
}
