import type {
    TemplateVariableContext,
    TemplateValidationResult,
    TemplateRenderResult,
    WhatsAppTemplateComponent,
} from '@/types/notification-template.types'
import { NotificationTemplate } from '@/app/generated/prisma'

/**
 * Validate a notification template
 */
export function validateTemplate(template: NotificationTemplate): TemplateValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate WhatsApp templates
    if (template.channel === 'WHATSAPP') {
        if (!template.whatsappTemplateName) {
            errors.push('WhatsApp template name is required')
        }
        if (!template.whatsappLanguageCode) {
            errors.push('WhatsApp language code is required')
        }
        if (template.content || template.subject) {
            warnings.push('Content and subject are ignored for WhatsApp templates')
        }
    }

    // Validate text-based templates (Email, SMS, Push)
    if (['EMAIL', 'WEB_PUSH', 'MOBILE_PUSH'].includes(template.channel)) {
        if (!template.content) {
            errors.push('Content is required for non-WhatsApp templates')
        }
        if (template.channel === 'EMAIL' && !template.subject) {
            warnings.push('Email subject is recommended')
        }
        if (template.whatsappTemplateName || template.whatsappLanguageCode) {
            warnings.push('WhatsApp fields are ignored for non-WhatsApp templates')
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
    }
}

/**
 * Extract variables from template content
 * Matches patterns like {variableName}
 */
export function extractTemplateVariables(content: string): string[] {
    const variablePattern = /\{([a-zA-Z0-9_]+)\}/g
    const matches = content.matchAll(variablePattern)
    return Array.from(matches, (match) => match[1])
}

/**
 * Replace variables in template content with actual values
 */
export function replaceTemplateVariables(
    content: string,
    context: TemplateVariableContext
): string {
    let result = content

    // Replace each variable in the context
    Object.entries(context).forEach(([key, value]) => {
        if (value !== undefined) {
            const pattern = new RegExp(`\\{${key}\\}`, 'g')
            result = result.replace(pattern, value)
        }
    })

    return result
}

/**
 * Render a template with the given context
 */
export function renderTemplate(
    template: NotificationTemplate,
    context: TemplateVariableContext
): TemplateRenderResult {
    try {
        // Validate template first
        const validation = validateTemplate(template)
        if (!validation.isValid) {
            return {
                success: false,
                error: `Template validation failed: ${validation.errors.join(', ')}`,
            }
        }

        // For WhatsApp, we don't render here - just return template info
        if (template.channel === 'WHATSAPP') {
            return {
                success: true,
                rendered: {
                    content: `WhatsApp template: ${template.whatsappTemplateName} (${template.whatsappLanguageCode})`,
                },
            }
        }

        // For text-based templates, replace variables
        if (!template.content) {
            return {
                success: false,
                error: 'Template content is missing',
            }
        }

        const renderedContent = replaceTemplateVariables(template.content, context)
        const renderedSubject = template.subject
            ? replaceTemplateVariables(template.subject, context)
            : undefined

        return {
            success: true,
            rendered: {
                subject: renderedSubject,
                content: renderedContent,
            },
        }
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to render template',
        }
    }
}

/**
 * Build WhatsApp template components from context
 * This formats the parameters for Facebook's WhatsApp API
 */
export function buildWhatsAppTemplateComponents(
    context: TemplateVariableContext,
    parameterKeys: string[] = ['orderId'] // Default to orderId for backward compatibility
): WhatsAppTemplateComponent[] {
    const parameters = parameterKeys.map((key) => ({
        type: 'text' as const,
        text: context[key] || '',
    }))

    return [
        {
            type: 'body',
            parameters,
        },
    ]
}

/**
 * Validate WhatsApp template configuration
 */
export function validateWhatsAppTemplate(
    templateName: string,
    languageCode: string
): TemplateValidationResult {
    const errors: string[] = []

    if (!templateName || templateName.trim() === '') {
        errors.push('Template name cannot be empty')
    }

    if (!languageCode || languageCode.trim() === '') {
        errors.push('Language code cannot be empty')
    }

    // Validate language code format (should be 2-letter ISO code)
    if (languageCode && !/^[a-z]{2}(_[A-Z]{2})?$/.test(languageCode)) {
        errors.push('Language code should be in format: en, en_US, etc.')
    }

    return {
        isValid: errors.length === 0,
        errors,
    }
}
