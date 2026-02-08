import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as variantService from "@/services/variant.service";

export const dynamic = 'force-dynamic';

/**
 * GET /api/stores/[storeId]/products/[productId]/variants/[variantId]
 * Get variant by ID
 */
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ storeId: string; productId: string; variantId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { storeId, variantId } = await context.params;
        const variant = await variantService.getVariant(storeId, variantId);

        if (!variant) {
            return new NextResponse("Variant not found", { status: 404 });
        }

        return NextResponse.json(variant);
    } catch (error: any) {
        console.error("[VARIANT_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

/**
 * PATCH /api/stores/[storeId]/products/[productId]/variants/[variantId]
 * Update variant
 */
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ storeId: string; productId: string; variantId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { storeId, variantId } = await context.params;
        const body = await req.json();

        const { sku, price, stock, isActive, customData } = body;

        const updateData: any = {};
        if (sku !== undefined) updateData.sku = sku;
        if (price !== undefined) updateData.price = Math.round(price * 100); // Convert to paise
        if (stock !== undefined) updateData.stock = stock;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (customData !== undefined) updateData.customData = customData;

        const variant = await variantService.updateVariant(
            session.user.id,
            storeId,
            variantId,
            updateData
        );

        return NextResponse.json(variant);
    } catch (error: any) {
        console.error("[VARIANT_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

/**
 * DELETE /api/stores/[storeId]/products/[productId]/variants/[variantId]
 * Delete (soft) variant
 */
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ storeId: string; productId: string; variantId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { storeId, variantId } = await context.params;

        await variantService.deleteVariant(session.user.id, storeId, variantId);

        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        console.error("[VARIANT_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
