'use client';

/**
 * Runtime context provider for the storefront
 *
 * V2: Internally composes individual providers from ./providers
 * but exposes the same useRuntimeContext() API for backward compatibility.
 *
 * Components can optionally import individual hooks from ./providers
 * for fine-grained subscriptions (e.g. useCart, useStore, useUIState).
 */

import React, { createContext, useContext, useMemo } from 'react';
import type {
    RuntimeContext,
    UIState,
    StoreContext,
    SettingsContext,
    UserContext,
    CartContext,
    DesignTokenMap,
} from '@/types/storefront-builder';
import { useActionDispatcher, type UseActionDispatcherOptions } from '../actions';
import {
    StoreProvider,
    CartProvider,
    UserProvider,
    RouteProvider,
    UIStateProvider,
    PageDataProvider,
    ThemeProvider,
    useStore,
    useCart,
    useUser,
    useRoute,
    useUIState,
    usePageData,
    type RouteData,
    type PageData,
} from './providers';

// ==================== LEGACY CONTEXT (backward compat) ====================

interface RuntimeContextValue {
    context: RuntimeContext;
    dispatch: ReturnType<typeof useActionDispatcher>['dispatch'];
    createHandler: ReturnType<typeof useActionDispatcher>['createHandler'];
    dispatchPipeline: ReturnType<typeof useActionDispatcher>['dispatchPipeline'];
    setUIState: <K extends keyof UIState>(key: K, value: UIState[K]) => void;
    refreshCart: () => void;
}

const RuntimeContextContext = createContext<RuntimeContextValue | null>(null);

// ==================== PROVIDER PROPS ====================

export interface RuntimeContextProviderProps {
    children: React.ReactNode;
    store: StoreContext;
    settings: SettingsContext;
    user: UserContext | null;
    cart: CartContext | null;
    routeData: RouteData;
    pageData?: PageData;
    theme?: DesignTokenMap | null;
    onCartRefresh?: () => Promise<void>;
}

// ==================== INNER BRIDGE ====================
// Reads from individual providers and assembles the legacy RuntimeContext

function RuntimeContextBridge({
    children,
    onCartRefresh,
}: {
    children: React.ReactNode;
    onCartRefresh?: () => Promise<void>;
}) {
    const { store, settings } = useStore();
    const { cart, refreshCart } = useCart();
    const { user } = useUser();
    const { route } = useRoute();
    const { uiState, setUIState } = useUIState();
    const { pageData } = usePageData();

    // Build the full runtime context (backward compat)
    const context = useMemo<RuntimeContext>(
        () => ({
            store,
            settings,
            user,
            cart,
            route: {
                pathname: route.pathname,
                searchParams: route.searchParams,
                params: route.params,
            },
            uiState,
            ...pageData,
            selectedVariant: pageData.product?.variants.find((v) => v.id === uiState.selectedVariantId),
        }),
        [store, settings, user, cart, route, uiState, pageData]
    );

    // Action dispatcher
    const dispatcherOptions: UseActionDispatcherOptions = useMemo(
        () => ({
            storeId: store.id,
            cartId: cart?.id,
            userId: user?.id,
            onUIStateChange: (key: string, value: unknown) => {
                setUIState(key as keyof UIState, value as UIState[keyof UIState]);
            },
            onCartUpdate: refreshCart,
        }),
        [store.id, cart?.id, user?.id, refreshCart, setUIState]
    );

    const { dispatch, createHandler, dispatchPipeline } = useActionDispatcher(dispatcherOptions);

    const value = useMemo<RuntimeContextValue>(
        () => ({
            context,
            dispatch,
            createHandler,
            dispatchPipeline,
            setUIState,
            refreshCart,
        }),
        [context, dispatch, createHandler, dispatchPipeline, setUIState, refreshCart]
    );

    return (
        <RuntimeContextContext.Provider value={value}>{children}</RuntimeContextContext.Provider>
    );
}

// ==================== PUBLIC PROVIDER ====================

export function RuntimeContextProvider({
    children,
    store,
    settings,
    user,
    cart: initialCart,
    routeData,
    pageData = {},
    theme = null,
    onCartRefresh,
}: RuntimeContextProviderProps) {
    return (
        <StoreProvider store={store} settings={settings}>
            <UserProvider user={user}>
                <CartProvider initialCart={initialCart} onRefresh={onCartRefresh}>
                    <RouteProvider route={routeData}>
                        <UIStateProvider
                            initialState={{
                                selectedVariantId: pageData?.product?.variants[0]?.id,
                            }}
                        >
                            <PageDataProvider pageData={pageData}>
                                <ThemeProvider theme={theme}>
                                    <RuntimeContextBridge onCartRefresh={onCartRefresh}>
                                        {children}
                                    </RuntimeContextBridge>
                                </ThemeProvider>
                            </PageDataProvider>
                        </UIStateProvider>
                    </RouteProvider>
                </CartProvider>
            </UserProvider>
        </StoreProvider>
    );
}

// ==================== PUBLIC HOOKS ====================

/**
 * Hook to access the full runtime context (backward compatible).
 * For fine-grained subscriptions, use individual hooks from ./providers instead:
 *   useStore, useCart, useUser, useRoute, useUIState, usePageData, useTheme
 */
export function useRuntimeContext() {
    const value = useContext(RuntimeContextContext);
    if (!value) {
        throw new Error('useRuntimeContext must be used within RuntimeContextProvider');
    }
    return value;
}

// Re-export individual hooks for granular access
export { useStore, useCart, useUser, useRoute, useUIState, usePageData, useTheme } from './providers';
