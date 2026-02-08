import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as schemaService from '@/services/schema.service';



export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;

        if (!storeId) {
            return new NextResponse("Store ID is required", { status: 400 });
        }

        const schemas = await schemaService.listSchemas(storeId);

        return NextResponse.json(schemas);
    } catch (error) {
        console.error('[PRODUCT_SCHEMAS_GET]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
