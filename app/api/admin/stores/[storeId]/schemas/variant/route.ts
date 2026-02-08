import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
    getActiveVariantSchema,
    listVariantSchemas,
    createVariantSchema,
    activateVariantSchemaVersion,
} from '@/dal/product-schema.dal';
import {
    validateSchemaDefinition,
    type SchemaDefinition,
} from '@/lib/validators/schema-validator';
import { getUserStoreRole } from '@/dal/store.dal';
import { syncFacetsFromSchema } from '@/services/facet-sync.service';

/**
 * GET /api/admin/stores/[storeId]/schemas/variant
 * Get variant schemas for a store
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { storeId } = await params;

        // Check store access
        const role = await getUserStoreRole(session.user.id, storeId);
        if (!role) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get query params
        const searchParams = req.nextUrl.searchParams;
        const activeOnly = searchParams.get('activeOnly') === 'true';

        if (activeOnly) {
            const schema = await getActiveVariantSchema(storeId);
            return NextResponse.json(schema);
        }

        const schemas = await listVariantSchemas(storeId);
        return NextResponse.json(schemas);
    } catch (error) {
        console.error('Error fetching variant schemas:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/stores/[storeId]/schemas/variant
 * Create a new variant schema version
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { storeId } = await params;

        // Check store access - Only OWNER and MANAGER can create schemas
        const role = await getUserStoreRole(session.user.id, storeId);
        if (!role || (role !== 'OWNER' && role !== 'MANAGER')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { name, fields, activate = true } = body;

        if (!name || !fields) {
            return NextResponse.json(
                { error: 'Name and fields are required' },
                { status: 400 }
            );
        }

        // Validate schema definition
        const validation = validateSchemaDefinition(fields as SchemaDefinition);
        if (!validation.valid) {
            return NextResponse.json(
                { error: 'Invalid schema definition', errors: validation.errors },
                { status: 400 }
            );
        }

        // Create new schema
        const schema = await createVariantSchema({
            storeId,
            name,
            fields,
        });

        // Optionally activate this version
        if (activate) {
            await activateVariantSchemaVersion(storeId, schema.id);
        }

        // Sync facets
        await syncFacetsFromSchema(storeId, schema.id, 'VARIANT', fields as any);

        return NextResponse.json(schema, { status: 201 });
    } catch (error) {
        console.error('Error creating variant schema:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
