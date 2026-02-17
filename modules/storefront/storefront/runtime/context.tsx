'use client';

/**
 * Runtime context provider for the storefront
 * Provides all data needed for component rendering and action execution
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type {
    RuntimeContext,
    UIState,
    StoreContext,
    SettingsContext,
    UserContext,
    CartContext,
} from '@/types/storefront-builder';
import { useActionDispatcher, type UseActionDispatcherOptions } from '../actions';

// Runtime context value
interface RuntimeContextValue {
    context: RuntimeContext;
    dispatch: ReturnType<typeof useActionDispatcher>['dispatch'];
    createHandler: ReturnType<typeof useActionDispatcher>['createHandler'];
    setUIState: <K extends keyof UIState>(key: K, value: UIState[K]) => void;
    refreshCart: () => void;
}

const RuntimeContextContext = createContext<RuntimeContextValue | null>(null);

export interface RuntimeContextProviderProps {
    children: React.ReactNode;
    store: StoreContext;
    settings: SettingsContext;
    user: UserContext | null;
    cart: CartContext | null;
    routeData: {
        pathname: string;
        searchParams: Record<string, string | string[]>;
        params: Record<string, string>;
    };
    pageData?: Partial<
        Pick<
            RuntimeContext,
            'collection' | 'facets' | 'product' | 'selectedVariant' | 'similarProducts' | 'orders'
        >
    >;
    onCartRefresh?: () => Promise<void>;
}

export function RuntimeContextProvider({
    children,
    store,
    settings,
    user,
    cart: initialCart,
    routeData,
    pageData = {},
    onCartRefresh,
}: RuntimeContextProviderProps) {
    const [cart, setCart] = useState<CartContext | null>(initialCart);
    const [uiState, setUIStateInternal] = useState<UIState>({
        selectedVariantId: pageData.product?.variants[0]?.id,
    });

    // UI state setter
    const setUIState = useCallback(<K extends keyof UIState>(key: K, value: UIState[K]) => {
        setUIStateInternal((prev) => ({ ...prev, [key]: value }));
    }, []);

    // Cart refresh
    const refreshCart = useCallback(async () => {
        if (onCartRefresh) {
            await onCartRefresh();
        }
    }, [onCartRefresh]);

    // Build the full runtime context
    const context = useMemo<RuntimeContext>(
        () => ({
            store,
            settings,
            user,
            cart,
            route: {
                pathname: routeData.pathname,
                searchParams: routeData.searchParams,
                params: routeData.params,
            },
            uiState,
            ...pageData,
            selectedVariant: pageData.product?.variants.find((v) => v.id === uiState.selectedVariantId),
        }),
        [store, settings, user, cart, routeData, uiState, pageData]
    );

    // Action dispatcher options
    const dispatcherOptions: UseActionDispatcherOptions = useMemo(
        () => ({
            storeId: store.id,
            cartId: cart?.id,
            userId: user?.id,
            onUIStateChange: (key, value) => {
                setUIStateInternal((prev) => ({ ...prev, [key]: value }));
            },
            onCartUpdate: refreshCart,
        }),
        [store.id, cart?.id, user?.id, refreshCart]
    );

    const { dispatch, createHandler } = useActionDispatcher(dispatcherOptions);

    const value = useMemo<RuntimeContextValue>(
        () => ({
            context,
            dispatch,
            createHandler,
            setUIState,
            refreshCart,
        }),
        [context, dispatch, createHandler, setUIState, refreshCart]
    );

    return (
        <RuntimeContextContext.Provider value={value}>{children}</RuntimeContextContext.Provider>
    );
}

/**
 * Hook to access the runtime context
 */
export function useRuntimeContext() {
    const value = useContext(RuntimeContextContext);
    if (!value) {
        throw new Error('useRuntimeContext must be used within RuntimeContextProvider');
    }
    return value;
}
