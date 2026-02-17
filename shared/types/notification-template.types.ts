// Supported notification event types
export enum NotificationEventType {
    ORDER_CREATED = 'ORDER_CREATED',
    ORDER_COMPLETE = 'ORDER_COMPLETE',
    ORDER_CANCELLED = 'ORDER_CANCELLED',
    PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
    PAYMENT_FAILED = 'PAYMENT_FAILED',
    ORDER_SHIPPED = 'ORDER_SHIPPED',
    ORDER_DELIVERED = 'ORDER_DELIVERED',
    PROMOTION = 'PROMOTION',
    OFFER = 'OFFER',
}

// Template variable context for replacement
export interface TemplateVariableContext {
    orderId: string
    amount: string
    customerName?: string
    phone?: string
    storeName: string
    orderDate?: string
    trackingNumber?: string
    [key: string]: string | undefined
}

// WhatsApp template creation DTO
export interface CreateWhatsAppTemplateDto {
    channel: 'WHATSAPP'
    eventType: NotificationEventType | string
    whatsappTemplateName: string
    whatsappLanguageCode: string
    isActive?: boolean
}

// Email/SMS/Push template creation DTO
export interface CreateTextTemplateDto {
    channel: 'EMAIL' | 'WEB_PUSH' | 'MOBILE_PUSH'
    eventType: NotificationEventType | string
    subject?: string // For email
    content: string // Template with variables like {orderId}, {amount}
    isActive?: boolean
}

// Union type for template creation
export type CreateNotificationTemplateDto = CreateWhatsAppTemplateDto | CreateTextTemplateDto

// Template update DTO (partial)
export type UpdateNotificationTemplateDto = Partial<CreateNotificationTemplateDto>

// Template validation result
export interface TemplateValidationResult {
    isValid: boolean
    errors: string[]
    warnings?: string[]
}

// Template rendering result
export interface TemplateRenderResult {
    success: boolean
    rendered?: {
        subject?: string
        content: string
    }
    error?: string
}

// WhatsApp template parameter
export interface WhatsAppTemplateParameter {
    type: 'text'
    text: string
}

// WhatsApp template component
export interface WhatsAppTemplateComponent {
    type: 'body' | 'header' | 'button'
    parameters: WhatsAppTemplateParameter[]
}
