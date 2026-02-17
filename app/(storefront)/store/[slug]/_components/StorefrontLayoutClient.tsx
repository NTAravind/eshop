'use client';

/**
 * Client-side wrapper for the storefront layout
 * Handles theme CSS injection, registry initialization, and runtime context
 */

import React, { useEffect, useMemo } from 'react';
import { initializeRegistry } from '@/modules/storefront/registry/init';
import { generateThemeCssString } from '@/modules/storefront/theme';

interface StorefrontLayoutClientProps {
    children: React.ReactNode;
    store: {
        id: string;
        name: string;
        slug: string;
        currency: string;
    };
    themeVars: Record<string, string>;
}

export function StorefrontLayoutClient({
    children,
    store,
    themeVars,
}: StorefrontLayoutClientProps) {
    // Initialize component registry
    useEffect(() => {
        initializeRegistry();
    }, []);

    // Build scoped CSS custom properties string
    const cssVarsStyle = useMemo(() => {
        // Scope to .storefront-container instead of :root
        return generateThemeCssString(themeVars, '.storefront-container');
    }, [themeVars]);

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: cssVarsStyle }} />
            <div
                className="storefront-container min-h-screen bg-background text-foreground"
                data-store-id={store.id}
            >
                {children}
            </div>
        </>
    );
}
