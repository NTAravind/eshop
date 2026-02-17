import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getStoreBySlug } from '@/services/store.service';
import { getPublishedDocument, getPublishedTheme, getSettings, getPublishedPrefabs } from '@/services/storefront.service';
import { StorefrontDocKind } from '@/app/generated/prisma';
import type { StorefrontNode, ThemeVars } from '@/types/storefront-builder';
import { StorefrontPage } from '../_components/StorefrontPage';
import * as productService from '@/services/product.service';
import { RuntimeContextProvider } from '@/modules/storefront/runtime/context';
import { Renderer } from '@/modules/storefront/runtime/renderer';
import { FilterMenu } from '@/modules/storefront/registry/filters';
import { listActiveSchemas, type SchemaField } from '@/services/schema.service';

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
    const categoryId = Array.isArray(search.category) ? search.category[0] : (search.category as string | undefined);
    const searchQuery = Array.isArray(search.q) ? search.q[0] : (search.q as string | undefined);
    const productSchemaId = Array.isArray(search.schemaId) ? search.schemaId[0] : (search.schemaId as string | undefined);

    // Extract facet filters
    const reservedParams = ['page', 'limit', 'q', 'category', 'schemaId'];
    const facetFilters: Record<string, string[]> = {};

    Object.entries(search).forEach(([key, value]) => {
        if (!reservedParams.includes(key) && value) {
            facetFilters[key] = Array.isArray(value) ? value : [value];
        }
    });

    // Get products for the collection (using skip/take)
    const [productsResult, availableFacets, activeSchemas] = await Promise.all([
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
        listActiveSchemas(store.id),
    ]);

    const dbFacets = availableFacets
        .filter((facet) => !productSchemaId || facet.productSchemaId === productSchemaId)
        .map((facet) => ({
            id: facet.id,
            code: facet.code,
            name: facet.name,
            values: facet.values.map((value) => ({
                id: value.id,
                value: value.value,
                label: undefined
                // count: 0 // TODO: Implement counts
            })),
            productSchemaId: facet.productSchemaId || undefined,
        }));

    const schemaFacets = activeSchemas.flatMap((schema) => {
        if (productSchemaId && schema.id !== productSchemaId) return [];
        const fields = (schema.fields || []) as unknown as SchemaField[];
        return fields
            .filter((field) => field.isFilterable)
            .map((field) => ({
                id: `${schema.id}:${field.name}`,
                code: field.name,
                name: field.label || field.name,
                values: (() => {
                    const rawOptions = Array.isArray(field.options)
                        ? field.options
                        : (field.type === 'boolean' ? ['true', 'false'] : []);

                    return rawOptions.map((option) => ({
                        id: `${schema.id}:${field.name}:${option}`,
                        value: String(option),
                        label: field.type === 'boolean'
                            ? (option === 'true' ? 'Yes' : 'No')
                            : undefined,
                    }));
                })(),
                productSchemaId: schema.id,
            }));
    });

    const dbFacetCodes = new Set(dbFacets.map((facet) => facet.code));
    const mergedFacets = dbFacets.map((facet) => {
        const schemaFacet = schemaFacets.find((schemaFacet) => schemaFacet.code === facet.code);
        const values = facet.values.length > 0 ? facet.values : (schemaFacet?.values || []);
        return { ...facet, values };
    });

    const fallbackSchemaFacets = schemaFacets.filter((facet) => !dbFacetCodes.has(facet.code) && facet.values.length > 0);

    const schemaPickerFacet = activeSchemas.length > 1
        ? {
            id: 'facet_schemaId',
            code: 'schemaId',
            name: 'Product Type',
            values: activeSchemas.map((schema) => ({
                id: `schemaId:${schema.id}`,
                value: schema.id,
                label: schema.name,
            })),
        }
        : null;

    const combinedFacets = schemaPickerFacet
        ? [schemaPickerFacet, ...mergedFacets, ...fallbackSchemaFacets]
        : [...mergedFacets, ...fallbackSchemaFacets];

    // Map facets to context structure
    const mappedFacets = combinedFacets.map((facet) => ({
        id: facet.id,
        code: facet.code,
        name: facet.name,
        values: facet.values.map((value) => ({
            id: value.id,
            value: value.value,
            label: value.label,
        })),
    }));

    // Get published documents and theme
    const [layoutDoc, pageDoc, themeDoc, settingsMap, prefabs] = await Promise.all([
        getPublishedDocument(store.id, StorefrontDocKind.LAYOUT, 'GLOBAL_LAYOUT'),
        getPublishedDocument(store.id, StorefrontDocKind.PAGE, 'COLLECTION'),
        getPublishedTheme(store.id),
        getSettings(store.id),
        getPublishedPrefabs(store.id),
    ]);

    const layout = layoutDoc?.tree as unknown as StorefrontNode | undefined;
    const page_ = pageDoc?.tree as unknown as StorefrontNode;
    const theme = themeDoc?.vars as unknown as ThemeVars | undefined;


    // ...

    // Fallback UI if no published page
    if (!page_) {
        const fallbackGridNode: StorefrontNode = {
            id: 'collection_fallback_grid',
            type: 'ProductGrid',
            props: { columns: 3 },
            bindings: {
                products: 'collection.products',
            },
        };

        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold mb-8">Shop All Products</h1>

                    <RuntimeContextProvider
                        store={{
                            id: store.id,
                            name: store.name,
                            slug: store.slug,
                            currency: store.currency || 'USD',
                            requirePhoneNumber: store.requirePhoneNumber,
                        }}
                        settings={settingsMap || { deliveryModes: ['DELIVERY', 'PICKUP'], checkoutFields: {}, profileFields: {} }}
                        user={null}
                        cart={null}
                        routeData={{
                            pathname: `/store/${slug}/collection`,
                            searchParams: Object.fromEntries(
                                Object.entries(search).map(([k, v]) => [k, v || ''])
                            ),
                            params: {},
                        }}
                        pageData={{
                            collection: {
                                products: productsResult.products.map((p) => {
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
                                        image: p.images?.[0]?.url || firstVariant?.images?.[0]?.url,
                                    };
                                }),
                                total: productsResult.total,
                                page,
                                pageSize: limit,
                                totalPages: Math.ceil(productsResult.total / limit),
                            },
                            facets: { facets: mappedFacets },
                            prefabs,
                        }}
                    >
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Sidebar */}
                            <aside className="w-full lg:w-64 flex-shrink-0">
                                <FilterMenu />
                            </aside>

                            {/* Product Grid */}
                            <div className="flex-1">
                                <Renderer tree={fallbackGridNode} />
                                {productsResult.products.length === 0 && (
                                    <p className="text-muted-foreground text-center py-12">No products found.</p>
                                )}
                            </div>
                        </div>
                    </RuntimeContextProvider>
                </div>
            </div>
        );
    }

    return (
        <Suspense fallback={null}>
            <StorefrontPage
                store={{
                    id: store.id,
                    name: store.name,
                    slug: store.slug,
                    currency: store.currency || 'USD',
                }}
                layout={layout}
                page={page_}
                theme={theme}
                settings={settingsMap || undefined}
                pageData={{
                    collection: {
                        products: productsResult.products.map((p) => {
                            // ... map products (kept same as logic is inside map, preventing large diff)
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
                                image: p.images?.[0]?.url || firstVariant?.images?.[0]?.url,
                            };
                        }),
                        total: productsResult.total,
                        page,
                        pageSize: limit,
                        totalPages: Math.ceil(productsResult.total / limit),
                    },
                    facets: { facets: mappedFacets },
                    prefabs,
                }}
            />
        </Suspense>
    );
}
