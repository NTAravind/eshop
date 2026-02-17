import type { CartContext, CartItemContext, ImageContext } from '@/types/storefront-builder';
import type { Prisma } from '@/app/generated/prisma';

// Cart with nested relations
type CartWithRelations = Prisma.CartGetPayload<{
    include: {
        items: {
            include: {
                variant: {
                    include: {
                        product: true;
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
export function mapCartToContext(cart: CartWithRelations): CartContext {
    const items: CartItemContext[] = cart.items.map((item) => {
        const lineTotal = item.variant.price * item.quantity;

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
                images: [],  // Required by ProductContext but not needed in cart display
                variants: [], // Required by ProductContext but not needed in cart display
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
        currency: 'USD', // Should come from store settings
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    };
}
