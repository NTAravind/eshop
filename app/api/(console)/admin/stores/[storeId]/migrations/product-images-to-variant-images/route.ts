import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import prisma from "@/server/db/prisma"; // Direct prisma access for migration
import { requireStoreRole } from "@/server/auth/requireStore";

export const dynamic = 'force-dynamic';

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ storeId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { storeId } = await context.params;

        // Require MANAGER role
        await requireStoreRole(session.user.id, storeId, 'MANAGER');

        // 1. Get all products in the store that have images
        // We need to include variants to check if they effectively need migration
        const products = await prisma.product.findMany({
            where: {
                storeId,
                images: {
                    some: {} // Has at least one image
                }
            },
            include: {
                images: {
                    orderBy: { position: 'asc' }
                },
                variants: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        images: true
                    },
                    take: 1 // We only care about the first variant
                }
            }
        });

        const productsScanned = products.length;
        let variantsUpdated = 0;
        let imagesCreated = 0;

        for (const product of products) {
            if (product.variants.length === 0) continue;

            const firstVariant = product.variants[0];

            // If variant already has images, skip to avoid duplicates or messing up manual work
            if (firstVariant.images.length > 0) continue;

            // Migrate images
            if (product.images.length > 0) {
                // Create images for the variant
                await prisma.image.createMany({
                    data: product.images.map((img) => ({
                        url: img.url,
                        alt: img.alt || product.name,
                        position: img.position,
                        variantId: firstVariant.id
                        // Note: we don't link to product anymore, or we leave it?
                        // Schema has productId and variantId as optional relations.
                        // We are creating NEW image records linked to variant.
                        // The old image records linked to product remain (until deleted or ignored).
                        // This effectively copies them.
                    }))
                });

                variantsUpdated++;
                imagesCreated += product.images.length;
            }
        }

        return NextResponse.json({
            success: true,
            stats: {
                productsScanned,
                variantsUpdated,
                imagesCreated
            }
        });

    } catch (error) {
        console.error("[MIGRATION_ERROR]", error);
        return new NextResponse(`Internal error: ${error}`, { status: 500 });
    }
}
