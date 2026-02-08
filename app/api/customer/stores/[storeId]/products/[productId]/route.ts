
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as productService from '@/services/product.service';
import * as variantService from '@/services/variant.service';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string; productId: string }> }
) {
    try {
        const { storeId, productId } = await params;

        if (!productId) {
            return new NextResponse("Product ID is required", { status: 400 });
        }

        const product = await productService.getProduct(storeId, productId);

        return NextResponse.json(product);
    } catch (error) {
        console.log('[PRODUCT_GET]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
}


