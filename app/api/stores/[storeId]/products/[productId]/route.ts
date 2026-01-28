
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as productService from '@/services/product.service';
import * as variantService from '@/services/variant.service';

export async function GET(
    req: Request,
    { params }: { params: { storeId: string; productId: string } }
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

export async function PATCH(
    req: Request,
    { params }: { params: { storeId: string; productId: string } }
) {
    try {
        const session = await auth();
        const userId = session?.user?.id;
        const { storeId, productId } = await params;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, description, categoryId, isActive, price, stock, sku, productSchemaId, customData } = body;

        if (!productId) {
            return new NextResponse("Product ID is required", { status: 400 });
        }

        const product = await productService.updateProduct(userId, storeId, productId, {
            name,
            description,
            categoryId,
            isActive,
            productSchemaId,
            customData
        });

        if (price !== undefined || stock !== undefined || sku) {
            // Fetch fresh product to get variants (updateProduct might not return all nested variants or order might differ)
            const freshProduct = await productService.getProduct(storeId, productId);
            const defaultVariant = freshProduct?.variants?.[0];

            const priceInt = price !== undefined ? Math.round(Number(price) * 100) : undefined;
            const stockInt = stock !== undefined ? Number(stock) : undefined;

            if (defaultVariant) {
                await variantService.updateVariant(userId, storeId, defaultVariant.id, {
                    sku: sku || undefined,
                    price: priceInt,
                    stock: stockInt,
                    isActive: true
                });
            } else if (sku && price !== undefined) {
                // Create if missing and we have required fields
                // (If we only updated description but no variant existed, we skip unless we have data to create one)
                await variantService.createVariant(userId, storeId, productId, {
                    sku: sku,
                    price: priceInt!,
                    stock: stockInt || 0,
                    isActive: true
                });
            }
        }

        return NextResponse.json(product);
    } catch (error) {
        console.log('[PRODUCT_PATCH]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { storeId: string; productId: string } }
) {
    try {
        const session = await auth();
        const userId = session?.user?.id;
        const { storeId, productId } = await params;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!productId) {
            return new NextResponse("Product ID is required", { status: 400 });
        }

        const product = await productService.deleteProduct(userId, storeId, productId);

        return NextResponse.json(product);
    } catch (error) {
        console.log('[PRODUCT_DELETE]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
