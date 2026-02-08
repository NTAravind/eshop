'use client';

/**
 * Client-side wrapper for the storefront layout
 * Handles theme CSS injection, registry initialization, and runtime context
 */

import React, { useEffect, useMemo } from 'react';
import { initializeRegistry } from '@/lib/storefront/registry/init';

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

    // Build CSS custom properties string
    const cssVarsStyle = useMemo(() => {
        const cssLines: string[] = [];

        Object.entries(themeVars).forEach(([key, value]) => {
            if (!value) return;

            // Convert camelCase to kebab-case
            const cssKey = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
            const varName = `--${cssKey}`;

            // Handle color values provided as HSL components (common in shadcn/ui defaults)
            // Regex checks for format like "222.2 47.4% 11.2%" or "0 0% 100%"
            const isHslComponents = /^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/.test(value);

            let cssValue = value;
            if (isHslComponents) {
                cssValue = `hsl(${value})`;
            }

            cssLines.push(`${varName}: ${cssValue};`);
        });

        return `:root { ${cssLines.join(' ')} }`;
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
