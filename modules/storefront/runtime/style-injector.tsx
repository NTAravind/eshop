'use client';

import { useEffect, useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { StyleObject, ResponsiveStyleOverrides, SafeCSSProperties } from '@/types/storefront-builder';

/**
 * Convert camelCase CSS properties to kebab-case CSS string
 */
function camelToKebab(str: string): string {
    return str.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function cssPropsToString(props: CSSProperties | Record<string, string>): string {
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
 * 
 * Supports both V1 StyleObject and V2 ResponsiveStyleOverrides
 */
export function useDynamicStyles(
    nodeId: string, 
    v1Styles?: StyleObject,
    v2Overrides?: ResponsiveStyleOverrides
): string {
    const className = `s-${nodeId}`;

    const cssRules = useMemo(() => {
        let css = '';

        // Check if we have V2 overrides (prefer V2)
        if (v2Overrides) {
            if (v2Overrides.hover && Object.keys(v2Overrides.hover).length > 0) {
                css += `.${className}:hover { ${cssPropsToString(v2Overrides.hover)} } `;
            }
            if (v2Overrides.focus && Object.keys(v2Overrides.focus).length > 0) {
                css += `.${className}:focus { ${cssPropsToString(v2Overrides.focus)} } `;
            }
            if (v2Overrides.active && Object.keys(v2Overrides.active).length > 0) {
                css += `.${className}:active { ${cssPropsToString(v2Overrides.active)} } `;
            }
        }
        
        // Fall back to V1 styles if no V2 overrides for states
        if ((!v2Overrides || (!v2Overrides.hover && !v2Overrides.focus && !v2Overrides.active)) && v1Styles) {
            if (v1Styles.hover && Object.keys(v1Styles.hover).length > 0) {
                css += `.${className}:hover { ${cssPropsToString(v1Styles.hover)} } `;
            }
            if (v1Styles.focus && Object.keys(v1Styles.focus).length > 0) {
                css += `.${className}:focus { ${cssPropsToString(v1Styles.focus)} } `;
            }
            if (v1Styles.active && Object.keys(v1Styles.active).length > 0) {
                css += `.${className}:active { ${cssPropsToString(v1Styles.active)} } `;
            }
        }

        return css;
    }, [v1Styles, v2Overrides, className]);

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
            const tag = document.getElementById(styleId);
            if (tag) {
                tag.remove();
            }
        };
    }, [cssRules, className]);

    return className;
}
