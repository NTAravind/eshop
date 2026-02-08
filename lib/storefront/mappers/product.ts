import type { ProductContext, VariantContext, ImageContext } from '@/types/storefront-builder';

/**
 * Product with all relations needed for context mapping
 */
export type ProductWithRelations = {
    id: string;
    name: string;
    description: string | null;
    productSchemaId: string | null;
    categoryId: string | null;
    customData: unknown;
    images?: Array<{
        url: string;
        alt: string | null;
        position: number;
    }>;
    variants: Array<{
        id: string;
        sku: string;
        price: number;
        stock: number;
        isActive: boolean;
        customData?: unknown;
        images: Array<{
            url: string;
            alt: string | null;
            position: number;
        }>;
    }>;
};

/**
 * Map a Prisma Product to ProductContext for storefront runtime
 */
export function mapProductToContext(product: ProductWithRelations): ProductContext {
    const variants: VariantContext[] = product.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        price: variant.price,
        stock: variant.stock,
        isActive: variant.isActive,
        customData: (variant.customData as Record<string, unknown>) ?? undefined,
        images: variant.images.map((img): ImageContext => ({
            url: img.url,
            alt: img.alt ?? product.name,
            position: img.position,
        })),
    }));

    const productImages: ImageContext[] =
        product.images?.map((img) => ({
            url: img.url,
            alt: img.alt ?? product.name,
            position: img.position,
        })) ?? [];

    return {
        id: product.id,
        name: product.name,
        description: product.description ?? undefined,
        productSchemaId: product.productSchemaId ?? undefined,
        categoryId: product.categoryId ?? undefined,
        customData: product.customData as Record<string, unknown> | undefined,
        images: productImages.length > 0 ? productImages : (variants[0]?.images ?? []),
        variants,
    };
}

/**
 * Map multiple products to context
 */
export function mapProductsToContext(products: ProductWithRelations[]): ProductContext[] {
    return products.map(mapProductToContext);
}
