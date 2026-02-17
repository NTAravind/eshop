'use client';

/**
 * V2 Individual Providers — Provider-based RuntimeContext
 *
 * Each data domain (store, cart, user, route, uiState, pageData, theme)
 * gets its own React Context + Provider. These are composed together
 * by the RuntimeContextProvider for backward compatibility.
 *
 * Components can import individual hooks for fine-grained subscriptions
 * instead of re-rendering on every context change.
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type {
    StoreContext,
    SettingsContext,
    UserContext,
    CartContext,
    UIState,
    DesignTokenMap,
    PrefabDefinition,
} from '@/types/storefront-builder';

// ==================== STORE PROVIDER ====================

const StoreCtx = createContext<{ store: StoreContext; settings: SettingsContext } | null>(null);

export function StoreProvider({
    store,
    settings,
    children,
}: {
    store: StoreContext;
    settings: SettingsContext;
    children: React.ReactNode;
}) {
    const value = useMemo(() => ({ store, settings }), [store, settings]);
    return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
    const ctx = useContext(StoreCtx);
    if (!ctx) throw new Error('useStore must be used within StoreProvider');
    return ctx;
}

// ==================== CART PROVIDER ====================

interface CartContextValue {
    cart: CartContext | null;
    refreshCart: () => Promise<void>;
}

const CartCtx = createContext<CartContextValue | null>(null);

export function CartProvider({
    initialCart,
    onRefresh,
    children,
}: {
    initialCart: CartContext | null;
    onRefresh?: () => Promise<void>;
    children: React.ReactNode;
}) {
    const [cart, setCart] = useState<CartContext | null>(initialCart);

    useEffect(() => {
        setCart(initialCart);
    }, [initialCart]);

    const refreshCart = useCallback(async () => {
        if (onRefresh) await onRefresh();
    }, [onRefresh]);

    const value = useMemo(() => ({ cart, refreshCart }), [cart, refreshCart]);
    return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
    const ctx = useContext(CartCtx);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
}

// ==================== USER PROVIDER ====================

const UserCtx = createContext<{ user: UserContext | null } | null>(null);

export function UserProvider({
    user,
    children,
}: {
    user: UserContext | null;
    children: React.ReactNode;
}) {
    const value = useMemo(() => ({ user }), [user]);
    return <UserCtx.Provider value={value}>{children}</UserCtx.Provider>;
}

export function useUser() {
    const ctx = useContext(UserCtx);
    if (!ctx) throw new Error('useUser must be used within UserProvider');
    return ctx;
}

// ==================== ROUTE PROVIDER ====================

export interface RouteData {
    pathname: string;
    searchParams: Record<string, string | string[]>;
    params: Record<string, string>;
}

const RouteCtx = createContext<{ route: RouteData } | null>(null);

export function RouteProvider({
    route,
    children,
}: {
    route: RouteData;
    children: React.ReactNode;
}) {
    const value = useMemo(() => ({ route }), [route]);
    return <RouteCtx.Provider value={value}>{children}</RouteCtx.Provider>;
}

export function useRoute() {
    const ctx = useContext(RouteCtx);
    if (!ctx) throw new Error('useRoute must be used within RouteProvider');
    return ctx;
}

// ==================== UI STATE PROVIDER ====================

interface UIStateContextValue {
    uiState: UIState;
    setUIState: <K extends keyof UIState>(key: K, value: UIState[K]) => void;
}

const UIStateCtx = createContext<UIStateContextValue | null>(null);

export function UIStateProvider({
    initialState,
    children,
}: {
    initialState?: Partial<UIState>;
    children: React.ReactNode;
}) {
    const [uiState, setUIStateInternal] = useState<UIState>({
        ...initialState,
    });

    const setUIState = useCallback(<K extends keyof UIState>(key: K, value: UIState[K]) => {
        setUIStateInternal((prev) => ({ ...prev, [key]: value }));
    }, []);

    const contextValue = useMemo(() => ({ uiState, setUIState }), [uiState, setUIState]);
    return <UIStateCtx.Provider value={contextValue}>{children}</UIStateCtx.Provider>;
}

export function useUIState() {
    const ctx = useContext(UIStateCtx);
    if (!ctx) throw new Error('useUIState must be used within UIStateProvider');
    return ctx;
}

// ==================== PAGE DATA PROVIDER ====================

import type { RuntimeContext } from '@/types/storefront-builder';

export type PageData = Partial<
    Pick<
        RuntimeContext,
        'collection' | 'facets' | 'product' | 'selectedVariant' | 'similarProducts' | 'orders' | 'prefabs'
    >
>;

const PageDataCtx = createContext<{ pageData: PageData } | null>(null);

export function PageDataProvider({
    pageData,
    children,
}: {
    pageData: PageData;
    children: React.ReactNode;
}) {
    const value = useMemo(() => ({ pageData }), [pageData]);
    return <PageDataCtx.Provider value={value}>{children}</PageDataCtx.Provider>;
}

export function usePageData() {
    const ctx = useContext(PageDataCtx);
    if (!ctx) throw new Error('usePageData must be used within PageDataProvider');
    return ctx;
}

// ==================== THEME PROVIDER ====================

const ThemeCtx = createContext<{ theme: DesignTokenMap | null } | null>(null);

export function ThemeProvider({
    theme,
    children,
}: {
    theme: DesignTokenMap | null;
    children: React.ReactNode;
}) {
    const value = useMemo(() => ({ theme }), [theme]);
    return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
    const ctx = useContext(ThemeCtx);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}
