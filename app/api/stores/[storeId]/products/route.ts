
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as productService from '@/services/product.service';
import * as variantService from '@/services/variant.service';

export async function POST(
    req: Request,
    { params }: { params: { storeId: string } }
) {
    try {
        const session = await auth();
        const userId = session?.user?.id;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, description, categoryId, isActive, price, stock, sku, productSchemaId, customData } = body;
        const { storeId } = await params;

        if (!name) {
            return new NextResponse("Name is required", { status: 400 });
        }

        // Create Product
        const product = await productService.createProduct(userId, storeId, {
            name,
            description,
            categoryId: categoryId || undefined, // Sanitize empty string to undefined
            isActive,
            productSchemaId,
            customData: customData || {}
        });

        // Create Default Variant if price/sku provided
        if (price !== undefined && sku) {
            // Convert price to smallest unit (e.g. cents/paise) if needed. 
            // The form sends standard unit (e.g. 10.99). The DB usually expects integer (1099).
            // The `createVariant` service checks `Number.isInteger`.
            // So I should multiply by 100.
            const priceInt = Math.round(Number(price) * 100);
            const stockInt = Number(stock);

            await variantService.createVariant(userId, storeId, product.id, {
                sku,
                price: priceInt,
                stock: stockInt,
                isActive: true
            });
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error('[PRODUCTS_POST_ERROR]', error);
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
        return new NextResponse(`Internal error: ${error}`, { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: { storeId: string } }
) {
    try {
        const { storeId } = await params;
        const products = await productService.listProducts(storeId, {
            take: 100
        });
        return NextResponse.json(products);
    } catch (error) {
        console.log('[PRODUCTS_GET]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
