'use client';

import { useEffect, useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { StyleObject } from '@/types/storefront-builder';

/**
 * Convert camelCase CSS properties to kebab-case CSS string
 */
function camelToKebab(str: string): string {
    return str.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function cssPropsToString(props: CSSProperties): string {
    return Object.entries(props)
        .filter(([_, value]) => value !== undefined && value !== '')
        .map(([key, value]) => {
            // Handle numeric values that need 'px' (simplified check)
            const isNumeric = typeof value === 'number';
            const needsPx = isNumeric && !['opacity', 'zIndex', 'fontWeight', 'lineHeight', 'flex', 'flexGrow', 'flexShrink', 'order'].includes(key);
            const finalValue = needsPx ? `${value}px` : value;
            return `${camelToKebab(key)}:${finalValue}`;
        })
        .join(';');
}

/**
 * Hook to inject dynamic styles for pseudo-states (hover, focus, active)
 * Returns a unique class name to apply to the element
 */
export function useDynamicStyles(nodeId: string, styles?: StyleObject): string {
    const className = `s-${nodeId}`;

    const cssRules = useMemo(() => {
        if (!styles) return '';

        let css = '';

        if (styles.hover && Object.keys(styles.hover).length > 0) {
            css += `.${className}:hover { ${cssPropsToString(styles.hover)} } `;
        }
        if (styles.focus && Object.keys(styles.focus).length > 0) {
            css += `.${className}:focus { ${cssPropsToString(styles.focus)} } `;
        }
        if (styles.active && Object.keys(styles.active).length > 0) {
            css += `.${className}:active { ${cssPropsToString(styles.active)} } `;
        }

        return css;
    }, [styles, className]);

    useEffect(() => {
        if (!cssRules) return;

        // Check if style tag already exists
        const styleId = `style-${className}`;
        let styleTag = document.getElementById(styleId) as HTMLStyleElement;

        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = styleId;
            document.head.appendChild(styleTag);
        }

        // Update content if changed
        if (styleTag.textContent !== cssRules) {
            styleTag.textContent = cssRules;
        }

        // Cleanup on unmount
        return () => {
            // Optional: don't remove immediately to avoid flickering / re-layout thrashing
            // or if we want to persist styles for re-mounting.
            // For now, let's keep it simple and clean up.
            const tag = document.getElementById(styleId);
            if (tag) {
                tag.remove();
            }
        };
    }, [cssRules, className]);

    return className;
}
