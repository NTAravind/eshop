import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getStoreBySlug } from '@/dal/store.dal'
import { hasStoreAccess } from '@/lib/rbac-helpers'
import { getTemplatesByStore, createTemplate } from '@/dal/notification-template.dal'
import { validateTemplate } from '@/services/notification-template.service'
import type { CreateNotificationTemplateDto } from '@/types/notification-template.types'

/**
 * GET /api/admin/notification-templates
 * List all notification templates for the store
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get store from headers
        const storeSlug = request.headers.get('x-store-slug')
        if (!storeSlug) {
            return NextResponse.json(
                { error: 'Store slug is required in headers' },
                { status: 400 }
            )
        }

        const store = await getStoreBySlug(storeSlug)
        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 })
        }

        // Check access
        const hasAccess = await hasStoreAccess(session.user.id, store.id, ['OWNER', 'MANAGER'])
        if (!hasAccess) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Get all templates
        const templates = await getTemplatesByStore(store.id)

        return NextResponse.json(templates)
    } catch (error: any) {
        console.error('Error fetching notification templates:', error)
        return NextResponse.json(
            {
                error: 'Failed to fetch notification templates',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        )
    }
}

/**
 * POST /api/admin/notification-templates
 * Create a new notification template
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get store from headers
        const storeSlug = request.headers.get('x-store-slug')
        if (!storeSlug) {
            return NextResponse.json(
                { error: 'Store slug is required in headers' },
                { status: 400 }
            )
        }

        const store = await getStoreBySlug(storeSlug)
        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 })
        }

        // Check access - only OWNER and MANAGER can create templates
        const hasAccess = await hasStoreAccess(session.user.id, store.id, ['OWNER', 'MANAGER'])
        if (!hasAccess) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Parse request body
        const body = await request.json() as CreateNotificationTemplateDto

        // Validate required fields
        if (!body.channel || !body.eventType) {
            return NextResponse.json(
                { error: 'Channel and eventType are required' },
                { status: 400 }
            )
        }

        // Create template
        const template = await createTemplate(store.id, body)

        // Validate the created template
        const validation = validateTemplate(template)
        if (!validation.isValid) {
            console.warn('Template created but has validation warnings:', validation)
        }

        return NextResponse.json(
            {
                ...template,
                validation: validation.warnings ? { warnings: validation.warnings } : undefined,
            },
            { status: 201 }
        )
    } catch (error: any) {
        console.error('Error creating notification template:', error)

        // Handle duplicate template error
        if (error.message?.includes('already exists')) {
            return NextResponse.json(
                { error: error.message },
                { status: 409 }
            )
        }

        return NextResponse.json(
            {
                error: 'Failed to create notification template',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        )
    }
}
