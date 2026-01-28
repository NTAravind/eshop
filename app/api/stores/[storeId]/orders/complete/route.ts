import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTemplateByEvent } from '@/dal/notification-template.dal'
import { buildWhatsAppTemplateComponents } from '@/services/notification-template.service'
import type { TemplateVariableContext } from '@/types/notification-template.types'
import { resolveTenant } from '@/lib/tenant/resolveTenant'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;
        const { id, phone } = await request.json()
        console.log('Received request to complete order:', { id, phone, storeId })

        if (!id) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            )
        }

        if (!phone) {
            return NextResponse.json(
                { error: 'Phone number is required' },
                { status: 400 }
            )
        }

        // Verify Order belongs to Store
        const order = await prisma.order.findUnique({
            where: { id },
            select: { storeId: true }
        })

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            )
        }

        if (order.storeId !== storeId) {
            return NextResponse.json(
                { error: 'Order does not belong to this store' },
                { status: 403 }
            )
        }

        // Update order in database - mark as PAID
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { status: 'PAID' },
            include: {
                store: true,
            },
        })

        // Get notification template for ORDER_COMPLETE event
        const template = await getTemplateByEvent(
            updatedOrder.storeId,
            'WHATSAPP',
            'ORDER_COMPLETE'
        )

        if (!template) {
            console.warn('No WhatsApp template configured for ORDER_COMPLETE event')
            return NextResponse.json({
                ...updatedOrder,
                warning: 'Order completed but no notification template configured',
            })
        }

        if (!template.isActive) {
            console.warn('WhatsApp template is inactive')
            return NextResponse.json({
                ...updatedOrder,
                warning: 'Order completed but notification template is inactive',
            })
        }

        // Build template context
        const templateContext: TemplateVariableContext = {
            orderId: updatedOrder.id,
            amount: (updatedOrder.total / 100).toFixed(2), // Convert from cents
            storeName: updatedOrder.store.name,
            phone: phone,
        }

        // Send WhatsApp notification using the template
        const whatsappResult = await SendWhatsappmsg(
            phone,
            updatedOrder.storeId,
            template.whatsappTemplateName!,
            template.whatsappLanguageCode!,
            templateContext
        )

        if (!whatsappResult.success) {
            console.error('WhatsApp notification failed:', whatsappResult.error)
            return NextResponse.json({
                ...updatedOrder,
                warning: 'Order completed but notification failed to send',
            })
        }

        return NextResponse.json({
            ...updatedOrder,
            notificationSent: true,
        })

    } catch (error: any) {
        console.error('Error updating order:', error)

        // Check if it's a Prisma error (order not found, etc.)
        if (error?.code === 'P2025') {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            )
        }

        // Check if it's a JSON parsing error
        if (error instanceof SyntaxError) {
            return NextResponse.json(
                { error: 'Invalid JSON in request body' },
                { status: 400 }
            )
        }

        return NextResponse.json(
            {
                error: 'Failed to update order',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        )
    }
}

async function SendWhatsappmsg(
    phone: string,
    storeId: string,
    templateName: string,
    languageCode: string,
    context: TemplateVariableContext
): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
        // Get WhatsApp config from NotificationConfig
        const whatsappConfig = await prisma.notificationConfig.findUnique({
            where: {
                storeId_channel: {
                    storeId,
                    channel: 'WHATSAPP',
                },
            },
        })

        if (!whatsappConfig || !whatsappConfig.isActive) {
            throw new Error('WhatsApp is not configured for this store')
        }

        const config = whatsappConfig.config as any

        // Validate required config
        if (!config.phoneNumberId) {
            throw new Error('WhatsApp phone number ID is not configured')
        }

        if (!config.accessToken) {
            throw new Error('WhatsApp access token is not configured')
        }

        // Validate and clean phone number
        if (!phone || phone.trim() === '') {
            throw new Error('Phone number is required')
        }

        // Clean phone number - remove any non-digits
        const cleanPhone = phone.replace(/\D/g, '')

        // Validate Indian phone number (should be 10 digits after cleaning)
        if (cleanPhone.length !== 10) {
            throw new Error(`Invalid phone number format: ${phone}. Expected 10 digits, got ${cleanPhone.length}`)
        }

        console.log('Sending WhatsApp message to phone:', cleanPhone)

        // Build template components
        const components = buildWhatsAppTemplateComponents(context, ['orderId'])

        const whatsappResponse = await fetch(
            `https://graph.facebook.com/v22.0/${config.phoneNumberId}/messages`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: `+91${cleanPhone}`,
                    type: 'template',
                    template: {
                        name: templateName,
                        language: { code: languageCode },
                        components,
                    },
                }),
            }
        )

        // Check if the HTTP request was successful
        if (!whatsappResponse.ok) {
            const errorData = await whatsappResponse.text()
            console.error('WhatsApp API Error:', {
                status: whatsappResponse.status,
                statusText: whatsappResponse.statusText,
                body: errorData,
                phone: cleanPhone,
            })

            return {
                success: false,
                error: `WhatsApp API returned ${whatsappResponse.status}: ${whatsappResponse.statusText}`,
            }
        }

        // Parse and validate response
        const responseData = await whatsappResponse.json()

        if (responseData.error) {
            console.error('WhatsApp API Error Response:', responseData.error)
            return {
                success: false,
                error: responseData.error.message || 'WhatsApp API error',
            }
        }

        console.log('WhatsApp message sent successfully:', {
            to: `+91${cleanPhone}`,
            template: `${templateName} (${languageCode})`,
            messageId: responseData.messages?.[0]?.id,
        })

        // Log notification
        await prisma.notificationLog.create({
            data: {
                storeId,
                channel: 'WHATSAPP',
                recipient: `+91${cleanPhone}`,
                content: `Template: ${templateName} (${languageCode})`,
                status: 'SENT',
                providerMessageId: responseData.messages?.[0]?.id,
            },
        })

        return {
            success: true,
            data: responseData,
        }

    } catch (error: any) {
        console.error('Error sending WhatsApp message:', {
            phone,
            templateName,
            languageCode,
            error: error.message,
            stack: error.stack,
        })

        // Log failed notification
        try {
            await prisma.notificationLog.create({
                data: {
                    storeId,
                    channel: 'WHATSAPP',
                    recipient: phone,
                    content: `Template: ${templateName} (${languageCode})`,
                    status: 'FAILED',
                    error: error.message,
                },
            })
        } catch (logError) {
            console.error('Failed to log notification error:', logError)
        }

        return {
            success: false,
            error: error.message || 'Unknown error occurred while sending WhatsApp message',
        }
    }
}
