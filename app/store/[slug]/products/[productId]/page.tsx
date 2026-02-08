import { notFound } from 'next/navigation';
import { getStoreBySlug } from '@/services/store.service';
import { getPublishedDocument } from '@/services/storefront.service';
import { StorefrontDocKind } from '@/app/generated/prisma';
import type { StorefrontNode, ProductContext, VariantContext } from '@/types/storefront-builder';
import { StorefrontPage } from '../../_components/StorefrontPage';
import * as productService from '@/services/product.service';

interface PDPPageProps {
    params: Promise<{ slug: string; productId: string }>;
}

export default async function StoreProductPage({ params }: PDPPageProps) {
    const { slug, productId } = await params;

    const store = await getStoreBySlug(slug);
    if (!store) {
        notFound();
    }

    // Fetch product data
    const product = await productService.getProduct(store.id, productId);
    if (!product) {
        notFound();
    }

    // Get published documents
    const [layoutDoc, pageDoc] = await Promise.all([
        getPublishedDocument(store.id, StorefrontDocKind.LAYOUT, 'GLOBAL_LAYOUT'),
        getPublishedDocument(store.id, StorefrontDocKind.TEMPLATE, 'PDP'),
    ]);

    const layout = layoutDoc?.tree as unknown as StorefrontNode | undefined;
    const page = pageDoc?.tree as unknown as StorefrontNode;

    // Get base price from first variant or 0
    const basePrice = product.variants?.[0]?.price || 0;
    const firstImage = product.images?.[0]?.url || '';

    // Map product to ProductContext (matching the type definition exactly)
    const productContext: ProductContext = {
        id: product.id,
        name: product.name,
        description: product.description || undefined,
        images: product.images?.map((img) => ({
            url: img.url,
            alt: img.alt || product.name,
            position: img.position,
        })) || [],
        variants: product.variants?.map((v): VariantContext => ({
            id: v.id,
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            isActive: v.isActive,
            customData: v.customData as Record<string, unknown> | undefined,
            images: v.images?.map((img) => ({
                url: img.url,
                alt: img.alt || '',
                position: img.position,
            })) || [],
        })) || [],
        customData: product.customData as Record<string, unknown> | undefined,
        productSchemaId: product.productSchemaId || undefined,
        categoryId: product.categoryId || undefined,
    };

    // Fallback UI if no published template
    if (!page) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        {firstImage ? (
                            <img src={firstImage} alt={product.name} className="w-full aspect-square object-cover rounded-lg" />
                        ) : (
                            <div className="aspect-square bg-muted rounded-lg" />
                        )}
                        <div>
                            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
                            <p className="text-2xl font-semibold text-primary mb-4">
                                {store.currency} {(basePrice / 100).toFixed(2)}
                            </p>
                            <p className="text-muted-foreground mb-6">{product.description}</p>
                            <button className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium">
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const selectedVariant = product.variants?.[0];
    const selectedVariantContext: Partial<VariantContext> | undefined = selectedVariant ? {
        id: selectedVariant.id,
        sku: selectedVariant.sku,
        price: selectedVariant.price,
        stock: selectedVariant.stock,
        isActive: selectedVariant.isActive,
        customData: selectedVariant.customData as Record<string, unknown> | undefined,
        images: selectedVariant.images?.map((img) => ({
            url: img.url,
            alt: img.alt || '',
            position: img.position,
        })) || [],
    } : undefined;

    return (
        <StorefrontPage
            store={{
                id: store.id,
                name: store.name,
                slug: store.slug,
                currency: store.currency || 'USD',
            }}
            layout={layout}
            page={page}
            pageData={{
                product: productContext,
                selectedVariant: selectedVariantContext,
            }}
        />
    );
}
