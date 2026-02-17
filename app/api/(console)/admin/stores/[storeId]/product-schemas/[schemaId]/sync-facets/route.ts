import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserStoreRole } from '@/dal/store.dal';
import { getSchemaById } from '@/services/schema.service';
import { syncFacetsFromSchema } from '@/services/facet-sync.service';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ storeId: string; schemaId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { storeId, schemaId } = await params;

        const role = await getUserStoreRole(session.user.id, storeId);
        if (!role || (role !== 'OWNER' && role !== 'MANAGER')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const schema = await getSchemaById(schemaId);
        if (!schema) {
            return NextResponse.json({ error: 'Schema not found' }, { status: 404 });
        }

        if (schema.storeId !== storeId) {
            return NextResponse.json({ error: 'Schema does not belong to this store' }, { status: 403 });
        }

        await syncFacetsFromSchema(storeId, schemaId, 'PRODUCT', schema.fields as any);

        return NextResponse.json({ success: true, message: 'Facets synced successfully' });
    } catch (error: any) {
        console.error('Sync facets error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
