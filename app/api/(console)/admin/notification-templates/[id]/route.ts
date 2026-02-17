import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasStoreAccess } from '@/lib/rbac-helpers'
import { getTemplateById, updateTemplate, deleteTemplate } from '@/dal/notification-template.dal'
import { validateTemplate } from '@/services/notification-template.service'
import type { UpdateNotificationTemplateDto } from '@/types/notification-template.types'

/**
 * GET /api/admin/notification-templates/[id]
 * Get a specific notification template
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const template = await getTemplateById(id)
        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 })
        }

        // Check access
        const hasAccess = await hasStoreAccess(session.user.id, template.storeId, ['OWNER', 'MANAGER', 'SUPPORT'])
        if (!hasAccess) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        return NextResponse.json(template)
    } catch (error: any) {
        console.error('Error fetching notification template:', error)
        return NextResponse.json(
            {
                error: 'Failed to fetch notification template',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/admin/notification-templates/[id]
 * Update a notification template
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get existing template
        const existingTemplate = await getTemplateById(id)
        if (!existingTemplate) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 })
        }

        // Check access - only OWNER and MANAGER can update templates
        const hasAccess = await hasStoreAccess(session.user.id, existingTemplate.storeId, ['OWNER', 'MANAGER'])
        if (!hasAccess) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Parse request body
        const body = await request.json() as UpdateNotificationTemplateDto

        // Update template
        const updatedTemplate = await updateTemplate(id, body)

        // Validate the updated template
        const validation = validateTemplate(updatedTemplate)
        if (!validation.isValid) {
            console.warn('Template updated but has validation warnings:', validation)
        }

        return NextResponse.json({
            ...updatedTemplate,
            validation: validation.warnings ? { warnings: validation.warnings } : undefined,
        })
    } catch (error: any) {
        console.error('Error updating notification template:', error)
        return NextResponse.json(
            {
                error: 'Failed to update notification template',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/admin/notification-templates/[id]
 * Delete a notification template
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get existing template
        const existingTemplate = await getTemplateById(id)
        if (!existingTemplate) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 })
        }

        // Check access - only OWNER can delete templates
        const hasAccess = await hasStoreAccess(session.user.id, existingTemplate.storeId, ['OWNER'])
        if (!hasAccess) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Delete template
        await deleteTemplate(id)

        return NextResponse.json({ success: true, message: 'Template deleted successfully' })
    } catch (error: any) {
        console.error('Error deleting notification template:', error)
        return NextResponse.json(
            {
                error: 'Failed to delete notification template',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        )
    }
}
