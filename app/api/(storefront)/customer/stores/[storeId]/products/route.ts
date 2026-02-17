
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as productService from '@/services/product.service';
import * as variantService from '@/services/variant.service';



export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
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
