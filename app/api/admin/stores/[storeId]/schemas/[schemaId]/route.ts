import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
    activateProductSchemaVersion,
    activateVariantSchemaVersion,
} from '@/dal/product-schema.dal';
import { getUserStoreRole } from '@/dal/store.dal';

/**
 * PATCH /api/admin/stores/[storeId]/schemas/[schemaId]
 * Activate a specific schema version
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ storeId: string; schemaId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { storeId, schemaId } = await params;

        // Check store access - Only OWNER and MANAGER can activate schemas
        const role = await getUserStoreRole(session.user.id, storeId);
        if (!role || (role !== 'OWNER' && role !== 'MANAGER')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { type, version } = body;

        if (!type || !version) {
            return NextResponse.json(
                { error: 'Type and version are required' },
                { status: 400 }
            );
        }

        if (type === 'product') {
            const schema = await activateProductSchemaVersion(storeId, schemaId);
            return NextResponse.json(schema);
        } else if (type === 'variant') {
            const schema = await activateVariantSchemaVersion(storeId, schemaId);
            return NextResponse.json(schema);
        } else {
            return NextResponse.json(
                { error: 'Invalid schema type' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error activating schema:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
