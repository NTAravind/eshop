import prisma from '@/lib/prisma'
import { NotificationChannel } from '@/app/generated/prisma'
import type { CreateNotificationTemplateDto, UpdateNotificationTemplateDto } from '@/types/notification-template.types'

/**
 * Get all notification templates for a store
 */
export async function getTemplatesByStore(storeId: string) {
    return await prisma.notificationTemplate.findMany({
        where: { storeId },
        orderBy: [
            { channel: 'asc' },
            { eventType: 'asc' },
        ],
    })
}

/**
 * Get a specific template by event type and channel
 */
export async function getTemplateByEvent(
    storeId: string,
    channel: NotificationChannel,
    eventType: string
) {
    return await prisma.notificationTemplate.findUnique({
        where: {
            storeId_channel_eventType: {
                storeId,
                channel,
                eventType,
            },
        },
    })
}

/**
 * Get a template by ID
 */
export async function getTemplateById(id: string) {
    return await prisma.notificationTemplate.findUnique({
        where: { id },
        include: {
            store: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
        },
    })
}

/**
 * Create a new notification template
 */
export async function createTemplate(
    storeId: string,
    data: CreateNotificationTemplateDto
) {
    // Check if template already exists for this event and channel
    const existing = await getTemplateByEvent(storeId, data.channel as NotificationChannel, data.eventType)
    if (existing) {
        throw new Error(`Template already exists for ${data.channel} - ${data.eventType}`)
    }

    return await prisma.notificationTemplate.create({
        data: {
            storeId,
            channel: data.channel as NotificationChannel,
            eventType: data.eventType,
            whatsappTemplateName: 'whatsappTemplateName' in data ? data.whatsappTemplateName : null,
            whatsappLanguageCode: 'whatsappLanguageCode' in data ? data.whatsappLanguageCode : null,
            subject: 'subject' in data ? data.subject : null,
            content: 'content' in data ? data.content : null,
            isActive: data.isActive ?? true,
        },
    })
}

/**
 * Update an existing notification template
 */
export async function updateTemplate(
    id: string,
    data: UpdateNotificationTemplateDto
) {
    return await prisma.notificationTemplate.update({
        where: { id },
        data: {
            whatsappTemplateName: 'whatsappTemplateName' in data ? data.whatsappTemplateName : undefined,
            whatsappLanguageCode: 'whatsappLanguageCode' in data ? data.whatsappLanguageCode : undefined,
            subject: 'subject' in data ? data.subject : undefined,
            content: 'content' in data ? data.content : undefined,
            isActive: data.isActive,
        },
    })
}

/**
 * Delete a notification template
 */
export async function deleteTemplate(id: string) {
    return await prisma.notificationTemplate.delete({
        where: { id },
    })
}

/**
 * Get active templates by channel for a store
 */
export async function getActiveTemplatesByChannel(
    storeId: string,
    channel: NotificationChannel
) {
    return await prisma.notificationTemplate.findMany({
        where: {
            storeId,
            channel,
            isActive: true,
        },
        orderBy: {
            eventType: 'asc',
        },
    })
}


/**
 * Toggle template active status
 */
export async function toggleTemplateStatus(id: string, isActive: boolean) {
    return await prisma.notificationTemplate.update({
        where: { id },
        data: { isActive },
    })
}

/**
 * Get all active templates for a specific event type across all channels
 */
export async function getActiveTemplatesForEvent(
    storeId: string,
    eventType: string
) {
    return await prisma.notificationTemplate.findMany({
        where: {
            storeId,
            eventType,
            isActive: true,
        },
    })
}
