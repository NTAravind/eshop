'use client';

/**
 * Client component for rendering storefront pages
 * Wraps the RuntimeContext and Renderer
 */

import React, { useCallback, useState } from 'react';
import type {
    StorefrontNode,
    StoreContext,
    SettingsContext,
    UserContext,
    CartContext,
    ProductContext,
    CollectionContext,
    FacetsContext,
    VariantContext,
    OrdersContext,
    OrderContext,
} from '@/types/storefront-builder';
import { RuntimeContextProvider } from '@/lib/storefront/runtime/context';
import { RendererWithLayout } from '@/lib/storefront/runtime/renderer';
import { initializeRegistry } from '@/lib/storefront/registry/init';
import { usePathname, useSearchParams } from 'next/navigation';

import { getCartAction } from '@/app/actions/cart';

// Initialize registry on client-side
if (typeof window !== 'undefined') {
    initializeRegistry();
}

interface StorefrontPageProps {
    store: {
        id: string;
        name: string;
        slug: string;
        currency: string;
        requirePhoneNumber?: boolean;
        logoUrl?: string;
    };
    layout?: StorefrontNode;
    page: StorefrontNode;
    settings?: SettingsContext;
    user?: UserContext | null;
    cart?: CartContext | null;
    pageData?: {
        collection?: Partial<CollectionContext>;
        facets?: FacetsContext['facets'];
        product?: ProductContext;
        selectedVariant?: Partial<VariantContext>;
        similarProducts?: ProductContext[];
        orders?: OrdersContext;
        order?: OrderContext;
    };
}

export function StorefrontPage({
    store,
    layout,
    page,
    settings = { deliveryModes: ['DELIVERY', 'PICKUP'], checkoutFields: {}, profileFields: {} },
    user = null,
    cart = null,
    pageData = {},
}: StorefrontPageProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [cartState, setCartState] = useState<CartContext | null>(cart);

    // Convert search params to record
    const searchParamsRecord: Record<string, string | string[]> = {};
    searchParams.forEach((value, key) => {
        if (searchParamsRecord[key]) {
            const existing = searchParamsRecord[key];
            searchParamsRecord[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
        } else {
            searchParamsRecord[key] = value;
        }
    });

    // Extract route params from pathname
    const pathParts = pathname.split('/').filter(Boolean);
    const routeParams: Record<string, string> = {};
    // e.g., /store/mystore/products/123 -> { productId: '123' }
    if (pathParts[2] === 'products' && pathParts[3]) {
        routeParams.productId = pathParts[3];
    }
    if (pathParts[2] === 'collection' && pathParts[3]) {
        routeParams.collectionId = pathParts[3];
    }

    // ... (existing imports)

    const handleCartRefresh = useCallback(async () => {
        try {
            const updatedCart = await getCartAction(store.id);
            if (updatedCart) {
                setCartState(updatedCart);
            }
        } catch (error) {
            console.error('Failed to refresh cart:', error);
        }
    }, [store.id]);

    // Create properly typed store context with defaults
    const storeContext = {
        ...store,
        requirePhoneNumber: store.requirePhoneNumber ?? false,
    };

    return (
        <RuntimeContextProvider
            store={storeContext}
            settings={settings}
            user={user}
            cart={cartState}
            routeData={{
                pathname,
                searchParams: searchParamsRecord,
                params: routeParams,
            }}
            pageData={pageData as Partial<Pick<import('@/types/storefront-builder').RuntimeContext, 'collection' | 'facets' | 'product' | 'selectedVariant' | 'similarProducts' | 'orders'>>}
            onCartRefresh={handleCartRefresh}
        >
            <RendererWithLayout layout={layout} page={page} />
        </RuntimeContextProvider>
    );
}
