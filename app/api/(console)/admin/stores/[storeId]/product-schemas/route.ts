import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as schemaService from '@/services/schema.service';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const session = await auth();
        const { storeId } = await params;

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();

        const { name, fields } = body;

        if (!name || !fields) {
            return new NextResponse("Name and fields are required", { status: 400 });
        }

        const schema = await schemaService.createSchema(storeId, name, fields);

        return NextResponse.json(schema);
    } catch (error) {
        console.error('[PRODUCT_SCHEMAS_POST]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

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
