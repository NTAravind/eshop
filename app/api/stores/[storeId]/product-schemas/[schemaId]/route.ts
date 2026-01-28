import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as schemaService from '@/services/schema.service';

export async function PATCH(
    req: Request,
    { params }: { params: { storeId: string; schemaId: string } }
) {
    try {
        const session = await auth();
        const { storeId, schemaId } = await params;

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();

        const schema = await schemaService.updateSchema(schemaId, storeId, body);

        return NextResponse.json(schema);
    } catch (error) {
        console.error('[PRODUCT_SCHEMA_PATCH]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// Implement DELETE if needed
