import type { CartContext, CartItemContext, ImageContext } from '@/types/storefront-builder';
import type { Prisma } from '@/app/generated/prisma';

// Cart with nested relations
type CartWithRelations = Prisma.CartGetPayload<{
    include: {
        items: {
            include: {
                variant: {
                    include: {
                        product: {
                            include: {
                                images: true;
                            };
                        };
                        images: true;
                    };
                };
            };
        };
    };
}>;

/**
 * Map a cart from the DAL to CartContext for the storefront
 */
export function mapCartToContext(cart: CartWithRelations, currency: string = 'USD'): CartContext {
    const items: CartItemContext[] = cart.items.map((item) => {
        const lineTotal = item.variant.price * item.quantity;
        const productImages: ImageContext[] = (item.variant.product.images || []).map((img) => ({
            url: img.url,
            alt: img.alt || item.variant.product.name,
            position: img.position,
        }));

        return {
            id: item.id,
            variantId: item.variantId,
            quantity: item.quantity,
            lineTotal,
            variant: {
                id: item.variant.id,
                sku: item.variant.sku,
                price: item.variant.price,
                compareAtPrice: (item.variant as any).compareAtPrice ?? undefined,
                inventory: (item.variant as any).inventory ?? 0,
                stock: (item.variant as any).inventory ?? 0,  // Aliased to inventory
                isActive: (item.variant as any).isActive ?? true,
                images: item.variant.images.map((img): ImageContext => ({
                    url: img.url,
                    alt: (img as any).alt || item.variant.product.name,
                    position: img.position,
                })),
            },
            product: {
                id: item.variant.product.id,
                name: item.variant.product.name,
                description: item.variant.product.description ?? undefined,
                image: item.variant.product.image,
                images: productImages,
                variants: [], // Required by ProductContext but not needed in cart display
                categoryId: item.variant.product.categoryId ?? undefined,
                productSchemaId: (item.variant.product as any).productSchemaId ?? undefined,
            },
        };
    });

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const total = subtotal; // Add tax, shipping, etc. here if needed

    return {
        id: cart.id,
        items,
        subtotal,
        total,
        currency,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    };
}
