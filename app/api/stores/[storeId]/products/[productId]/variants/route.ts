import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as variantService from "@/services/variant.service";

export const dynamic = 'force-dynamic';

/**
 * GET /api/stores/[storeId]/products/[productId]/variants
 * List variants for a product
 */
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ storeId: string; productId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { storeId, productId } = await context.params;
        const variants = await variantService.listVariants(storeId, productId);

        return NextResponse.json(variants);
    } catch (error: any) {
        console.error("[VARIANTS_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

/**
 * POST /api/stores/[storeId]/products/[productId]/variants
 * Create a new variant
 */
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ storeId: string; productId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { storeId, productId } = await context.params;
        const body = await req.json();

        const { sku, price, stock, isActive, customData } = body;

        if (!sku) {
            return new NextResponse("SKU is required", { status: 400 });
        }

        const variant = await variantService.createVariant(
            session.user.id,
            storeId,
            productId,
            {
                sku,
                price: Math.round(price * 100), // Convert to paise
                stock,
                isActive,
                customData: customData || {}
            }
        );

        return NextResponse.json(variant);
    } catch (error: any) {
        console.error("[VARIANT_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
