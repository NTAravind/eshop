import { notFound } from 'next/navigation';
import { getStoreBySlug } from '@/services/store.service';
import { getPublishedDocument } from '@/services/storefront.service';
import { StorefrontDocKind } from '@/app/generated/prisma';
import type { StorefrontNode } from '@/types/storefront-builder';
import { StorefrontPage } from '../_components/StorefrontPage';
import * as productService from '@/services/product.service';
import { RuntimeContextProvider } from '@/lib/storefront/runtime/context';
import { FilterMenu } from '@/lib/storefront/registry/filters';

interface CollectionPageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

import { listFacets } from '@/dal/facet.dal';

// ... existing imports

export default async function StoreCollectionPage({ params, searchParams }: CollectionPageProps) {
    const { slug } = await params;
    const search = await searchParams;

    const store = await getStoreBySlug(slug);
    if (!store) {
        notFound();
    }

    // Parse search params for filtering
    const page = Number(search.page) || 1;
    const limit = Number(search.limit) || 24;
    const categoryId = search.category as string | undefined;
    const searchQuery = search.q as string | undefined;
    const productSchemaId = search.schemaId as string | undefined;

    // Extract facet filters
    const reservedParams = ['page', 'limit', 'q', 'category', 'schemaId'];
    const facetFilters: Record<string, string[]> = {};

    Object.entries(search).forEach(([key, value]) => {
        if (!reservedParams.includes(key) && value) {
            facetFilters[key] = Array.isArray(value) ? value : [value];
        }
    });

    // Get products for the collection (using skip/take)
    const [productsResult, availableFacets] = await Promise.all([
        productService.listProducts(store.id, {
            categoryId,
            productSchemaId,
            isActive: true,
            search: searchQuery,
            skip: (page - 1) * limit,
            take: limit,
            facets: facetFilters,
        }),
        listFacets(store.id),
    ]);

    // Map facets to context structure
    const mappedFacets = availableFacets.map(f => ({
        id: f.id,
        code: f.code,
        name: f.name,
        values: f.values.map(v => ({
            id: v.id,
            value: v.value,
            // count: 0 // TODO: Implement counts
        }))
    }));

    // Get published documents
    const [layoutDoc, pageDoc] = await Promise.all([
        getPublishedDocument(store.id, StorefrontDocKind.LAYOUT, 'GLOBAL_LAYOUT'),
        getPublishedDocument(store.id, StorefrontDocKind.PAGE, 'COLLECTION'),
    ]);

    const layout = layoutDoc?.tree as unknown as StorefrontNode | undefined;
    const page_ = pageDoc?.tree as unknown as StorefrontNode;


    // ...

    // Fallback UI if no published page
    if (!page_) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold mb-8">Shop All Products</h1>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar */}
                        <aside className="w-full lg:w-64 flex-shrink-0">
                            <RuntimeContextProvider
                                store={{
                                    id: store.id,
                                    name: store.name,
                                    slug: store.slug,
                                    currency: store.currency || 'USD',
                                    requirePhoneNumber: store.requirePhoneNumber,
                                }}
                                settings={{}} // Defaults
                                user={null}
                                cart={null}
                                routeData={{
                                    pathname: `/store/${slug}/collection`,
                                    searchParams: Object.fromEntries(
                                        Object.entries(search).map(([k, v]) => [k, v || ''])
                                    ),
                                    params: {},
                                }}
                                pageData={{ facets: { facets: mappedFacets } }}
                            >
                                <FilterMenu />
                            </RuntimeContextProvider>
                        </aside>

                        {/* Product Grid */}
                        <div className="flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {productsResult.products.map((product) => {
                                    const firstVariant = product.variants?.[0];
                                    const price = firstVariant?.price || 0;
                                    const firstImage = product.images?.[0]?.url;
                                    return (
                                        <a
                                            key={product.id}
                                            href={`/store/${slug}/products/${product.id}`}
                                            className="group border rounded-lg overflow-hidden hover:shadow-lg transition-shadow block bg-card text-card-foreground"
                                        >
                                            <div className="aspect-square bg-muted relative overflow-hidden">
                                                {firstImage ? (
                                                    <img
                                                        src={firstImage}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                                                        No Image
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-medium group-hover:text-primary truncate">{product.name}</h3>
                                                <p className="font-bold mt-1">
                                                    {store.currency} {(price / 100).toFixed(2)}
                                                </p>
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                            {productsResult.products.length === 0 && (
                                <p className="text-muted-foreground text-center py-12">No products found.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <StorefrontPage
            store={{
                id: store.id,
                name: store.name,
                slug: store.slug,
                currency: store.currency || 'USD',
            }}
            layout={layout}
            page={page_}
            pageData={{
                collection: {
                    products: productsResult.products.map((p) => {
                        // ... map products (kept same as logic is inside map, preventing large diff)
                        // Actually I can't keep "..." I must replace the whole object or be careful
                        // Since I don't want to replace large block, I will target the end of pageData
                        const firstVariant = p.variants?.[0];
                        return {
                            id: p.id,
                            name: p.name,
                            description: p.description || undefined,
                            images: p.images?.map((img) => ({
                                url: img.url,
                                alt: img.alt || p.name,
                                position: img.position,
                            })) || [],
                            variants: p.variants?.map((v) => ({
                                id: v.id,
                                sku: v.sku,
                                price: v.price,
                                stock: v.stock,
                                customData: v.customData as Record<string, unknown> | undefined,
                                images: v.images?.map((img) => ({
                                    url: img.url,
                                    alt: img.alt || '',
                                    position: img.position,
                                })) || [],
                                isActive: v.isActive,
                            })) || [],
                            customData: p.customData as Record<string, unknown> | undefined,
                            productSchemaId: p.productSchemaId || undefined,
                            categoryId: p.categoryId || undefined,
                        };
                    }),
                    total: productsResult.total,
                    page,
                    pageSize: limit,
                    totalPages: Math.ceil(productsResult.total / limit),
                },
                facets: mappedFacets,
            }}
        />
    );
}
